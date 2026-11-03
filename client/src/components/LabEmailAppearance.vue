<template>
  <v-card class="ds-card mb-6" variant="flat">
    <v-toolbar color="transparent" density="compact" class="px-2">
      <v-icon class="mr-2" color="primary">mdi-palette-outline</v-icon>
      <span class="text-subtitle-1 font-weight-bold">Lab Email Appearance</span>
    </v-toolbar>
    <v-divider />
    <v-card-text>
      <p class="mb-4">Choose the colors and footer logo for emails from {{ labName || 'your lab' }}.</p>
      <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
      <v-alert v-if="saved" type="success" variant="tonal" class="mb-4">Email appearance saved.</v-alert>
      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
      <v-btn v-if="!loaded && !loading" variant="tonal" @click="load">Retry</v-btn>
      <template v-if="loaded">
        <v-row>
          <v-col cols="12" md="5">
            <h3 class="text-subtitle-1 font-weight-bold mb-3">Email theme</h3>
            <v-btn-toggle v-model="config.theme" mandatory aria-label="Email theme" class="theme-options mb-5" :disabled="saving || uploading">
              <v-btn v-for="theme in themes" :key="theme.id" :value="theme.id" variant="outlined" class="theme-choice" :aria-label="theme.name">
                <span class="theme-swatch" :style="{ backgroundColor: theme.accent }" aria-hidden="true"></span>{{ theme.name }}
              </v-btn>
            </v-btn-toggle>
            <h3 class="text-subtitle-1 font-weight-bold mb-2">Footer logo</h3>
            <p class="text-body-2 text-medium-emphasis mb-3">Optional PNG or JPEG, up to 2 MB. The logo appears below your message in the email footer.</p>
            <v-file-input v-model="logoFile" label="Upload lab logo" accept="image/png,image/jpeg" variant="outlined" density="compact" prepend-icon="" prepend-inner-icon="mdi-upload" :loading="uploading" :disabled="saving || uploading" @update:model-value="uploadLogo" />
            <v-btn v-if="config.logoUrl" variant="text" size="small" prepend-icon="mdi-close" :disabled="uploading || saving" @click="removeLogo">Remove logo</v-btn>
            <div class="mt-5 d-flex align-center ga-3">
              <v-btn color="primary" :loading="saving" :disabled="uploading || !dirty" @click="save">Save email appearance</v-btn>
              <span v-if="dirty" class="text-caption text-medium-emphasis">Unsaved changes</span>
            </div>
          </v-col>
          <v-col cols="12" md="7">
            <div class="d-flex align-center mb-2">
              <h3 class="text-subtitle-1 font-weight-bold">Email preview</h3>
              <v-progress-circular v-if="previewLoading" indeterminate size="16" width="2" class="ml-2" />
            </div>
            <p class="text-body-2 text-medium-emphasis mb-2">Sample content. Scroll to see the footer.</p>
            <v-alert v-if="previewError" type="warning" variant="tonal" class="mb-2">{{ previewError }} <v-btn size="small" variant="text" @click="refreshPreview">Retry preview</v-btn></v-alert>
            <iframe v-if="previewHtml" :srcdoc="previewHtml" title="Lab email appearance preview" sandbox="" class="email-appearance-preview"></iframe>
          </v-col>
        </v-row>
      </template>
    </v-card-text>
  </v-card>
</template>

<script>
import emailBranding from "@/services/emailBranding";

export default {
  props: { labId: { type: [Number, String], required: true }, labName: String },
  data: () => ({
    config: { theme: "forest", logoUrl: "" }, themes: [], logoFile: null,
    loading: false, loaded: false, saving: false, uploading: false,
    savedConfig: "", saved: false, error: "", previewHtml: "", previewError: "",
    previewLoading: false, previewTimer: null, previewVersion: 0,
  }),
  computed: { dirty() { return JSON.stringify(this.config) !== this.savedConfig; } },
  watch: {
    config: { deep: true, handler() {
      this.saved = false;
      if (!this.loaded) return;
      clearTimeout(this.previewTimer);
      this.previewTimer = setTimeout(() => this.refreshPreview(), 250);
    } },
  },
  mounted() { this.load(); },
  beforeUnmount() { clearTimeout(this.previewTimer); this.previewVersion++; },
  methods: {
    async load() {
      this.loading = true; this.error = "";
      try {
        const data = await emailBranding.load(this.labId);
        this.config = { theme: data.theme, logoUrl: data.logoUrl };
        this.themes = data.themes;
        this.savedConfig = JSON.stringify(this.config);
        this.loaded = true;
        await this.refreshPreview();
      } catch (error) { this.error = error.response?.data?.message || "Unable to load email appearance."; }
      finally { this.loading = false; }
    },
    async refreshPreview() {
      const version = ++this.previewVersion;
      this.previewLoading = true; this.previewError = "";
      try {
        const html = await emailBranding.preview(this.labId, this.config);
        if (version === this.previewVersion) this.previewHtml = html;
      } catch { if (version === this.previewVersion) { this.previewHtml = ""; this.previewError = "Unable to load the preview."; } }
      finally { if (version === this.previewVersion) this.previewLoading = false; }
    },
    async uploadLogo(fileOrList) {
      const file = Array.isArray(fileOrList) ? fileOrList[0] : fileOrList;
      if (!file) return;
      this.error = "";
      if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 2 * 1024 * 1024) {
        this.error = "Please choose a PNG or JPEG image up to 2 MB.";
        this.logoFile = null; return;
      }
      this.uploading = true;
      try { this.config.logoUrl = await emailBranding.uploadLogo(this.labId, file); }
      catch (error) { this.error = error.response?.data?.message || "Unable to upload the logo."; }
      finally { this.uploading = false; this.logoFile = null; }
    },
    removeLogo() { this.config.logoUrl = ""; this.logoFile = null; },
    async save() {
      this.saving = true; this.error = "";
      try {
        await emailBranding.save(this.labId, this.config);
        this.savedConfig = JSON.stringify(this.config); this.saved = true; this.$emit("saved");
      } catch (error) { this.error = error.response?.data?.message || "Unable to save email appearance."; }
      finally { this.saving = false; }
    },
  },
};
</script>

<style scoped>
.theme-options { display:flex; flex-wrap:wrap; gap:8px; height:auto !important; overflow:visible; }
.theme-choice { border:1px solid #d5dcd8 !important; border-radius:6px !important; height:42px !important; text-transform:none; letter-spacing:normal; }
.theme-swatch { width:16px; height:16px; border-radius:50%; margin-right:8px; }
.email-appearance-preview { display:block; width:100%; height:500px; border:1px solid #d5dcd8; border-radius:6px; background:#f3f4f2; }
</style>
