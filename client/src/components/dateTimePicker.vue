<template>
    <v-form v-model="validScheduleDateTime" lazy-validation>
        <v-container
            style="padding: 0px !important; display: flex; flex-wrap: wrap; justify-content: start; align-items: center; gap: 40px; height:80px">
            <h2 class="text-left" style="margin-right: 0px;">Study date & time:
            </h2>

            <v-text-field filled dense outlined ref="studyDate" label="Study date (YYYY-MM-DD)" v-model="studyDate"
                :rules="$rules.dob" :disabled="dateTimePickerDisable" hide-details prepend-inner-icon="mdi-calendar"
                @click:prepend-inner="datePicker = true" @click="datePicker = true"></v-text-field>

            <v-combobox v-model="studyTime" :items="$studyTimeSlots" :rules="$rules.time" label="Study time"
                prepend-inner-icon="mdi-clock-time-nine-outline" :disabled="dateTimePickerDisable" hide-details filled dense
                outlined></v-combobox>
            <v-spacer></v-spacer>

            <!-- <v-tooltip right>
                        <template v-slot:activator="{ on }">
                            <div v-on="on">
                                <v-checkbox style="padding: 4px !important" label="Skip study date/time" class="ma-0 pa-0"
                                    :value="skipStudyDateTimeStatus" @change="skipStudyDateTime()" hide-details
                                    dense></v-checkbox>
                            </div>
                        </template>
                        <span>Check this box to use current date/time for the current
                            appointment.<br />NO Google Calendar event will be
                            created.</span>
                    </v-tooltip>
                    <v-tooltip right>
                        <template v-slot:activator="{ on }">
                            <div v-on="on">
                                <v-checkbox style="padding: 4px !important" label="Skip reminder email" class="ma-0 pa-0"
                                    :value="skipReminderEmailStatus" @change="skipReminderEmail()" hide-details
                                    dense></v-checkbox>
                            </div>
                        </template>
                        <span>Check this box to prevent reminder email from being sent to
                            the participant.</span>
                    </v-tooltip> -->

            <v-dialog v-model="datePicker" max-width="290px">
                <v-card outlined>
                    <v-date-picker v-model="studyDate" show-current @click:date="datePick"></v-date-picker>
                </v-card>
            </v-dialog>
        </v-container>
    </v-form>
</template>

<script>
import moment from "moment";

export default {
    props: {
        dateTimePickerDisable: Boolean,
        appointmentTime: String,
    },
    data() {
        return {
            datePicker: false,
            validScheduleDateTime: true,
            studyDate: null,
            studyTime: null,
        }
    },
    methods: {
        datePick() {
            this.datePicker = false;
            setTimeout(() => {
                this.$refs.studyDate.focus();
            }, 100);
        },

        extractHourAndMinute(timeString) {
            const parts = timeString.split(':');
            let hour = parseInt(parts[0], 10);
            const minute = parseInt(parts[1].substring(0, 2), 10);
            const amPm = parts[1].substring(2).toUpperCase();

            if (amPm === 'PM' && hour !== 12) {
                hour += 12;
            } else if (amPm === 'AM' && hour === 12) {
                hour = 0;
            }

            return { hour, minute };
        },

        studyDateTime() {
            if (this.studyTime && this.studyDate) {
                const { hour, minute } = this.extractHourAndMinute(this.studyTime)

                const StudyHour = hour.toString().padStart(2, '0');
                const StudyMin = minute.toString().padStart(2, '0');

                const studyDateTime = this.studyDate + "T" + StudyHour + ":" + StudyMin;

                return studyDateTime;

            } else {
                return null;

            }
        },

        resetDateTime() {
            this.studyTime = null;
            this.studyDate = null
        },

        assignDateTime() {
            if (this.appointmentTime) {
                this.studyDate = moment(this.appointmentTime).format("YYYY-MM-DD");
                this.studyTime = moment(this.appointmentTime).format("hh:mmA");
            }
        }
    },
    watch: {
        dateTimePickerDisable(newVal) {

            if (newVal) {
                this.resetDateTime()
            }
        },
        appointmentTime(newVal) {

            if (newVal) {
                this.assignDateTime()
            }
        }
    },
    mounted() {
        this.assignDateTime()
    }
}
</script>