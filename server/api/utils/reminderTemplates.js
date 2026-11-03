/**
 * Reminder Email Templates
 *
 * All HTML email body construction for reminder emails.
 * Extracted from controllers/reminder.js for maintainability.
 */

const { renderEmail, escapeHtml } = require("./emailLayout");
const { formatDateInTimezone } = require("./dateTime");

// ─── Shared table styles ───────────────────────────────────────────
const TRO =
  "<td style = 'background: white !important; border: 1px solid #d5e2dc; padding: 0.5rem; text-align: center; '>";
const TRE =
  "<td style = 'background: #eef4f1 !important; border: 1px solid #d5e2dc; padding: 0.5rem; text-align: center;'>";

function rowStyle(index) {
  return index % 2 === 1 ? TRE : TRO;
}

// ─── Private helpers ───────────────────────────────────────────────

function childNames(Appointments) {
  var nameList = Appointments.map((appointment) => {
    if (!!appointment.Child.Name) {
      return appointment.Child.Name.split(" ")[0];
    }
  });

  nameList = Array.from(new Set(nameList));

  if (nameList.length <= 2) {
    return nameList.join(" and ");
  }
  return "your " + nameList.length + " children";
}

function formatedBody(emailBody) {
  const k = emailBody.split("</p><p>");
  var formattedEmailBody = "";

  for (var i = 0; i < k.length; i++) {
    if (i < k.length - 3) {
      formattedEmailBody = formattedEmailBody + k[i] + "<br><br>";
    } else {
      formattedEmailBody = formattedEmailBody + k[i] + "<br>";
    }
  }

  return formattedEmailBody;
}

function PhoneFormated(Phone) {
  if (Phone) {
    var cleaned = ("" + Phone).replace(/\D/g, "");
    var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return "(" + match[1] + ") " + match[2] + "-" + match[3];
    }
    return null;
  }
}

// ─── Public template builders ──────────────────────────────────────

/**
 * Build the family reminder email content (sent to parents).
 * Returns { from, to, subject, body }.
 */
function buildFamilyReminderBody(schedule, timeZone) {
  const emailSubject =
    "Reminder for your study appointment with " +
    childNames(schedule.Appointments);

  if (!schedule.Family.NamePrimary) {
    schedule.Family.NamePrimary = "";
  }

  var parentName = "Caregiver";
  if (!!schedule.Family.NamePrimary) {
    parentName = schedule.Family.NamePrimary.split(" ")[0];
  }

  var opening = "";

  if (schedule.Appointments[0].Study.StudyType !== "Online") {
    opening =
      "<p>Dear " +
      parentName +
      ",</p>" +
      "<p>Hope you are doing great! This is a reminder for your visit to " +
      schedule.Appointments[0].Study.Lab.LabName +
      " with <b>" +
      childNames(schedule.Appointments) +
      formatDateInTimezone(
        schedule.AppointmentTime,
        " [tomorrow at] h:mma",
        timeZone
      ) +
      "</b>.</p>" +
      schedule.Appointments[0].Study.Lab.TransportationInstructions;
  } else {
    opening =
      "<p>Dear " +
      parentName +
      ",</p>" +
      "<p>Hope you are doing great! This is " +
      schedule.Appointments[0].Study.Lab.LabName +
      ". Just a reminder that you and " +
      childNames(schedule.Appointments) +
      " will participate in our online study " +
      formatDateInTimezone(
        schedule.AppointmentTime,
        " [tomorrow at] h:mma",
        timeZone
      ) +
      "</b>.</p>";
  }

  var ZoomLink = "Zoom Link not available.";

  if ("ZoomLink" in schedule.Appointments[0].Study.Lab) {
    if (schedule.Appointments[0].Study.Lab.ZoomLink) {
      ZoomLink =
        "<a href='" +
        schedule.Appointments[0].Study.Lab.ZoomLink +
        "'>Zoom Link</a>";
    }
  }

  if (schedule.Appointments[0].PrimaryExperimenter.length > 0) {
    if (schedule.Appointments[0].PrimaryExperimenter[0].ZoomLink) {
      ZoomLink =
        "<a href='" +
        schedule.Appointments[0].PrimaryExperimenter[0].ZoomLink +
        "'>Zoom Link</a>";
    }
  }

  var body = schedule.Appointments[0].Study.ReminderTemplate.replace(
    /\${{ZoomLink}}/g,
    ZoomLink
  );

  body = body.replace(/\${{childName}}/g, childNames(schedule.Appointments));

  if (schedule.Appointments[0].Study.StudyType === "Online") {
    body =
      body +
      "<p>If this study use Zoom for online study, you can download Zoom for your computer here: <a href='https://zoom.us/download'>Download Link</a></p>" +
      "<p><a href='https://mcmasteru365-my.sharepoint.com/:p:/g/personal/xiaon8_mcmaster_ca/EdhORdZeCwlPn-X54WquFz8Boegr1YpaNy9mzlW_wJ8ZjQ?e=hvDNGr'>CLICK HERE</a> to learn a few tips to setup online study with your child.</p>";
  }

  const closing =
    schedule.Appointments[0].Study.Lab.EmailClosing +
    "<p>Best,</p><p>" +
    schedule.Personnel.Name +
    "</p><p>" +
    schedule.Personnel.Role +
    "</p><p>" +
    schedule.Appointments[0].Study.Lab.LabName +
    "</p>";

  return {
    from:
      schedule.Appointments[0].Study.Lab.LabName +
      "<" +
      schedule.Appointments[0].Study.Lab.Email +
      ">",
    to: schedule.Family.NamePrimary + "<" + schedule.Family.Email + ">",
    subject: emailSubject,
    body: renderEmail({
      htmlBody: formatedBody(opening + body + closing),
      lab: schedule.Appointments[0].Study.Lab,
      title: "We look forward to seeing you.",
      category: "Study reminder",
      preheader: "A quick reminder about your upcoming study appointment. Details are inside.",
      reason: "You’re receiving this reminder because you have a study appointment with our lab.",
      details: [
        { label: "When", value: formatDateInTimezone(schedule.AppointmentTime, "dddd, MMMM D, YYYY [at] h:mm A z", timeZone) },
        { label: "Study", value: schedule.Appointments.map(a => a.Study.StudyName).filter(Boolean).join(", ") },
        { label: "Where", value: schedule.Appointments[0].Study.StudyType === "Online" ? "Online — joining details below" : schedule.Appointments[0].Study.Lab.Location || "See visit instructions below" },
      ],
    }),
  };
}

/**
 * Build the manual reminder body (sent to the lab when the family has no email).
 * Returns { to, subject, body }.
 */
function buildManualReminderBody(schedule, timeZone) {
  if (!schedule.Family.NamePrimary) {
    schedule.Family.NamePrimary = "";
  }

  var parentName = "Caregiver";
  if (!!schedule.Family.NamePrimary) {
    parentName = schedule.Family.NamePrimary.split(" ")[0];
  }

  const emailSubject =
    "Remind " + parentName + " of their participation tomorrow.";

  const emailBody =
    "<p>" +
    schedule.Appointments[0].Study.Lab.LabName +
    ",</p>" +
    "<p>" +
    parentName +
    " and their child(ren), " +
    childNames(schedule.Appointments) +
    " are coming for a study tomorrow, " +
    formatDateInTimezone(
      schedule.AppointmentTime,
      " [on] dddd [(]MMM Do[)] [at] h:mma",
      timeZone
    ) +
    "</p><p>" +
    "However, there is no email in the system to remind them over email. Please give them a call ASAP.</p>" +
    "<p>Thank you!</p><p>" +
    "Developmental Research Management System</p>";

  return {
    to:
      schedule.Appointments[0].Study.Lab.LabName +
      "<" +
      schedule.Appointments[0].Study.Lab.Email +
      ">",
    subject: emailSubject,
    body: formatedBody(emailBody),
  };
}

/**
 * Build the auto-completion reminder email body (shared lab table style).
 * Sent to experimenters asking them to confirm yesterday's study completions.
 */
function buildCompletionReminderBody(experimenterName, scheduleList, timeZone) {
  const TH =
    "style = 'background: #245c54; border: 1px solid #d5e2dc; padding: 0.5rem; text-align: center; font-size: 14px; color: white;'";

  var body = "<!DOCTYPE html><html><head>";
  body += "</head><body>Hi " + experimenterName + ",<br><br>";

  body +=
    "<p><strong>According to the system, you were the primary experimenter for the following studies yesterday. How did it go?</strong></p>" +
    "<p>If any of the families below failed to show up or requested rescheduling, please update the appointment status accordingly. Otherwise, the system will mark the study as completed tomorrow, and the families will be available for other studies.</p>";

  body += '<table style="width:100%; border-collapse: collapse !important;">';
  body +=
    "<tr><th width='15%'" +
    TH +
    ">Study time (" + (timeZone || "local timezone") + ")</th>" +
    "<th width='15%' " +
    TH +
    ">Study name</th>" +
    "<th width='18%' " +
    TH +
    ">Parent</th>" +
    "<th width='20%' " +
    TH +
    ">Email</th></tr>";

  scheduleList.forEach((schedule, index) => {
    const style = rowStyle(index);
    body += "<tr>";
    body +=
      style +
      formatDateInTimezone(
        schedule.AppointmentTime,
        "MMM Do [at] h:mma",
        timeZone
      ) +
      "</td>";
    body += style + schedule.StudyName + "</td>";
    body += style + schedule.Name + "</td>";
    body += style + schedule.Email + "</td>";
    body += "</tr>";
  });

  body += "</table><br><br>";
  body += "Thanks,<br>" + scheduleList[0].LabName;
  body += "</body></html>";

  return body;
}

/**
 * Build the auto-rejection/follow-up reminder email body (shared lab table style).
 * Sent to researchers about unresolved tentative/rescheduling/no-show appointments.
 */
function buildRejectionReminderBody(researcherName, scheduleList, timeZone) {
  const TH =
    "style = 'background: #245c54; color: white; border: 1px solid #d5e2dc; padding: 0.5rem; text-align: center; font-size: 14px;'";

  var body = "<!DOCTYPE html><html><head>";
  body += "</head><body>Hi " + researcherName + ",<br><br>";

  body +=
    "<p><strong>You attempted to schedule the following appointments a week ago, but the families have not responded yet. Would you like to follow up with them again? If not, the system will mark these schedules as rejected a week from today, and the families will be available for other studies.</strong></p>";

  body += '<table style="width:100%; border-collapse: collapse !important;">';
  body +=
    "<tr><th width='15%'" +
    TH +
    ">Study name</th>" +
    "<th width='18%' " +
    TH +
    ">Parent</th>" +
    "<th width='15%' " +
    TH +
    ">Email</th>" +
    "<th width='10%' " +
    TH +
    ">Status</th>" +
    "<th width='15%' " +
    TH +
    ">Last contact</th></tr>";

  scheduleList.forEach((schedule, index) => {
    const style = rowStyle(index);
    body += "<tr>";
    body += style + schedule.StudyName + "</td>";
    body += style + schedule.Name + "</td>";
    body += style + schedule.Email + "</td>";
    body += style + schedule.Status + "</td>";
    body +=
      style +
      formatDateInTimezone(
        schedule.updatedAt,
        "MMM Do [at] h:mma",
        timeZone
      ) +
      "</td>";
    body += "</tr>";
  });

  body += "</table><br><br>";
  body += "Thanks,<br>" + scheduleList[0].LabName;
  body += "</body></html>";

  return body;
}

/**
 * Build the experimenter reminder email body (shared primary and secondary tables).
 * Sent to experimenters about their studies tomorrow.
 */
function buildExperimenterReminderBody(experimenter, timeZone) {
  const TH = "style='background:#245c54;color:white;border:1px solid #d5e2dc;padding:6px;text-align:left;vertical-align:top;font-size:12px;line-height:16px;word-break:normal;'";
  const tableHeader = (partnerLabel) =>
    '<table cellpadding="0" cellspacing="0" style="width:100%;table-layout:fixed;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:17px;">' +
    "<tr>" + [[14, "Time"], [20, "Study"], [24, "Parent"], [12, "Child"], [20, partnerLabel], [10, "Zoom"]]
      .map(([width, label]) => `<th scope="col" width="${width}%" ${TH}>${label}</th>`).join("") + "</tr>";
  const cellStyle = (index) => `<td style="background:${index % 2 ? '#eef4f1' : '#ffffff'};border:1px solid #d5e2dc;padding:6px;text-align:left;vertical-align:top;font-size:12px;line-height:17px;overflow-wrap:anywhere;">`;
  const zoomLink = (value) => {
    try {
      const url = new URL(value);
      if (!["https:", "http:"].includes(url.protocol)) return "Not available";
      return `<a href="${escapeHtml(url.href)}" style="color:#245c54;text-decoration:underline;white-space:nowrap;">Join</a>`;
    } catch { return "Not available"; }
  };

  var body = "<!DOCTYPE html><html><head>";
  body += "</head><body>Hi ";

  if (
    experimenter.PrimaryExperimenterof.length +
      experimenter.SecondaryExperimenterof.length >
    1
  ) {
    body +=
      experimenter.Name.split(" ")[0] +
      ",<br><br>The following are your studies tomorrow! Good luck! :)<br><br>";
  } else {
    body +=
      experimenter.Name.split(" ")[0] +
      ",<br><br>The following is your study tomorrow! Good luck! :)<br><br>";
  }

  body += `<p style="margin:0 0 12px;font-size:12px;line-height:17px;">All study times: ${escapeHtml(timeZone || "local timezone")}</p>`;

  // Primary experimenter table
  if (experimenter.PrimaryExperimenterof.length > 0) {
    body += '<h2 style="font-size:18px;line-height:24px;margin:20px 0 12px;">Primary experimenter</h2>';
    body += tableHeader("Partner (E2)");

    experimenter.PrimaryExperimenterof.forEach((appointmentPri, index) => {
      var E2 = appointmentPri.SecondaryExperimenter.map((e2) => {
        return escapeHtml(e2.Name) + "<br>" + escapeHtml(e2.Email);
      });

      var E22 = "";
      if (appointmentPri.SecondaryExperimenter.length > 0) {
        E22 = E2.join("<br>");
      } else {
        E22 = "not assigned";
      }

      if (!appointmentPri.Child.Family.NamePrimary) {
        appointmentPri.Child.Family.NamePrimary = "";
      }

      var parentName = "Parent Name N/A";
      if (!!appointmentPri.Child.Family.NamePrimary) {
        parentName = appointmentPri.Child.Family.NamePrimary.split(" ")[0];
      }

      const parent =
        parentName +
        "<br>" +
        PhoneFormated(appointmentPri.Child.Family.Phone) +
        "<br>" +
        appointmentPri.Child.Family.Email;

      const ZoomLink = zoomLink(experimenter.ZoomLink);

      const style = cellStyle(index);

      var childName = "Child name N/A";
      if (appointmentPri.Child.Name) {
        childName = appointmentPri.Child.Name.split(" ")[0];
      }

      body += "<tr>";
      body +=
        style +
        formatDateInTimezone(
          appointmentPri.Schedule.AppointmentTime,
          "MMM D[<br>]h:mm A",
          timeZone
        ) +
        "</td>";
      body += style + appointmentPri.Study.StudyName + "</td>";
      body += style + parent + "</td>";
      body += style + childName + "</td>";
      body += style + E22 + "</td>";
      body += style + ZoomLink + "</td>";
      body += "</tr>";
    });

    body += "</table>";
  }

  // Secondary experimenter table
  if (experimenter.SecondaryExperimenterof.length > 0) {
    body += '<h2 style="font-size:18px;line-height:24px;margin:20px 0 12px;">Secondary experimenter</h2>';
    body += tableHeader("Partner(s)");

    experimenter.SecondaryExperimenterof.forEach((appointmentSec, index) => {
      var E1 = appointmentSec.PrimaryExperimenter.map((e1) => {
        return escapeHtml(e1.Name) + "<br>" + escapeHtml(e1.Email);
      });

      var E2 = appointmentSec.SecondaryExperimenter.map((e2) => {
        if (e2.Email !== experimenter.Email) {
          return escapeHtml(e2.Name) + "<br>" + escapeHtml(e2.Email);
        }
      });

      var E22 = "";
      if (E2.length > 1) {
        E22 = E2.join("<br>");
        E22 = "E2: " + E22;
        E1[0] = "E1: " + E1[0] + "<br>" + E22;
      }

      if (!appointmentSec.Child.Family.NamePrimary) {
        appointmentSec.Child.Family.NamePrimary = "";
      }

      var parentName = "Parent Name N/A";
      if (!!appointmentSec.Child.Family.NamePrimary) {
        parentName = appointmentSec.Child.Family.NamePrimary.split(" ")[0];
      }

      const parent =
        parentName +
        "<br>" +
        PhoneFormated(appointmentSec.Child.Family.Phone) +
        "<br>" +
        appointmentSec.Child.Family.Email;

      const ZoomLink = zoomLink(appointmentSec.PrimaryExperimenter[0]?.ZoomLink);

      const style = cellStyle(index);

      var childName = "Child name N/A";
      if (appointmentSec.Child.Name) {
        childName = appointmentSec.Child.Name.split(" ")[0];
      }

      body += "<tr>";
      body +=
        style +
        formatDateInTimezone(
          appointmentSec.Schedule.AppointmentTime,
          "MMM D[<br>]h:mm A",
          timeZone
        ) +
        "</td>";
      body += style + appointmentSec.Study.StudyName + "</td>";
      body += style + parent + "</td>";
      body += style + childName + "</td>";
      body += style + E1[0] + "</td>";
      body += style + ZoomLink + "</td>";
      body += "</tr>";
    });
    body += "</table>";
  }

  body += "<br><br>";
  body += "Best,<br>" + experimenter.Lab.LabName;
  body += "</body></html>";

  return body;
}

module.exports = {
  buildFamilyReminderBody,
  buildManualReminderBody,
  buildCompletionReminderBody,
  buildRejectionReminderBody,
  buildExperimenterReminderBody,
};
