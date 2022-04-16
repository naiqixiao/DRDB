<template>
  <v-container fluid>
    <div v-if="!$store.state.labEmailStatus">
      <v-alert
        border="left"
        type="error"
        color="#c73460"
        dense
        style="font-weight: 600"
        >Lab email is not been setup properly. Please set it up in the Settings
        page.</v-alert
      >
    </div>
    <div v-if="!$store.state.adminEmailStatus">
      <v-alert
        border="left"
        type="warning"
        color="#c7792c"
        dense
        style="font-weight: 600"
        >Admin email is not been setup properly. Please set it up in the
        Settings page.</v-alert
      >
    </div>
    <div v-if="$store.state.trainingMode">
      <v-alert
        border="left"
        type="warning"
        color="#c7792c"
        dense
        style="font-weight: 600"
        >You are running in a training mode.</v-alert
      >
    </div>
    <v-row justify="space-around">
      <v-col cols="12" md="5">
        <v-row align="center" dense>
          <v-col cols="12" md="3" style="text-align: start">
            <v-btn
              v-bind="btnSize"
              @click.stop="searchMode"
              :disabled="searchStatus"
            >
              <v-icon left v-bind="iconSize">mdi-magnify</v-icon>Search
            </v-btn>
          </v-col>
          <v-col cols="12" md="3" style="text-align: start">
            <v-btn v-bind="btnSize" @click="followupSearch">
              <v-icon left v-bind="iconSize">mdi-phone</v-icon>Follow-ups
            </v-btn>
          </v-col>

          <v-spacer></v-spacer>
          <v-col cols="12" md="4" class="text-center">
            <Page
              :page="page"
              :NofPages="Families ? Families.length : 0"
              @nextPage="nextPage"
              @previousPage="previousPage"
            ></Page>
          </v-col>
        </v-row>

        <v-row justify="space-between" dense>
          <v-col md="12" class="subtitle">
            <v-divider></v-divider>
            <h4 class="text-left">Contact information:</h4>
          </v-col>
          <v-col
            cols="12"
            :md="item.width"
            v-for="item in this.$familyFields.slice(0, 4)"
            :key="item.label"
          >
            <div v-if="item.searchable">
              <v-text-field
                class="textfield-family"
                background-color="textbackground"
                hide-details
                @keydown.enter="searchFamily()"
                @input="getSearchKeys(item.field, $event)"
                :label="item.label"
                :value="
                  item.label === 'Phone' || item.label === 'Cell Phone'
                    ? PhoneFormated(currentFamily[item.field])
                    : currentFamily[item.field]
                "
                :append-icon="searchStatus ? 'mdi-magnify' : ''"
                :readonly="!searchStatus"
                placeholder="  "
                outlined
                dense
              ></v-text-field>
            </div>
          </v-col>

          <v-col md="12" class="subtitle">
            <v-divider></v-divider>

            <h4 class="text-left">Family information:</h4>
          </v-col>
          <v-col
            cols="12"
            :md="item.width"
            v-for="item in this.$familyFields.slice(4, 13)"
            :key="item.label"
          >
            <div v-if="item.searchable">
              <v-text-field
                class="textfield-family"
                background-color="textbackground"
                hide-details
                @keydown.enter="searchFamily"
                @input="getSearchKeys(item.field, $event)"
                :label="item.label"
                v-model="currentFamily[item.field]"
                :append-icon="searchStatus ? 'mdi-magnify' : undefined"
                :readonly="!searchStatus"
                placeholder="  "
                outlined
                dense
              ></v-text-field>
            </div>
            <div v-else>
              <v-text-field
                class="textfield-family"
                filled
                hide-details
                :label="item.label"
                v-model="currentFamily[item.field]"
                readonly
                dense
                placeholder="  "
                outlined
                background-color="textbackground"
              ></v-text-field>
            </div>
          </v-col>

          <v-col md="12" class="subtitle">
            <v-divider></v-divider>

            <h4 class="text-left">Schedule information:</h4>
          </v-col>
          <v-col
            cols="12"
            :md="item.width"
            v-for="item in this.$familyFields.slice(13, 16)"
            :key="item.label"
          >
            <div>
              <v-text-field
                class="textfield-family"
                filled
                hide-details
                :label="item.label"
                v-model="currentFamily[item.field]"
                readonly
                dense
                placeholder="  "
                outlined
                background-color="textbackground"
              ></v-text-field>
            </div>
          </v-col>

          <v-row justify="space-between" align="end" dense>
            <v-col cols="12" md="7">
              <v-textarea
                class="conv-textarea"
                label="Notes for next contact"
                outlined
                no-resize
                rows="6"
                hide-details
                readonly
                v-model="currentFamily.NextContactNote"
              ></v-textarea>
            </v-col>
            <v-spacer></v-spacer>

            <v-col cols="12" md="5">
              <v-row dense>
                <v-col cols="12" md="6">
                  <v-tooltip top>
                    <template v-slot:activator="{ on }">
                      <div v-on="on">
                        <v-btn
                          fab
                          @click.stop="
                            contactType = 'NextContact';
                            nextContactDate = TodaysDate;
                            nextContactDialog = !nextContactDialog;
                          "
                          :disabled="!currentFamily.id && !nextContactDialog"
                        >
                          <v-icon>notes</v-icon>
                        </v-btn>
                      </div>
                    </template>
                    <span>Note down info for next contact</span>
                  </v-tooltip>
                </v-col>

                <v-col cols="12" md="6">
                  <v-tooltip top>
                    <template v-slot:activator="{ on }">
                      <div v-on="on">
                        <v-btn
                          fab
                          @click.stop="editFamily"
                          :disabled="!currentFamily.id"
                        >
                          <v-icon>edit</v-icon>
                        </v-btn>
                      </div>
                    </template>
                    <span>Edit family information</span>
                  </v-tooltip>
                </v-col>

                <v-col cols="12" md="6">
                  <v-tooltip top>
                    <template v-slot:activator="{ on }">
                      <div v-on="on">
                        <v-btn
                          fab
                          @click.stop="
                            contactType = 'NoMoreContact';
                            nextContactDate = TodaysDate;
                            nextContactDialog = !nextContactDialog;
                          "
                          :disabled="!currentFamily.id && !nextContactDialog"
                        >
                          <v-icon color="warning" style="padding-right: 5px"
                            >pan_tool</v-icon
                          >
                        </v-btn>
                      </div>
                    </template>
                    <span>No more contact</span>
                  </v-tooltip>
                </v-col>

                <v-col cols="12" md="6">
                  <v-tooltip top>
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn
                        color="primary"
                        fab
                        @click.stop="addFamily"
                        v-bind="attrs"
                        v-on="on"
                      >
                        <v-icon>add</v-icon>
                      </v-btn>
                    </template>
                    <span>Add a new family</span>
                  </v-tooltip>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-row>
      </v-col>

      <v-dialog v-model="dialog" max-width="1200px" :retain-focus="false">
        <v-card outlined>
          <v-card-title>
            <span class="headline">{{
              editedIndex === -1
                ? "Add a new family"
                : "Edit family information"
            }}</span>
            <v-spacer></v-spacer>
            <span class="headline">{{
              editedIndex === -1 ? "" : "Family ID: " + editedItem.id
            }}</span>
          </v-card-title>
          <v-card-text>
            <v-form ref="form" v-model="valid" lazy-validation>
              <v-row dense style="padding: 8px 8px 4px">
                <v-col md="12" class="subtitle">
                  <v-divider></v-divider>
                  <h4 class="text-left">Family information:</h4>
                </v-col>
                <v-col
                  cols="12"
                  :md="item.width"
                  v-for="item in this.$familyBasicInfo"
                  :key="item.label"
                >
                  <div v-if="!!item.options">
                    <!-- :item-value="$Options[item.options]" -->
                    <!-- :item-value="['1', 2, null]"
                      :item-text="['Yes', 'No', 'Unknown']" -->
                    <div v-if="item.field != 'AutismHistory'">
                      <v-combobox
                        class="textfield-family"
                        justify="start"
                        v-model="editedItem[item.field]"
                        :items="$Options[item.options]"
                        outlined
                        :label="item.label"
                        dense
                      ></v-combobox>
                    </div>
                    <div v-else>
                      <!-- :item-value="editedItem[item.field]"
                        :item-text="AutismText(editedItem[item.field])" -->
                      <v-select
                        class="textfield-family"
                        :items="$Options[item.options]"
                        v-model="editedItem[item.field]"
                        :return-object="false"
                        :label="item.label"
                        outlined
                        dense
                      ></v-select>
                    </div>
                  </div>
                  <div v-else-if="item.rules">
                    <v-text-field
                      class="textfield-family"
                      :label="item.label"
                      :rules="$rules[item.rules]"
                      v-model="editedItem[item.field]"
                      outlined
                      hide-details
                      dense
                    ></v-text-field>
                  </div>
                  <div v-else>
                    <v-text-field
                      class="textfield-family"
                      :label="item.label"
                      v-model="editedItem[item.field]"
                      outlined
                      hide-details
                      dense
                    ></v-text-field>
                  </div>
                </v-col>

                <v-col md="12" class="subtitle">
                  <v-divider></v-divider>
                  <h4 class="text-left">Contact information:</h4>
                </v-col>
                <v-col
                  cols="12"
                  :md="item.width"
                  v-for="item in this.$familyContactInfo"
                  :key="item.label"
                >
                  <div v-if="item.options">
                    <v-combobox
                      class="textfield-family"
                      justify="start"
                      :items="$Options[item.options]"
                      v-model="editedItem[item.field]"
                      outlined
                      :label="item.label"
                      dense
                    ></v-combobox>
                  </div>
                  <div v-else-if="item.rules">
                    <v-text-field
                      class="textfield-family"
                      :label="item.label"
                      :rules="$rules[item.rules]"
                      v-model="editedItem[item.field]"
                      outlined
                      hide-details
                      dense
                    ></v-text-field>
                  </div>
                  <div v-else>
                    <v-text-field
                      class="textfield-family"
                      :label="item.label"
                      v-model="editedItem[item.field]"
                      outlined
                      hide-details
                      dense
                    ></v-text-field>
                  </div>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-card-actions style="padding: 16px">
            <v-row justify="space-between">
              <v-col md="4"></v-col>
              <v-col md="2">
                <v-btn color="primary" @click="dialog = false">Cancel</v-btn>
              </v-col>
              <v-col md="2">
                <v-btn color="primary" @click="save">Save</v-btn>
              </v-col>
              <v-col md="4"></v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog
        v-model="nextContactDialog"
        max-width="800px"
        :retain-focus="false"
        persistent
      >
        <v-card outlined>
          <v-card-title>
            <span class="headline">Notes for the next contact</span>
          </v-card-title>
          <NextContact
            ref="NextContact"
            :familyId="parseInt(currentFamily.id)"
            :labId="$store.state.lab"
            :studyDate="nextContactDate"
            :contactType="contactType"
            :nextContactDialog="nextContactDialog"
            @nextContactDone="updateNextContactFrontend"
          ></NextContact>
          <v-card-actions style="padding: 16px">
            <v-row justify="space-between">
              <v-col md="4"></v-col>
              <v-col md="2">
                <v-btn color="primary" @click="nextContactDialog = false"
                  >Cancel</v-btn
                >
              </v-col>
              <v-col md="2">
                <v-btn color="primary" @click="updateNextContact">Save</v-btn>
              </v-col>
              <v-col md="4"></v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-col cols="12" md="4">
        <v-col cols="12" md="12" class="justify-start">
          <div v-if="!searchStatus">
            <h2 class="text-left" v-if="!contactedByOthers">
              Child information
            </h2>
            <h2 style="color: red" v-else>
              Some one is calling (or just called) this family.
            </h2>
          </div>
          <div v-else>
            <v-text-field
              style="height: 48px"
              background-color="textbackground"
              hide-details
              @keydown.enter="searchFamily"
              @input="getSearchKeys('childName', $event)"
              label="Child's Name"
              :append-icon="searchStatus ? 'mdi-magnify' : undefined"
              :readonly="!searchStatus"
              placeholder="  "
              outlined
              dense
            ></v-text-field>
          </div>
        </v-col>
        <v-col style="padding: 0px !important; height: 500px !important">
          <ChildInfo
            ref="childInfo"
            :Children="currentFamily.Children"
            :familyId="parseInt(currentFamily.id)"
            :currentFamily="currentFamily"
            @newSchedule="updateFamilyAppointment"
          ></ChildInfo>
        </v-col>
      </v-col>

      <v-col cols="12" md="3">
        <NotesConversation
          :Conversation="currentFamily.Conversations"
          :familyId="parseInt(currentFamily.id)"
          :notes="currentFamily.Note"
          @updateNotes="saveNotes"
        ></NotesConversation>
      </v-col>
    </v-row>
    <v-row justify="start" dense height="450px">
      <v-col cols="12" md="9">
        <ScheduleTable
          :Schedules="currentFamily.Schedules"
          tableHeight="450px"
          @nextContactDone="updateNextContactFrontend"
        ></ScheduleTable>
      </v-col>

      <v-col cols="12" md="3">
        <ParticipationHistory :family="currentFamily" />
      </v-col>
    </v-row>

    <template>
      <v-alert
        :value="alert"
        border="left"
        close-text="Close Alert"
        type="warning"
        dismissible
        >Cancel the appointment?</v-alert
      >
    </template>
  </v-container>
</template>

<script>
import ChildInfo from "@/components/ChildInfo";
import ScheduleTable from "@/components/ScheduleTable";
// import AppointmentTable from "@/components/AppointmentTable";
import NotesConversation from "@/components/NotesConversation";
import Page from "@/components/Page";
import NextContact from "@/components/NextContact";
// import ParticipationHistory from "@/components/ParticipationHistory";
import ParticipationHistory from "@/components/ParticipationHistoryChart";

import family from "@/services/family";
import store from "@/store";

import moment from "moment";

import RTU from "@/services/realtimeUpdate";

export default {
  components: {
    // AppointmentTable,
    ScheduleTable,
    ChildInfo,
    NotesConversation,
    Page,
    NextContact,
    ParticipationHistory,
  },
  props: {
    training: Boolean,
  },
  data() {
    return {
      contactType: "",
      nextContactDate: "",
      nextContactDialog: false,
      queryString: {},
      alert: false,
      page: 0,
      searchStatus: false,
      dialog: false,
      valid: true,
      editedIndex: -1,
      editedItem: {
        id: null,
        Email: null,
        Phone: null,
        CellPhone: null,
        NamePrimary: null,
        NameSecondary: null,
        Address: null,
        LanguagePrimary: null,
        LanguageSecondary: null,
        EnglishPercent: null,
        RacePrimary: null,
        RaceSecondary: null,
        Vehicle: null,
        RecruitmentMethod: null,
        NextContactDate: null,
        Note: null,
      },
      familyTemplate: {
        id: null,
        Email: null,
        Phone: null,
        CellPhone: null,
        NamePrimary: null,
        NameSecondary: null,
        Address: null,
        LanguagePrimary: null,
        LanguageSecondary: null,
        EnglishPercent: null,
        RacePrimary: null,
        RaceSecondary: null,
        Vehicle: null,
        RecruitmentMethod: null,
        NextContactDate: null,
        Note: null,
      },
      currentFamily: {
        id: null,
        Email: null,
        Phone: null,
        CellPhone: null,
        NamePrimary: null,
        NameSecondary: null,
        Address: null,
        LanguagePrimary: null,
        LanguageSecondary: null,
        EnglishPercent: null,
        RacePrimary: null,
        RaceSecondary: null,
        Vehicle: null,
        RecruitmentMethod: null,
        NextContactDate: null,
        Note: null,
        scheduled: false,
      },
      Families: [],
      currentVisitedFamilies: [],
      contactedByOthers: false,
      // editableFields: [],
    };
  },

  methods: {
    async updateFamilyAppointment() {
      try {
        var queryString = {};
        queryString = { id: this.currentFamily.id };

        queryString.trainingMode = this.$store.state.trainingMode;

        var updatedFamily = await family.search(queryString);
        updatedFamily.data.families[0].scheduled = true;

        this.Families[this.page - 1] = Object.assign(
          {},
          updatedFamily.data.families[0]
        );
        this.currentFamily = this.Families[this.page - 1];
        // console.log(this.currentFamily)
      } catch (error) {
        if (error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login",
          });
        }
      }
    },

    async searchMode() {
      if (!this.currentFamily.scheduled && !!this.currentFamily.id) {
        // this.socket.emit("remove family", this.currentFamily.id);
        const results = await RTU.remove(this.currentFamily.id);
        this.currentVisitedFamilies = results.data;
      }

      this.searchStatus = !this.searchStatus;
      this.currentFamily = Object.assign({}, this.familyTemplate);
      this.Families = [];
      this.page = 0;
      this.queryString = {};
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
        if (Results.data.families.length > 0) {
          this.Families = Results.data.families;
          this.page = 1;
          this.currentFamily = this.Families[this.page - 1];

          if (this.currentVisitedFamilies.includes(this.currentFamily.id)) {
            this.contactedByOthers = true;
          } else {
            const results = await RTU.add(this.currentFamily.id);
            this.currentVisitedFamilies = results.data;
            this.contactedByOthers = false;
          }
        } else {
          this.page = 0;
          this.currentFamily = Object.assign({}, this.familyTemplate);

          this.currentFamily.Email = "";
          this.currentFamily.Phone = "";
          this.currentFamily.CellPhone = "";
          this.currentFamily.id = "";

          alert(Results.data.message);
        }

        this.searchStatus = !this.searchStatus;
      } catch (error) {
        if (error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login",
          });
        }
      }

      setTimeout(() => this.$store.dispatch("setLoadingStatus", false), 1000);
    },

    async followupSearch() {
      this.$store.dispatch("setLoadingStatus", true);

      if (!this.currentFamily.scheduled && !!this.currentFamily.id) {
        // this.socket.emit("remove family", this.currentFamily.id);
        const results = await RTU.remove(this.currentFamily.id);
        this.currentVisitedFamilies = results.data;
      }

      this.queryString.AssignedLab = this.$store.state.lab;

      this.queryString.trainingMode = this.$store.state.trainingMode;

      try {
        const Results = await family.followupSearch(this.queryString);
        if (Results.data.length > 0) {
          this.Families = Results.data;
          this.page = 1;
          this.currentFamily = this.Families[this.page - 1];

          if (this.currentVisitedFamilies.includes(this.currentFamily.id)) {
            this.contactedByOthers = true;
          } else {
            const results = await RTU.add(this.currentFamily.id);
            this.currentVisitedFamilies = results.data;
            this.contactedByOthers = false;
          }
        } else {
          alert("No family needs to be followed up.");
          this.page = 0;
          this.currentFamily = Object.assign({}, this.familyTemplate);
        }
      } catch (error) {
        if (error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login",
          });
        }
      }

      setTimeout(() => this.$store.dispatch("setLoadingStatus", false), 1000);
    },

    addFamily() {
      if (this.$store.state.trainingMode) {
        alert(
          "You are currently in Training mode.\n\nAny family created under Training mode will only be accessible for training purpose.\n\nIf you want to create a record for a real family, please turn off the Training mode first."
        );
      }

      this.editedIndex = -1;
      this.editedItem = Object.assign({}, this.familyTemplate);
      // this.editableFields = Object.assign({}, this.$familyFields);
      // this.editableFields.shift();
      // this.editableFields.pop();
      // this.editableFields.pop();
      this.dialog = true;
    },

    editFamily() {
      this.editedIndex = this.Families.indexOf(this.currentFamily);
      this.editedItem = Object.assign({}, this.currentFamily);
      // this.editableFields = Object.assign({}, this.$familyFields);
      this.dialog = true;
    },

    async save() {
      var validationResults = this.$refs.form.validate();

      if (validationResults) {
        try {
          if (this.editedIndex > -1) {
            this.editedItem.UpdatedBy = store.state.userID;

            delete this.editedItem.Schedules;
            delete this.editedItem.Children;
            delete this.editedItem.Conversations;

            await family.update(this.editedItem);

            Object.assign(this.Families[this.editedIndex], this.editedItem);

            this.Families[this.editedIndex].Schedules.forEach((schedule) => {
              Object.assign(schedule.Family, this.editedItem);
            });

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

            this.Families.push(this.editedItem);
            this.page = this.Families.length;
            // console.log("Family is creted!");

            this.$refs.form.resetValidate();
            // this.$emit("searchFamily", this.editedItem);
          }
        } catch (error) {
          console.log(error);
        }

        this.close();
      }
    },

    close() {
      this.dialog = false;
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.familyTemplate);
        this.editedIndex = -1;
      }, 300);
    },

    async updateNextContact() {
      try {
        await this.$refs.NextContact.updateNextContact();
      } catch (error) {
        console.log(error.response);
      }
    },

    updateNextContactFrontend(nextContact) {
      // remove the family from current screen.
      // if (nextContact.NoMoreContact) {
      //   this.currentFamily = Object.assign({}, this.familyTemplate);

      //   this.Families

      // } else {
      this.currentFamily.NextContactNote = nextContact.NextContactNote;
      this.currentFamily.NextContactDate = nextContact.NextContactDate;
      this.currentFamily.NoMoreContact = nextContact.NoMoreContact;
      this.currentFamily.LastContactDate = nextContact.LastContactDate;
      this.currentFamily.AssignedLab = nextContact.AssignedLab;

      Object.assign(this.Families[this.page - 1], this.currentFamily);
      // }

      // if (nextContact.NoMoreContact) {
      // }

      this.nextContactDialog = false;
      console.log("Next Contact updated!");
    },

    async saveNotes(newNotes) {
      this.currentFamily.Note = newNotes;

      this.currentFamily.UpdatedBy = store.state.userID;

      await family.update(this.currentFamily);

      Object.assign(this.Families[this.page - 1], this.currentFamily);
    },

    validate() {
      var validationresults = this.$refs.form.validate();
      console.log(validationresults);
    },

    async nextPage() {
      if (!this.currentFamily.scheduled && !this.contactedByOthers) {
        const results = await RTU.remove(this.currentFamily.id);
        this.currentVisitedFamilies = results.data;
      }

      this.page += 1;
      this.currentFamily = this.Families[this.page - 1];

      this.$refs.childInfo.resetSchedule();

      if (this.currentVisitedFamilies.includes(this.currentFamily.id)) {
        this.contactedByOthers = true;
      } else {
        const results = await RTU.add(this.currentFamily.id);
        this.currentVisitedFamilies = results.data;
        this.contactedByOthers = false;
      }
    },

    async previousPage() {
      if (!this.currentFamily.scheduled && !this.contactedByOthers) {
        const results = await RTU.remove(this.currentFamily.id);
        this.currentVisitedFamilies = results.data;
      }

      this.page -= 1;
      this.currentFamily = this.Families[this.page - 1];
      this.$refs.childInfo.resetSchedule();

      if (this.currentVisitedFamilies.includes(this.currentFamily.id)) {
        this.contactedByOthers = true;
      } else {
        const results = await RTU.add(this.currentFamily.id);
        this.currentVisitedFamilies = results.data;
        this.contactedByOthers = false;
      }
    },

    PhoneFormated(Phone) {
      if (Phone) {
        var cleaned = ("" + Phone).replace(/\D/g, "");
        var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
          return "(" + match[1] + ") " + match[2] + "-" + match[3];
        }
        return null;
      }
    },
  },

  mounted: async function () {
    // this.socket.on("familyList update", (familyList) => {
    //   this.currentVisitedFamilies = familyList;
    //   console.log(this.currentVisitedFamilies);
    // });
    const results = await RTU.get();
    this.currentVisitedFamilies = results.data;
    // console.log(this.currentVisitedFamilies);
  },

  created: function () {
    // this.socket = io(backendURL);
    // console.log(backendURL);
  },

  beforeDestroy: function () {
    // this.socket.emit("disconnect");
    if (
      !this.currentFamily.scheduled &&
      !this.contactedByOthers &&
      this.currentFamily.id
    ) {
      // console.log("it is about to close!");
      // console.log(this.currentChild.FK_Family);
      // this.socket.emit("remove family", this.currentChild.FK_Family);
      RTU.remove(this.currentFamily.id);
      // this.currentVisitedFamilies = results.data;
    }
  },

  watch: {
    training() {
      // console.log(`My store value for 'training' changed to ${val}`);
      this.currentFamily = Object.assign({}, this.familyTemplate);
      this.Families = [];
      this.page = 0;
    },
  },
  computed: {
    TodaysDate() {
      return moment().startOf("day").format("YYYY-MM-DD");
    },
    btnSize() {
      const size = {
        xs: "x-small",
        sm: "small",
        md: "small",
        lg: "large",
        xl: "large",
      }[this.$vuetify.breakpoint.name];
      return size ? { [size]: true } : {};
    },
    iconSize() {
      const size = {
        xs: "x-small",
        sm: "small",
        md: "small",
        lg: "small",
        xl: "large",
      }[this.$vuetify.breakpoint.name];
      return size ? { [size]: true } : {};
    },
  },

  updated() {},
};
</script>

<style scoped>
.subtitle {
  padding: 4px 0px 0px 8px !important;
}
</style>
