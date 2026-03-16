<template>
  <v-container fluid>
    <AlertBanner :showAdminEmail="true" />
    <ConfirmDlg ref="confirmD" />

    <!-- ============================================ -->
    <!-- STATE 1: Study Cards Grid (no study selected) -->
    <!-- ============================================ -->
    <div v-if="!currentStudy.id">
      
      <v-card class="ds-card mb-6" variant="flat">
        <v-toolbar color="transparent" density="compact" class="px-2">
          <v-icon class="mr-2" color="primary">mdi-flask-outline</v-icon>
          <span class="text-subtitle-1 font-weight-bold" style="font-family: var(--ds-font-family-heading); color: rgb(var(--v-theme-primary))">
            Study Management
          </span>
          
          <v-spacer></v-spacer>

          <v-text-field 
            v-model="search" 
            placeholder="Search by Study Name..." 
            density="compact"
            variant="outlined" 
            hide-details 
            prepend-inner-icon="mdi-magnify"
            style="max-width: 300px; background-color: white;"
            class="mr-4"
          ></v-text-field>

          <v-switch 
            v-model="inProgressStudyFilter" 
            label="In Progress Only" 
            color="primary"
            hide-details 
            density="compact"
            class="mr-4"
          ></v-switch>

          <v-btn color="success" variant="tonal" prepend-icon="mdi-plus" @click.stop="createStudy" :disabled="!canCreateStudy">
            New Study
          </v-btn>
        </v-toolbar>
      </v-card>

      <v-row>
        <v-col cols="12" sm="6" md="4" lg="3" v-for="study in filteredStudies" :key="study.id">
          <v-card class="ds-card ds-interactive h-100 d-flex flex-column" variant="flat" @click="rowSelected(null, { item: study })">
            
            <v-card-title class="d-flex justify-space-between align-start pt-4" style="white-space: normal; line-height: 1.3;">
              <span class="text-h6 font-weight-bold" style="font-family: var(--ds-font-family-heading); color: var(--color-primary)">
                {{ study.StudyName }}
              </span>
            </v-card-title>
            
            <v-card-subtitle class="pb-3 mt-1">
              <v-chip size="x-small" variant="tonal" color="primary" class="mr-2">{{ study.StudyType }}</v-chip>
              <v-chip size="x-small" :color="study.Completed ? 'success' : 'warning'" variant="flat" class="text-white font-weight-bold">
                {{ study.Completed ? 'Completed' : 'In Progress' }}
              </v-chip>
            </v-card-subtitle>

            <v-card-text class="flex-grow-1 pt-2">
              <div class="d-flex align-center mb-2">
                <v-icon size="small" class="mr-3" color="grey">mdi-account-star</v-icon>
                <span class="text-body-2 font-weight-medium">{{ study.PointofContact?.Name || 'No Contact Set' }}</span>
              </div>
              <div class="d-flex align-center mb-2">
                <v-icon size="small" class="mr-3" color="grey">mdi-human-child</v-icon>
                <span class="text-body-2 text-muted">
                  <template v-if="study.AgeGroups && study.AgeGroups.length > 0">
                    {{ AgeFormated(study.AgeGroups[0].MinAge) }} — {{ AgeFormated(study.AgeGroups[0].MaxAge) }}
                    <span v-if="study.AgeGroups.length > 1" class="font-weight-bold ml-1">(+{{ study.AgeGroups.length - 1 }})</span>
                  </template>
                  <template v-else>Age range not set</template>
                </span>
              </div>
              <div class="d-flex align-center">
                <v-icon size="small" class="mr-3" color="grey">mdi-door-open</v-icon>
                <span class="text-body-2 text-muted text-truncate">{{ getRoomName(study.FK_TestingRoom) }}</span>
              </div>
            </v-card-text>

            <v-divider></v-divider>
            
            <v-card-actions class="pa-3 bg-grey-lighten-4 d-flex justify-space-between align-center">
              <span class="text-caption text-muted font-weight-bold">ID: {{ study.id }}</span>
              <v-btn size="small" color="primary" variant="text" append-icon="mdi-arrow-right" class="text-none">Manage</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <v-col cols="12" v-if="filteredStudies.length === 0">
          <v-card class="ds-card text-center py-12" variant="flat">
            <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-flask-empty-outline</v-icon>
            <h3 class="text-h6 text-muted">No studies found</h3>
            <p class="text-body-2 text-muted">Try adjusting your search or filter settings.</p>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- ============================================ -->
    <!-- STATE 2: Full-Width Detail View (study selected) -->
    <!-- ============================================ -->
    <!-- ============================================ -->
    <!-- STATE 2: Full-Width Detail View (study selected) -->
    <!-- ============================================ -->
    <div v-else>
      <v-toolbar color="transparent" density="compact" class="mb-4 px-0">
        <v-btn variant="text" prepend-icon="mdi-arrow-left" class="text-none font-weight-bold text-muted mr-4" @click="clearSelection">
          Back to Studies
        </v-btn>
        <v-divider vertical class="my-3 mr-4"></v-divider>
        <h2 class="text-h5 font-weight-bold text-truncate" style="font-family: var(--ds-font-family-heading); color: var(--color-primary); max-width: 400px;">
          {{ currentStudy.StudyName }}
        </h2>
        <v-chip class="ml-4" size="small" variant="tonal" color="primary">{{ currentStudy.StudyType }}</v-chip>
        <v-chip class="ml-2" size="small" :color="currentStudy.Completed ? 'success' : 'warning'" variant="flat" class="text-white font-weight-bold">
          {{ currentStudy.Completed ? 'Completed' : 'In Progress' }}
        </v-chip>
        
        <v-spacer></v-spacer>
        
        <v-btn 
          :color="currentStudy.Completed ? 'warning' : 'success'" 
          variant="outlined" 
          :prepend-icon="currentStudy.Completed ? 'mdi-restore' : 'mdi-check-all'" 
          class="mr-2" 
          @click.stop="changeStudyStatus(currentStudy)" 
          :disabled="!canManageStudyStatus(currentStudy)"
        >
          {{ currentStudy.Completed ? 'Mark In Progress' : 'Mark Completed' }}
        </v-btn>
        
        <v-btn 
          color="secondary" 
          variant="outlined" 
          prepend-icon="mdi-content-copy" 
          class="mr-2" 
          @click.stop="duplicateStudy" 
          :disabled="!canDuplicateStudy"
        >
          Duplicate
        </v-btn>

        <v-btn color="error" variant="text" prepend-icon="mdi-delete" class="mr-2" @click.stop="deleteStudy" :disabled="!canEditStudy">
          Delete
        </v-btn>
        <v-btn color="primary" variant="outlined" prepend-icon="mdi-pencil" @click.stop="editStudy" :disabled="!canEditStudy">
          Edit Settings
        </v-btn>
      </v-toolbar>

      <v-card class="ds-card" variant="flat">
        <v-tabs v-model="studyTab" color="primary" bg-color="grey-lighten-4" align-tabs="start">
          <v-tab value="overview"><v-icon start>mdi-text-box-search-outline</v-icon>Overview</v-tab>
          <v-tab value="analytics"><v-icon start>mdi-chart-line</v-icon>Analytics</v-tab>
          <v-tab value="logistics"><v-icon start>mdi-account-group-outline</v-icon>Team & Logistics</v-tab>
          <v-tab value="communications"><v-icon start>mdi-email-fast-outline</v-icon>Communications</v-tab>
        </v-tabs>
        <v-divider></v-divider>

        <v-window v-model="studyTab">
          <v-window-item value="overview" class="pa-6">
            <v-row>
              <v-col cols="12" md="8">
                <SectionHeader title="Study Description" icon="mdi-card-text-outline" class="mt-0" />
                <div class="text-body-1 bg-grey-lighten-4 pa-6 rounded" style="white-space: pre-wrap; line-height: 1.6; border: 1px solid #E2E8F0;">
                  {{ currentStudy.Description || 'No description provided.' }}
                </div>
              </v-col>
              
              <v-col cols="12" md="4" style="border-left: 1px solid #E2E8F0;">
                <SectionHeader title="Recruitment Criteria" icon="mdi-filter-variant" class="mt-0" />
                
                <div class="mb-6">
                  <div class="text-caption font-weight-bold text-uppercase text-muted mb-2">Age Groups</div>
                  <div v-if="currentStudy.AgeGroups && currentStudy.AgeGroups.length > 0" class="d-flex flex-wrap gap-2">
                    <v-chip v-for="(group, i) in currentStudy.AgeGroups" :key="i" size="small" color="primary" variant="tonal">
                      <v-icon start size="14">mdi-human-child</v-icon>
                      {{ AgeFormated(group.MinAge) }} – {{ AgeFormated(group.MaxAge) }}
                    </v-chip>
                  </div>
                  <span v-else class="text-body-2 text-muted">—</span>
                </div>

                <div v-if="currentStudy.Prerequisites && currentStudy.Prerequisites.length > 0" class="mb-6">
                  <div class="text-caption font-weight-bold text-uppercase text-muted mb-2">Prerequisites</div>
                  <div class="d-flex flex-wrap gap-2">
                    <v-chip v-for="p in currentStudy.Prerequisites" :key="p.id" size="small" color="success" variant="tonal">
                      <v-icon start size="14">mdi-check-circle-outline</v-icon>{{ p.StudyName }}
                    </v-chip>
                  </div>
                </div>
                
                <div v-if="currentStudy.Exclusions && currentStudy.Exclusions.length > 0" class="mb-6">
                  <div class="text-caption font-weight-bold text-uppercase text-muted mb-2">Exclusions</div>
                  <div class="d-flex flex-wrap gap-2">
                    <v-chip v-for="e in currentStudy.Exclusions" :key="e.id" size="small" color="error" variant="tonal">
                      <v-icon start size="14">mdi-close-circle-outline</v-icon>{{ e.StudyName }}
                    </v-chip>
                  </div>
                </div>

                <div>
                  <div class="text-caption font-weight-bold text-uppercase text-muted mb-2">Participant Health Criteria</div>
                  <div class="d-flex flex-wrap gap-2" style="gap: 8px;">
                    <v-chip size="x-small" variant="tonal" :color="criteriaColor(currentStudy.ASDParticipant)">ASD: {{ currentStudy.ASDParticipant }}</v-chip>
                    <v-chip size="x-small" variant="tonal" :color="criteriaColor(currentStudy.PrematureParticipant)">Premature: {{ currentStudy.PrematureParticipant }}</v-chip>
                    <v-chip size="x-small" variant="tonal" :color="criteriaColor(currentStudy.IllParticipant)">Illness: {{ currentStudy.IllParticipant }}</v-chip>
                    <v-chip size="x-small" variant="tonal" :color="criteriaColor(currentStudy.VisionLossParticipant)">Vision: {{ currentStudy.VisionLossParticipant }}</v-chip>
                    <v-chip size="x-small" variant="tonal" :color="criteriaColor(currentStudy.HearingLossParticipant)">Hearing: {{ currentStudy.HearingLossParticipant }}</v-chip>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-window-item>

          <v-window-item value="analytics" class="pa-6 bg-grey-lighten-4">
            <div v-if="studyStatsLoaded">
              
              <v-row class="mb-4">
                <v-col cols="12" sm="4">
                  <v-card class="ds-card pa-4 d-flex align-center" variant="flat" style="border-left: 4px solid var(--color-primary) !important;">
                    <v-avatar color="primary" variant="tonal" size="56" class="mr-4">
                      <v-icon size="28">mdi-account-group</v-icon>
                    </v-avatar>
                    <div>
                      <div class="text-caption font-weight-bold text-uppercase text-muted">Total Recruited</div>
                      <div class="text-h4 font-weight-bold" style="color: var(--color-primary)">{{ kpiTotalRecruited }}</div>
                    </div>
                  </v-card>
                </v-col>

                <v-col cols="12" sm="4">
                  <v-card class="ds-card pa-4 d-flex align-center" variant="flat" style="border-left: 4px solid #10B981 !important;">
                    <v-avatar color="success" variant="tonal" size="56" class="mr-4">
                      <v-icon size="28" color="success">mdi-check-circle-outline</v-icon>
                    </v-avatar>
                    <div>
                      <div class="text-caption font-weight-bold text-uppercase text-muted">Completed Runs</div>
                      <div class="text-h4 font-weight-bold text-success">{{ kpiTotalCompleted }}</div>
                    </div>
                  </v-card>
                </v-col>

                <v-col cols="12" sm="4">
                  <v-card class="ds-card pa-4 d-flex align-center" variant="flat" style="border-left: 4px solid #EF4444 !important;">
                    <v-avatar color="error" variant="tonal" size="56" class="mr-4">
                      <v-icon size="28" color="error">mdi-calendar-remove</v-icon>
                    </v-avatar>
                    <div>
                      <div class="text-caption font-weight-bold text-uppercase text-muted">Drop-off Rate</div>
                      <div class="text-h4 font-weight-bold text-error">{{ kpiDropoffRate }}%</div>
                    </div>
                  </v-card>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" md="4">
                  <v-card class="ds-card pa-4 h-100 text-center" variant="flat">
                    <h3 class="text-subtitle-1 font-weight-bold text-primary mb-2">Overall Progress</h3>
                    <studyProgressChart :stats="studyStats.totalNperStatus" />
                  </v-card>
                </v-col>
                <v-col cols="12" md="8">
                  <v-card class="ds-card pa-4 h-100" variant="flat" style="overflow-x: auto;">
                    <h3 class="text-subtitle-1 font-weight-bold text-primary mb-2">Weekly Recruitment History</h3>
                    <studyHistoryChart :stats="studyStats.totalNWeeklyRecrtuiment" />
                  </v-card>
                </v-col>
                <v-col cols="12" md="4">
                  <v-card class="ds-card pa-4 h-100" variant="flat" style="overflow-x: auto;">
                    <h3 class="text-subtitle-1 font-weight-bold text-primary mb-2">Experimenter Workload</h3>
                    <experimenterStatsChart :stats="[...(studyStats.totalNperPersonnelPriExp || []), ...(studyStats.totalNperPersonnelAssistExp || [])]" />
                  </v-card>
                </v-col>
                <v-col cols="12" md="8">
                  <v-card class="ds-card pa-4 h-100" variant="flat" style="overflow-x: auto;">
                    <h3 class="text-subtitle-1 font-weight-bold text-primary mb-2">Recruitment by Researcher</h3>
                    <recruitmentProgressChart :stats="studyStats.totalNperPersonnelStatus" />
                  </v-card>
                </v-col>
                </v-row>
            </div>
            <div v-else class="text-center py-12">
              <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
              <p class="text-muted mt-4 font-weight-bold">Loading deep analytics...</p>
            </div>
          </v-window-item>

          <v-window-item value="logistics" class="pa-6">
            <v-row>
              <v-col cols="12" md="4">
                <SectionHeader title="Point of Contact" icon="mdi-account-star" class="mt-0" />
                <v-card variant="outlined" class="pa-4 mb-6 bg-grey-lighten-4" style="border-color: #E2E8F0 !important;">
                  <div class="d-flex align-center mb-3">
                    <v-avatar color="primary" size="48" class="mr-3 text-white font-weight-bold">
                      {{ currentStudy.PointofContact?.Name ? currentStudy.PointofContact.Name.charAt(0) : '?' }}
                    </v-avatar>
                    <div>
                      <div class="text-subtitle-1 font-weight-bold text-primary">{{ currentStudy.PointofContact?.Name || 'Unassigned' }}</div>
                      <div class="text-caption text-muted font-weight-bold text-uppercase">Primary Contact</div>
                    </div>
                  </div>
                  <v-divider class="my-2"></v-divider>
                  <v-list density="compact" class="pa-0 bg-transparent">
                    <v-list-item prepend-icon="mdi-email-outline" :title="currentStudy.PointofContact?.Email || 'No email'" class="px-0"></v-list-item>
                    <v-list-item prepend-icon="mdi-phone-outline" :title="PhoneFormated(currentStudy.PointofContact?.Phone) || 'No phone'" class="px-0"></v-list-item>
                  </v-list>
                </v-card>

                <SectionHeader title="Testing Room" icon="mdi-door-open" class="mt-0" />
                <v-card variant="outlined" class="pa-4" :class="{'bg-error-lighten-5': !currentStudy.FK_TestingRoom, 'bg-grey-lighten-4': currentStudy.FK_TestingRoom}" style="border-color: #E2E8F0 !important;">
                  <div class="text-caption font-weight-bold text-uppercase text-muted mb-2">Assigned Physical Space</div>
                  <v-select 
                    variant="outlined" 
                    density="compact" 
                    :items="currentTestingRooms" 
                    v-model="selectedRoomId" 
                    item-value="id" 
                    :item-title="(item) => `${item.name} (${item.location})`" 
                    @update:model-value="optionChangedTestingRoom" 
                    hide-details
                    placeholder="Select a testing room..."
                    :bg-color="!currentStudy.FK_TestingRoom ? 'white' : ''"
                  ></v-select>
                  <div v-if="!currentStudy.FK_TestingRoom" class="text-caption text-error font-weight-bold mt-2">
                    <v-icon size="small" color="error" class="mr-1">mdi-alert-circle</v-icon>Required for calendar sync!
                  </div>
                </v-card>
              </v-col>
              
              <v-col cols="12" md="8">
                <SectionHeader title="Assigned Experimenters" icon="mdi-account-multiple" class="mt-0" />
                <v-card variant="outlined" class="pa-4" style="border-color: #E2E8F0 !important;">
                  <AssignedExperimenters 
                    v-if="currentStudy.id" 
                    :Experimenters="currentStudy.Experimenters" 
                    :labMembers="labMembers" 
                    :studyId="currentStudy.id" 
                    :PointofContactId="currentStudy.PointofContact?.id" 
                    @updatedExperimenters="updateExperimenters"
                  />
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>

          <v-window-item value="communications" class="pa-6">
            <v-row>
              <v-col cols="12" md="6">
                <div class="d-flex justify-space-between align-center mb-3">
                  <SectionHeader title="Scripts & Templates" icon="mdi-email-edit-outline" class="mt-0 mb-0" />
                  <v-btn size="small" color="primary" variant="flat" prepend-icon="mdi-content-save" @click="saveEmailTemplates" :loading="savingTemplates">Quick Save</v-btn>
                </div>
                
                <v-card variant="outlined" class="pa-4 mb-4" style="border-color: #E2E8F0 !important;">
                  <div class="text-subtitle-2 font-weight-bold text-primary mb-2">Phone Recruitment Script</div>
                  <v-textarea v-model="currentStudy.PhoneScript" variant="outlined" rows="4" hide-details density="compact"></v-textarea>
                </v-card>

                <v-card variant="outlined" class="pa-4 mb-4" style="border-color: #E2E8F0 !important;">
                  <div class="text-subtitle-2 font-weight-bold text-primary mb-2">Confirmation Email Snippet</div>
                  <ckeditor :editor="editor" v-model="currentStudy.EmailTemplate" :config="editorConfig"></ckeditor>
                </v-card>

                <v-card variant="outlined" class="pa-4 mb-4" style="border-color: #E2E8F0 !important;">
                  <div class="text-subtitle-2 font-weight-bold text-primary mb-2">Reminder Email Snippet</div>
                  <ckeditor :editor="editor" v-model="currentStudy.ReminderTemplate" :config="editorConfig"></ckeditor>
                </v-card>

                <v-card variant="outlined" class="pa-4" style="border-color: #E2E8F0 !important;">
                  <div class="text-subtitle-2 font-weight-bold text-primary mb-2">Follow-up Email Snippet</div>
                  <ckeditor :editor="editor" v-model="currentStudy.FollowUPEmailSnippet" :config="editorConfig"></ckeditor>
                </v-card>
              </v-col>

              <v-col cols="12" md="6" style="border-left: 1px solid #E2E8F0;">
                <SectionHeader title="Live Previews" icon="mdi-eye-outline" class="mt-0 mb-3" />
                
                <v-alert type="info" variant="tonal" density="compact" class="mb-4">
                  Changes made on the left will update here instantly. Don't forget to click <strong>Quick Save</strong>!
                </v-alert>

                <v-expansion-panels variant="accordion" v-model="previewPanel">
                  <v-expansion-panel value="confirm">
                    <v-expansion-panel-title class="font-weight-bold text-primary">Confirmation Preview</v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <div class="template-preview pa-4 rounded bg-grey-lighten-4 mt-2" v-html="confirmationPreview" style="max-height: 400px; overflow-y: auto; border: 1px solid #E2E8F0;"></div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                  <v-expansion-panel value="remind">
                    <v-expansion-panel-title class="font-weight-bold text-primary">Reminder Preview</v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <div class="template-preview pa-4 rounded bg-grey-lighten-4 mt-2" v-html="reminderPreview" style="max-height: 400px; overflow-y: auto; border: 1px solid #E2E8F0;"></div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                  <v-expansion-panel value="follow">
                    <v-expansion-panel-title class="font-weight-bold text-primary">Follow-up Preview</v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <div class="template-preview pa-4 rounded bg-grey-lighten-4 mt-2" v-html="followupPreview" style="max-height: 400px; overflow-y: auto; border: 1px solid #E2E8F0;"></div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-col>
            </v-row>
          </v-window-item>
        </v-window>
      </v-card>
    </div>

    <v-dialog v-model="dialog" fullscreen transition="dialog-bottom-transition">
      <v-card class="ds-card" variant="flat" style="background-color: var(--ds-field-bg);">
        
        <v-toolbar color="primary" dark class="elevation-1">
          <v-btn icon @click="close"><v-icon>mdi-close</v-icon></v-btn>
          <v-toolbar-title class="font-weight-bold" style="font-family: var(--ds-font-family-heading)">
            {{ editedIndex === -1 ? 'Create New Study' : 'Edit Study Information' }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="save" prepend-icon="mdi-content-save-check" class="font-weight-bold">
            Save & Exit
          </v-btn>
        </v-toolbar>

        <v-stepper v-model="studyStepper" class="elevation-0 h-100 d-flex flex-column bg-transparent" hide-actions>
          <v-stepper-header class="bg-white elevation-1">
            <v-stepper-item title="Core Identity" :value="1" :complete="studyStepper > 1" editable></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item title="Eligibility Rules" :value="2" :complete="studyStepper > 2" editable></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item title="Team Logistics" :value="3" :complete="studyStepper > 3" editable></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item title="Communications" :value="4" editable></v-stepper-item>
          </v-stepper-header>

          <v-stepper-window class="flex-grow-1" style="overflow-y: auto; padding-bottom: 80px;">
            <v-form ref="form" v-model="valid" lazy-validation>
              
              <v-stepper-window-item :value="1">
                <v-container style="max-width: 800px;" class="mt-4">
                  <h2 class="text-h5 font-weight-bold text-primary mb-6" style="font-family: var(--ds-font-family-heading)">Core Identity</h2>
                  <v-row dense>
                    <v-col cols="12" sm="8">
                      <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Study Name *</div>
                      <v-text-field v-model="editedStudy.StudyName" variant="outlined" density="compact" :rules="[v => !!v || 'Required']" bg-color="white"></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="4">
                      <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Study Type *</div>
                      <v-select v-model="editedStudy.StudyType" :items="['Behavioural', 'EEG/ERP', 'EyeTracking', 'fNIRS', 'Online']" variant="outlined" density="compact" bg-color="white"></v-select>
                    </v-col>
                    <v-col cols="12">
                      <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Study Summary / Description</div>
                      <v-textarea v-model="editedStudy.Description" variant="outlined" rows="6" bg-color="white" placeholder="Provide a brief summary for researchers..."></v-textarea>
                    </v-col>
                  </v-row>
                  <div class="d-flex justify-end mt-6">
                    <v-btn color="primary" variant="flat" @click="studyStepper = 2" append-icon="mdi-arrow-right">Next Step</v-btn>
                  </div>
                </v-container>
              </v-stepper-window-item>

              <v-stepper-window-item :value="2">
                <v-container style="max-width: 800px;" class="mt-4">
                  <h2 class="text-h5 font-weight-bold text-primary mb-6" style="font-family: var(--ds-font-family-heading)">Eligibility Rules</h2>
                  
                  <v-card variant="outlined" class="bg-white pa-6 mb-6">
                    <h3 class="text-h6 mb-4">Age Groups</h3>
                    <v-row v-for="(group, index) in editedStudy.AgeGroups" :key="index" dense align="center">
                      <v-col cols="5">
                        <v-text-field v-model.number="group.MinAge" label="Min Age (months)" type="number" variant="outlined" density="compact"></v-text-field>
                      </v-col>
                      <v-col cols="5">
                        <v-text-field v-model.number="group.MaxAge" label="Max Age (months)" type="number" variant="outlined" density="compact"></v-text-field>
                      </v-col>
                      <v-col cols="2" class="text-center">
                        <v-btn icon="mdi-delete-outline" color="error" variant="text" @click="editedStudy.AgeGroups.splice(index, 1)"></v-btn>
                      </v-col>
                    </v-row>
                    <v-btn variant="tonal" color="primary" prepend-icon="mdi-plus" @click="editedStudy.AgeGroups.push({ MinAge: null, MaxAge: null })">
                      Add Age Group
                    </v-btn>
                  </v-card>

                  <v-card variant="outlined" class="bg-white pa-6 mb-6">
                    <h3 class="text-h6 mb-4">Study Requirements</h3>
                    <v-row dense>
                      <v-col cols="12" md="6">
                        <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Prerequisite Studies</div>
                        <v-select v-model="editedStudy.PrerequisiteIds" :items="Studies.filter(s => s.id !== editedStudy.id)" item-title="StudyName" item-value="id" placeholder="Must have completed..." multiple chips variant="outlined" density="compact"></v-select>
                      </v-col>
                      <v-col cols="12" md="6">
                        <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Excluded Studies</div>
                        <v-select v-model="editedStudy.ExclusionIds" :items="Studies.filter(s => s.id !== editedStudy.id)" item-title="StudyName" item-value="id" placeholder="Must NOT have participated..." multiple chips variant="outlined" density="compact"></v-select>
                      </v-col>
                    </v-row>
                  </v-card>

                  <v-card variant="outlined" class="bg-white pa-6">
                    <h3 class="text-h6 mb-4">Participant Health Criteria</h3>
                    <v-row dense>
                      <v-col cols="12" sm="4"><v-select v-model="editedStudy.ASDParticipant" :items="inclusionOptions" label="ASD" variant="outlined" density="compact"></v-select></v-col>
                      <v-col cols="12" sm="4"><v-select v-model="editedStudy.PrematureParticipant" :items="inclusionOptions" label="Premature" variant="outlined" density="compact"></v-select></v-col>
                      <v-col cols="12" sm="4"><v-select v-model="editedStudy.IllParticipant" :items="inclusionOptions" label="Illness" variant="outlined" density="compact"></v-select></v-col>
                      <v-col cols="12" sm="6"><v-select v-model="editedStudy.VisionLossParticipant" :items="inclusionOptions" label="Vision Deficit" variant="outlined" density="compact"></v-select></v-col>
                      <v-col cols="12" sm="6"><v-select v-model="editedStudy.HearingLossParticipant" :items="inclusionOptions" label="Hearing Deficit" variant="outlined" density="compact"></v-select></v-col>
                    </v-row>
                  </v-card>

                  <div class="d-flex justify-space-between mt-6">
                    <v-btn variant="text" @click="studyStepper = 1" prepend-icon="mdi-arrow-left" class="text-muted">Back</v-btn>
                    <v-btn color="primary" variant="flat" @click="studyStepper = 3" append-icon="mdi-arrow-right">Next Step</v-btn>
                  </div>
                </v-container>
              </v-stepper-window-item>

              <v-stepper-window-item :value="3">
                <v-container style="max-width: 800px;" class="mt-4">
                  <h2 class="text-h5 font-weight-bold text-primary mb-6" style="font-family: var(--ds-font-family-heading)">Logistics & Team</h2>
                  
                  <v-card variant="outlined" class="bg-white pa-6 mb-6">
                    <div class="d-flex align-start mb-4">
                      <v-icon color="primary" size="32" class="mr-3 mt-1">mdi-account-star-outline</v-icon>
                      <div>
                        <h3 class="text-h6">Point of Contact *</h3>
                        <p class="text-body-2 text-muted">Who is the primary person responsible for this study?</p>
                      </div>
                    </div>
                    <v-select v-model="PointofContact" :items="labMembers" item-title="Name" item-value="id" return-object variant="outlined" density="comfortable" :rules="[v => !!v || 'Required']"></v-select>
                  </v-card>

                  <div class="d-flex justify-space-between mt-6">
                    <v-btn variant="text" @click="studyStepper = 2" prepend-icon="mdi-arrow-left" class="text-muted">Back</v-btn>
                    <v-btn color="primary" variant="flat" @click="studyStepper = 4" append-icon="mdi-arrow-right">Next Step</v-btn>
                  </div>
                </v-container>
              </v-stepper-window-item>

              <v-stepper-window-item :value="4">
                <v-container style="max-width: 900px;" class="mt-4">
                  <h2 class="text-h5 font-weight-bold text-primary mb-6" style="font-family: var(--ds-font-family-heading)">Scripts & Email Templates</h2>
                  
                  <v-card variant="outlined" class="bg-white">
                    <v-tabs v-model="emailTemplateTab" color="primary" bg-color="grey-lighten-4">
                      <v-tab value="phone"><v-icon start>mdi-phone-outline</v-icon>Phone Script</v-tab>
                      <v-tab value="confirm"><v-icon start>mdi-email-check-outline</v-icon>Confirmation</v-tab>
                      <v-tab value="remind"><v-icon start>mdi-calendar-alert</v-icon>Reminder</v-tab>
                      <v-tab value="follow"><v-icon start>mdi-email-fast-outline</v-icon>Follow-up</v-tab>
                    </v-tabs>

                    <v-divider></v-divider>

                    <v-window v-model="emailTemplateTab" class="pa-6">
                      
                      <v-window-item value="phone">
                        <h3 class="text-h6 mb-2">Phone Recruitment Script</h3>
                        <p class="text-caption text-muted mb-4">This script is shown to researchers when they call families to recruit for this study.</p>
                        <v-textarea v-model="editedStudy.PhoneScript" variant="outlined" rows="8" placeholder="Hi, I'm calling from the lab..."></v-textarea>
                      </v-window-item>

                      <v-window-item value="confirm">
                        <h3 class="text-h6 mb-2">Confirmation Email Snippet</h3>
                        <p class="text-caption text-muted mb-4">Sent when an appointment is booked. <br><strong>Variables:</strong> <code>${{childName}}</code>, <code>${{he/she}}</code>, <code>${{ZoomLink}}</code></p>
                        <ckeditor :editor="editor" v-model="editedStudy.EmailTemplate" :config="editorConfig"></ckeditor>
                      </v-window-item>

                      <v-window-item value="remind">
                        <h3 class="text-h6 mb-2">Reminder Email Snippet</h3>
                        <p class="text-caption text-muted mb-4">Sent automatically the day before the study.</p>
                        <ckeditor :editor="editor" v-model="editedStudy.ReminderTemplate" :config="editorConfig"></ckeditor>
                      </v-window-item>

                      <v-window-item value="follow">
                        <h3 class="text-h6 mb-2">Follow-up Email Snippet (Thank You)</h3>
                        <p class="text-caption text-muted mb-4">Appended to the generic "Thank You" email sent after completion.</p>
                        <ckeditor :editor="editor" v-model="editedStudy.FollowUPEmailSnippet" :config="editorConfig"></ckeditor>
                      </v-window-item>

                    </v-window>
                  </v-card>

                  <div class="d-flex justify-space-between mt-8">
                    <v-btn variant="text" @click="studyStepper = 3" prepend-icon="mdi-arrow-left" class="text-muted">Back</v-btn>
                    <v-btn color="success" size="large" variant="flat" @click="save" prepend-icon="mdi-content-save-check">Save & Complete Study</v-btn>
                  </div>
                </v-container>
              </v-stepper-window-item>

            </v-form>
          </v-stepper-window>
        </v-stepper>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import moment from "moment";
import { Ckeditor as ckeditor } from '@ckeditor/ckeditor5-vue';
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

import AssignedExperimenters from "@/components/AssignedExperimenters.vue";
import AlertBanner from "@/components/AlertBanner.vue";
import InfoField from "@/components/InfoField.vue";
import SectionHeader from "@/components/SectionHeader.vue";
import studyProgressChart from "@/components/studyProgressChart.vue";
import recruitmentProgressChart from "@/components/recruitmentProgressChart.vue";
import experimenterStatsChart from "@/components/experimenterStatsChart.vue";
import studyHistoryChart from "@/components/studyHistoryChart.vue";

import studyApi from "@/services/study";
import personnelApi from "@/services/personnel";
import testingRoomApi from "@/services/testingRoom";
import ConfirmDlg from "@/components/ConfirmDialog.vue";
import { useMainStore } from "@/stores/mainStore";

export default {
  name: "Study",
  components: {
    AssignedExperimenters,
    AlertBanner,
    InfoField,
    SectionHeader,
    ckeditor,
    studyProgressChart,
    recruitmentProgressChart,
    experimenterStatsChart,
    studyHistoryChart,
    ConfirmDlg,
  },
  setup() {
    const store = useMainStore();
    return { store };
  },

  data() {
    return {
      search: "",
      inProgressStudyFilter: true,
      headersStudy: [
        { title: "Study Name", align: "start", key: "StudyName", sortable: true, width: "70%" },
        { title: "Completed?", align: "center", key: "Completed", sortable: false, width: "30%" }
      ],
      Studies: [],
      selectedStudies: [],
      currentStudy: {
        StudyName: null,
        Completed: false,
        PointofContact: {}
      },
      editedStudy: {},
      PointofContact: null,
      dialog: false,
      dialogShowEmailPreviews: false,
      dialogStudyProgress: false,
      valid: true,
      editedIndex: -1,
      labMembers: [],
      currentTestingRooms: [],
      selectedRoomId: null,
      studyTab: 'overview',
      previewPanel: 'confirm',
      studyStepper: 1,
      emailTemplateTab: 'phone',
      studyStatsLoaded: false,
      savingTemplates: false,
      tab: 'one',
      studyStats: {
        totalNperStatus: [],
        totalNWeeklyRecrtuiment: [],
        totalNperPersonnelStatus: [],
        totalNperPersonnelPriExp: [],
        totalNperPersonnelAssistExp: []
      },
      inclusionOptions: ["Include", "Exclude", "Only"],

      editor: ClassicEditor,
      editorConfig: {
        toolbar: {
          items: [
            "undo", "redo", "|",
            "heading", "|",
            "bold", "italic", "|",
            "link", "insertTable", "|",
            "bulletedList", "numberedList", "outdent", "indent",
          ],
        },
      }
    };
  },

  computed: {
    filteredStudies() {
      let result = this.Studies;
      if (this.inProgressStudyFilter) {
        result = result.filter(s => !s.Completed);
      }
      if (this.search) {
        const lowerSearch = this.search.toLowerCase();
        result = result.filter(s =>
          s.StudyName && s.StudyName.toLowerCase().includes(lowerSearch)
        );
      }
      return result;
    },

    canCreateStudy() {
      const role = this.store.role;
      return ['Admin', 'PI', 'PostDoc', 'GradStudent', 'Lab manager'].includes(role);
    },

    canEditStudy() {
      if (!this.currentStudy.id || !this.currentStudy.PointofContact) return false;
      const role = this.store.role;
      return (
        this.currentStudy.PointofContact.id == this.store.userID ||
        ['Admin', 'PI', 'Lab manager'].includes(role)
      );
    },

    canViewProgress() {
      const role = this.store.role;
      return ['Admin', 'PI', 'PostDoc', 'GradStudent', 'Lab manager'].includes(role);
    },

    canDuplicateStudy() {
      if (!this.currentStudy || !this.currentStudy.id) return false;
      const role = this.store.role;
      return ['Admin', 'PI', 'Lab manager', 'GradStudent'].includes(role);
    },

    kpiTotalRecruited() {
      if (!this.studyStatsLoaded || !this.studyStats.totalNperStatus) return 0;
      return this.studyStats.totalNperStatus.reduce((sum, item) => sum + item.NumberOfParticipants, 0);
    },
    
    kpiTotalCompleted() {
      if (!this.studyStatsLoaded || !this.studyStats.totalNperStatus) return 0;
      const completedStats = this.studyStats.totalNperStatus.find(s => s.Status === 'Completed' || s.Status === 'Confirmed');
      return completedStats ? completedStats.NumberOfParticipants : 0;
    },
    
    kpiDropoffRate() {
      if (!this.studyStatsLoaded || !this.studyStats.totalNperStatus || this.kpiTotalRecruited === 0) return 0;
      const dropoffs = this.studyStats.totalNperStatus
        .filter(s => ['No Show', 'Cancelled', 'Rejected'].includes(s.Status))
        .reduce((sum, item) => sum + item.NumberOfParticipants, 0);
      return Math.round((dropoffs / this.kpiTotalRecruited) * 100);
    },

    // Mock preview logic (identical text manipulation as vue2)
    confirmationPreview() {
      if (!this.currentStudy.EmailTemplate) return "<p>Email template not set.</p>";
      let email = this.currentStudy.EmailTemplate.replace(/\${{childName}}/g, "Emma");
      return `<p>Dear Lisa,</p><div>${email}</div>`;
    },
    reminderPreview() {
      if (!this.currentStudy.ReminderTemplate) return "<p>Reminder template not set.</p>";
      let email = this.currentStudy.ReminderTemplate.replace(/\${{childName}}/g, "Emma");
      return `<p>Dear Lisa,</p><div>${email}</div>`;
    },
    followupPreview() {
      if (!this.currentStudy.FollowUPEmailSnippet) return "<p>Followup snippet not set.</p>";
      let email = this.currentStudy.FollowUPEmailSnippet.replace(/\${{childName}}/g, "Emma");
      return `<p>Dear Lisa,</p><div>${email}</div>`;
    }
  },

  methods: {
    getRoomName(roomId) {
      if (!roomId) return 'Unassigned Room';
      const room = this.currentTestingRooms.find(r => r.id === roomId);
      return room ? room.name : 'Unknown Room';
    },

    clearSelection() {
      this.currentStudy = { StudyName: null, PointofContact: {} };
      this.selectedStudies = [];
      this.editedIndex = -1;
      
      // Clear the URL so it goes back to /study
      if (this.$route.params.id) {
        this.$router.replace({ name: 'Study management' });
      }
    },

    canManageStudyStatus(item) {
      if (!item.PointofContact) return false;
      const role = this.store.role;
      return (
        item.PointofContact.id == this.store.userID ||
        ['Admin', 'PI', 'Lab manager'].includes(role)
      );
    },

    async fetchStudyProgress() {
      this.studyStatsLoaded = false;
      try {
        const Result = await studyApi.studyStats({ studyID: this.currentStudy.id });
        this.studyStats = Result.data;
        this.studyStatsLoaded = true;
      } catch (error) {
        console.error(error);
      }
    },

    async saveEmailTemplates() {
      this.savingTemplates = true;
      try {
        await studyApi.update(this.currentStudy);
        
        // Sync the master array with the live edits
        const index = this.Studies.findIndex(s => s.id === this.currentStudy.id);
        if (index !== -1) {
          Object.assign(this.Studies[index], this.currentStudy);
          this.store.setStudies(this.Studies);
        }
        
        this.$refs.confirmD.open('Saved', 'Templates and scripts saved successfully!', { color: 'success', noconfirm: true });
      } catch (error) {
        console.error(error);
        this.$refs.confirmD.open('Error', 'Failed to save templates.', { color: 'error', noconfirm: true });
      }
      this.savingTemplates = false;
    },

    criteriaColor(value) {
      if (value === 'Exclude') return 'error';
      if (value === 'Only') return 'warning';
      return 'grey';
    },

    async optionChangedTestingRoom() {
      if (!this.currentStudy.id) return;
      try {
        await studyApi.update({ id: this.currentStudy.id, FK_TestingRoom: this.selectedRoomId });
        this.currentStudy.FK_TestingRoom = this.selectedRoomId;
      } catch (error) {
        console.error(error);
      }
    },

    async searchStudies() {
      try {
        const Result = await studyApi.search({ FK_Lab: this.store.lab, includeScheules: false });
        this.Studies = Result.data || [];

        // Only auto-select if a study ID is in the route (deep-link)
        if (this.$route.params.id) {
          const targetStudy = this.Studies.find(s => s.id == this.$route.params.id);
          if (targetStudy) {
            this.selectedStudies = [targetStudy.id];
            this.rowSelected(null, { item: targetStudy });
          }
        }
        // Otherwise, stay on the grid view
      } catch (error) {
        console.error(error);
      }
    },

    async searchLabMembers() {
      try {
        const Result = await personnelApi.search({ FK_Lab: this.store.lab, Active: 1 });
        this.labMembers = Result.data || [];
      } catch (error) {
        console.error(error);
      }
    },

    async changeStudyStatus(item) {
      try {
        this.editedIndex = this.Studies.findIndex(s => s.id === item.id);
        item.Completed = !item.Completed;
        await studyApi.update(item);
        Object.assign(this.Studies[this.editedIndex], item);
        this.store.setStudies(this.Studies);
      } catch (error) {
        item.Completed = !item.Completed;
        if (error.response?.status !== 401) console.error(error);
      }
    },

    rowSelected(event, { item }) {
      this.currentStudy = item;
      this.selectedStudies = [item.id];
      this.editedIndex = this.Studies.findIndex(s => s.id === item.id);
      this.selectedRoomId = this.currentStudy.FK_TestingRoom || null;
      
      // Reset view state
      this.studyTab = 'overview';
      this.studyStatsLoaded = false;
      
      // Update the URL without reloading
      if (this.$route.params.id != item.id) {
          this.$router.replace({ name: 'Study management', params: { id: item.id } });
      }
    },

    editStudy() {
      this.editedStudy = {
        ...this.currentStudy,
        AgeGroups: (this.currentStudy.AgeGroups || []).map(g => ({ MinAge: g.MinAge, MaxAge: g.MaxAge })),
        PrerequisiteIds: (this.currentStudy.Prerequisites || []).map(p => p.id),
        ExclusionIds: (this.currentStudy.Exclusions || []).map(e => e.id),
      };
      this.PointofContact = this.currentStudy.PointofContact;
      
      // Reset Wizard State
      this.studyStepper = 1;
      this.emailTemplateTab = 'phone';
      
      this.dialog = true;
    },

    async createStudy() {
      try {
        const testingRooms = await testingRoomApi.search(this.store.lab);
        this.store.setTestingRooms(testingRooms.data);
        this.currentTestingRooms = testingRooms.data;
      } catch (e) { console.error(e) }

      this.editedStudy = {
        FK_Lab: this.store.lab,
        StudyType: 'Behavioural',
        Completed: false,
        AgeGroups: [],
        PrerequisiteIds: [],
        ExclusionIds: [],
        ASDParticipant: "Include",
        PrematureParticipant: "Include",
        IllParticipant: "Include",
        VisionLossParticipant: "Include",
        HearingLossParticipant: "Include",
      };
      this.PointofContact = null;
      this.editedIndex = -1;
      this.studyStepper = 1; // Reset wizard to step 1
      this.emailTemplateTab = 'phone';
      this.dialog = true;
    },

    async duplicateStudy() {
      // 1. Pre-fetch testing rooms if they aren't loaded in the current state
      try {
        if (!this.currentTestingRooms || this.currentTestingRooms.length === 0) {
          const testingRooms = await testingRoomApi.search(this.store.lab);
          this.store.setTestingRooms(testingRooms.data);
          this.currentTestingRooms = testingRooms.data;
        }
      } catch (e) { console.error(e) }

      // 2. Clone the study data, stripping out DB-specific IDs
      this.editedStudy = {
        ...this.currentStudy,
        id: undefined, // Remove the ID so the backend creates a new record
        StudyName: this.currentStudy.StudyName + " (Copy)",
        Completed: false, // Ensure the duplicate starts as "In Progress"
        
        // Strip the internal DB IDs from Age Groups so they are created fresh
        AgeGroups: (this.currentStudy.AgeGroups || []).map(g => ({ 
          MinAge: g.MinAge, 
          MaxAge: g.MaxAge 
        })),
        
        // Map relational tables back to simple arrays for the creation endpoint
        PrerequisiteIds: (this.currentStudy.Prerequisites || []).map(p => p.id),
        ExclusionIds: (this.currentStudy.Exclusions || []).map(e => e.id),
      };

      // 3. Keep the same Point of Contact by default
      this.PointofContact = this.currentStudy.PointofContact || null;
      
      // 4. Set index to -1 so the save() method knows this is a "Create" action, not an "Update"
      this.editedIndex = -1; 
      
      // 5. Open the Wizard at Step 1
      this.studyStepper = 1;
      this.emailTemplateTab = 'phone';
      this.dialog = true;
    },

    async save() {
      if (!this.PointofContact) {
        this.$refs.confirmD.open('Validation Error', 'Please select a Point of Contact.', { color: 'warning', noconfirm: true });
        return;
      }
      this.editedStudy.FK_Personnel = this.PointofContact.id;

      if (this.editedIndex === -1) {
        // Create
        try {
          const Result = await studyApi.create(this.editedStudy);
          this.Studies.push(Result.data);
          this.store.setStudies(this.Studies);
          this.currentStudy = Result.data;
          this.close();
        } catch (error) { console.error(error); }
      } else {
        // Update
        try {
          const Result = await studyApi.update(this.editedStudy);
          Object.assign(this.Studies[this.editedIndex], Result.data);
          this.store.setStudies(this.Studies);
          this.currentStudy = { ...Result.data };
          this.close();
        } catch (error) { console.error(error); }
      }
    },

    close() {
      this.dialog = false;
    },

    async deleteStudy() {
      if (!(await this.$refs.confirmD.open('Confirm Delete', 'Are you sure you want to delete this study? The deletion will also remove all related study appointments.'))) {
        return;
      }
      try {
        await studyApi.delete({ id: this.currentStudy.id });
        this.Studies = this.Studies.filter(s => s.id !== this.currentStudy.id);
        this.store.setStudies(this.Studies);
        this.currentStudy = { StudyName: null, PointofContact: {} };
      } catch (error) {
        console.error(error);
      }
    },

    updateExperimenters(updatedExperimenters) {
      this.currentStudy.Experimenters = updatedExperimenters;
      if (this.editedIndex !== -1) {
        Object.assign(this.Studies[this.editedIndex], this.currentStudy);
      }
    },

    AgeFormated(Age) {
      if (!Age || Age <= 0) return "Not applicable";
      const years = Math.floor(Age / 12);
      const months = Age % 12;
      return `${years > 0 ? years + 'y ' : ''}${months}m`.trim();
    },

    PhoneFormated(Phone) {
      if (Phone) {
        var cleaned = ("" + Phone).replace(/\D/g, "");
        var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) return "(" + match[1] + ") " + match[2] + "-" + match[3];
      }
      return Phone || "";
    },
  },

  watch: {
    studyTab(val) {
      if (val === 'analytics' && !this.studyStatsLoaded) {
        this.fetchStudyProgress();
      }
    },
    dialogStudyProgress(val) {
      if (val) {
        this.fetchStudyProgress();
      } else {
        this.studyStats = {
          totalNperStatus: [],
          totalNWeeklyRecrtuiment: [],
          totalNperPersonnelStatus: [],
          totalNperPersonnelPriExp: [],
          totalNperPersonnelAssistExp: []
        };
      }
    },
    '$route.params.id': {
      immediate: true,
      handler(newId) {
        if (newId && this.Studies.length > 0) {
          const targetStudy = this.Studies.find(s => s.id == newId);
          if (targetStudy) {
            this.selectedStudies = [targetStudy.id];
            this.rowSelected(null, { item: targetStudy });
          }
        }
      }
    }
  },

  mounted() {
    this.searchLabMembers();
    this.currentTestingRooms = this.store.testingRooms || [];
    this.searchStudies();
  },
};
</script>

<style scoped>
.study-table :deep(tr.v-data-table__selected) {
  background-color: rgb(var(--v-theme-secondary), 0.1) !important;
}

.ck-editor__editable_inline {
  min-height: 300px !important;
}
</style>
