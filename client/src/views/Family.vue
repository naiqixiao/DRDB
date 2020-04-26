<template>
  <v-container fluid>
    <v-row justify="space-around" dense>
      <v-col cols="12" md="5">
        <v-row justify="space-between" align="center">
          <v-col cols="12" md="3">
            <v-btn x-large @click.stop="searchMode" :disabled="searchStatus"
              ><v-icon left>mdi-magnify</v-icon> Search</v-btn
            >
          </v-col>
          <v-col cols="12" md="4">
            <Page
              :page="page"
              :NofPages="Families ? Families.length : 0"
              @nextPage="nextPage"
              @previousPage="previousPage"
            ></Page>
          </v-col>
        </v-row>
        <v-row justify="space-around">
          <v-col
            cols="12"
            md="4"
            v-for="item in searchingFields"
            :key="item.label"
          >
            <v-text-field
              filled
              background-color="textbackground"
              hide-details
              @keydown.enter="searchFamily"
              :label="item.label"
              v-model="currentFamily[item.field]"
              :append-icon="searchStatus ? 'mdi-magnify' : undefined"
              :readonly="!searchStatus"
              dense
            ></v-text-field>
          </v-col>
          <v-divider></v-divider>
          <v-row justify="space-around">
            <v-col
              cols="12"
              md="4"
              dense
              v-for="item in otherInfo"
              :key="item.label"
            >
              <v-text-field
                filled
                hide-details
                :label="item.label"
                v-model="currentFamily[item.field]"
                readonly
                dense
                background-color="textbackground"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-row justify="space-between" align="center">
            <v-col cols="12" md="6">
              <v-textarea
                class="conv-textarea"
                label="Notes for next contact"
                outlined
                no-resize
                rows="3"
                solo
                hide-details
                readonly
                v-model="currentFamily.NextContactNote"
              ></v-textarea>
            </v-col>
            <v-spacer></v-spacer>

            <v-col cols="12" md="1">
              <v-btn
                fab
                @click.stop="
                  contactType = 'NextContact';
                  nextContactDate = TodaysDate;
                  nextContactDialog = !nextContactDialog;
                "
                :disabled="!currentFamily.id && !nextContactDialog"
                ><v-icon>notes</v-icon></v-btn
              >
            </v-col>

            <v-col cols="12" md="1">
              <v-btn fab @click.stop="editFamily" :disabled="!currentFamily.id"
                ><v-icon>edit</v-icon></v-btn
              >
            </v-col>

            <v-col cols="12" md="1">
              <v-btn
                fab
                @click.stop="
                  contactType = 'NoMoreContact';
                  nextContactDate = TodaysDate;
                  nextContactDialog = !nextContactDialog;
                "
                :disabled="!currentFamily.id && !nextContactDialog"
                ><v-icon>block</v-icon></v-btn
              >
            </v-col>

            <v-col cols="12" md="2">
              <v-btn color="primary" fab @click.stop="addFamily"
                ><v-icon>add</v-icon></v-btn
              >
            </v-col>
          </v-row>
        </v-row>
      </v-col>

      <v-dialog v-model="dialog" max-width="1200px" :retain-focus="false">
        <v-card outlined>
          <v-card-title>
            <span class="headline">Family information</span>
          </v-card-title>

          <v-form ref="form" v-model="valid" lazy-validation>
            <v-container>
              <v-row>
                <v-col
                  cols="12"
                  sm="6"
                  md="3"
                  v-for="field in editableFields"
                  :key="field.label"
                >
                  <div v-if="field.options">
                    <v-combobox
                      justify="start"
                      :items="options[field.options]"
                      v-model="editedItem[field.field]"
                      filled
                      :label="field.label"
                      dense
                    ></v-combobox>
                  </div>
                  <div v-else-if="field.rules">
                    <v-text-field
                      :label="field.label"
                      v-model="editedItem[field.field]"
                      :rules="rules[field.rules]"
                      filled
                      dense
                    ></v-text-field>
                  </div>
                  <div v-else>
                    <v-text-field
                      :label="field.label"
                      v-model="editedItem[field.field]"
                      filled
                      dense
                    ></v-text-field>
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </v-form>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="green darken-1" text @click="dialog = false"
              >Cancel</v-btn
            >
            <v-btn color="green darken-1" text @click="save">Save</v-btn>
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
            :studyDate="nextContactDate"
            :contactType="contactType"
            :nextContactDialog="nextContactDialog"
            @nextContactDone="updateNextContactFrontend"
          ></NextContact>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="green darken-1"
              text
              @click="nextContactDialog = false"
              >Cancel</v-btn
            >
            <v-btn color="green darken-1" text @click="updateNextContact"
              >Save</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-col cols="12" md="4">
        <ChildInfo
          :Children="currentFamily.Children"
          :familyId="parseInt(currentFamily.id)"
          :currentFamily="currentFamily"
          :studyTimeSlots="this.$studyTimeSlots"
          @newSchedule="updateFamilyAppointment"
        ></ChildInfo>
      </v-col>
      <v-col cols="12" md="3">
        <Conversation
          :Conversation="currentFamily.Conversations"
          :familyId="parseInt(currentFamily.id)"
        ></Conversation>
      </v-col>
    </v-row>
    <v-row justify="start" dense>
      <v-col cols="12" md="9">
        <AppointmentTable
          :Appointments="currentFamily.Appointments"
          :studyTimeSlots="this.$studyTimeSlots"
          @alert="alert = true"
        ></AppointmentTable>
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
import AppointmentTable from "@/components/AppointmentTable";
import Conversation from "@/components/Conversation";
import Page from "@/components/Page";
import NextContact from "@/components/NextContact";

import family from "@/services/family";
import store from "@/store";

import moment from "moment";

export default {
  components: {
    AppointmentTable,
    ChildInfo,
    Conversation,
    Page,
    NextContact,
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
        NameMom: null,
        NameDad: null,
        Address: null,
        LanguageMom: null,
        LanguageDad: null,
        EnglishPercent: null,
        RaceMom: null,
        RaceDad: null,
        Vehicle: null,
        RecruitmentMethod: null,
      },
      familyTemplate: {
        id: null,
        Email: null,
        Phone: null,
        NameMom: null,
        NameDad: null,
        Address: null,
        LanguageMom: null,
        LanguageDad: null,
        EnglishPercent: null,
        RaceMom: null,
        RaceDad: null,
        Vehicle: null,
        RecruitmentMethod: null,
      },
      currentFamily: {
        id: null,
        Email: null,
        Phone: null,
        NameMom: null,
        NameDad: null,
        Address: null,
        LanguageMom: null,
        LanguageDad: null,
        EnglishPercent: null,
        RaceMom: null,
        RaceDad: null,
        Vehicle: null,
        RecruitmentMethod: null,
      },
      Families: [],
      searchingFields: [
        { label: "Mother's Name", field: "NameMom", rules: "name" },
        { label: "Father's Name", field: "NameDad", rules: "name" },
        { label: "Family ID", field: "id" },
        { label: "Email", field: "Email", rules: "email" },
        { label: "Phone", field: "Phone", rules: "phone" },
        { label: "Postal Code", field: "Address" },
      ],
      otherInfo: [
        {
          label: "Mother's Language",
          field: "LanguageMom",
          options: "language",
        },
        { label: "Mother's Race", field: "RaceMom", options: "race" },
        { label: "English %", field: "EnglishPercent" },
        {
          label: "Father's Language",
          field: "LanguageDad",
          options: "language",
        },
        { label: "Father's Race", field: "RaceDad", options: "race" },
        { label: "Vehicle", field: "Vehicle" },
        {
          label: "Recruited via",
          field: "RecruitmentMethod",
          options: "recruitmentMethod",
        },
        { label: "Last Contact Date", field: "LastContactDate" },
        { label: "Next ContactDate", field: "NextContactDate" },
      ],
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
      rules: {
        name: [
          (value) => !!value || "Required.",
          (value) => {
            var pattern = /^[\w'\-,.][^0-9_!¡?÷?¿/\\+=@#$%ˆ&*(){}|~<>;:[\]]{2,}$/;
            return pattern.test(value) || "Invalid Name.";
          },
          (value) => (value && value.length <= 30) || "Max 30 characters",
        ],
        email: [
          (value) => !!value || "Required.",
          (value) => {
            const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return pattern.test(value) || "Invalid e-mail.";
          },
          (value) => (value && value.length <= 30) || "Max 30 characters",
        ],
        phone: [
          (value) => {
            const pattern = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
            return pattern.test(value) || "Invalid phone.";
          },
          (value) => !!value || "Required.",
          (value) => (value && value.length == 10) || "Have to be 10 digits",
        ],
      },
      editableFields: [],
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

    async searchFamily() {
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
    },

    addFamily() {
      this.editedIndex = -1;
      this.editedItem = Object.assign({}, this.familyTemplate);
      this.editableFields = this.searchingFields.concat(this.otherInfo);
      this.editableFields.shift();
      this.editableFields.pop();
      this.editableFields.pop();
      this.dialog = true;
    },

    editFamily() {
      this.editedIndex = this.Families.indexOf(this.currentFamily);
      this.editedItem = Object.assign({}, this.currentFamily);
      this.editableFields = this.searchingFields.concat(this.otherInfo);
      this.editableFields.shift();
      this.editableFields.pop();
      this.editableFields.pop();
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

            this.Families.push(this.editedItem);
            this.page = this.Families.length;
            console.log("Family is creted!");
            this.$emit("searchFamily", this.editedItem);
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

      Object.assign(this.Families[this.page - 1], this.currentFamily);

      this.nextContactDialog = false;
      console.log("Next Contact updated!");
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
  },
  watch: {},
  computed: {
    TodaysDate() {
      return moment()
        .startOf("day")
        .format("YYYY-MM-DD");
    },
  },
};
</script>

<style scoped></style>
