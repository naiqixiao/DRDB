<template>
  <v-container fluid>
    <div v-if="!$store.state.labEmailStatus" class="mb-4">
      <v-alert border="start" type="error" color="#c73460" density="compact" style="font-weight: 600">
        Lab email is not setup properly. Please set it up in the Settings page.
      </v-alert>
    </div>
    <div v-if="!$store.state.adminEmailStatus" class="mb-4">
      <v-alert border="start" type="warning" color="#c7792c" density="compact" style="font-weight: 600">
        Admin email is not setup properly. Please set it up in the Settings page.
      </v-alert>
    </div>
    <div v-if="$store.state.trainingMode" class="mb-4">
      <v-alert border="start" type="warning" color="#c7792c" density="compact" style="font-weight: 600">
        You are running in a training mode.
      </v-alert>
    </div>

    <ConfirmDlg ref="confirmD" />

    <v-row justify="space-around">
      <!-- LEFT COLUMN: Study Selection + Study Card -->
      <v-col cols="12" md="4">
        <v-row dense>
          <v-col cols="12" md="12">
            <h1 class="text-left">Choose a study</h1>
          </v-col>
          <v-col cols="12" md="12">
            <v-select 
              class="selection" 
              :items="studies" 
              item-value="id" 
              item-title="StudyName"
              v-model="selectedStudy" 
              return-object 
              label="Studies" 
              @update:model-value="onStudyChange"
              bg-color="textbackground" 
              hide-details 
              variant="outlined" 
              density="compact"
            ></v-select>
          </v-col>
        </v-row>

        <v-row class="mt-4" style="flex: 1;">
          <v-col cols="12" md="12" class="d-flex">
            <StudySummary :selectedStudy="selectedStudy" class="flex-grow-1" @ageGroupFilter="onAgeGroupFilter"></StudySummary>
          </v-col>
        </v-row>
      </v-col>

      <!-- CENTER COLUMN: Family & Child Info Card -->
      <v-col cols="12" md="5" class="d-flex flex-column">
        <!-- Pagination + Warning -->
        <v-row justify="space-around" class="mb-2">
          <v-col cols="12" md="9">
            <h2 v-show="contactedByOthers" style="color: red">
              You're late. Someone just called this family...
            </h2>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="12" md="3" style="text-align: end">
            <Page :page="page" :NofPages="Children ? Children.length : 0" @nextPage="nextPage" @previousPage="previousPage"></Page>
          </v-col>
        </v-row>

        <v-card class="ds-card d-flex flex-column flex-grow-1" variant="flat" style="position: relative; overflow: hidden;">
          
          <!-- Background Family ID -->
          <div style="position: absolute; right: 10px; bottom: 240px; font-size: 120px; font-weight: 900; color: rgba(0,0,0,0.08); z-index: 0; line-height: 0.8; pointer-events: none; user-select: none;" v-if="currentFamily.id">
            {{ currentFamily.id }}{{ currentChild.IdWithinFamily || '' }}
          </div>

          <v-card-text v-if="currentChild.id || currentFamily.id" class="pt-5 flex-grow-1" style="position: relative; z-index: 1;">
            <!-- Family Header -->
            <v-row>
              <v-col cols="12" sm="8" class="text-center text-sm-left">
                <div class="d-flex flex-column align-center flex-sm-row">
                  <v-avatar color="primary" size="56" class="mb-3 mb-sm-0 mr-sm-4">
                    <v-icon size="30" color="white">mdi-account-group</v-icon>
                  </v-avatar>
                  <div class="text-center text-sm-left">
                    <h2 class="text-h6 font-weight-bold mb-1" style="font-family: var(--ds-font-family-heading)">
                      {{ currentFamily.NamePrimary || 'Unknown Family' }}
                    </h2>
                    <div class="text-subtitle-2 text-muted">
                      Family ID: {{ currentFamily.id || '—' }}
                      <span v-if="familyChildrenCount > 0" class="ml-2">· {{ familyChildrenCount }} {{ familyChildrenCount === 1 ? 'Child' : 'Children' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Participation Stats Chips -->
                <div class="d-flex flex-wrap justify-center justify-sm-start gap-1 mt-3" style="gap: 4px;" v-if="participationStats.Total > 0">
                  <v-chip size="x-small" color="primary" variant="flat">Total: {{ participationStats.Total }}</v-chip>
                  <v-chip size="x-small" :color="getTimelineColor('Completed', true)" class="text-white" variant="flat"
                    v-if="participationStats.Completed">Completed: {{ participationStats.Completed }}</v-chip>
                  <v-chip size="x-small" :color="getTimelineColor('Confirmed', false)" variant="flat"
                    v-if="participationStats.Confirmed">Confirmed: {{ participationStats.Confirmed }}</v-chip>
                  <v-chip size="x-small" :color="getTimelineColor('No Show', false)" class="text-white" variant="flat"
                    v-if="participationStats['No Show']">No-Show: {{ participationStats['No Show'] }}</v-chip>
                  <v-chip size="x-small" :color="getTimelineColor('Cancelled', false)" class="text-white" variant="flat"
                    v-if="participationStats.Cancelled">Cancelled: {{ participationStats.Cancelled }}</v-chip>
                  <v-chip size="x-small" :color="getTimelineColor('Rejected', false)" class="text-white" variant="flat"
                    v-if="participationStats.Rejected">Rejected: {{ participationStats.Rejected }}</v-chip>
                </div>
              </v-col>
              <v-col cols="12" sm="4" class="d-flex align-center justify-end">
                <v-btn color="primary" variant="outlined" size="small" prepend-icon="mdi-pencil" class="mr-2"
                  @click.stop="editFamilyAndChild" :disabled="!currentChild.id">
                  Edit Info
                </v-btn>
                <v-btn color="success" variant="tonal" size="small" prepend-icon="mdi-account-child"
                  @click.stop="addNewChild" :disabled="!currentFamily.id">
                  Add Child
                </v-btn>
              </v-col>
            </v-row>

            <v-divider class="my-3"></v-divider>

            <!-- Contact Info -->
            <div class="d-flex justify-space-between align-center mb-1 px-1">
              <span class="text-caption font-weight-bold text-uppercase text-muted">Contact Info</span>
            </div>

            <v-list density="compact" class="text-left px-0 py-0" style="background: transparent;">
              <v-list-item prepend-icon="mdi-email-outline" class="px-0" density="compact">
                <v-list-item-title class="d-flex align-center">
                  <span v-if="currentFamily.Email">{{ currentFamily.Email }}</span>
                  <span v-else class="text-muted">No email provided</span>
                  <v-btn v-if="currentFamily.Email" icon="mdi-content-copy" variant="text" size="x-small" density="compact" class="ml-2" @click="copyToClipboard(currentFamily.Email)"></v-btn>
                </v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-phone-outline" class="px-0" density="compact">
                <v-list-item-title class="d-flex align-center">
                  <span v-if="currentFamily.Phone">{{ PhoneFormated(currentFamily.Phone) }}</span>
                  <span v-else class="text-muted">No phone</span>
                  <v-btn v-if="currentFamily.Phone" icon="mdi-content-copy" variant="text" size="x-small" density="compact" class="ml-2" @click="copyToClipboard(currentFamily.Phone)"></v-btn>
                  <span v-if="currentFamily.CellPhone" class="text-muted ml-2">(Cell: {{ PhoneFormated(currentFamily.CellPhone) }})</span>
                  <v-btn v-if="currentFamily.CellPhone" icon="mdi-content-copy" variant="text" size="x-small" density="compact" class="ml-2" @click="copyToClipboard(currentFamily.CellPhone)"></v-btn>
                </v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-map-marker-outline" class="px-0" density="compact"
                :title="currentFamily.Address || 'No address provided'">
              </v-list-item>
            </v-list>

            <v-divider class="my-3"></v-divider>

            <!-- Child Info -->
            <div class="d-flex justify-space-between align-center mb-2 px-1">
              <span class="text-caption font-weight-bold text-uppercase text-muted">Child</span>
            </div>

            <div class="d-flex align-center mb-3">
              <v-icon color="primary" class="mr-3" size="28">
                {{ currentChild.Sex === 'M' ? 'mdi-face-man' : (currentChild.Sex === 'F' ? 'mdi-face-woman' : 'mdi-face-recognition') }}
              </v-icon>
              <div>
                <div class="font-weight-bold text-body-1">{{ currentChild.Name || 'Unknown' }}</div>
                <div class="text-caption text-muted">
                  {{ currentChild.Sex || '—' }} · DoB: {{ currentChild.DoB || '—' }} · Age: {{ AgeFormated(currentChild.DoB) }}
                </div>
              </div>
            </div>

            <div class="d-flex flex-wrap gap-1 mb-2" style="gap: 4px;">
              <v-chip size="x-small" color="error" variant="flat" v-if="currentChild.PrematureBirth">Premature</v-chip>
              <v-chip size="x-small" color="warning" variant="flat" v-if="currentChild.ASD">ASD</v-chip>
              <v-chip size="x-small" color="warning" variant="flat" v-if="currentChild.HearingLoss">Hearing Deficit</v-chip>
              <v-chip size="x-small" color="warning" variant="flat" v-if="currentChild.VisionLoss">Vision Deficit</v-chip>
              <!-- Child participation stats -->
              <v-chip v-if="childCompletedCount > 0" size="x-small" variant="flat" color="#01579B" class="text-white font-weight-bold">
                <v-icon start size="x-small">mdi-check-circle</v-icon>
                {{ childCompletedCount }} Completed
              </v-chip>
              <span v-else-if="!currentChild.PrematureBirth && !currentChild.ASD && !currentChild.HearingLoss && !currentChild.VisionLoss" class="text-caption text-muted">
                <v-icon size="x-small" class="mr-1">mdi-information-outline</v-icon>
                No participation history
              </span>
            </div>

            <!-- Child Note (editable) -->
            <div class="mt-3 pt-2" style="border-top: 1px solid #E2E8F0;">
              <v-textarea
                class="conv-textarea"
                label="Note about this child"
                variant="outlined"
                no-resize
                rows="3"
                hide-details
                v-model="currentChild.Note"
                density="compact"
              ></v-textarea>
            </div>
          </v-card-text>

          <!-- Empty state when no child is loaded -->
          <v-card-text v-else class="text-center py-12 flex-grow-1 d-flex flex-column align-center justify-center">
            <v-icon size="64" color="grey-lighten-1" class="mb-3">mdi-account-search-outline</v-icon>
            <div class="text-h6 text-muted">Select a study to load families</div>
            <div class="text-caption text-muted">Choose a study from the left panel to begin</div>
          </v-card-text>
        </v-card>

        <!-- No More Contact (underneath family card) -->
        <v-card class="ds-card mt-4" variant="flat" v-if="currentChild.id">
          <v-card-text class="d-flex justify-space-between align-center py-3">
            <span class="text-caption text-muted">Family requests no more contact?</span>
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <div v-bind="props">
                  <v-btn icon size="small" @click="NoMoreContact" :disabled="!currentChild.id">
                    <v-icon color="warning">mdi-hand-back-right</v-icon>
                  </v-btn>
                </div>
              </template>
              <span>Remove this family from the database.</span>
            </v-tooltip>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- RIGHT COLUMN: Schedule Action + Notes + No More Contact -->
      <v-col cols="12" md="3" class="d-flex flex-column">
        <!-- Schedule a study section -->
        <v-card class="ds-card mb-4" variant="flat">
          <v-card-text class="pt-4">
            <div class="text-caption font-weight-bold text-uppercase text-muted mb-3 px-1">Schedule a Study</div>
            
            <v-select 
              :items="Responses" 
              v-model="response" 
              :label="currentChild.scheduled || contactedByOthers
              ? 'Already scheduled'
              : 'Parents\' response'" 
              :disabled="!currentChild.id ||
              currentChild.scheduled ||
              !$store.state.labEmailStatus ||
              contactedByOthers" 
              class="mb-3" 
              bg-color="textbackground" 
              hide-details 
              variant="outlined" 
              density="compact"
            ></v-select>

            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <div v-bind="props">
                  <v-btn color="#F59E0B" variant="flat" class="text-white font-weight-bold" block size="large"
                    @click.stop="scheduleChild" :disabled="response == null">
                    {{ response === "Rejected" ? "¯\\\\_(ツ)_/¯" : "" }}
                    <v-icon start v-if="scheduleButtonIcon">{{ scheduleButtonIcon }}</v-icon>
                  </v-btn>
                </div>
              </template>
              <span>{{ scheduleButtonTooltip }}</span>
            </v-tooltip>
          </v-card-text>
        </v-card>

        <!-- Notes & Conversations -->
        <div class="flex-grow-1 d-flex flex-column" style="min-height: 200px;">
          <NotesConversation 
            :Conversation="currentFamily.Conversations" 
            :familyId="parseInt(currentFamily.id)"
            :notes="currentFamily.Note" 
            @updateNotes="saveNotes"
            class="flex-grow-1"
          ></NotesConversation>
        </div>

      </v-col>
    </v-row>

    <!-- FULL WIDTH ROW: Participation History Timeline / Table -->
    <v-row class="mt-4" v-if="currentFamily.id">
      <v-col cols="12">
        <v-card class="ds-card" variant="flat">
          <v-tabs v-model="historyTab" color="primary" bg-color="grey-lighten-4" align-tabs="center">
            <v-tab value="timeline"><v-icon start>mdi-timeline-text-outline</v-icon>Timeline</v-tab>
            <v-tab value="table"><v-icon start>mdi-table</v-icon>Participation Record</v-tab>
          </v-tabs>

          <v-divider></v-divider>

          <v-window v-model="historyTab">
            <v-window-item value="timeline" class="pa-6">
              <div v-if="reversedSchedules && reversedSchedules.length > 0" style="overflow-x: auto; padding-bottom: 16px; padding-top: 4px;">
                <div class="d-flex align-center flex-nowrap position-relative"
                  style="gap: 48px; min-width: max-content; padding: 0 4px;">

                  <!-- Horizontal Connecting Line -->
                  <div
                    style="position: absolute; top: 50%; left: 0; right: 0; height: 2px; background-color: #CBD5E1; z-index: 0; transform: translateY(-50%); pointer-events: none;">
                  </div>

                  <TimelineCard v-for="schedule in reversedSchedules" :key="schedule.id"
                    :schedule="schedule" />
                </div>
              </div>

              <div v-else class="text-center text-muted py-6">
                <v-icon size="large" class="mb-2" color="grey-lighten-1">mdi-clipboard-text-off-outline</v-icon>
                <div>No participation history available.</div>
              </div>
            </v-window-item>

            <v-window-item value="table" class="pa-4">
              <AppointmentTableBrief :Appointments="flatAppointments" :family="currentFamily"></AppointmentTableBrief>
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>

    <!-- Unified Family & Child Edit Dialog -->
    <v-dialog v-model="dialogUnifiedEdit" max-width="1200px" persistent scrollable :retain-focus="false">
      <v-card class="ds-card" variant="flat">
        <v-card-title class="d-flex justify-space-between align-center py-4 ds-header-gradient">
          <span class="text-h6 font-weight-bold" style="font-family: var(--ds-font-family-heading)">
            Edit Family & Child Information
            <span class="text-subtitle-1 text-muted ml-2 font-weight-regular">(Family ID: {{ currentFamily.id }})</span>
          </span>
          <v-btn icon="mdi-close" variant="text" density="comfortable" @click="closeUnifiedEdit"></v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pt-6 pb-2" style="max-height: 70vh;">
          <v-form ref="formUnified" v-model="validUnified">
            
            <!-- Family Information Section -->
            <div class="mb-6">
              <div class="text-caption font-weight-bold text-uppercase text-muted mb-3 px-1">Family Information</div>
              <v-row dense>
                <v-col cols="12" :md="item.width" v-for="item in $familyBasicInfo" :key="item.label">
                  <div v-if="!!item.options">
                    <div v-if="item.field !== 'AutismHistory'">
                      <v-combobox justify="start" v-model="editedFamily[item.field]" :items="$Options[item.options]"
                        variant="outlined" :label="item.label" density="compact" hide-details class="mb-2"></v-combobox>
                    </div>
                    <div v-else>
                      <v-select :items="$Options[item.options]" v-model="editedFamily[item.field]"
                        :label="item.label" variant="outlined" density="compact" hide-details class="mb-2"></v-select>
                    </div>
                  </div>
                  <div v-else-if="item.rules">
                    <v-text-field :label="item.label" :rules="$rules[item.rules]" v-model="editedFamily[item.field]"
                      variant="outlined" hide-details density="compact" class="mb-2"></v-text-field>
                  </div>
                  <div v-else>
                    <v-text-field :label="item.label" v-model="editedFamily[item.field]" variant="outlined" hide-details
                      density="compact" class="mb-2"></v-text-field>
                  </div>
                </v-col>
              </v-row>
            </div>

            <!-- Contact Information Section -->
            <div class="mb-6">
              <div class="text-caption font-weight-bold text-uppercase text-muted mb-3 px-1">Contact Information</div>
              <v-row dense>
                <v-col cols="12" :md="item.width" v-for="item in $familyContactInfo" :key="item.label">
                  <div v-if="item.options">
                    <v-combobox justify="start" :items="$Options[item.options]" v-model="editedFamily[item.field]"
                      variant="outlined" :label="item.label" density="compact" hide-details class="mb-2"></v-combobox>
                  </div>
                  <div v-else-if="item.rules">
                    <v-text-field :label="item.label" :rules="$rules[item.rules]" v-model="editedFamily[item.field]"
                      variant="outlined" hide-details density="compact" class="mb-2"></v-text-field>
                  </div>
                  <div v-else>
                    <v-text-field :label="item.label" v-model="editedFamily[item.field]" variant="outlined" hide-details
                      density="compact" class="mb-2"></v-text-field>
                  </div>
                </v-col>
              </v-row>
            </div>

            <v-divider class="mb-6"></v-divider>

            <!-- Child Information Section -->
            <div class="mb-6">
              <div class="text-caption font-weight-bold text-uppercase text-muted mb-3 px-1">Child Information</div>
              <v-row dense>
                <template v-for="(item, i) in $childInfo" :key="i">
                  <v-col cols="12" v-if="item.field === 'Note'">
                    <v-textarea v-model="editedChild[item.field]" :label="item.label" variant="outlined" 
                      density="compact" hide-details class="mb-2" rows="3"></v-textarea>
                  </v-col>
                  <v-col v-else cols="12" sm="6" :md="item.width || 4">
                    <v-select v-if="item.options" v-model="editedChild[item.field]" :items="$Options[item.options]"
                      :label="item.label" variant="outlined" density="compact" hide-details class="mb-2"></v-select>
                    <v-text-field v-else v-model="editedChild[item.field]" :label="item.label" variant="outlined"
                      density="compact" hide-details class="mb-2" :type="item.field === 'DoB' ? 'date' : 'text'"></v-text-field>
                  </v-col>
                </template>
              </v-row>
            </div>

            <!-- Sensitive & Medical Info Section -->
            <div class="mb-4">
              <div class="text-caption font-weight-bold text-uppercase text-muted mb-3 px-1">Sensitive & Medical Info</div>
              <v-row dense>
                <v-col cols="12" sm="6" md="4" v-for="(item, i) in $childSensitiveInfo" :key="'s' + i">
                  <v-checkbox v-model="editedChild[item.field]" :label="item.label"
                    density="compact" hide-details class="mb-4" color="primary"></v-checkbox>
                </v-col>
              </v-row>
            </div>

          </v-form>
        </v-card-text>

        <v-card-actions class="px-6 pb-6 pt-0">
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="closeUnifiedEdit">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveUnified" prepend-icon="mdi-content-save">Save All</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add Child Dialog -->
    <v-dialog v-model="dialogAddChild" max-width="800px" persistent scrollable :retain-focus="false">
      <v-card class="ds-card" variant="flat">
        <v-card-title class="d-flex justify-space-between align-center py-4 ds-header-gradient">
          <span class="text-h6 font-weight-bold" style="font-family: var(--ds-font-family-heading)">
            Add New Child
          </span>
          <v-btn icon="mdi-close" variant="text" density="comfortable" @click="closeAddChild"></v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pt-6 pb-2" style="max-height: 70vh;">
          <v-form ref="formAddChild" v-model="validAddChild">
            <div class="mb-6">
              <div class="text-caption font-weight-bold text-uppercase text-muted mb-3 px-1">Basic Information</div>
              <v-row dense>
                <template v-for="(item, i) in $childInfo" :key="i">
                  <v-col cols="12" v-if="item.field === 'Note'">
                    <v-textarea v-model="newChildData[item.field]" :label="item.label" variant="outlined" 
                      density="compact" hide-details class="mb-2" rows="3"></v-textarea>
                  </v-col>
                  <v-col v-else cols="12" sm="6" :md="item.width || 4">
                    <v-select v-if="item.options" v-model="newChildData[item.field]" :items="$Options[item.options]"
                      :label="item.label" variant="outlined" density="compact" hide-details class="mb-2"></v-select>
                    <v-text-field v-else v-model="newChildData[item.field]" :label="item.label" variant="outlined"
                      density="compact" hide-details class="mb-2" :type="item.field === 'DoB' ? 'date' : 'text'"></v-text-field>
                  </v-col>
                </template>
              </v-row>
            </div>

            <div class="mb-4">
              <div class="text-caption font-weight-bold text-uppercase text-muted mb-3 px-1">Sensitive & Medical Info</div>
              <v-row dense>
                <v-col cols="12" sm="6" md="4" v-for="(item, i) in $childSensitiveInfo" :key="'ns' + i">
                  <v-checkbox v-model="newChildData[item.field]" :label="item.label"
                    density="compact" hide-details class="mb-4" color="primary"></v-checkbox>
                </v-col>
              </v-row>
            </div>
          </v-form>
        </v-card-text>

        <v-card-actions class="px-6 pb-6 pt-0">
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="closeAddChild">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveNewChild" prepend-icon="mdi-content-save">Save Child</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Schedule Dialog Component -->
    <scheduleDialog 
      ref="scheduleDialog" 
      :dialog="dialogSchedule" 
      :currentSchedule="currentSchedule"
      :parentResponse="response" 
      :currentFamily="currentFamily" 
      dialogType="schedule" 
      scheduleType="create"
      @close-dialog="closeDialog" 
      @newAppointment="addAppointment"
      @deleteCurrentAppointment="deleteCurrentAppointment" 
      @newSchedule="addSchedule"
    />
  </v-container>
</template>

<script>
import child from "@/services/child";
import study from "@/services/study";
import family from "@/services/family";
import RTU from "@/services/realtimeUpdate";
import moment from "moment-timezone";

import NotesConversation from "@/components/NotesConversation.vue";
import StudySummary from "@/components/StudySummary.vue";
import scheduleDialog from '@/components/scheduleDialog.vue';
import AppointmentTableBrief from "@/components/AppointmentTableBrief.vue";
import TimelineCard from "@/components/TimelineCard.vue";
import Page from "@/components/Page.vue";
import ConfirmDlg from "@/components/ConfirmDialog.vue";
import login from "@/services/login";

export default {
  name: "Schedule",
  components: {
    scheduleDialog,
    NotesConversation,
    StudySummary,
    Page,
    AppointmentTableBrief,
    TimelineCard,
    ConfirmDlg,
  },
  props: {
    training: Boolean,
  },
  data() {
    return {
      dialogUnifiedEdit: false,
      dialogAddChild: false,
      dialogSchedule: false,
      validUnified: true,
      validAddChild: true,
      historyTab: 'timeline',
      studies: [],
      activeAgeGroup: null,
      selectedStudy: {
        StudyName: null,
        FK_Lab: this.$store.state.lab,
        AgeGroups: [],
        Description: "",
        Completed: false,
        StudyType: null,
        ASDParticipant: "",
        PrematureParticipant: "",
        IllParticipant: "",
        VisionLossParticipant: "",
        HearingLossParticipant: "",
        updatedAt: new Date().toISOString(),
        PointofContact: { Name: null, Email: null, Phone: null },
      },
      Children: [],
      pages: 0,
      page: 0,
      scheduleButtonIcon: "mdi-calendar",
      scheduleButtonTooltip: "",
      currentSchedule: {},
      appointments: [],
      currentChild: {
        Name: null, Sex: null, DoB: null,
        Family: { NamePrimary: null, NameSecondary: null, Phone: null, Email: null },
      },
      editedChild: {
        Name: null, Sex: null, DoB: null,
        Family: { NamePrimary: null, NameSecondary: null, Phone: null, Email: null },
      },
      editedFamily: {},
      newChildData: {
        Name: "", Sex: "", DoB: "", Age: "", Note: "",
      },
      defaultItem: {
        Name: null, Sex: null, DoB: null,
        Family: { NamePrimary: null, NameSecondary: null, Phone: null, Email: null },
      },
      editedIndex: null,
      Responses: ["Confirmed", "Interested", "Left a message", "Rejected"],
      response: null,
      currentVisitedFamilies: [],
      contactedByOthers: false,
      loadingStatus: false,
      defaultAppointment: {
        index: "", FK_Family: "", FK_Child: "", FK_Study: "", FK_Schedule: "",
        PrimaryExperimenter: [], SecondaryExperimenter: [],
      },
    };
  },

  computed: {
    currentFamily() {
      if (this.currentChild) {
        return this.currentChild.Family || {};
      }
      return { NamePrimary: null, NameSecondary: null, Phone: null, Email: null };
    },

    reversedSchedules() {
      // Derive unique schedules from Appointments (same approach as ParticipationHistoryChart)
      if (!this.currentFamily || !this.currentFamily.Appointments) return [];
      
      const scheduleMap = {};
      this.currentFamily.Appointments.forEach(app => {
        if (app.Schedule && app.FK_Schedule) {
          if (!scheduleMap[app.FK_Schedule]) {
            scheduleMap[app.FK_Schedule] = {
              id: app.FK_Schedule,
              AppointmentTime: app.Schedule.AppointmentTime,
              Status: app.Schedule.Status,
              Completed: app.Schedule.Completed,
              updatedAt: app.Schedule.updatedAt,
              Note: app.Schedule.Note,
              Personnel: app.Schedule.Personnel,
              Appointments: [],
            };
          }
          scheduleMap[app.FK_Schedule].Appointments.push(app);
        }
      });

      return Object.values(scheduleMap).sort((a, b) => {
        const timeA = new Date(a.updatedAt || 0).getTime();
        const timeB = new Date(b.updatedAt || 0).getTime();
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
      });
    },

    flatAppointments() {
      if (!this.currentFamily || !this.currentFamily.Appointments) return [];
      return this.currentFamily.Appointments;
    },

    participationStats() {
      let stats = { Total: 0, Completed: 0, 'No Show': 0, Cancelled: 0, Rejected: 0, Confirmed: 0, TBD: 0, Rescheduling: 0 };
      if (this.reversedSchedules && this.reversedSchedules.length > 0) {
        stats.Total = this.reversedSchedules.length;
        this.reversedSchedules.forEach(s => {
          let status = s.Status;
          if (status === 'Confirmed' && s.Completed) status = 'Completed';
          if (stats[status] !== undefined) stats[status]++;
        });
      }
      return stats;
    },

    childCompletedCount() {
      if (!this.currentChild || !this.currentFamily || !this.currentFamily.Appointments) return 0;
      const childScheduleIds = new Set();
      this.currentFamily.Appointments.forEach(app => {
        if (app.FK_Child === this.currentChild.id && app.Schedule) {
          const status = app.Schedule.Status;
          if ((status === 'Confirmed' && app.Schedule.Completed) || status === 'Completed') {
            childScheduleIds.add(app.FK_Schedule);
          }
        }
      });
      return childScheduleIds.size;
    },

    familyChildrenCount() {
      if (this.currentFamily && this.currentFamily.Children) {
        return this.currentFamily.Children.length;
      }
      // Fallback: count unique children from appointments
      if (this.currentFamily && this.currentFamily.Appointments) {
        const childIds = new Set();
        this.currentFamily.Appointments.forEach(app => {
          if (app.FK_Child) childIds.add(app.FK_Child);
        });
        return childIds.size;
      }
      return 0;
    },
  },

  methods: {
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
    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        console.log('Copied to clipboard:', text);
      }).catch(err => {
        console.error('Failed to copy:', err);
      });
    },
    async searchStudies() {
      const queryString = {
        FK_Lab: this.$store.state.lab,
        includeScheules: false,
        Completed: 0,
      };

      try {
        const Result = await study.search(queryString);
        this.studies = Result.data;
      } catch (error) {
        if (error.status === 401 || (error.response && error.response.status === 401)) {
          this.$refs.confirmD.open('Authentication Error', 'Authentication failed, please login.', { color: 'error', noconfirm: true });
          this.$router.push({ name: "Login" });
        }
      }
    },

    onStudyChange() {
      this.activeAgeGroup = null;
      this.searchChild();
    },

    onAgeGroupFilter(group) {
      this.activeAgeGroup = group;
      this.searchChild();
    },

    async searchChild() {
      this.$store.dispatch("setLoadingStatus", true);

      if (!this.currentChild.scheduled && this.currentChild.FK_Family) {
        const results = await RTU.remove(this.currentChild.FK_Family);
        this.currentVisitedFamilies = results.data;
      }

      // Compute age range: use actively selected group or overall min/max across all groups
      const groups = this.selectedStudy.AgeGroups || [];
      let minAge, maxAge;
      if (this.activeAgeGroup) {
        minAge = this.activeAgeGroup.MinAge;
        maxAge = this.activeAgeGroup.MaxAge;
      } else if (groups.length > 0) {
        minAge = Math.min(...groups.map(g => g.MinAge));
        maxAge = Math.max(...groups.map(g => g.MaxAge));
      }

      const queryString = {
        minAge,
        maxAge,
        studyID: this.selectedStudy.id,
        trainingMode: this.$store.state.trainingMode
      };

      if (this.selectedStudy.ASDParticipant === "Exclude") queryString.ASDParticipant = 0;
      else if (this.selectedStudy.ASDParticipant === "Only") queryString.ASDParticipant = 1;

      if (this.selectedStudy.PrematureParticipant === "Exclude") queryString.PrematureParticipant = 0;
      else if (this.selectedStudy.PrematureParticipant === "Only") queryString.PrematureParticipant = 1;

      if (this.selectedStudy.IllParticipant === "Exclude") queryString.IllParticipant = 0;
      else if (this.selectedStudy.IllParticipant === "Only") queryString.IllParticipant = 1;

      if (this.selectedStudy.VisionLossParticipant === "Exclude") queryString.VisionLossParticipant = 0;
      else if (this.selectedStudy.VisionLossParticipant === "Only") queryString.VisionLossParticipant = 1;

      if (this.selectedStudy.HearingLossParticipant === "Exclude") queryString.HearingLossParticipant = 0;
      else if (this.selectedStudy.HearingLossParticipant === "Only") queryString.HearingLossParticipant = 1;

      try {
        let eligible = (await child.search(queryString)).data || [];

        // Client-side prerequisite / exclusion post-filter
        const prereqs = this.selectedStudy.Prerequisites || [];
        const exclusions = this.selectedStudy.Exclusions || [];
        if (prereqs.length > 0 || exclusions.length > 0) {
          eligible = eligible.filter(c => {
            const pastIds = (c.Appointments || []).map(a => a.FK_Study);
            if (prereqs.length > 0 && !prereqs.every(p => pastIds.includes(p.id))) return false;
            if (exclusions.length > 0 && exclusions.some(e => pastIds.includes(e.id))) return false;
            return true;
          });
        }

        const Results = { data: eligible };

        if (Results.data && Results.data.length > 0) {
          this.page = 1;
          this.Children = Results.data;
          this.currentChild = this.Children[0];

          if (this.currentVisitedFamilies.includes(this.currentChild.FK_Family)) {
            this.currentChild.scheduled = true;
          } else {
            const results = await RTU.add(this.currentChild.FK_Family);
            this.currentVisitedFamilies = results.data;
          }

          await this.$refs.confirmD.open('Reminder', 'Make sure to confirm with parents about their email address and child\'s information.<br><br>Use the <b>Edit Info</b> button to update family and/or child information.<br><br>Your little effort will benefit everyone in the future!<br><br>Thanks! :)', { color: 'primary', noconfirm: true });
        } else {
          await this.$refs.confirmD.open('No Results', 'No child is eligible for the selected study. :(', { color: 'warning', noconfirm: true });
          this.page = 0;
          this.Children = [];
          this.currentChild = Object.assign({}, this.defaultItem);
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          this.$refs.confirmD.open('Authentication Error', 'Authentication failed, please login.', { color: 'error', noconfirm: true });
          this.$router.push({ name: "Login" });
        } else {
          console.error(error);
        }
      }

      this.response = null;
      setTimeout(() => this.$store.dispatch("setLoadingStatus", false), 500);
    },

    editFamilyAndChild() {
      this.editedIndex = this.Children.indexOf(this.currentChild);
      if (this.currentFamily) {
        this.editedFamily = Object.assign({}, this.currentFamily);
      }
      this.editedChild = Object.assign({}, this.currentChild);
      // Format DoB for date input
      if (this.editedChild.DoB) {
        this.editedChild.DoB = moment(this.editedChild.DoB).format("YYYY-MM-DD");
      }
      this.dialogUnifiedEdit = true;
    },

    addNewChild() {
      this.newChildData = {
        Name: "", Sex: "", DoB: "", Age: "", Note: "",
        FK_Family: this.currentFamily.id,
      };
      this.dialogAddChild = true;
    },

    async saveUnified() {
      let validationResults = true;
      if (this.$refs.formUnified) {
        const { valid } = await this.$refs.formUnified.validate();
        validationResults = valid;
      }

      if (validationResults) {
        try {
          // Save family
          this.editedFamily.UpdatedBy = this.$store.state.userID;
          await family.update(this.editedFamily);
          this.currentChild.Family = this.editedFamily;

          // Save child
          this.editedChild.Age = Math.floor((new Date() - new Date(this.editedChild.DoB)) / (24 * 3600 * 1000));
          await child.update(this.editedChild);

          if (this.editedIndex >= 0) {
            // Update child but preserve family reference
            const familyRef = this.editedFamily;
            Object.assign(this.Children[this.editedIndex], this.editedChild);
            this.Children[this.editedIndex].Family = familyRef;
          }

          console.log("Family and Child info updated!");
          if (this.$refs.formUnified) this.$refs.formUnified.resetValidation();
          this.closeUnifiedEdit();
        } catch (error) {
          console.log(error);
        }
      }
    },

    async saveNewChild() {
      let validationResults = true;
      if (this.$refs.formAddChild) {
        const { valid } = await this.$refs.formAddChild.validate();
        validationResults = valid;
      }

      if (validationResults) {
        try {
          this.newChildData.FK_Family = this.currentFamily.id;
          this.newChildData.Age = Math.floor((new Date() - new Date(this.newChildData.DoB)) / (24 * 3600 * 1000));
          this.newChildData.CreatedBy = this.$store.state.userID;
          
          const result = await child.create(this.newChildData);
          if (result && result.data) {
            this.newChildData.id = result.data.id;
          }
          console.log("New child created!");
          this.closeAddChild();
        } catch (error) {
          console.log(error);
        }
      }
    },

    closeUnifiedEdit() {
      this.dialogUnifiedEdit = false;
      setTimeout(() => {
        this.editedChild = Object.assign({}, this.defaultItem);
        this.editedFamily = {};
        this.editedIndex = -1;
      }, 300);
    },

    closeAddChild() {
      this.dialogAddChild = false;
      setTimeout(() => {
        this.newChildData = { Name: "", Sex: "", DoB: "", Age: "", Note: "" };
      }, 300);
    },

    addAppointment(appointment) {
      this.currentSchedule.Appointments.push(appointment);
    },

    deleteCurrentAppointment(index) {
      this.currentSchedule.Appointments.splice(index, 1);
    },

    async scheduleChild() {
      try {
        await login.check_login();

        this.editedIndex = this.Children.indexOf(this.currentChild);
        this.editedChild = Object.assign({}, this.currentChild);

        this.appointments = [];
        const newAppointment = Object.assign({}, this.defaultAppointment);
        newAppointment.FK_Child = this.currentChild.id;
        newAppointment.FK_Family = this.currentChild.FK_Family;
        newAppointment.FK_Study = this.selectedStudy.id;
        newAppointment.Child = this.currentChild;
        newAppointment.Study = this.selectedStudy;
        newAppointment.status = this.response;
        this.appointments.push(newAppointment);

        this.currentSchedule = {
          AppointmentTime: null,
          Status: this.response,
          FK_Family: this.currentChild.FK_Family,
          Appointments: this.appointments,
          Note: null,
          ScheduledBy: this.$store.state.userID,
        };

        this.dialogSchedule = true;
      } catch (error) {
        if (error.response && error.response.status === 401) {
          this.$store.dispatch("setToken", null);
          this.$store.dispatch("setUser", null);
          this.$store.dispatch("setUserID", null);
          this.$refs.confirmD.open('Authentication Error', 'Authentication failed, please login.', { color: 'error', noconfirm: true });
          if (this.$route.name !== "Login") {
            this.$router.push({ name: "Login" });
          }
        }
      }
    },

    addSchedule(schedule) {
      schedule.Appointments.forEach((appointment) => {
        appointment.Schedule = {
          AppointmentTime: schedule.AppointmentTime,
          Status: schedule.Status,
          updatedAt: schedule.updatedAt,
          Completed: schedule.Completed
        };
        if (this.currentFamily?.Appointments) {
          this.currentFamily.Appointments.push(appointment);
        }
      });
      this.currentChild.scheduled = true;
    },

    closeDialog() {
      this.dialogSchedule = false;
      this.response = null;
    },

    AgeFormated(DoB) {
      if (!DoB) {
        if (this.currentChild.id) return "DoB is not available.";
        return "";
      }
      if (moment().diff(DoB, "days") > 0) {
        let years = moment().diff(DoB, "years");
        let months = moment().diff(DoB, "months", true);
        months = (months - years * 12).toFixed(1);
        const Y = years > 0 ? years + (years > 1 ? " years " : " year ") : "";
        const M = months > 0 ? months + (months == 1 ? " month " : " months ") : "";
        return Y + M;
      }
      return "Not born yet.";
    },

    PhoneFormated(Phone) {
      if (Phone) {
        const cleaned = ("" + Phone).replace(/\D/g, "");
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) return "(" + match[1] + ") " + match[2] + "-" + match[3];
      }
      return null;
    },

    async nextPage() {
      if (this.Children.length === 0 || this.page >= this.Children.length) return;
      if (!this.currentChild.scheduled && !this.contactedByOthers && this.currentChild.FK_Family) {
        const results = await RTU.remove(this.currentChild.FK_Family);
        this.currentVisitedFamilies = results.data;
      }
      this.page += 1;
      this.currentChild = this.Children[this.page - 1];
      this.response = null;

      if (this.currentVisitedFamilies.includes(this.currentChild.FK_Family)) {
        this.contactedByOthers = true;
      } else {
        const results = await RTU.add(this.currentChild.FK_Family);
        this.currentVisitedFamilies = results.data;
        this.contactedByOthers = false;
      }
    },

    async previousPage() {
      if (this.Children.length === 0 || this.page <= 1) return;
      if (!this.currentChild.scheduled && !this.contactedByOthers && this.currentChild.FK_Family) {
        const results = await RTU.remove(this.currentChild.FK_Family);
        this.currentVisitedFamilies = results.data;
      }
      this.page -= 1;
      this.currentChild = this.Children[this.page - 1];
      this.response = null;

      if (this.currentVisitedFamilies.includes(this.currentChild.FK_Family)) {
        this.contactedByOthers = true;
      } else {
        const results = await RTU.add(this.currentChild.FK_Family);
        this.currentVisitedFamilies = results.data;
        this.contactedByOthers = false;
      }
    },

    async NoMoreContact() {
      if (!this.$refs.confirmD) return;
      if (await this.$refs.confirmD.open("Remove this family from the database", "Can you confirm the removal?")) {
        const updatedFamilyInfo = {
          id: this.currentFamily.id,
          NextContactNote: "Parents asked to be removed from the database.",
          LastContactDate: moment().startOf("day").tz(this.$store.state.timeZone).format("YYYY-MM-DD"),
          NoMoreContact: true,
        };
        try {
          await family.update(updatedFamilyInfo);
          this.currentChild.scheduled = true;
          if (this.page > 0) Object.assign(this.Children[this.page - 1], this.currentChild);
          this.$refs.confirmD.open('Family Removed', 'This family has been removed from the database.', { color: 'warning', noconfirm: true });
        } catch (error) {
          console.log(error);
        }
      }
    },

    async saveNotes(newNotes) {
      if (!this.currentFamily?.id) return;
      this.currentFamily.Note = newNotes;
      this.currentFamily.UpdatedBy = this.$store.state.userID;
      await family.update(this.currentFamily);
      this.currentChild.Family = this.currentFamily;
      if (this.page > 0) Object.assign(this.Children[this.page - 1], this.currentChild);
    },
  },

  async mounted() {
    this.searchStudies();
    try {
      const results = await RTU.get();
      if (results && results.data) this.currentVisitedFamilies = results.data;
    } catch (e) {
      console.error("RTU get failed", e);
    }
  },

  beforeUnmount() {
    if (this.currentChild && !this.currentChild.scheduled && !this.contactedByOthers && this.currentChild.FK_Family) {
      RTU.remove(this.currentChild.FK_Family);
    }
  },

  watch: {
    dialogUnifiedEdit(val) { val || this.closeUnifiedEdit(); },
    dialogSchedule(val) { val || this.closeDialog(); },
    training() {
      this.currentChild = Object.assign({}, this.defaultItem);
      this.editedIndex = -1;
      this.Children = [];
      this.page = 0;
    },
    response(val) {
      switch (val) {
        case "Confirmed":
          this.scheduleButtonIcon = "mdi-calendar";
          this.scheduleButtonTooltip = "Pick study date and time";
          break;
        case "Interested":
        case "Left a message":
          this.scheduleButtonIcon = "mdi-email";
          this.scheduleButtonTooltip = "Send a study intro email and set a reminder to follow up";
          break;
        case "Rejected":
          this.scheduleButtonIcon = "";
          this.scheduleButtonTooltip = "Whatever, mark rejection";
          break;
        default:
          this.scheduleButtonIcon = "mdi-calendar";
          this.scheduleButtonTooltip = "";
          break;
      }
    },
  },
};
</script>

<style scoped>
</style>
