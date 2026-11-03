<template>
  <v-card class="ds-card mb-6" variant="flat">
    <v-toolbar color="transparent" density="compact" class="px-2">
      <v-icon class="mr-2" color="primary">mdi-email-check-outline</v-icon>
      <span class="text-subtitle-1 font-weight-bold">Reminder Email Tests</span>
    </v-toolbar>
    <v-divider />
    <v-card-text>
      <p class="mb-4">Preview complete reminders with linked sample family, child, study, and appointment records. Uses your lab’s saved theme, logo, contact details, and timezone.</p>
      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">{{ error }}</v-alert>
      <v-progress-linear v-if="loadingOptions" indeterminate color="primary" class="mb-3" />
      <v-btn v-if="!loaded && !loadingOptions" variant="tonal" @click="load">Retry</v-btn>
      <template v-if="loaded">
        <v-row>
          <v-col cols="12" md="5">
            <v-select v-model="type" :items="types" item-title="label" item-value="id" label="Reminder type" variant="outlined" density="compact" :disabled="sending" />
            <v-select v-model="studyId" :items="studies" item-title="StudyName" item-value="id" label="Study (optional)" placeholder="Example study" clearable variant="outlined" density="compact" :disabled="sending" />
            <p class="text-body-2 text-medium-emphasis mb-4">Choose a study to use its saved reminder snippet and name. An example snippet is used when none is saved. Family names and appointment details are fictional.</p>
            <v-btn variant="text" size="small" prepend-icon="mdi-refresh" :loading="loadingPreview" :disabled="sending" class="mb-4" @click="refreshPreview">Refresh preview</v-btn>
            <v-form ref="testForm" @submit.prevent="sendTest">
              <v-text-field v-model="recipient" label="Test recipient email" type="email" autocomplete="email" :rules="recipientRules" :disabled="sending" variant="outlined" density="compact" />
              <v-btn color="primary" type="submit" prepend-icon="mdi-send" :loading="sending" :disabled="!recipient.trim() || !html || loadingPreview">Send test reminder</v-btn>
            </v-form>
            <p class="text-caption text-medium-emphasis mt-3">Sent from the lab’s connected email account with [TEST] in the subject. Only the address entered above receives it; no appointments are created or updated.</p>
            <v-alert v-if="sendError" type="error" variant="tonal" density="compact" class="mt-3">{{ sendError }}</v-alert>
            <v-alert v-if="success" type="success" variant="tonal" density="compact" class="mt-3" role="status">{{ success }}</v-alert>
          </v-col>
          <v-col cols="12" md="7">
            <p v-if="subject" class="text-body-2 font-weight-bold mb-2">{{ subject }}</p>
            <v-progress-linear v-if="loadingPreview" indeterminate color="primary" class="mb-2" />
            <iframe v-if="html" :srcdoc="html" title="Sample reminder email preview" sandbox="" class="reminder-preview"></iframe>
          </v-col>
        </v-row>
      </template>
    </v-card-text>
  </v-card>
</template>

<script>
import api from "@/services/api";

export default {
  props: { labId: { type: [Number, String], required: true }, brandingVersion: Number },
  data: () => ({
    types: [], studies: [], type: "family-inperson", studyId: null,
    loaded: false, loadingOptions: false, loadingPreview: false, sending: false,
    html: "", subject: "", recipient: "", error: "", sendError: "", success: "", version: 0,
    recipientRules: [value => !!value?.trim() || "Enter a recipient email address.", value => /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(value?.trim() || "") || "Enter one valid email address."],
  }),
  watch: { type: "refreshPreview", studyId: "refreshPreview", brandingVersion: "refreshPreview" },
  mounted() { this.load(); },
  beforeUnmount() { this.version++; },
  methods: {
    payload() { return { lab: this.labId, type: this.type, studyId: this.studyId }; },
    message(error, fallback) { return error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || error.response?.data?.error?.message || fallback; },
    async load() {
      this.loadingOptions = true; this.error = "";
      try {
        const { data } = await api().post("gmail/reminder-test-options", { lab: this.labId });
        this.types = data.types; this.studies = data.studies; this.loaded = true;
        await this.refreshPreview();
      } catch (error) { this.error = this.message(error, "Unable to load reminder tests."); }
      finally { this.loadingOptions = false; }
    },
    async refreshPreview() {
      if (!this.loaded) return;
      const version = ++this.version;
      this.loadingPreview = true; this.error = ""; this.html = ""; this.subject = ""; this.success = ""; this.sendError = "";
      try {
        const { data } = await api().post("gmail/reminder-preview", this.payload());
        if (version === this.version) { this.html = data.htmlBody; this.subject = data.subject; }
      } catch (error) { if (version === this.version) this.error = this.message(error, "Unable to preview the reminder."); }
      finally { if (version === this.version) this.loadingPreview = false; }
    },
    async sendTest() {
      if (this.sending || !this.html || this.loadingPreview) return;
      this.sending = true; this.sendError = ""; this.success = "";
      try {
        const { valid } = await this.$refs.testForm.validate();
        if (!valid) return;
        const to = this.recipient.trim();
        await api().post("gmail/send-reminder-test", { ...this.payload(), to });
        this.success = `Test reminder sent to ${to}.`;
      } catch (error) { this.sendError = this.message(error, "Unable to send the test reminder."); }
      finally { this.sending = false; }
    },
  },
};
</script>

<style scoped>
.reminder-preview { display:block; width:100%; height:560px; border:1px solid #d5dcd8; border-radius:6px; background:#f3f4f2; }
</style>
