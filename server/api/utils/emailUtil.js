const fs = require("fs");
const crypto = require("crypto");
const { plainText } = require("./emailLayout");
const { prepareEmail } = require("../services/emailBrandingService");
const { google } = require("googleapis");
const { OAuth2 } = google.auth;

const header = (value) => String(value || "").replace(/[\r\n]/g, " ");

// Keep encoded words below RFC 2047's 75-character limit without splitting Unicode.
function encodedWords(text) {
  const words = [];
  let chunk = "";
  for (const character of text) {
    if (Buffer.byteLength(chunk + character) > 42) { words.push(chunk); chunk = ""; }
    chunk += character;
  }
  if (chunk) words.push(chunk);
  return words.map(word => `=?UTF-8?B?${Buffer.from(word).toString("base64")}?=`).join("\r\n ");
}

// A single "Display Name <address>" whose name has commas, quotes, or
// non-ASCII characters is not a valid address header unless quoted or encoded.
// Address lists and bare addresses pass through unchanged.
function addressHeader(value) {
  const text = header(value).trim();
  const match = text.match(/^([^<>]*?)\s*<([^<>\s]+)>$/);
  if (!match || !match[1]) return text;
  const name = match[1].trim().replace(/^"(.*)"$/, "$1");
  let displayName;
  if (/^[\w !#$%&'*+\-/=?^`{|}~]+$/.test(name)) displayName = name;
  else if (/^[\x20-\x7e]*$/.test(name)) displayName = `"${name.replace(/(["\\])/g, "\\$1")}"`;
  else displayName = encodedWords(name);
  return `${displayName} <${match[2]}>`;
}

/**
 * Encode an email message into a base64url string for the Gmail API.
 * Supports optional cc and bcc fields.
 */
function encodeMessage({ to, from, cc, bcc, subject, body, inlineImages = [] }) {
  const boundary = "drdb-" + crypto.randomBytes(16).toString("hex");
  const relatedBoundary = "related-" + crypto.randomBytes(16).toString("hex");
  const parts = [
    `Content-Type: multipart/${inlineImages.length ? "related" : "alternative"}; boundary="${inlineImages.length ? relatedBoundary : boundary}"\r\n`,
    "MIME-Version: 1.0\r\n",
    `To: ${addressHeader(to)}\r\n`,
    `From: ${addressHeader(from)}\r\n`,
  ];
  if (cc) parts.push(`Cc: ${header(cc)}\r\n`);
  if (bcc) parts.push(`Bcc: ${header(bcc)}\r\n`);
  parts.push(`Subject: ${encodedWords(header(subject))}\r\n\r\n`);
  if (inlineImages.length) parts.push(`--${relatedBoundary}\r\nContent-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`);
  for (const [type, content] of [["text/plain", plainText(body)], ["text/html", body]]) {
    const encoded = Buffer.from(String(content || "")).toString("base64").match(/.{1,76}/g) || [];
    parts.push(`--${boundary}\r\nContent-Type: ${type}; charset="UTF-8"\r\nContent-Transfer-Encoding: base64\r\n\r\n${encoded.join("\r\n")}\r\n`);
  }
  parts.push(`--${boundary}--\r\n`);
  if (inlineImages.length) {
    for (const image of inlineImages) {
      const encoded = image.content.toString("base64").match(/.{1,76}/g) || [];
      parts.push(`--${relatedBoundary}\r\nContent-Type: ${image.mimeType}\r\nContent-Transfer-Encoding: base64\r\nContent-ID: <${image.cid}>\r\nContent-Disposition: inline; filename="lab-logo.${image.mimeType === "image/png" ? "png" : "jpg"}"\r\n\r\n${encoded.join("\r\n")}\r\n`);
    }
    parts.push(`--${relatedBoundary}--\r\n`);
  }

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

  const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;
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
async function sendAdminEmail({ to, cc, bcc, subject, htmlBody, lab, layout = {} }) {
  const adminGmail = await getAdminGmailClient();
  const adminEmail = await getDefaultSendAsEmail(adminGmail);
  const from = `Developmental Research Management System <${adminEmail}>`;

  const prepared = await prepareEmail({ htmlBody, subject, lab, ...layout });
  const raw = encodeMessage({ to, from, cc, bcc, subject, body: prepared.htmlBody, inlineImages: prepared.inlineImages });

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
async function sendLabEmail(oAuth2Client, { to, from, cc, bcc, subject, htmlBody, labelNames, lab, layout = {} }) {
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  const prepared = await prepareEmail({ htmlBody, subject, lab, ...layout });
  const raw = encodeMessage({ to, from, cc, bcc, subject, body: prepared.htmlBody, inlineImages: prepared.inlineImages });

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

  const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;
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
