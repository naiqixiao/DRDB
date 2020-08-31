<template>
<v-container fluid>
  <div v-if="!$store.state.labEmailStatus">
    <v-alert
      border="left"
      type="error"
      color="#c73460"
      dense
      style="font-weight: 600"
    >Lab email is not been setup properly. Please set it up in the Settings page.</v-alert>
  </div>
  <div v-if="!$store.state.adminEmailStatus">
    <v-alert
      border="left"
      type="warning"
      color="#c7792c"
      dense
      style="font-weight: 600"
    >Admin email is not been setup properly. Please set it up in the Settings page.</v-alert>
  </div>

  <v-row>
    <v-col cols="12" md="4">
      <v-data-table
        hide-default-footer
        disable-pagination
        fixed-header
        height="900"
        single-select
        no-data-text="No study to display."
        :headers="headersStudy"
        :items="Studies"
        @click:row="rowSelected"
        class="elevation-1"
      >
        <template #item.updatedAt="{ value }">
          <DateDisplay :date="value" :format="'short'" />
        </template>

        <template #item.Completed="{ item }">
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <div v-on="on">
                <v-simple-checkbox
                  class="checkbox"
                  v-model="item.Completed"
                  @input="changeStudyStatus(item)"
                  dense
                ></v-simple-checkbox>
              </div>
            </template>
            <span>Mark whether this study is still on going</span>
          </v-tooltip>
        </template>
      </v-data-table>
    </v-col>

    <v-col cols="12" md="5">
      <!-- <v-form ref="form" v-model="valid" lazy-validation> -->
      <v-row>
        <v-col md="12" class="subtitle">
          <v-divider></v-divider>
          <h4 class="text-left">Study information:</h4>
        </v-col>
        <v-col cols="12" sm="6" md="5" v-for="field in this.$studyBasicFields" :key="field.label">
          <v-text-field
            height="48px"
            background-color="textbackground"
            hide-details
            :label="field.label"
            v-model="currentStudy[field.field]"
            placeholder="  "
            outlined
            dense
            readonly
          ></v-text-field>
        </v-col>
        <v-col md="12" class="subtitle">
          <v-textarea
            label="Study summary"
            outlined
            no-resize
            rows="3"
            v-model="currentStudy.Description"
            readonly
          ></v-textarea>
        </v-col>
      </v-row>

      <v-row>
        <v-col md="12" class="subtitle">
          <v-divider></v-divider>
          <h4 class="text-left">Study criteria:</h4>
        </v-col>

        <v-col
          cols="12"
          sm="6"
          :md="field.width"
          v-for="field in this.$studyCriteriaFields"
          :key="field.label"
        >
          <v-text-field
            height="48px"
            background-color="textbackground"
            hide-details
            :label="field.label"
            :value="field.label == 'MinAge' || field.label == 'MaxAge' ? AgeFormated2(currentStudy[field.field]): currentStudy[field.field]"
            placeholder="  "
            readonly
            outlined
            dense
          ></v-text-field>
        </v-col>

        <v-col md="12" class="subtitle">
          <v-divider></v-divider>
          <h4 class="text-left" v-show="currentStudy.id">Email template:</h4>
        </v-col>
        <body
          v-html="currentStudy.EmailTemplate"
          align="start"
          class="template"
          v-show="currentStudy.id"
        ></body>

        <v-col cols="12" md="2" dense>
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <div v-on="on">
                <v-btn fab @click.stop="createStudy">
                  <v-icon class="fabIcon">add</v-icon>
                </v-btn>
              </div>
            </template>
            <span>Add a new study</span>
          </v-tooltip>
        </v-col>
        <v-col cols="12" md="2" dense>
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <div v-on="on">
                <v-btn fab @click.stop="editStudy" :disabled="!currentStudy.id">
                  <v-icon class="fabIcon">edit</v-icon>
                </v-btn>
              </div>
            </template>
            <span>Edit study information</span>
          </v-tooltip>
        </v-col>
        <v-col cols="12" md="2" dense>
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <div v-on="on">
                <v-btn fab @click.stop="deleteStudy" :disabled="!currentStudy.id">
                  <v-icon class="fabIcon">delete</v-icon>
                </v-btn>
              </div>
            </template>
            <span>Delete this study</span>
          </v-tooltip>
        </v-col>
      </v-row>

      <div>
        <v-dialog v-model="dialog" max-width="1000px" :retain-focus="false">
          <v-card>
            <v-card-title>
              <span class="headline">Study information</span>
            </v-card-title>

            <v-form ref="form" v-model="valid" lazy-validation>
              <v-container>
                <v-row justify="space-around">
                  <v-col md="12" class="subtitle">
                    <v-divider></v-divider>
                    <h4 class="text-left">Basic information:</h4>
                  </v-col>

                  <v-col
                    cols="12"
                    sm="6"
                    md="4"
                    v-for="field in this.$studyBasicFields"
                    :key="field.label"
                  >
                    <div v-if="field.options">
                      <v-select
                        justify="start"
                        :items="options[field.options]"
                        v-model="editedStudy[field.field]"
                        :label="field.label"
                        height="48px"
                        background-color="textbackground"
                        hide-details
                        placeholder="  "
                        outlined
                        dense
                        chip
                      ></v-select>
                    </div>
                    <div v-else-if="field.rules">
                      <v-text-field
                        :label="field.label"
                        v-model="editedStudy[field.field]"
                        :rules="$rules[field.rules]"
                        height="48px"
                        background-color="textbackground"
                        hide-details
                        placeholder="  "
                        outlined
                        dense
                      ></v-text-field>
                    </div>
                    <div v-else>
                      <v-text-field
                        :label="field.label"
                        v-model="editedStudy[field.field]"
                        height="48px"
                        background-color="textbackground"
                        hide-details
                        placeholder="  "
                        outlined
                        dense
                      ></v-text-field>
                    </div>
                  </v-col>
                </v-row>

                <v-row justify="space-around">
                  <v-col md="12" class="subtitle">
                    <v-divider></v-divider>
                    <h4 class="text-left">Study criteria:</h4>
                  </v-col>

                  <v-col
                    cols="12"
                    sm="6"
                    :md="field.width"
                    v-for="field in this.$studyCriteriaFields"
                    :key="field.label"
                  >
                    <div v-if="field.options">
                      <v-select
                        justify="start"
                        :items="inclusionOptions"
                        v-model="editedStudy[field.field]"
                        :label="field.label"
                        height="48px"
                        background-color="textbackground"
                        hide-details
                        placeholder="  "
                        outlined
                        dense
                        chip
                      ></v-select>
                    </div>
                    <div v-else>
                      <v-text-field
                        height="48px"
                        background-color="textbackground"
                        hide-details
                        :label="field.label"
                        v-model="editedStudy[field.field]"
                        placeholder="  "
                        outlined
                        dense
                      ></v-text-field>
                    </div>
                  </v-col>
                </v-row>

                <v-row justify="space-around">
                  <v-col md="12" class="subtitle">
                    <v-divider></v-divider>
                    <h4 class="text-left">Study summary:</h4>
                  </v-col>

                  <v-col cols="12" md="10">
                    <v-textarea
                      label="Study summary"
                      outlined
                      no-resize
                      rows="3"
                      v-model="editedStudy.Description"
                      hide-details
                    ></v-textarea>
                  </v-col>
                </v-row>

                <v-row justify="space-around">
                  <v-col md="12" class="subtitle">
                    <v-divider></v-divider>
                    <h4 class="text-left">Email template:</h4>
                  </v-col>

                  <v-col cols="12" md="10">
                    <vue-editor v-model="editedStudy.EmailTemplate" :editor-toolbar="customToolbar"></vue-editor>
                  </v-col>
                </v-row>
              </v-container>
            </v-form>

            <v-card-actions>
              <v-row justify="space-between" style="height: 50px">
                <v-col md="4"></v-col>
                <v-col md="2">
                  <v-btn color="primary" @click="close">Cancel</v-btn>
                </v-col>
                <v-col md="2">
                  <v-btn color="primary" @click="save">Save</v-btn>
                </v-col>
                <v-col md="4"></v-col>
              </v-row>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </div>
      <!-- </v-form> -->
    </v-col>

    <v-col cols="12" md="3">
      <h3>Experimenters</h3>

      <AssignedExperimenters
        :Experimenters="currentStudy.Personnels"
        :labMembers="labMembers"
        :studyId="currentStudy.id"
        @updatedExperimenters="updateExperimenters"
      ></AssignedExperimenters>
    </v-col>
  </v-row>
</v-container>
</template>

<script>
import DateDisplay from "@/components/DateDisplay";
import AssignedExperimenters from "@/components/AssignedExperimenters";

import study from "@/services/study";
import personnel from "@/services/personnel";

import { VueEditor } from "vue2-editor";

export default {
  components: {
    DateDisplay,
    AssignedExperimenters,
    VueEditor,
  },
  data() {
    return {
      headersStudy: [
        {
          text: "Study Name",
          sortable: false,
          align: "center",
          value: "StudyName",
          width: "35%",
        },
        {
          text: "Type",
          align: "center",
          value: "StudyType",
          width: "23%",
        },
        {
          text: "Updated time",
          align: "center",
          value: "updatedAt",
          width: "25%",
        },

        {
          text: "Compled?",
          align: "center",
          value: "Completed",
          sortable: false,
          width: "17%",
        },
      ],
      dialog: false,

      options: {
        studyType: ["Behavioural", "EEG/ERP", "EyeTracking", "fNIRS"],
      },

      Studies: [],
      currentStudy: {
        StudyName: null,
        FK_Lab: this.$store.state.lab,
        MinAge: null,
        MaxAge: null,
        Description: "",
        EmailTemplate: "",
        Completed: false,
        StudyType: null,
        PrematureParticipant: "",
        IllParticipant: "",
        VisionLossParticipant: "",
        HearingLossParticipant: "",
        updatedAt: new Date().toISOString(),
      },
      editedStudy: {
        StudyName: null,
        FK_Lab: this.$store.state.lab,
        MinAge: null,
        MaxAge: null,
        Description: "",
        EmailTemplate: "",
        Completed: false,
        StudyType: null,
        PrematureParticipant: "",
        IllParticipant: "",
        VisionLossParticipant: "",
        HearingLossParticipant: "",
        updatedAt: new Date().toISOString(),
      },
      defaultStudy: {
        StudyName: null,
        FK_Lab: this.$store.state.lab,
        MinAge: null,
        MaxAge: null,
        Description: "",
        EmailTemplate: "",
        Completed: false,
        StudyType: null,
        PrematureParticipant: "",
        IllParticipant: "",
        VisionLossParticipant: "",
        HearingLossParticipant: "",
        updatedAt: new Date().toISOString(),
      },
      editedIndex: -1,
      labMembers: [],
      valid: true,
      customToolbar: [
        ["bold", "italic", "underline"],
        [{ color: [] }, { background: [] }],
      ],
      inclusionOptions: ["Include", "Exclude", "Only"],
    };
  },

  methods: {
    async searchStudies() {
      var queryString = {
        FK_Lab: this.$store.state.lab,
      };

      try {
        const Result = await study.search(queryString);

        this.Studies = Result.data;

        if (this.Studies.length > 0) {
          this.editedIndex = this.editedIndex === -1 ? 0 : this.editedIndex;
          this.currentStudy = this.Studies[this.editedIndex];
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

    async searchLabMembers() {
      var queryString = {
        FK_Lab: this.$store.state.lab,
        Active: 1,
      };

      try {
        const Result = await personnel.search(queryString);

        this.labMembers = Result.data;

        //  exclude PIs
        this.labMembers = this.labMembers.filter((member) => {
          return member.Role !== "PI";
        });
      } catch (error) {
        if (error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login",
          });
        }
      }
    },

    async changeStudyStatus(item) {
      this.currentStudy = item;

      try {
        await study.update(this.currentStudy);
      } catch (error) {
        if (error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login",
          });
        }
      }
    },

    rowSelected(item, row) {
      row.select(true);
      this.currentStudy = item;
      this.editedIndex = this.Studies.indexOf(this.currentStudy);
    },

    editStudy() {
      this.editedStudy = this.currentStudy;
      this.editedIndex = this.Studies.indexOf(this.currentStudy);
      this.dialog = true;
    },

    createStudy() {
      this.editedStudy = Object.assign({}, this.defaultStudy);
      this.editedIndex = -1;
      this.dialog = true;
    },

    async save() {
      if (this.editedIndex < 0) {
        try {
          const Result = await study.create(this.editedStudy);
          this.editedStudy.id = Result.data.id;
          this.Studies.push(this.editedStudy);
          // this.editedIndex = (this.Studies.length - 1);
          this.$store.dispatch("setStudies", this.Studies);
        } catch (error) {
          console.log(error.response);
        }
      } else {
        try {
          const Result = await study.update(this.editedStudy);

          this.currentStudy = Result.data;
          Object.assign(this.Studies[this.editedIndex], Result.data);
          this.$store.dispatch("setStudies", this.Studies);
        } catch (error) {
          if (error.response.status === 401) {
            alert("Authentication failed, please login.");
            this.$router.push({
              name: "Login",
            });
          }
        }
      }

      this.close();
    },

    close() {
      this.dialog = false;

      // setTimeout(() => {
      //   // this.editedStudy = [];
      //   // this.editedIndex = -1;
      // }, 300);
    },

    async deleteStudy() {
      var studyInfo = {
        id: this.currentStudy.id,
      };

      try {
        await study.delete(studyInfo);
        var index = this.Studies.indexOf(this.currentStudy);
        this.Studies.splice(index, 1);
        this.$store.dispatch("setStudies", this.Studies);
        this.currentStudy = Object.assign({}, this.defaultStudy);
      } catch (error) {
        console.log(error.response);
      }
    },

    updateExperimenters(updatedExperimenters) {
      this.currentStudy.Personnels = updatedExperimenters;
    },

    AgeFormated2(Age) {
      var formated = "";
      if (Age) {
        var years = Math.floor(Age / 12);
        var months = Age % 12;
        // months = months.toFixed(1);
        var Y = years > 0 ? years + " y " : "";
        var M = months + " m";
        formated = Y + M;
      }
      return formated;
    },
  },

  computed: {
    htmlText() {
      var htmlText = this.currentStudy.EmailTemplate.split("<p>")
        .join("")
        .split("</p>")
        .join("");

      return htmlText;
    },
  },

  mounted: function () {
    this.searchStudies();
    this.searchLabMembers();
  },
};
</script>

<style lang="css" scoped>
body {
  border: 2px solid rgb(0, 153, 255);
  border-radius: 5px;
}

.complete {
  align-items: flex-end !important;
}

/* .theme--light.v-data-table /deep/ thead /deep/ tr th:hover {
  color: var(--v-secondary-base) !important;
} */

/* .v-data-table
  /deep/
  tbody
  /deep/
  tr:hover:not(.v-data-table__expanded__content) {
  background-color: var(--v-secondary-lighten1) !important;
} */

/deep/ tr.v-data-table__selected {
  /* color: var(--v-secondary-lighten1) !important; */
  /* margin: 2px !important;
  border-style: double   !important; */
  background-color: var(--v-secondary-lighten1) !important;
}

.template {
  background-color: var(--v-textbackground-base);
  border-color: var(--v-primary-base);
  margin: 8px 8px 8px 8px;
  padding: 8px 8px 8px 8px;
  border-width: 1px;
}

.theme--light.v-icon {
  color: var(--v-primary-base);
  font-size: 28px;
  padding-left: 2px;
  padding-right: 2px;
}

.fabIcon {
  color: var(--v-secondary-base) !important;
}
</style>
