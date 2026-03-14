const fs = require("fs");
const { google } = require("googleapis");
const { OAuth2 } = google.auth;

/**
 * Encode an email message into a base64url string for the Gmail API.
 * Supports optional cc and bcc fields.
 */
function encodeMessage({ to, from, cc, bcc, subject, body }) {
  const parts = [
    'Content-Type: text/html; charset="UTF-8"\n',
    "MIME-Version: 1.0\n",
    "Content-Transfer-Encoding: 7bit\n",
    `to: ${to}\n`,
    `from: ${from}\n`,
  ];

  if (cc) parts.push(`cc: ${cc}\n`);
  if (bcc) parts.push(`bcc: ${bcc}\n`);

  parts.push(`subject: ${subject}\n\n`);
  parts.push(body);

  return Buffer.from(parts.join(""))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Create an authenticated Gmail client using the admin (general) credentials.
 * Reads from api/google/general/credentials.json and token.json.
 */
async function getAdminGmailClient() {
  const credentials = JSON.parse(
    fs.readFileSync("api/google/general/credentials.json")
  );
  const token = JSON.parse(
    fs.readFileSync("api/google/general/token.json")
  );

  const { client_id, client_secret, redirect_uris } = credentials.installed;
  const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);

  return google.gmail({ version: "v1", auth: oAuth2Client });
}

/**
 * Look up the default "Send As" email address for the authenticated user.
 */
async function getDefaultSendAsEmail(gmailClient) {
  const sendAsList = await gmailClient.users.settings.sendAs.list({
    userId: "me",
  });
  const defaultEntry = sendAsList.data.sendAs.find((e) => e.isDefault);
  return defaultEntry.sendAsEmail;
}

/**
 * Send an email using the admin (general/system) Gmail account.
 *
 * @param {Object} options
 * @param {string} options.to       - Recipient, e.g. "Name <email@example.com>"
 * @param {string} [options.cc]     - CC recipient(s)
 * @param {string} [options.bcc]    - BCC recipient(s)
 * @param {string} options.subject  - Email subject
 * @param {string} options.htmlBody - HTML body of the email
 * @returns {Promise} Gmail API send result
 */
async function sendAdminEmail({ to, cc, bcc, subject, htmlBody }) {
  const adminGmail = await getAdminGmailClient();
  const adminEmail = await getDefaultSendAsEmail(adminGmail);
  const from = `Developmental Research Management System <${adminEmail}>`;

  const raw = encodeMessage({ to, from, cc, bcc, subject, body: htmlBody });

  return adminGmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
}

/**
 * Send an email using a lab-specific OAuth2 client (from the oAuth middleware).
 * Supports optional Gmail labels — creates them if they don't exist.
 *
 * @param {OAuth2Client} oAuth2Client - Authenticated OAuth2 client for the lab
 * @param {Object} options
 * @param {string} options.to         - Recipient
 * @param {string} options.from       - Sender
 * @param {string} [options.cc]       - CC recipient(s)
 * @param {string} [options.bcc]      - BCC recipient(s)
 * @param {string} options.subject    - Email subject
 * @param {string} options.htmlBody   - HTML body of the email
 * @param {string[]} [options.labelNames] - Gmail label names to attach
 * @returns {Promise} Gmail API send result
 */
async function sendLabEmail(oAuth2Client, { to, from, cc, bcc, subject, htmlBody, labelNames }) {
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  const raw = encodeMessage({ to, from, cc, bcc, subject, body: htmlBody });

  const labelIds = [];

  if (labelNames && labelNames.length > 0) {
    const gmailLabelList = await gmail.users.labels.list({ userId: "me" });
    const labels = gmailLabelList.data.labels;

    for (const labelName of labelNames) {
      const existing = labels.find(
        (label) =>
          label.name.replace(/[^a-zA-Z0-9]/g, "") ===
          labelName.replace(/[^a-zA-Z0-9]/g, "")
      );

      if (existing) {
        labelIds.push(existing.id);
      } else {
        const created = await gmail.users.labels.create({
          userId: "me",
          resource: { name: labelName, labelListVisibility: "labelShow" },
        });
        labelIds.push(created.data.id);
      }
    }
  }

  const result = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw,
      labelIds,
    },
  });

  // Apply labels after sending (ensures they stick on the sent message)
  if (labelIds.length > 0) {
    await gmail.users.messages.modify({
      userId: "me",
      id: result.data.id,
      resource: { addLabelIds: labelIds },
    });
  }

  return result;
}
/**
 * Create an authenticated OAuth2 client for a specific lab.
 * Uses the general credentials + the lab's specific token file.
 *
 * @param {number|string} labId - The lab ID
 * @returns {OAuth2Client} Authenticated OAuth2 client
 */
function getLabOAuth2Client(labId) {
  const credentials = JSON.parse(
    fs.readFileSync("api/google/general/credentials.json")
  );
  const token = JSON.parse(
    fs.readFileSync(`api/google/labs/lab${labId}/token.json`)
  );

  const { client_id, client_secret, redirect_uris } = credentials.installed;
  const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

module.exports = {
  encodeMessage,
  getAdminGmailClient,
  getDefaultSendAsEmail,
  sendAdminEmail,
  sendLabEmail,
  getLabOAuth2Client,
};
