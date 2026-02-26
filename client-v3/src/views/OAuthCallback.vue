<template>
  <v-container fill-height fluid class="d-flex align-center justify-center">
    <v-card variant="elevated" class="pa-6 text-center" max-width="500">
      <v-card-title class="text-h5 mb-4">Google Authentication</v-card-title>
      <v-card-text>
        <template v-if="success">
          <v-icon color="success" size="64" class="mb-4">mdi-check-circle</v-icon>
          <p class="text-body-1">Authentication successful! You can safely close this window.</p>
        </template>
        <template v-else-if="error">
          <v-icon color="error" size="64" class="mb-4">mdi-alert-circle</v-icon>
          <p class="text-body-1 text-error">{{ error }}</p>
        </template>
        <template v-else>
          <v-progress-circular indeterminate color="primary" size="64" class="mb-4"></v-progress-circular>
          <p class="text-body-1">Processing authentication...</p>
        </template>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
export default {
  name: 'OAuthCallback',
  data() {
    return {
      success: false,
      error: null
    }
  },
  mounted() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      this.error = `Authentication failed: ${error}`;
      return;
    }

    if (code) {
      if (window.opener) {
        // Send the code back to the original window (Settings.vue)
        window.opener.postMessage({
          type: 'GOOGLE_OAUTH_CODE',
          code: code
        }, window.location.origin);
        
        this.success = true;
        
        // Auto-close after a brief delay
        setTimeout(() => {
          window.close();
        }, 1500);
      } else {
        this.error = "This window wasn't opened from the application. Please go back and try again.";
        // Just in case it's not a popup, show the code
        this.error = `Code received: ${code} \n\nPlease copy this code manually if the window doesn't close.`;
      }
    } else {
      this.error = "No authentication code received.";
    }
  }
}
</script>
