<template>
  <div>
    <p class="text-body-2 text-medium-emphasis mb-2">Sample content with your lab’s saved email theme and footer. Confirmation and reminder samples include fictional appointment details; actual emails use the selected family’s scheduled date and time.</p>
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-2" aria-label="Updating email preview" />
    <v-alert v-if="error" type="warning" variant="tonal" density="compact" class="mb-2">
      {{ error }} <v-btn size="small" variant="text" @click="schedulePreview">Retry</v-btn>
    </v-alert>
    <v-form ref="testForm" class="mb-3" @submit.prevent="sendTest">
      <div class="d-flex flex-wrap align-start ga-2">
        <v-text-field v-model="testRecipient" label="Test recipient email" type="email" autocomplete="email" variant="outlined" density="compact" :disabled="sendingTest" :rules="recipientRules" hide-details="auto" style="min-width:200px;flex:1;" />
        <v-btn type="submit" color="primary" variant="tonal" :loading="sendingTest" :disabled="!active || !html || loading || !body || !testRecipient.trim()" prepend-icon="mdi-email-fast-outline">Send test email</v-btn>
      </div>
      <p class="text-caption text-medium-emphasis mt-2">Sends this sample with a [TEST] subject from the lab’s connected email account. Unsaved snippet edits are included.</p>
    </v-form>
    <v-alert v-if="testError" type="error" variant="tonal" density="compact" class="mb-3">{{ testError }}</v-alert>
    <v-alert v-if="testSuccess" type="success" variant="tonal" density="compact" class="mb-3" role="status">{{ testSuccess }}</v-alert>
    <iframe v-if="html" :srcdoc="html" :title="`${subject} sample preview`" sandbox="" class="email-layout-preview"></iframe>
  </div>
</template>

<script>
import email from "@/services/email";

export default {
  props: {
    body: { type: String, default: "" },
    subject: { type: String, required: true },
    labId: [String, Number],
    appointment: Object,
    active: { type: Boolean, default: true },
  },
  data: () => ({ html: "", error: "", loading: false, timer: null, version: 0,
    testRecipient: "", sendingTest: false, testError: "", testSuccess: "",
    recipientRules: [value => !!value?.trim() || "Enter a recipient email address.", value => /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(value?.trim() || "") || "Enter one valid email address."],
  }),
  watch: {
    active: { immediate: true, handler: "schedulePreview" },
    body: "schedulePreview",
    subject: "schedulePreview",
    labId: "schedulePreview",
    appointment: { deep: true, handler: "schedulePreview" },
  },
  beforeUnmount() { clearTimeout(this.timer); this.version++; },
  methods: {
    async sendTest() {
      if (this.sendingTest || !this.active || !this.html || this.loading) return;
      this.sendingTest = true;
      const { valid } = await this.$refs.testForm.validate();
      if (!valid) { this.sendingTest = false; return; }
      this.testError = ""; this.testSuccess = "";
      const recipient = this.testRecipient.trim();
      try {
        await email.sendTest({ lab: this.labId, to: recipient, subject: this.subject, body: this.body, appointment: this.appointment });
        this.testSuccess = `Test email sent to ${recipient}.`;
      } catch (error) {
        const detail = error.response?.data;
        this.testError = detail?.message || detail?.errors?.[0]?.msg || (typeof detail?.error === "string" ? detail.error : detail?.error?.message) || "Unable to send the test email. Please try again.";
      } finally { this.sendingTest = false; }
    },
    schedulePreview() {
      clearTimeout(this.timer);
      const version = ++this.version;
      this.html = "";
      this.error = "";
      this.loading = this.active;
      if (this.active) this.timer = setTimeout(() => this.refreshPreview(version), 350);
    },
    async refreshPreview(version) {
      try {
        const { data } = await email.preview({ lab: this.labId, subject: this.subject, body: this.body, appointment: this.appointment });
        if (version !== this.version) return;
        if (this.appointment && data.appointmentIncluded !== true) {
          this.error = "The backend is still using an older email renderer. Restart the backend, then click Retry to load the appointment card.";
          return;
        }
        this.html = data.htmlBody;
      } catch {
        if (version === this.version) this.error = "Unable to load the email layout preview.";
      } finally {
        if (version === this.version) this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.email-layout-preview { display:block; width:100%; height:520px; border:1px solid #e2e8f0; border-radius:6px; background:#f3f4f2; }
</style>
