const asyncHandler = require("express-async-handler");
const fs = require("fs");
const model = require("../models/DRDB");

const { google } = require("googleapis");
const { OAuth2 } = google.auth;

exports.googleCredentialsURL = asyncHandler(async (req, res) => {
  try {
    // if (req.body.lab) {
    //   var lab = req.body.lab;
    // } else {
    //   var lab = req.query.lab;
    // }

    const SCOPES = [
      "https://mail.google.com/",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.settings.basic",
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ];

    const credentialsPath = "api/google/general/credentials.json";
    // const tokenPath = "api/google/lab" + lab + "/token.json";

    const credentials = fs.readFileSync(credentialsPath);
    const { client_secret, client_id, redirect_uris } = JSON.parse(
      credentials
    ).installed;
    const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });

    // check lab folder
    if (!fs.existsSync("api/google/labs")) {
      fs.mkdirSync("api/google/labs");
    }

    res.status(200).send(authUrl);
  } catch (error) {
    return res.send(error);
  }
});

exports.googleToken = asyncHandler(async (req, res) => {
  try {
    if (req.body.lab) {
      var lab = req.body.lab;
      var code = req.body.signInCode;
    } else {
      var lab = req.query.lab;
      var code = req.query.signInCode;
    }

    const credentialsPath = "api/google/general/credentials.json";
    const tokenPath = "api/google/labs/lab" + lab + "/token.json";

    // check lab folder
    if (!fs.existsSync("api/google/labs")) {
      fs.mkdirSync("api/google/labs");
    }

    if (!fs.existsSync("api/google/labs/lab" + lab)) {
      fs.mkdirSync("api/google/labs/lab" + lab);
    }

    const credentials = fs.readFileSync(credentialsPath);
    const { client_secret, client_id, redirect_uris } = JSON.parse(
      credentials
    ).installed;
    const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);

    var token = await oAuth2Client.getToken(code);

    oAuth2Client.setCredentials(token.tokens);

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    const sendAs = await gmail.users.settings.sendAs.list({
      userId: "me",
    });

    sendAs.data.sendAs.forEach((email) => {
      if (email.isDefault) {
        sendAsEmail = email;
      }
    });

    var labEmail = sendAsEmail.sendAsEmail;

    // if (sendAsEmail.displayName != "") {
    //   var labInfo = { Email: labEmail, LabName: sendAsEmail.displayName };
    // } else {
    //   var labInfo = { Email: labEmail };
    // }
    // update lab email info.
    await model.lab.update(
      { Email: labEmail },
      {
        where: { id: req.body.lab },
      }
    );

    fs.writeFileSync(tokenPath, JSON.stringify(token.tokens));

    res.status(200).send({
      message: "Google account is successfully set up!",
      Email: profile.data.emailAddress,
    });
  } catch (error) {
    return res.send(error);
  }
});

exports.adminToken = asyncHandler(async (req, res) => {
  if (req.body.signInCode) {
    var code = req.body.signInCode;
  } else {
    var code = req.query.signInCode;
  }

  try {
    const credentialsPath = "api/google/general/credentials.json";
    const tokenPath = "api/google/general/token.json";

    const credentials = fs.readFileSync(credentialsPath);
    const { client_secret, client_id, redirect_uris } = JSON.parse(
      credentials
    ).installed;
    const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);

    var token = await oAuth2Client.getToken(code);

    oAuth2Client.setCredentials(token.tokens);

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

    fs.writeFileSync(tokenPath, JSON.stringify(token.tokens));

    res.status(200).send({
      message: "Admin account is successfully set up!",
      Email: adminEmail,
    });
  } catch (error) {
    return res.send(error);
  }
});

exports.googleEmail = asyncHandler(async (req, res) => {
  try {
    const credentialsPath = "api/google/general/credentials.json";
    const tokenPath = "api/google/labs/lab" + req.body.lab + "/token.json";

    const credentials = fs.readFileSync(credentialsPath);

    const { client_secret, client_id, redirect_uris } = JSON.parse(
      credentials
    ).installed;

    const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);

    var sendAsEmail = {};

    if (fs.existsSync(tokenPath)) {

      const token = fs.readFileSync(tokenPath);
      oAuth2Client.setCredentials(JSON.parse(token));

      const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

      const sendAs = await gmail.users.settings.sendAs.list({
        userId: "me",
      });

      sendAs.data.sendAs.forEach((email) => {
        if (email.isDefault) {
          sendAsEmail = email;
        }
      });

      var labEmail = sendAsEmail.sendAsEmail;

      // if (sendAsEmail.displayName != "") {
      //   var labInfo = { Email: labEmail, LabName: sendAsEmail.displayName };
      // } else {
      //   var labInfo = { Email: labEmail };
      // }
      var labInfo = { Email: labEmail };

      // update lab email info.
      await model.lab.update(labInfo, {
        where: { id: req.body.lab },
      });

    } else {
      var labEmail = null;
      sendAsEmail.displayName = null
    }

  } catch (error) {
    console.log(error);
    var labEmail = null;
  }

  // admin profile
  try {
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

    // const profile2 = await adminGmail.users.getProfile({ userId: "me" });

    // var adminEmail = profile2.data.emailAddress;

    const adminSendAs = await adminGmail.users.settings.sendAs.list({
      userId: "me",
    });

    adminSendAs.data.sendAs.forEach((email) => {
      if (email.isDefault) {
        sendAsEmail = email;
      }
    });

    var adminEmail = sendAsEmail.sendAsEmail;

  } catch (error) {
    var adminEmail = null;
    console.log(error);
  }

  res.status(200).send({
    labEmail: labEmail,
    adminEmail: adminEmail,
    labName: sendAsEmail.displayName
  });
});