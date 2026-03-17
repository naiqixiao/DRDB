const model = require("../models/DRDB");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const fs = require("fs");

const config = require("../../config/general");
const log = require("../controllers/log");
const { sendAdminEmail } = require("../utils/emailUtil");
const { buildWelcomeEmail, buildPasswordChangedEmail, buildPasswordResetEmail } = require("../utils/userTemplates");

exports.signup = asyncHandler(async (req, res) => {
  const logFolder = "api/logs";
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder)
  }

  try {
    const password = crypto.randomBytes(12).toString('base64url');

    const hashPassword = bcrypt.hashSync(password, 10);

    var newUser = req.body;
    var User = req.body.User;

    newUser.Password = hashPassword;
    newUser.temporaryPassword = true;

    // check whether the user is in the system (previously being retired).
    const personnel = await model.personnel.findOne({
      where: {
        Email: req.body.Email,
      },
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

      const welcomeEmail = buildWelcomeEmail(newUser.Name, newUser.Email, newUser.Role, password);
      await sendAdminEmail(welcomeEmail);

      // log
      await log.createLog("User Created", User, "created " + newUser.Email);

    }
  } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: error.message });
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

        const password = crypto.randomBytes(12).toString('base64url');

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

        const welcomeEmail = buildWelcomeEmail(newUser.Name, newUser.Email, newUser.Role, password);
        await sendAdminEmail(welcomeEmail);

        // log
        await log.createLog("User Created", User, "created " + newUser.Email);

        }
      } catch (error) {
        console.error("Signup batch error:", error);
        res.status(500).json({ error: error.message });
      }

  }

  res.status(200).send('user created!');

});

exports.login = asyncHandler(async (req, res) => {

  const { Email, Password } = req.body;
  const personnel = await model.personnel.findOne({
    where: {
      Email: Email,
      Retired: false
    },
    include: [
      {
        model: model.lab,
        include: [{
          model: model.study, include: [
            {
              model: model.personnel,
              as: 'PointofContact'
            },
            {
              model: model.personnel,
              as: 'Experimenters',
              through: {
                model: model.experimenter,
              },
            },
            { model: model.studyAgeGroup, as: 'AgeGroups' },
            { model: model.study, as: 'Prerequisites', attributes: ['id', 'StudyName'] },
            { model: model.study, as: 'Exclusions', attributes: ['id', 'StudyName'] },
          ]
        }],
      },
    ],
  });

  if (!personnel) {
    // log the login information.

    await log.createLog("Not Exist", {}, Email + " does not exist (or has been retired)");

    return res.status(401).send({
      error: "The login information was incorrect",
    });
  }

  const isPasswordValid = bcrypt.compareSync(Password, personnel.Password);

  if (!isPasswordValid) {

    // log the login information.
    personnel.LabName = personnel.Lab.LabName;

    await log.createLog("Login Error", personnel, "login password mismatched");

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
  personnel.LabName = personnel.Lab.LabName;
  await log.createLog("Log in", personnel, "logged in successfully!");

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
    TYEmail: personnel.Lab.TYEmail,
    location: personnel.Lab.Location,
    transportationInstructions: personnel.Lab.TransportationInstructions,
    ZoomLink: personnel.ZoomLink,
    timeZone: config.timeZone
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
        include: [{
          model: model.study,
          include: [
            { model: model.personnel, as: 'PointofContact' },
            {
              model: model.personnel,
              as: 'Experimenters',
              through: { model: model.experimenter },
            },
            { model: model.studyAgeGroup, as: 'AgeGroups' },
            { model: model.study, as: 'Prerequisites', attributes: ['id', 'StudyName'] },
            { model: model.study, as: 'Exclusions', attributes: ['id', 'StudyName'] },
          ],
        }],
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
      TYEmail: personnel.Lab.TYEmail,
      location: personnel.Lab.Location,
      transportationInstructions: personnel.Lab.TransportationInstructions,
    });


    const pwChangedEmail = buildPasswordChangedEmail(personnel.Name, personnel.Email);
    await sendAdminEmail(pwChangedEmail);

    // log
    await log.createLog("Change Password", User, "chagned password");

  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: error.message });
  }
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const password = crypto.randomBytes(12).toString('base64url');

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
    personnel.LabName = User.LabName

    await log.createLog("Change Reset", personnel, "reset password");

    res.status(200).send({
      message: "Password reset!",
    });

    const resetEmail = buildPasswordResetEmail(personnel.Name, personnel.Email, password);
    await sendAdminEmail(resetEmail);

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: error.message });
  }
});

exports.logout = asyncHandler(async (req, res) => {
  const User = req.body
  await log.createLog("Log out", User, "log out the system.");

  res.status(200).send('log out sucessfully.')
})