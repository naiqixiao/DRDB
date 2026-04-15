<template>
  <v-container fluid class="fill-height bg-grey-lighten-4 pa-0" style="background-color: var(--ds-field-bg);">
    <ConfirmDlg ref="confirmD" />
    <v-row no-gutters class="fill-height justify-center align-center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="elevation-4 ds-card pa-6">
          <div class="text-center mb-6">
            <h1 class="text-h4 font-weight-bold mb-2" style="font-family: var(--ds-font-family-heading); color: var(--color-primary);">System Setup Wizard</h1>
            <p class="text-body-1 text-muted">Complete these 3 steps to configure your DRDB installation.</p>
          </div>

          <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-6" closable @click:close="error = null">
            {{ error }}
          </v-alert>

          <v-stepper v-model="step" :items="['Secure Account', 'Personalize Lab', 'Connect Google']" hide-actions>
            
            <template v-slot:item.1>
              <div class="pa-4">
                <h3 class="text-h6 font-weight-bold mb-4">Step 1: Secure Your Account</h3>
                <p class="text-body-2 mb-6">Welcome to DRDB! Let's secure your account by replacing the default system credentials with your own.</p>
                <v-form ref="form1" v-model="validForm1" lazy-validation>
                  <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Your Name</div>
                  <v-text-field v-model="form1.Name" :rules="[v => !!v || 'Required']" variant="outlined" density="compact" class="mb-4" placeholder="Dr. John Doe"></v-text-field>

                  <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Your Professional Email</div>
                  <v-text-field v-model="form1.Email" :rules="[v => !!v || 'Required']" variant="outlined" density="compact" class="mb-4" placeholder="johndoe@university.edu"></v-text-field>

                  <v-row>
                    <v-col cols="12" md="4">
                      <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Current Password</div>
                      <v-text-field v-model="form1.Password" type="password" :rules="[v => !!v || 'Required']" variant="outlined" density="compact" class="mb-4"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4">
                      <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">New Password</div>
                      <v-text-field v-model="form1.newPassword" type="password" :rules="[v => !!v || 'Required']" variant="outlined" density="compact" class="mb-4"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4">
                      <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Confirm New Password</div>
                      <v-text-field v-model="form1.confirmPassword" type="password" :rules="[v => !!v || 'Required', v => v === form1.newPassword || 'Passwords must match']" variant="outlined" density="compact" class="mb-4"></v-text-field>
                    </v-col>
                  </v-row>
                  
                  <div class="d-flex justify-end mt-4">
                    <v-btn color="primary" @click="submitStep1" :loading="loading" :disabled="!validForm1">Save & Continue</v-btn>
                  </div>
                </v-form>
              </div>
            </template>

            <template v-slot:item.2>
              <div class="pa-4">
                <h3 class="text-h6 font-weight-bold mb-4">Step 2: Personalize Your Lab</h3>
                <p class="text-body-2 mb-6">Tell us a bit about your lab. We use this information to make sure your automated emails to parents look professional and your study times match your local timezone.</p>
                <v-form ref="form2" v-model="validForm2" lazy-validation>
                  <v-row>
                    <v-col cols="12" md="6">
                      <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Lab Name</div>
                      <v-text-field v-model="form2.LabName" :rules="[v => !!v || 'Required']" variant="outlined" density="compact" class="mb-4" placeholder="Baby Lab"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Principal Investigator (PI)</div>
                      <v-text-field v-model="form2.PI" variant="outlined" density="compact" class="mb-4" placeholder="Dr. John Doe"></v-text-field>
                    </v-col>
                  </v-row>

                  <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Location</div>
                  <v-text-field v-model="form2.Location" variant="outlined" density="compact" class="mb-4" placeholder="Room 101, Psychology Building"></v-text-field>

                  <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Local Timezone</div>
                  <v-select v-model="form2.Timezone" :items="timezoneOptions" variant="outlined" density="compact" class="mb-4"></v-select>

                  <div class="d-flex justify-end mt-4">
                    <v-btn color="primary" @click="submitStep2" :loading="loading" :disabled="!validForm2">Save & Continue</v-btn>
                  </div>
                </v-form>
              </div>
            </template>

            <template v-slot:item.3>
              <div class="pa-4">
                <h3 class="text-h6 font-weight-bold mb-4">Step 3: Connect Google</h3>
                <p class="text-body-2 mb-4">DRDB handles the heavy lifting of emailing parents and booking calendar events automatically! To do this, it needs permission to use your lab's Gmail account.</p>
                
                <div class="mb-6">
                  <div class="text-subtitle-2 font-weight-bold">Instructions:</div>
                  <ol class="ms-4 text-body-2">
                    <li class="mb-1">Click the button below to sign in with your lab's Google account.</li>
                    <li>Google will give you a special code. Paste that code into the box below.</li>
                  </ol>
                  <p class="text-caption text-muted mt-2">
                    <v-icon size="small" class="me-1">mdi-help-circle-outline</v-icon> Need help creating a Google Cloud Project? <a href="https://mcmaster-baby-lab.github.io/handbook/DRDB" target="_blank">Read the handbook.</a>
                  </p>
                </div>

                <div class="text-center mb-6">
                  <v-btn color="#EA4335" class="text-white text-none font-weight-bold" prepend-icon="mdi-google" size="large" @click="getGoogleAuthUrl" :loading="loadingGoogle">
                    Sign in with Lab Google Account
                  </v-btn>
                </div>

                <div v-if="showCodeInput">
                  <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Paste Authorization Code</div>
                  <v-textarea v-model="form3.authCode" rows="2" no-resize variant="outlined" density="compact" placeholder="Paste the code you received from Google here"></v-textarea>
                  
                  <div class="d-flex justify-end align-center mt-4">
                    <v-btn variant="text" color="grey" class="me-4 text-none" @click="skipGoogleStep">Skip for now, I'll do this later</v-btn>
                    <v-btn color="primary" @click="submitStep3" :loading="loading" :disabled="!form3.authCode">Verify Code & Finish</v-btn>
                  </div>
                </div>
                <div v-else class="text-center mt-4">
                  <v-btn variant="text" color="grey" class="text-none" @click="skipGoogleStep">Skip for now, I'll do this later</v-btn>
                </div>
              </div>
            </template>
          </v-stepper>

          <!-- Success Celebration -->
          <v-dialog v-model="successDialog" persistent max-width="400">
            <v-card class="text-center py-8 px-4 rounded-xl">
              <v-icon color="success" size="80" class="mb-4">mdi-check-circle-outline</v-icon>
              <h2 class="text-h5 font-weight-bold mb-2 text-primary" style="font-family: var(--ds-font-family-heading);">You're All Set!</h2>
              <p class="text-body-2 mb-6 text-muted">Your DRDB installation is fully configured and ready to use.</p>
              <v-btn color="primary" size="large" class="font-weight-bold" @click="goToDashboard">Take me to my Dashboard</v-btn>
            </v-card>
          </v-dialog>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { useMainStore } from '@/stores/mainStore'
import loginService from '@/services/login'
import labService from '@/services/lab'
import personnelService from '@/services/personnel'
import externalAPIs from '@/services/externalAPIs'
import systemSetting from '@/services/systemSetting'
import ConfirmDlg from '@/components/ConfirmDialog.vue'

export default {
  name: 'SetupWizard',
  components: { ConfirmDlg },
  data() {
    return {
      store: useMainStore(),
      step: 1,
      loading: false,
      loadingGoogle: false,
      error: null,
      validForm1: false,
      validForm2: false,
      showCodeInput: false,
      successDialog: false,
      form1: {
        Name: '',
        Email: '',
        Password: '',
        newPassword: '',
        confirmPassword: ''
      },
      form2: {
        LabName: '',
        PI: '',
        Location: '',
        Timezone: 'America/Toronto'
      },
      form3: {
        authCode: ''
      },
      timezoneOptions: [
        "America/Toronto", "America/New_York", "America/Chicago", "America/Denver",
        "America/Los_Angeles", "America/Vancouver", "Europe/London", "Europe/Paris",
        "Asia/Tokyo", "Asia/Shanghai", "Asia/Hong_Kong", "UTC",
      ]
    }
  },
  mounted() {
    // Pre-fill Name and Email from the logged-in default admin
    if (this.store.user) {
      this.form1.Email = this.store.user;
      this.form1.Name = this.store.name;
    }
    
    // Check if step 1 was already done (page reload scenario)
    if (!this.store.temporaryPassword) {
      this.step = 2;
    }

    // Listen for the Google OAuth popup auto-callback
    window.addEventListener('message', this.handleOAuthMessage);
  },
  beforeUnmount() {
    window.removeEventListener('message', this.handleOAuthMessage);
  },
  methods: {
    // Auto-submit Google code if the popup sends it back via postMessage
    handleOAuthMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (event.data && event.data.type === 'GOOGLE_OAUTH_CODE' && event.data.code) {
        this.form3.authCode = event.data.code;
        this.showCodeInput = true;
        this.submitStep3();
      }
    },

    async submitStep1() {
      const { valid } = await this.$refs.form1.validate();
      if (!valid) return;
      this.loading = true;
      this.error = null;
      
      try {
        const oldEmail = this.store.user;
        // CRITICAL: changePassword returns a new JWT — save it
        const response = await loginService.changePassword({
          Email: oldEmail,
          Password: this.form1.Password,
          newPassword: this.form1.newPassword
        });

        this.store.setToken(response.data.token);
        this.store.setUser(response.data.user);
        this.store.setName(response.data.name);

        // Update profile Name/Email if they changed them
        if (oldEmail !== this.form1.Email || this.store.name !== this.form1.Name) {
          await personnelService.update({
            id: this.store.userID,
            Name: this.form1.Name,
            Email: this.form1.Email
          });
          this.store.setName(this.form1.Name);
          this.store.setUser(this.form1.Email);
        }

        this.store.setTemporaryPassword(false);
        this.step = 2;

      } catch (err) {
        this.error = err.response?.data?.error || "Failed to update account. Please check your current password.";
      } finally {
        this.loading = false;
      }
    },

    async submitStep2() {
      if (!this.$refs.form2.validate()) return;
      this.loading = true;
      this.error = null;

      try {
        // lab.update() reads the lab id from the store automatically
        await labService.update({
          LabName: this.form2.LabName,
          PI: this.form2.PI,
          Location: this.form2.Location,
          Timezone: this.form2.Timezone
        });

        this.store.setLabName(this.form2.LabName);
        this.store.setTimeZone(this.form2.Timezone);
        
        // Move to step 3
        this.step = 3;
      } catch (err) {
        this.error = err.response?.data?.error || "Failed to personalize lab details.";
      } finally {
        this.loading = false;
      }
    },

    async getGoogleAuthUrl() {
      this.loadingGoogle = true;
      this.error = null;
      try {
        // googleCredentialsURL returns the auth URL as a plain string
        const response = await externalAPIs.googleCredentialsURL();
        const authUrl = typeof response.data === 'string' ? response.data : response.data?.url;
        if (authUrl) {
          window.open(authUrl, '_blank');
          this.showCodeInput = true;
        } else if (response.data?.message) {
          this.error = response.data.message;
        } else {
          this.error = "Could not generate Google Authentication URL. Check your credentials file on the server.";
        }
      } catch (err) {
        this.error = err.response?.data?.message || err.response?.data?.error || "Could not open Google sign-in. Check your server credentials file.";
      } finally {
        this.loadingGoogle = false;
      }
    },

    async submitStep3() {
      this.loading = true;
      this.error = null;

      try {
        await externalAPIs.setLabToken(this.form3.authCode);
        // Backend marks isFirstRun=false automatically on token exchange
        this.store.setLabEmailStatus(true);
        this.store.setIsFirstRun(false);
        this.successDialog = true;
      } catch (err) {
        this.error = err.response?.data?.error || "Google authentication failed. Please double-check the code and try again.";
      } finally {
        this.loading = false;
      }
    },

    async skipGoogleStep() {
      this.loading = true;
      try {
        // Mark first run complete without Google — they can connect later via Settings
        await systemSetting.updateSetting({ SettingKey: 'isFirstRun', SettingValue: 'false' });
        this.store.setIsFirstRun(false);
        this.successDialog = true;
      } catch (err) {
        // Even if the API call fails, clear the flag locally so they aren't trapped
        this.store.setIsFirstRun(false);
        this.successDialog = true;
      } finally {
        this.loading = false;
      }
    },

    goToDashboard() {
      this.successDialog = false;
      this.$router.push('/family');
    }
  }
}
</script>
