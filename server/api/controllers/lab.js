const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const fs = require("fs");
const log = require("../controllers/log");

const bcrypt = require("bcrypt");

const { google } = require("googleapis");
const { OAuth2 } = google.auth;

const config = require("../../config/general");

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

async function sendEmail(emailContent) {
  const credentialsPath = "api/google/general/credentials.json";
  const tokenPath = "api/google/general/token.json";

  const credentials = fs.readFileSync(credentialsPath);

  const { client_secret, client_id, redirect_uris } = JSON.parse(
    credentials
  ).installed;

  const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);

  const token = fs.readFileSync(tokenPath);
  oAuth2Client.setCredentials(JSON.parse(token));

  // const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  // const profile = await gmail.users.getProfile({ userId: "me" });

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

  emailContent.from = "Developmental Research Management System" + "<" + adminEmail + ">";

  var raw = makeBody(
    emailContent.to,
    emailContent.from,
    emailContent.cc,
    emailContent.subject,
    emailContent.body
  );

  try {
    await adminGmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: raw,
      },
    });

  } catch (error) {
    return error;
  }
}

// Create and Save a new lab
exports.create = asyncHandler(async (req, res) => {
  var newLabInfo = req.body;
  try {

    newLabInfo.EmailOpening = "Email opening (currently not in use).";
    newLabInfo.EmailClosing = "Please feel free to let us know if you wish to change the time for your study. You can either send us an email.";
    newLabInfo.Location = "Psychology Building, McMaster University (used in calendar events)";
    newLabInfo.TransportationInstructions = "Our lab is located at Psychology Building, McMaster University. There are 3 parking lots in front of the building that you can park when you come. We will wait for you at the parking lot.";

    newLabInfo.Personnels.forEach((personnel) => {
      var password = Math.random()
        .toString(36)
        .substring(2);

      var hashPassword = bcrypt.hashSync(password, 10);

      personnel.unencryptedPassword = password;
      personnel.Password = hashPassword;
      personnel.temporaryPassword = true;
    });

    const lab = await model.lab.create(newLabInfo, {
      include: [model.personnel],
    });

    // create a sample study
    const sampleStudy =
    {
      StudyName: "Sample study for " + lab.LabName,
      MinAge: "8.00",
      MaxAge: "24.00",
      Description: "Study description should be a short summary of a study. So RAs can read it to parents during recruitment.",
      EmailTemplate:
        "<p><strong style='background- color: rgb(254, 254, 254); '>${{childName}}&nbsp;</strong><span style='background - color: rgb(254, 254, 254); '>will be sitting on your lap and watch a short clip of videos on a screen in front of ${{him/her}}. To understand the development of neural system, ${{childName}} will be wearing a recording cap while watching the videos. We will use a camera to monitor ${{his/her}} attention status, which will help us determine the quality of recorded neural signals. The study will last for about 10 minutes.</span></p>",
      ReminderTemplate: "<p>Please enter a template for reminder email sent to parents for their upcoming study.</p>",
      Completed: false,
      StudyType: "Behavioural",
      ASDParticipant: "Include",
      PrematureParticipant: "Include",
      HearingLossParticipant: "Include",
      VisionLossParticipant: "Include",
      IllParticipant: "Include",
      FK_Personnel: lab.Personnels[0].id,
      FK_Lab: lab.id
    };

    await model.study.create(sampleStudy);

    // Send email to the associated personnel
    const emailContent = {
      to: newLabInfo.Personnels[0].Name + "<" + newLabInfo.Personnels[0].Email + ">",
      subject:
        "Your user account has been created!",
      body:
        "<p>Hello " +
        newLabInfo.Personnels[0].Name.split(" ")[0] +
        ",</p> " +
        "<p>Welcome to the developmental research management system!</p>" +
        "<p>Your role is <b>" +
        newLabInfo.Personnels[0].Role +
        "</b>, and your temporary password is <b><em>" +
        newLabInfo.Personnels[0].unencryptedPassword +
        "</em></b>. Please login with your email and temporary password at <a href=" + config.URL + ">" + config.URL + "</a> to set your password" + config.otherRequirement + ".<br><b>If you're the lab manager, please update your lab email template in the Settings page.</p> " +
        "<p><a href='https://docs.google.com/document/d/1oaucm_FrpTxsO7UcOb-r-Y2Ck2zBe1G-BMvw_MD18N0/edit?usp=sharing'>A brief manual</a></p>" +

        "<p><a href='https://docs.google.com/presentation/d/1Q09bJj1h_86FVS9zOVIZlwpnh1sPtRrlZxolPZ12PlA/edit?usp=sharing'>How to set up a Google account to activate email and calendar functions.</a></p>" +

        "<p>Thank you!<br>" +
        "Developmental Research Management System</p>",
    };

    await sendEmail(emailContent);

    // create lab folder
    const labFolderPath = "api/google/labs/lab" + lab.id;

    if (!fs.existsSync("api/google/labs")) {
      fs.mkdirSync("api/google/labs");
    }

    if (!fs.existsSync(labFolderPath)) {
      fs.mkdirSync(labFolderPath);
    }

    // Log
    const User = req.body.User;

    await log.createLog("Lab Created", User, "created a lab (" +
      newLabInfo.LabName + ")");

    res.status(200).send('a new lab is created.');
  } catch (error) {
    throw error;
  }
});

// Retrieve all lab from the database.
exports.search = asyncHandler(async (req, res) => {
  var queryString = {};
  if (req.query.id) {
    queryString.id = req.query.id;
  }
  if (req.query.LabName) {
    queryString.LabName = { [Op.like]: `${req.query.LabName}%` };
  }
  if (req.query.PI) {
    queryString.PI = { [Op.like]: `${req.query.PI}%` };
  }

  const lab = await model.lab.findAll({
    where: queryString,
    include: [model.study, model.personnel],
  });

  res.status(200).send(lab);
  console.log("Search successful!");
});

// Update a Lab by the id in the request
exports.update = asyncHandler(async (req, res) => {
  var updatedLabInfo = req.body;

  const lab = await model.lab.update(updatedLabInfo, {
    where: { id: updatedLabInfo.lab },
  });

  // Log
  const User = req.body.User;

  await log.createLog("Lab Updated", User, "updated lab information (" +
    updatedLabInfo.LabName + ")");

  res.status(200).send(lab);
  console.log("Lab Information Updated!");
});

// Delete a Lab with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  // delete a folder to store credentials
  const labFolderPath = "api/google/labs/lab" + req.query.lab;

  if (!fs.existsSync(labFolderPath)) {
    // fs.unlinkSync(labFolderPath + "/credentials.json");
    fs.unlinkSync(labFolderPath + "/token.json");
    fs.rmdirSync(labFolderPath);
  }

  const lab = await model.lab.destroy({
    where: { id: req.query.id },
  });

  // Log
  const User = JSON.parse(req.query.User);

  await log.createLog("Lab Deleted", User, "deleted lab (" +
    req.query.id + ") from the database");

  res.status(200).json(lab);
  console.log("Lab removal succeeds.");
});
