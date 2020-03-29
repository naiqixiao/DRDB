const { google } = require("googleapis");

// Require oAuth2 from our google instance.
const { OAuth2 } = google.auth;

// Create a new instance of oAuth and set our Client ID & Client Secret.
const oAuth2Client = new OAuth2(
  "374041680684-89cq4b36n7qj7pir7pietv5ei0ueku9f.apps.googleusercontent.com",
  "qPp_UQ-jAardQ2_i90K7JDes"
);

// Call the setCredentials method on our oAuth2Client instance and set our refresh token.
oAuth2Client.setCredentials({
  refresh_token:
    "1//0foDDahdC5onrCgYIARAAGA8SNwF-L9Irv4RifE8bXYkmknCP7i-puxemdheSwwMW8FrKMsbQaxWkmckUvL5xgv3rgnm92mvHIVs"
});

// Create a new calender instance.
exports.calendar = google.calendar({ version: "v3", auth: oAuth2Client });