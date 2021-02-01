const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const { google } = require("googleapis");
const { OAuth2 } = google.auth;
const fs = require("fs");

const moment = require("moment");

function childNames(Appointments) {
  var nameList = Appointments.map((appointment) => {
    return appointment.Child.Name;
  });

  nameList = Array.from(new Set(nameList));

  var childNames = "";

  if (nameList.length <= 2) {
    childNames = nameList.join(" and ");
  } else {
    childNames = "your " + nameList.length + " children";
  }
  return childNames;
}

function emailBody(schedule) {
  const emailSubject =
    "Reminder for your tomorrow's study appointment with " +
    childNames(schedule.Appointments);

  var opening = "";

  if (schedule.Appointments[0].Study.StudyType !== "Online") {
    opening =
      "<p>Dear " +
      schedule.Family.NamePrimary.split(" ")[0] +
      ",</p>" +
      "<p>This is a reminder for your visit to " +
      schedule.Appointments[0].Study.Lab.LabName +
      " with <b>" +
      childNames(schedule.Appointments) +
      moment(schedule.AppointmentTime).format(" [tomorrow at] h:mma") +
      "</b>.</p>" +
      "<p>" +
      schedule.Appointments[0].Study.Lab.TransportationInstructions +
      "</p>";
  } else {
    opening =
      "<p>Dear " +
      schedule.Family.NamePrimary.split(" ")[0] +
      ",</p>" +
      "<p>This is " +
      schedule.Appointments[0].Study.Lab.LabName +
      ". Just a reminder that you and " +
      childNames(schedule.Appointments) +
      "will participate our online study " +
      moment(schedule.AppointmentTime).format(" [tomorrow at] h:mma") +
      "</b>.</p>";
  }

  var body = schedule.Appointments[0].Study.ReminderTemplate.replace(
    /\${{ZoomLink}}/g,
    "<a href='" + schedule.Appointments[0].PrimaryExperimenter[0].ZoomLink
      ? schedule.Appointments[0].PrimaryExperimenter[0].ZoomLink
      : schedule.Appointments[0].Study.Lab.ZoomLink + "'>Zoom Link</a>"
  );

  body = body.replace(/\${{childName}}/g, childNames(schedule.Appointments));

  if (schedule.Appointments[0].Study.StudyType === "Online") {
    body =
      body +
      "<p>You can download Zoom for your computer here: <a href='https://zoom.us/download'>Download Link</a></p>" +
      "<p><a href='https://mcmasteru365-my.sharepoint.com/:p:/g/personal/xiaon8_mcmaster_ca/EdhORdZeCwlPn-X54WquFz8Boegr1YpaNy9mzlW_wJ8ZjQ?e=hvDNGr'>CLICK HERE</a> to learn a few tips to setup online study with your child.</p>";
  }

  // closing
  const closing =
    "<p>" +
    schedule.Appointments[0].Study.Lab.EmailClosing +
    "</p>" +
    "<p>Best,<br>" +
    schedule.Personnel.Name +
    "<br>" +
    schedule.Personnel.Role +
    "<br>" +
    schedule.Appointments[0].Study.Lab.LabName +
    "</p>";

  const emailBody = opening + body + closing;

  const emailContent = {
    from:
      schedule.Appointments[0].Study.Lab.LabName +
      "<" +
      schedule.Appointments[0].Study.Lab.Email +
      ">",
    // cc: "lab email <nx@kangleelab.com>",
    to: schedule.Family.NamePrimary + "<" + schedule.Family.Email + ">",
    // to:
    //     schedule.Family.NamePrimary +
    //     "<" +
    //     schedule.Appointments[0].Study.Lab.Email +
    //     ">",
    subject: emailSubject,
    body: emailBody,
  };

  return emailContent;
}

function manualReminderBody(schedule) {
  const emailSubject =
    "Remind " +
    schedule.Family.NamePrimary.split(" ")[0] +
    " of their participation tomorrow.";

  const emailBody =
    "<p>" +
    schedule.Appointments[0].Study.Lab.LabName +
    ",</p>" +
    "<p>" +
    schedule.Family.NamePrimary.split(" ")[0] +
    " and their child(ren), " +
    childNames(schedule.Appointments) +
    " are coming for a study tomorrow, " +
    moment(schedule.AppointmentTime).format(
      " [on] dddd [(]MMM Do[)] [at] h:mma"
    ) +
    "<br>";

  "However, there is no email in the system to remind them over email. Please give them a call ASAP.</p>" +
    "<p>Thank you!<br>" +
    "Developmental Research Management System</p>";

  const emailContent = {
    to:
      schedule.Appointments[0].Study.Lab.LabName +
      "<" +
      schedule.Appointments[0].Study.Lab.Email +
      ">",
    // to: schedule.Family.NamePrimary +
    // "<" +
    // schedule.Family.NamePrimary.Email +
    // ">",
    subject: emailSubject,
    body: emailBody,
  };

  return emailContent;
}

function makeBody(to, from, cc, subject, body) {
  var message = [
    'Content-Type: text/html; charset="UTF-8"\n',
    "MIME-Version: 1.0\n",
    "Content-Transfer-Encoding: 7bit\n",
    "to: ",
    to,
    "\n",
    "from: ",
    from,
    "\n",
    "cc: ",
    cc,
    "\n",
    "subject: ",
    subject,
    "\n\n",
    body,
  ].join("");

  var encodedMail = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return encodedMail;
}

async function sendEmail(oAuth2Client, emailContent) {
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  var raw = makeBody(
    emailContent.to,
    emailContent.from,
    emailContent.cc,
    emailContent.subject,
    emailContent.body
  );

  try {
    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: raw,
      },
    });

    return result;
  } catch (error) {
    return error;
  }
}

// Retrieve today's appointments from the database.
exports.reminderEmail = asyncHandler(async () => {
  const logFolder = "api/logs";
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder);
  }

  var startDate = moment();
  switch (moment().weekday()) {
    default:
      startDate = moment()
        .startOf("day")
        .add(1, "days");
      break;
  }

  var queryString = {};

  queryString.AppointmentTime = {
    [Op.between]: [startDate.toDate(), startDate.add(1, "days").toDate()],
  };
  queryString.Reminded = 0;

  try {
    const schedules = await model.schedule.findAll({
      where: queryString,
      include: [
        {
          model: model.personnel,
        },
        {
          model: model.family,
        },
        {
          model: model.appointment,
          include: [
            {
              model: model.personnel,
            },
            {
              model: model.family,
            },
            {
              model: model.child,
              attributes: ["Name", "DoB", "Sex", "IdWithinFamily"],
            },
            {
              model: model.study,
              attributes: [
                "StudyName",
                "EmailTemplate",
                "ReminderTemplate",
                "StudyType",
                "FK_Lab",
              ],
              include: [{ model: model.lab }],
            },
            {
              model: model.personnel,
              as: "PrimaryExperimenter",
              through: { model: model.experimenterAssignment },
              attributes: ["id", "Name", "Email", "Calendar", "ZoomLink"],
            },
            {
              model: model.personnel,
              as: "SecondaryExperimenter",
              through: { model: model.experimenterAssignment_2nd },
              attributes: ["id", "Name", "Email", "Calendar", "ZoomLink"],
            },
          ],
        },
      ],
    });

    const credentialsPath = "api/google/general/credentials.json";
    const credentials = fs.readFileSync(credentialsPath);
    const { client_secret, client_id, redirect_uris } = JSON.parse(
      credentials
    ).installed;

    const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);

    schedules.forEach(async (schedule) => {
      const logFile =
        logFolder +
        "/" +
        schedule.Appointments[0].Study.Lab.LabName +
        "_log.txt";

      if (!!schedule.Family.Email) {
        const tokenPath =
          "api/google/labs/lab" +
          schedule.Appointments[0].Study.Lab.id +
          "/token.json";

        const token = fs.readFileSync(tokenPath);

        oAuth2Client.setCredentials(JSON.parse(token));

        const emailContent = emailBody(schedule);

        await sendEmail(oAuth2Client, emailContent);

        // update schedule
        await model.schedule.update(
          { Reminded: 1 },
          {
            where: { id: schedule.id },
          }
        );

        // log
        var logInfo =
          "[Auto reminder sent] Reminder email is sent to " +
          schedule.Family.Email +
          " at " +
          new Date().toString() +
          "\r\n";

        if (fs.existsSync(logFile)) {
          fs.appendFileSync(logFile, logInfo);
        } else {
          fs.writeFileSync(logFile, logInfo);
        }
      } else {
        const tokenPath = "api/google/labs/general/token.json";

        const token = fs.readFileSync(tokenPath);

        oAuth2Client.setCredentials(JSON.parse(token));

        const adminGmail = google.gmail({ version: "v1", auth: oAuth2Client });

        const adminSendAs = await adminGmail.users.settings.sendAs.list({
          userId: "me",
        });

        var sendAsEmail = {};

        adminSendAs.data.sendAs.forEach((email) => {
          if (email.isDefault) {
            sendAsEmail = email;
          }
        });

        var adminEmail = sendAsEmail.sendAsEmail;

        var emailContent = manualReminderBody(schedule);

        emailContent.from =
          "Developmental Research Management System" + "<" + adminEmail + ">";

        await sendEmail(oAuth2Client, emailContent);

        // log
        var logInfo =
          "[Manual reminder] An email about reminding participants for tomorrow's study is sent to " +
          schedule.Appointments[0].Study.Lab.Email +
          " at " +
          new Date().toString() +
          "\r\n";

        if (fs.existsSync(logFile)) {
          fs.appendFileSync(logFile, logInfo);
        } else {
          fs.writeFileSync(logFile, logInfo);
        }
      }
    });

    res.status(200).send();
  } catch (error) {
    throw error;
  }
});
