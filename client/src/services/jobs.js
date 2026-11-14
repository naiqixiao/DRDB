import api from "./api";

export default {
  getActivityReportSettings() {
    return api().get('jobs/activity-report');
  },
  updateActivityReportSettings(payload) {
    return api().put('jobs/activity-report', payload);
  },
  getScheduledJobs() {
    return api().get("jobs/scheduled");
  },

  updateScheduledJob(jobId, payload) {
    return api().put(`jobs/scheduled/${jobId}`, payload);
  },
};
