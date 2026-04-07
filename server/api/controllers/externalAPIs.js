const asyncHandler = require("express-async-handler");
const fs = require("fs");
const model = require("../models/DRDB");

const { google } = require("googleapis");
const { OAuth2 } = google.auth;

exports.googleCredentialsURL = asyncHandler(async (req, res) => {
  try {
    const SCOPES = [
      "https://mail.google.com/",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.settings.basic",
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.labels"
    ];

    const credentialsPath = "api/google/general/credentials.json";

    if (!fs.existsSync(credentialsPath)) {
      return res.status(404).send({
        message: "Google API credentials file is missing on the server. Please contact your administrator and ensure 'api/google/general/credentials.json' is present.",
      });
    }

    const credentials = fs.readFileSync(credentialsPath);
    const parsedCredentials = JSON.parse(credentials);
    const config = parsedCredentials.installed || parsedCredentials.web;
    const { client_secret, client_id, redirect_uris } = config;

    // Determine the redirect URI based on the request's origin
    const origin = req.get('origin') || "http://localhost:5173";
    const redirect_uri = `${origin}/oauth/callback`;
    
    // Check if the current origin's redirect URI is in the authorized list
    const valid_redirect_uri = redirect_uris.includes(redirect_uri) 
      ? redirect_uri 
      : redirect_uris[0];

    const oAuth2Client = new OAuth2(client_id, client_secret, valid_redirect_uri);

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
    console.error("error in googleCredentialsURL:", error);
    return res.status(500).send({ 
      message: error.message || "Internal Server Error",
      details: "Ensure api/google/general/credentials.json is correct and contains valid JSON."
    });
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
    const parsedCredentials = JSON.parse(credentials);
    const config = parsedCredentials.installed || parsedCredentials.web;
    const { client_secret, client_id, redirect_uris } = config;

    const origin = req.get('origin') || "http://localhost:5173";
    const redirect_uri = `${origin}/oauth/callback`;
    const valid_redirect_uri = redirect_uris.includes(redirect_uri) 
      ? redirect_uri 
      : redirect_uris[0];

    const oAuth2Client = new OAuth2(client_id, client_secret, valid_redirect_uri);

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
      Email: labEmail,
    });
  } catch (error) {
    console.error("error in googleToken:", error);
    return res.status(500).send({ message: error.message || "Internal Server Error" });
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
    const parsedCredentials = JSON.parse(credentials);
    const config = parsedCredentials.installed || parsedCredentials.web;
    const { client_secret, client_id, redirect_uris } = config;

    const origin = req.get('origin') || "http://localhost:5173";
    const redirect_uri = `${origin}/oauth/callback`;
    const valid_redirect_uri = redirect_uris.includes(redirect_uri) 
      ? redirect_uri 
      : redirect_uris[0];

    const oAuth2Client = new OAuth2(client_id, client_secret, valid_redirect_uri);

    var token = await oAuth2Client.getToken(code);

    oAuth2Client.setCredentials(token.tokens);

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
    console.error("error in adminToken:", error);
    return res.status(500).send({ message: error.message || "Internal Server Error" });
  }
});

exports.googleEmail = asyncHandler(async (req, res) => {
  var sendAsEmail = {};

  // ── Lab email profile ─────────────────────────────────────────────
  try {
    const credentialsPath = "api/google/general/credentials.json";
    const tokenPath = "api/google/labs/lab" + req.body.lab + "/token.json";

    // Load credentials here — they are needed to build the OAuth2 client
    const credentials = fs.readFileSync(credentialsPath);
    const parsedCredentials = JSON.parse(credentials);
    const config = parsedCredentials.installed || parsedCredentials.web;
    const { client_secret, client_id, redirect_uris } = config;

    const origin = req.get('origin') || "http://localhost:5173";
    const redirect_uri = `${origin}/oauth/callback`;
    const valid_redirect_uri = redirect_uris.includes(redirect_uri)
      ? redirect_uri
      : redirect_uris[0];

    const oAuth2Client = new OAuth2(client_id, client_secret, valid_redirect_uri);

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

      await model.lab.update({ Email: labEmail }, {
        where: { id: req.body.lab },
      });

    } else {
      var labEmail = null;
      sendAsEmail.displayName = null;
    }

  } catch (error) {
    console.error("error in googleEmail lab profile:", error);
    var labEmail = null;
  }

  // admin profile
  try {
    const credentialsPath = "api/google/general/credentials.json";
    const tokenPath = "api/google/general/token.json";

    const credentials = fs.readFileSync(credentialsPath);
    const parsedCredentials = JSON.parse(credentials);
    const config = parsedCredentials.installed || parsedCredentials.web;
    const { client_secret, client_id, redirect_uris } = config;

    const origin = req.get('origin') || "http://localhost:5173";
    const redirect_uri = `${origin}/oauth/callback`;
    const valid_redirect_uri = redirect_uris.includes(redirect_uri) 
      ? redirect_uri 
      : redirect_uris[0];

    const oAuth2Client = new OAuth2(client_id, client_secret, valid_redirect_uri);

    const token = fs.readFileSync(tokenPath);
    oAuth2Client.setCredentials(JSON.parse(token));

    const adminGmail = google.gmail({ version: "v1", auth: oAuth2Client });

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
    console.error("error in googleEmail admin profile:", error);
  }

  res.status(200).send({
    labEmail: labEmail,
    adminEmail: adminEmail,
    labName: sendAsEmail.displayName
  });
});
