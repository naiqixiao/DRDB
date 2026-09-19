import api from "./api";

export default {
  emailPersonalization({ familyId, appointmentIds, emailType }) {
    return api().post("ai/email-personalization", {
      familyId,
      appointmentIds,
      emailType,
    });
  },
  polishEmail({ familyId, appointmentIds, emailType, subject, body }) {
    return api().post("ai/email-polish", {
      familyId,
      appointmentIds,
      emailType,
      subject,
      body,
    });
  },
  familySummary({ familyId }) {
    return api().post("ai/family-summary", {
      familyId,
    });
  },
};
