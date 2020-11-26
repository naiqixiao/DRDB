const model = require("../models/DRDB");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { google } = require("googleapis");

const fs = require("fs");
const { OAuth2 } = google.auth;

const config = require("../../config/general");

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
    const result = await adminGmail.users.messages.send({
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
  const logFolder = "api/logs";
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder)
  }

  try {
    const password = Math.random()
      .toString(36)
      .substring(2);

    const hashPassword = bcrypt.hashSync(password, 10);

    var newUser = req.body;
    var User = req.body.User;

    newUser.Password = hashPassword;
    newUser.temporaryPassword = true;

    // check whether the user is in the system (previously being retired).
    const personnel = await model.personnel.findOne({
      where: {
        Email: req.body.Email,
      }
    });

    if (personnel && personnel.Retired === false) {
      res.status(400).send({
        message: "The entered information (Email or CalendarID) already exists in the system.\nPlease double check or enter new information.",
      });

    } else {

      if (!personnel) {

        const newPersonnel = await model.personnel.create(newUser);

        res.status(200).send(newPersonnel);

      } else {

        newUser.Retired = false
        await model.personnel.update(newUser, {
          where: {
            Email: req.body.Email,
          }
        });

        res.status(200).send(newUser);

      }

      var emailContent = {
        to: newUser.Name + "<" + newUser.Email + ">",
        subject:
          "Your user account has been created!",
        body:
          "<p>Hello " +
          newUser.Name.split(" ")[0] +
          ",</p> " +
          "<p>Welcome to the developmental research management system!<br>" +
          "Your role is <b>" +
          newUser.Role +
          "</b>, and your temporary password is <b><em>" +
          password +
          "</em></b>. Please login with your email and temporary password at <a href=" + config.URL + ">" + config.URL + "</a> to set your password (you need to turn on McMaster VPN).<br><b>If you're the lab manager, please update your lab email template in the Settings page.</p> " +
          "<p><a href='https://docs.google.com/document/d/1oaucm_FrpTxsO7UcOb-r-Y2Ck2zBe1G-BMvw_MD18N0/edit?usp=sharing'>A brief manual</a><br>" +
          "<a href='https://docs.google.com/presentation/d/1Q09bJj1h_86FVS9zOVIZlwpnh1sPtRrlZxolPZ12PlA/edit?usp=sharing'>How to set up a Google account to activate email and calendar functions.</a></p>" +
          "<p> </p>" +
          "<p>Thank you! <br>" +
          "Developmental Research Management System</p>",
      };

      await sendEmail(emailContent);

      // log
      const logFile = logFolder + "/" + User.LabName + "_log.txt";

      var logInfo = "[User Created] " + User.Name + " (" + User.Email + ") " + "created " + newUser.Email + " at " + new Date().toString() + " - " + User.IP + "\r\n"

      if (fs.existsSync(logFile)) {
        fs.appendFileSync(logFile, logInfo)
      } else {
        fs.writeFileSync(logFile, logInfo)
      }
    }
  } catch (error) {
    throw error;
  }
});

exports.signupBatch = asyncHandler(async (req, res) => {
  const logFolder = "api/logs";
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder)
  }

  const User = req.body.User;

  for (var i = 0; i < req.body.newUsers.length; i++) {

    newUser = req.body.newUsers[i];

    try {

      // check whether the user is in the system (previously being retired).
      const personnel = await model.personnel.findOne({
        where: {
          Email: newUser.Email,
        }
      });

      if (personnel && personnel.Retired === false) {
        res.status(400).send({
          message: "The entered information (Email or CalendarID) already exists in the system.\nPlease double check or enter new information.",
        });

      } else {

        const password = Math.random()
          .toString(36)
          .substring(2);

        const hashPassword = bcrypt.hashSync(password, 10);

        newUser.Password = hashPassword;
        newUser.temporaryPassword = true;

        if (!personnel) {

          newUser.FK_Lab = req.body.lab
          await model.personnel.create(newUser);

        } else {

          newUser.Retired = false
          await model.personnel.update(newUser, {
            where: {
              Email: newUser.Email,
            }
          });

        }

        var emailContent = {
          to: newUser.Name + "<" + newUser.Email + ">",
          subject:
            "Your user account has been created!",
          body:
            "<p>Hello " +
            newUser.Name.split(" ")[0] +
            ",</p> " +
            "<p>Welcome to the developmental research management system!<br>" +
            "Your role is <b>" +
            newUser.Role +
            "</b>, and your temporary password is <b><em>" +
            password +
            "</em></b>. Please login with your email and temporary password at <a href=" + config.URL + ">" + config.URL + "</a> to set your password (you need to turn on McMaster VPN).<br><b>If you're the lab manager, please update your lab email template in the Settings page.</p> " +
            "<p><a href='https://docs.google.com/document/d/1oaucm_FrpTxsO7UcOb-r-Y2Ck2zBe1G-BMvw_MD18N0/edit?usp=sharing'>A brief manual</a><br>" +
            "<a href='https://docs.google.com/presentation/d/1Q09bJj1h_86FVS9zOVIZlwpnh1sPtRrlZxolPZ12PlA/edit?usp=sharing'>How to set up a Google account to activate email and calendar functions.</a></p>" +
            "<p> </p>" +
            "<p>Thank you! <br>" +
            "Developmental Research Management System</p>",
        };

        await sendEmail(emailContent);

        // log
        const logFile = logFolder + "/" + User.LabName + "_log.txt";

        const logInfo = "[User Created] " + User.Name + " (" + User.Email + ") " + "created " + newUser.Email + " at " + new Date().toString() + " - " + User.IP + "\r\n"

        if (fs.existsSync(logFile)) {
          fs.appendFileSync(logFile, logInfo)
        } else {
          fs.writeFileSync(logFile, logInfo)
        }
      }
    } catch (error) {
      throw error;
    }

  }

  res.status(200).send('user created!');

});

exports.login = asyncHandler(async (req, res) => {
  const logFolder = "api/logs";
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder)
  }

  const { Email, Password, IP } = req.body;
  const personnel = await model.personnel.findOne({
    where: {
      Email: Email,
      Retired: false
    },
    include: [
      {
        model: model.lab,
        include: [{ model: model.study }],
      },
    ],
  });

  if (!personnel) {
    // log the login information.
    const logFile = logFolder + "/log.txt";
    var logInfo = "[Login ERROR] " + Email + " does not exist (or has been retired) at " + new Date().toString() + " - " + IP + "\r\n"

    if (fs.existsSync(logFile)) {
      fs.appendFileSync(logFile, logInfo)
    } else {
      fs.writeFileSync(logFile, logInfo)
    }

    return res.status(401).send({
      error: "The login information was incorrect",
    });
  }

  const isPasswordValid = bcrypt.compareSync(Password, personnel.Password);

  if (!isPasswordValid) {

    // log the login information.
    const logFile = logFolder + "/log.txt";
    var logInfo = "[Login ERROR] " + personnel.Name + " (" + personnel.Email + ") " + "login password mismatched at " + new Date().toString() + " - " + IP + "\r\n"

    if (fs.existsSync(logFile)) {
      fs.appendFileSync(logFile, logInfo)
    } else {
      fs.writeFileSync(logFile, logInfo)
    }

    return res.status(401).send({
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
  const logFile = logFolder + "/" + personnel.Lab.LabName + "_log.txt";
  var logInfo = "[Login] " + personnel.Name + " (" + personnel.Email + ") " + "logged in at " + new Date().toString() + " - " + IP + "\r\n"

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
    emailOpening: personnel.Lab.EmailOpening,
    emailClosing: personnel.Lab.EmailClosing,
    location: personnel.Lab.Location,
    transportationInstructions: personnel.Lab.TransportationInstructions,
    ZoomLink: personnel.Lab.ZoomLink,
  });
});

exports.loginChecked = asyncHandler(async (req, res) => {
  res.send("the user already logged in.");
});

exports.changePassword = asyncHandler(async (req, res) => {
  const logFolder = "api/logs";
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder)
  }

  const { Email, Password, newPassword, User } = req.body;
  const personnel = await model.personnel.findOne({
    where: {
      Email: Email,
      Retired: false
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
      error: "The login information was either incorrect or removed from the system.",
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
      token: token,
      name: personnel.Name,
      user: personnel.Email,
      userID: personnel.id,
      role: personnel.Role,
      lab: personnel.FK_Lab,
      labName: personnel.Lab.LabName,
      labEmail: personnel.Lab.Email,
      studies: personnel.Lab.Studies,
      emailOpening: personnel.Lab.EmailOpening,
      emailClosing: personnel.Lab.EmailClosing,
      location: personnel.Lab.Location,
      transportationInstructions: personnel.Lab.TransportationInstructions,
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


    await sendEmail(emailContent);

    // log
    const logFile = logFolder + "/" + User.LabName + "_log.txt";

    var logInfo = "[Change Password] " + User.Name + " (" + User.Email + ") " + "chagned password at " + new Date().toString() + " - " + User.IP + "\r\n"

    if (fs.existsSync(logFile)) {
      fs.appendFileSync(logFile, logInfo)
    } else {
      fs.writeFileSync(logFile, logInfo)
    }

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
    const { Email, User } = req.body;
    const personnel = await model.personnel.findOne({
      where: {
        Email: Email,
        Retired: false
      },
    });

    if (!personnel) {
      return res.status(401).send({
        error: "The login information was either incorrect or removed from the system.",
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

    // log
    const logFolder = "api/logs";
    if (!fs.existsSync(logFolder)) {
      fs.mkdirSync(logFolder)
    }

    if (User.LabName) {
      var logFile = logFolder + "/" + User.LabName + "_log.txt";

    } else {
      var logFile = logFolder + "/log.txt";
    }

    var logInfo = "[Password Reset] " + personnel.Name + " (" + personnel.Email + ") " + "reset password at " + new Date().toString() + " - " + User.IP + "\r\n"

    if (fs.existsSync(logFile)) {
      fs.appendFileSync(logFile, logInfo)
    } else {
      fs.writeFileSync(logFile, logInfo)
    }


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

      await sendEmail(emailContent);


    } catch (error) {
      throw error;
    }


  } catch (error) {
    throw error;
  }
});