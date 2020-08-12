const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const fs = require("fs");

const bcrypt = require("bcrypt");

const { google } = require("googleapis");
const { OAuth2 } = google.auth;

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

  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  var raw = makeBody(
    emailContent.to,
    emailContent.from,
    emailContent.cc,
    emailContent.subject,
    emailContent.body
  );

  try {
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: raw,
      },
    });

    console.log("sent");
  } catch (error) {
    console.log(error);
    return error;
  }
}

// Create and Save a new lab
exports.create = asyncHandler(async (req, res) => {
  var newLabInfo = req.body;
  try {
    newLabInfo.Personnels.forEach((personnel) => {
      var password = Math.random()
        .toString(36)
        .substring(2);

      var hashPassword = bcrypt.hashSync(password, 10);

      personnel.unencryptedPassword = password;
      personnel.Password = hashPassword;
      personnel.temporaryPassword = true;
    });

    newLabInfo.Studies = [
      {
        StudyName: "Sample study for " + newLabInfo.LabName,
        MinAge: "8.00",
        MaxAge: "15.50",
        Description: "Study description....",
        EmailTemplate:
          "<p>Dear ${{nameMom}},</p><p>\nI am emailing you today to let you know that we currently have a new study going on that <strong>${{childName}} </strong>is eligible to participate in, so I have included a short summary of it below in case you are interested.</p>",
        Completed: false,
        StudyType: "Behavioural",
        PrematureParticipant: "Include",
        HearingLossParticipant: "Include",
        VisionLossParticipant: "Include",
        IllParticipant: "Include",
      },
    ];

    const lab = await model.lab.create(newLabInfo, {
      include: [model.study, model.personnel],
    });

    // Send email to the associated personnel

    var emailContent = {
      to: newLabInfo.Personnels[0].Email,
      subject:
        "Your user account has been created for Developmental Research System.",
      body:
        "<p>Hello " +
        newLabInfo.Personnels[0].Name.split(" ")[0] +
        ",</p> " +
        "<p>Welcoe to the developmental research management system!</p>" +
        "<p>Your role is <b>" +
        newLabInfo.Personnels[0].Role +
        "</b>, and your temporary password is <b><em>" +
        newLabInfo.Personnels[0].unencryptedPassword +
        "</em></b>. Please login with your email and temporary password at <a href='http://drdb.mcmaster.ca'>http://drdb.mcmaster.ca</a> to set your password.</p> " +
        "<p><a href='https://docs.google.com/document/d/1oaucm_FrpTxsO7UcOb-r-Y2Ck2zBe1G-BMvw_MD18N0/edit?usp=sharing'>A brief manual</a></p>" +
        "<p> </p>" +
        "<p>Thank you! </p>" +
        "<p>Lab manager</p>",
    };

    await sendEmail(emailContent);

    // create lab folder
    const labFolderPath = "api/google/labs/lab" + lab.id;
    // const credentialsPath = "api/google/general/credentials.json";

    if (!fs.existsSync("api/google/labs")) {
      fs.mkdirSync("api/google/labs");
    }

    if (!fs.existsSync(labFolderPath)) {
      fs.mkdirSync(labFolderPath);
      // fs.copyFileSync(credentialsPath, labFolderPath + "/credentials.json");
    }

    res.status(200).send("lab created!");
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
  var ID = req.query.id;
  var updatedLabInfo = req.body;

  if (updatedLabInfo.id) {
    delete updatedLabInfo["id"];
  }

  const lab = await model.lab.update(updatedLabInfo, {
    where: { id: ID },
    include: [model.study, model.personnel],
  });

  res.status(200).send(lab);
  console.log("lab Information Updated!");
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
    where: req.query,
  });

  res.status(200).json(lab);
  console.log("Lab removal succeeds.");
});
