<template>
    <div style="margin: 0px">
        <!-- Main Data Table -->

        <v-data-table :headers="headers" :items="Schedules" :items-per-page=parseInt(nofItems) class="elevation-1"
            single-select no-data-text="No study appointment to display." item-key="id" single-expand
            @click:row="rowSelected" :footer-props="{
                'items-per-page-text': 'Schedules per page:',
                'items-per-page-options': [parseInt(this.nofItems), 2 * parseInt(this.nofItems)],
                // 'disable-items-per-page': true,
            }">

            <!-- appointment info -->
            <template v-slot:[`item.participantInfo`]="{ item, row }">
                <v-container style="display: flex; align-items: center; flex-wrap: wrap;">

                    <body align="start" v-html="apptInfo(item)"></body>
                    <v-spacer></v-spacer>
                    <v-btn dark outlined x-small @click="rowSelected(item, row)">
                        details...
                    </v-btn>
                    <v-divider style="margin: 8px 12px; flex: 0 0 100%;"></v-divider>

                    <body align="start" v-html="parentContact(item.Family)"></body>
                    <v-spacer></v-spacer>

                    <body align="start" v-html="familyID(item.Family)"></body>

                </v-container>

            </template>

            <!-- appointment time -->
            <template v-slot:[`item.AppointmentTime`]="{ item, value }">
                <DateDisplay :date="value" :format="'long'" :status="item.Status" style="font-weight: 500;" />

                <body class="labTag">{{ "Lab: " + item.Appointments[0].Study.Lab.PI }}</body>
            </template>

            <!-- appointment status -->
            <template v-slot:[`item.Status`]="{ item }">
                <v-chip :color="getColor(item.Status, item.Completed)" dark>
                    {{ item.Status == "Confirmed" && item.Completed ? "Completed" : item.Status }}
                </v-chip>
            </template>

            <!-- action buttons -->
            <template v-slot:[`item.actions`]="{ item }">
                <v-container style="display: flex; align-items: center;  justify-content: center; flex-wrap: wrap;">
                    <v-tooltip top>
                        <template v-slot:activator="{ on }">
                            <div v-on="on" style="align-self: end">
                                <v-btn fab outlined @click.stop="showDialog(item, 'schedule')" class="tableIcon"
                                    :disabled="item.Status === 'Confirmed' && item.Completed === true">
                                    <v-icon>mdi-autorenew</v-icon>
                                </v-btn>
                            </div>
                        </template>
                        <span>Update the current appointment</span>
                    </v-tooltip>

                    <v-divider class="mx-4" vertical></v-divider>

                    <v-tooltip top>
                        <template v-slot:activator="{ on }">
                            <div v-on="on" style="align-self: end">
                                <v-btn fab outlined class="tableIcon" @click.stop="showDialog(item, 'email')"
                                    :disabled="item.Status === 'Confirmed' && item.Completed === true">
                                    <v-icon dark>
                                        mdi-email
                                    </v-icon>
                                </v-btn>
                            </div>
                        </template>
                        <span>Email the family regarding the current appointment</span>
                    </v-tooltip>
                </v-container>
            </template>

            <!-- expand box -->
            <template #expanded-item="{ item }">
                <v-container style="display: flex; width: 160%">

                    <body style="flex: 0 0 30%" class="detailBox" align="start"
                        v-for="(appointment) in experimenterInfo(item)" v-html="appointment" :key="appointment.id">
                    </body>
                    <v-divider class="mx-4" v-show="item.Note" vertical></v-divider>

                    <body class="detailBox" align="start" v-html="'<strong>Note:</strong><br>' + item.Note"
                        v-show="item.Note" style="flex: 0 0 40%">
                    </body>
                    <v-spacer></v-spacer>
                    <v-divider class="mx-4" vertical></v-divider>

                    <!-- todo, working on the editing popup window. -->
                    <v-tooltip top>
                        <template v-slot:activator="{ on }">
                            <div v-on="on" style="align-self: end">
                                <v-btn fab outlined v-show="false" class="tableIcon"
                                    @click.stop="showAlert('WIP, an family info editing page will show up.')">
                                    <v-icon dark>
                                        mdi-pencil-outline
                                    </v-icon>
                                </v-btn>
                            </div>
                        </template>
                        <span>Update family information</span>
                    </v-tooltip>
                </v-container>
            </template>

        </v-data-table>

        <!-- Dialog Component, to create or update a schedule -->
        <scheduleDialog ref="scheduleDialog" :dialog="dialog" :currentSchedule="currentSchedule" :dialogType="dialogType"
            :currentFamily="currentSchedule.Family" :scheduleType="scheduleType" @close-dialog="closeDialog()"
            @newAppointment="addAppointment" @deleteCurrentAppointment="deleteCurrentAppointment" @newSchedule="addSchedule"
            @updatedSchedule="updatedSchedule" @completedSchedule="completedSchedule" />
    </div>
</template>
  
<script>
import scheduleDialog from '@/components/scheduleDialog.vue';
import DateDisplay from '@/components/DateDisplay.vue';
import { childAge } from '@/assets/JS/displayFunctions.js';
import { childStudyAge } from '@/assets/JS/displayFunctions.js';

export default {
    props: {
        Schedules: Array,
        tableHeight: String,
        nofItems: String,
    },

    components: {
        scheduleDialog,
        DateDisplay
    },
    data: () => ({
        dialog: false,
        dialogType: null,
        scheduleType: 'update',
        currentSchedule: {
            FK_Family: 1,
            Family: { NamePrimary: "" },
            Note: "",
            Appointments: [
                {
                    FK_Family: 1,
                    Study: { EmailTemplate: "" },
                    Family: { NamePrimary: "" },
                    Child: { Name: "" },
                },
            ],
        },
        headers: [
            {
                text: "Study Time",
                align: "center",
                value: "AppointmentTime",
                width: "13%",
            }, {
                text: "Participant Info",
                align: "center",
                value: "participantInfo",
                width: "45%",
            },

            {
                text: "Status",
                align: "center",
                value: "Status",
                width: "10%",
            },
            {
                text: "Actions",
                align: "center",
                value: "actions",
                sortable: false,
                width: "15%",
            },

        ], // headers for your main data table
    }),
    methods: {
        // imported functions
        childAge,

        showDialog(item, dialogType) {
            this.currentSchedule = item;
            this.dialogType = dialogType
            this.dialog = true;

            this.$refs.scheduleDialog.initiateVariables(this.dialogType);

            if (this.dialogType === "email") {
                if (this.currentSchedule.Status === "Confirmed" && this.currentSchedule.Completed === true) {
                    this.$refs.scheduleDialog.emailType = "ThankYou";
                }

                if (this.currentSchedule.Status === "TBA" || this.currentSchedule.Status === "Rescheduling" || this.currentSchedule.Status === "No Show" || this.currentSchedule.Status === "Cancelled") {
                    this.$refs.scheduleDialog.emailType = "Follow-up";
                    console.log(this.$refs.scheduleDialog.emailType);
                }
            }
        },

        addAppointment(appointment) {
            this.currentSchedule.Appointments.push(appointment);
        },

        deleteCurrentAppointment(index) {
            this.currentSchedule.Appointments.splice(index, 1);
        },

        addSchedule(schedule) {
            this.$emit("updatedSchedule", schedule);
        },

        updatedSchedule(schedule) {
            this.$emit("updatedSchedule", schedule);

        },

        completedSchedule(schedule) {
            this.$emit("updatedSchedule", schedule);
        },

        parentContact(Family) {

            var formated = "<strong>Parent: </strong>" + Family.NamePrimary + '<br>';

            formated = formated + "<strong>Phone: </strong>" + this.PhoneFormated(Family.Phone) + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Email: </strong>" + Family.Email;
            return formated;
        },
        familyID(Family) {
            return "<span style='font-size: 18px; font-weight: 700;''>family ID: " + Family.id + "</span>"
        },
        apptInfo(item) {

            var apptInfo = [];
            item.Appointments.forEach((appointment, index) => {
                var appointmentInfo = "<strong>" + (index + 1) + ". </strong> "

                if (item.AppointmentTime) {
                    let age = this.childStudyAge(appointment.Child, item.AppointmentTime);
                } else {
                    let age = this.childAge(appointment.Child);
                }

                const childInfo = "<span style='font-size: 20px; font-weight: 700'>" + appointment.Child.Name + "</span> (" + age + ", " + appointment.Child.Sex + ")";

                appointmentInfo = appointmentInfo +
                    childInfo + " <b style='font-size: 20px;'><i>==>  " + appointment.Study.StudyName + "</i></b><br>"
                // + "</span> (" + appointment.Study.StudyType + ")<br>"

                apptInfo.push(appointmentInfo);
            });

            return apptInfo.join('');
        },
        ExperimentersNames(appointment, index) {
            var testingRoom = null
            //  this.$store.state.testingRooms.find(room => room.id === appointment.Study.FK_TestingRoom);

            let testingRoomLocation = "<strong>Room: </strong> NA"

            if (testingRoom) {
                testingRoomLocation = "<strong>Room: </strong>" +
                    testingRoom.name
            }

            var E1 = "not assigned";
            if (appointment.PrimaryExperimenter.length > 0) {
                E1 = appointment.PrimaryExperimenter[0].Name;
            }

            var E2 = appointment.SecondaryExperimenter.map((experimenter) => {
                return experimenter.Name;
            });

            var E22 = "";
            if (appointment.SecondaryExperimenter.length > 0) {
                E22 = E2.join(", ");
            } else {
                E22 = "not assigned";
            }

            var body =
                "<strong>Appt. " + (index + 1) + ": </strong>" +
                appointment.Study.StudyName +
                "</strong> (" +
                appointment.Study.StudyType +
                ")" +
                "<br>" +
                testingRoomLocation +
                "<br>" +
                "<strong>E1:</strong> " +
                E1 +
                "<br>" +
                "<strong>E2:</strong> " +
                E22;

            if (
                appointment.PrimaryExperimenter.length > 0 &&
                appointment.Study.StudyType == "Online"
            ) {
                body =
                    body +
                    "<br>" +
                    "<strong><a href='" +
                    appointment.PrimaryExperimenter[0].ZoomLink +
                    "' target='_blank' >" +
                    "Zoom Link" +
                    "</a></strong>";
            }
            return body;
        },
        experimenterInfo(item) {
            var experimenterInfo = []

            item.Appointments.forEach((appointment, index) => {
                var expInfo = this.ExperimentersNames(appointment, index);
                experimenterInfo.push(expInfo)
            });

            return experimenterInfo
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

        getColor(status, completed) {
            var color = "";
            switch (status) {
                case "Completed":
                    color = "#01579B";
                    break;
                case "Confirmed":
                    if (completed) {
                        color = "#01579B";
                    } else {
                        color = "light-blue accent-2";
                    }
                    break;
                case "TBD":
                    color = "teal darken-2";
                    break;
                case "Rescheduling":
                    color = "lime darken-3";
                    break;
                case "No Show":
                    color = "orange darken-3";
                    break;
                case "Cancelled":
                    color = "deep-orange darken-1";
                    break;
                case "Rejected":
                    color = "blue-grey darken-4";
                    break;
            }

            return color;
        },

        rowSelected(item, row) {
            if (row) {
                row.select(true);
                row.expand(!row.isExpanded);
                this.$emit("rowSelected", item.Family, this.Schedules.indexOf(item));
            }
        },

        closeDialog() {
            this.dialog = false;
            this.dialogType = null;
            // this.currentSchedule = {
            //     FK_Family: 1,
            //     Family: { NamePrimary: "" },
            //     Appointments: [
            //         {
            //             FK_Family: 1,
            //             Study: { EmailTemplate: "" },
            //             Family: { NamePrimary: "" },
            //             Child: { Name: "" },
            //         },
            //     ],
            // };
        }
    },

    computed: {
        // itemsPerPage(){
        //     const itemsPerPage = parseInt(this.nofItems);
        //     return [itemsPerPage, 2 * itemsPerPage];
        // }
    }
};
</script>

<style scoped>
.detailBox {
    color: var(--v-primary-base);
    margin: 8px !important;
}

.labTag {
    font-size: 12px;
    font-weight: 500;
    /* color: var(--v-primary-base); */
    border: 1px solid;
    /* Black border */
    border-radius: 10px;
    /* Rounded corners */
}
</style>
