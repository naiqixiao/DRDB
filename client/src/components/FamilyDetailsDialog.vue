<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="600px" scrollable>
    <v-card class="ds-card" variant="flat">
      <v-card-title class="d-flex justify-space-between align-center py-4 ds-header-gradient">
        <span class="text-h6 font-weight-bold" style="font-family: var(--ds-font-family-heading)">Family Details</span>
        <v-btn icon="mdi-close" variant="text" density="comfortable" @click="$emit('update:modelValue', false)"></v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pt-4 pb-6 px-5" style="max-height: 70vh;">
        <!-- Family Header -->
        <div class="d-flex align-center mb-4">
          <v-avatar color="primary" size="48" class="mr-4">
            <v-icon size="26" color="white">mdi-account-group</v-icon>
          </v-avatar>
          <div>
            <div class="text-h6 font-weight-bold" style="font-family: var(--ds-font-family-heading)">
              {{ family?.NamePrimary || 'Unknown Family' }}
            </div>
            <div class="text-subtitle-2 text-muted">
              Family ID: {{ family?.id || '—' }}
            </div>
          </div>
        </div>

        <v-divider class="mb-4"></v-divider>

        <v-list density="compact" class="text-left px-0">
          <!-- Caregivers -->
          <v-list-item prepend-icon="mdi-account" class="px-2">
            <v-list-item-title class="text-caption text-muted">Primary Caregiver</v-list-item-title>
            <v-list-item-subtitle class="font-weight-medium text-wrap mt-1" style="line-height: 1.4; opacity: 1;">
              {{ family?.NamePrimary || 'Not provided' }}
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item prepend-icon="mdi-account-multiple" class="px-2" v-if="family?.NameSecondary">
            <v-list-item-title class="text-caption text-muted">Secondary Caregiver</v-list-item-title>
            <v-list-item-subtitle class="font-weight-medium text-wrap mt-1" style="line-height: 1.4; opacity: 1;">
              {{ family.NameSecondary }}
            </v-list-item-subtitle>
          </v-list-item>

          <v-divider class="my-2"></v-divider>

          <!-- Contact -->
          <v-list-item prepend-icon="mdi-email-outline" class="px-2">
            <v-list-item-title class="text-caption text-muted">Email</v-list-item-title>
            <v-list-item-subtitle class="font-weight-medium d-flex align-center mt-1" style="opacity: 1;">
              <span>{{ family?.Email || 'Not provided' }}</span>
              <v-btn v-if="family?.Email" icon="mdi-content-copy" variant="text" size="x-small" density="compact" class="ml-2" @click="copyToClipboard(family.Email)"></v-btn>
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item prepend-icon="mdi-phone-outline" class="px-2">
            <v-list-item-title class="text-caption text-muted">Phone</v-list-item-title>
            <v-list-item-subtitle class="font-weight-medium d-flex align-center flex-wrap mt-1" style="opacity: 1;">
              <span v-if="family?.Phone">{{ PhoneFormated(family.Phone) }}</span>
              <span v-else class="text-muted">Not provided</span>
              <v-btn v-if="family?.Phone" icon="mdi-content-copy" variant="text" size="x-small" density="compact" class="ml-2" @click="copyToClipboard(family.Phone)"></v-btn>
              <span v-if="family?.CellPhone" class="text-muted ml-3">Cell: {{ PhoneFormated(family.CellPhone) }}</span>
              <v-btn v-if="family?.CellPhone" icon="mdi-content-copy" variant="text" size="x-small" density="compact" class="ml-2" @click="copyToClipboard(family.CellPhone)"></v-btn>
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item prepend-icon="mdi-map-marker-outline" class="px-2">
            <v-list-item-title class="text-caption text-muted">Address</v-list-item-title>
            <v-list-item-subtitle class="font-weight-medium text-wrap mt-1" style="line-height: 1.4; opacity: 1;">
              {{ family?.Address || 'Not provided' }}
            </v-list-item-subtitle>
          </v-list-item>

          <v-divider class="my-2"></v-divider>

          <!-- Demographics -->
          <v-list-item prepend-icon="mdi-translate" class="px-2">
            <v-list-item-title class="text-caption text-muted">Languages</v-list-item-title>
            <v-list-item-subtitle class="font-weight-medium text-wrap mt-1" style="line-height: 1.4; opacity: 1;">
              Primary: {{ family?.LanguagePrimary || 'Not specified' }}
              <span v-if="family?.LanguageSecondary"> | Secondary: {{ family.LanguageSecondary }}</span>
              <span v-if="family?.EnglishPercent !== null && family?.EnglishPercent !== undefined"> | English: {{ family.EnglishPercent }}%</span>
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item prepend-icon="mdi-earth" class="px-2">
            <v-list-item-title class="text-caption text-muted">Race / Ethnicity</v-list-item-title>
            <v-list-item-subtitle class="font-weight-medium text-wrap mt-1" style="line-height: 1.4; opacity: 1;">
              Primary: {{ family?.RacePrimary || 'Not specified' }}
              <span v-if="family?.RaceSecondary"> | Secondary: {{ family.RaceSecondary }}</span>
            </v-list-item-subtitle>
          </v-list-item>

          <v-divider class="my-2"></v-divider>

          <!-- Additional -->
          <v-list-item prepend-icon="mdi-car" class="px-2">
            <v-list-item-title class="text-caption text-muted">Vehicle Access</v-list-item-title>
            <v-list-item-subtitle class="font-weight-medium text-wrap mt-1" style="line-height: 1.4; opacity: 1;">
              {{ family?.Vehicle || 'Not specified' }}
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item prepend-icon="mdi-hospital-building" class="px-2">
            <v-list-item-title class="text-caption text-muted">Recruitment Method</v-list-item-title>
            <v-list-item-subtitle class="font-weight-medium text-wrap mt-1" style="line-height: 1.4; opacity: 1;">
              {{ family?.RecruitmentMethod || 'Not specified' }}
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item prepend-icon="mdi-calendar-clock" class="px-2" v-if="family?.NextContactDate">
            <v-list-item-title class="text-caption text-muted">Next Contact Date</v-list-item-title>
            <v-list-item-subtitle class="font-weight-medium text-wrap mt-1" style="line-height: 1.4; opacity: 1;">
              {{ family.NextContactDate }}
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item prepend-icon="mdi-message-text-outline" class="px-2" v-if="family?.NextContactNote">
            <v-list-item-title class="text-caption text-muted">Notes for next contact</v-list-item-title>
            <v-list-item-subtitle class="font-weight-medium text-wrap mt-1" style="line-height: 1.4; opacity: 1;">
              {{ family.NextContactNote }}
            </v-list-item-subtitle>
          </v-list-item>

          <v-divider class="my-2" v-if="family?.Note"></v-divider>

          <!-- General Note -->
          <v-list-item prepend-icon="mdi-note-text-outline" class="px-2" v-if="family?.Note">
            <v-list-item-title class="text-caption text-muted">Note</v-list-item-title>
            <v-list-item-subtitle class="font-weight-medium text-wrap mt-1" style="line-height: 1.4; opacity: 1; white-space: pre-wrap;">
              {{ family.Note }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "FamilyDetailsDialog",
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    family: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ["update:modelValue"],
  methods: {
    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        console.log("Copied to clipboard:", text);
      }).catch(err => {
        console.error("Failed to copy:", err);
      });
    },
    PhoneFormated(Phone) {
      if (Phone) {
        const cleaned = ("" + Phone).replace(/\D/g, "");
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
          return "(" + match[1] + ") " + match[2] + "-" + match[3];
        }
        return Phone;
      }
      return "";
    },
  },
};
</script>

<style scoped></style>
