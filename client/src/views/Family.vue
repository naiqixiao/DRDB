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
    <v-row justify="space-around">
      <v-col cols="12" md="5">
        <v-row align="center" dense>
          <v-col cols="12" md="3" style="text-align: start">
            <v-btn large @click.stop="searchMode" :disabled="searchStatus">
              <v-icon left>mdi-magnify</v-icon>Search
            </v-btn>
          </v-col>
          <v-col cols="12" md="3" style="text-align: start">
            <v-btn large @click="followupSearch">
              <v-icon left>mdi-phone</v-icon>Follow-ups
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
                @keydown.enter="searchFamily(item.field, $event.target.value)"
                :label="item.label"
                :value="
                  item.label === 'Phone'
                    ? PhoneFormated(currentFamily[item.field])
                    : currentFamily[item.field]
                "
                :append-icon="searchStatus ? 'mdi-magnify' : undefined"
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
            <v-col cols="12" md="6">
              <v-textarea
                class="conv-textarea"
                label="Notes for next contact"
                outlined
                no-resize
                rows="3"
                hide-details
                readonly
                v-model="currentFamily.NextContactNote"
              ></v-textarea>
            </v-col>
            <v-spacer></v-spacer>

            <v-col cols="12" md="1">
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

            <v-col cols="12" md="1">
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

            <v-col cols="12" md="1">
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
                      <v-icon color="warning">cancel</v-icon>
                    </v-btn>
                  </div>
                </template>
                <span>Delete family information</span>
              </v-tooltip>
            </v-col>

            <v-col cols="12" md="2" class="text-right">
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

          <v-form ref="form" v-model="valid" lazy-validation>
            <v-row>
              <v-col md="12" class="subtitle">
                <v-divider></v-divider>
                <h4 class="text-left">Family information:</h4>
              </v-col>
              <v-col
                cols="12"
                :md="field.width"
                v-for="field in this.$familyBasicInfo"
                :key="field.label"
              >
                <div v-if="field.options">
                  <v-select
                    justify="start"
                    :items="options[field.options]"
                    v-model="editedItem[field.field]"
                    outlined
                    :label="field.label"
                    dense
                    chip
                  ></v-select>
                </div>
                <div v-else-if="field.rules">
                  <v-text-field
                    :label="field.label"
                    :rules="$rules[field.rules]"
                    v-model="editedItem[field.field]"
                    outlined
                    hide-details
                    dense
                  ></v-text-field>
                </div>
                <div v-else>
                  <v-text-field
                    :label="field.label"
                    v-model="editedItem[field.field]"
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
                :md="field.width"
                v-for="field in this.$familyContactInfo"
                :key="field.label"
              >
                <div v-if="field.options">
                  <v-select
                    justify="start"
                    :items="options[field.options]"
                    v-model="editedItem[field.field]"
                    outlined
                    :label="field.label"
                    dense
                    chip
                  ></v-select>
                </div>
                <div v-else-if="field.rules">
                  <v-text-field
                    :label="field.label"
                    :rules="$rules[field.rules]"
                    v-model="editedItem[field.field]"
                    outlined
                    hide-details
                    dense
                  ></v-text-field>
                </div>
                <div v-else>
                  <v-text-field
                    :label="field.label"
                    v-model="editedItem[field.field]"
                    outlined
                    hide-details
                    dense
                  ></v-text-field>
                </div>
              </v-col>
              <v-col md="12" class="subtitle">
                <v-divider></v-divider>
                <h4 class="text-left">Notes:</h4>
              </v-col>
              <v-col md="8" class="subtitle">
                <v-textarea
                  label
                  outlined
                  no-resize
                  rows="3"
                  v-model="editedItem.Note"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
          <v-card-actions>
            <v-row justify="space-between" style="height: 50px">
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
      >
        <v-card outlined>
          <v-card-title>
            <span class="headline">Notes for the next contact</span>
          </v-card-title>
          <NextContact
            ref="NextContact"
            :familyId="currentFamily.id"
            :labId="$store.state.lab"
            :studyDate="nextContactDate"
            :contactType="contactType"
            :nextContactDialog="nextContactDialog"
            @nextContactDone="updateNextContactFrontend"
          ></NextContact>
          <v-card-actions>
            <v-row justify="space-between" style="height: 50px">
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
          <h1 class="text-left">Child information</h1>
        </v-col>
        <v-col
          style="
            overflow-y: scroll;
            padding: 0px !important;
            height: 400px !important;
          "
        >
          <ChildInfo
            :Children="currentFamily.Children"
            :familyId="parseInt(currentFamily.id)"
            :currentFamily="currentFamily"
            :studyTimeSlots="this.$studyTimeSlots"
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
    <v-row justify="start" dense height="300">
      <v-col cols="12" md="9">
        <!-- <AppointmentTable
          :Appointments="currentFamily.Appointments"
          :studyTimeSlots="this.$studyTimeSlots"
          :family="currentFamily"
          @alert="alert = true"
          @nextContactDone="updateNextContactFrontend"
        ></AppointmentTable>-->
        <ScheduleTable
          :Schedules="currentFamily.Schedules"
          :studyTimeSlots="this.$studyTimeSlots"
          tableHeight="380px"
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
      },
      familyTemplate: {
        id: null,
        Email: null,
        Phone: null,
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
      },
      currentFamily: {
        id: null,
        Email: null,
        Phone: null,
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
      },
      Families: [],
      // editableFields: [],
      options: {
        language: ["English", "French", "Chinese", "Spanish", "Hindi"],
        race: ["Indian", "Asian", "African", "Hispanic", "Caucasian", "Arabic"],
        recruitmentMethod: [
          "Hospital",
          "Events",
          "SocialMedia",
          "PreviousParticipation",
        ],
      },
    };
  },

  methods: {
    async updateFamilyAppointment() {
      try {
        const Result = await family.search(this.queryString);
        if (Result.data.length > 0) {
          this.Families = Result.data;
          this.currentFamily = this.Families[this.page - 1];
          // this.searchStatus = !this.searchStatus;
        } else {
          alert("no family can be found");
          this.page = 0;
          this.currentFamily = {};
        }
      } catch (error) {
        if (error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login",
          });
        }
      }
    },

    searchMode() {
      this.searchStatus = !this.searchStatus;
      this.currentFamily = {};
      this.Families = [];
      this.page = 0;
    },

    async searchFamily(item, field) {
      this.$store.dispatch("setLoadingStatus", true);

      if (item && field) {
        this.currentFamily[item] = field;
      }
      this.queryString = this.currentFamily;

      try {
        const Results = await family.search(this.queryString);
        if (Results.data.length > 0) {
          this.Families = Results.data;
          this.page = 1;
          this.currentFamily = this.Families[this.page - 1];
          this.searchStatus = !this.searchStatus;
        } else {
          alert("no family can be found");
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

    async followupSearch() {
      this.$store.dispatch("setLoadingStatus", true);

      this.queryString.NextContactDate = moment().startOf("day").toString();
      this.queryString.AssignedLab = this.$store.state.lab;

      try {
        const Results = await family.search(this.queryString);
        if (Results.data.length > 0) {
          this.Families = Results.data;
          this.page = 1;
          this.currentFamily = this.Families[this.page - 1];
          this.searchStatus = !this.searchStatus;
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

            await family.update(this.editedItem);

            Object.assign(this.Families[this.editedIndex], this.editedItem);

            console.log("Family information updated!");
          } else {
            this.editedItem.LastContactDate = new Date();
            this.editedItem.NextContactDate = new Date();
            this.editedItem.UpdatedBy = store.state.userID;
            this.editedItem.CreatedBy = store.state.userID;

            const newfamilyId = await family.create(this.editedItem);

            this.editedItem.id = newfamilyId.data.id;

            this.currentFamily = this.editedItem;

            this.currentFamily.Children = [];

            this.Families.push(this.editedItem);
            this.page = this.Families.length;
            console.log("Family is creted!");
            // this.$emit("searchFamily", this.editedItem);
          }
        } catch (error) {
          console.log(error.response);
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
      this.currentFamily.NextContactNote = nextContact.NextContactNote;
      this.currentFamily.NextContactDate = nextContact.NextContactDate;
      this.currentFamily.NoMoreContact = nextContact.NoMoreContact;
      this.currentFamily.LastContactDate = nextContact.LastContactDate;
      this.currentFamily.AssignedLab = nextContact.AssignedLab;

      Object.assign(this.Families[this.page - 1], this.currentFamily);

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

    nextPage() {
      this.page += 1;
      this.currentFamily = this.Families[this.page - 1];
    },

    previousPage() {
      this.page -= 1;
      this.currentFamily = this.Families[this.page - 1];
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
  watch: {},
  computed: {
    TodaysDate() {
      return moment().startOf("day").format("YYYY-MM-DD");
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
