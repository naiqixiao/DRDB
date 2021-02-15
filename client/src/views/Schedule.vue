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

    <ConfirmDlg ref="confirmD" />

    <v-row justify="space-around" style="height: 620px;">
      <v-col cols="12" md="4">
        <v-row dense>
          <v-col cols="12" md="12">
            <h1 class="text-left">Choose a study</h1>
          </v-col>
          <v-col cols="12" md="12">
            <v-select
              class="selection"
              :items="studies"
              :item-value="'id'"
              :item-text="'StudyName'"
              v-model="selectedStudy"
              return-object
              label="Studies"
              @change="searchChild"
              background-color="textbackground"
              hide-details
              outlined
              dense
            ></v-select>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" md="12">
            <StudySummary :selectedStudy="selectedStudy"></StudySummary>
          </v-col>
        </v-row>

        <!-- <h4>{{ selectedStudy.StudyName }}</h4>
        <h4>{{ selectedStudy.MinAge }}</h4>
        <h4>{{ selectedStudy.MaxAge }}</h4>
        <p>{{ selectedStudy.Description }}</p>-->

        <!-- <v-btn @click.stop="dialogEmail = true" color="primary">Email test</v-btn>
        <EmailDialog
          :dialog="dialogEmail"
          :emailTemplate="selectedStudy.EmailTemplate"
          :data="{
            NamePrimary: currentFamily.NamePrimary,
            ChildName: currentChild.Name,
            Email: 'nx@kangleelab.com',
          }"
          @cancelEmail="closeEmail"
        ></EmailDialog>-->
      </v-col>

      <v-col cols="12" md="5">
        <v-row justify="space-around">
          <v-col cols="12" md="9">
            <h2 v-show="contactedByOthers" style="color: red;">
              You're late. Someone just called this family...
            </h2>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="12" md="3" style="text-align: end">
            <Page
              :page="page"
              :NofPages="Children ? Children.length : 0"
              @nextPage="nextPage"
              @previousPage="previousPage"
            ></Page>
          </v-col>
        </v-row>
        <v-row justify="start" align="center">
          <v-col md="12" class="subtitle">
            <v-divider></v-divider>
            <h4 class="text-left">Family information:</h4>
          </v-col>
          <v-col
            cols="12"
            v-for="item in familyField.map((i) => this.$familyFields[i])"
            :md="item.width"
            :key="item.label"
          >
            <v-text-field
              class="textfield-family"
              background-color="textbackground"
              hide-details
              :label="item.label"
              :value="
                item.label === 'Phone' || item.label === 'Cell Phone'
                  ? PhoneFormated(currentFamily[item.field])
                  : currentFamily[item.field]
              "
              readonly
              placeholder="  "
              outlined
              dense
            ></v-text-field>
          </v-col>
          <!-- <v-col cols="12" md="2"></v-col> -->
          <v-col cols="12" md="2" style="text-align: center">
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <div v-on="on">
                  <v-btn
                    color="primary"
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
        </v-row>

        <v-dialog
          v-model="dialogFamilyEdit"
          max-width="1200px"
          :retain-focus="false"
        >
          <v-card outlined>
            <v-card-title>
              <span class="headline">Edit family information</span>
              <v-spacer></v-spacer>
              <span class="headline">
                {{ "Family ID: " + currentFamily.id }}
              </span>
            </v-card-title>
            <v-card-text>
              <v-form ref="formFamily" v-model="validFamily" lazy-validation>
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
                      <v-combobox
                        justify="start"
                        :items="$Options[item.options]"
                        v-model="editedFamily[item.field]"
                        outlined
                        :label="item.label"
                        dense
                      ></v-combobox>
                    </div>
                    <div v-else-if="item.rules">
                      <v-text-field
                        :label="item.label"
                        :rules="$rules[item.rules]"
                        v-model="editedFamily[item.field]"
                        outlined
                        hide-details
                        dense
                      ></v-text-field>
                    </div>
                    <div v-else>
                      <v-text-field
                        :label="item.label"
                        v-model="editedFamily[item.field]"
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
                        justify="start"
                        :items="$Options[item.options]"
                        v-model="editedFamily[item.field]"
                        outlined
                        :label="item.label"
                        dense
                      ></v-combobox>
                    </div>
                    <div v-else-if="item.rules">
                      <v-text-field
                        :label="item.label"
                        :rules="$rules[item.rules]"
                        v-model="editedFamily[item.field]"
                        outlined
                        hide-details
                        dense
                      ></v-text-field>
                    </div>
                    <div v-else>
                      <v-text-field
                        :label="item.label"
                        v-model="editedFamily[item.field]"
                        outlined
                        hide-details
                        dense
                      ></v-text-field>
                    </div>
                  </v-col>
                </v-row>
              </v-form>
            </v-card-text>
            <v-card-actions style="padding: 16px;">
              <v-row justify="space-between">
                <v-col md="4"></v-col>
                <v-col md="2">
                  <v-btn color="primary" @click="dialogFamilyEdit = false"
                    >Cancel</v-btn
                  >
                </v-col>
                <v-col md="2">
                  <v-btn color="primary" @click="saveFamily">Save</v-btn>
                </v-col>
                <v-col md="4"></v-col>
              </v-row>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-row justify="start" align="center">
          <v-col md="12" class="subtitle">
            <v-divider></v-divider>
            <h4 class="text-left">Child information:</h4>
          </v-col>

          <v-col
            cols="12"
            :md="item.width"
            v-for="item in childField"
            :key="item.label"
          >
            <v-text-field
              class="textfield-family"
              background-color="textbackground"
              hide-details
              :label="item.label"
              v-model="currentChild[item.field]"
              readonly
              placeholder="  "
              outlined
              dense
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="3">
            <v-text-field
              class="textfield-family"
              background-color="textbackground"
              hide-details
              label="Age"
              :value="AgeFormated(currentChild.DoB)"
              readonly
              placeholder="  "
              outlined
              dense
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="1"></v-col>

          <v-col md="10">
            <v-textarea
              class="conv-textarea"
              label="Note about this child"
              outlined
              no-resize
              rows="4"
              hide-details
              v-model="currentChild.Note"
            ></v-textarea>
          </v-col>
          <v-col cols="12" md="2" style="text-align: center">
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <div v-on="on">
                  <v-btn
                    color="primary"
                    fab
                    @click.stop="editChild"
                    :disabled="!currentChild.id"
                  >
                    <v-icon>edit</v-icon>
                  </v-btn>
                </div>
              </template>
              <span>Edit child information</span>
            </v-tooltip>
          </v-col>
        </v-row>

        <v-row justify="space-around" align="center">
          <v-col md="12" class="subtitle">
            <v-divider></v-divider>
            <h4 class="text-left">Schedule a study for this child:</h4>
          </v-col>
          <v-col cols="12" md="9">
            <v-select
              :items="Responses"
              v-model="response"
              :label="
                currentChild.scheduled
                  ? 'This family is already scheduled.'
                  : 'Parents\'\ response'
              "
              :disabled="
                !currentChild.id ||
                  currentChild.scheduled ||
                  !$store.state.labEmailStatus
              "
              class="textfield-family"
              background-color="textbackground"
              hide-details
              outlined
              dense
            ></v-select>
          </v-col>

          <v-col cols="12" md="3">
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <div v-on="on">
                  <v-btn
                    color="primary"
                    large
                    @click.stop="scheduleChild"
                    :disabled="response == null"
                    >{{ response === "Rejected" ? "¯\\\_(ツ)_/¯" : "" }}
                    <v-icon>{{ scheduleButtonIcon }}</v-icon>
                  </v-btn>
                </div>
              </template>
              <span>{{ scheduleButtonTooltip }}</span>
            </v-tooltip>
          </v-col>

          <v-dialog v-model="dobPicker" max-width="290px">
            <v-card outlined>
              <v-date-picker
                v-model="editedChild.DoB"
                show-current
                :max="new Date().toISOString()"
                @click:date="dobPicker = false"
              ></v-date-picker>
            </v-card>
          </v-dialog>

          <v-dialog
            v-model="dialogChildEdit"
            max-width="1000px"
            :retain-focus="false"
          >
            <v-card outlined>
              <v-card-title>
                <span class="headline">Child's information</span>
              </v-card-title>
              <v-card-text>
                <v-form ref="formChild" v-model="validChild" lazy-validation>
                  <v-container>
                    <v-row dense style="padding: 8px 8px 4px">
                      <v-col
                        cols="12"
                        :md="item.width"
                        v-for="item in this.$childInfo"
                        :key="item.label"
                      >
                        <div v-if="!!item.options">
                          <v-combobox
                            :label="item.label"
                            :items="$Options[item.options]"
                            justify="start"
                            v-model="editedChild[item.field]"
                            outlined
                            hide-details
                            dense
                          ></v-combobox>
                        </div>
                        <div v-else-if="item.label === 'Note'">
                          <v-textarea
                            class="conv-textarea"
                            :label="item.label"
                            outlined
                            no-resize
                            rows="4"
                            hide-details
                            v-model="editedChild[item.field]"
                          ></v-textarea>
                        </div>
                        <div v-else-if="item.field === 'DoB'">
                          <v-text-field
                            v-model="editedChild.DoB"
                            append-icon="event"
                            @click:append="dobPicker = true"
                            :rules="$rules.dob"
                            :label="item.label"
                            class="textfield-family"
                            filled
                            hide-details
                            dense
                            placeholder="  "
                            outlined
                            background-color="textbackground"
                          ></v-text-field>
                        </div>
                        <div v-else-if="!!item.rules">
                          <v-text-field
                            class="textfield-family"
                            filled
                            hide-details
                            :label="item.label"
                            v-model="editedChild[item.field]"
                            dense
                            placeholder="  "
                            outlined
                            :rules="$rules[item.rules]"
                            background-color="textbackground"
                          ></v-text-field>
                        </div>
                        <div v-else>
                          <v-text-field
                            class="textfield-family"
                            filled
                            hide-details
                            :label="item.label"
                            v-model="editedChild[item.field]"
                            dense
                            placeholder="  "
                            outlined
                            background-color="textbackground"
                          ></v-text-field>
                        </div>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col
                        cols="12"
                        :md="item.width"
                        v-for="item in this.$childSensitiveInfo"
                        :key="item.label"
                      >
                        <v-checkbox
                          class="checkbox-child"
                          hide-details
                          :label="item.label"
                          v-model="editedChild[item.field]"
                          dense
                        >
                        </v-checkbox>
                      </v-col>
                    </v-row>
                    <!-- <v-divider></v-divider> -->
                  </v-container>
                </v-form>
              </v-card-text>

              <v-card-actions style="padding: 16px;">
                <v-row justify="space-between">
                  <v-col md="4"></v-col>
                  <v-col md="2">
                    <v-btn color="primary" @click="dialogChildEdit = false"
                      >Cancel</v-btn
                    >
                  </v-col>
                  <v-col md="2">
                    <v-btn color="primary" @click="saveChild">Save</v-btn>
                  </v-col>
                  <v-col md="4"></v-col>
                </v-row>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <v-dialog
            v-model="dialogSchedule"
            max-width="1200px"
            :retain-focus="false"
            persistent
          >
            <v-stepper v-model="e1">
              <v-stepper-header>
                <v-stepper-step
                  :complete="e1 > 1"
                  editable
                  step="1"
                  @click="emailDialog = false"
                  >Schedule studies for {{ currentChild.Name }}</v-stepper-step
                >

                <v-divider></v-divider>

                <v-stepper-step :complete="e1 > 2" step="2"
                  >Email</v-stepper-step
                >

                <v-divider></v-divider>

                <v-stepper-step step="3">Next contact</v-stepper-step>
              </v-stepper-header>

              <v-stepper-items>
                <v-stepper-content step="1">
                  <v-row
                    style="height: 650px;"
                    align="start"
                    justify="center"
                    dense
                  >
                    <v-card outlined style="height: 650px;" width="90%">
                      <v-row
                        style="height: 100px;"
                        align="center"
                        justify="start"
                        dense
                      >
                        <v-col cols="12" md="3" class="text-left">
                          <div class="title" style="padding-left: 8px">
                            {{ "Study date & time:" }}
                          </div>
                        </v-col>
                        <v-col cols="12" md="2">
                          <v-text-field
                            ref="studyDate"
                            label="Study date"
                            v-model="studyDate"
                            append-icon="event"
                            @click:append="datePicker = true"
                            :disabled="
                              this.response != 'Confirmed' ||
                                this.skipStudyDateTimeStatus
                            "
                            hide-details
                            dense
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="1"></v-col>
                        <v-col cols="12" md="2">
                          <v-combobox
                            v-model="studyTime"
                            :items="this.$studyTimeSlots"
                            label="Study time"
                            :disabled="
                              this.response != 'Confirmed' ||
                                this.skipStudyDateTimeStatus
                            "
                            hide-details
                            dense
                          ></v-combobox>
                        </v-col>
                        <v-col cols="12" md="1"></v-col>
                        <v-col cols="12" md="3">
                          <v-tooltip right>
                            <template v-slot:activator="{ on }">
                              <div v-on="on">
                                <v-checkbox
                                  style="padding: 4px !important"
                                  label="Skip study date/time"
                                  class="ma-0 pa-0"
                                  :value="skipStudyDateTimeStatus"
                                  @change="skipStudyDateTime()"
                                  :disabled="response != 'Confirmed'"
                                  hide-details
                                  dense
                                ></v-checkbox>
                              </div>
                            </template>
                            <span
                              >Check this box to use current date/time for the
                              current appointment.<br />NO Google Calendar event
                              will be created.</span
                            >
                          </v-tooltip>
                          <v-tooltip right>
                            <template v-slot:activator="{ on }">
                              <div v-on="on">
                                <v-checkbox
                                  style="padding: 4px !important"
                                  label="Skip reminder email"
                                  class="ma-0 pa-0"
                                  :value="skipReminderEmailStatus"
                                  @change="skipReminderEmail()"
                                  :disabled="response != 'Confirmed'"
                                  hide-details
                                  dense
                                ></v-checkbox>
                              </div>
                            </template>
                            <span
                              >Check this box to prevent reminder email from
                              being sent to the participant.</span
                            >
                          </v-tooltip>
                        </v-col>
                      </v-row>
                      <v-divider style="margin-bottom: 16px"></v-divider>
                      <div
                        style="height: 290px; overflow-y: scroll !important;"
                      >
                        <ExtraStudies
                          v-for="(appointment, index) in appointments"
                          :key="appointment.index"
                          ref="extraStudies"
                          :child="appointment.Child"
                          :targetChild="currentChild"
                          :currentStudy="selectedStudy"
                          :index="index"
                          :response="response"
                          :potentialStudies="
                            potentialStudies(appointment.Child)
                              .potentialStudyList
                          "
                          type="newSchedule"
                          :nOfAppointments="appointments.length"
                          @selectStudy="selectStudy"
                          @deleteAppointment="deleteAppointment"
                          @emitSelectedStudy="receiveSelectedStudy"
                          @primaryExperimenterStatus="checkPrimaryExperimenter"
                          align="start"
                        ></ExtraStudies>
                      </div>
                      <v-spacer></v-spacer>
                      <v-divider
                        style="margin-bottom: 4px"
                        v-show="response === 'Confirmed'"
                      ></v-divider>
                      <v-row
                        dense
                        v-if="response === 'Confirmed'"
                        align="center"
                        justify="start"
                        style="height: 100px"
                      >
                        <v-col cols="12" md="3" class="text-left">
                          <h4 class="text-left">
                            Additional appointment(s) for:
                          </h4>
                        </v-col>
                        <v-col cols="12" md="2" class="text-left">
                          <v-btn
                            class="text-capitalize"
                            rounded
                            color="primary"
                            @click="newAppointment(currentChild)"
                            :disabled="
                              potentialStudies(currentChild).selectableStudies
                                .length < 1
                            "
                            >{{ currentChild.Name.split(" ")[0] }}</v-btn
                          >
                        </v-col>
                        <v-col
                          cols="12"
                          md="2"
                          v-for="child in currentChild.sibling"
                          :key="child.id"
                        >
                          <v-btn
                            class="text-capitalize"
                            rounded
                            color="primary"
                            @click="newAppointment(child)"
                            :disabled="
                              potentialStudies(child).selectableStudies.length <
                                1
                            "
                            >{{ child.Name.split(" ")[0] }}</v-btn
                          >
                        </v-col>
                      </v-row>
                      <v-spacer></v-spacer>
                      <v-divider style="margin-bottom: 4px"></v-divider>
                      <v-row
                        dense
                        style="height: 150px"
                        align="center"
                        justify="center"
                      >
                        <v-col md="11">
                          <v-textarea
                            class="conv-textarea"
                            label="Notes for this schedule"
                            outlined
                            no-resize
                            rows="6"
                            hide-details
                            v-model="scheduleNotes"
                          ></v-textarea>
                        </v-col>
                      </v-row>
                    </v-card>
                  </v-row>
                  <!-- <v-divider></v-divider> -->
                  <v-row
                    justify="space-between"
                    align="center"
                    style="padding: 8px;"
                  >
                    <v-col cols="12" md="2"></v-col>
                    <v-col cols="12" md="6">
                      <v-btn
                        :loading="loadingStatus"
                        color="primary"
                        :disabled="
                          response === 'Confirmed'
                            ? !(studyDateTime || skipStudyDateTimeStatus)
                            : false
                        "
                        @click="continue12()"
                      >
                        <v-icon dark left v-show="scheduleId"
                          >mdi-checkbox-marked-circle</v-icon
                        >
                        {{ scheduleButtonText }}
                      </v-btn>

                      <v-btn
                        v-if="response == 'Confirmed' && manualCalendar"
                        @click="createCalendarbyScheduleId"
                        >Create Calendar</v-btn
                      >
                    </v-col>
                    <v-col cols="12" md="2">
                      <v-btn
                        :disabled="!scheduleNextPage"
                        @click="scheduleNextStep"
                        >Next</v-btn
                      >
                    </v-col>
                  </v-row>
                </v-stepper-content>

                <v-stepper-content step="2">
                  <v-row
                    style="height: 700px;"
                    align="start"
                    justify="center"
                    dense
                  >
                    <v-card outlined style="height: 700px;" width="90%">
                      <Email
                        ref="Email"
                        :dialog="emailDialog"
                        :familyInfo="currentFamily"
                        :scheduleInfo="currentSchedule"
                        :appointments="appointments"
                        :emailType="emailType"
                      ></Email>
                    </v-card>
                  </v-row>
                  <!-- <v-divider></v-divider> -->
                  <v-row
                    justify="space-between"
                    align="center"
                    style="padding: 8px;"
                  >
                    <v-col cols="12" md="2">
                      <v-tooltip top>
                        <template v-slot:activator="{ on }">
                          <div v-on="on">
                            <v-checkbox
                              label="Skip email"
                              class="ma-0 pa-0"
                              :value="skipConfirmationEmailStatus"
                              @change="skipConfirmationEmail()"
                              :disabled="response != 'Confirmed'"
                              dense
                            ></v-checkbox>
                          </div>
                        </template>
                        <span>Check this box to skip emailing to parents.</span>
                      </v-tooltip>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-btn
                        :loading="loadingStatus"
                        color="primary"
                        @click="continue23()"
                        :disabled="
                          !currentFamily.Email ||
                            this.skipConfirmationEmailStatus ||
                            !this.$store.state.labEmailStatus
                        "
                      >
                        <v-icon dark left v-show="emailSent"
                          >mdi-checkbox-marked-circle</v-icon
                        >{{ emailButtonText }}
                      </v-btn>
                    </v-col>
                    <v-col cols="12" md="2">
                      <v-btn
                        :disabled="
                          !scheduleNextPage &&
                            !!currentFamily.Email &&
                            !this.skipConfirmationEmailStatus
                        "
                        @click="scheduleNextStep"
                        >{{
                          !!currentFamily.Email &&
                          !this.skipConfirmationEmailStatus &&
                          this.$store.state.labEmailStatus
                            ? "Next"
                            : "Skip email"
                        }}</v-btn
                      >
                    </v-col>
                  </v-row>
                </v-stepper-content>

                <v-stepper-content step="3">
                  <NextContact
                    ref="NextContact"
                    :familyId="currentFamily.id"
                    :labId="$store.state.lab"
                    :studyDate="studyDate"
                    :contactType="response"
                    :nextContactDialog="nextContactDialog"
                  ></NextContact>

                  <v-row dense justify="center" align="center">
                    <v-col>
                      <v-btn color="primary" @click="completeSchedule()"
                        >Complete</v-btn
                      >
                    </v-col>
                  </v-row>
                </v-stepper-content>
              </v-stepper-items>
            </v-stepper>
          </v-dialog>

          <v-dialog v-model="datePicker" max-width="290px">
            <v-card outlined>
              <v-date-picker
                v-model="studyDate"
                show-current
                @click:date="datePick"
                :min="earliestDate"
                :max="latestDate"
              ></v-date-picker>
            </v-card>
          </v-dialog>
        </v-row>
        <v-row justify="space-around" align="center">
          <v-col md="12" class="subtitle">
            <v-divider></v-divider>
            <h4 class="text-left">No More Contact</h4>
          </v-col>
          <v-col cols="12" md="10">
            <h3 class="text-left">
              If this family requests NO MORE CONTACT, you should click this
              button ===>>>>
            </h3>
          </v-col>
          <v-col cols="12" md="2">
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <div v-on="on">
                  <v-btn
                    fab
                    @click="NoMoreContact()"
                    :disabled="!currentChild.id"
                  >
                    <v-icon color="warning" style="padding-right: 5px;"
                      >pan_tool</v-icon
                    >
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
          :Conversation="currentFamily.Conversations"
          :familyId="parseInt(currentFamily.id)"
          :notes="currentFamily.Note"
          @updateNotes="saveNotes"
        ></NotesConversation>
      </v-col>
    </v-row>

    <v-row justify="start" height="450px">
      <v-col cols="12" md="9">
        <AppointmentTableBrief
          :Appointments="currentFamily.Appointments"
          :family="currentFamily"
        ></AppointmentTableBrief>
      </v-col>

      <v-col cols="12" md="3">
        <ParticipationHistory :family="currentFamily" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import store from "@/store";
import child from "@/services/child";
import study from "@/services/study";
import family from "@/services/family";

import schedule from "@/services/schedule";
import calendar from "@/services/calendar";

import moment from "moment";

import ExtraStudies from "@/components/ExtraStudies";

import NotesConversation from "@/components/NotesConversation";
import StudySummary from "@/components/StudySummary";

import Email from "@/components/Email";
// import EmailDialog from "@/components/EmailDialog";
import NextContact from "@/components/NextContact";

import AppointmentTableBrief from "@/components/AppointmentTableBrief";
import ParticipationHistory from "@/components/ParticipationHistoryChart";

import Page from "@/components/Page";

import ConfirmDlg from "@/components/ConfirmDialog";

import { io } from "socket.io-client";
import { backendURL } from "../plugins/variables";

export default {
  components: {
    NotesConversation,
    StudySummary,
    ExtraStudies,
    Email,
    // EmailDialog,
    NextContact,
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
      scheduleId: 0,
      manualCalendar: false,
      dialogEmail: false,
      e1: 1,
      emailDialog: false,
      dialogChildEdit: false,
      dialogFamilyEdit: false,
      dialogSchedule: false,
      dobPicker: false,
      datePicker: false,
      validChild: true,
      validFamily: true,
      studies: [],
      selectedStudy: {
        StudyName: null,
        FK_Lab: this.$store.state.lab,
        MinAge: null,
        MaxAge: null,
        Description: "",
        // EmailTemplate: "",
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
      Children: [],
      elegibleExperimenters: [],
      scheduleButtonIcon: "event",
      scheduleButtonTooltip: "",
      scheduleButtonText: "Schedule",
      scheduleNextPage: false,
      emailType: "Confirmation",
      emailSent: false,
      currentSchedule: {},
      appointments: [],
      Experimenters: [],
      studyTime: null,
      currentChild: {
        Name: null,
        Sex: null,
        DoB: null,
        Family: {
          NamePrimary: null,
          NameSecondary: null,
          Phone: null,
          Email: null,
        },
      },
      editedChild: {
        Name: null,
        Sex: null,
        DoB: null,
        Family: {
          NamePrimary: null,
          NameSecondary: null,
          Phone: null,
          Email: null,
        },
      },
      editedFamily: {},
      defaultItem: {
        Name: null,
        Sex: null,
        DoB: null,
        Family: {
          NamePrimary: null,
          NameSecondary: null,
          Phone: null,
          Email: null,
        },
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
      studyDate: null,
      nextContactDialog: false,
      page: 0,
      skipStudyDateTimeStatus: false,
      skipConfirmationEmailStatus: false,
      skipReminderEmailStatus: false,
      primaryExperimenterList: [],
      emailButtonText: "Send email",
      defaultAppointment: {
        index: "",
        FK_Family: "",
        FK_Child: "",
        FK_Study: "",
        FK_Schedule: "",
        PrimaryExperimenter: [],
        SecondaryExperimenter: [],
      },
      scheduleNotes: "",
      socket: {},
      currentVisitedFamilies: [],
      contactedByOthers: false,
      loadingStatus: false,
    };
  },

  methods: {
    async searchStudies() {
      var queryString = {
        FK_Lab: store.state.lab,
        Completed: 0,
      };

      try {
        const Result = await study.search(queryString);

        this.studies = Result.data;
      } catch (error) {
        if (error.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login",
          });
        }
      }
    },

    async searchChild() {
      this.$store.dispatch("setLoadingStatus", true);

      if (!this.currentChild.scheduled) {
        this.socket.emit("remove family", this.currentChild.FK_Family);
      }

      var queryString = {};

      queryString.minAge = this.selectedStudy.MinAge;
      queryString.maxAge = this.selectedStudy.MaxAge;
      queryString.studyID = this.selectedStudy.id;

      switch (this.selectedStudy.PrematureParticipant) {
        // case "Include":
        //   break;
        case "Exclude":
          queryString.PrematureParticipant = 0;
          break;

        case "Only":
          queryString.PrematureParticipant = 1;
          break;
      }

      switch (this.selectedStudy.IllParticipant) {
        // case "Include":
        //   break;
        case "Exclude":
          queryString.IllParticipant = 0;
          break;

        case "Only":
          queryString.IllParticipant = 1;
          break;
      }

      switch (this.selectedStudy.VisionLossParticipant) {
        // case "Include":
        //   break;
        case "Exclude":
          queryString.VisionLossParticipant = 0;
          break;

        case "Only":
          queryString.VisionLossParticipant = 1;
          break;
      }

      switch (this.selectedStudy.HearingLossParticipant) {
        // case "Include":
        //   break;
        case "Exclude":
          queryString.HearingLossParticipant = 0;
          break;

        case "Only":
          queryString.HearingLossParticipant = 1;
          break;
      }

      queryString.trainingMode = this.$store.state.trainingMode;

      try {
        const Results = await child.search(queryString);

        if (Results.data.length > 0) {
          this.page = 1;
          this.Children = Results.data;
          this.currentChild = this.Children[this.page - 1];

          if (
            this.currentVisitedFamilies.includes(this.currentChild.FK_Family)
          ) {
            this.currentChild.scheduled = true;
          } else {
            this.socket.emit("add family", this.currentChild.FK_Family);
          }

          alert(
            "Hold on!\n\nMake sure to confirm with parents about their email address and child's information.\n\nUse the pencil buttons to update family and/or child informatin.\n\nYour little effort will benefit everyone in the future!\n\nThanks! :)"
          );
        } else {
          alert("no child is elegible for the selected study. :(");
          this.page = 0;
          this.Children = Results.data;
          this.currentChild = Object.assign({}, this.defaultItem);
        }
      } catch (error) {
        if (error.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login",
          });
        } else {
          console.log(error);
        }
      }

      this.response = null;
      setTimeout(() => this.$store.dispatch("setLoadingStatus", false), 500);
    },

    editFamily() {
      this.editedIndex = this.Children.indexOf(this.currentChild);
      this.editedFamily = Object.assign({}, this.currentFamily);
      this.dialogFamilyEdit = true;
    },

    editChild() {
      this.editedIndex = this.Children.indexOf(this.currentChild);
      this.editedChild = Object.assign({}, this.currentChild);
      this.dialogChildEdit = true;
    },

    async saveFamily() {
      var validationResults = this.$refs.formFamily.validate();

      if (validationResults) {
        this.editedFamily.UpdatedBy = store.state.userID;

        try {
          await family.update(this.editedFamily);

          this.currentChild.Family = this.editedFamily;

          Object.assign(this.Children[this.editedIndex], this.currentChild);

          console.log("Family Info is updated!");

          this.$refs.formFamily.resetValidation();

          this.closeFamily();
        } catch (error) {
          console.log(error);
        }
      }
    },

    async saveNotes(newNotes) {
      this.currentFamily.Note = newNotes;

      this.currentFamily.UpdatedBy = store.state.userID;

      await family.update(this.currentFamily);

      this.currentChild.Family = this.currentFamily;

      Object.assign(this.Children[this.page - 1], this.currentChild);
    },

    async saveChild() {
      try {
        var validationResults = false;

        validationResults = this.$refs.formChild.validate();

        if (validationResults) {
          this.editedChild.Age = Math.floor(
            (new Date() - new Date(this.editedChild.DoB)) / (24 * 3600 * 1000)
          );

          await child.update(this.editedChild);

          Object.assign(this.Children[this.editedIndex], this.editedChild);

          console.log("Child information updated!");

          this.$refs.formChild.resetValidation();

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

    scheduleChild() {
      this.editedIndex = this.Children.indexOf(this.currentChild);
      this.editedChild = Object.assign({}, this.currentChild);

      if (!this.scheduleId) {
        this.appointments = [];
        var newAppointment = Object.assign({}, this.defaultAppointment);
        newAppointment.FK_Child = this.currentChild.id;
        newAppointment.FK_Family = this.currentChild.FK_Family;
        newAppointment.FK_Study = this.selectedStudy.id;
        newAppointment.Child = this.currentChild;
        newAppointment.Study = this.selectedStudy;
        newAppointment.index = this.appointments.length;
        this.appointments.push(newAppointment);
      }

      this.dialogSchedule = true;
    },

    receiveSelectedStudy(selectedStudy) {
      this.appointments[selectedStudy.index].FK_Study = selectedStudy.studyId;
      this.appointments[selectedStudy.index].FK_Child = selectedStudy.childId;
    },

    potentialStudies(child) {
      var ElegibleStudies = [];

      store.state.studies.forEach((study) => {
        if (this.studyElegibility(study, child)) {
          ElegibleStudies.push(study.id);
        }
      });

      var uniquePreviousStudies = [];

      if (child.Appointments) {
        child.Appointments.forEach((appointment) => {
          uniquePreviousStudies.push(appointment.FK_Study);
        });
        uniquePreviousStudies = Array.from(new Set(uniquePreviousStudies));
      }

      var potentialStudies = ElegibleStudies.filter(
        (study) => !uniquePreviousStudies.includes(study)
      );

      // check the selected studies.
      var currentSelectedStudies = [];
      if (this.appointments.length > 0) {
        for (var i = 0; i < this.appointments.length; i++) {
          if (this.appointments[i].FK_Child == child.id) {
            currentSelectedStudies.push(this.appointments[i].FK_Study);
          }
        }
      }

      var selectableStudies = potentialStudies.filter(
        (study) => !currentSelectedStudies.includes(study)
      );

      var potentialStudyList = store.state.studies.filter((study) =>
        potentialStudies.includes(study.id)
      );

      return {
        potentialStudyList: potentialStudyList,
        selectableStudies: selectableStudies,
      };
    },

    newAppointment(child) {
      var newAppointment = Object.assign({}, this.defaultAppointment);

      newAppointment.FK_Child = child.id;
      newAppointment.Child = child;
      newAppointment.FK_Family = child.FK_Family;
      newAppointment.index = this.appointments.length;

      this.appointments.push(newAppointment);

      // console.log(this.appointments);
    },

    deleteAppointment(index) {
      this.appointments.splice(index, 1);
    },

    selectStudy(extraAppointments) {
      Object.assign(
        this.appointments[extraAppointments.index],
        extraAppointments.appointment
      );

      if (this.Experimenters.lenth < 1) {
        this.Experimenters = extraAppointments.attendees;
      } else {
        extraAppointments.attendees.forEach((experimenter) => {
          this.Experimenters.push(experimenter);
        });
      }
    },

    checkPrimaryExperimenter(primaryExperimenterStatus) {
      this.primaryExperimenterList.push(primaryExperimenterStatus);
    },

    skipStudyDateTime() {
      this.skipStudyDateTimeStatus = !this.skipStudyDateTimeStatus;

      this.studyDate = moment()
        .startOf("day")
        .format("YYYY-MM-DD");
      this.studyTime = "06:00AM";
    },

    skipConfirmationEmail() {
      this.skipConfirmationEmailStatus = !this.skipConfirmationEmailStatus;
    },

    skipReminderEmail() {
      this.skipReminderEmailStatus = !this.skipReminderEmailStatus;
    },

    async createSchedule() {
      this.Experimenters = [];

      for (var i = 0; i < this.appointments.length; i++) {
        this.$refs.extraStudies[i].selectStudy();
      } // check selectStudy function above to see how appointments and Experimenters are added.

      switch (this.response) {
        case "Confirmed":
          var studyNames = this.appointments.map((appointment) => {
            return (
              appointment.Study.StudyName +
              " (" +
              this.currentFamily.id +
              appointment.Child.IdWithinFamily +
              ")"
            );
          });

          studyNames = Array.from(new Set(studyNames));

          // var calendarDescription =
          //   "<b>Note: </b>" + this.scheduleNotes + "<br>";
          // if (this.appointments[0].Study.StudyType == "Online")
          //   calendarDescription =
          //     calendarDescription +
          //     "<b>zoom link: </b>" +
          //     this.appointments[0].ZoomLink;

          this.currentSchedule = {
            AppointmentTime: moment(this.studyDateTime).toISOString(true),
            Status: this.response,
            FK_Family: this.currentFamily.id,
            Note: this.scheduleNotes,
            summary: studyNames.join(" + "),
            Appointments: this.appointments,
            ScheduledBy: this.$store.state.userID,
            location: this.$store.state.location,
            description: this.calendarDescription(
              this.scheduleNotes,
              this.appointments
            ),
            start: {
              dateTime: moment(this.studyDateTime).toISOString(true),
              timeZone: "America/Toronto",
            },
            end: {
              dateTime: moment(this.studyDateTime)
                .add(1, "h")
                .toISOString(true),
              timeZone: "America/Toronto",
            },
            attendees: this.Experimenters,
          };

          if (this.skipReminderEmailStatus) {
            this.currentSchedule.Reminded = true;
          }

          break;

        default:
          this.currentSchedule = {
            AppointmentTime: null,
            Appointments: this.appointments,
            ScheduledBy: store.state.userID,
            FK_Family: this.currentFamily.id,
            Note: this.scheduleNotes,
          };

          if (
            this.response === "Left a message" ||
            this.response === "Interested"
          ) {
            this.currentSchedule.Status = "TBD";
          } else {
            this.currentSchedule.Status = "Rejected";
            this.currentSchedule.Completed = true;
          }
          break;
      }

      try {
        const newStudySchedule = await schedule.create(this.currentSchedule);

        var calendarEvent = Object.assign({}, this.currentSchedule);

        this.scheduleId = newStudySchedule.data.id;

        this.currentSchedule.id = this.scheduleId;

        calendarEvent.scheduleId = this.scheduleId;

        // attach schedule info to the current appointments.
        newStudySchedule.data.updatedAt = moment().toString();

        this.appointments.forEach((appointment) => {
          appointment.FK_Schedule = this.scheduleId;
          appointment.Schedule = {};
          appointment.Schedule.AppointmentTime =
            newStudySchedule.data.AppointmentTime;
          appointment.Schedule.Status = newStudySchedule.data.Status;
          appointment.Schedule.updatedAt = newStudySchedule.data.updatedAt;
        });

        console.log("New Scheduled Created!");

        return { calendarEvent: calendarEvent };
      } catch (error) {
        console.log(error);
      }
    },

    async deleteUnfinishedSchedule() {
      await schedule.delete({ id: this.scheduleId });
    },

    async createCalendarEvent(calendarEvent) {
      try {
        await calendar.create(calendarEvent);
      } catch (error) {
        console.log(error);
      }
    },

    async createCalendarbyScheduleId() {
      var queryString = { id: this.scheduleId };
      const currentSchedules = await schedule.search(queryString);

      const currentSchedule = currentSchedules.data[0];

      var studyNames = currentSchedule.Appointments.map((appointment) => {
        return (
          appointment.Study.StudyName +
          " (" +
          currentSchedule.FK_Family +
          appointment.Child.IdWithinFamily +
          ")"
        );
      });

      studyNames = Array.from(new Set(studyNames));

      const attendees = [];

      currentSchedule.Appointments.forEach((appointment) => {
        appointment.Personnels.forEach((experimenter) => {
          attendees.push({
            displayName: experimenter.Name,
            email: experimenter.Calendar,
          });
        });
      });

      var calendarEvent = {
        summary: studyNames.join(" + "),
        location: this.$store.state.location,
        description: this.calendarDescription(
          this.scheduleNotes,
          this.appointments
        ),
        start: {
          dateTime: moment(currentSchedule.AppointmentTime).toISOString(true),
          timeZone: "America/Toronto",
        },
        end: {
          dateTime: moment(currentSchedule.AppointmentTime)
            .add(1, "h")
            .toISOString(true),
          timeZone: "America/Toronto",
        },
        attendees: attendees,
        scheduleId: this.scheduleId,
      };

      try {
        await calendar.create(calendarEvent);

        this.manualCalendar = false;

        if (this.e1 == 1) {
          // this.e1 = 2;
          // this.emailDialog = true;
          this.scheduleNextPage = true;
        }

        this.scheduleButtonText = "Schedule";
      } catch (error) {
        console.log(error);
      }
    },

    async continue12() {
      this.loadingStatus = true;
      this.primaryExperimenterList = [];

      for (var i = 0; i < this.appointments.length; i++) {
        this.$refs.extraStudies[i].primaryExperimenterStatus();
      }

      var scheduleInfo = {};

      if (this.scheduleButtonText == "Study Scheduled!") {
        if (
          await this.$refs.confirmD.open(
            "Beep!",
            "You just created an appointment for this family. Do you want to do it again?"
          )
        ) {
          try {
            if (
              this.response == "Confirmed" &&
              this.primaryExperimenterList.includes(0)
            ) {
              // if any appointment without an experimenter.
              await this.$refs.confirmD.open(
                "Who is going to run the study?",
                "Make sure to select an experimenter for this study appointment.\n If you don't see any experimenter listed, go to Study Management page to assign experimenter(s) to this study."
              );
            } else {
              if (this.scheduleId) {
                await this.deleteUnfinishedSchedule();
              }

              scheduleInfo = await this.createSchedule();

              if (
                this.response == "Confirmed" &&
                this.$store.state.labEmailStatus &&
                !this.skipStudyDateTimeStatus
              ) {
                try {
                  await this.createCalendarEvent(scheduleInfo.calendarEvent);

                  this.scheduleNextPage = true;
                  this.scheduleButtonText = "Study Scheduled!";
                } catch (error) {
                  alert(
                    "Calendar event wasn't created successfully, please try again."
                  );
                  console.log(error);
                  this.manualCalendar = true;
                }
              } else {
                this.scheduleButtonText = "Study Scheduled!";
                this.scheduleNextPage = true;
              }
            }
          } catch (error) {
            console.log(error);
          }
        }
      } else {
        try {
          if (
            this.response == "Confirmed" &&
            this.primaryExperimenterList.includes(0)
          ) {
            // if any appointment without an experimenter.
            await this.$refs.confirmD.open(
              "Who is going to run the study?",
              "Make sure to select an experimenter for this study appointment.\n If you don't see any experimenter listed, go to Study Management page to assign experimenter(s) to this study."
            );
          } else {
            if (this.scheduleId) {
              await this.deleteUnfinishedSchedule();
            }

            scheduleInfo = await this.createSchedule();

            if (
              this.response == "Confirmed" &&
              this.$store.state.labEmailStatus &&
              !this.skipStudyDateTimeStatus
            ) {
              try {
                await this.createCalendarEvent(scheduleInfo.calendarEvent);

                this.scheduleNextPage = true;
                this.scheduleButtonText = "Study Scheduled!";
              } catch (error) {
                alert(
                  "Calendar event wasn't created successfully, please try again."
                );
                console.log(error);
                this.manualCalendar = true;
              }
            } else {
              this.scheduleButtonText = "Study Scheduled!";
              this.scheduleNextPage = true;
            }
          }
        } catch (error) {
          console.log(error);
        }
      }
      this.loadingStatus = false;
    },

    async continue23() {
      this.loadingStatus = true;
      try {
        if (this.emailButtonText == "Email Sent!") {
          if (
            await this.$refs.confirmD.open(
              "Send again?",
              "An email was just sent to this family. Do you want to send it again?"
            )
          ) {
            await this.$refs.Email.sendEmail();
            // this.e1 = 3;
            // this.nextContactDialog = true;
            this.emailSent = true;
            this.emailButtonText = "Email Sent!";
            this.scheduleNextPage = true;
          }
        } else {
          await this.$refs.Email.sendEmail();
          // this.e1 = 3;
          // this.nextContactDialog = true;
          this.emailSent = true;
          this.emailButtonText = "Email Sent!";
          this.scheduleNextPage = true;
        }
      } catch (error) {
        console.log(error);
        alert("Email wasn't sent successfully, please try again.");
      }
      this.loadingStatus = false;
    },

    scheduleNextStep() {
      switch (this.e1) {
        case 1:
          if (this.response != "Rejected") {
            this.emailDialog = true;
          } else {
            this.e1 = 2; // skip email if parents rejected participation.
            this.nextContactDialog = true;
          }
          break;

        case 2:
          this.nextContactDialog = true;
          break;
      }

      this.e1 += 1;
      this.scheduleNextPage = false;
    },

    async completeSchedule() {
      // update next contact date and content for the family.
      try {
        // update the current appointment view

        var childIndies = []; // the indices of children within the current family.
        this.Children.forEach((child, index) => {
          if (child.FK_Family == this.currentChild.FK_Family) {
            childIndies.push(index);
          }
        });

        for (var i = 0; i < this.appointments.length; i++) {
          childIndies.forEach((childIndex) => {
            this.Children[childIndex].Family.Appointments.push(
              this.appointments[i]
            );
          });
        }

        // mark the child/family been scheduled. So no others will schedule this family again.
        this.currentChild.scheduled = true;

        childIndies.forEach((childIndex) => {
          this.Children[childIndex].scheduled = true;
        });

        await this.$refs.NextContact.updateNextContact();
        this.resetSchedule();
        this.closeSchedule();
      } catch (error) {
        console.log(error);
      }
    },

    closeSchedule() {
      this.dialogSchedule = false;
    },

    resetSchedule() {
      setTimeout(() => {
        this.e1 = 1;
        this.scheduleId = null;
        this.response = null;
        this.studyDate = null;
        this.studyTime = null;
        this.emailButtonText = "Send email";
        this.scheduleButtonText = "Schedule";
        this.scheduleNotes = "";
        this.emailDialog = false;
        this.nextContactDialog = false;
        this.emailSent = false;
        this.scheduleNextPage = false;
        this.skipStudyDateTimeStatus = false;
        this.skipConfirmationEmailStatus = false;
        this.skipReminderEmailStatus = false;
        this.Experimenters = [];
        this.primaryExperimenterList = [];
        for (var i = 0; i < this.appointments.length; i++) {
          this.$refs.extraStudies[i].resetExperimenters();
        }
      }, 300);
    },

    studyElegibility(study, child) {
      var age =
        child.Age >= study.MinAge * 30.5 - 1 &&
        child.Age <= study.MaxAge * 30.5 - 1;

      var hearing = false;

      switch (study.HearingLossParticipant) {
        case "Only":
          child.HearingLoss ? (hearing = true) : (hearing = false);
          break;

        case "Exclude":
          child.HearingLoss ? (hearing = false) : (hearing = true);

          break;

        case "Include":
          hearing = true;
          break;
      }

      var vision = false;
      switch (study.VisionLossParticipant) {
        case "Only":
          child.VisionLoss ? (vision = true) : (vision = false);
          break;

        case "Exclude":
          child.VisionLoss ? (vision = false) : (vision = true);

          break;

        case "Include":
          vision = true;
          break;
      }

      var premature = false;
      switch (study.PrematureParticipant) {
        case "Only":
          child.PrematureBirth ? (premature = true) : (premature = false);
          break;

        case "Exclude":
          child.PrematureBirth ? (premature = false) : (premature = true);

          break;

        case "Include":
          premature = true;
          break;
      }

      var illness = false;
      switch (study.IllParticipant) {
        case "Only":
          child.Illness ? (illness = true) : (illness = false);
          break;

        case "Exclude":
          child.Illness ? (illness = false) : (illness = true);

          break;

        case "Include":
          illness = true;
          break;
      }

      return age && hearing && vision && premature && illness;
    },

    AgeFormated(DoB) {
      var formated = "";

      if (this.currentChild.id) {
        formated = "DoB is not available.";
      }
      if (DoB) {
        var years = moment().diff(DoB, "years");
        var months = moment().diff(DoB, "months", true);

        months = months - years * 12;
        months = months.toFixed(1);

        var Y = years > 0 ? years + (years > 1 ? " years " : " year ") : "";
        var M =
          months > 0 ? months + (months === 1 ? " month " : " months ") : "";
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

    nextPage() {
      if (!this.currentChild.scheduled && !this.contactedByOthers) {
        this.socket.emit("remove family", this.currentChild.FK_Family);
      }

      this.page += 1;
      this.currentChild = this.Children[this.page - 1];
      this.resetSchedule();

      if (this.currentVisitedFamilies.includes(this.currentChild.FK_Family)) {
        this.contactedByOthers = true;
      } else {
        this.socket.emit("add family", this.currentChild.FK_Family);
        this.contactedByOthers = false;
      }
    },

    previousPage() {
      if (!this.currentChild.scheduled && !this.contactedByOthers) {
        this.socket.emit("remove family", this.currentChild.FK_Family);
      }

      this.page -= 1;
      this.currentChild = this.Children[this.page - 1];
      this.resetSchedule();

      if (this.currentVisitedFamilies.includes(this.currentChild.FK_Family)) {
        this.contactedByOthers = true;
      } else {
        this.socket.emit("add family", this.currentChild.FK_Family);
        this.contactedByOthers = false;
      }
    },

    datePick() {
      this.datePicker = false;
      setTimeout(() => {
        this.$refs.studyDate.focus();
      }, 100);
    },

    closeEmail() {
      this.dialogEmail = false;
    },

    nextContact() {
      this.e1 = 3;
    },

    async NoMoreContact() {
      if (
        await this.$refs.confirmD.open(
          "Remove this family from the database",
          "Can you confirm the removal?"
        )
      ) {
        var updatedFamilyInfo = {
          id: this.currentFamily.id,
          NextContactNote: "Parents asked to be removed from the database.",
          LastContactDate: moment()
            .startOf("day")
            .format("YYYY-MM-DD"),
          NoMoreContact: true,
        };

        try {
          await family.update(updatedFamilyInfo);

          // mark the child/family been scheduled. So no others will schedule this family again.
          this.currentChild.scheduled = true;

          Object.assign(this.Children[this.page - 1], this.currentChild);

          alert("This family is removed from the databased.");
        } catch (error) {
          console.log(error);
        }
      }
    },

    calendarDescription(notes, appointments) {
      const schedule = {
        Note: notes,
        Appointments: appointments,
      };
      var description = "<b>Note: </b>" + schedule.Note + "<br>";

      schedule.Appointments.forEach((appointment) => {
        description =
          description +
          "<br>==================" +
          "<br><b>" +
          appointment.Study.StudyName +
          "</b><br>" +
          "<b>E1: </b>" +
          appointment.E1 +
          "<br>" +
          "<b>E2: </b>" +
          appointment.E2 +
          "<br>";

        if (appointment.Study.StudyType == "Online")
          description =
            description +
            "<b>zoom link: </b>" +
            appointment.PrimaryExperimenter[0].ZoomLink;
      });

      return description;
    },
  },

  computed: {
    currentFamily() {
      if (this.currentChild) {
        return this.currentChild.Family;
      } else {
        return {
          NamePrimary: null,
          NameSecondary: null,
          Phone: null,
          Email: null,
        };
      }
    },

    studyDateTime() {
      if (this.studyTime && this.studyDate) {
        var StudyTimeString = this.studyTime.slice(0, 5);
        var AMPM = this.studyTime.slice(5, 7);
        var StudyHour = StudyTimeString.split(":")[0];
        var StudyMin = StudyTimeString.split(":")[1];

        switch (AMPM) {
          case "PM":
            if (parseInt(StudyHour) < 12) {
              StudyHour = parseInt(StudyHour) + 12;
            }
            break;

          case "AM":
            StudyHour = parseInt(StudyHour);
            break;
        }

        StudyMin = parseInt(StudyMin);
        var studyDateTime =
          new Date(this.studyDate).getTime() +
          StudyHour * 3600 * 1000 +
          StudyMin * 60000 +
          new Date(this.studyDate).getTimezoneOffset() * 60000;

        studyDateTime = new Date(studyDateTime);
        return studyDateTime;
      } else {
        return null;
      }
    },

    earliestDate: function() {
      if (
        moment()
          .add(1, "days")
          .isSameOrAfter(
            moment(this.currentChild.DoB, "YYYY-M-D").add(
              Math.floor(this.selectedStudy.MinAge * 30.5),
              "days"
            )
          )
      ) {
        return moment()
          .add(1, "days")
          .toISOString(true);
      } else {
        return moment(this.currentChild.DoB, "YYYY-M-D")
          .add(Math.floor(this.selectedStudy.MinAge * 30.5), "days")
          .toISOString(true);
      }
    },

    latestDate: function() {
      return moment(this.currentChild.DoB, "YYYY-M-D")
        .add(Math.floor(this.selectedStudy.MaxAge * 30.5), "days")
        .toISOString(true);
    },
  },

  mounted: function() {
    this.searchStudies();
    this.socket.on("familyList update", (familyList) => {
      this.currentVisitedFamilies = familyList;
      console.log(this.currentVisitedFamilies);
    });
  },

  created: function() {
    this.socket = io(backendURL);

    console.log(backendURL);
  },

  beforeDestroy: function() {
    // this.socket.emit("disconnect");
  },

  watch: {
    // $route(to, from) {
    //   console.log(to)
    //   console.log(from)
    //   if (to !== from) {
    //     this.socket.emit("disconnect");
    //   }
    // },

    dialogChildEdit(val) {
      val || this.closeChild();
    },

    dialogFamilyEdit(val) {
      val || this.closeFamily();
    },

    dialogSchedule(val) {
      val || this.closeSchedule();
    },

    training() {
      // console.log(`My store value for 'training' changed to ${val}`);
      this.currentChild = Object.assign({}, this.defaultItem);
      this.editedIndex = -1;

      this.Children = [];
      this.page = 0;
    },

    response(val) {
      switch (val) {
        case "Confirmed": {
          this.scheduleButtonIcon = "event";
          this.scheduleButtonTooltip = "Pick study date and time";
          this.scheduleButtonText = "Schedule";
          this.studyTime = null;
          this.emailType = "Confirmation";
          break;
        }
        case "Interested": {
          this.scheduleButtonIcon = "email";
          this.scheduleButtonTooltip =
            "Send a study intro email and set a reminder to follow up";
          this.scheduleButtonText = "Confirm a tentative appointment";
          this.studyTime = "";
          this.emailType = "Introduction";
          break;
        }

        case "Left a message": {
          this.scheduleButtonIcon = "email";
          this.scheduleButtonTooltip =
            "Note a phone message is left and set a reminder to follow up";
          this.scheduleButtonText = "Confirm a tentative appointment";
          this.studyTime = "";
          this.emailType = "Introduction";
          break;
        }

        case "Rejected": {
          this.scheduleButtonIcon = "";
          this.scheduleButtonTooltip = "Whatever, mark rejection";
          this.scheduleButtonText = "Confirm rejection";
          this.studyTime = "";
          this.emailType = "Introduction";
          break;
        }

        default:
          this.scheduleButtonIcon = "event";
          this.scheduleButtonTooltip = "";
          this.scheduleButtonText = "Schedule";
          this.studyTime = "";
          break;
      }
    },
  },
};
</script>

<style lang="scss" scoped></style>
