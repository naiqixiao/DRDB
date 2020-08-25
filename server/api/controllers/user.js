const model = require("../models/DRDB");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { google } = require("googleapis");

const fs = require("fs");
const { OAuth2 } = google.auth;

// function generalAuth() {
//   const credentialsPath = "api/google/general/credentials.json";
//   const tokenPath = "api/google/general/token.json";

//   const credentials = fs.readFileSync(credentialsPath);

//   const { client_secret, client_id, redirect_uris } = JSON.parse(
//     credentials
//   ).installed;

//   const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);

//   const token = fs.readFileSync(tokenPath);
//   oAuth2Client.setCredentials(JSON.parse(token));

//   return oAuth2Client;
// }

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

  const profile = await gmail.users.getProfile({ userId: "me" });

  emailContent.from = "Developmental Research Management System" + "<" + profile.data.emailAddress + ">";

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

exports.signup = asyncHandler(async (req, res) => {
  try {
    const password = Math.random()
      .toString(36)
      .substring(2);

    const hashPassword = bcrypt.hashSync(password, 10);

    var newUser = req.body;

    newUser.Password = hashPassword;
    newUser.temporaryPassword = true;

    const newPersonnel = await model.personnel.create(newUser);

    res.status(200).send(newPersonnel);
    console.log("User created!");

    try {
      var emailContent = {
        to: newUser.Name + "<" + newUser.Email + ">",
        subject:
          "Your user account has been created!",
        body:
          "<p>Hello " +
          newUser.Name.split(" ")[0] +
          ",</p> " +
          "<p>Welcoe to the developmental research management system!<br>" +
          "Your role is <b>" +
          newUser.Role +
          "</b>, and your temporary password is <b><em>" +
          password +
          "</em></b>. Please login with your email and temporary password at <a href='http://drdb.mcmaster.ca'>http://drdb.mcmaster.ca</a> to set your password (you need to turn on McMaster VPN).</p> " +
          "<p><a href='https://docs.google.com/document/d/1oaucm_FrpTxsO7UcOb-r-Y2Ck2zBe1G-BMvw_MD18N0/edit?usp=sharing'>A brief manual</a><br>" +
          "<a href='https://docs.google.com/presentation/d/1Q09bJj1h_86FVS9zOVIZlwpnh1sPtRrlZxolPZ12PlA/edit?usp=sharing'>How to set up a Google account to activate email and calendar functions.</a></p>" +
          "<p> </p>" +
          "<p>Thank you! <br>" +
          "Developmental Research Management System</p>",
      };

      // const oAuth2Client = generalAuth();

      await sendEmail(emailContent);
    } catch (error) {
      throw error;
    }
  } catch (error) {
    res.status(400).send({
      message: "The entered information (Initial, Email, or CalendarID) already exists in the system./n Please double check or enter new information.",
      error: error,
    });
  }
});

exports.login = asyncHandler(async (req, res) => {
  const { Email, Password } = req.body;
  const personnel = await model.personnel.findOne({
    where: {
      Email: Email,
    },
    include: [
      {
        model: model.lab,
        include: [{ model: model.study }],
      },
    ],
  });

  if (!personnel) {
    return res.status(401).send({
      error: "The login information was incorrect",
    });
  }

  const isPasswordValid = bcrypt.compareSync(Password, personnel.Password);

  if (!isPasswordValid) {
    return res.status(403).send({
      error: "The login information was incorrect",
    });
  }

  const token = jwt.sign(
    {
      email: personnel.Email,
      id: personnel.id,
    },
    process.env.JWT_KEY,
    {
      expiresIn: "2h",
    }
  );

  // log the login information.
  const logFolder = "api/logs";
  const logFile = logFolder + "/login.txt";
  const logInfo = "[Login] " + personnel.Name + " (" + personnel.Email + ") " + "logged in at " + new Date().toString()

  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder)
  }

  if (fs.existsSync(logFile)) {
    fs.appendFileSync(logFile, logInfo)
  } else {
    fs.writeFileSync(logFile, logInfo)
  }

  res.status(200).send({
    message: "Auth succsessful.",
    temporaryPassword: personnel.temporaryPassword,
    name: personnel.Name,
    user: personnel.Email,
    userID: personnel.id,
    role: personnel.Role,
    lab: personnel.FK_Lab,
    labName: personnel.Lab.LabName,
    labEmail: personnel.Lab.Email,
    token: token,
    studies: personnel.Lab.Studies,
  });
});

exports.loginChecked = asyncHandler(async (req, res) => {
  res.send("the user already logged in.");
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { Email, Password, newPassword } = req.body;
  const personnel = await model.personnel.findOne({
    where: {
      Email: Email,
    },
    include: [
      {
        model: model.lab,
        include: [{ model: model.study }],
      },
    ],
  });

  if (!personnel) {
    return res.status(401).send({
      error: "The login information was incorrect",
    });
  }

  const isPasswordValid = bcrypt.compareSync(Password, personnel.Password);

  if (!isPasswordValid) {
    return res.status(403).send({
      error: "The login information was incorrect",
    });
  }

  const hashNewPassword = bcrypt.hashSync(newPassword, 10);

  try {
    await model.personnel.update(
      { Password: hashNewPassword, temporaryPassword: false },
      {
        where: {
          Email: Email,
        },
      }
    );

    const personnel = await model.personnel.findOne({
      where: {
        Email: Email,
      },
      include: [
        {
          model: model.lab,
          include: [{ model: model.study }],
        },
      ],
    });

    const token = jwt.sign(
      {
        email: personnel.Email,
        id: personnel.id,
      },
      process.env.JWT_KEY,
      {
        expiresIn: "2h",
      }
    );

    res.status(200).send({
      message: "Password update succsessful!",
      temporaryPassword: personnel.temporaryPassword,
      name: personnel.Name,
      user: personnel.Email,
      userID: personnel.id,
      role: personnel.Role,
      lab: personnel.FK_Lab,
      labName: personnel.Lab.LabName,
      labEmail: personnel.Lab.Email,
      token: token,
      studies: personnel.Lab.Studies,
    });


    var emailContent = {
      to: personnel.Name + "<" + personnel.Email + ">",
      subject:
        "Your login password is updated.",
      body:
        "<p>Hello " +
        personnel.Name.split(" ")[0] +
        ",</p> " +
        "<p>Your login password has recently been changed. <br>" +
        "If you didn't change your password, please contact your lab manager as soon as possible.</p> " +
        "<p> </p>" +
        "<p>Thank you!<br>" +
        "Developmental Research Management System</p>",
    };

    // const oAuth2Client = generalAuth();

    await sendEmail(emailContent);

  } catch (error) {
    throw error;
  }
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const password = Math.random()
    .toString(36)
    .substring(2);

  const hashPassword = bcrypt.hashSync(password, 10);

  try {
    const { Email } = req.body;
    const personnel = await model.personnel.findOne({
      where: {
        Email: Email,
      },
    });

    if (!personnel) {
      return res.status(401).send({
        error: "The login information was incorrect",
      });
    }

    await model.personnel.update(
      { Password: hashPassword, temporaryPassword: true },
      {
        where: {
          Email: Email,
        },
      }
    );

    res.status(200).send({
      message: "Password reset!",
    });

    try {
      var emailContent = {
        to: personnel.Name + "<" + personnel.Email + ">",
        subject: "Your password is reset",
        body:
          "<p>Hello " +
          personnel.Name.split(" ")[0] +
          ",</p> " +
          "<p>You login password is reset, and the temporary passwor is: <b>" +
          password +
          "</b></p> <p>Please login to change your password.<br> " +
          "<p><a href='https://docs.google.com/document/d/1oaucm_FrpTxsO7UcOb-r-Y2Ck2zBe1G-BMvw_MD18N0/edit?usp=sharing'>A brief manual</a><br>" +
          "<a href='https://docs.google.com/presentation/d/1Q09bJj1h_86FVS9zOVIZlwpnh1sPtRrlZxolPZ12PlA/edit?usp=sharing'>How to set up a Google account to activate email and calendar functions.</a></p>" +
          "<p> </p>" +
          "<p>Thank you! <br>" +
          "Developmental Research Management System</p>",
      };

      // const oAuth2Client = generalAuth();

      await sendEmail(emailContent);
    } catch (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
});
