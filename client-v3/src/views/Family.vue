<template>
  <v-container fluid>
    <AlertBanner :showAdminEmail="true" />
    <ConfirmDlg ref="confirmD" />

    <v-card class="ds-card mb-6" variant="flat">
      <v-toolbar color="transparent" density="compact">
        <v-btn color="primary" variant="flat" class="mr-2" @click="searchMode" prepend-icon="mdi-magnify">
          Search
        </v-btn>
        <v-btn color="secondary" variant="tonal" class="mr-2" @click="followupSearch" prepend-icon="mdi-phone-clock">
          Follow-ups
        </v-btn>
        <v-btn color="success" variant="tonal" class="mr-2" @click="addFamily" prepend-icon="mdi-account-multiple-plus">
          New Family
        </v-btn>
        
        <v-btn color="warning" variant="tonal" @click="openDuplicateDialog" prepend-icon="mdi-account-search" :disabled="['RA', 'Undergrad'].includes(store.role)">
          Find Duplicates
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

          <v-card-text v-if="currentFamily.id" class="pt-6 flex-grow-1" style="position: relative; z-index: 1;">
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
                    <div class="text-subtitle-2 text-muted d-flex align-center" style="gap: 4px;">
                      Family ID: {{ currentFamily.id || '—' }}
                      <v-btn v-if="currentFamily.id" icon="mdi-content-copy" variant="text" size="x-small"
                        density="compact" @click="copyToClipboard(String(currentFamily.id))"></v-btn>
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
                  <v-chip size="small" variant="tonal" color="indigo-darken-4" prepend-icon="mdi-human-male-child"
                    v-if="currentFamily.Children && currentFamily.Children.length > 0">
                    {{ currentFamily.Children.length }} {{ currentFamily.Children.length === 1 ? 'Child' : 'Children' }}
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

            <!-- Duplicate Children Warning -->
            <v-alert
              v-if="duplicateChildren.length > 0"
              type="warning"
              variant="tonal"
              density="compact"
              class="mb-3"
              icon="mdi-account-alert"
            >
              <div class="d-flex align-center justify-space-between">
                <span class="text-body-2">
                  <strong>{{ duplicateChildren.length }} possible duplicate {{ duplicateChildren.length === 1 ? 'child' : 'children' }}</strong> detected in this family.
                </span>
                <v-btn
                  size="small"
                  variant="flat"
                  color="warning"
                  class="ml-3 text-none"
                  @click="childMergeCandidates = duplicateChildren; childMergeDialog = true; selectedMasterChildIds = duplicateChildren.map(() => null)"
                >
                  Merge Duplicate Children
                </v-btn>
              </div>
            </v-alert>

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
              <v-list-item prepend-icon="mdi-email-outline" class="px-0">
                <v-list-item-title class="d-flex align-center">
                  <span>{{ currentFamily.Email || 'No email provided' }}</span>
                  <v-btn v-if="currentFamily.Email" icon="mdi-content-copy" variant="text" size="x-small" density="compact" class="ml-2" @click="copyToClipboard(currentFamily.Email)"></v-btn>
                </v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-phone-outline" class="px-0">
                <v-list-item-title class="d-flex align-center">
                  <span v-if="currentFamily.Phone">{{ PhoneFormated(currentFamily.Phone) }}</span>
                  <span v-else class="text-muted">No phone</span>
                  <v-btn v-if="currentFamily.Phone" icon="mdi-content-copy" variant="text" size="x-small" density="compact" class="ml-2" @click="copyToClipboard(currentFamily.Phone)"></v-btn>
                  <span v-if="currentFamily.CellPhone" class="text-muted ml-2">(Cell: {{ PhoneFormated(currentFamily.CellPhone) }})</span>
                  <v-btn v-if="currentFamily.CellPhone" icon="mdi-content-copy" variant="text" size="x-small" density="compact" class="ml-2" @click="copyToClipboard(currentFamily.CellPhone)"></v-btn>
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

          <!-- Empty State Container -->
          <v-card-text v-else class="text-center py-12 flex-grow-1 d-flex flex-column align-center justify-center">
            <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-home-search-outline</v-icon>
            <div class="text-h6 text-muted font-weight-bold mb-2">No Family Selected</div>
            <div class="text-body-2 text-muted px-4">
              Click "Search" above to find a family, or use the navigation arrows if you have already searched.
            </div>
            <v-btn color="primary" variant="tonal" class="mt-6" @click="searchMode" prepend-icon="mdi-magnify">
              Search Families
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Family Edit/Add Dialog -->
      <v-dialog v-model="dialog" max-width="1000px" persistent scrollable>
        <v-card class="ds-card" variant="flat">
          <v-card-title class="d-flex justify-space-between align-center py-4 ds-header-gradient">
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
          <v-card-title class="d-flex justify-space-between align-center py-4 ds-header-gradient">
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
          <v-card-title class="d-flex justify-space-between align-center py-4 ds-header-gradient">
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
      <v-col cols="12" md="4" style="height: 500px; overflow-y: auto; padding: 0px;">
        <div v-if="currentFamily.id" class="h-100">
          <ChildInfo ref="childInfo" :Children="currentFamily.Children"
            :familyId="currentFamily.id ? parseInt(currentFamily.id) : null" :currentFamily="currentFamily"
            @newSchedule="updateFamilyAppointment" @childAdded="updateFamilyAppointment"></ChildInfo>
        </div>
        <v-card v-else class="ds-card h-100 d-flex flex-column align-center justify-center" variant="flat">
          <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-human-male-child</v-icon>
          <div class="text-h6 text-muted font-weight-bold">Child Information</div>
          <div class="text-body-2 text-muted px-4 text-center mt-2">
            Children associated with the family will appear here.
          </div>
        </v-card>
      </v-col>

      <!-- RIGHT COLUMN: Notes & Conversations -->
      <v-col cols="12" md="3">
        <div v-if="currentFamily.id" class="h-100">
          <NotesConversation
            class="h-100"
            :Conversation="currentFamily.Conversations || []"
            :familyId="currentFamily.id ? parseInt(currentFamily.id) : null"
            :notes="familyNotes"
            @updateNotes="saveNotes"
          />
        </div>
        <v-card v-else class="ds-card h-100 d-flex flex-column align-center justify-center" variant="flat">
          <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-forum-outline</v-icon>
          <div class="text-h6 text-muted font-weight-bold">Notes & Conversations</div>
          <div class="text-body-2 text-muted px-4 text-center mt-2">
            Select a family to view their communication history.
          </div>
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
    <v-row class="mt-6 mb-12" v-if="currentFamily.id">
      <v-col cols="12">
        <v-card class="ds-card" variant="flat">

          <v-tabs v-model="historyTab" color="primary" bg-color="grey-lighten-4" align-tabs="center">
            <v-tab value="timeline"><v-icon start>mdi-timeline-text-outline</v-icon>Timeline</v-tab>
            <v-tab value="table"><v-icon start>mdi-table</v-icon>Participation Record</v-tab>
          </v-tabs>

          <v-divider></v-divider>

          <v-window v-model="historyTab">

            <v-window-item value="timeline" class="pa-6">
              
              <div v-if="reversedSchedules && reversedSchedules.length > 0" class="d-flex align-center text-caption text-muted mb-2">
                <v-icon size="small" class="mr-1" color="grey">mdi-information-outline</v-icon>
                <span>Only schedules updated within the last 7 days can be deleted.</span>
              </div>

              <div style="overflow-x: auto; padding-bottom: 24px; padding-top: 8px;">
                <div class="d-flex align-center flex-nowrap position-relative"
                  style="gap: 48px; min-width: max-content; padding: 0 4px;">

                  <!-- Horizontal Connecting Line -->
                  <div
                    style="position: absolute; top: 50%; left: 0; right: 0; height: 2px; background-color: #CBD5E1; z-index: 0; transform: translateY(-50%); pointer-events: none;">
                  </div>

                  <TimelineCard v-for="schedule in reversedSchedules" :key="schedule.id"
                    :schedule="schedule"
                    :deletable="isScheduleDeletable(schedule)"
                    @delete="confirmDeleteTimelineSchedule" />
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

    <v-dialog v-model="duplicateDialog" max-width="900px" scrollable persistent>
      <v-card class="ds-card" variant="flat">
        <v-card-title class="d-flex justify-space-between align-center py-4 ds-header-gradient">
          <span class="text-h6 font-weight-bold" style="font-family: var(--ds-font-family-heading)">
            Resolve Duplicated Families
          </span>
          <v-btn icon="mdi-close" variant="text" density="comfortable" @click="duplicateDialog = false"></v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pt-6 pb-2 bg-grey-lighten-4" style="max-height: 70vh;">
          <div v-if="loadingDuplicates" class="text-center py-12">
            <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
            <div class="mt-4 text-muted">Scanning database for matching emails or phones...</div>
          </div>
          
          <div v-else-if="duplicateGroups.length === 0" class="text-center py-12">
            <v-icon size="64" color="success">mdi-check-decagram</v-icon>
            <h3 class="text-h6 mt-4 text-success">Database is clean!</h3>
            <div class="text-muted">No suspicious duplicate families found.</div>
          </div>

          <v-expansion-panels v-else variant="accordion">
            <v-expansion-panel v-for="(group, index) in duplicateGroups" :key="index" class="mb-4 rounded">
              <v-expansion-panel-title class="font-weight-bold text-primary">
                {{ group.matchReason }} 
                <v-chip size="x-small" color="error" class="ml-3">{{ group.families.length }} Records Found</v-chip>
              </v-expansion-panel-title>
              
              <v-expansion-panel-text class="bg-white pt-4">
                <v-alert type="info" variant="tonal" density="compact" class="mb-4">
                  Select the <strong>Master Record</strong> you want to keep. Study histories will always be moved into the Master Record. Children can optionally be merged too.
                </v-alert>

                <v-radio-group v-model="selectedPrimaryIds[index]">
                  <v-card v-for="fam in group.families" :key="fam.id" variant="outlined" class="mb-3 pa-3" :style="selectedPrimaryIds[index] === fam.id ? 'border-color: var(--color-primary) !important; background-color: rgba(30, 64, 175, 0.05);' : ''">
                    <div class="d-flex align-start">
                      <v-radio :value="fam.id" color="primary" class="mt-n1"></v-radio>
                      <div class="flex-grow-1">
                        <div class="d-flex justify-space-between align-center">
                          <strong class="text-subtitle-1">{{ fam.NamePrimary || 'Unknown Parent' }}</strong>
                          <span class="text-caption text-muted">ID: {{ fam.id }}</span>
                        </div>
                        <div class="text-body-2 text-muted mb-2">
                          Email: {{ fam.Email || '—' }} | Phone: {{ fam.Phone || '—' }}
                        </div>
                        <div class="d-flex align-center" style="gap: 8px; flex-wrap: wrap;">
                          <!-- Children chip -->
                          <v-chip size="small" :color="fam.Children && fam.Children.length > 0 ? 'primary' : 'grey'" variant="tonal" prepend-icon="mdi-human-child">
                            {{ fam.Children?.length || 0 }} {{ fam.Children?.length === 1 ? 'Child' : 'Children' }}
                            <span v-if="fam.Children && fam.Children.length > 0" class="ml-1">
                              ({{ fam.Children.map(c => c.Name.split(' ')[0]).join(', ') }})
                            </span>
                          </v-chip>
                          <!-- Studies chip -->
                          <v-chip size="small" :color="fam.Schedules && fam.Schedules.length > 0 ? 'teal' : 'grey'" variant="tonal" prepend-icon="mdi-flask-outline">
                            {{ fam.Schedules?.length || 0 }} {{ fam.Schedules?.length === 1 ? 'Study' : 'Studies' }}
                          </v-chip>
                        </div>
                      </div>
                    </div>
                  </v-card>
                </v-radio-group>

                <!-- Children merge decision -->
                <v-card variant="tonal" color="blue-grey" class="pa-4 mt-2 mb-4 rounded">
                  <div class="d-flex align-center justify-space-between">
                    <div>
                      <div class="text-body-2 font-weight-bold">Merge Children into Master Record?</div>
                      <div class="text-caption text-muted mt-1">
                        <span v-if="mergeChildrenFlags[index]">Children from all records will be <strong>combined</strong> under the Master Record.</span>
                        <span v-else>Children will <strong>stay</strong> in their original family records (only study histories are merged).</span>
                      </div>
                    </div>
                    <v-switch
                      v-model="mergeChildrenFlags[index]"
                      color="primary"
                      hide-details
                      density="compact"
                      class="ml-4 flex-shrink-0"
                    ></v-switch>
                  </div>
                </v-card>

                <div class="d-flex justify-end mt-2">
                  <v-btn variant="text" color="grey" class="mr-2" @click="dismissGroup(index)">Dismiss (Not Duplicates)</v-btn>
                  <v-btn color="warning" variant="flat" :disabled="!selectedPrimaryIds[index]" @click="mergeGroup(index, group)">Merge & Clean</v-btn>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Child Duplicate Merge Dialog -->
    <v-dialog v-model="childMergeDialog" max-width="600px" persistent>
      <v-card class="ds-card" variant="flat">
        <v-card-title class="d-flex justify-space-between align-center py-4 ds-header-gradient">
          <span class="text-h6 font-weight-bold" style="font-family: var(--ds-font-family-heading)">Merge Duplicate Children</span>
          <v-btn icon="mdi-close" variant="text" density="comfortable" @click="childMergeDialog = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-4">
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            Select the <strong>Master Record</strong> to keep. The other record's appointments will be moved into it, then deleted.
          </v-alert>

          <div v-for="(pair, pi) in childMergeCandidates" :key="pi" class="mb-6">
            <div class="text-caption font-weight-bold text-uppercase text-muted mb-2">
              Possible duplicate pair {{ pi + 1 }}
            </div>
            <v-radio-group v-model="selectedMasterChildIds[pi]">
              <v-card
                v-for="c in [pair.a, pair.b]"
                :key="c.id"
                variant="outlined"
                class="mb-2 pa-3"
                :style="selectedMasterChildIds[pi] === c.id ? 'border-color: var(--color-primary) !important; background: rgba(30,64,175,0.05)' : ''"
              >
                <div class="d-flex align-center">
                  <v-radio :value="c.id" color="primary"></v-radio>
                  <div class="ml-2">
                    <div class="font-weight-bold">{{ c.Name }}</div>
                    <div class="text-caption text-muted">
                      DoB: {{ c.DoB ? c.DoB.slice(0, 10) : '—' }} &nbsp;·&nbsp;
                      Sex: {{ c.Sex || '—' }} &nbsp;·&nbsp;
                      ID: {{ c.id }}
                    </div>
                  </div>
                </div>
              </v-card>
            </v-radio-group>
          </div>
        </v-card-text>
        <v-card-actions class="px-6 pb-6 pt-0 d-flex justify-end">
          <v-btn color="grey" variant="text" class="mr-2" @click="childMergeDialog = false">Cancel</v-btn>
          <v-btn color="warning" variant="flat"
            :disabled="childMergeCandidates.some((_, pi) => !selectedMasterChildIds[pi])"
            @click="mergeChildPair">
            Merge & Keep Masters
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>
import ChildInfo from "@/components/ChildInfo.vue";
import AlertBanner from "@/components/AlertBanner.vue";
import InfoField from "@/components/InfoField.vue";
import SectionHeader from "@/components/SectionHeader.vue";
import AppointmentTableBrief from "@/components/AppointmentTableBrief.vue";
import TimelineCard from "@/components/TimelineCard.vue";
import NotesConversation from "@/components/NotesConversation.vue";
import ConfirmDlg from "@/components/ConfirmDialog.vue";
import child from "@/services/child";
import family from "@/services/family";
import scheduleService from "@/services/schedule";
import calendar from "@/services/calendar";
import { useMainStore } from "@/stores/mainStore";
import moment from "moment-timezone";

export default {
  components: {
    ChildInfo,
    AlertBanner,
    InfoField,
    SectionHeader,
    AppointmentTableBrief,
    TimelineCard,
    NotesConversation,
    ConfirmDlg,
  },
  setup() {
    const store = useMainStore();
    return { store };
  },
  data() {
    return {
      duplicateDialog: false,
      loadingDuplicates: false,
      duplicateGroups: [],
      selectedPrimaryIds: {},
      mergeChildrenFlags: {}, // per-group toggle: whether to merge children
      // Child merge dialog
      childMergeDialog: false,
      childMergeCandidates: [],  // [{a: child, b: child}, ...]
      selectedMasterChildIds: [], // per-pair selection (array indexed by pair)
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
        { label: "Next Contact Date", width: "4", field: "NextContactDate", rules: "date" },
        { label: "Last Contact Date", width: "4", field: "LastContactDate", rules: "date" },
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
    copyToClipboard(text) {
      if (!text) return;
      navigator.clipboard.writeText(String(text)).catch(() => {
        const el = document.createElement('textarea');
        el.value = String(text);
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      });
    },

    async openDuplicateDialog() {
      this.duplicateDialog = true;
      this.loadingDuplicates = true;
      this.duplicateGroups = [];
      this.selectedPrimaryIds = {};
      this.mergeChildrenFlags = {};
      
      try {
        const response = await family.getDuplicates();
        this.duplicateGroups = response.data;
        // Pre-populate mergeChildrenFlags reactively so Vue tracks every key
        const flags = {};
        this.duplicateGroups.forEach((_, i) => { flags[i] = true; });
        this.mergeChildrenFlags = flags;
      } catch (error) {
        console.error("Failed to load duplicates", error);
        this.$refs.confirmD.open('Error', 'Failed to scan for duplicates.', { color: 'error', noconfirm: true });
      }
      this.loadingDuplicates = false;
    },

    dismissGroup(index) {
      // Remove the group and rebuild index maps to prevent stale index references
      this.duplicateGroups.splice(index, 1);
      const newSelected = {};
      const newMergeFlags = {};
      this.duplicateGroups.forEach((_, i) => {
        // Shift down: old index i+1 (if > removed) becomes i
        const oldIdx = i >= index ? i + 1 : i;
        if (this.selectedPrimaryIds[oldIdx] !== undefined)
          newSelected[i] = this.selectedPrimaryIds[oldIdx];
        newMergeFlags[i] = this.mergeChildrenFlags[oldIdx] !== undefined
          ? this.mergeChildrenFlags[oldIdx] : true;
      });
      this.selectedPrimaryIds = newSelected;
      this.mergeChildrenFlags = newMergeFlags;
    },

    async mergeGroup(index, group) {
      const primaryId = this.selectedPrimaryIds[index];
      const secondaryIds = group.families.map(f => f.id).filter(id => id !== primaryId);
      const mergeChildren = this.mergeChildrenFlags[index] !== false;

      // Show the primary family's name in the confirm dialog, not just its ID
      const primaryFamily = group.families.find(f => f.id === primaryId);
      const primaryLabel = primaryFamily?.NamePrimary
        ? `"${primaryFamily.NamePrimary}" (ID: ${primaryId})`
        : `ID: ${primaryId}`;

      const childNote = mergeChildren ? 'Children from all records will be combined.' : 'Children will stay in their own records.';
      const confirmMsg = `Merge ${secondaryIds.length} record(s) into Master Record ${primaryLabel}?\n\n${childNote}\n\nThis cannot be undone.`;

      if (await this.$refs.confirmD.open("Confirm Merge", confirmMsg, { color: "warning" })) {
        this.store.setLoadingStatus(true);
        try {
          await family.merge({ primaryId, secondaryIds }, mergeChildren);

          this.$refs.confirmD.open('Success', 'Records successfully merged and cleaned.', { color: 'success', noconfirm: true });

          // Remove the resolved group and rebuild index maps (same as dismissGroup)
          this.duplicateGroups.splice(index, 1);
          const newSelected = {};
          const newMergeFlags = {};
          this.duplicateGroups.forEach((_, i) => {
            const oldIdx = i >= index ? i + 1 : i;
            if (this.selectedPrimaryIds[oldIdx] !== undefined)
              newSelected[i] = this.selectedPrimaryIds[oldIdx];
            newMergeFlags[i] = this.mergeChildrenFlags[oldIdx] !== undefined
              ? this.mergeChildrenFlags[oldIdx] : true;
          });
          this.selectedPrimaryIds = newSelected;
          this.mergeChildrenFlags = newMergeFlags;

          // Refresh the family list if the merged records were currently visible
          if (this.currentFamily.id === primaryId || secondaryIds.includes(this.currentFamily.id)) {
            this.searchFamily();
          }

        } catch (error) {
          console.error("Merge failed", error);
          this.$refs.confirmD.open('Error', 'Failed to merge families.', { color: 'error', noconfirm: true });
        }
        this.store.setLoadingStatus(false);
      }
    },

    async mergeChildPair() {
      // Build one flat list of all secondaryIds across all pairs
      const secondarySummary = this.childMergeCandidates.map((pair, pi) => {
        const masterId = this.selectedMasterChildIds[pi];
        const otherId = [pair.a.id, pair.b.id].find(id => id !== masterId);
        const masterName = [pair.a, pair.b].find(c => c.id === masterId)?.Name || masterId;
        return { masterId, otherId, masterName };
      });

      const confirmLines = secondarySummary.map(s =>
        `Keep "${s.masterName}" (ID: ${s.masterId}), remove ID: ${s.otherId}`
      ).join('\n');

      const confirmed = await this.$refs.confirmD.open(
        "Confirm Child Merge",
        `${confirmLines}\n\nThis cannot be undone.`,
        { color: "warning" }
      );
      if (!confirmed) return;

      this.store.setLoadingStatus(true);
      try {
        // Merge each pair sequentially (they all belong to the same family)
        for (const { masterId, otherId } of secondarySummary) {
          await child.mergeChildren(masterId, [otherId]);
        }
        this.$refs.confirmD.open('Success', 'Children successfully merged.', { color: 'success', noconfirm: true });
        this.childMergeDialog = false;
        // Reload the current family to get fresh children data
        await this.updateFamilyAppointment();
      } catch (error) {
        console.error("Child merge failed", error);
        this.$refs.confirmD.open('Error', 'Failed to merge children.', { color: 'error', noconfirm: true });
      }
      this.store.setLoadingStatus(false);
    },

    async updateFamilyAppointment() {
      try {
        var queryString = {};
        queryString = { id: this.currentFamily.id };
        queryString.trainingMode = this.store.trainingMode;

        var updatedFamily = await family.search(queryString);
        if (updatedFamily.data.families && updatedFamily.data.families.length > 0) {
          updatedFamily.data.families[0].scheduled = true;
          this.Families[this.page - 1] = Object.assign({}, updatedFamily.data.families[0]);
          this.currentFamily = this.Families[this.page - 1];
        }
      } catch (error) {
        if (error.response?.status !== 401) console.error(error);
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
      this.store.setLoadingStatus(true);
      this.queryString.trainingMode = this.store.trainingMode;

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

          this.$refs.confirmD.open('No Results', Results.data.message || 'No families found.', { color: 'warning', noconfirm: true });
        }

        this.searchDialog = false;
        this.searchStatus = false;
      } catch (error) {
        if (error.response?.status !== 401) console.error(error);
      }

      setTimeout(() => this.store.setLoadingStatus(false), 1000);
    },

    async followupSearch() {
      this.store.setLoadingStatus(true);
      this.queryString = {}; // Fix: reset leftover query params before searching followups
      this.queryString.AssignedLab = this.store.lab;
      this.queryString.trainingMode = this.store.trainingMode;

      try {
        const Results = await family.followupSearch(this.queryString);
        if (Results.data && Results.data.length > 0) {
          this.Families = Results.data;
          this.page = 1;
          this.currentFamily = this.Families[this.page - 1];
          this.familyNotes = this.currentFamily.Note || "";
        } else {
          this.$refs.confirmD.open('No Results', 'No family needs to be followed up.', { color: 'warning', noconfirm: true });
          this.page = 0;
          this.currentFamily = Object.assign({}, this.familyTemplate);
          this.currentFamily.Children = [];
          this.currentFamily.Schedules = [];
          this.familyNotes = "";
        }
      } catch (error) {
        if (error.response?.status !== 401) console.error(error);
      }

      setTimeout(() => this.store.setLoadingStatus(false), 1000);
    },

    addFamily() {
      if (this.store.trainingMode) {
        this.$refs.confirmD.open('Training Mode', 'You are currently in Training mode.<br><br>Any family created under Training mode will only be accessible for training purpose.<br><br>If you want to create a record for a real family, please turn off the Training mode first.', { color: 'warning', noconfirm: true });
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
          this.editedItem.UpdatedBy = this.store.userID;
          delete this.editedItem.Schedules;
          delete this.editedItem.Children;
          delete this.editedItem.Conversations;

          await family.update(this.editedItem);
          Object.assign(this.Families[this.editedIndex], this.editedItem);
          console.log("Family information updated!");
        } else {
          this.editedItem.LastContactDate = new Date();
          this.editedItem.NextContactDate = new Date();
          this.editedItem.UpdatedBy = this.store.userID;
          this.editedItem.CreatedBy = this.store.userID;
          this.editedItem.TrainingSet = this.store.trainingMode;

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

    async saveNotes(newNotes) {
      if (this.currentFamily.id) {
        this.familyNotes = newNotes; // Update local state
        this.currentFamily.Note = newNotes;
        this.currentFamily.UpdatedBy = this.store.userID;
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
                lab: this.store.lab 
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
        this.$refs.confirmD.open('Deleted', 'Schedule and calendar event successfully deleted.', { color: 'success', noconfirm: true });
      } catch (error) {
        console.error(error);
        this.$refs.confirmD.open('Error', 'Failed to delete the schedule.', { color: 'error', noconfirm: true });
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

    // Detect children within the current family that might be the same person
    // (same name, same DoB, or same name+sex). Returns pairs to highlight.
    duplicateChildren() {
      const kids = this.currentFamily?.Children || [];
      if (kids.length < 2) return [];
      const pairs = [];
      const seen = new Set();
      for (let i = 0; i < kids.length; i++) {
        for (let j = i + 1; j < kids.length; j++) {
          const a = kids[i], b = kids[j];
          const key = [a.id, b.id].sort().join('-');
          if (seen.has(key)) continue;
          const sameName = a.Name && b.Name &&
            a.Name.trim().toLowerCase() === b.Name.trim().toLowerCase();
          const sameDoB = a.DoB && b.DoB &&
            a.DoB.slice(0, 10) === b.DoB.slice(0, 10);
          if (sameName || sameDoB) {
            pairs.push({ a, b });
            seen.add(key);
          }
        }
      }
      return pairs;
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
