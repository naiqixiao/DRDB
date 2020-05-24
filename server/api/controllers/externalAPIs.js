const asyncHandler = require("express-async-handler");
const fs = require("fs");

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
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ];

    const credentialsPath = "api/google/general/credentials.json";
    // const tokenPath = "api/google/lab" + lab + "/token.json";

    const credentials = await fs.promises.readFile(credentialsPath);
    const { client_secret, client_id, redirect_uris } = JSON.parse(
      credentials
    ).installed;
    const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });

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
    const tokenPath = "api/google/lab" + lab + "/token.json";

    const credentials = await fs.promises.readFile(credentialsPath);
    const { client_secret, client_id, redirect_uris } = JSON.parse(
      credentials
    ).installed;
    const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);

    const token = await oAuth2Client.getToken(code);

    oAuth2Client.setCredentials(token.tokens);

    await fs.promises.writeFile(tokenPath, JSON.stringify(token.tokens));

    res.status(200).send({ message: "Google account is successfully set up!" });
  } catch (error) {
    return res.send(error);
  }
});
