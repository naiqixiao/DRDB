<template>
  <v-container fluid style="max-width: 960px; margin-top: 24px">
    <!-- Page Header -->
    <div class="section-header" style="margin-top: 0">
      <v-icon class="section-header__icon">mdi-email-fast-outline</v-icon>
      <h2 class="section-header__title">Email Test Console</h2>
    </div>
    <p class="text-muted" style="margin-bottom: 24px">
      Test the actual backend email templates by rendering them with mock data on the server,
      then optionally sending a real email.
      Each template button calls the backend builder function directly.
    </p>

    <!-- Template Selector -->
    <v-card class="ds-card" variant="flat" style="padding: 20px; margin-bottom: 20px">
      <p class="text-label" style="margin-bottom: 10px">Load Template from Backend</p>

      <!-- Group templates by group name -->
      <div v-for="group in templateGroups" :key="group.name" style="margin-bottom: 14px">
        <p class="text-muted" style="font-size: 0.75rem; margin-bottom: 6px">{{ group.name }}</p>
        <div style="display: flex; flex-wrap: wrap; gap: 8px">
          <v-btn
            v-for="tpl in group.items"
            :key="tpl.id"
            :color="selectedTemplate === tpl.id ? 'primary' : undefined"
            :variant="selectedTemplate === tpl.id ? 'flat' : 'outlined'"
            size="small"
            :loading="loadingTemplate === tpl.id"
            @click="renderTemplate(tpl.id)"
            :prepend-icon="tpl.icon"
          >
            {{ tpl.label }}
          </v-btn>
        </div>
      </div>

      <!-- Description from backend -->
      <v-alert
        v-if="renderDescription"
        type="info"
        variant="tonal"
        density="compact"
        style="margin-top: 10px; font-size: 0.8rem"
      >
        <strong>Source:</strong> {{ renderDescription }}
      </v-alert>

      <v-alert
        v-if="renderError"
        type="error"
        variant="tonal"
        density="compact"
        style="margin-top: 10px"
      >
        {{ renderError }}
      </v-alert>
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
          <span v-if="selectedTemplate" style="font-weight: normal; opacity: 0.6; font-size: 0.75rem">
            — rendered by backend
          </span>
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
            <div v-if="adminEmail.from"><strong>From:</strong> {{ adminEmail.from }}</div>
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

export default {
  data() {
    return {
      adminFormValid: false,
      adminSending: false,
      selectedTemplate: null,
      loadingTemplate: null,
      renderDescription: "",
      renderError: "",
      templates: [],
      adminEmail: {
        to: "",
        from: "",
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
    templateGroups() {
      const groups = {};
      this.templates.forEach((tpl) => {
        if (!groups[tpl.group]) {
          groups[tpl.group] = { name: tpl.group, items: [] };
        }
        groups[tpl.group].items.push(tpl);
      });
      return Object.values(groups);
    },
  },

  async mounted() {
    try {
      const response = await api().get("emailTest/templates");
      this.templates = response.data;
    } catch (err) {
      console.error("Failed to load template catalog:", err);
    }
  },

  methods: {
    async renderTemplate(templateId) {
      this.loadingTemplate = templateId;
      this.renderError = "";
      this.renderDescription = "";

      try {
        const response = await api().get(`emailTest/render/${templateId}`);
        const data = response.data;

        this.selectedTemplate = templateId;
        this.adminEmail.to = data.to || "";
        this.adminEmail.from = data.from || "";
        this.adminEmail.cc = data.cc || "";
        this.adminEmail.bcc = data.bcc || "";
        this.adminEmail.subject = data.subject || "";
        this.adminEmail.htmlBody = data.htmlBody || "";
        this.renderDescription = data.description || "";
      } catch (err) {
        this.renderError =
          err.response?.data?.error ||
          err.message ||
          "Failed to render template";
      } finally {
        this.loadingTemplate = null;
      }
    },

    clearForm() {
      this.selectedTemplate = null;
      this.renderDescription = "";
      this.renderError = "";
      this.adminEmail = {
        to: "",
        from: "",
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

      // Find label from loaded templates
      const templateLabel =
        this.templates.find((t) => t.id === this.selectedTemplate)?.label ||
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
