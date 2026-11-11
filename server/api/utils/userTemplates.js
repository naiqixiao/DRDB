/** System notifications for account actions and feedback. */
const config = require("../../config/general");
const { escapeHtml } = require("./emailLayout");

const MANUAL_URL = "https://docs.google.com/document/d/1oaucm_FrpTxsO7UcOb-r-Y2Ck2zBe1G-BMvw_MD18N0/edit?usp=sharing";
const GOOGLE_SETUP_URL = "https://mcmasteru365-my.sharepoint.com/:p:/g/personal/xiaon8_mcmaster_ca/ERk1uev-LENDrca6aWXwSqYBAn1J1OEsJ3tNjPkbpvcwtA?e=Gz73ZK";
const link = (url, label) => `<a href="${escapeHtml(url)}" style="color:#365676;text-decoration:underline;">${escapeHtml(label)}</a>`;
const resources = `<p style="margin:24px 0 0;font-size:14px;line-height:24px;"><strong>Helpful resources</strong><br>${link(MANUAL_URL, "Read the brief manual")}<br>${link(GOOGLE_SETUP_URL, "Set up Google email and calendar")}</p>`;

// A separate, restrained system style distinguishes operational notices from family emails.
function systemEmail(title, category, content) {
  return `<!doctype html><html lang="en" data-drdb-email="v1"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title>
<style>@media screen and (max-width:600px){.outer{padding:16px 8px!important}.content{padding:24px!important}} table{max-width:100%} td{overflow-wrap:anywhere}</style></head>
<body style="margin:0;background:#f1f3f6;color:#243244;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f3f6;"><tr><td class="outer" align="center" style="padding:40px 16px;">
<!--[if mso]><table role="presentation" width="720"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;background:#ffffff;border:1px solid #dce2e9;border-top:5px solid #365676;">
<tr><td class="content" style="padding:28px 40px 24px;border-bottom:1px solid #e5e9ef;"><p style="margin:0 0 8px;color:#60728a;font-size:12px;line-height:18px;letter-spacing:1px;text-transform:uppercase;">${escapeHtml(category)}</p><p style="margin:0;color:#365676;font-size:18px;line-height:26px;font-weight:bold;">Developmental Research Management System</p></td></tr>
<tr><td class="content" style="padding:32px 40px;font-size:16px;line-height:26px;"><h1 style="margin:0 0 24px;color:#243244;font-size:28px;line-height:36px;">${escapeHtml(title)}</h1>${content}</td></tr>
<tr><td class="content" style="padding:22px 40px;background:#f8f9fb;border-top:1px solid #e5e9ef;color:#60728a;font-size:13px;line-height:21px;">This notification was sent by the Developmental Research Management System.</td></tr>
</table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`;
}

const greeting = name => `<p style="margin:0 0 16px;">Hello ${escapeHtml(String(name || "").trim().split(/\s+/)[0])},</p>`;
const details = rows => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#f2f5f9;border:1px solid #dce4ed;"><tr><td style="padding:18px 20px;font-size:15px;line-height:24px;">${rows.map(([label, value]) => `<p style="margin:0 0 8px;"><strong>${escapeHtml(label)}</strong><br>${escapeHtml(value)}</p>`).join("")}</td></tr></table>`;
const signIn = () => link(config.URL, "Sign in to DRDB");

function buildWelcomeEmail(name, email, role, password) {
  return {
    to: name + " <" + email + ">",
    subject: "Your user account has been created!",
    htmlBody: systemEmail("Your account is ready", "Account setup", `${greeting(name)}
<p style="margin:0 0 16px;">Welcome to the Developmental Research Management System. Your account has been created with the following details:</p>
${details([["Email", email], ["Role", role], ["Temporary password", password]])}
<p style="margin:0 0 16px;">${signIn()} with your email and temporary password to set your password${escapeHtml(config.otherRequirement)}.</p>
<p style="margin:0 0 16px;"><strong>Lab managers:</strong> Please update your lab email template in Settings.</p>${resources}`),
  };
}

function buildPasswordChangedEmail(name, email) {
  return {
    to: name + " <" + email + ">",
    subject: "Your login password is updated.",
    htmlBody: systemEmail("Password updated", "Account security", `${greeting(name)}<p style="margin:0 0 16px;">Your login password has recently been changed.</p><p style="margin:0;">If you didn't change your password, please contact your lab manager as soon as possible.</p>`),
  };
}

function buildPasswordResetEmail(name, email, password) {
  return {
    to: name + " <" + email + ">",
    subject: "Your password is reset",
    htmlBody: systemEmail("Your password has been reset", "Account security", `${greeting(name)}<p style="margin:0 0 16px;">Your login password has been reset. Use the temporary password below to sign in and change your password.</p>${details([["Temporary password", password]])}<p style="margin:0 0 16px;">${signIn()}</p>${resources}`),
  };
}

function buildFeedbackEmail(feedbackEmail, page, title, content) {
  return {
    to: "babylab@mcmaster.ca",
    cc: feedbackEmail,
    subject: "[DRDB feedback] " + title,
    htmlBody: systemEmail(title, "Feedback received", `${details([["From", feedbackEmail], ["Page", page]])}<p style="margin:0 0 8px;"><strong>Message</strong></p><p style="margin:0;">${escapeHtml(content).replace(/\r?\n/g, "<br>")}</p>`),
  };
}

module.exports = { buildWelcomeEmail, buildPasswordChangedEmail, buildPasswordResetEmail, buildFeedbackEmail };
