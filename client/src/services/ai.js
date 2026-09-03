import api from "./api";

export default {
  emailPersonalization({ familyId, appointmentIds, emailType }) {
    return api().post("ai/email-personalization", {
      familyId,
      appointmentIds,
      emailType,
    });
  },
};
