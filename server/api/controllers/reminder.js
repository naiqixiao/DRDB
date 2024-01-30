const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const { google } = require("googleapis");
const { OAuth2 } = google.auth;
const fs = require("fs");
const log = require("../controllers/log");

const moment = require("moment");

function childNames(Appointments) {
  var nameList = Appointments.map((appointment) => {
    if (!!appointment.Child.Name) {
      return appointment.Child.Name.split(" ")[0];
    }
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
    "Reminder for your study appointment with " +
    childNames(schedule.Appointments);

  if (!schedule.Family.NamePrimary) {
    schedule.Family.NamePrimary = "";
  }

  var opening = "";

  var parentName = "Caregiver";
  if (!!schedule.Family.NamePrimary) {
    parentName = schedule.Family.NamePrimary.split(" ")[0];
  }

  if (schedule.Appointments[0].Study.StudyType !== "Online") {
    opening =
      "<p>Dear " +
      parentName +
      ",</p>" +
      "<p>Hope you are doing great! This is a reminder for your visit to " +
      schedule.Appointments[0].Study.Lab.LabName +
      " with <b>" +
      childNames(schedule.Appointments) +
      moment(schedule.AppointmentTime).format(" [tomorrow at] h:mma") +
      "</b>.</p>" +
      schedule.Appointments[0].Study.Lab.TransportationInstructions;
  } else {
    opening =
      "<p>Dear " +
      parentName +
      ",</p>" +
      "<p>Hope you are doing great! This is " +
      schedule.Appointments[0].Study.Lab.LabName +
      ". Just a reminder that you and " +
      childNames(schedule.Appointments) +
      " will participate in our online study " +
      moment(schedule.AppointmentTime).format(" [tomorrow at] h:mma") +
      "</b>.</p>";
  }

  var ZoomLink = "Zoom Link not available.";

  if ("ZoomLink" in schedule.Appointments[0].Study.Lab) {
    if (schedule.Appointments[0].Study.Lab.ZoomLink) {
      ZoomLink =
        "<a href='" +
        schedule.Appointments[0].Study.Lab.ZoomLink +
        "'>Zoom Link</a>";
    }
  }

  if (schedule.Appointments[0].PrimaryExperimenter.length > 0) {
    if (schedule.Appointments[0].PrimaryExperimenter[0].ZoomLink) {
      ZoomLink =
        "<a href='" +
        schedule.Appointments[0].PrimaryExperimenter[0].ZoomLink +
        "'>Zoom Link</a>";
    }
  }

  var body = schedule.Appointments[0].Study.ReminderTemplate.replace(
    /\${{ZoomLink}}/g,
    ZoomLink
  );

  body = body.replace(/\${{childName}}/g, childNames(schedule.Appointments));

  if (schedule.Appointments[0].Study.StudyType === "Online") {
    body =
      body +
      "<p>If this study use Zoom for online study, you can download Zoom for your computer here: <a href='https://zoom.us/download'>Download Link</a></p>" +
      "<p><a href='https://mcmasteru365-my.sharepoint.com/:p:/g/personal/xiaon8_mcmaster_ca/EdhORdZeCwlPn-X54WquFz8Boegr1YpaNy9mzlW_wJ8ZjQ?e=hvDNGr'>CLICK HERE</a> to learn a few tips to setup online study with your child.</p>";
  }

  // closing
  const closing =
    schedule.Appointments[0].Study.Lab.EmailClosing +
    "<p>Best,</p><p>" +
    schedule.Personnel.Name +
    "</p><p>" +
    schedule.Personnel.Role +
    "</p><p>" +
    schedule.Appointments[0].Study.Lab.LabName +
    "</p>";

  const emailBody = opening + body + closing;

  const emailContent = {
    from:
      schedule.Appointments[0].Study.Lab.LabName +
      "<" +
      schedule.Appointments[0].Study.Lab.Email +
      ">",
    to: schedule.Family.NamePrimary + "<" + schedule.Family.Email + ">",
    // bcc: experimenterEmails(schedule.Appointments),
    subject: emailSubject,
    body: formatedBody(emailBody),
  };

  return emailContent;
}

function experimenterEmails(Appointments) {
  var emails = [];

  Appointments.forEach((appointment) => {
    appointment.PrimaryExperimenter.forEach((experimenter) => {
      emails.push(experimenter.Name + " <" + experimenter.Email + ">");
    });

    appointment.SecondaryExperimenter.forEach((experimenter) => {
      emails.push(experimenter.Name + " <" + experimenter.Email + ">");
    });
  });

  return emails.join(", ");
}

function manualReminderBody(schedule) {
  if (!schedule.Family.NamePrimary) {
    schedule.Family.NamePrimary = "";
  }

  var parentName = "Caregiver";
  if (!!schedule.Family.NamePrimary) {
    parentName = schedule.Family.NamePrimary.split(" ")[0];
  }

  const emailSubject =
    "Remind " + parentName + " of their participation tomorrow.";

  const emailBody =
    "<p>" +
    schedule.Appointments[0].Study.Lab.LabName +
    ",</p>" +
    "<p>" +
    parentName +
    " and their child(ren), " +
    childNames(schedule.Appointments) +
    " are coming for a study tomorrow, " +
    moment(schedule.AppointmentTime).format(
      " [on] dddd [(]MMM Do[)] [at] h:mma"
    ) +
    "</p><p>";

  "However, there is no email in the system to remind them over email. Please give them a call ASAP.</p>" +
    "<p>Thank you!</p><p>" +
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
    body: formatedBody(emailBody),
  };

  return emailContent;
}

function makeBody(to, from, cc, bcc, subject, body) {
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
    "bcc: ",
    bcc,
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

async function sendEmail(oAuth2Client, emailContent, emailLabels) {
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  var raw = makeBody(
    emailContent.to,
    emailContent.from,
    emailContent.cc,
    emailContent.bcc,
    emailContent.subject,
    emailContent.body
  );

  try {
    if (!emailLabels) {
      const result = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: raw,
        },
      });

      return result;
    }

    const labelNames = emailLabels;

    const listLabelsResponse = await gmail.users.labels.list({
      userId: "me",
    });

    const labels = listLabelsResponse.data.labels;
    const labelIds = [];

    for (let i = 0; i < labelNames.length; i++) {
      const labelName = labelNames[i];
      const label = labels.find((l) => l.name === labelName);
      let labelId;

      if (label) {
        labelId = label.id;
      } else {
        const labelData = {
          userId: "me",
          resource: {
            name: labelName,
            labelListVisibility: "labelShow",
          },
        };

        const labelResponse = await gmail.users.labels.create(labelData);
        labelId = labelResponse.data.id;
      }

      labelIds.push(labelId);
    }

    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: raw,
        labelIds: labelIds,
      },
    });

    const messageId = result.data.id;

    const modifyRequest = {
      userId: "me",
      id: messageId,
      resource: {
        addLabelIds: labelIds,
      },
    };
    await gmail.users.messages.modify(modifyRequest);

    return result;
  } catch (error) {
    return error;
  }
}

function formatedBody(emailBody) {
  const k = emailBody.split("</p><p>");
  var formattedEmailBody = "";

  for (var i = 0; i < k.length; i++) {
    // formattedEmailBody = formattedEmailBody + k[i] + "<br>";

    if (i < k.length - 3) {
      formattedEmailBody = formattedEmailBody + k[i] + "<br><br>";
    } else {
      formattedEmailBody = formattedEmailBody + k[i] + "<br>";
    }
  }

  return formattedEmailBody;
}

function PhoneFormated(Phone) {
  if (Phone) {
    var cleaned = ("" + Phone).replace(/\D/g, "");
    var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return "(" + match[1] + ") " + match[2] + "-" + match[3];
    }
    return null;
  }
}

exports.autoCompletionReminder = asyncHandler(async (req, res) => {
  var queryString = {};
  // list of schedules, whose schedule time was between 2 days and 1 day before the current date. We will send reminder emails to researchers marking these schedules as completed or other status. Otherwise, they will be marked complete a day later.
  queryString.Status = "Confirmed";
  queryString.Completed = false;
  queryString.AppointmentTime = {
    [Op.between]: [
      moment()
        .subtract(1, "days")
        .startOf("day")
        .toDate(),
      moment()
        .startOf("day")
        .toDate(),
    ],
  };

  const TH =
    "style = 'background: olive; border: 1px solid #999; padding: 0.5rem; text-align: center; font-size: 18; color: white;'";
  const TRO =
    "<td style = 'background: white !important; border: 1px solid #999; padding: 0.5rem; text-align: center; '>";
  const TRE =
    "<td style = 'background: #e8e7e1 !important; border: 1px solid #999; padding: 0.5rem; text-align: center;'>";

  try {
    const schedules = await model.schedule.findAll({
      where: queryString,
      include: [
        {
          model: model.appointment,
          include: [
            {
              model: model.study,
              include: [
                { model: model.lab },
                {
                  model: model.personnel,
                  as: "Experimenters",
                  through: {
                    model: model.experimenter,
                  },
                },
              ],
            },
            {
              model: model.personnel,
              as: "PrimaryExperimenter",
              through: { model: model.experimenterAssignment },
              attributes: [
                "id",
                "Name",
                "Email",
                "Calendar",
                "ZoomLink",
                "Initial",
              ],
            },
          ],
        },
        {
          model: model.family,
          attributes: ["id", "NamePrimary", "Email"],
        },
        {
          model: model.personnel,
        },
      ],
    });

    var primaryExperimenters = schedules.map((schedule) => {
      return {
        id: schedule.Appointments[0].PrimaryExperimenter[0].id,
        Name: schedule.Appointments[0].PrimaryExperimenter[0].Name,
        Email: schedule.Appointments[0].PrimaryExperimenter[0].Email,
      };
    });

    primaryExperimenters = primaryExperimenters.filter(
      (experimenter, index, self) =>
        index ===
        self.findIndex(
          (e) =>
            e.id === experimenter.id &&
            e.Name === experimenter.Name &&
            e.Email === experimenter.Email
        )
    );

    // reorganize the schedules by primary experimenter
    const autoCompletionList = primaryExperimenters.map((experimenter) => {
      var reminderList = {
        experimenterName: experimenter.Name,
        experimenterEmail: experimenter.Email,
        scheduleList: [],
      };

      schedules.forEach((schedule) => {
        if (
          schedule.Appointments[0].PrimaryExperimenter[0].id === experimenter.id
        ) {
          const scheduleInfo = {
            id: schedule.id,
            Email: schedule.Family.Email,
            Name: schedule.Family.NamePrimary,
            StudyName: schedule.Appointments[0].Study.StudyName,
            AppointmentTime: schedule.AppointmentTime,
            LabName: schedule.Appointments[0].Study.Lab.LabName,
            LabEmail: schedule.Appointments[0].Study.Lab.Email,
            LabID: schedule.Appointments[0].Study.Lab.id,
          };

          reminderList.scheduleList.push(scheduleInfo);
        }
      });

      return reminderList;
    });

    // prepare email content for each experimenter
    autoCompletionList.forEach(async (reminder) => {
      var body = "<!DOCTYPE html><html><head>";
      body =
        body + "</head><body>Hi " + reminder.experimenterName + ",<br><br>";

      body =
        body +
        "<p><strong>According to the system, you were the primary experimenter for the following studies yesterday. How did it go?</strong></p><p>If any of the families below failed to show up or requested rescheduling, please update the appointment status accordingly. Otherwise, the system will mark the study as completed tomorrow, and the families will be available for other studies.</p>";

      body =
        body +
        '<table style="width:90%; border-collapse: collapse !important;">';
      body =
        body +
        "<tr><th width='15%'" +
        TH +
        ">Study time (EST)</th>" +
        "<th width='15%' " +
        TH +
        ">Study name</th>" +
        "<th width='18%' " +
        TH +
        ">Parent</th>" +
        "<th width='20%' " +
        TH +
        ">Email</th></tr>";

      reminder.scheduleList.forEach((schedule, index) => {
        var style = TRO;
        if (index % 2 == 1) {
          style = TRE;
        }

        body = body + "<tr>";
        body =
          body +
          style +
          moment(schedule.AppointmentTime).format("MMM Do [at] h:mma") +
          "</td>";
        body = body + style + schedule.StudyName + "</td>";
        body = body + style + schedule.Name + "</td>";
        body = body + style + schedule.Email + "</td>";
        body = body + "</tr>";
      });

      body = body + "</table><br><br>";
      body = body + "Thanks,<br>" + reminder.scheduleList[0].LabName;

      body = body + "</body></html>";

      const emailContent = {
        from:
          reminder.scheduleList[0].LabName +
          "<" +
          reminder.scheduleList[0].LabEmail +
          ">",
        to: reminder.experimenterName + "<" + reminder.experimenterEmail + ">",
        subject: "[DRDB] Study confirmation reminder",
        body: body,
      };

      // send email to each experimenter
      const tokenPath =
        "api/google/labs/lab" + reminder.scheduleList[0].LabID + "/token.json";

      const token = fs.readFileSync(tokenPath);

      const credentialsPath = "api/google/general/credentials.json";
      const credentials = fs.readFileSync(credentialsPath);
      const { client_secret, client_id, redirect_uris } = JSON.parse(
        credentials
      ).installed;

      const oAuth2Client = new OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
      );

      oAuth2Client.setCredentials(JSON.parse(token));

      await sendEmail(oAuth2Client, emailContent, ["Reminder-email"]);

      // log
      await log.createLog(
        "AutoCompletion reminder sent",
        {
          Name: "",
          Email: "",
          LabName: reminder.scheduleList[0].LabName,
        },
        "Reminder email (study completion) is sent to " +
          reminder.experimenterName
      );
    });

    // res.status(200).send({
    //   info: "reminder email sent!",
    //   autoCompletionList: autoCompletionList,
    //   schedules: schedules,
    //   primaryExperimenters: primaryExperimenters,
    // });
  } catch (error) {
    throw error;
  }
});

// //////////////////////////////////
exports.autoRejectionReminder = asyncHandler(async (req, res) => {
  var queryString = {};
  // Giving researcher 1 week to deal with tendative schedules. Then the auto rejection / completion function will run 1 week later (2 weeks after the last contact).
  queryString.Status = {
    [Op.in]: ["TBD", "Rescheduling", "No Show", "Cancelled"],
  };
  queryString.Completed = false;
  queryString.updatedAt = {
    [Op.between]: [
      moment()
        .subtract(7, "days")
        .startOf("day")
        .toDate(),
      moment()
        .subtract(6, "days")
        .startOf("day")
        .toDate(),
    ],
  };

  const TH =
    "style = 'background: tomato; border: 1px solid #999; padding: 0.5rem; text-align: center; font-size: 18;'";
  const TRO =
    "<td style = 'background: white !important; border: 1px solid #999; padding: 0.5rem; text-align: center; '>";
  const TRE =
    "<td style = 'background: #e8e7e1 !important; border: 1px solid #999; padding: 0.5rem; text-align: center;'>";

  try {
    const schedules = await model.schedule.findAll({
      where: queryString,
      include: [
        {
          model: model.appointment,
          include: [
            {
              model: model.study,
              include: [
                { model: model.lab },
                {
                  model: model.personnel,
                  as: "Experimenters",
                  through: {
                    model: model.experimenter,
                  },
                },
              ],
            },
            {
              model: model.personnel,
              as: "PrimaryExperimenter",
              through: { model: model.experimenterAssignment },
              attributes: [
                "id",
                "Name",
                "Email",
                "Calendar",
                "ZoomLink",
                "Initial",
              ],
            },
          ],
        },
        {
          model: model.family,
          attributes: ["id", "NamePrimary", "Email"],
        },
        {
          model: model.personnel,
        },
      ],
    });

    // ge the list of researchers who contacted the families.
    var contactResearchers = schedules.map((schedule) => {
      return {
        id: schedule.Personnel.id,
        Name: schedule.Personnel.Name,
        Email: schedule.Personnel.Email,
      };
    });

    contactResearchers = contactResearchers.filter(
      (experimenter, index, self) =>
        index ===
        self.findIndex(
          (e) =>
            e.id === experimenter.id &&
            e.Name === experimenter.Name &&
            e.Email === experimenter.Email
        )
    );

    // reorganize the schedules by the contact researcher
    const autoRejectionList = contactResearchers.map((researcher) => {
      var reminderList = {
        researcherName: researcher.Name,
        researcherEmail: researcher.Email,
        scheduleList: [],
      };

      schedules.forEach((schedule) => {
        if (schedule.Personnel.id === researcher.id) {
          const scheduleInfo = {
            id: schedule.id,
            Email: schedule.Family.Email,
            Name: schedule.Family.NamePrimary,
            AppointmentTime: schedule.AppointmentTime,
            Status: schedule.Status,
            StudyName: schedule.Appointments[0].Study.StudyName,
            LabName: schedule.Appointments[0].Study.Lab.LabName,
            LabEmail: schedule.Appointments[0].Study.Lab.Email,
            LabID: schedule.Appointments[0].Study.Lab.id,
            updatedAt: schedule.updatedAt,
          };

          reminderList.scheduleList.push(scheduleInfo);
        }
      });

      return reminderList;
    });

    // prepare email content for each experimenter
    autoRejectionList.forEach(async (reminder) => {
      var body = "<!DOCTYPE html><html><head>";
      body = body + "</head><body>Hi " + reminder.researcherName + ",<br><br>";

      body =
        body +
        "<p><strong>You attempted to schedule the following appointments a week ago, but the families have not responded yet. Would you like to follow up with them again? If not, the system will mark these schedules as rejected a week from today, and the families will be available for other studies.</strong></p>";

      body =
        body +
        '<table style="width:90%; border-collapse: collapse !important;">';
      body =
        body +
        "<tr><th width='15%'" +
        TH +
        ">Study name</th>" +
        "<th width='18%' " +
        TH +
        ">Parent</th>" +
        "<th width='15%' " +
        TH +
        ">Email</th>" +
        "<th width='10%' " +
        TH +
        ">Status</th>" +
        "<th width='15%' " +
        TH +
        ">Last contact</th></tr>";

      reminder.scheduleList.forEach((schedule, index) => {
        var style = TRO;
        if (index % 2 == 1) {
          style = TRE;
        }

        body = body + "<tr>";
        body = body + style + schedule.StudyName + "</td>";
        body = body + style + schedule.Name + "</td>";
        body = body + style + schedule.Email + "</td>";
        body = body + style + schedule.Status + "</td>";
        body =
          body +
          style +
          moment(schedule.updatedAt).format("MMM Do [at] h:mma") +
          "</td>";
        body = body + "</tr>";
      });

      body = body + "</table><br><br>";
      body = body + "Thanks,<br>" + reminder.scheduleList[0].LabName;

      body = body + "</body></html>";

      const emailContent = {
        from:
          reminder.scheduleList[0].LabName +
          "<" +
          reminder.scheduleList[0].LabEmail +
          ">",
        to: reminder.researcherName + "<" + reminder.researcherEmail + ">",
        subject: "[DRDB] Study follow-up reminder",
        body: body,
      };

      // send email to each experimenter
      const tokenPath =
        "api/google/labs/lab" + reminder.scheduleList[0].LabID + "/token.json";

      const token = fs.readFileSync(tokenPath);

      const credentialsPath = "api/google/general/credentials.json";
      const credentials = fs.readFileSync(credentialsPath);
      const { client_secret, client_id, redirect_uris } = JSON.parse(
        credentials
      ).installed;

      const oAuth2Client = new OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
      );

      oAuth2Client.setCredentials(JSON.parse(token));

      await sendEmail(oAuth2Client, emailContent, ["Reminder-email"]);

      // log
      await log.createLog(
        "AutoRejection reminder sent",
        {
          Name: "",
          Email: "",
          LabName: reminder.scheduleList[0].LabName,
        },
        "Reminder email (study rejection) is sent to " + reminder.researcherName
      );
    });

    if (res){
      res.status(200).send({
        info: "autoRejection reminder email sent!",
        autoRejectionList: autoRejectionList,
        schedules: schedules,
        contactResearchers: contactResearchers,
      });
    }
  } catch (error) {
    throw error;
  }
});

// reminder email for families
exports.reminderEmail = asyncHandler(async (req, res) => {
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
    [Op.between]: [
      moment()
        .startOf("day")
        .add(1, "days")
        .toDate(),
      moment()
        .startOf("day")
        .add(2, "days")
        .toDate(),
    ],
  };
  queryString.Reminded = 0;
  queryString.Status = "Confirmed";
  queryString["$Family.TrainingSet$"] = false;

  try {
    const schedules = await model.schedule.findAll({
      where: queryString,
      include: [
        {
          model: model.appointment,
          include: [
            {
              model: model.child,
              attributes: ["Name", "DoB", "Sex", "IdWithinFamily"],
            },
            {
              model: model.study,
              attributes: [
                "StudyName",
                "MinAge",
                "MaxAge",
                "EmailTemplate",
                "ReminderTemplate",
                "FollowUPEmailSnippet",
                "StudyType",
                "FK_Lab",
              ],
              include: [{ model: model.lab }],
            },
            {
              model: model.personnel,
              as: "PrimaryExperimenter",
              through: { model: model.experimenterAssignment },
              attributes: [
                "id",
                "Name",
                "Email",
                "Calendar",
                "ZoomLink",
                "Initial",
              ],
            },
            {
              model: model.personnel,
              as: "SecondaryExperimenter",
              through: { model: model.experimenterAssignment_2nd },
              attributes: [
                "id",
                "Name",
                "Email",
                "Calendar",
                "ZoomLink",
                "Initial",
              ],
            },
          ],
        },
        {
          model: model.family,
        },
        {
          model: model.personnel,
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
      const labels = ["Reminder-email"];

      for (const appointment of schedule.Appointments) {
        labels.push(appointment.Study.dataValues.StudyName);
      }

      if (!!schedule.Appointments[0].Study.ReminderTemplate) {
        if (!!schedule.Family.Email) {
          const tokenPath =
            "api/google/labs/lab" +
            schedule.Appointments[0].Study.Lab.id +
            "/token.json";

          const token = fs.readFileSync(tokenPath);

          oAuth2Client.setCredentials(JSON.parse(token));

          const emailContent = emailBody(schedule);

          await sendEmail(oAuth2Client, emailContent, labels);

          // update schedule
          await model.schedule.update(
            { Reminded: 1 },
            {
              where: { id: schedule.id },
            }
          );

          // log
          await log.createLog(
            "Auto reminder sent",
            {
              Name: "",
              Email: "",
              LabName: schedule.Appointments[0].Study.Lab.LabName,
            },
            "Reminder email is sent to " + schedule.Family.Email
          );
        } else {
          const tokenPath = "api/google/general/token.json";

          const token = fs.readFileSync(tokenPath);

          oAuth2Client.setCredentials(JSON.parse(token));

          const adminGmail = google.gmail({
            version: "v1",
            auth: oAuth2Client,
          });

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

          await sendEmail(oAuth2Client, emailContent, labels);

          // log
          await log.createLog(
            "Manual reminder",
            {
              Name: "",
              Email: "",
              LabName: schedule.Appointments[0].Study.Lab.LabName,
            },
            "An email about reminding participants for tomorrow's study is sent to " +
              schedule.Appointments[0].Study.Lab.Email
          );
        }
      }
    });

    // res.status(200).send('reminder email sent!');
  } catch (error) {
    throw error;
  }
});

// reminder email for experimenters
exports.reminderEmailforExperimenters = asyncHandler(async (req, res) => {
  try {
    const experimenters = await model.personnel.findAll({
      where: {
        [Op.or]: [
          {
            "$PrimaryExperimenterof.Schedule.AppointmentTime$": {
              [Op.between]: [
                moment()
                  .startOf("day")
                  .add(1, "days")
                  .toDate(),
                moment()
                  .startOf("day")
                  .add(2, "days")
                  .toDate(),
              ],
            },
          },
          {
            "$SecondaryExperimenterof.Schedule.AppointmentTime$": {
              [Op.between]: [
                moment()
                  .startOf("day")
                  .add(1, "days")
                  .toDate(),
                moment()
                  .startOf("day")
                  .add(2, "days")
                  .toDate(),
              ],
            },
          },
        ],
        [Op.or]: [
          { "$PrimaryExperimenterof.Schedule.Status$": "Confirmed" },
          { "$SecondaryExperimenterof.Schedule.Status$": "Confirmed" },
        ],
        [Op.or]: [
          { "$PrimaryExperimenterof.Child.Family.TrainingSet$": false },
          { "$SecondaryExperimenterof.Child.Family.TrainingSet$": false },
        ],
      },
      include: [
        model.lab,
        {
          model: model.appointment,
          as: "PrimaryExperimenterof",
          through: { model: model.experimenterAssignment },
          include: [
            {
              model: model.schedule,
              where: {
                AppointmentTime: {
                  [Op.between]: [
                    moment()
                      .startOf("day")
                      .add(1, "days")
                      .toDate(),
                    moment()
                      .startOf("day")
                      .add(2, "days")
                      .toDate(),
                  ],
                },
              },
            },
            {
              model: model.study,
            },
            {
              model: model.child,
              include: [
                {
                  model: model.family,
                  where: {
                    TrainingSet: false,
                  },
                },
              ],
            },
            {
              model: model.personnel,
              as: "SecondaryExperimenter",
              through: { model: model.experimenterAssignment_2nd },
              attributes: [
                "id",
                "Name",
                "Email",
                "Calendar",
                "ZoomLink",
                "Initial",
              ],
            },
          ],
        },
        {
          model: model.appointment,
          as: "SecondaryExperimenterof",
          through: { model: model.experimenterAssignment_2nd },
          include: [
            {
              model: model.schedule,
              where: {
                AppointmentTime: {
                  [Op.between]: [
                    moment()
                      .startOf("day")
                      .add(1, "days")
                      .toDate(),
                    moment()
                      .startOf("day")
                      .add(2, "days")
                      .toDate(),
                  ],
                },
              },
            },
            {
              model: model.study,
            },
            {
              model: model.child,
              include: [
                {
                  model: model.family,
                  where: {
                    TrainingSet: false,
                  },
                },
              ],
            },
            {
              model: model.personnel,
              as: "PrimaryExperimenter",
              through: { model: model.experimenterAssignment },
              attributes: [
                "id",
                "Name",
                "Email",
                "Calendar",
                "ZoomLink",
                "Initial",
              ],
            },
            {
              model: model.personnel,
              as: "SecondaryExperimenter",
              through: { model: model.experimenterAssignment_2nd },
              attributes: [
                "id",
                "Name",
                "Email",
                "Calendar",
                "ZoomLink",
                "Initial",
              ],
            },
          ],
        },
      ],
      order: [
        [
          {
            model: model.appointment,
            as: "PrimaryExperimenterof",
          },
          { model: model.schedule },
          "AppointmentTime",
          "ASC",
        ],
        [
          {
            model: model.appointment,
            as: "SecondaryExperimenterof",
          },
          { model: model.schedule },
          "AppointmentTime",
          "ASC",
        ],
      ],
    });

    var experimenterReminderContent = [];

    const credentialsPath = "api/google/general/credentials.json";
    const credentials = fs.readFileSync(credentialsPath);
    const { client_secret, client_id, redirect_uris } = JSON.parse(
      credentials
    ).installed;

    const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);

    const TH =
      "style = 'background: lightblue; border: 1px solid #999; padding: 0.5rem; text-align: center; font-size: 18;'";
    const TH2nd =
      "style = 'background: lightgreen; border: 1px solid #999; padding: 0.5rem; text-align: center; font-size: 18;'";
    const TRO =
      "<td style = 'background: white !important; border: 1px solid #999; padding: 0.5rem; text-align: center; '>";
    const TRE =
      "<td style = 'background: #e8e7e1 !important; border: 1px solid #999; padding: 0.5rem; text-align: center;'>";

    experimenters.forEach(async (experimenter) => {
      var body = "<!DOCTYPE html><html><head>";
      body = body + "</head><body>Hi ";

      if (
        experimenter.PrimaryExperimenterof.length +
          experimenter.SecondaryExperimenterof.length >
        1
      ) {
        body =
          body +
          experimenter.Name.split(" ")[0] +
          ",<br><br>The following are your studies tomorrow! Good luck! :)<br><br>";
      } else {
        body =
          body +
          experimenter.Name.split(" ")[0] +
          ",<br><br>The following is your study tomorrow! Good luck! :)<br><br>";
      }

      // table th, table td{
      //   text-align: center;
      //   }
      if (experimenter.PrimaryExperimenterof.length > 0) {
        body =
          body + "<h2>Studies that you are the primary experimenter: </h2>";

        // as Primary experimenter
        body =
          body +
          '<table style="width:90%; border-collapse: collapse !important;">';
        body =
          body +
          "<tr><th width='15%'" +
          TH +
          ">Study time (EST)</th>" +
          "<th width='15%' " +
          TH +
          ">Study name</th>" +
          "<th width='18%' " +
          TH +
          ">Parent</th>" +
          "<th width='7%' " +
          TH +
          ">Child</th>" +
          "<th width='20%' " +
          TH +
          ">Partner (E2)</th>" +
          "<th width='25%' " +
          TH +
          ">Zoom link</th></tr>";

        experimenter.PrimaryExperimenterof.forEach((appointmentPri, index) => {
          var E2 = appointmentPri.SecondaryExperimenter.map((e2) => {
            return e2.Name + " (" + e2.Email + ")";
          });

          var E22 = "";
          if (appointmentPri.SecondaryExperimenter.length > 0) {
            E22 = E2.join("<br>");
          } else {
            E22 = "not assigned";
          }

          if (!appointmentPri.Child.Family.NamePrimary) {
            appointmentPri.Child.Family.NamePrimary = "";
          }

          var parentName = "Parent Name N/A";
          if (!!appointmentPri.Child.Family.NamePrimary) {
            parentName = appointmentPri.Child.Family.NamePrimary.split(" ")[0];
          }

          const parent =
            parentName +
            "<br>" +
            PhoneFormated(appointmentPri.Child.Family.Phone) +
            "<br>" +
            appointmentPri.Child.Family.Email;

          const ZoomLink = experimenter.ZoomLink
            ? experimenter.ZoomLink
            : "not available";

          var style = TRO;
          if (index % 2 == 1) {
            style = TRE;
          }

          var childName = "Child name N/A";
          if (appointmentPri.Child.Name) {
            childName = appointmentPri.Child.Name.split(" ")[0];
          }

          body = body + "<tr>";
          body =
            body +
            style +
            moment(appointmentPri.Schedule.AppointmentTime).format(
              "MMM Do [at] h:mma"
            ) +
            "</td>";
          body = body + style + appointmentPri.Study.StudyName + "</td>";
          body = body + style + parent + "</td>";
          body = body + style + childName + "</td>";
          body = body + style + E22 + "</td>";
          body = body + style + ZoomLink + "</td>";
          body = body + "</tr>";
        });

        body = body + "</table>";
      }

      if (experimenter.SecondaryExperimenterof.length > 0) {
        body =
          body + "<h2>Studies that you are the secondary experimenter:</h2>";
        // as Secondary experimenter
        body =
          body +
          '<table style="width:90%; border-collapse: collapse !important;">';
        body =
          body +
          "<tr><th width='15%'" +
          TH2nd +
          ">Study time (EST)</th>" +
          "<th width='15%' " +
          TH2nd +
          ">Study name</th>" +
          "<th width='18%' " +
          TH2nd +
          ">Parent</th>" +
          "<th width='7%' " +
          TH2nd +
          ">Child</th>" +
          "<th width='20%' " +
          TH2nd +
          ">Partner(s)</th>" +
          "<th width='25%' " +
          TH2nd +
          ">Zoom link</th></tr>";

        experimenter.SecondaryExperimenterof.forEach(
          (appointmentSec, index) => {
            var E1 = appointmentSec.PrimaryExperimenter.map((e1) => {
              return e1.Name + " (" + e1.Email + ")";
            });

            var E2 = appointmentSec.SecondaryExperimenter.map((e2) => {
              if (e2.Email !== experimenter.Email) {
                return e2.Name + " (" + e2.Email + ")";
              }
            });

            var E22 = "";
            if (E2.length > 1) {
              E22 = E2.join("<br>");
              E22 = "E2: " + E22;
              E1[0] = "E1: " + E1[0] + "<br>" + E22;
            }

            if (!appointmentSec.Child.Family.NamePrimary) {
              appointmentSec.Child.Family.NamePrimary = "";
            }

            var parentName = "Parent Name N/A";
            if (!!appointmentSec.Child.Family.NamePrimary) {
              parentName = appointmentSec.Child.Family.NamePrimary.split(
                " "
              )[0];
            }

            const parent =
              parentName +
              "<br>" +
              PhoneFormated(appointmentSec.Child.Family.Phone) +
              "<br>" +
              appointmentSec.Child.Family.Email;

            const ZoomLink = appointmentSec.PrimaryExperimenter[0].ZoomLink
              ? appointmentSec.PrimaryExperimenter[0].ZoomLink
              : "not available";

            var style = TRO;
            if (index % 2 == 1) {
              style = TRE;
            }

            var childName = "Child name N/A";
            if (appointmentSec.Child.Name) {
              childName = appointmentSec.Child.Name.split(" ")[0];
            }

            body = body + "<tr>";
            body =
              body +
              style +
              moment(appointmentSec.Schedule.AppointmentTime).format(
                "MMM Do [at] h:mma"
              ) +
              "</td>";
            body = body + style + appointmentSec.Study.StudyName + "</td>";
            body = body + style + parent + "</td>";
            body = body + style + childName + "</td>";
            body = body + style + E1[0] + "</td>";
            body = body + style + ZoomLink + "</td>";
            body = body + "</tr>";
          }
        );
      }

      body = body + "</table><br><br>";
      body = body + "Best,<br>" + experimenter.Lab.LabName;
      body = body + "</body></html>";

      const emailContent = {
        from: experimenter.Lab.LabName + "<" + experimenter.Lab.Email + ">",
        to: experimenter.Name + "<" + experimenter.Email + ">",
        subject: "[DRDB] Reminder for upcoming studies",
        body: body,
      };

      experimenterReminderContent.push(emailContent);

      // send email
      const tokenPath =
        "api/google/labs/lab" + experimenter.Lab.id + "/token.json";

      const token = fs.readFileSync(tokenPath);

      oAuth2Client.setCredentials(JSON.parse(token));

      await sendEmail(oAuth2Client, emailContent, ["Reminder-email"]);

      // log
      await log.createLog(
        "Auto experimenterReminder sent",
        {
          Name: "",
          Email: "",
          LabName: experimenter.Lab.LabName,
        },
        "Reminder email (experimenter) is sent to " + experimenter.Name
      );
    });

    // res.status(200).send(experimenterReminderContent);
    // console.log("Reminder emails sent!");
  } catch (error) {
    throw error;
  }
});
