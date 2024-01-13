<!-- todo, no need to choose Experimenters when the status is not confirmed. E1 is required when the status is confirmed.-->

<template>
    <v-container style="padding: 0px !important; flex-direction: column;">
        <h2 class=" text-left" style="margin-right: 0px;">
            Appointment details:
        </h2>

        <!-- Appointment Data Table -->
        <v-container>
            <v-data-table class="noFooterTable" :headers="apptHeaders" :items="editedAppointments" hide-default-footer>

                <!-- study & dropbox -->
                <template v-slot:[`item.studyName`]="{ item, index }">
                    <div v-if=false>{{ item.Study.StudyName }}
                    </div>
                    <div v-else>
                        <v-select filled dense outlined
                            :items="potentialStudies(item.Child, item.FK_Study).potentialStudyList" :item-value="'id'"
                            :item-text="'StudyName'" v-model="selectedStudies[index]" return-object label="Study"
                            hide-details @change="optionChangedStudy($event, index, item)"
                            :disabled="index == 0"></v-select>
                    </div>
                </template>

                <!-- primary experimenter -->
                <template v-slot:[`item.experimenter1`]="{ index }">
                    <v-select filled dense outlined :items="optionsE1[index]" :item-value="'id'" :item-text="'Name'"
                        v-model="selectedExperimenters[index]" label="E1" hide-details return-object
                        @change="optionChangedE1($event, index)"></v-select>
                </template>

                <!-- assistant experimenters -->
                <template v-slot:[`item.experimenter2`]="{ index }">
                    <v-select filled dense outlined :items="optionsE2[index]" :item-value="'id'" :item-text="'Name'"
                        v-model="selectedExperimenters_2nd[index]" label="E2" multiple hide-details return-object
                        @change="optionChangedE2($event, index)">
                    </v-select>
                </template>

                <template v-slot:[`item.actions`]="{ item, index }">
                    <v-container style="display: flex; padding: 8px 0px; align-items: center; justify-content: center;">

                        <!-- select appointment status, when updating existing schedules. During creating new schedules, the status will inherit schedule status and won't be able to change. -->
                        <v-select filled dense outlined :items="statusOptions" label="Appointment status"
                            v-model="item.status" hide-details style="width: 75%"
                            @change="optionChangedStatus($event, item)" :key="item.status"
                            :disabled="scheduleType === 'create'"></v-select>
                        <v-spacer></v-spacer>

                        <!-- delete button, only functional to the currently added appointments. You can not delete appointment that was booked before. -->
                        <v-tooltip top>
                            <template v-slot:activator="{ on }">
                                <div v-on="on" style="align-self: end">
                                    <v-btn text icon color="primary" @click="deletCurrentAppointment(index)"
                                        :disabled="appointmentDeletable(item, index)">
                                        <v-icon>{{ appointmentDeletable(item, index) ? "mdi-delete-off" : "mdi-delete"
                                        }}</v-icon>
                                    </v-btn>
                                </div>
                            </template>

                            <body>You can only delete the appointment created in this session.<br> To cancel any previously
                                booked appointment, choose CANCEL in the dropdown menu.</body>
                        </v-tooltip>
                    </v-container>
                </template>

            </v-data-table>
        </v-container>

        <!-- additional possible appointments -->
        <v-divider style="margin-bottom: 20px"></v-divider>

        <v-row dense align="baseline" justify="start" style="height: 80px">
            <h2 class="text-left" style="margin-right: 16px;">Additional appointment(s) for:</h2>
            <v-col cols="12" md="2" class="centerCol" v-for="(child, index) in Children" :key="child.id">

                <!-- Tooltip for child appointment -->
                <v-tooltip bottom>
                    <template v-slot:activator="{ on }">
                        <div v-on="on" style="align-self: end">
                            <!-- Button to create new appointment -->
                            <v-btn class="text-capitalize" large rounded color="primary" @click="newAppointment(child)"
                                :disabled="nSelectableStudies[index] < 1 || parentResponse == 'Rejected' || additionalStudyButtonDisable">
                                <!-- Display child's name -->
                                {{
                                    !!child.Name ? child.Name.split(" ")[0] : "Name is missing"
                                }}
                                <!-- Display number of selectable studies -->
                                <v-icon size="28px" right v-if="nSelectableStudies[index] < 10">
                                    {{ "mdi-numeric-" +
                                        nSelectableStudies[index] + "-circle-outline" }}
                                </v-icon>
                                <v-icon size="28px" right v-else>
                                    {{ "mdi-numeric-9-plus-circle-outline" }}
                                </v-icon>
                            </v-btn>
                        </div>
                    </template>

                    <!-- Child's information -->

                    <body align="start" v-html="childPopUpInfo(child)" />
                </v-tooltip>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import moment from "moment";
import { childAge } from '@/assets/JS/displayFunctions.js';

export default {
    props: {
        Appointments: Array,
        Children: Array,
        targetChild: Object,
        scheduleType: String,
        parentResponse: String
    },
    data() {
        return {
            editedAppointments: [],
            apptHeaders: [
                { text: "Child", align: "center", value: "Child.Name", width: "10%", sortable: false, },
                {
                    text: "Study",
                    align: "center",
                    value: "studyName",
                    width: "10%",
                    sortable: false,
                },
                {
                    text: "Experimenter",
                    align: "center",
                    value: "experimenter1",
                    sortable: false,
                    width: "15%",
                },
                {
                    text: "Asst. Experimenter",
                    align: "center",
                    value: "experimenter2",
                    sortable: false,
                    width: "15%",
                },
                {
                    text: "Actions",
                    align: "center",
                    value: "actions",
                    sortable: false,
                    width: "25%",
                }

            ], // headers for the appointment data table
            selectedExperimenters: [],
            selectedExperimenters_2nd: [],
            selectedStudies: [], //[{"Study": {"Experimenters":[]}}] // studies assigned to children within the family in the current schedule. element study should be object.
            optionsE1: [],
            optionsE2: [],
            nSelectableStudies: [],
            deletedAppointments: [],
            additionalStudyButtonDisable: false,
        }
    },
    methods: {
        // imported functions
        childAge,

        // generate the list of studies the current child can participate in
        // child: an object of child including appointment information
        // currentStudies, the list of studies have been selected for this cihld
        potentialStudies(child, bookedStudy) {
            var eligibleStudies = [];

            // get the list of studies the child is eligible for, regardless if the child has participated in the study before.
            this.$store.state.studies.forEach((study) => {
                if (this.studyElegibility(study, child)) {
                    eligibleStudies.push(study.id);
                }
            });

            // get the list of studies the child has participated before
            var uniquePreviousStudies = [];

            if (child.Appointments) {
                child.Appointments.forEach((appointment) => {
                    uniquePreviousStudies.push(appointment.FK_Study);
                });

                uniquePreviousStudies = Array.from(new Set(uniquePreviousStudies));
            }

            if (bookedStudy) {
                const index = uniquePreviousStudies.indexOf(bookedStudy);

                uniquePreviousStudies.splice(index, 1);
            }

            // remove the previously participated studies from the list of eligible studies
            var potentialStudies = eligibleStudies.filter(
                (study) => !uniquePreviousStudies.includes(study)
            );

            // check the currently selected studies in the appointment table, and update the selectable studies.
            var currentSelectedStudies = [];
            this.editedAppointments.forEach((appointment) => {
                if (appointment.FK_Child === child.id) { currentSelectedStudies.push(appointment.FK_Study) }
            })

            var selectableStudies = potentialStudies.filter(
                (study) => !currentSelectedStudies.includes(study)
            );

            // get the list of potential study object
            var potentialStudyList = this.$store.state.studies.filter((study) =>
                potentialStudies.includes(study.id)
            );

            return {
                potentialStudyList: potentialStudyList,
                selectableStudies: selectableStudies,
            };
        },

        studyElegibility(study, child) {
            if (child.DoB != null) {
                var age =
                    child.Age >= study.MinAge * 30.5 - 1 && child.Age <= study.MaxAge * 30.5 - 1;

                var asd = false;

                switch (study.ASDParticipant) {
                    case "Only":
                        child.Family.AutismHistory ? (asd = true) : (asd = false);
                        break;

                    case "Exclude":
                        child.Family.AutismHistory ? (asd = false) : (asd = true);

                        break;

                    case "Include":
                        asd = true;
                        break;
                }

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

                return age && asd && hearing && vision && premature && illness;
            } else {
                return false;
            }
        },

        optionChangedStatus(newVal, changedItem) {

            switch (newVal) {

                // if any appointment is set to be cancelled or No show, the status of all appointment of this schedule will be set the same.
                case "Cancelled":
                case "No show":
                case "Confirmed":
                case "Interested":
                case "Left a message":
                case "Rejected":
                    this.editedAppointments.forEach(item => {
                        if (item.id !== changedItem.id) {
                            item.status = newVal;
                        }
                    });
                    break;

                default:
                    changedItem.status = newVal;
                    this.editedAppointments.forEach(item => {
                        if (item.id !== changedItem.id) {
                            if (item.status === 'Cancelled' | item.status === 'No show') {
                                item.status = null;
                            }
                        }
                    });
                    break;
            }

            // to determine if setting up a day / time is necessary by issuing a signal to the dateTimePicker component
            if (this.editedAppointments.some(appointment => appointment.status === "Update appointment time" || appointment.status === "Confirmed")) {
                this.$emit("dateTimePickerDisableUpdate", false) // enable the date/time input
                this.additionalStudyButtonDisable = false;
            }
            else {
                this.$emit("dateTimePickerDisableUpdate", true) // disable the date/time input
                this.additionalStudyButtonDisable = true;
            }

            // check if all conditions per appointment are met to create a schedule
            this.readyToCreateSchedule();
        },

        optionChangedStudy(newVal, index) {

            // update experimenters for the selected study
            this.optionsE1[index] = newVal.Experimenters;
            this.optionsE2[index] = newVal.Experimenters;

            this.optionsE2[index] = this.selectedStudies[index].Experimenters.filter(experimenter => this.selectedExperimenters[index].id !== experimenter.id);
            this.optionsE1[index] = this.selectedStudies[index].Experimenters.filter(experimenter => !this.selectedExperimenters_2nd[index].some(experimenter2nd => experimenter2nd.id === experimenter.id));

            // update possible studies for this child
            this.editedAppointments[index].FK_Study = newVal.id;

            this.readyToCreateSchedule();

            // update the disabled status of the buttons to add additional appointmet.
            this.nSelectableStudies = this.Children.map(child => {
                return this.potentialStudies(child).selectableStudies.length
            })

        },

        optionChangedE1(newVal, index) {

            this.optionsE2[index] = this.selectedStudies[index].Experimenters.filter(experimenter => newVal.id !== experimenter.id);

            this.readyToCreateSchedule();

        },

        optionChangedE2(newVal, index) {

            this.optionsE1[index] = this.selectedStudies[index].Experimenters.filter(experimenter => !newVal.some(experimenter2nd => experimenter2nd.id === experimenter.id));

            this.readyToCreateSchedule();

        },

        newAppointment(child) {
            const newAppointment = {
                FK_Child: child.id,
                FK_Family: child.FK_Family,
                FK_Schedule: this.editedAppointments[0].FK_Schedule || null,
                Child: child
            }

            if (this.scheduleType === 'create') {
                newAppointment.status = this.editedAppointments[0].status // copy the status from the first appointment of the schedule
            } else {
                newAppointment.status = null
            }

            // when creating a new study, create experimenters
            this.selectedExperimenters.push({});
            this.selectedExperimenters_2nd.push([]);

            this.editedAppointments.push(newAppointment)
        },

        deletCurrentAppointment(index) {
            if (this.editedAppointments[index].id) { this.deletedAppointments.push(this.editedAppointments[index].id) }

            this.editedAppointments.splice(index, 1)
        },

        readyToCreateSchedule() {
            // this function examines if the information to create a schedule is met. If so, it will emit the enable status to the parent component.

            if (this.editedAppointments.every(appointment => 'status' in appointment && appointment.status != null)) {
                if (this.scheduleType === 'create') {
                    switch (this.parentResponse) {

                        case 'Confirmed':
                            this.checkAppointmentsAssignedStudy && this.checkAppointmentsAssignedExperimenter && this.checkAppointmentsAssignedStatus ? this.$emit("readyToCreateSchedule", true) : this.$emit("readyToCreateSchedule", false)
                            break;

                        case 'Interested':
                        case 'Left a message':
                        case 'Rejected':
                            this.checkAppointmentsAssignedStudy && this.checkAppointmentsAssignedStatus ? this.$emit("readyToCreateSchedule", true) : this.$emit("readyToCreateSchedule", false)
                            break;
                    }
                } else {

                    if (this.editedAppointments.some(appointment => appointment.status === "Update appointment time")) {
                        this.checkAppointmentsAssignedStudy && this.checkAppointmentsAssignedExperimenter && this.checkAppointmentsAssignedStatus ? this.$emit("readyToCreateSchedule", true) : this.$emit("readyToCreateSchedule", false)
                    } else {
                        this.checkAppointmentsAssignedStudy && this.checkAppointmentsAssignedStatus ? this.$emit("readyToCreateSchedule", true) : this.$emit("readyToCreateSchedule", false)
                    }

                }
            } else {
                this.$emit("readyToCreateSchedule", false)
            }
        },

        // check if all appointments have been assigned a study
        checkAppointmentsAssignedStudy() {
            const allAssigned = this.editedAppointments.every(appointment => appointment.FK_Study != null);
            return allAssigned;
        },

        // check if all appointments have been assigned a primary experimenter
        checkAppointmentsAssignedExperimenter() {

            const allAssigned = this.editedAppointments.some((appointment, index) => (appointment.status === "Update appointment time" || appointment.status === "Confirmed") && this.selectedExperimenters[index] !== null)

            // const allAssigned = this.selectedExperimenters.every(Experimenters => Experimenters != null);
            return allAssigned;
        },

        checkAppointmentsAssignedStatus() {
            const allAssigned = this.editedAppointments.every(appointment => appointment.status != null);
            return allAssigned;
        },

        generateAppointments() {
            // add variables to the editedAppointments array: Experimenter, SecondaryExperimenter, Study, and Child
            this.editedAppointments.forEach((appointment, index) => {
                appointment.PrimaryExperimenter = [this.selectedExperimenters[index]];
                appointment.SecondaryExperimenter = this.selectedExperimenters_2nd[index];
                appointment.FK_Study = this.selectedStudies[index].id;
                appointment.Study = this.selectedStudies[index];
                appointment.E1 = this.selectedExperimenters[index].Name + " (" + this.selectedExperimenters[index].Email + ")";

                const experimenterNames_2nd = this.selectedExperimenters_2nd[index].map((experimenter) => {
                    return experimenter.Name + " (" + experimenter.Email + ")";
                });
                appointment.E2 = experimenterNames_2nd.join(", ");
            })

            // Get the unique status values from the editedAppointments array
            const statusValues = [...new Set(this.editedAppointments.map(appointment => appointment.status))];

            var updatedAppointments = []; // appointments that need to be updated with the same schedule ID
            var newAppointments = []; // appointments that need to be created with a new schedule ID
            var completedAppointments = []; // appointments that need to be completed

            if (statusValues.length > 1) {
                // when appointments within a schedule have different status (e.g., one completes, the other needs to be rescheduled).
                // This situation should only happen when updating existing schedules, not when creating new schedules.

                // Separate the array based on the status values
                newAppointments = this.editedAppointments.filter(appointment => appointment.status === 'Update appointment time' || appointment.status === 'Reschedule (need to follow-up)');

                completedAppointments = this.editedAppointments.filter(appointment => appointment.status === 'Completed');
            }

            else { // when all appointments within a schedule share the same status.

                switch (statusValues[0]) {
                    // the following status belong to updating existing schedules, not creating new schedules.
                    case 'Update appointment time':
                    case 'Reschedule (need to follow-up)':
                    case 'Cancelled':
                    case 'No show':
                        updatedAppointments = this.editedAppointments;
                        break

                    // the following status belong to creating new schedules, not updating existing schedules.
                    case 'Confirmed':
                    case "Interested":
                    case "Left a message":
                    case 'Rejected':
                        newAppointments = this.editedAppointments;
                        break;

                    case 'Completed':
                        completedAppointments = this.editedAppointments;
                        break;

                }

            }

            updatedAppointments.forEach(appointment => {
                appointment.attendees = this.generateAttendees(appointment);
            })
            newAppointments.forEach(appointment => {
                appointment.attendees = this.generateAttendees(appointment);
            })

            //
            const deletedAppointments = this.deletedAppointments

            return { updatedAppointments, newAppointments, deletedAppointments, completedAppointments }

        },

        assignStudyExperimenters() {

            this.editedAppointments = JSON.parse(JSON.stringify(this.Appointments));
            this.editedAppointments.forEach((appointment, index) => {
                // appointment.status = "Confirmed"; // ToDo, needs to update the status from the schedule. parentResponse
                this.selectedStudies[index] = Object.assign({}, appointment.Study);
                this.selectedExperimenters[index] = Object.assign({}, appointment.PrimaryExperimenter[0]);
                this.selectedExperimenters_2nd[index] = appointment.SecondaryExperimenter;
                this.optionsE2[index] = this.selectedStudies[index].Experimenters.filter(experimenter => this.selectedExperimenters[index].id !== experimenter.id);
                this.optionsE1[index] = this.selectedStudies[index].Experimenters.filter(experimenter => !this.selectedExperimenters_2nd[index].some(experimenter2nd => experimenter2nd.id === experimenter.id));
            })
        },

        appointmentDeletable(item, index) {
            // if an appointment was created before today, it won't be deletable.

            var differentDays = 0;
            if (item.createdAt) {
                differentDays = moment
                    .duration(
                        moment(item.createdAt)
                            .startOf("day")
                            .diff(moment().startOf("day"))
                    )
                    .asDays()
            }

            if (differentDays < 0 || index == 0) {
                return true
            } else {
                return false
            }

        },

        generateAttendees(appointment) {
            // this function generates the attendees for the google calendar event

            var attendees = [];

            appointment.PrimaryExperimenter.forEach((experimenter) => {
                attendees.push({
                    displayName: experimenter.Name,
                    email: experimenter.Calendar,
                });
            })
            appointment.SecondaryExperimenter.forEach((experimenter) => {
                attendees.push({
                    displayName: experimenter.Name,
                    email: experimenter.Calendar,
                });
            });

            return attendees;
        },

        childPopUpInfo(child) {
            const nPreviousParticipation = child.Appointments.length
            return '<strong>Age:  </strong>' + childAge(child) + "<br><strong>Gender: </strong>" + child.Sex + "<br><strong>Participation (N): </strong>" + nPreviousParticipation
        },

        resetVariables() {
            this.nSelectableStudies = [];
            this.deletedAppointments = [];
            this.additionalStudyButtonDisable = false;
        },

    },

    computed: {
        statusOptions() {
            var statusOptions = [];

            switch (this.scheduleType) {

                case 'create':
                    statusOptions = ["Confirmed", "Interested", "Left a message", "Rejected"];
                    break;

                case 'update':
                    statusOptions = ["Update appointment time", "Reschedule (need to follow-up)", "No show", "Cancelled", "Completed"];
                    break;

            }

            return statusOptions;
        }
    },

    watch: {
        Appointments(newVal) {

            if (newVal) {
                this.assignStudyExperimenters();
                this.resetVariables();
            }
        },

        editedAppointments() {

            this.nSelectableStudies = this.Children.map(child => {
                return this.potentialStudies(child).selectableStudies.length
            })
        }
    },

    mounted() {
        this.assignStudyExperimenters()
    }
}
</script>
