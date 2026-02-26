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

    <v-row justify="space-around" style="height: 700px">
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
              @update:model-value="searchChild"
              bg-color="textbackground" 
              hide-details 
              variant="outlined" 
              density="compact"
            ></v-select>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" md="12">
            <StudySummary :selectedStudy="selectedStudy"></StudySummary>
          </v-col>
        </v-row>
      </v-col>

      <v-col cols="12" md="5">
        <v-row justify="space-around">
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

        <v-row justify="start" align="center">
          <v-col md="12" class="mt-4">
            <v-divider></v-divider>
            <h4 class="text-left mt-2">Family information:</h4>
          </v-col>
          <v-col cols="12" v-for="item in familyField.map((i) => $familyFields[i])" :md="item.width" :key="item.label">
            <v-text-field 
              class="textfield-family" 
              bg-color="textbackground" 
              hide-details 
              :label="item.label"
              :model-value="item.label === 'Phone' || item.label === 'Cell Phone' ? PhoneFormated(currentFamily[item.field]) : currentFamily[item.field]" 
              readonly 
              placeholder="  " 
              variant="outlined" 
              density="compact"
            ></v-text-field>
          </v-col>
          
          <v-col cols="12" md="2" class="text-center">
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <div v-bind="props">
                  <v-btn color="primary" icon="mdi-pencil" @click.stop="editFamily" :disabled="!currentFamily.id"></v-btn>
                </div>
              </template>
              <span>Edit family information</span>
            </v-tooltip>
          </v-col>
        </v-row>

        <v-dialog v-model="dialogFamilyEdit" max-width="1200px" :retain-focus="false">
          <v-card variant="outlined">
            <v-card-title class="d-flex">
              <span class="text-h5">Edit family information</span>
              <v-spacer></v-spacer>
              <span class="text-h5">{{ "Family ID: " + currentFamily.id }}</span>
            </v-card-title>
            <v-card-text>
              <v-form ref="formFamily" v-model="validFamily">
                <v-row dense style="padding: 8px 8px 4px">
                  <v-col md="12" class="mt-4">
                    <v-divider></v-divider>
                    <h4 class="text-left mt-2">Family information:</h4>
                  </v-col>
                  <v-col cols="12" :md="item.width" v-for="item in $familyBasicInfo" :key="item.label">
                    <div v-if="!!item.options">
                      <div v-if="item.field !== 'AutismHistory'">
                        <v-combobox justify="start" v-model="editedFamily[item.field]" :items="$Options[item.options]"
                          variant="outlined" :label="item.label" density="compact"></v-combobox>
                      </div>
                      <div v-else>
                        <v-select :items="$Options[item.options]" v-model="editedFamily[item.field]"
                          :label="item.label" variant="outlined" density="compact"></v-select>
                      </div>
                    </div>
                    <div v-else-if="item.rules">
                      <v-text-field :label="item.label" :rules="$rules[item.rules]" v-model="editedFamily[item.field]"
                        variant="outlined" hide-details density="compact"></v-text-field>
                    </div>
                    <div v-else>
                      <v-text-field :label="item.label" v-model="editedFamily[item.field]" variant="outlined" hide-details
                        density="compact"></v-text-field>
                    </div>
                  </v-col>

                  <v-col md="12" class="mt-4">
                    <v-divider></v-divider>
                    <h4 class="text-left mt-2">Contact information:</h4>
                  </v-col>
                  <v-col cols="12" :md="item.width" v-for="item in $familyContactInfo" :key="item.label">
                    <div v-if="item.options">
                      <v-combobox justify="start" :items="$Options[item.options]" v-model="editedFamily[item.field]"
                        variant="outlined" :label="item.label" density="compact"></v-combobox>
                    </div>
                    <div v-else-if="item.rules">
                      <v-text-field :label="item.label" :rules="$rules[item.rules]" v-model="editedFamily[item.field]"
                        variant="outlined" hide-details density="compact"></v-text-field>
                    </div>
                    <div v-else>
                      <v-text-field :label="item.label" v-model="editedFamily[item.field]" variant="outlined" hide-details
                        density="compact"></v-text-field>
                    </div>
                  </v-col>
                </v-row>
              </v-form>
            </v-card-text>
            <v-card-actions style="padding: 16px">
              <v-row justify="space-between">
                <v-col md="4"></v-col>
                <v-col md="2">
                  <v-btn color="primary" variant="elevated" @click="closeFamily">Cancel</v-btn>
                </v-col>
                <v-col md="2">
                  <v-btn color="primary" variant="elevated" @click="saveFamily">Save</v-btn>
                </v-col>
                <v-col md="4"></v-col>
              </v-row>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Child Info Section -->
        <v-row justify="start" align="center">
          <v-col md="12" class="mt-4">
            <v-divider></v-divider>
            <h4 class="text-left mt-2">Child information:</h4>
          </v-col>

          <v-col cols="12" :md="item.width" v-for="item in childField" :key="item.label">
            <v-text-field 
              class="textfield-family" 
              bg-color="textbackground" 
              hide-details :label="item.label"
              v-model="currentChild[item.field]" 
              readonly 
              placeholder="  " 
              variant="outlined" 
              density="compact"
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="3">
            <v-text-field 
              class="textfield-family" 
              bg-color="textbackground" 
              hide-details 
              label="Age"
              :model-value="AgeFormated(currentChild.DoB)" 
              readonly 
              placeholder="  " 
              variant="outlined" 
              density="compact"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="1"></v-col>

          <v-col md="10">
            <v-textarea 
              class="conv-textarea" 
              label="Note about this child" 
              variant="outlined" 
              no-resize 
              rows="4" 
              hide-details
              v-model="currentChild.Note"
            ></v-textarea>
          </v-col>
          <v-col cols="12" md="2" class="text-center">
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <div v-bind="props">
                  <v-btn color="primary" icon="mdi-pencil" @click.stop="editChild" :disabled="!currentChild.id"></v-btn>
                </div>
              </template>
              <span>Edit child information</span>
            </v-tooltip>
          </v-col>
        </v-row>

        <!-- Schedule Section -->
        <v-row justify="space-around" align="center" class="mt-4">
          <v-col md="12" class="mt-2">
            <v-divider></v-divider>
            <h4 class="text-left mt-2">Schedule a study for this child:</h4>
          </v-col>
          <v-col cols="12" md="9">
            <v-select 
              :items="Responses" 
              v-model="response" 
              :label="currentChild.scheduled || contactedByOthers
              ? 'This family is already scheduled.'
              : 'Parents\' response'" 
              :disabled="!currentChild.id ||
              currentChild.scheduled ||
              !$store.state.labEmailStatus ||
              contactedByOthers" 
              class="textfield-family" 
              bg-color="textbackground" 
              hide-details 
              variant="outlined" 
              density="compact"
            ></v-select>
          </v-col>

          <v-col cols="12" md="3">
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <div v-bind="props">
                  <v-btn color="primary" size="large" @click.stop="scheduleChild" :disabled="response == null">
                    {{ response === "Rejected" ? "¯\\\_(ツ)_/¯" : "" }}
                    <v-icon start v-if="scheduleButtonIcon">{{ scheduleButtonIcon }}</v-icon>
                  </v-btn>
                </div>
              </template>
              <span>{{ scheduleButtonTooltip }}</span>
            </v-tooltip>
          </v-col>

          <v-dialog v-model="dobPicker" max-width="360px">
            <v-card variant="outlined">
              <v-date-picker 
                v-model="editedChildDateObj" 
                show-current 
                :max="new Date().toISOString()"
                @update:model-value="dobPick"
              ></v-date-picker>
            </v-card>
          </v-dialog>

          <v-dialog v-model="dialogChildEdit" max-width="1000px" :retain-focus="false">
            <v-card variant="outlined">
              <v-card-title>
                <span class="text-h5">Child's information</span>
              </v-card-title>
              <v-card-text>
                <v-form ref="formChild" v-model="validChild">
                  <v-container>
                    <v-row dense style="padding: 8px 8px 4px">
                      <v-col cols="12" :md="item.width" v-for="item in $childInfo" :key="item.label">
                        <div v-if="!!item.options">
                          <v-combobox :label="item.label" :items="$Options[item.options]" justify="start"
                            v-model="editedChild[item.field]" variant="outlined" hide-details density="compact"></v-combobox>
                        </div>
                        <div v-else-if="item.label === 'Note'">
                          <v-textarea class="conv-textarea" :label="item.label" variant="outlined" no-resize rows="4" hide-details
                            v-model="editedChild[item.field]"></v-textarea>
                        </div>
                        <div v-else-if="item.field === 'DoB'">
                          <v-text-field v-model="editedChild.DoB" append-inner-icon="mdi-calendar" @click:append-inner="dobPicker = true"
                            :rules="$rules.dob" :label="item.label" class="textfield-family" hide-details density="compact"
                            placeholder="  " variant="outlined" bg-color="textbackground"></v-text-field>
                        </div>
                        <div v-else-if="!!item.rules">
                          <v-text-field class="textfield-family" hide-details :label="item.label"
                            v-model="editedChild[item.field]" density="compact" placeholder="  " variant="outlined" :rules="$rules[item.rules]"
                            bg-color="textbackground"></v-text-field>
                        </div>
                        <div v-else>
                          <v-text-field class="textfield-family" hide-details :label="item.label"
                            v-model="editedChild[item.field]" density="compact" placeholder="  " variant="outlined"
                            bg-color="textbackground"></v-text-field>
                        </div>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="12" :md="item.width" v-for="item in $childSensitiveInfo" :key="item.label">
                        <v-checkbox class="checkbox-child" hide-details :label="item.label"
                          v-model="editedChild[item.field]" density="compact">
                        </v-checkbox>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-form>
              </v-card-text>

              <v-card-actions style="padding: 16px">
                <v-row justify="space-between">
                  <v-col md="4"></v-col>
                  <v-col md="2">
                    <v-btn color="primary" variant="elevated" @click="closeChild">Cancel</v-btn>
                  </v-col>
                  <v-col md="2">
                    <v-btn color="primary" variant="elevated" @click="saveChild">Save</v-btn>
                  </v-col>
                  <v-col md="4"></v-col>
                </v-row>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <!-- Dialog Component, to create or update a schedule -->
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
        </v-row>
        
        <v-row justify="space-around" align="center" class="mt-4">
          <v-col md="12" class="mt-2">
            <v-divider></v-divider>
            <h4 class="text-left mt-2">No More Contact</h4>
          </v-col>
          <v-col cols="12" md="10">
            <h3 class="text-left font-weight-regular mt-2">
              If this family requests NO MORE CONTACT, you should click this button ===>>>>
            </h3>
          </v-col>
          <v-col cols="12" md="2" class="text-center">
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <div v-bind="props">
                  <v-btn icon @click="NoMoreContact" :disabled="!currentChild.id">
                    <v-icon color="warning">mdi-hand-back-right</v-icon>
                  </v-btn>
                </div>
              </template>
              <span>Remove this family from the database.</span>
            </v-tooltip>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12" md="3">
        <NotesConversation 
          v-if="currentFamily?.id"
          :Conversation="currentFamily.Conversations" 
          :familyId="parseInt(currentFamily.id)"
          :notes="currentFamily.Note" 
          @updateNotes="saveNotes"
        ></NotesConversation>
      </v-col>
    </v-row>

    <v-row justify="start" style="height: 450px" class="mt-4">
      <v-col cols="12" md="9">
        <AppointmentTableBrief :Appointments="currentFamily.Appointments" :family="currentFamily"></AppointmentTableBrief>
      </v-col>

      <v-col cols="12" md="3">
        <ParticipationHistory v-if="currentFamily?.id" :family="currentFamily" />
      </v-col>
    </v-row>
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
import ParticipationHistory from "@/components/ParticipationHistoryChart.vue";
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
    ParticipationHistory,
    ConfirmDlg,
  },
  props: {
    training: Boolean,
  },
  data() {
    return {
      dialogChildEdit: false,
      dialogFamilyEdit: false,
      dialogSchedule: false,
      dobPicker: false,
      editedChildDateObj: null,
      validChild: true,
      validFamily: true,
      studies: [],
      selectedStudy: {
        StudyName: null,
        FK_Lab: this.$store.state.lab,
        MinAge: null,
        MaxAge: null,
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
      defaultItem: {
        Name: null, Sex: null, DoB: null,
        Family: { NamePrimary: null, NameSecondary: null, Phone: null, Email: null },
      },
      editedIndex: null,
      childField: [
        { label: "Name", field: "Name", width: 3 },
        { label: "Sex", field: "Sex", width: 1 },
        { label: "DoB", field: "DoB", width: 2 },
      ],
      familyField: [1, 2, 0, 3, 4, 7, 15],
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
  },

  methods: {
    dobPick(val) {
      if (val) {
        this.editedChild.DoB = moment(val).format("YYYY-MM-DD");
      }
      this.dobPicker = false;
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
          alert("Authentication failed, please login.");
          this.$router.push({ name: "Login" });
        }
      }
    },

    async searchChild() {
      this.$store.dispatch("setLoadingStatus", true);

      if (!this.currentChild.scheduled && this.currentChild.FK_Family) {
        const results = await RTU.remove(this.currentChild.FK_Family);
        this.currentVisitedFamilies = results.data;
      }

      const queryString = {
        minAge: this.selectedStudy.MinAge,
        maxAge: this.selectedStudy.MaxAge,
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
        const Results = await child.search(queryString);

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

          alert("Hold on!\n\nMake sure to confirm with parents about their email address and child's information.\n\nUse the pencil buttons to update family and/or child informatin.\n\nYour little effort will benefit everyone in the future!\n\nThanks! :)");
        } else {
          alert("no child is elegible for the selected study. :(");
          this.page = 0;
          this.Children = [];
          this.currentChild = Object.assign({}, this.defaultItem);
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({ name: "Login" });
        } else {
          console.error(error);
        }
      }

      this.response = null;
      setTimeout(() => this.$store.dispatch("setLoadingStatus", false), 500);
    },

    editFamily() {
      this.editedIndex = this.Children.indexOf(this.currentChild);
      if (this.currentFamily) {
        this.editedFamily = Object.assign({}, this.currentFamily);
        this.dialogFamilyEdit = true;
      }
    },

    editChild() {
      this.editedIndex = this.Children.indexOf(this.currentChild);
      this.editedChild = Object.assign({}, this.currentChild);
      this.dialogChildEdit = true;
    },

    async saveFamily() {
      let validationResults = true;
      if (this.$refs.formFamily) {
        const { valid } = await this.$refs.formFamily.validate();
        validationResults = valid;
      }

      if (validationResults) {
        this.editedFamily.UpdatedBy = this.$store.state.userID;
        try {
          await family.update(this.editedFamily);
          this.currentChild.Family = this.editedFamily;
          if (this.editedIndex >= 0) {
            Object.assign(this.Children[this.editedIndex], this.currentChild);
          }
          console.log("Family Info is updated!");
          if (this.$refs.formFamily) this.$refs.formFamily.resetValidation();
          this.closeFamily();
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

    async saveChild() {
      try {
        let validationResults = true;
        if (this.$refs.formChild) {
          const { valid } = await this.$refs.formChild.validate();
          validationResults = valid;
        }

        if (validationResults) {
          this.editedChild.Age = Math.floor((new Date() - new Date(this.editedChild.DoB)) / (24 * 3600 * 1000));
          await child.update(this.editedChild);
          if (this.editedIndex >= 0) Object.assign(this.Children[this.editedIndex], this.editedChild);
          console.log("Child information updated!");
          if (this.$refs.formChild) this.$refs.formChild.resetValidation();
          this.closeChild();
        }
      } catch (error) {
        console.log(error);
      }
    },

    closeChild() {
      this.dialogChildEdit = false;
      setTimeout(() => {
        this.editedChild = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      }, 300);
    },

    closeFamily() {
      this.dialogFamilyEdit = false;
      setTimeout(() => {
        this.editedFamily = {};
        this.editedIndex = -1;
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
          alert("Authentication failed, please login.");
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
          alert("This family is removed from the databased.");
        } catch (error) {
          console.log(error);
        }
      }
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
    dialogChildEdit(val) { val || this.closeChild(); },
    dialogFamilyEdit(val) { val || this.closeFamily(); },
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
