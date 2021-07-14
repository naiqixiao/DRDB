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

    <v-row>
      <v-col cols="12" md="3">
        <v-row>
          <v-col>
            <v-data-table
              hide-default-footer
              disable-pagination
              fixed-header
              height="750"
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
                        :value="!!item.Completed"
                        @input="changeStudyStatus(item)"
                        :disabled="
                          !(
                            currentStudy.PointofContact.id ==
                              $store.state.userID ||
                            $store.state.role == 'Admin' ||
                            $store.state.role == 'PI' ||
                            $store.state.role == 'Lab manager'
                          )
                        "
                        dense
                      ></v-simple-checkbox>
                    </div>
                  </template>
                  <span>Mark whether this study is still on going</span>
                </v-tooltip>
              </template>
            </v-data-table>
          </v-col>
        </v-row>
        <v-row dense justify="end">
          <v-col cols="12" md="3" dense>
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <div v-on="on">
                  <v-btn
                    fab
                    @click.stop="createStudy"
                    :disabled="
                      !(
                        $store.state.role == 'Admin' ||
                        $store.state.role == 'PI' ||
                        $store.state.role == 'PostDoc' ||
                        $store.state.role == 'GradStudent' ||
                        $store.state.role == 'Lab manager'
                      )
                    "
                  >
                    <v-icon class="fabIcon">add</v-icon>
                  </v-btn>
                </div>
              </template>
              <span>Add a new study</span>
            </v-tooltip>
          </v-col>
        </v-row>
      </v-col>

      <v-col cols="12" md="4">
        <v-row>
          <v-col md="12">
            <v-divider></v-divider>
            <h4 class="text-left">Study information:</h4>
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="5"
            v-for="item in this.$studyBasicFields"
            :key="item.label"
          >
            <v-text-field
              class="textfield-family"
              background-color="textbackground"
              hide-details
              :label="item.label"
              v-model="currentStudy[item.field]"
              placeholder="  "
              outlined
              dense
              readonly
            ></v-text-field>
          </v-col>
          <v-col md="6">
            <v-textarea
              label="Study summary"
              background-color="textbackground"
              outlined
              no-resize
              rows="8"
              v-model="currentStudy.Description"
              readonly
              hide-details
            ></v-textarea>
          </v-col>
          <v-col md="6">
            <v-textarea
              label="Phone Script"
              background-color="textbackground"
              outlined
              no-resize
              rows="8"
              v-model="currentStudy.PhoneScript"
              readonly
              hide-details
            ></v-textarea>
          </v-col>
        </v-row>

        <v-row justify="space-around">
          <v-col md="12">
            <v-divider></v-divider>
            <h4 class="text-left">Point of contact:</h4>
          </v-col>
          <v-col
            cols="12"
            sm="4"
            v-for="item in this.$studyPointofContact"
            :key="item.label"
          >
            <v-text-field
              class="textfield-family"
              background-color="textbackground"
              hide-details
              :label="item.label"
              :value="
                item.label === 'Phone'
                  ? PhoneFormated(currentStudy.PointofContact[item.field])
                  : currentStudy.PointofContact[item.field]
              "
              placeholder="  "
              readonly
              outlined
              dense
            ></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <v-col md="12">
            <v-divider></v-divider>
            <h4 class="text-left">Study criteria:</h4>
          </v-col>

          <v-col
            cols="12"
            sm="6"
            :md="item.width"
            v-for="item in this.$studyCriteriaFields"
            :key="item.label"
          >
            <v-text-field
              class="textfield-family"
              background-color="textbackground"
              hide-details
              :label="item.label"
              :value="
                item.field == 'MinAge' || item.field == 'MaxAge'
                  ? AgeFormated2(currentStudy[item.field])
                  : currentStudy[item.field]
              "
              placeholder="  "
              readonly
              outlined
              dense
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row justify="space-around">
          <v-col cols="12" md="3" dense>
            <v-tooltip right>
              <template v-slot:activator="{ on }">
                <div v-on="on">
                  <v-btn
                    fab
                    @click.stop="editStudy"
                    :disabled="
                      !(
                        currentStudy.id &&
                        (currentStudy.PointofContact.id ==
                          $store.state.userID ||
                          $store.state.role == 'Admin' ||
                          $store.state.role == 'PI' ||
                          $store.state.role == 'Lab manager')
                      )
                    "
                  >
                    <v-icon class="fabIcon">edit</v-icon>
                  </v-btn>
                </div>
              </template>
              <span>Edit study information</span>
            </v-tooltip>
          </v-col>
          <v-col cols="12" md="3" dense>
            <v-tooltip right>
              <template v-slot:activator="{ on }">
                <div v-on="on">
                  <v-btn
                    fab
                    @click.stop="deleteStudy"
                    :disabled="
                      !(
                        currentStudy.id &&
                        (currentStudy.PointofContact.id ==
                          $store.state.userID ||
                          $store.state.role == 'Admin' ||
                          $store.state.role == 'PI' ||
                          $store.state.role == 'Lab manager')
                      )
                    "
                  >
                    <v-icon class="fabIcon">delete</v-icon>
                  </v-btn>
                </div>
              </template>
              <span>Delete this study</span>
            </v-tooltip>
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <v-divider></v-divider>

            <h3 class="text-left">Experimenters</h3>

            <AssignedExperimenters
              :Experimenters="currentStudy.Experimenters"
              :labMembers="labMembers"
              :studyId="currentStudy.id"
              :PointofContactId="currentStudy.PointofContact.id"
              @updatedExperimenters="updateExperimenters"
            ></AssignedExperimenters>
          </v-col>
        </v-row>
        <div>
          <v-dialog v-model="dialog" max-width="1000px" :retain-focus="false">
            <v-card>
              <v-card-title>
                <span class="headline">Study information</span>
              </v-card-title>
              
              <v-card-text>
                <v-form ref="form" v-model="valid" lazy-validation>
                  <v-container>
                    <v-row
                      justify="space-around"
                      dense
                      style="padding: 8px 8px 4px"
                    >
                      <v-col md="12">
                        <v-divider></v-divider>
                        <h4 class="text-left">Basic information:</h4>
                      </v-col>

                      <v-col
                        cols="12"
                        sm="6"
                        md="4"
                        v-for="item in this.$studyBasicFields"
                        :key="item.label"
                      >
                        <div v-if="item.options">
                          <v-select
                            justify="start"
                            :items="$Options[item.options]"
                            v-model="editedStudy[item.field]"
                            :label="item.label"
                            class="textfield-family"
                            background-color="textbackground"
                            hide-details
                            placeholder="  "
                            outlined
                            dense
                          ></v-select>
                        </div>
                        <div v-else-if="item.rules">
                          <v-text-field
                            :label="item.label"
                            v-model="editedStudy[item.field]"
                            :rules="$rules[item.rules]"
                            class="textfield-family"
                            background-color="textbackground"
                            hide-details
                            placeholder="  "
                            outlined
                            dense
                          ></v-text-field>
                        </div>
                        <div v-else>
                          <v-text-field
                            :label="item.label"
                            v-model="editedStudy[item.field]"
                            class="textfield-family"
                            background-color="textbackground"
                            hide-details
                            placeholder="  "
                            outlined
                            dense
                          ></v-text-field>
                        </div>
                      </v-col>
                      <v-col cols="12" sm="4">
                        <v-select
                          class="textfield-family"
                          :items="labMembers"
                          :item-value="'id'"
                          :item-text="'Name'"
                          v-model="pointofContact"
                          label="Point of Contact"
                          outlined
                          dense
                          hide-details
                          return-object
                        ></v-select>
                      </v-col>
                    </v-row>

                    <v-row justify="space-around">
                      <v-col md="12">
                        <v-divider></v-divider>
                        <h4 class="text-left">Study criteria:</h4>
                      </v-col>

                      <v-col
                        cols="12"
                        sm="6"
                        :md="item.width"
                        v-for="item in this.$studyCriteriaFields"
                        :key="item.label"
                      >
                        <div v-if="item.options">
                          <v-select
                            justify="start"
                            :items="inclusionOptions"
                            v-model="editedStudy[item.field]"
                            :label="item.label"
                            class="textfield-family"
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
                            class="textfield-family"
                            background-color="textbackground"
                            hide-details
                            :label="
                              item.field == 'MinAge' || item.field == 'MaxAge'
                                ? item.label + ' (months)'
                                : item.label
                            "
                            v-model="editedStudy[item.field]"
                            placeholder="  "
                            outlined
                            dense
                          ></v-text-field>
                        </div>
                      </v-col>
                    </v-row>

                    <v-row justify="space-around">
                      <v-col md="12">
                        <v-divider></v-divider>
                        <h4 class="text-left">
                          'Study summary & Phone script:'
                        </h4>
                      </v-col>

                      <v-col cols="12" md="6">
                        <v-textarea
                          label="Study summary"
                          outlined
                          no-resize
                          rows="6"
                          v-model="editedStudy.Description"
                          hide-details
                        ></v-textarea>
                      </v-col>

                      <v-col cols="12" md="6">
                        <v-textarea
                          label="Phone Script"
                          outlined
                          no-resize
                          rows="6"
                          v-model="editedStudy.PhoneScript"
                          hide-details
                        ></v-textarea>
                      </v-col>
                    </v-row>

                    <v-row justify="space-around">
                      <v-col md="12">
                        <v-divider></v-divider>
                        <h4 class="text-left">Email template:</h4>
                      </v-col>

                      <v-col cols="12" md="10">
                        <vue-editor
                          v-model="editedStudy.EmailTemplate"
                          :editor-toolbar="customToolbar"
                        ></vue-editor>
                      </v-col>
                    </v-row>

                    <v-row justify="space-around">
                      <v-col md="12">
                        <v-divider></v-divider>
                        <h4 class="text-left">Reminder email template:</h4>
                      </v-col>

                      <v-col cols="12" md="10">
                        <vue-editor
                          v-model="editedStudy.ReminderTemplate"
                          :editor-toolbar="customToolbar"
                        ></vue-editor>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-form>
              </v-card-text>

              <v-card-actions style="padding: 16px;">
                <v-row justify="space-between">
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

      <v-col cols="12" md="5">
        <v-col md="12">
          <v-divider></v-divider>
          <h3 class="text-left" v-show="currentStudy.id">
            Schedule confirmation email preview (email template is is in dark
            colour):
          </h3>
        </v-col>
        <body
          v-html="confirmationPreview"
          align="start"
          class="template"
          v-show="currentStudy.id"
          style="height: 350px !important; overflow-y: scroll !important"
        ></body>

        <v-col md="12">
          <v-divider></v-divider>
          <h3 class="text-left" v-show="currentStudy.id">
            Reminder email preview (email template is in dark colour):
          </h3>
        </v-col>
        <body
          v-html="reminderPreview"
          align="start"
          class="template"
          v-show="currentStudy.id"
          style="height: 350px !important; overflow-y: scroll !important"
        ></body>
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
import moment from "moment";

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
          text: "Updated at",
          align: "center",
          value: "updatedAt",
          width: "25%",
        },

        {
          text: "Completed?",
          align: "center",
          value: "Completed",
          sortable: false,
          width: "17%",
        },
      ],
      dialog: false,
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
        PointofContact: {
          Name: null,
          Email: null,
          Phone: null,
        },
      },
      editedStudy: {
        StudyName: null,
        FK_Lab: this.$store.state.lab,
        MinAge: null,
        MaxAge: null,
        Description: "",
        EmailTemplate: "",
        PhoneScript: "",
        ReminderTemplate: "",
        Completed: false,
        StudyType: null,
        PrematureParticipant: "",
        IllParticipant: "",
        VisionLossParticipant: "",
        HearingLossParticipant: "",
        updatedAt: new Date().toISOString(),
        PointofContact: {
          Name: null,
          Email: null,
          Phone: null,
        },
      },
      defaultStudy: {
        StudyName: null,
        FK_Lab: this.$store.state.lab,
        MinAge: null,
        MaxAge: null,
        Description: "",
        EmailTemplate: "",
        PhoneScript: "",
        ReminderTemplate: "",
        Completed: false,
        StudyType: null,
        PrematureParticipant: "",
        IllParticipant: "",
        VisionLossParticipant: "",
        HearingLossParticipant: "",
        updatedAt: new Date().toISOString(),
        PointofContact: {
          Name: null,
          Email: null,
          Phone: null,
        },
      },
      editedIndex: -1,
      labMembers: [],
      valid: true,
      pointofContact: {},
      customToolbar: [
        ["bold", "italic", "underline"],
        [{ color: [] }, { background: [] }],
        ["link"],
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
        // this.labMembers = this.labMembers.filter((member) => {
        //   return member.Role !== "PI";
        // });
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
      // this.currentStudy = item;

      try {
        item.Completed = !item.Completed;
        await study.update(item);
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
      this.editedStudy = Object.assign({}, this.currentStudy);
      this.editedIndex = this.Studies.indexOf(this.currentStudy);
      this.dialog = true;
    },

    createStudy() {
      this.editedStudy = Object.assign({}, this.defaultStudy);
      this.editedIndex = -1;
      this.dialog = true;
    },

    async save() {
      this.editedStudy.FK_Personnel = this.pointofContact.id;

      if (this.editedIndex === -1) {
        try {
          const Result = await study.create(this.editedStudy);
          this.editedStudy.PointofContact = this.pointofContact;
          this.editedStudy.id = Result.data.id;
          this.Studies.push(this.editedStudy);
          this.editedIndex = this.Studies.length - 1;
          this.$store.dispatch("setStudies", this.Studies);
        } catch (error) {
          console.log(error.response);
        }
      } else {
        try {
          await study.update(this.editedStudy);

          this.currentStudy = this.editedStudy;
          Object.assign(this.Studies[this.editedIndex], this.editedStudy);
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

      setTimeout(() => {
        this.pointofContact = {};
        this.editedStudy = {};
        // this.editedIndex = -1;
      }, 300);
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
      this.currentStudy.Experimenters = updatedExperimenters;
    },

    AgeFormated2(Age) {
      var formated = "Not born yet.";
      if (Age > 0) {
        var years = Math.floor(Age / 12);
        var months = Age % 12;
        // months = months.toFixed(1);
        var Y = years >= 0 ? years + " year" : "";
        Y = years > 1 ? Y + "s " : Y + " ";

        var M = "";

        if (months >= 0) {
          M = months + " month";
          M = months !== 1 ? M + "s" : M;
        }

        formated = Y + M;
      }
      return formated;
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

  computed: {
    htmlText() {
      var htmlText = this.currentStudy.EmailTemplate.split("<p>")
        .join("")
        .split("</p>")
        .join("");

      return htmlText;
    },

    confirmationPreview() {
      if (this.currentStudy.EmailTemplate) {
        var opening =
          "<p style= 'color: var(--v-primary-lighten3)'>Dear " +
          "Lisa,</p>" +
          "<p style= 'color: var(--v-primary-lighten3)'>Thanks for your support to our research! This is a confirmation for your participation in our study with " +
          "Emma" +
          moment().format(" [on] dddd [(]MMM Do[)] [at] h:mma") +
          ".</p>";

        var emailBody = this.currentStudy.EmailTemplate;

        emailBody = emailBody.replace(/\${{he\/she}}/g, "she" || "");
        emailBody = emailBody.replace(/\${{his\/her}}/g, "her" || "");
        emailBody = emailBody.replace(/\${{him\/her}}/g, "her" || "");

        // emailBody = emailBody.replace(/\. he/g, ". He");
        // emailBody = emailBody.replace(/\. his/g, ". His");
        emailBody = emailBody.replace(/\. she/g, ". She");
        emailBody = emailBody.replace(/\. her/g, ". Her");

        emailBody = emailBody.replace(/\${{childName}}/g, "Emma" || "");

        emailBody = emailBody.replace(/<p>/g, "<p><strong>" || "");
        emailBody = emailBody.replace(/<\/p>/g, "</strong></p>" || "");

        emailBody = emailBody.replace(
          /\${{ZoomLink}}/g,
          "<a href='" + this.$store.state.ZoomLink + "'>Zoom Link</a>"
        );

        // location
        const location =
          "<p style= 'color: var(--v-primary-lighten3)'>" +
          this.$store.state.transportationInstructions +
          "</p>";
        // closing
        const closing =
          "<p style= 'color: var(--v-primary-lighten3)'>" +
          this.$store.state.emailClosing +
          "</p>" +
          "<p style= 'color: var(--v-primary-lighten3)'>Best,<br>" +
          this.$store.state.name +
          "<br>" +
          this.$store.state.role +
          "<br>" +
          this.$store.state.labName +
          "</p>";

        var email = "";

        switch (this.currentStudy.StudyType) {
          case "Online":
            email =
              opening +
              emailBody +
              "<p style= 'color: var(--v-primary-lighten3)'>This study is an online study. You can participate at home. :)</p>" +
              closing;
            break;

          default:
            email = opening + emailBody + location + closing;

            break;
        }

        return email;
      } else {
        return "<p>Email template hasn't setup yet. No email preview is available.</p>";
      }
    },

    reminderPreview() {
      if (this.currentStudy.ReminderTemplate) {
        var opening = "";

        if (this.currentStudy.StudyType !== "Online") {
          opening =
            "<p style= 'color: var(--v-primary-lighten3)'>Dear " +
            "Lisa,</p>" +
            "<p style= 'color: var(--v-primary-lighten3)'>Hope you are doing great! This is a reminder for your visit to " +
            this.$store.state.labName +
            " with " +
            "Emma" +
            moment().format(" [on] dddd [(]MMM Do[)] [at] h:mma") +
            ".</p>" +
            "<p style= 'color: var(--v-primary-lighten3)'>" +
            this.$store.state.TransportationInstructions +
            "</p>";
        } else {
          opening =
            "<p style= 'color: var(--v-primary-lighten3)'>Dear " +
            "Lisa,</p>" +
            "<p style= 'color: var(--v-primary-lighten3)'>Hope you are doing great! This is " +
            this.$store.state.labName +
            ". Just a reminder that you and " +
            "Emma will participate in our online study " +
            moment().format(" [tomorrow at] h:mma") +
            ".</p>";
        }

        var emailBody = this.currentStudy.ReminderTemplate.replace(
          /\${{ZoomLink}}/g,
          "<a href='" + this.$store.state.ZoomLink + "'>Zoom Link</a>"
        );

        if (this.currentStudy.StudyType === "Online") {
          emailBody =
            emailBody +
            "<p>You can download Zoom for your computer here: <a href='https://zoom.us/download'>Download Link</a></p>" +
            "<p><a href='https://mcmasteru365-my.sharepoint.com/:p:/g/personal/xiaon8_mcmaster_ca/EdhORdZeCwlPn-X54WquFz8Boegr1YpaNy9mzlW_wJ8ZjQ?e=hvDNGr'>CLICK HERE</a> to learn a few tips to setup online study with your child.</p>";
        }

        emailBody = emailBody.replace(/\${{he\/she}}/g, "she" || "");
        emailBody = emailBody.replace(/\${{his\/her}}/g, "her" || "");
        emailBody = emailBody.replace(/\${{him\/her}}/g, "her" || "");

        // emailBody = emailBody.replace(/\. he/g, ". He");
        // emailBody = emailBody.replace(/\. his/g, ". His");
        emailBody = emailBody.replace(/\. she/g, ". She");
        emailBody = emailBody.replace(/\. her/g, ". Her");

        emailBody = emailBody.replace(/\${{childName}}/g, "Emma" || "");

        emailBody = emailBody.replace(/<p>/g, "<p><strong>" || "");
        emailBody = emailBody.replace(/<\/p>/g, "</strong></p>" || "");

        // closing
        const closing =
          "<p style= 'color: var(--v-primary-lighten3)'>" +
          this.$store.state.emailClosing +
          "</p>" +
          "<p style= 'color: var(--v-primary-lighten3)'>Best,<br>" +
          this.$store.state.name +
          "<br>" +
          this.$store.state.role +
          "<br>" +
          this.$store.state.labName +
          "</p>";

        var email = opening + emailBody + closing;

        return email;
      } else {
        return "<p>Email template hasn't setup yet. No email preview is available.</p>";
      }
    },
  },

  mounted: function() {
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
  width: 100%;
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
