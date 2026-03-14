/**
 * Reminder Email Templates
 *
 * All HTML email body construction for reminder emails.
 * Extracted from controllers/reminder.js for maintainability.
 */

const moment = require("moment");

// ─── Shared table styles ───────────────────────────────────────────
const TRO =
  "<td style = 'background: white !important; border: 1px solid #999; padding: 0.5rem; text-align: center; '>";
const TRE =
  "<td style = 'background: #e8e7e1 !important; border: 1px solid #999; padding: 0.5rem; text-align: center;'>";

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
function buildFamilyReminderBody(schedule) {
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
      moment(schedule.AppointmentTime).format(" [tomorrow at] h:mma") +
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
      moment(schedule.AppointmentTime).format(" [tomorrow at] h:mma") +
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
    body: formatedBody(opening + body + closing),
  };
}

/**
 * Build the manual reminder body (sent to the lab when the family has no email).
 * Returns { to, subject, body }.
 */
function buildManualReminderBody(schedule) {
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
    moment(schedule.AppointmentTime).format(
      " [on] dddd [(]MMM Do[)] [at] h:mma"
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
 * Build the auto-completion reminder email body (olive table).
 * Sent to experimenters asking them to confirm yesterday's study completions.
 */
function buildCompletionReminderBody(experimenterName, scheduleList) {
  const TH =
    "style = 'background: olive; border: 1px solid #999; padding: 0.5rem; text-align: center; font-size: 18; color: white;'";

  var body = "<!DOCTYPE html><html><head>";
  body += "</head><body>Hi " + experimenterName + ",<br><br>";

  body +=
    "<p><strong>According to the system, you were the primary experimenter for the following studies yesterday. How did it go?</strong></p>" +
    "<p>If any of the families below failed to show up or requested rescheduling, please update the appointment status accordingly. Otherwise, the system will mark the study as completed tomorrow, and the families will be available for other studies.</p>";

  body += '<table style="width:90%; border-collapse: collapse !important;">';
  body +=
    "<tr><th width='15%'" +
    TH +
    ">Study time (EST)</th>" +
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
      moment(schedule.AppointmentTime).format("MMM Do [at] h:mma") +
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
 * Build the auto-rejection/follow-up reminder email body (tomato/red table).
 * Sent to researchers about unresolved tentative/rescheduling/no-show appointments.
 */
function buildRejectionReminderBody(researcherName, scheduleList) {
  const TH =
    "style = 'background: tomato; border: 1px solid #999; padding: 0.5rem; text-align: center; font-size: 18;'";

  var body = "<!DOCTYPE html><html><head>";
  body += "</head><body>Hi " + researcherName + ",<br><br>";

  body +=
    "<p><strong>You attempted to schedule the following appointments a week ago, but the families have not responded yet. Would you like to follow up with them again? If not, the system will mark these schedules as rejected a week from today, and the families will be available for other studies.</strong></p>";

  body += '<table style="width:90%; border-collapse: collapse !important;">';
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
      moment(schedule.updatedAt).format("MMM Do [at] h:mma") +
      "</td>";
    body += "</tr>";
  });

  body += "</table><br><br>";
  body += "Thanks,<br>" + scheduleList[0].LabName;
  body += "</body></html>";

  return body;
}

/**
 * Build the experimenter reminder email body (blue primary + green secondary tables).
 * Sent to experimenters about their studies tomorrow.
 */
function buildExperimenterReminderBody(experimenter) {
  const TH =
    "style = 'background: lightblue; border: 1px solid #999; padding: 0.5rem; text-align: center; font-size: 18;'";
  const TH2nd =
    "style = 'background: lightgreen; border: 1px solid #999; padding: 0.5rem; text-align: center; font-size: 18;'";

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

  // Primary experimenter table
  if (experimenter.PrimaryExperimenterof.length > 0) {
    body += "<h2>Studies that you are the primary experimenter: </h2>";

    body += '<table style="width:90%; border-collapse: collapse !important;">';
    body +=
      "<tr><th width='15%'" + TH + ">Study time (EST)</th>" +
      "<th width='15%' " + TH + ">Study name</th>" +
      "<th width='18%' " + TH + ">Parent</th>" +
      "<th width='7%' " + TH + ">Child</th>" +
      "<th width='20%' " + TH + ">Partner (E2)</th>" +
      "<th width='25%' " + TH + ">Zoom link</th></tr>";

    experimenter.PrimaryExperimenterof.forEach((appointmentPri, index) => {
      var E2 = appointmentPri.SecondaryExperimenter.map((e2) => {
        return e2.Name + " (" + e2.Email + ")";
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

      const ZoomLink = experimenter.ZoomLink
        ? experimenter.ZoomLink
        : "not available";

      const style = rowStyle(index);

      var childName = "Child name N/A";
      if (appointmentPri.Child.Name) {
        childName = appointmentPri.Child.Name.split(" ")[0];
      }

      body += "<tr>";
      body +=
        style +
        moment(appointmentPri.Schedule.AppointmentTime).format(
          "MMM Do [at] h:mma"
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
    body += "<h2>Studies that you are the secondary experimenter:</h2>";

    body += '<table style="width:90%; border-collapse: collapse !important;">';
    body +=
      "<tr><th width='15%'" + TH2nd + ">Study time (EST)</th>" +
      "<th width='15%' " + TH2nd + ">Study name</th>" +
      "<th width='18%' " + TH2nd + ">Parent</th>" +
      "<th width='7%' " + TH2nd + ">Child</th>" +
      "<th width='20%' " + TH2nd + ">Partner(s)</th>" +
      "<th width='25%' " + TH2nd + ">Zoom link</th></tr>";

    experimenter.SecondaryExperimenterof.forEach((appointmentSec, index) => {
      var E1 = appointmentSec.PrimaryExperimenter.map((e1) => {
        return e1.Name + " (" + e1.Email + ")";
      });

      var E2 = appointmentSec.SecondaryExperimenter.map((e2) => {
        if (e2.Email !== experimenter.Email) {
          return e2.Name + " (" + e2.Email + ")";
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

      const ZoomLink = appointmentSec.PrimaryExperimenter[0].ZoomLink
        ? appointmentSec.PrimaryExperimenter[0].ZoomLink
        : "not available";

      const style = rowStyle(index);

      var childName = "Child name N/A";
      if (appointmentSec.Child.Name) {
        childName = appointmentSec.Child.Name.split(" ")[0];
      }

      body += "<tr>";
      body +=
        style +
        moment(appointmentSec.Schedule.AppointmentTime).format(
          "MMM Do [at] h:mma"
        ) +
        "</td>";
      body += style + appointmentSec.Study.StudyName + "</td>";
      body += style + parent + "</td>";
      body += style + childName + "</td>";
      body += style + E1[0] + "</td>";
      body += style + ZoomLink + "</td>";
      body += "</tr>";
    });
  }

  body += "</table><br><br>";
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
