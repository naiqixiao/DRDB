<template>
  <v-container fluid>
    <AlertBanner :showAdminEmail="true" />

    <v-row justify="space-around">
      <!-- LEFT COLUMN: Search + Family Info -->
      <v-col cols="12" md="5">
        <!-- Search Controls -->
        <v-row align="center" dense>
          <v-col cols="12" md="3" style="text-align: start">
            <v-btn size="small" @click.stop="searchMode" :disabled="searchStatus">
              <v-icon start>mdi-magnify</v-icon>Search
            </v-btn>
          </v-col>
          <v-col cols="12" md="3" style="text-align: start">
            <v-btn size="small" @click="followupSearch">
              <v-icon start>mdi-phone</v-icon>Follow-ups
            </v-btn>
          </v-col>

          <v-spacer></v-spacer>
          <v-col cols="12" md="4" class="text-center">
            <!-- Pagination -->
            <div class="pagination-container">
              <v-btn variant="text" icon @click="previousPage" :disabled="page <= 1" size="small">
                <v-icon>mdi-chevron-left</v-icon>
              </v-btn>
              <span class="text-body-1" style="width: 45px; text-align: center">{{ page }}</span>
              <span class="text-body-1" style="padding: 0 8px">/</span>
              <span class="text-body-1" style="width: 45px; text-align: left">{{ Families ? Families.length : 0
              }}</span>
              <v-btn variant="text" icon @click="nextPage" :disabled="page >= Families.length || page == 0"
                size="small">
                <v-icon>mdi-chevron-right</v-icon>
              </v-btn>
            </div>
          </v-col>
        </v-row>

        <!-- Contact Information Section -->
        <SectionHeader title="Contact Information" icon="mdi-card-account-phone-outline" />
        <v-row justify="space-between" dense>
          <v-col cols="12" :md="item.width" v-for="item in familyFields.slice(0, 4)" :key="item.label">
            <div v-if="searchStatus && item.searchable">
              <v-text-field class="textfield-family" hide-details @keydown.enter="searchFamily()"
                @update:model-value="getSearchKeys(item.field, $event)" :label="item.label" :model-value="item.label === 'Phone' || item.label === 'Cell Phone'
                  ? PhoneFormated(currentFamily[item.field])
                  : currentFamily[item.field]" append-icon="mdi-magnify" placeholder=" " variant="outlined"
                density="compact"></v-text-field>
            </div>
            <InfoField v-else :label="item.label" :value="item.label === 'Phone' || item.label === 'Cell Phone'
              ? PhoneFormated(currentFamily[item.field])
              : currentFamily[item.field]"
              :type="item.rules === 'phone' ? 'phone' : (item.rules === 'email' ? 'email' : null)" />
          </v-col>
        </v-row>

        <!-- Family Information Section -->
        <SectionHeader title="Family Information" icon="mdi-account-group" />
        <v-row dense>
          <v-col cols="12" :md="item.width" v-for="item in familyFields.slice(4, 13)" :key="item.label">
            <div v-if="searchStatus && item.searchable">
              <v-text-field class="textfield-family" hide-details @keydown.enter="searchFamily"
                @update:model-value="getSearchKeys(item.field, $event)" :label="item.label"
                v-model="currentFamily[item.field]" append-icon="mdi-magnify" placeholder=" " variant="outlined"
                density="compact"></v-text-field>
            </div>
            <InfoField v-else :label="item.label" :value="currentFamily[item.field]" />
          </v-col>
        </v-row>

        <!-- Schedule Information Section -->
        <SectionHeader title="Schedule Information" icon="mdi-calendar-clock" />
        <div class="info-grid info-grid--3">
          <InfoField v-for="item in familyFields.slice(13, 16)" :key="item.label" :label="item.label"
            :value="currentFamily[item.field]" />
        </div>

        <!-- Notes for Next Contact + Action Buttons -->
        <v-row justify="space-between" align="end" dense>
          <v-col cols="12" md="7">
            <v-textarea class="conv-textarea" label="Notes for next contact" variant="outlined" no-resize rows="6"
              hide-details readonly v-model="currentFamily.NextContactNote"></v-textarea>
          </v-col>
          <v-spacer></v-spacer>

          <v-col cols="12" md="5">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-tooltip location="top">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon @click.stop="editFamily" :disabled="!currentFamily.id">
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                  </template>
                  <span>Edit family information</span>
                </v-tooltip>
              </v-col>

              <v-col cols="12" md="6">
                <v-tooltip location="top">
                  <template v-slot:activator="{ props }">
                    <v-btn color="primary" v-bind="props" icon @click.stop="addFamily">
                      <v-icon>mdi-plus</v-icon>
                    </v-btn>
                  </template>
                  <span>Add a new family</span>
                </v-tooltip>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-col>

      <!-- Family Edit/Add Dialog -->
      <v-dialog v-model="dialog" max-width="1200px" persistent>
        <v-card class="ds-card" variant="flat">
          <v-card-title>
            <span class="text-h6">{{ editedIndex === -1 ? 'Add a new family' : 'Edit family information' }}</span>
            <v-spacer></v-spacer>
            <span class="text-h6">{{ editedIndex === -1 ? '' : 'Family ID: ' + editedItem.id }}</span>
          </v-card-title>
          <v-card-text>
            <v-form ref="form" v-model="valid" lazy-validation>
              <v-row dense style="padding: 8px 8px 4px">
                <v-col md="12" class="subtitle">
                  <v-divider></v-divider>
                  <h4 class="text-left">Family information:</h4>
                </v-col>
                <v-col cols="12" :md="item.width" v-for="item in familyBasicInfo" :key="item.label">
                  <div v-if="item.options">
                    <v-combobox class="textfield-family" v-model="editedItem[item.field]" :items="Options[item.options]"
                      variant="outlined" :label="item.label" density="compact"></v-combobox>
                  </div>
                  <div v-else>
                    <v-text-field class="textfield-family" :label="item.label" v-model="editedItem[item.field]"
                      variant="outlined" hide-details density="compact"></v-text-field>
                  </div>
                </v-col>

                <v-col md="12" class="subtitle">
                  <v-divider></v-divider>
                  <h4 class="text-left">Contact information:</h4>
                </v-col>
                <v-col cols="12" :md="item.width" v-for="item in familyContactInfo" :key="item.label">
                  <v-text-field class="textfield-family" :label="item.label" v-model="editedItem[item.field]"
                    variant="outlined" hide-details density="compact"></v-text-field>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-card-actions style="padding: 16px">
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="dialog = false" variant="text">Cancel</v-btn>
            <v-btn color="primary" @click="save" variant="text">Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- MIDDLE COLUMN: Children -->
      <v-col cols="12" md="4">
        <v-col cols="12" md="12" class="justify-start">
          <div v-if="!searchStatus">
            <h2 class="text-left">Child information</h2>
          </div>
          <div v-else>
            <v-text-field style="height: 48px" hide-details @keydown.enter="searchFamily"
              @update:model-value="getSearchKeys('childName', $event)" label="Child's Name"
              :append-icon="searchStatus ? 'mdi-magnify' : undefined" :readonly="!searchStatus" placeholder=" "
              variant="outlined" density="compact"></v-text-field>
          </div>
        </v-col>
        <v-col style="padding: 0px !important; min-height: 500px">
          <ChildInfo ref="childInfo" :Children="currentFamily.Children"
            :familyId="currentFamily.id ? parseInt(currentFamily.id) : null" :currentFamily="currentFamily"
            @newSchedule="updateFamilyAppointment"></ChildInfo>
        </v-col>
      </v-col>

      <!-- RIGHT COLUMN: Notes & Conversations -->
      <v-col cols="12" md="3">
        <!-- Simplified Notes panel (original used NotesConversation component) -->
        <v-card class="ds-card" variant="flat">
          <v-card-title class="text-subtitle-1">
            <v-icon start>mdi-note-text</v-icon>Notes
          </v-card-title>
          <v-card-text>
            <v-textarea label="Notes about the family" no-resize rows="12" hide-details v-model="familyNotes"
              :disabled="!currentFamily.id" @change="saveNotes" variant="outlined"></v-textarea>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- BOTTOM ROW: Schedule Table -->
    <v-row justify="start" dense
      v-if="currentFamily.id && currentFamily.Schedules && currentFamily.Schedules.length > 0">
      <v-col cols="12" md="12">
        <v-card variant="flat" class="ds-card mt-4">
          <v-card-title class="text-subtitle-1">
            <v-icon start>mdi-calendar</v-icon>Schedule History
          </v-card-title>
          <v-card-text>
            <v-table density="compact">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Appointment Time</th>
                  <th>Status</th>
                  <th>Completed</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="schedule in currentFamily.Schedules" :key="schedule.id">
                  <td>{{ schedule.id }}</td>
                  <td>{{ schedule.AppointmentTime ? formatDate(schedule.AppointmentTime) : 'N/A' }}</td>
                  <td>{{ schedule.Status }}</td>
                  <td>{{ schedule.Completed ? 'Yes' : 'No' }}</td>
                  <td>{{ schedule.updatedAt ? formatDate(schedule.updatedAt) : '' }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
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
import family from "@/services/family";
import store from "@/store";
import moment from "moment-timezone";

export default {
  components: {
    ChildInfo,
    AlertBanner,
    InfoField,
    SectionHeader,
  },
  data() {
    return {
      queryString: {},
      page: 0,
      searchStatus: false,
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
      this.searchStatus = !this.searchStatus;
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
  },

  computed: {
    TodaysDate() {
      return moment().startOf("day").format("YYYY-MM-DD");
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
</style>
