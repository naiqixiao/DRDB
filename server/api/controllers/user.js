const model = require("../models/DRDB");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { google } = require("googleapis");

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
      resource: {
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

    const hashPassword = await bcrypt.hash(password, 10);

    var newUser = req.body;

    newUser.Password = hashPassword;

    const newPersonnel = await model.personnel.create(newUser);

    res.status(200).send(newPersonnel);
    console.log("User created!");

    try {
      var emailContent = {
        to: newUser.Email,
        subject:
          "Your user account has been created for Developmental Research Database.",
        body:
          "<p>You initial login password is: <b>" +
          password +
          "</b></p> <p>Please login to change your password.</p> ",
      };

      await sendEmail(req.oAuth2Client, emailContent);
    } catch (error) {
      throw error;
    }
  } catch (error) {
    res.status(400).send({
      message: "This email account has already been registered. Please log in.",
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

  const isPasswordValid = await bcrypt.compare(Password, personnel.Password);

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
      expiresIn: "12h",
    }
  );

  res.send({
    message: "Auth succsessful.",
    user: personnel.Email,
    userID: personnel.id,
    lab: personnel.FK_Lab,
    token: token,
    studies: personnel.Lab.Studies,
  });
});


exports.loginChecked = asyncHandler(async (req, res) => {
  res.send("the user already logged in.")
});