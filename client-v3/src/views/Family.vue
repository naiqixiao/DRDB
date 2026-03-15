<template>
  <v-container fluid>
    <AlertBanner :showAdminEmail="true" />

    <v-card class="ds-card mb-6" variant="flat">
      <v-toolbar color="transparent" density="compact">
        <v-btn color="primary" variant="flat" class="mr-2" @click="searchMode" prepend-icon="mdi-magnify">
          Search
        </v-btn>
        <v-btn color="secondary" variant="tonal" class="mr-2" @click="followupSearch" prepend-icon="mdi-phone-clock">
          Follow-ups
        </v-btn>
        <v-btn color="success" variant="tonal" @click="addFamily" prepend-icon="mdi-account-multiple-plus">
          New Family
        </v-btn>



        <v-spacer></v-spacer>

        <v-btn color="primary" variant="outlined" class="mr-2" @click="editFamily" :disabled="!currentFamily.id"
          prepend-icon="mdi-pencil">
          Edit Family
        </v-btn>
        
        <v-btn color="primary" variant="flat" class="mr-2" @click="$refs.childInfo.addChild()" :disabled="!currentFamily.id"
          prepend-icon="mdi-account-child">
          Add Child
        </v-btn>

        <v-spacer></v-spacer>

        <div class="d-flex align-center bg-grey-lighten-4 rounded px-2 py-1">
          <v-btn icon="mdi-chevron-left" variant="text" density="comfortable" @click="previousPage"
            :disabled="page <= 1"></v-btn>
          <span class="text-body-2 font-weight-bold mx-3">{{ page }} / {{ Families ? Families.length : 0 }}</span>
          <v-btn icon="mdi-chevron-right" variant="text" density="comfortable" @click="nextPage"
            :disabled="page >= Families.length || page == 0"></v-btn>
        </div>

      </v-toolbar>
    </v-card>

    <v-row justify="space-around" class="mt-4">
      <!-- LEFT COLUMN: Search + Family Info -->
      <v-col cols="12" md="5">

        <v-card class="ds-card h-100 d-flex flex-column" variant="flat" style="position: relative; overflow: hidden;">
          
          <!-- Background Family ID -->
          <div style="position: absolute; right: 10px; bottom: -10px; font-size: 120px; font-weight: 900; color: rgba(0,0,0,0.08); z-index: 100; line-height: 0.8; pointer-events: none; user-select: none;" v-if="currentFamily.id">
            {{ currentFamily.id }}
          </div>

          <v-card-text class="pt-6 flex-grow-1" style="position: relative; z-index: 1;">
            <v-row>
              <v-col cols="12" sm="8" class="text-center text-sm-left">
                <div class="d-flex flex-column align-center flex-sm-row">
                  <v-avatar color="primary" size="64" class="mb-3 mb-sm-0 mr-sm-4">
                    <v-icon size="36" color="white">mdi-account-group</v-icon>
                  </v-avatar>
                  <div class="text-center text-sm-left">
                    <h2 class="text-h5 font-weight-bold mb-1" style="font-family: var(--ds-font-family-heading)">
                      {{ currentFamily.NamePrimary || 'Unknown Family' }}
                    </h2>
                    <div class="text-subtitle-2 text-muted">
                      Family ID: {{ currentFamily.id || '—' }}
                    </div>
                  </div>
                </div>

                <div class="d-flex flex-wrap justify-center justify-sm-start gap-2 mt-4" style="gap: 8px;">
                  <v-chip size="small" variant="tonal" color="primary" v-if="currentFamily.LanguagePrimary">
                    {{ currentFamily.LanguagePrimary }} ({{ currentFamily.EnglishPercent || 0 }}% EN)
                  </v-chip>
                  <v-chip size="small" variant="tonal" color="secondary" v-if="currentFamily.RacePrimary">
                    {{ currentFamily.RacePrimary }}
                  </v-chip>
                  <v-chip size="small" variant="outlined" color="tertiary" prepend-icon="mdi-hospital-building"
                    v-if="currentFamily.RecruitmentMethod">
                    {{ currentFamily.RecruitmentMethod }}
                  </v-chip>
                </div>
              </v-col>

              <v-col cols="12" sm="4" class="d-flex flex-column align-end justify-center"
                v-if="participationStats.Total > 0">
                <div class="d-flex flex-column align-end gap-1" style="gap: 4px;">
                  <v-chip size="x-small" color="primary" variant="flat">Total: {{ participationStats.Total }}</v-chip>
                  <v-chip size="x-small" :color="getTimelineColor('Completed', true)" class="text-white" variant="flat"
                    v-if="participationStats.Completed">Completed: {{ participationStats.Completed }}</v-chip>
                  <v-chip size="x-small" :color="getTimelineColor('Confirmed', false)" variant="flat" v-if="participationStats.Confirmed">Confirmed: {{
                    participationStats.Confirmed }}</v-chip>
                  <v-chip size="x-small" :color="getTimelineColor('No Show', false)" class="text-white" variant="flat" v-if="participationStats['No Show']">No-Show: {{
                    participationStats['No Show'] }}</v-chip>
                  <v-chip size="x-small" :color="getTimelineColor('Cancelled', false)" class="text-white" variant="flat" v-if="participationStats.Cancelled">Cancelled: {{
                    participationStats.Cancelled }}</v-chip>
                  <v-chip size="x-small" :color="getTimelineColor('Rejected', false)" class="text-white" variant="flat" v-if="participationStats.Rejected">Rejected: {{
                    participationStats.Rejected }}</v-chip>
                  <v-chip size="x-small" :color="getTimelineColor('TBD', false)" class="text-white" variant="flat" v-if="participationStats.TBD">TBD: {{
                    participationStats.TBD }}</v-chip>
                  <v-chip size="x-small" :color="getTimelineColor('Rescheduling', false)" class="text-white" variant="flat" v-if="participationStats.Rescheduling">Rescheduling: {{
                    participationStats.Rescheduling }}</v-chip>
                </div>
              </v-col>
            </v-row>

            <v-divider class="my-4"></v-divider>

            <div class="d-flex justify-space-between align-center mb-1 px-1">
              <span class="text-caption font-weight-bold text-uppercase text-muted">Contact Info</span>
              <v-tooltip location="top">
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" icon="mdi-information-outline" density="compact" variant="text" size="small" color="primary" @click="detailsDialog = true" :disabled="!currentFamily.id"></v-btn>
                </template>
                <span>View Full Details</span>
              </v-tooltip>
            </div>

            <v-list density="compact" class="text-left px-0">
              <v-list-item prepend-icon="mdi-email-outline" :title="currentFamily.Email || 'No email provided'"
                class="px-0"></v-list-item>
              <v-list-item prepend-icon="mdi-phone-outline" class="px-0">
                <v-list-item-title>
                  <span v-if="currentFamily.Phone">{{ PhoneFormated(currentFamily.Phone) }}</span>
                  <span v-else class="text-muted">No phone</span>
                  <span v-if="currentFamily.CellPhone" class="text-muted ml-2">(Cell: {{ PhoneFormated(currentFamily.CellPhone) }})</span>
                </v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-map-marker-outline" :title="currentFamily.Address || 'No home address provided'"
                class="px-0"></v-list-item>
            </v-list>

            <v-divider class="my-2"></v-divider>

            <v-list density="compact" class="text-left px-0 pb-0">
              <v-list-item prepend-icon="mdi-calendar-clock" class="px-0">
                <v-list-item-title class="text-caption text-muted">Next Contact Date</v-list-item-title>
                <v-list-item-subtitle class="font-weight-medium">{{ currentFamily.NextContactDate ?
                  formatDate(currentFamily.NextContactDate) : 'Not set' }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item prepend-icon="mdi-message-text-outline" class="px-0 pb-2" v-if="currentFamily.NextContactNote" style="background-color: transparent !important;">
                <v-list-item-title class="text-caption text-muted">Notes for next contact</v-list-item-title>
                <v-list-item-subtitle class="font-weight-medium text-wrap mt-1" style="line-height: 1.4; opacity: 1;">
                  {{ currentFamily.NextContactNote }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Family Edit/Add Dialog -->
      <v-dialog v-model="dialog" max-width="1000px" persistent scrollable>
        <v-card class="ds-card" variant="flat">
          <v-card-title class="d-flex justify-space-between align-center py-4 bg-grey-lighten-4">
            <span class="text-h6 font-weight-bold" style="font-family: var(--ds-font-family-heading)">
              {{ editedIndex === -1 ? 'Add a new family' : 'Edit family information' }}
              <span v-if="editedIndex !== -1" class="text-subtitle-1 text-muted ml-2 font-weight-regular">(ID: {{ editedItem.id }})</span>
            </span>
            <v-btn icon="mdi-close" variant="text" density="comfortable" @click="dialog = false"></v-btn>
          </v-card-title>
          
          <v-divider></v-divider>

          <v-card-text class="pt-6 pb-2" style="max-height: 70vh;">
            <v-form ref="form" v-model="valid" lazy-validation>
              
              <div class="mb-6">
                <div class="text-caption font-weight-bold text-uppercase text-muted mb-3 px-1">Family Information</div>
                <v-row dense>
                  <v-col cols="12" :sm="item.width === '12' ? 12 : 6" :md="item.width" v-for="item in familyBasicInfo" :key="item.label">
                    <div v-if="item.options">
                      <v-combobox class="textfield-family mb-2" v-model="editedItem[item.field]" :items="Options[item.options]"
                        variant="outlined" :label="item.label" density="compact" hide-details></v-combobox>
                    </div>
                    <div v-else>
                      <v-text-field class="textfield-family mb-2" :label="item.label" v-model="editedItem[item.field]"
                        variant="outlined" hide-details density="compact"></v-text-field>
                    </div>
                  </v-col>
                </v-row>
              </div>

              <div class="mb-4">
                <div class="text-caption font-weight-bold text-uppercase text-muted mb-3 px-1">Contact Information</div>
                <v-row dense>
                  <v-col cols="12" :sm="item.width === '12' ? 12 : 6" :md="item.width" v-for="item in familyContactInfo" :key="item.label">
                    <v-text-field class="textfield-family mb-2" :label="item.label" v-model="editedItem[item.field]"
                      variant="outlined" hide-details density="compact"></v-text-field>
                  </v-col>
                </v-row>
              </div>

            </v-form>
          </v-card-text>
          
          <v-card-actions class="px-6 pb-6 pt-0">
            <v-spacer></v-spacer>
            <v-btn color="error" variant="text" @click="dialog = false">Cancel</v-btn>
            <v-btn color="primary" variant="flat" @click="save" prepend-icon="mdi-content-save">Save Family</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Search Dialog -->
      <v-dialog v-model="searchDialog" max-width="800px">
        <v-card class="ds-card" variant="flat">
          <v-card-title class="d-flex justify-space-between align-center py-4 bg-grey-lighten-4">
            <span class="text-h6 font-weight-bold" style="font-family: var(--ds-font-family-heading)">Search
              Families</span>
            <v-btn icon="mdi-close" variant="text" density="comfortable" @click="searchDialog = false"></v-btn>
          </v-card-title>

          <v-divider></v-divider>

          <v-card-text class="pt-6 pb-2">
            <div v-for="category in searchFamilyCategories" :key="category.category" class="mb-4">
              <div class="text-caption font-weight-bold text-uppercase text-muted mb-2 px-1">{{ category.category }}</div>
              <v-row dense>
                <v-col cols="12" :sm="item.width === '12' ? 12 : 6" :md="item.width" v-for="item in category.fields" :key="item.label">
                  <div v-if="item.options">
                    <v-combobox class="textfield-family mb-2" v-model="queryString[item.field]"
                      :items="Options[item.options]" variant="outlined" :label="item.label" density="compact" hide-details
                      clearable></v-combobox>
                  </div>
                  <div v-else>
                    <v-text-field class="textfield-family mb-2" :label="item.label" v-model="queryString[item.field]"
                      variant="outlined" hide-details density="compact" clearable
                      @keydown.enter="searchFamily"></v-text-field>
                  </div>
                </v-col>
              </v-row>
            </div>
          </v-card-text>

          <v-card-actions class="px-6 pb-6 pt-0">
            <v-spacer></v-spacer>
            <v-btn color="error" variant="text" @click="searchDialog = false">Cancel</v-btn>
            <v-btn color="primary" variant="flat" @click="searchFamily" prepend-icon="mdi-magnify">
              Find Families
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Full Details Dialog -->
      <v-dialog v-model="detailsDialog" max-width="600px" scrollable>
        <v-card class="ds-card" variant="flat">
          <v-card-title class="d-flex justify-space-between align-center py-4 bg-grey-lighten-4">
            <span class="text-h6 font-weight-bold" style="font-family: var(--ds-font-family-heading)">Family Details</span>
            <v-btn icon="mdi-close" variant="text" density="comfortable" @click="detailsDialog = false"></v-btn>
          </v-card-title>
          
          <v-divider></v-divider>
          
          <v-card-text class="pt-2 pb-6 px-4" style="max-height: 70vh;">
            <v-list density="compact" class="text-left">
              
              <!-- Caregivers -->
              <v-list-item prepend-icon="mdi-account" class="px-2">
                <v-list-item-title class="text-caption text-muted">Primary Caregiver</v-list-item-title>
                <v-list-item-subtitle class="font-weight-medium text-wrap mt-1" style="line-height: 1.4; opacity: 1;">
                  {{ currentFamily.NamePrimary || 'Not provided' }}
                </v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item prepend-icon="mdi-account-multiple" class="px-2" v-if="currentFamily.NameSecondary">
                <v-list-item-title class="text-caption text-muted">Secondary Caregiver</v-list-item-title>
                <v-list-item-subtitle class="font-weight-medium text-wrap mt-1" style="line-height: 1.4; opacity: 1;">
                  {{ currentFamily.NameSecondary }}
                </v-list-item-subtitle>
              </v-list-item>

              <v-divider class="my-2"></v-divider>

              <!-- Demographics -->
              <v-list-item prepend-icon="mdi-translate" class="px-2">
                <v-list-item-title class="text-caption text-muted">Languages</v-list-item-title>
                <v-list-item-subtitle class="font-weight-medium text-wrap mt-1" style="line-height: 1.4; opacity: 1;">
                  Primary: {{ currentFamily.LanguagePrimary || 'Not specified' }}
                  <span v-if="currentFamily.LanguageSecondary"> | Secondary: {{ currentFamily.LanguageSecondary }}</span>
                  <span v-if="currentFamily.EnglishPercent !== null"> | English: {{ currentFamily.EnglishPercent }}%</span>
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item prepend-icon="mdi-earth" class="px-2">
                <v-list-item-title class="text-caption text-muted">Race / Ethnicity</v-list-item-title>
                <v-list-item-subtitle class="font-weight-medium text-wrap mt-1" style="line-height: 1.4; opacity: 1;">
                  Primary: {{ currentFamily.RacePrimary || 'Not specified' }}
                  <span v-if="currentFamily.RaceSecondary"> | Secondary: {{ currentFamily.RaceSecondary }}</span>
                </v-list-item-subtitle>
              </v-list-item>
              
              <v-divider class="my-2"></v-divider>

              <!-- Additional Details -->
              <v-list-item prepend-icon="mdi-car" class="px-2">
                <v-list-item-title class="text-caption text-muted">Vehicle Access</v-list-item-title>
                <v-list-item-subtitle class="font-weight-medium text-wrap mt-1" style="line-height: 1.4; opacity: 1;">
                  {{ currentFamily.Vehicle || 'Not specified' }}
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item prepend-icon="mdi-hospital-building" class="px-2">
                <v-list-item-title class="text-caption text-muted">Recruitment Method</v-list-item-title>
                <v-list-item-subtitle class="font-weight-medium text-wrap mt-1" style="line-height: 1.4; opacity: 1;">
                  {{ currentFamily.RecruitmentMethod || 'Not specified' }}
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item prepend-icon="mdi-brain" class="px-2">
                <v-list-item-title class="text-caption text-muted">Autism History</v-list-item-title>
                <v-list-item-subtitle class="font-weight-medium text-wrap mt-1" style="line-height: 1.4; opacity: 1;">
                  {{ currentFamily.AutismHistory === 1 ? 'Yes' : (currentFamily.AutismHistory === 0 ? 'No' : 'Unknown') }}
                </v-list-item-subtitle>
              </v-list-item>
              
            </v-list>
          </v-card-text>
        </v-card>
      </v-dialog>

      <!-- MIDDLE COLUMN: Children -->
      <v-col cols="12" md="4">
        <v-col style="padding: 0px !important; min-height: 500px">
          <ChildInfo ref="childInfo" :Children="currentFamily.Children"
            :familyId="currentFamily.id ? parseInt(currentFamily.id) : null" :currentFamily="currentFamily"
            @newSchedule="updateFamilyAppointment"></ChildInfo>
        </v-col>
      </v-col>

      <!-- RIGHT COLUMN: Notes & Conversations -->
      <v-col cols="12" md="3">
        <!-- Simplified Notes panel -->
        <v-card class="ds-card h-100 d-flex flex-column" variant="flat">
          <v-card-title class="text-subtitle-1 pb-0">
            <v-icon start>mdi-note-text</v-icon>Notes
          </v-card-title>
          <v-card-text class="flex-grow-1 d-flex flex-column pt-2">
            <v-textarea class="notes-textarea flex-grow-1" label="Notes about the family" hide-details v-model="familyNotes"
              :disabled="!currentFamily.id" @change="saveNotes" variant="outlined"></v-textarea>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Delete Timeline Schedule Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card class="ds-card" variant="flat">
        <v-card-title class="text-h6 font-weight-bold bg-error text-white py-3">
          Delete Schedule?
        </v-card-title>
        <v-card-text class="pt-6 pb-2">
          Are you sure you want to delete this schedule and its associated Google Calendar event? This action cannot be undone.
        </v-card-text>
        <v-card-actions class="px-6 pb-6 pt-0">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="deleteDialog = false" :disabled="isDeletingTimelineSchedule">Cancel</v-btn>
          <v-btn color="error" variant="flat" :loading="isDeletingTimelineSchedule" @click="deleteTimelineSchedule" prepend-icon="mdi-delete">Yes, Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- BOTTOM ROW: Schedule Table -->
    <v-row v-if="currentFamily.id" class="mt-6 mb-12">
      <v-col cols="12">
        <v-card class="ds-card" variant="flat">

          <v-tabs v-model="historyTab" color="primary" bg-color="grey-lighten-4" align-tabs="center">
            <v-tab value="timeline"><v-icon start>mdi-timeline-text-outline</v-icon>Timeline</v-tab>
            <v-tab value="table"><v-icon start>mdi-table</v-icon>Participation Record</v-tab>
          </v-tabs>

          <v-divider></v-divider>

          <v-window v-model="historyTab">

            <v-window-item value="timeline" class="pa-6">
              <div style="overflow-x: auto; padding-bottom: 24px; padding-top: 8px;">
                <div class="d-flex align-center flex-nowrap position-relative"
                  style="gap: 48px; min-width: max-content; padding: 0 4px;">

                  <!-- Horizontal Connecting Line -->
                  <div
                    style="position: absolute; top: 50%; left: 0; right: 0; height: 2px; background-color: #CBD5E1; z-index: 0; transform: translateY(-50%); pointer-events: none;">
                  </div>

                  <v-card v-for="schedule in reversedSchedules" :key="schedule.id" variant="outlined"
                    style="min-width: 250px; max-width: 320px; flex-shrink: 0; z-index: 1; background-color: white;"
                    class="mb-2 bg-white"
                    :style="{ borderTop: '4px solid ' + getTimelineColor(schedule.Status, schedule.Completed) }">
                    <v-card-title
                      class="text-subtitle-1 py-1 bg-grey-lighten-4 d-flex justify-space-between align-center">
                      <span class="font-weight-bold text-truncate"
                        style="max-width: 60%; font-family: var(--ds-font-family-body); font-size: 0.9rem;">
                        {{ schedule.Appointments?.[0]?.Study?.StudyName || 'Unknown Study' }}
                      </span>
                      <div class="d-flex align-center" style="gap: 4px;">
                        <v-chip size="small" :color="getTimelineColor(schedule.Status, schedule.Completed)"
                          class="text-white font-weight-bold" variant="flat" style="font-size: 0.70rem; height: 20px;">
                          {{ schedule.Status === "Confirmed" && schedule.Completed ? "Completed" : schedule.Status }}
                        </v-chip>
                        <template v-if="isScheduleDeletable(schedule)">
                          <v-btn icon="mdi-delete-outline" variant="text" density="compact" size="small" color="error"
                            @click.stop="confirmDeleteTimelineSchedule(schedule)" title="Delete Schedule"></v-btn>
                        </template>
                        <template v-else>
                          <v-tooltip location="top" max-width="250">
                            <template v-slot:activator="{ props }">
                              <v-btn v-bind="props" icon="mdi-delete-outline" variant="text" density="compact" size="small" color="grey" disabled></v-btn>
                            </template>
                            <span>Only schedules updated within the last 7 days can be deleted.</span>
                          </v-tooltip>
                        </template>
                      </div>
                    </v-card-title>

                    <v-card-text class="pt-2 px-3 pb-2 text-left">
                      <div class="d-flex align-center mb-1">
                        <v-icon size="small" class="mr-2 text-muted">mdi-calendar-clock</v-icon>
                        <strong style="color: var(--ds-value-color); font-size: 0.85rem;">
                          {{ schedule.AppointmentTime ? formatDate(schedule.AppointmentTime) : 'TBD' }}
                        </strong>
                      </div>
                      <div class="d-flex align-center mb-1" v-if="schedule.Personnel">
                        <v-icon size="small" class="mr-2 text-muted">mdi-account</v-icon>
                        <span class="text-caption">Scheduled by: {{ schedule.Personnel.Name }}</span>
                      </div>

                      <div v-if="schedule.Note" class="text-caption text-muted mt-2 pt-1"
                        style="border-top: 1px solid #E2E8F0; line-height: 1.2">
                        <v-icon size="small" class="mr-1">mdi-message-text-outline</v-icon>
                        <em>"{{ schedule.Note }}"</em>
                      </div>
                    </v-card-text>
                  </v-card>
                </div>
              </div>

              <div v-if="!reversedSchedules || reversedSchedules.length === 0"
                class="text-center text-muted py-8">
                <v-icon size="large" class="mb-2" color="grey-lighten-1">mdi-clipboard-text-off-outline</v-icon>
                <div>No participation history available for this family.</div>
              </div>
            </v-window-item>

            <v-window-item value="table" class="pa-4">
              <AppointmentTableBrief :Appointments="flatAppointments" :family="currentFamily" />
            </v-window-item>

          </v-window>
        </v-card>
      </v-col>
    </v-row>

  </v-container>
</template>

<script>
import ChildInfo from "@/components/ChildInfo.vue";
import AlertBanner from "@/components/AlertBanner.vue";
import InfoField from "@/components/InfoField.vue";
import SectionHeader from "@/components/SectionHeader.vue";
import AppointmentTableBrief from "@/components/AppointmentTableBrief.vue";
import family from "@/services/family";
import scheduleService from "@/services/schedule";
import calendar from "@/services/calendar";
import store from "@/store";
import moment from "moment-timezone";

export default {
  components: {
    ChildInfo,
    AlertBanner,
    InfoField,
    SectionHeader,
    AppointmentTableBrief,
  },
  data() {
    return {
      queryString: {},
      page: 0,
      searchStatus: false,
      searchDialog: false,
      detailsDialog: false,
      deleteDialog: false,
      scheduleToDelete: null,
      isDeletingTimelineSchedule: false,
      dialog: false,
      valid: true,
      editedIndex: -1,
      editedItem: {
        id: null, Email: null, Phone: null, CellPhone: null,
        NamePrimary: null, NameSecondary: null, Address: null,
        LanguagePrimary: null, LanguageSecondary: null, EnglishPercent: null,
        RacePrimary: null, RaceSecondary: null, Vehicle: null,
        RecruitmentMethod: null, NextContactDate: null, Note: null,
      },
      familyTemplate: {
        id: null, Email: null, Phone: null, CellPhone: null,
        NamePrimary: null, NameSecondary: null, Address: null,
        LanguagePrimary: null, LanguageSecondary: null, EnglishPercent: null,
        RacePrimary: null, RaceSecondary: null, Vehicle: null,
        RecruitmentMethod: null, NextContactDate: null, Note: null,
        scheduled: false,
      },
      currentFamily: {
        id: null, Email: null, Phone: null, CellPhone: null,
        NamePrimary: null, NameSecondary: null, Address: null,
        LanguagePrimary: null, LanguageSecondary: null, EnglishPercent: null,
        RacePrimary: null, RaceSecondary: null, Vehicle: null,
        RecruitmentMethod: null, NextContactDate: null, Note: null,
        scheduled: false, Children: [], Schedules: [], Conversations: [],
      },
      Families: [],
      familyNotes: "",
      historyTab: 'timeline',
      // Field definitions (migrated from Vue.prototype.$familyFields)
      familyFields: [
        { label: "Email", field: "Email", rules: "email", width: "4", searchable: true },
        { label: "Phone", field: "Phone", rules: "phone", width: "3", searchable: true },
        { label: "Cell Phone", field: "CellPhone", rules: "phone", width: "3", searchable: true },
        { label: "Family ID", field: "id", width: "2", searchable: true },
        { label: "Primary Caregiver", field: "NamePrimary", rules: "name", width: "4", searchable: true },
        { label: "Language (P)", field: "LanguagePrimary", width: "4", options: "language" },
        { label: "Race (P)", field: "RacePrimary", width: "3", options: "race" },
        { label: "Secondary Caregiver", field: "NameSecondary", width: "4", rules: "name", searchable: true },
        { label: "Language (S)", field: "LanguageSecondary", width: "4", options: "language" },
        { label: "Race (S)", field: "RaceSecondary", width: "3", options: "race" },
        { label: "Vehicle", field: "Vehicle", width: "5" },
        { label: "Address", field: "Address", width: "5" },
        { label: "English %", width: "2", field: "EnglishPercent" },
        { label: "Next Contact Date", width: "4", field: "NextContactDate" },
        { label: "Last Contact Date", width: "4", field: "LastContactDate" },
        { label: "Recruited via", field: "RecruitmentMethod", width: "2", options: "recruitmentMethod" },
      ],
      familyBasicInfo: [
        { label: "Primary Caregiver", field: "NamePrimary", rules: "name", width: "4", searchable: true },
        { label: "Language (P)", field: "LanguagePrimary", width: "4", options: "language" },
        { label: "Race (P)", field: "RacePrimary", width: "3", options: "race" },
        { label: "Secondary Caregiver", field: "NameSecondary", width: "4", rules: "name", searchable: true },
        { label: "Language (S)", field: "LanguageSecondary", width: "4", options: "language" },
        { label: "Race (S)", field: "RaceSecondary", width: "3", options: "race" },
        { label: "English %", width: "3", field: "EnglishPercent" },
        { label: "Postal Code", field: "Address", width: "3" },
        { label: "Autism History", field: "AutismHistory", width: "3", options: "autism" },
      ],
      familyContactInfo: [
        { label: "Email", field: "Email", rules: "email", width: "3", searchable: true },
        { label: "Phone", field: "Phone", rules: "phone", width: "3", searchable: true },
        { label: "Cell Phone", field: "CellPhone", rules: "phone", width: "3", searchable: true },
      ],
      searchFamilyCategories: [
        {
          category: "General Identification",
          fields: [
            { label: "Family ID", field: "id", width: "4" },
            { label: "Caregiver Name", field: "NamePrimary", width: "4" },
            { label: "Child Name", field: "childName", width: "4" },
          ]
        },
        {
          category: "Contact Details",
          fields: [
            { label: "Phone", field: "Phone", width: "6" },
            { label: "Email", field: "Email", width: "6" },
          ]
        }
      ],
      Options: {
        autism: [{ title: 'Yes', value: 1 }, { title: 'No', value: 0 }, { title: 'Unknown', value: null }],
        sex: ["F", "M"],
        language: ["English", "French", "Chinese", "Spanish", "Hindi"],
        race: ["Indian", "Asian", "African", "Hispanic", "Caucasian", "Arabic"],
        recruitmentMethod: ["Hospital", "Events", "SocialMedia", "PreviousParticipation"],
        studyType: ["Behavioural", "EEG/ERP", "EyeTracking", "fNIRS", "Online"],
      },
    };
  },

  methods: {
    async updateFamilyAppointment() {
      try {
        var queryString = {};
        queryString = { id: this.currentFamily.id };
        queryString.trainingMode = this.$store.state.trainingMode;

        var updatedFamily = await family.search(queryString);
        if (updatedFamily.data.families && updatedFamily.data.families.length > 0) {
          updatedFamily.data.families[0].scheduled = true;
          this.Families[this.page - 1] = Object.assign({}, updatedFamily.data.families[0]);
          this.currentFamily = this.Families[this.page - 1];
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({ name: "Login" });
        }
      }
    },

    searchMode() {
      this.searchDialog = true;
      this.currentFamily = Object.assign({}, this.familyTemplate);
      this.currentFamily.Children = [];
      this.currentFamily.Schedules = [];
      this.currentFamily.Conversations = [];
      this.Families = [];
      this.page = 0;
      this.queryString = {};
      this.familyNotes = "";
    },

    getSearchKeys(field, value) {
      if (value && field) {
        this.queryString[field] = value;
      }
    },

    async searchFamily() {
      this.$store.dispatch("setLoadingStatus", true);
      this.queryString.trainingMode = this.$store.state.trainingMode;

      try {
        const Results = await family.search(this.queryString);
        if (Results.data.families && Results.data.families.length > 0) {
          this.Families = Results.data.families;
          this.page = 1;
          this.currentFamily = this.Families[this.page - 1];
          this.familyNotes = this.currentFamily.Note || "";
        } else {
          this.page = 0;
          this.currentFamily = Object.assign({}, this.familyTemplate);
          this.currentFamily.Children = [];
          this.currentFamily.Schedules = [];
          this.currentFamily.Email = "";
          this.currentFamily.Phone = "";
          this.currentFamily.CellPhone = "";
          this.currentFamily.id = "";
          this.familyNotes = "";

          alert(Results.data.message || "No families found.");
        }

        this.searchDialog = false;
        this.searchStatus = false;
      } catch (error) {
        if (error.response && error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({ name: "Login" });
        }
      }

      setTimeout(() => this.$store.dispatch("setLoadingStatus", false), 1000);
    },

    async followupSearch() {
      this.$store.dispatch("setLoadingStatus", true);
      this.queryString = {}; // Fix: reset leftover query params before searching followups
      this.queryString.AssignedLab = this.$store.state.lab;
      this.queryString.trainingMode = this.$store.state.trainingMode;

      try {
        const Results = await family.followupSearch(this.queryString);
        if (Results.data && Results.data.length > 0) {
          this.Families = Results.data;
          this.page = 1;
          this.currentFamily = this.Families[this.page - 1];
          this.familyNotes = this.currentFamily.Note || "";
        } else {
          alert("No family needs to be followed up.");
          this.page = 0;
          this.currentFamily = Object.assign({}, this.familyTemplate);
          this.currentFamily.Children = [];
          this.currentFamily.Schedules = [];
          this.familyNotes = "";
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({ name: "Login" });
        }
      }

      setTimeout(() => this.$store.dispatch("setLoadingStatus", false), 1000);
    },

    addFamily() {
      if (this.$store.state.trainingMode) {
        alert("You are currently in Training mode.\n\nAny family created under Training mode will only be accessible for training purpose.\n\nIf you want to create a record for a real family, please turn off the Training mode first.");
      }
      this.editedIndex = -1;
      this.editedItem = Object.assign({}, this.familyTemplate);
      this.dialog = true;
    },

    editFamily() {
      this.editedIndex = this.Families.indexOf(this.currentFamily);
      this.editedItem = Object.assign({}, this.currentFamily);
      this.dialog = true;
    },

    async save() {
      try {
        if (this.editedIndex > -1) {
          this.editedItem.UpdatedBy = store.state.userID;
          delete this.editedItem.Schedules;
          delete this.editedItem.Children;
          delete this.editedItem.Conversations;

          await family.update(this.editedItem);
          Object.assign(this.Families[this.editedIndex], this.editedItem);
          console.log("Family information updated!");
        } else {
          this.editedItem.LastContactDate = new Date();
          this.editedItem.NextContactDate = new Date();
          this.editedItem.UpdatedBy = store.state.userID;
          this.editedItem.CreatedBy = store.state.userID;
          this.editedItem.TrainingSet = this.$store.state.trainingMode;

          const newfamilyId = await family.create(this.editedItem);
          this.editedItem.id = newfamilyId.data.id;
          this.currentFamily = this.editedItem;
          this.currentFamily.Children = [];
          this.currentFamily.Schedules = [];
          this.Families.push(this.editedItem);
          this.page = this.Families.length;
        }
      } catch (error) {
        console.log(error);
      }

      this.close();
    },

    close() {
      this.dialog = false;
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.familyTemplate);
        this.editedIndex = -1;
      }, 300);
    },

    async saveNotes() {
      if (this.currentFamily.id) {
        this.currentFamily.Note = this.familyNotes;
        this.currentFamily.UpdatedBy = store.state.userID;
        await family.update(this.currentFamily);
        Object.assign(this.Families[this.page - 1], this.currentFamily);
      }
    },

    nextPage() {
      this.page += 1;
      this.currentFamily = this.Families[this.page - 1];
      this.familyNotes = this.currentFamily.Note || "";
    },

    previousPage() {
      this.page -= 1;
      this.currentFamily = this.Families[this.page - 1];
      this.familyNotes = this.currentFamily.Note || "";
    },

    PhoneFormated(Phone) {
      if (Phone) {
        var cleaned = ("" + Phone).replace(/\D/g, "");
        var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
          return "(" + match[1] + ") " + match[2] + "-" + match[3];
        }
        return Phone;
      }
      return null;
    },

    formatDate(dateStr) {
      if (!dateStr) return '';
      return moment(dateStr).format('YYYY-MM-DD HH:mm');
    },

    confirmDeleteTimelineSchedule(schedule) {
      this.scheduleToDelete = schedule;
      this.deleteDialog = true;
    },

    async deleteTimelineSchedule() {
      if (!this.scheduleToDelete) return;
      this.isDeletingTimelineSchedule = true;
      try {
        if (this.scheduleToDelete.Appointments) {
          for (const app of this.scheduleToDelete.Appointments) {
            if (app.calendarEventId) {
              await calendar.delete({ 
                id: app.id,
                eventId: app.calendarEventId, 
                FK_Schedule: this.scheduleToDelete.id,
                lab: this.$store.state.lab 
              });
            }
          }
        }

        await scheduleService.delete({ id: this.scheduleToDelete.id });
        
        // Remove from UI cache and enforce reactivity
        if (this.currentFamily && this.currentFamily.Schedules) {
          this.currentFamily.Schedules = this.currentFamily.Schedules.filter(s => s.id !== this.scheduleToDelete.id);
          Object.assign(this.Families[this.page - 1], this.currentFamily);
        }
        
        this.deleteDialog = false;
        this.scheduleToDelete = null;
        alert("Schedule and calendar event successfully deleted.");
      } catch (error) {
        console.error(error);
        alert("Failed to delete the schedule.");
      } finally {
        this.isDeletingTimelineSchedule = false;
      }
    },

    isScheduleDeletable(schedule) {
      if (!schedule.updatedAt) return false;
      const updatedDate = moment(schedule.updatedAt).startOf("day");
      const today = moment().startOf("day");
      const daysDifference = moment.duration(today.diff(updatedDate)).asDays();
      return daysDifference <= 7;
    },

    getTimelineColor(status, completed) {
      switch (status) {
        case "Completed": return "#01579B";
        case "Confirmed": return completed ? "#01579B" : "light-blue-accent-2";
        case "TBD": return "teal-darken-2";
        case "Rescheduling": return "lime-darken-3";
        case "No Show": return "orange-darken-3";
        case "Cancelled": return "deep-orange-darken-1";
        case "Rejected": return "blue-grey-darken-4";
        default: return "grey";
      }
    },
  },

  computed: {
    reversedSchedules() {
      if (!this.currentFamily || !this.currentFamily.Schedules) return [];
      return [...this.currentFamily.Schedules].sort((a, b) => {
        const timeA = new Date(a.updatedAt || 0).getTime();
        const timeB = new Date(b.updatedAt || 0).getTime();
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
      });
    },
    TodaysDate() {
      return moment().startOf("day").format("YYYY-MM-DD");
    },
    flatAppointments() {
      let appointments = [];
      if (this.currentFamily && this.currentFamily.Schedules) {
        this.currentFamily.Schedules.forEach(schedule => {
          if (schedule.Appointments) {
            schedule.Appointments.forEach(app => {
              let row = Object.assign({}, app);
              row.Schedule = {
                AppointmentTime: schedule.AppointmentTime,
                Status: schedule.Status,
                Completed: schedule.Completed,
                updatedAt: schedule.updatedAt,
              };
              appointments.push(row);
            });
          }
        });
      }
      return appointments;
    },
    participationStats() {
      let stats = { Total: 0, Completed: 0, 'No Show': 0, Cancelled: 0, Rejected: 0, Confirmed: 0, TBD: 0, Rescheduling: 0 };
      if (this.currentFamily && this.currentFamily.Schedules) {
        stats.Total = this.currentFamily.Schedules.length;
        this.currentFamily.Schedules.forEach(s => {
          let status = s.Status;
          if (status === 'Confirmed' && s.Completed) status = 'Completed';
          if (stats[status] !== undefined) {
            stats[status]++;
          }
        });
      }
      return stats;
    },
  },

  watch: {
    dialog(val) {
      val || this.close();
    },
  },
};
</script>

<style scoped>
.subtitle {
  padding: 4px 0px 0px 8px !important;
}

.pagination-container {
  text-align: end;
  display: flex;
  align-items: center;
}

.notes-textarea {
  height: 100%;
}
.notes-textarea :deep(.v-field) {
  height: 100%;
}
.notes-textarea :deep(.v-field__field),
.notes-textarea :deep(.v-field__input) {
  height: 100% !important;
}
.notes-textarea :deep(textarea) {
  height: 100% !important;
}
</style>
