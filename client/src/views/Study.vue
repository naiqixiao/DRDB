<template>
  <v-container fluid>
    <div v-if="!$store.state.labEmailStatus">
      <v-alert border="left" type="error" color="#c73460" dense style="font-weight: 600">Lab email is not been setup
        properly. Please set it up in the Settings
        page.</v-alert>
    </div>
    <div v-if="!$store.state.adminEmailStatus">
      <v-alert border="left" type="warning" color="#c7792c" dense style="font-weight: 600">Admin email is not been setup
        properly. Please set it up in the
        Settings page.</v-alert>
    </div>
    <div v-if="$store.state.trainingMode">
      <v-alert border="left" type="warning" color="#c7792c" dense style="font-weight: 600">You are running in a training
        mode.</v-alert>
    </div>

    <ConfirmDlg ref="confirmD" />

    <v-row>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>
            <v-text-field v-model="search" label="Search by Study Name" class="mx-4" single-line
              hide-details></v-text-field>
            <v-spacer></v-spacer>
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <div v-on="on">
                  <v-checkbox v-model="inProgressStudyFilter" label="In progress" hide-details></v-checkbox>
                </div>
              </template>
              <span>Show on-going studies</span></v-tooltip>
          </v-card-title>
          <v-data-table fixed-header height="600" single-select no-data-text="No study to display."
            :headers="headersStudy" :items="Studies" :search="search" :custom-filter="filterByText"
            @click:row="rowSelected" class="elevation-1">
            <template #item.updatedAt="{ value }">
              <DateDisplay :date="value" :format="'short'" />
            </template>

            <template #item.Completed="{ item }">
              <v-tooltip top>
                <template v-slot:activator="{ on }">
                  <div v-on="on">
                    <v-simple-checkbox class="checkbox" :value="!!item.Completed" @input="changeStudyStatus(item)"
                      :disabled="!(
                        currentStudy.PointofContact.id ==
                        $store.state.userID ||
                        $store.state.role == 'Admin' ||
                        $store.state.role == 'PI' ||
                        $store.state.role == 'Lab manager'
                      )
                        " dense></v-simple-checkbox>
                  </div>
                </template>
                <span>Mark whether this study is still on going</span>
              </v-tooltip>
            </template>
          </v-data-table>
        </v-card>
        <v-row dense justify="end">
          <v-col cols="12" md="3" dense>
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <div v-on="on">
                  <v-btn fab @click.stop="createStudy" :disabled="!(
                    $store.state.role == 'Admin' ||
                    $store.state.role == 'PI' ||
                    $store.state.role == 'PostDoc' ||
                    $store.state.role == 'GradStudent' ||
                    $store.state.role == 'Lab manager'
                  )
                    ">
                    <v-icon class="fabIcon">add</v-icon>
                  </v-btn>
                </div>
              </template>
              <span>Add a new study</span>
            </v-tooltip>
          </v-col>
        </v-row>
      </v-col>

      <v-col cols="12" md="8">
        <v-row>
          <v-col md="12">
            <v-divider></v-divider>
            <h2 class="text-left" style="margin-right: 0px;">Study information:</h2>
          </v-col>
          <v-col cols="12" sm="6" md="5" v-for="item in this.$studyBasicFields" :key="item.label">
            <v-text-field class="textfield-family" background-color="textbackground" hide-details :label="item.label"
              v-model="currentStudy[item.field]" placeholder="  " outlined dense readonly></v-text-field>
          </v-col>
          <v-col md="6">
            <v-textarea label="Study summary" background-color="textbackground" outlined no-resize rows="8"
              v-model="currentStudy.Description" readonly hide-details></v-textarea>
          </v-col>
          <v-col md="6">
            <v-textarea label="Phone Script" background-color="textbackground" outlined no-resize rows="8"
              v-model="currentStudy.PhoneScript" readonly hide-details></v-textarea>
          </v-col>
        </v-row>

        <v-row justify="space-around">
          <v-col md="12">
            <v-divider></v-divider>
            <h2 class="text-left" style="margin-right: 0px;">Point of contact:</h2>
          </v-col>
          <v-col cols="12" sm="4" v-for="item in this.$studyPointofContact" :key="item.label">
            <v-text-field class="textfield-family" background-color="textbackground" hide-details :label="item.label"
              :value="item.label === 'Phone'
                ? PhoneFormated(currentStudy.PointofContact[item.field])
                : currentStudy.PointofContact[item.field]
                " placeholder="  " readonly outlined dense></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <v-col md="12">
            <v-divider></v-divider>
            <h2 class="text-left" style="margin-right: 0px;">Recruitment criteria:</h2>
          </v-col>

          <v-col cols="12" sm="6" :md="item.width" v-for="item in this.$studyCriteriaFields" :key="item.label">
            <v-text-field class="textfield-family" background-color="textbackground" hide-details :label="item.label"
              :value="item.field == 'MinAge' || item.field == 'MaxAge'
                ? AgeFormated2(currentStudy[item.field])
                : currentStudy[item.field]
                " placeholder="  " readonly outlined dense></v-text-field>
          </v-col>
        </v-row>
        <v-row justify="space-between" align="center">
          <v-col md="12" class="subtitle" justify="start" v-if="currentStudy.FK_TestingRoom">
            <v-divider></v-divider>
            <h2 justify="start" class="text-left" style="margin-right: 0px;">Testing room:</h2>
          </v-col>
          <v-col md="12" class="subtitle" v-else>
            <h3 justify="start" style="color: red">Testing room has not been assigned to this study.</h3>
          </v-col>

          <v-col md="4" height="100px">
            <v-select filled dense outlined :items='currentTestingRooms' v-model="selectedRoomId" :item-value="'id'"
              :item-text="item => `${item.name} =>> ${item.location}`" @change="optionChangedTestingRoom"
              hide-details></v-select>
          </v-col>

          <v-col md="4" height="100px">
            <v-btn @click.stop="dialogStudyProgress = true" :disabled="!(
              $store.state.role == 'Admin' ||
              $store.state.role == 'PI' ||
              $store.state.role == 'PostDoc' ||
              $store.state.role == 'GradStudent' ||
              $store.state.role == 'Lab manager'
            )">Study progress </v-btn>

            <div>
              <v-dialog fullscreen hide-overlay transition="dialog-bottom-transition" v-model="dialogStudyProgress"
                :retain-focus="false">
                <v-card outlined>
                  <v-toolbar dark color="primary">
                    <v-btn icon dark @click="dialogStudyProgress = false">
                      <v-icon class="fabIcon">mdi-close</v-icon>
                    </v-btn>
                    <h2 class="title-text title-p-4 ma-2">Study progress</h2>
                    <v-spacer></v-spacer>
                  </v-toolbar>

                  <v-card-text style="padding-top: 36px">
                    <v-row>
                      <v-col md="4" class="subtitle" justify="start">
                        <v-divider></v-divider>
                        <h2 justify="start" class="text-left" style="margin-right: 0px;">Study progress</h2>
                        <v-col cols="12" lg="12">
                          <div>
                            <studyProgressChart :stats="this.studyStats.totalNperStatus"></studyProgressChart>
                          </div>
                        </v-col>
                      </v-col>

                      <v-col col="8">
                        <v-divider></v-divider>
                        <h2 justify="start" class="text-left" style="margin-right: 0px;">Recruitment by researcher</h2>
                        <v-col cols="12" lg="12">
                          <div>
                            <recruitmentProgressChart :stats="this.studyStats.totalNperPersonnelStatus">
                            </recruitmentProgressChart>
                          </div>
                        </v-col>
                      </v-col>
                    </v-row>

                    <v-row>
                      <v-col md="4" class="subtitle">
                        <v-divider></v-divider>
                        <h2 class="text-left" style="margin-right: 0px;">Experimenter stats</h2>
                        <v-row class="align-start">
                          <v-col>
                            <experimenterStatsChart
                              :stats="[...this.studyStats.totalNperPersonnelPriExp, ...this.studyStats.totalNperPersonnelAssistExp]">
                            </experimenterStatsChart>
                          </v-col>
                        </v-row>
                      </v-col>
                    </v-row>

                    <v-row>
                      <v-col md="8" class="subtitle">
                        <v-divider></v-divider>
                        <h2 class="text-left" style="margin-right: 0px;">Study history</h2>
                        <v-row class="align-start">
                          <v-col>
                            <studyHistoryChart
                              :stats="this.studyStats.totalNWeeklyRecrtuiment">
                            </studyHistoryChart>
                          </v-col>
                        </v-row>
                      </v-col>
                    </v-row>


                  </v-card-text>
                </v-card>
              </v-dialog>
            </div>
          </v-col>

        </v-row>

        <v-divider style=" margin: 12px 12px; flex: 0 0 100%;"></v-divider>
        <v-row justify="space-between">
          <v-col cols="12" md="2" dense>
            <v-tooltip right>
              <template v-slot:activator="{ on }">
                <div v-on="on">
                  <v-btn @click.stop="editStudy" :disabled="!(
                    currentStudy.id &&
                    (currentStudy.PointofContact.id ==
                      $store.state.userID ||
                      $store.state.role == 'Admin' ||
                      $store.state.role == 'PI' ||
                      $store.state.role == 'Lab manager')
                  )
                    ">
                    <v-icon left class="fabIcon">edit</v-icon>
                    Edit study info
                  </v-btn>
                </div>
              </template>
              <span>Edit study information</span>
            </v-tooltip>
          </v-col>
          <v-col cols="12" md="2" dense>
            <v-tooltip right>
              <template v-slot:activator="{ on }">
                <div v-on="on">
                  <v-btn @click.stop="dialogShowEmailPreviews = true" :disabled="!currentStudy.id">
                    <v-icon left class="fabIcon">drafts</v-icon>Preview email templates
                  </v-btn>
                </div>
              </template>
              <span>Preview emails</span>
            </v-tooltip>
          </v-col>
          <v-col cols="12" md="2" dense>
            <v-tooltip right>
              <template v-slot:activator="{ on }">
                <div v-on="on">
                  <v-btn @click.stop="deleteStudy" :disabled="!(
                    currentStudy.id &&
                    (currentStudy.PointofContact.id ==
                      $store.state.userID ||
                      $store.state.role == 'Admin' ||
                      $store.state.role == 'PI' ||
                      $store.state.role == 'Lab manager')
                  )
                    ">
                    <v-icon left class="fabIcon">delete</v-icon>Delete
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

            <h2 class="text-left" style="margin-right: 0px;">Experimenters:</h2>

            <AssignedExperimenters :Experimenters="currentStudy.Experimenters" :labMembers="labMembers"
              :studyId="currentStudy.id" :PointofContactId="currentStudy.PointofContact.id"
              @updatedExperimenters="updateExperimenters"></AssignedExperimenters>
          </v-col>
        </v-row>
        <div>
          <v-dialog fullscreen hide-overlay transition="dialog-bottom-transition" v-model="dialog"
            :retain-focus="false">
            <v-card outlined class="card">
              <v-card-title>
                <span class="headline">Study information</span>
              </v-card-title>

              <v-card-text style="margin-bottom: 16px">
                <v-form ref="form" v-model="valid" lazy-validation>
                  <v-row justify="start" style="padding: 8px">
                    <v-col md="12">
                      <v-divider></v-divider>
                      <h2 class="text-left" style="margin-right: 0px;">Basic information:</h2>
                    </v-col>
                    <v-col cols="12" sm="3" md="2" v-for="item in this.$studyBasicFields" :key="item.label">
                      <div v-if="item.options">
                        <v-select justify="start" :items="$Options[item.options]" v-model="editedStudy[item.field]"
                          :label="item.label" class="textfield-family" background-color="textbackground" hide-details
                          placeholder="  " outlined dense></v-select>
                      </div>
                      <div v-else-if="item.rules">
                        <v-text-field :label="item.label" v-model="editedStudy[item.field]" :rules="$rules[item.rules]"
                          class="textfield-family" background-color="textbackground" hide-details placeholder="  "
                          outlined dense></v-text-field>
                      </div>
                      <div v-else>
                        <v-text-field :label="item.label" v-model="editedStudy[item.field]" class="textfield-family"
                          background-color="textbackground" hide-details placeholder="  " outlined dense></v-text-field>
                      </div>
                    </v-col>
                    <v-col cols="12" sm="3">
                      <v-select class="textfield-family" :items="labMembers" :item-value="'id'" :item-text="'Name'"
                        v-model="PointofContact" label="Point of Contact" outlined dense hide-details
                        return-object></v-select>
                    </v-col>
                  </v-row>

                  <v-row justify="start" style="padding: 8px">
                    <v-col md="12">
                      <v-divider></v-divider>
                      <h2 class="text-left" style="margin-right: 0px;">Recruitment criteria:</h2>
                    </v-col>

                    <v-col cols="12" sm="2" md="2" v-for="item in this.$studyCriteriaFields" :key="item.label">
                      <div v-if="item.options">
                        <v-select justify="start" :items="inclusionOptions" v-model="editedStudy[item.field]"
                          :label="item.label" class="textfield-family" background-color="textbackground" hide-details
                          placeholder="  " outlined dense chip></v-select>
                      </div>
                      <div v-else>
                        <v-text-field class="textfield-family" background-color="textbackground" hide-details :label="item.field == 'MinAge' || item.field == 'MaxAge'
                          ? item.label + ' (months)'
                          : item.label
                          " v-model="editedStudy[item.field]" placeholder="  " outlined dense></v-text-field>
                      </div>
                    </v-col>
                  </v-row>

                  <!-- <v-row>
                    <v-col md="12" class="subtitle">
                      <v-divider></v-divider>
                      <h2 class="text-left" style="margin-right: 0px;">Testing room:</h2>
                    </v-col>

                    <v-row class="testing-room--container" v-if="currentTestingRooms.length > 0">
                      <v-col v-for="room in currentTestingRooms" :key="room.id" cols="12" sm="2" md="3">
                        <v-card :class="{ 'testing-room-card': true, 'selected-card': isSelected(room.id) }"
                          @click="selectRoom(room.id)">
                          <v-card-title class="testing-room--title">{{ room.name }}</v-card-title>
                          <v-card-text class="testing-room--text">Location: {{ room.location }}</v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>
                    <div>
                    </div>
                  </v-row> -->

                  <v-row justify="space-around" style="padding: 8px">
                    <v-col md="12">
                      <v-divider></v-divider>
                      <h2 class="text-left" style="margin-right: 0px;">Study summary & Phone script:</h2>

                    </v-col>

                    <v-col cols="12" md="6">
                      <v-textarea label="Study summary" outlined no-resize rows="6" v-model="editedStudy.Description"
                        hide-details></v-textarea>
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-textarea label="Phone Script" outlined no-resize rows="6" v-model="editedStudy.PhoneScript"
                        hide-details></v-textarea>
                    </v-col>
                  </v-row>

                  <v-row justify="start" style="padding: 8px" height="600px">
                    <v-col md="12">

                      <v-divider style="margin-bottom: 20px"></v-divider>
                      <h2 class="text-left" style="margin-right: 0px;">Email Snippets:</h2>
                      <p class="text-left">
                        You can follow this
                        <a href="https://drdb.readthedocs.io/en/latest/Email%20Template.html"
                          target="_blank"><b>instruction</b></a>
                        to set up email snippets for your study.
                      </p>
                    </v-col>

                    <v-tabs vertical v-mode=tab fixed-tabs color="var(--v-secondary-base)"
                      background-color="var(--v-primary-base)" dark height="200px">
                      <v-tab>
                        Study Info
                      </v-tab>
                      <v-tab>
                        Reminder Email
                      </v-tab>
                      <v-tab>
                        Follow-up Email
                      </v-tab>

                      <v-tab-item style="margin: 12px">
                        <h2 class="text-left" style="margin-right: 0px;">Email template:</h2>
                        <div>
                          <ckeditor :editor="editor" v-model="editedStudy.EmailTemplate" :config="editorConfig">
                          </ckeditor>
                        </div>
                        <!-- <vue-editor v-model="editedStudy.EmailTemplate" :editor-toolbar="customToolbar" height="480px"></vue-editor> -->
                      </v-tab-item>

                      <v-tab-item style="margin: 12px">
                        <h2 class="text-left" style="margin-right: 0px;">Email template:</h2>
                        <div>
                          <ckeditor :editor="editor" v-model="editedStudy.ReminderTemplate" :config="editorConfig">
                          </ckeditor>
                        </div>
                        <!-- <vue-editor v-model="editedStudy.ReminderTemplate" :editor-toolbar="customToolbar"></vue-editor> -->
                      </v-tab-item>

                      <v-tab-item style="margin: 12px">
                        <h2 class="text-left" style="margin-right: 0px;">Follow up email snippet:</h2>
                        <div>
                          <ckeditor :editor="editor" v-model="editedStudy.FollowUPEmailSnippet" :config="editorConfig">
                          </ckeditor>
                        </div>
                        <!-- <vue-editor v-model="editedStudy.FollowUPEmailSnippet"
                          :editor-toolbar="customToolbar"></vue-editor> -->
                      </v-tab-item>
                    </v-tabs>

                  </v-row>
                </v-form>
              </v-card-text>

              <v-card-actions style="padding: 16px; justify-self: end">
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

        <div>
          <v-dialog fullscreen hide-overlay transition="dialog-bottom-transition" v-model="dialogShowEmailPreviews"
            :retain-focus="false">
            <v-card outlined>
              <v-toolbar dark color="primary">
                <v-btn icon dark @click="dialogShowEmailPreviews = false">
                  <v-icon class="fabIcon">mdi-close</v-icon>
                </v-btn>
                <h2 class="title-text title-p-4 ma-2">Study email previews</h2>
                <v-spacer></v-spacer>
              </v-toolbar>

              <v-card-text>
                <!-- <v-col cols="12" md="5" style="overflow-y: scroll !important"> -->
                <v-col md="12">
                  <v-divider></v-divider>
                  <h3 class="text-left" v-show="currentStudy.id">
                    Schedule confirmation email preview (email template is is in
                    dark colour):
                  </h3>
                </v-col>

                <body v-html="confirmationPreview" align="start" class="template" v-show="currentStudy.id" style="
                    height: 350px !important;
                    overflow-y: scroll !important;
                  "></body>

                <v-col md="12">
                  <v-divider></v-divider>
                  <h3 class="text-left" v-show="currentStudy.id">
                    Reminder email preview (email template is in dark colour):
                  </h3>
                </v-col>

                <body v-html="reminderPreview" align="start" class="template" v-show="currentStudy.id" style="
                    height: 350px !important;
                    overflow-y: scroll !important;
                  "></body>

                <v-col md="12">
                  <v-divider></v-divider>
                  <h3 class="text-left" v-show="currentStudy.id">
                    Follow-up email preview (email template is in dark colour):
                  </h3>
                </v-col>

                <body v-html="followupPreview" align="start" class="template" v-show="currentStudy.id" style="
                    height: 350px !important;
                    overflow-y: scroll !important;
                  "></body>
              </v-card-text>
            </v-card>
          </v-dialog>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import DateDisplay from "@/components/DateDisplay";
import AssignedExperimenters from "@/components/AssignedExperimenters";

import ConfirmDlg from "@/components/ConfirmDialog";

import study from "@/services/study";
import personnel from "@/services/personnel";
import testingRoom from "@/services/testingRoom";

// import { VueEditor } from "vue2-editor";
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import moment from "moment";

import studyProgressChart from '@/components/studyProgressChart.vue';
import recruitmentProgressChart from '@/components/recruitmentProgressChart.vue';
import experimenterStatsChart from '@/components/experimenterStatsChart.vue';
import studyHistoryChart from '@/components/studyHistoryChart.vue';

export default {
  components: {
    DateDisplay,
    AssignedExperimenters,
    // VueEditor,
    ConfirmDlg,
    studyProgressChart,
    recruitmentProgressChart,
    experimenterStatsChart,
    studyHistoryChart
  },
  data() {
    return {
      editor: ClassicEditor,
      editorData: '<p>Content of the editor.</p>',
      editorConfig: {
        toolbar: {
          items: [
            'undo', 'redo',
            '|', 'heading',
            '|', 'bold', 'italic',
            '|', 'link', 'insertImage', 'insertTable', 'mediaEmbed', 'blockQuote',
            '|', 'bulletedList', 'numberedList', 'outdent', 'indent'
          ]
        }
      },
      tab: null,
      headersStudy: [
        {
          text: "Study Name",
          sortable: false,
          align: "center",
          value: "StudyName",
          width: "60%",
        },
        // {
        //   text: "Type",
        //   align: "center",
        //   value: "StudyType",
        //   width: "23%",
        // },
        // {
        //   text: "Updated at",
        //   align: "center",
        //   value: "updatedAt",
        //   width: "25%",
        // },

        {
          text: "Completed?",
          align: "center",
          value: "Completed",
          sortable: false,
          width: "20%",
          filter: (value) => {
            if (this.inProgressStudyFilter) {
              return value != this.inProgressStudyFilter;
            } else {
              return true;
            }
          },
        },
      ],
      dialog: false,
      dialogShowEmailPreviews: false,
      studyStats: {
        totalNperStatus: [],
        totalNperPersonnelStatus: [],
        totalNperPersonnelPriExp: [],
        totalNperPersonnelAssistExp: []
      },
      dialogStudyProgress: false,
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
        ASDParticipant: "",
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
        FK_TestingRoom: null,
        MinAge: null,
        MaxAge: null,
        Description: "",
        EmailTemplate: "",
        PhoneScript: "",
        ReminderTemplate: "",
        Completed: false,
        StudyType: null,
        ASDParticipant: "",
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
        ASDParticipant: "",
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
      PointofContact: {},
      customToolbar: [
        ["bold", "italic", "underline"],
        [{ color: [] }, { background: [] }],
        ["link"],
      ],
      inclusionOptions: ["Include", "Exclude", "Only"],
      inProgressStudyFilter: true,
      search: "",
      currentTestingRooms: [],
      selectedRoomId: null
    };
  },

  methods: {
    async optionChangedTestingRoom() {
      this.editedStudy = {
        id: this.currentStudy.id,
        FK_TestingRoom: this.selectedRoomId
      }

      try {
        await study.update(this.editedStudy);

        this.currentStudy.FK_TestingRoom = this.editedStudy.FK_TestingRoom;
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

    },

    async fetchStudyProgress() {
      try {
        const Result = await study.studyStats({ studyID: this.currentStudy.id });
        this.studyStats = Result.data;

        // const hist
      } catch (error) {
        console.log(error.response);
      }
    },

    async searchStudies() {
      var queryString = {
        FK_Lab: this.$store.state.lab,
        includeScheules: false
      };

      try {
        const Result = await study.search(queryString);

        this.Studies = Result.data;

        // if (this.Studies.length > 0) {
        //   this.editedIndex = this.editedIndex === -1 ? 0 : this.editedIndex;
        //   this.currentStudy = this.Studies[this.editedIndex];
        // }
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
        this.editedIndex = this.Studies.indexOf(item);
        item.Completed = !item.Completed;
        await study.update(item);
        Object.assign(this.Studies[this.editedIndex], item);
        this.$store.dispatch("setStudies", this.Studies);
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
      this.selectedRoomId = this.currentStudy.FK_TestingRoom || null;
    },

    editStudy() {
      this.editedStudy = Object.assign({}, this.currentStudy);
      this.editedIndex = this.Studies.indexOf(this.currentStudy);
      this.PointofContact = this.currentStudy.PointofContact;
      this.dialog = true;
    },

    async createStudy() {
      const testingRooms = await testingRoom.search(this.$store.state.lab);
      this.$store.dispatch("setTestingRooms", testingRooms.data);
      this.editedStudy = Object.assign({}, this.defaultStudy);
      this.editedIndex = -1;
      this.dialog = true;
    },

    async save() {
      this.editedStudy.FK_Personnel = this.PointofContact.id;
      if (this.editedStudy.id === undefined) {
        try {
          const Result = await study.create(this.editedStudy);
          this.editedStudy.PointofContact = this.PointofContact;
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
          this.editedStudy.PointofContact = this.PointofContact;
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
        this.PointofContact = {};
        this.editedStudy = {};
        // this.editedIndex = -1;
      }, 300);
    },

    async deleteStudy() {
      if (
        await this.$refs.confirmD.open(
          "Beep!",
          "You are about to delete this study. <br>The deletion will also remove all related study appointments.<br><br>If you don't want to delete the study, please click CANCEL."
        )
      ) {
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
      }
    },

    updateExperimenters(updatedExperimenters) {
      this.currentStudy.Experimenters = updatedExperimenters;

      Object.assign(this.Studies[this.editedIndex], this.currentStudy);
      this.$store.dispatch("setStudies", this.Studies);
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

    filterByText(value, search) {
      return (
        value != null &&
        search != null &&
        typeof value === "string" &&
        value
          .toString()
          .toLocaleLowerCase()
          .indexOf(search.toLocaleLowerCase()) !== -1
      );
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
          "<p style= 'color: var(--v-primary-lighten3)'>Thanks for your support to our research! This is a confirmation for your participation in our study with <strong>" +
          "Emma" +
          moment().format(" [on] dddd [(]MMM Do[)] [at] h:mma") +
          "</strong>.</p>";

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

        email = email.replace(/\/p><p/g, "/p><p></p><p");
        email = email.replace(/<p>/g, "<p style='margin: 0px !important; padding: 0px;'>");

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

        email = email.replace(/\/p><p/g, "/p><p></p><p");
        email = email.replace(/<p>/g, "<p style='margin: 0px !important; padding: 0px;'>");

        return email;
      } else {
        return "<p>Email template hasn't setup yet. No email preview is available.</p>";
      }
    },

    followupPreview() {
      if (this.currentStudy.FollowUPEmailSnippet) {
        var opening =
          "<p style= 'color: var(--v-primary-lighten3)'>Dear " +
          "Lisa,</p>" +
          "<p style= 'color: var(--v-primary-lighten3)'>Thank you so much for participating in our study with " +
          "Emma!</p>"
        "<p style= 'color: var(--v-primary-lighten3)'>This is " + this.$store.state.labName + ". We hope this email finds you well!</p>" +
          "<p style= 'color: var(--v-primary-lighten3)'>We are writing to follow up with our previous email regarding inviting Emma to participate in our study.</p>" +
          "<p style= 'color: var(--v-primary-lighten3)'>We would appreciate it if you could provide us with your availability by replying to this email. We will do our best to find a time that works for you and Emma.</p>"

        const TYclosing =
          "<p></p><p>" +
          this.$store.state.tyEmailClosing +
          "</p>" +
          "<p style= 'color: var(--v-primary-lighten3)'>Best,<br>" +
          this.$store.state.name +
          "<br>" +
          this.$store.state.role +
          "<br>" +
          this.$store.state.labName +
          "</p>";

        var emailBody = this.currentStudy.FollowUPEmailSnippet;

        emailBody = emailBody.replace(/\${{he\/she}}/g, "she" || "");
        emailBody = emailBody.replace(/\${{his\/her}}/g, "her" || "");
        emailBody = emailBody.replace(/\${{him\/her}}/g, "her" || "");

        emailBody = emailBody.replace(/\. she/g, ". She");
        emailBody = emailBody.replace(/\. her/g, ". Her");

        emailBody = emailBody.replace(/\${{childName}}/g, "Emma");

        emailBody = emailBody.replace(/<p>/g, "<p><strong>" || "");
        emailBody = emailBody.replace(/<\/p>/g, "</strong></p>" || "");

        var email = opening + emailBody + TYclosing;

        email = email.replace(/\/p><p/g, "/p><p></p><p");
        email = email.replace(/<p>/g, "<p style='margin: 0px !important; padding: 0px;'>");

        return email;
      } else {
        return "<p>Email template hasn't setup yet. No email preview is available.</p>";
      }
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

  watch: {
    dialogStudyProgress(val) {
      if (val) {
        this.fetchStudyProgress();
      } else {
        this.studyStats = {
          totalNperStatus: [],
          totalNperPersonnelStatus: [],
          totalNperPersonnelPriExp: [],
          totalNperPersonnelAssistExp: []
        };

        console.log(this.studyStats);
      }
    },
  },

  mounted: async function () {
    this.searchStudies();
    this.searchLabMembers();
    this.currentTestingRooms = this.$store.state.testingRooms;
  },
};
</script>

<style>
body {
  border: 2px solid rgb(0, 153, 255);
  border-radius: 5px;
}

.complete {
  align-items: flex-end !important;
}

.template {
  background-color: var(--v-textbackground-base);
  border-color: var(--v-primary-base);
  margin: 8px 8px 8px 8px;
  padding: 8px 8px 8px 8px;
  border-width: 1px;
  width: 90%;
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

.ck-editor__editable_inline:not(.ck-comment__input *) {
  height: 250px !important;
  overflow-y: auto;
  margin: 0px;
}

.card {
  display: flex;
  flex-direction: column;
  /* align-content: space-around; */
}
</style>
