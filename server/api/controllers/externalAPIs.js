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
      prompt: "consent",
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
    const lab = req.body.lab || req.query.lab || req.userData?.lab;
    const code = req.body.signInCode || req.query.signInCode;

    if (!lab || !code) {
      return res.status(400).send({ message: "Missing lab id or sign-in code." });
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

    let finalTokens = token.tokens;
    if (fs.existsSync(tokenPath)) {
      try {
        const oldToken = JSON.parse(fs.readFileSync(tokenPath));
        finalTokens = { ...oldToken, ...token.tokens };
      } catch (e) {
        console.error("Error parsing old token:", e);
      }
    }

    oAuth2Client.setCredentials(finalTokens);

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    const sendAs = await gmail.users.settings.sendAs.list({
      userId: "me",
    });

    let sendAsEmail = {};
    sendAs.data.sendAs.forEach((email) => {
      if (email.isDefault) {
        sendAsEmail = email;
      }
    });

    const labEmail = sendAsEmail.sendAsEmail;

    // update lab email info if found.
    if (labEmail) {
      await model.lab.update(
        { Email: labEmail },
        {
          where: { id: lab },
        }
      );
    }

    fs.writeFileSync(tokenPath, JSON.stringify(finalTokens));

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

    let finalTokens = token.tokens;
    if (fs.existsSync(tokenPath)) {
      try {
        const oldToken = JSON.parse(fs.readFileSync(tokenPath));
        finalTokens = { ...oldToken, ...token.tokens };
      } catch (e) {
        console.error("Error parsing old admin token:", e);
      }
    }

    oAuth2Client.setCredentials(finalTokens);

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

    fs.writeFileSync(tokenPath, JSON.stringify(finalTokens));

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
  const labId = req.body.lab || req.query.lab || req.userData?.lab;

  if (!labId) {
    return res.status(400).send({ message: "Missing lab id." });
  }

  let labEmail = null;
  let adminEmail = null;
  let labName = null;

  // ── Lab email profile ─────────────────────────────────────────────
  try {
    const credentialsPath = "api/google/general/credentials.json";
    const tokenPath = "api/google/labs/lab" + labId + "/token.json";

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

      let sendAsEmailEntry = {};
      sendAs.data.sendAs.forEach((email) => {
        if (email.isDefault) {
          sendAsEmailEntry = email;
        }
      });

      labEmail = sendAsEmailEntry.sendAsEmail;
      labName = sendAsEmailEntry.displayName || null;

      if (labEmail) {
        await model.lab.update({ Email: labEmail }, {
          where: { id: labId },
        });
      }
    }

    // Fallback: If Gmail retrieval fails or token is missing, fetch from database to keep UI consistent
    if (!labEmail) {
      const currentLab = await model.lab.findByPk(labId);
      if (currentLab && currentLab.Email) {
        labEmail = currentLab.Email;
      }
    }

  } catch (error) {
    console.error("error in googleEmail lab profile:", error);
    // Even on error, try to fetch from database to show current status
    const currentLab = await model.lab.findByPk(labId);
    if (currentLab && currentLab.Email) {
      labEmail = currentLab.Email;
    } else {
      labEmail = null;
    }
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

    if (fs.existsSync(tokenPath)) {
      const token = fs.readFileSync(tokenPath);
      oAuth2Client.setCredentials(JSON.parse(token));

      const adminGmail = google.gmail({ version: "v1", auth: oAuth2Client });

      const adminSendAs = await adminGmail.users.settings.sendAs.list({
        userId: "me",
      });

      let adminSendAsEmailEntry = {};
      adminSendAs.data.sendAs.forEach((email) => {
        if (email.isDefault) {
          adminSendAsEmailEntry = email;
        }
      });

      adminEmail = adminSendAsEmailEntry.sendAsEmail || null;
    }

  } catch (error) {
    adminEmail = null;
    console.error("error in googleEmail admin profile:", error);
  }

  res.status(200).send({
    labEmail: labEmail,
    adminEmail: adminEmail,
    labName: labName
  });
});
