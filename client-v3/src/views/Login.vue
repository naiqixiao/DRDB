<template>
  <v-container fluid class="fill-height pa-0" style="background-color: var(--ds-field-bg);">
    <ConfirmDlg ref="confirmD" />
    
    <v-row no-gutters class="fill-height">
      <v-col cols="12" md="4" class="d-flex flex-column justify-center align-center bg-white elevation-4" style="z-index: 2;">
        <div style="width: 100%; max-width: 400px;" class="px-6">
          
          <div class="text-center mb-8">
            <v-icon size="64" color="primary" class="mb-4">mdi-flask-outline</v-icon>
            <h1 class="text-h4 font-weight-bold mb-2" style="font-family: var(--ds-font-family-heading); color: var(--color-primary);">DRDB</h1>
            <p class="text-body-1 text-muted">Developmental Research Management</p>
          </div>

          <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-6" border="start" closable>
            {{ error }}
          </v-alert>

          <v-form ref="formLogin" v-model="validLogin" lazy-validation>
            <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Email Address</div>
            <v-text-field 
              v-model="email" 
              :rules="[v => !!v || 'Email is required']" 
              prepend-inner-icon="mdi-email-outline"
              variant="outlined" 
              density="comfortable"
              placeholder="name@mcmaster.ca"
              class="mb-2"
            ></v-text-field>
            
            <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Password</div>
            <v-text-field 
              v-model="password" 
              type="password" 
              :rules="[v => !!v || 'Password is required']" 
              prepend-inner-icon="mdi-lock-outline"
              variant="outlined" 
              density="comfortable"
              placeholder="••••••••"
              @keydown.enter="login"
            ></v-text-field>

            <v-btn 
              block 
              size="large" 
              color="#F59E0B" 
              class="text-white font-weight-bold mt-6"
              style="letter-spacing: 0.5px;"
              :disabled="!validLogin || !email"
              :loading="store.loadingStatus"
              @click.stop="login"
            >
              Sign In
            </v-btn>
          </v-form>

          <div class="text-center mt-6">
            <v-btn variant="text" size="small" color="primary" @click="resetPassword" :disabled="!email" class="text-none">
              Forgot your password?
            </v-btn>
          </div>

          <v-divider class="my-6"></v-divider>

          <div class="text-center">
            <p class="text-caption text-muted mb-2">First time using the system?</p>
            <v-btn variant="outlined" size="small" color="secondary" prepend-icon="mdi-book-open-page-variant" href="https://mcmaster-baby-lab.github.io/handbook/DRDB" target="_blank">
              Read the Handbook
            </v-btn>
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="8" class="bg-grey-lighten-4 d-none d-md-flex flex-column pa-8" style="overflow-y: auto; height: 100vh;">
        <v-container style="max-width: 900px;">
          <h2 class="text-h5 font-weight-bold mb-6 text-primary" style="font-family: var(--ds-font-family-heading);">System Overview</h2>
          
          <v-row>
            <v-col cols="12">
              <v-card class="ds-card mb-6" variant="flat">
                <v-toolbar color="transparent" density="compact" class="px-2 border-bottom">
                  <v-icon class="mr-2" color="primary">mdi-chart-bar</v-icon>
                  <span class="text-subtitle-1 font-weight-bold" style="font-family: var(--ds-font-family-heading); color: rgb(var(--v-theme-primary))">Global Recruitment Stats</span>
                </v-toolbar>
                <v-card-text class="d-flex justify-center py-6" style="overflow-x: auto;">
                  <HistogramChart />
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12">
              <v-card class="ds-card" variant="flat">
                <v-toolbar color="transparent" density="compact" class="px-2 border-bottom">
                  <v-icon class="mr-2" color="primary">mdi-text-box-outline</v-icon>
                  <span class="text-subtitle-1 font-weight-bold" style="font-family: var(--ds-font-family-heading); color: rgb(var(--v-theme-primary))">Release Notes</span>
                </v-toolbar>
                <v-card-text>
                  <div class="release-notes-container" v-html="releaseNote"></div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="500px" persistent>
      <v-card class="ds-card" variant="flat">
        <v-card-title class="d-flex justify-space-between align-center py-4 ds-header-gradient">
          <span class="text-h6 font-weight-bold" style="font-family: var(--ds-font-family-heading)">Welcome! Set your password</span>
        </v-card-title>
        <v-card-text class="pt-6">
          <v-form ref="form" v-model="valid" lazy-validation>
            <div v-if="!changeTemporaryPassword" class="mb-4">
              <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Current Password</div>
              <v-text-field v-model="password" type="password" hide-details density="compact" variant="outlined"></v-text-field>
            </div>
            
            <div class="mb-4">
              <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">New Password</div>
              <v-text-field v-model="newPassword" type="password" hide-details variant="outlined" density="compact"></v-text-field>
            </div>

            <div class="mb-2">
              <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Confirm Password</div>
              <v-text-field v-model="newPasswordVerify" type="password" :rules="[passwordConfirmationRule]" variant="outlined" density="compact"></v-text-field>
            </div>
          </v-form>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :disabled="passwordConfirmationRule !== true || !newPassword" @click="changePassword">Confirm</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import login from "@/services/login";
import testingRoom from "@/services/testingRoom";
import externalAPIs from "@/services/externalAPIs";
import HistogramChart from '@/components/HistogramChart.vue';
import ConfirmDlg from "@/components/ConfirmDialog.vue";
import { useMainStore } from "@/stores/mainStore";

export default {
  components: { HistogramChart, ConfirmDlg },
  setup() {
    const store = useMainStore();
    return { store };
  },
  data() {
    return {
      email: null,
      password: null,
      newPassword: null,
      newPasswordVerify: null,
      error: null,
      dialog: false,
      changeTemporaryPassword: false,
      valid: true,
      validLogin: false,
    };
  },
  methods: {
    async login() {
      const { valid } = await this.$refs.formLogin.validate();
      if (valid) {
        this.store.setLoadingStatus(true);
        try {
          const response = await login.login({ Email: this.email, Password: this.password });
          this.error = null;

          this.store.setToken(response.data.token);
          this.store.setUser(response.data.user);
          this.store.setName(response.data.name);
          this.store.setUserID(response.data.userID);
          this.store.setLab(response.data.lab);
          this.store.setStudies(response.data.studies);
          this.store.setRole(response.data.role);
          this.store.setLabEmail(response.data.labEmail);
          this.store.setLabName(response.data.labName);
          this.store.setTimeZone(response.data.timeZone);
          this.store.setZoomLink(response.data.ZoomLink);
          this.store.setEmailOpening(response.data.emailOpening);
          this.store.setEmailClosing(response.data.emailClosing);
          this.store.setTYEmailClosing(response.data.TYEmail);
          this.store.setLocation(response.data.location);
          this.store.setTransportationInstructions(response.data.transportationInstructions);
          
          try {
            const testingRooms = await testingRoom.search(this.store.lab);
            this.store.setTestingRooms(testingRooms.data);
          } catch(e) { console.log("Could not load testing rooms", e); }

          if (response.data.temporaryPassword) {
            this.changeTemporaryPassword = response.data.temporaryPassword;
            this.dialog = true;
          } else {
            try {
              const profile = await externalAPIs.googleGetEmailAddress();
              if (profile?.data?.labEmail) this.store.setLabEmailStatus(true);
              if (profile?.data?.adminEmail) this.store.setAdminEmailStatus(true);
            } catch(e) { console.log("Could not load google profile", e); }
            this.$router.push({ name: "Family information" });
          }
        } catch (error) {
          this.error = error.response ? error.response.data.error : error.message;
          if (error.response && [500, 502].includes(error.response.status)) {
            this.$refs.confirmD.open('Server Error', 'The backend server is not running properly. Ask the administrator to fix this issue.', { color: 'error', noconfirm: true });
          }
        }
        this.store.setLoadingStatus(false);
      }
    },
    async resetPassword() {
      if (this.email) {
        try {
          await login.resetPassword({ Email: this.email });
          this.$refs.confirmD.open('Password Reset', `Temporary password sent to ${this.email}.`, { color: 'success', noconfirm: true });
          this.email = null;
          this.password = null;
          this.error = null;
        } catch (error) {
          this.error = error.response ? error.response.data.error : error.message;
        }
      } else {
        this.$refs.confirmD.open('Validation', 'Please enter your email to reset your password.', { color: 'warning', noconfirm: true });
      }
    },
    async changePassword() {
      try {
        const response = await login.changePassword({
          Email: this.email, Password: this.password, newPassword: this.newPassword,
        });
        
        this.store.setToken(response.data.token);
        this.store.setUser(response.data.user);
        this.store.setName(response.data.name);
        this.store.setUserID(response.data.userID);
        this.store.setLab(response.data.lab);
        this.store.setStudies(response.data.studies);
        this.store.setRole(response.data.role);
        this.store.setLabEmail(response.data.labEmail);
        this.store.setLabName(response.data.labName);
        this.store.setTimeZone(response.data.timeZone);
        this.store.setTrainingMode(false);
        this.store.setEmailOpening(response.data.emailOpening);
        this.store.setEmailClosing(response.data.emailClosing);
        this.store.setTYEmailClosing(response.data.TYEmail);
        this.store.setLocation(response.data.location);
        this.store.setTransportationInstructions(response.data.transportationInstructions);
        this.store.setZoomLink(response.data.ZoomLink);

        try {
          const profile = await externalAPIs.googleGetEmailAddress();
          if (profile?.data?.labEmail) this.store.setLabEmailStatus(true);
          if (profile?.data?.adminEmail) this.store.setAdminEmailStatus(true);
        } catch(e) {}

        this.changeTemporaryPassword = false;
        await this.$refs.confirmD.open('Welcome!', 'Your password is set! Welcome!', { color: 'success', noconfirm: true });
        this.close();
        this.$router.push({ name: "Family information" });
      } catch (error) {
        this.error = error.response ? error.response.data.error : error.message;
      }
    },
    close() {
      this.dialog = false;
      setTimeout(() => { this.password = null; this.newPassword = null; this.newPasswordVerify = null; }, 300);
    },
  },
  computed: {
    passwordConfirmationRule() { return this.newPassword === this.newPasswordVerify || "Password must match"; },
    releaseNote() {
      return `
        <div style="font-family: Arial, sans-serif; padding-right: 16px;">
          <h3 style="color: #1E40AF; margin-bottom: 8px;">Release V1.2.20240610</h3>
          <ul style="padding-left: 20px; margin-bottom: 16px; font-size: 14px; color: #475569;">
            <li>Recruitment history stats are available</li>
          </ul>
          <h3 style="color: #1E40AF; margin-bottom: 8px;">Release V1.2.20240122</h3>
          <ul style="padding-left: 20px; margin-bottom: 16px; font-size: 14px; color: #475569;">
            <li><strong>Partial Update Feature:</strong> Modify individual appointments within a schedule.</li>
            <li><strong>Testing Rooms Feature:</strong> Create testing rooms linked to independent Google Calendars.</li>
            <li><strong>Email Tags & Templates:</strong> Organize emails by study name automatically.</li>
            <li><strong>Daily Database Updates:</strong> Automatic study completion tagging.</li>
          </ul>
        </div>
      `;
    },
  },
  watch: { dialog(val) { val || this.close(); } }
};
</script>

<style scoped>
.border-bottom {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}
.release-notes-container {
  max-height: 300px;
  overflow-y: auto;
}
</style>
