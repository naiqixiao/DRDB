import api from "./api";

export default {
  getScheduledJobs() {
    return api().get("jobs/scheduled");
  },

  updateScheduledJob(jobId, payload) {
    return api().put(`jobs/scheduled/${jobId}`, payload);
  },
};
