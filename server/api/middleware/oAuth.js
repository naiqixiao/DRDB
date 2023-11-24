const asyncHandler = require("express-async-handler");
const fs = require("fs");

const { google } = require("googleapis");
// Require oAuth2 from our google instance.
const { OAuth2 } = google.auth;

module.exports = asyncHandler(async (req, res, next) => {

  try {
    const lab = req.body.lab || req.query.lab || req.params.lab;

    const credentialsPath = "api/google/general/credentials.json";
    const tokenPath = "api/google/labs/lab" + lab + "/token.json";
    // const credentials = await fs.promises.readFile(credentialsPath);
    const credentials = fs.readFileSync(credentialsPath);
    const { client_secret, client_id, redirect_uris } = JSON.parse(
      credentials
    ).installed;
    const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);

    // const token = await fs.promises.readFile(tokenPath);
    const token = fs.readFileSync(tokenPath);
    oAuth2Client.setCredentials(JSON.parse(token));

    req.oAuth2Client = oAuth2Client;
    next();
  } catch (error) {
    return res.status(401).send({
      message: "Google Authentication Failed.",
    });
  }
});
