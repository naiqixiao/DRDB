<template>
  <v-container fluid style="max-width: 960px; margin-top: 24px">
    <!-- Page Header -->
    <div class="section-header" style="margin-top: 0">
      <v-icon class="section-header__icon">mdi-email-fast-outline</v-icon>
      <h2 class="section-header__title">Email Test Console</h2>
    </div>
    <p class="text-muted" style="margin-bottom: 24px">
      Test the refactored email utility by sending real emails using the
      backend templates. Choose a template below to auto-fill with mock data,
      then send.
    </p>

    <!-- Template Selector -->
    <v-card class="ds-card" variant="flat" style="padding: 20px; margin-bottom: 20px">
      <p class="text-label" style="margin-bottom: 10px">Load Template</p>

      <!-- Account / User templates -->
      <p class="text-muted" style="font-size: 0.75rem; margin-bottom: 6px">Account &amp; User</p>
      <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px">
        <v-btn
          v-for="tpl in accountTemplates"
          :key="tpl.id"
          :color="selectedTemplate === tpl.id ? 'primary' : undefined"
          :variant="selectedTemplate === tpl.id ? 'flat' : 'outlined'"
          size="small"
          @click="loadTemplate(tpl.id)"
          :prepend-icon="tpl.icon"
        >
          {{ tpl.label }}
        </v-btn>
      </div>

      <!-- Reminder templates -->
      <p class="text-muted" style="font-size: 0.75rem; margin-bottom: 6px">Reminders (from reminder.js)</p>
      <div style="display: flex; flex-wrap: wrap; gap: 8px">
        <v-btn
          v-for="tpl in reminderTemplates"
          :key="tpl.id"
          :color="selectedTemplate === tpl.id ? 'primary' : undefined"
          :variant="selectedTemplate === tpl.id ? 'flat' : 'outlined'"
          size="small"
          @click="loadTemplate(tpl.id)"
          :prepend-icon="tpl.icon"
        >
          {{ tpl.label }}
        </v-btn>
      </div>

      <p
        v-if="selectedTemplate"
        class="text-muted"
        style="margin-top: 10px; font-size: 0.8rem"
      >
        <v-icon size="14">mdi-information-outline</v-icon>
        {{ templateDescription }}
      </p>
    </v-card>

    <!-- Email Form -->
    <v-card class="ds-card" variant="flat" style="padding: 24px">
      <v-card-title class="text-h6" style="padding: 0 0 16px 0">
        <v-icon start>mdi-shield-account-outline</v-icon>
        Send Admin Email
      </v-card-title>

      <v-form ref="adminForm" v-model="adminFormValid">
        <v-row dense>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="adminEmail.to"
              label="To *"
              placeholder="Name <email@example.com>"
              variant="outlined"
              density="compact"
              :rules="[rules.required]"
              hide-details="auto"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model="adminEmail.subject"
              label="Subject *"
              placeholder="Test email subject"
              variant="outlined"
              density="compact"
              :rules="[rules.required]"
              hide-details="auto"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model="adminEmail.cc"
              label="CC"
              placeholder="optional"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model="adminEmail.bcc"
              label="BCC"
              placeholder="optional"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>

          <v-col cols="12">
            <v-textarea
              v-model="adminEmail.htmlBody"
              label="HTML Body *"
              placeholder="<p>Hello from the Email Test Console!</p>"
              variant="outlined"
              density="compact"
              rows="6"
              :rules="[rules.required]"
              hide-details="auto"
              style="font-family: 'Fira Code', monospace; font-size: 0.8rem"
            />
          </v-col>
        </v-row>
      </v-form>

      <!-- Preview -->
      <div v-if="adminEmail.htmlBody" style="margin-top: 16px">
        <p class="text-label" style="margin-bottom: 4px">
          Email Preview
        </p>
        <div
          style="
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px 24px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            color: #333;
            line-height: 1.6;
          "
        >
          <div
            style="
              border-bottom: 1px solid #eee;
              padding-bottom: 12px;
              margin-bottom: 16px;
              font-size: 0.8rem;
              color: #666;
            "
          >
            <div><strong>To:</strong> {{ adminEmail.to }}</div>
            <div v-if="adminEmail.cc"><strong>CC:</strong> {{ adminEmail.cc }}</div>
            <div><strong>Subject:</strong> {{ adminEmail.subject }}</div>
          </div>
          <div v-html="adminEmail.htmlBody"></div>
        </div>
      </div>

      <v-card-actions style="padding: 16px 0 0 0">
        <v-btn
          variant="text"
          color="grey"
          @click="clearForm"
          prepend-icon="mdi-eraser"
        >
          Clear
        </v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          variant="flat"
          :loading="adminSending"
          :disabled="!adminFormValid"
          @click="sendAdminTestEmail"
          prepend-icon="mdi-send"
        >
          Send Test Email
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Results Log -->
    <v-card
      v-if="results.length > 0"
      class="ds-card"
      variant="flat"
      style="padding: 24px; margin-top: 20px"
    >
      <v-card-title class="text-h6" style="padding: 0 0 12px 0">
        <v-icon start>mdi-console</v-icon>
        Results
        <v-spacer />
        <v-btn
          size="small"
          variant="text"
          color="error"
          @click="results = []"
          prepend-icon="mdi-delete-outline"
        >
          Clear
        </v-btn>
      </v-card-title>

      <div
        v-for="(result, index) in results"
        :key="index"
        :class="['info-field', result.success ? 'info-field--highlight' : '']"
        style="margin-bottom: 8px"
      >
        <div style="display: flex; align-items: center; gap: 8px">
          <v-icon :color="result.success ? 'success' : 'error'" size="20">
            {{ result.success ? "mdi-check-circle" : "mdi-alert-circle" }}
          </v-icon>
          <span class="info-field__label" style="text-transform: none">
            {{ result.timestamp }}
            <span v-if="result.template" style="opacity: 0.7">
              · {{ result.template }}
            </span>
          </span>
        </div>
        <span
          class="info-field__value"
          :style="{ color: result.success ? '#10B981' : '#EF4444' }"
        >
          {{ result.message }}
        </span>
        <span
          v-if="result.details"
          class="info-field__value"
          style="font-size: 0.75rem; color: #64748b"
        >
          To: {{ result.details.to }} · Subject: {{ result.details.subject }}
        </span>
      </div>
    </v-card>
  </v-container>
</template>

<script>
import api from "@/services/api";

// Mock data for templates
const MOCK = {
  name: "Dr. Jane Smith",
  firstName: "Jane",
  email: "jane.smith@example.com",
  role: "Lab manager",
  password: "xK9mQ3vB7nR2",
  appUrl: "https://drdb.example.com",
  feedbackEmail: "researcher@mcmaster.ca",
  feedbackTitle: "Calendar button not working on Firefox",
  feedbackPage: "Schedule",
  feedbackContent:
    "<p>When I click the 'Add to Calendar' button on the Schedule page using Firefox 120, nothing happens. It works fine in Chrome. Could be a browser compatibility issue.</p>",
  // Reminder mock data
  labName: "McMaster BabyLab",
  labEmail: "babylab@mcmaster.ca",
  parentName: "Sarah",
  parentEmail: "sarah.johnson@gmail.com",
  childName: "Liam",
  experimenterName: "Alex Chen",
  experimenterEmail: "chena3@mcmaster.ca",
  e2Name: "Priya Patel",
  e2Email: "patelp7@mcmaster.ca",
  studyName: "Infant Visual Attention Study",
  studyName2: "Language Development Study",
  tomorrowTime: "10:30am",
  tomorrowDate: "Mar 15th",
  phone: "(905) 525-9140",
};

// Table styles matching the backend reminder.js
const TH_OLIVE = "style='background:olive;border:1px solid #999;padding:0.5rem;text-align:center;font-size:18;color:white;'";
const TH_BLUE = "style='background:lightblue;border:1px solid #999;padding:0.5rem;text-align:center;font-size:18;'";
const TH_GREEN = "style='background:lightgreen;border:1px solid #999;padding:0.5rem;text-align:center;font-size:18;'";
const TH_RED = "style='background:tomato;border:1px solid #999;padding:0.5rem;text-align:center;font-size:18;'";
const TRO = "<td style='background:white !important;border:1px solid #999;padding:0.5rem;text-align:center;'>";
const TRE = "<td style='background:#e8e7e1 !important;border:1px solid #999;padding:0.5rem;text-align:center;'>";

const ACCOUNT_TEMPLATES = [
  {
    id: "lab-welcome",
    label: "Lab Welcome",
    icon: "mdi-flask-outline",
    description:
      "Sent by labService.createLab() when a new lab is created. Goes to the first personnel (PI/manager).",
    to: `${MOCK.name} <${MOCK.email}>`,
    subject: "Your user account has been created!",
    htmlBody:
      `<p>Hello ${MOCK.firstName},</p> ` +
      `<p>Welcome to the developmental research management system!</p>` +
      `<p>Your role is <b>${MOCK.role}</b>, and your temporary password is <b><em>${MOCK.password}</em></b>. ` +
      `Please login with your email and temporary password at <a href="${MOCK.appUrl}">${MOCK.appUrl}</a> to set your password.` +
      `<br><b>If you're the lab manager, please update your lab email template in the Settings page.</p> ` +
      `<p><a href='https://docs.google.com/document/d/1oaucm_FrpTxsO7UcOb-r-Y2Ck2zBe1G-BMvw_MD18N0/edit?usp=sharing'>A brief manual</a></p>` +
      `<p><a href='https://mcmasteru365-my.sharepoint.com/:p:/g/personal/xiaon8_mcmaster_ca/ERk1uev-LENDrca6aWXwSqYBAn1J1OEsJ3tNjPkbpvcwtA?e=Gz73ZK'>How to set up a Google account to activate email and calendar functions.</a></p>` +
      `<p>Thank you!<br>Developmental Research Management System</p>`,
  },
  {
    id: "user-signup",
    label: "User Signup",
    icon: "mdi-account-plus-outline",
    description:
      "Sent by user.js signup/signupBatch when a new user account is created.",
    to: `${MOCK.name} <${MOCK.email}>`,
    subject: "Your user account has been created!",
    htmlBody:
      `<p>Hello ${MOCK.firstName},</p> ` +
      `<p>Welcome to the developmental research management system!<br>` +
      `Your role is <b>${MOCK.role}</b>, and your temporary password is <b><em>${MOCK.password}</em></b>. ` +
      `Please login with your email and temporary password at <a href="${MOCK.appUrl}">${MOCK.appUrl}</a> to set your password.` +
      `<br><b>If you're the lab manager, please update your lab email template in the Settings page.</p> ` +
      `<p><a href='https://docs.google.com/document/d/1oaucm_FrpTxsO7UcOb-r-Y2Ck2zBe1G-BMvw_MD18N0/edit?usp=sharing'>A brief manual</a><br>` +
      `<a href='https://mcmasteru365-my.sharepoint.com/:p:/g/personal/xiaon8_mcmaster_ca/ERk1uev-LENDrca6aWXwSqYBAn1J1OEsJ3tNjPkbpvcwtA?e=Gz73ZK'>How to set up a Google account to activate email and calendar functions.</a></p>` +
      `<p> </p>` +
      `<p>Thank you! <br>Developmental Research Management System</p>`,
  },
  {
    id: "password-changed",
    label: "Password Changed",
    icon: "mdi-lock-check-outline",
    description:
      "Sent by user.js changePassword when a user successfully changes their password.",
    to: `${MOCK.name} <${MOCK.email}>`,
    subject: "Your login password is updated.",
    htmlBody:
      `<p>Hello ${MOCK.firstName},</p> ` +
      `<p>Your login password has recently been changed. <br>` +
      `If you didn't change your password, please contact your lab manager as soon as possible.</p> ` +
      `<p> </p>` +
      `<p>Thank you!<br>Developmental Research Management System</p>`,
  },
  {
    id: "password-reset",
    label: "Password Reset",
    icon: "mdi-lock-reset",
    description:
      "Sent by user.js resetPassword when an admin resets a user's password.",
    to: `${MOCK.name} <${MOCK.email}>`,
    subject: "Your password is reset",
    htmlBody:
      `<p>Hello ${MOCK.firstName},</p> ` +
      `<p>You login password is reset, and the temporary passwor is: <b>${MOCK.password}</b></p> ` +
      `<p>Please login to change your password.<br> ` +
      `<p><a href='https://docs.google.com/document/d/1oaucm_FrpTxsO7UcOb-r-Y2Ck2zBe1G-BMvw_MD18N0/edit?usp=sharing'>A brief manual</a><br>` +
      `<a href='https://mcmasteru365-my.sharepoint.com/:p:/g/personal/xiaon8_mcmaster_ca/ERk1uev-LENDrca6aWXwSqYBAn1J1OEsJ3tNjPkbpvcwtA?e=Gz73ZK'>How to set up a Google account to activate email and calendar functions.</a></p>` +
      `<p> </p>` +
      `<p>Thank you! <br>Developmental Research Management System</p>`,
  },
  {
    id: "feedback",
    label: "Feedback",
    icon: "mdi-message-alert-outline",
    description:
      "Sent by feedback.js create when a user submits feedback from the app.",
    to: "babylab@mcmaster.ca",
    cc: MOCK.feedbackEmail,
    subject: `[DRDB feedback] ${MOCK.feedbackTitle}`,
    htmlBody:
      `<p> from ${MOCK.feedbackEmail}<p>` +
      `<p> on ${MOCK.feedbackPage} Page<p>` +
      `<p>====================<p>` +
      MOCK.feedbackContent,
  },
];

const REMINDER_TEMPLATES = [
  {
    id: "reminder-family",
    label: "Family Reminder",
    icon: "mdi-calendar-alert",
    description:
      "Sent by reminder.js reminderEmail to parents the day before an in-person study appointment.",
    to: `${MOCK.parentName} <${MOCK.parentEmail}>`,
    subject: `Reminder for your study appointment with ${MOCK.childName}`,
    htmlBody:
      `<p>Dear ${MOCK.parentName},</p>` +
      `<p>Hope you are doing great! This is a reminder for your visit to ${MOCK.labName} with <b>${MOCK.childName} tomorrow at ${MOCK.tomorrowTime}</b>.</p>` +
      `<p>Our lab is located at Psychology Building, McMaster University. There are 3 parking lots in front of the building that you can park when you come. We will wait for you at the parking lot.</p>` +
      `<p><b>${MOCK.childName}</b> will be sitting on your lap and watch a short clip of videos on a screen in front of them. The study will last for about 10 minutes.</p>` +
      `<p>Please feel free to let us know if you wish to change the time for your study. You can either send us an email.</p>` +
      `<p>Best,</p><p>${MOCK.experimenterName}</p><p>Research Assistant</p><p>${MOCK.labName}</p>`,
  },
  {
    id: "reminder-completion",
    label: "Completion Reminder",
    icon: "mdi-clipboard-check-outline",
    description:
      "Sent by reminder.js autoCompletionReminder to experimenters asking them to confirm yesterday's study completions.",
    to: `${MOCK.experimenterName} <${MOCK.experimenterEmail}>`,
    subject: "[DRDB] Study confirmation reminder",
    htmlBody:
      `<!DOCTYPE html><html><head></head><body>Hi ${MOCK.experimenterName.split(" ")[0]},<br><br>` +
      `<p><strong>According to the system, you were the primary experimenter for the following studies yesterday. How did it go?</strong></p>` +
      `<p>If any of the families below failed to show up or requested rescheduling, please update the appointment status accordingly. Otherwise, the system will mark the study as completed tomorrow, and the families will be available for other studies.</p>` +
      `<table style="width:90%; border-collapse: collapse !important;">` +
      `<tr><th width='15%' ${TH_OLIVE}>Study time (EST)</th><th width='15%' ${TH_OLIVE}>Study name</th><th width='18%' ${TH_OLIVE}>Parent</th><th width='20%' ${TH_OLIVE}>Email</th></tr>` +
      `<tr>${TRO}${MOCK.tomorrowDate} at ${MOCK.tomorrowTime}</td>${TRO}${MOCK.studyName}</td>${TRO}${MOCK.parentName}</td>${TRO}${MOCK.parentEmail}</td></tr>` +
      `<tr>${TRE}${MOCK.tomorrowDate} at 2:00pm</td>${TRE}${MOCK.studyName2}</td>${TRE}Michael Wong</td>${TRE}mwong@gmail.com</td></tr>` +
      `</table><br><br>` +
      `Thanks,<br>${MOCK.labName}</body></html>`,
  },
  {
    id: "reminder-followup",
    label: "Follow-Up Reminder",
    icon: "mdi-clock-alert-outline",
    description:
      "Sent by reminder.js autoRejectionReminder to researchers about unresolved tentative/rescheduling/no-show appointments.",
    to: `${MOCK.experimenterName} <${MOCK.experimenterEmail}>`,
    subject: "[DRDB] Study follow-up reminder",
    htmlBody:
      `<!DOCTYPE html><html><head></head><body>Hi ${MOCK.experimenterName.split(" ")[0]},<br><br>` +
      `<p><strong>You attempted to schedule the following appointments a week ago, but the families have not responded yet. Would you like to follow up with them again? If not, the system will mark these schedules as rejected a week from today, and the families will be available for other studies.</strong></p>` +
      `<table style="width:90%; border-collapse: collapse !important;">` +
      `<tr><th width='15%' ${TH_RED}>Study name</th><th width='18%' ${TH_RED}>Parent</th><th width='15%' ${TH_RED}>Email</th><th width='10%' ${TH_RED}>Status</th><th width='15%' ${TH_RED}>Last contact</th></tr>` +
      `<tr>${TRO}${MOCK.studyName}</td>${TRO}${MOCK.parentName}</td>${TRO}${MOCK.parentEmail}</td>${TRO}TBD</td>${TRO}Mar 8th at 3:15pm</td></tr>` +
      `<tr>${TRE}${MOCK.studyName2}</td>${TRE}Michael Wong</td>${TRE}mwong@gmail.com</td>${TRE}No Show</td>${TRE}Mar 7th at 11:00am</td></tr>` +
      `</table><br><br>` +
      `Thanks,<br>${MOCK.labName}</body></html>`,
  },
  {
    id: "reminder-experimenter",
    label: "Experimenter Reminder",
    icon: "mdi-account-clock-outline",
    description:
      "Sent by reminder.js reminderEmailforExperimenters to experimenters with details of their studies tomorrow.",
    to: `${MOCK.experimenterName} <${MOCK.experimenterEmail}>`,
    subject: "[DRDB] Reminder for upcoming studies",
    htmlBody:
      `<!DOCTYPE html><html><head></head><body>Hi ${MOCK.experimenterName.split(" ")[0]},<br><br>` +
      `The following are your studies tomorrow! Good luck! :)<br><br>` +
      `<h2>Studies that you are the primary experimenter: </h2>` +
      `<table style="width:90%; border-collapse: collapse !important;">` +
      `<tr><th width='15%' ${TH_BLUE}>Study time (EST)</th><th width='15%' ${TH_BLUE}>Study name</th><th width='18%' ${TH_BLUE}>Parent</th><th width='7%' ${TH_BLUE}>Child</th><th width='20%' ${TH_BLUE}>Partner (E2)</th><th width='25%' ${TH_BLUE}>Zoom link</th></tr>` +
      `<tr>${TRO}${MOCK.tomorrowDate} at ${MOCK.tomorrowTime}</td>${TRO}${MOCK.studyName}</td>${TRO}${MOCK.parentName}<br>${MOCK.phone}<br>${MOCK.parentEmail}</td>${TRO}${MOCK.childName}</td>${TRO}${MOCK.e2Name} (${MOCK.e2Email})</td>${TRO}not available</td></tr>` +
      `</table>` +
      `<h2>Studies that you are the secondary experimenter:</h2>` +
      `<table style="width:90%; border-collapse: collapse !important;">` +
      `<tr><th width='15%' ${TH_GREEN}>Study time (EST)</th><th width='15%' ${TH_GREEN}>Study name</th><th width='18%' ${TH_GREEN}>Parent</th><th width='7%' ${TH_GREEN}>Child</th><th width='20%' ${TH_GREEN}>Partner(s)</th><th width='25%' ${TH_GREEN}>Zoom link</th></tr>` +
      `<tr>${TRO}${MOCK.tomorrowDate} at 2:00pm</td>${TRO}${MOCK.studyName2}</td>${TRO}Michael<br>(416) 555-0199<br>mwong@gmail.com</td>${TRO}Emma</td>${TRO}E1: ${MOCK.e2Name} (${MOCK.e2Email})</td>${TRO}not available</td></tr>` +
      `</table><br><br>` +
      `Best,<br>${MOCK.labName}</body></html>`,
  },
];

const ALL_TEMPLATES = [...ACCOUNT_TEMPLATES, ...REMINDER_TEMPLATES];

export default {
  data() {
    return {
      adminFormValid: false,
      adminSending: false,
      selectedTemplate: null,
      accountTemplates: ACCOUNT_TEMPLATES,
      reminderTemplates: REMINDER_TEMPLATES,
      adminEmail: {
        to: "",
        cc: "",
        bcc: "",
        subject: "",
        htmlBody: "",
      },
      results: [],
      rules: {
        required: (v) => !!v || "Required",
      },
    };
  },

  computed: {
    templateDescription() {
      const tpl = ALL_TEMPLATES.find((t) => t.id === this.selectedTemplate);
      return tpl ? tpl.description : "";
    },
  },

  methods: {
    loadTemplate(templateId) {
      const tpl = ALL_TEMPLATES.find((t) => t.id === templateId);
      if (!tpl) return;

      this.selectedTemplate = templateId;
      this.adminEmail.to = tpl.to;
      this.adminEmail.cc = tpl.cc || "";
      this.adminEmail.bcc = tpl.bcc || "";
      this.adminEmail.subject = tpl.subject;
      this.adminEmail.htmlBody = tpl.htmlBody;
    },

    clearForm() {
      this.selectedTemplate = null;
      this.adminEmail = {
        to: "",
        cc: "",
        bcc: "",
        subject: "",
        htmlBody: "",
      };
      this.$refs.adminForm?.reset();
    },

    async sendAdminTestEmail() {
      const { valid } = await this.$refs.adminForm.validate();
      if (!valid) return;

      this.adminSending = true;
      const timestamp = new Date().toLocaleTimeString();
      const templateLabel =
        ALL_TEMPLATES.find((t) => t.id === this.selectedTemplate)?.label ||
        "Custom";

      try {
        const response = await api().post("emailTest/send", {
          to: this.adminEmail.to,
          cc: this.adminEmail.cc || undefined,
          bcc: this.adminEmail.bcc || undefined,
          subject: this.adminEmail.subject,
          htmlBody: this.adminEmail.htmlBody,
        });

        this.results.unshift({
          success: true,
          timestamp,
          template: templateLabel,
          message:
            response.data.message +
            (response.data.messageId
              ? ` (ID: ${response.data.messageId})`
              : ""),
          details: {
            to: this.adminEmail.to,
            subject: this.adminEmail.subject,
          },
        });
      } catch (error) {
        const errorMsg =
          error.response?.data?.error?.message ||
          error.response?.data?.error ||
          error.message ||
          "Unknown error";

        this.results.unshift({
          success: false,
          timestamp,
          template: templateLabel,
          message: `Failed: ${errorMsg}`,
          details: {
            to: this.adminEmail.to,
            subject: this.adminEmail.subject,
          },
        });
      } finally {
        this.adminSending = false;
      }
    },
  },
};
</script>
