<template>
    <v-container>
        <v-row style="overflow-x: scroll; align-items: stretch">
            <v-col cols="12" md="3">
                <v-card
                    style="height: 176px !important; justify-content: space-around; align-content: center; display: flex; flex-wrap: wrap; ">
                    <v-tooltip top>
                        <template v-slot:activator="{ on }">
                            <div v-on="on">
                                <v-btn dark outlined class="c1" fab color="primary" x-large
                                    style="border-width: medium; border-style: dashed !important"
                                    @click.stop="createTestingRoom" :disabled="!labId">
                                    <v-icon dark>add</v-icon>
                                </v-btn>
                            </div>
                        </template>
                        <span>Add a testing room to this lab</span>
                    </v-tooltip>
                </v-card>
            </v-col>
            <v-col cols="12" md="3" v-for="testingRoom in testingRooms" :key="testingRoom.id">
                <v-card style="height: 176px !important; ">
                    <v-card-title>{{ testingRoom.name }}</v-card-title>
                    <v-card-text style="height: 100px !important; ">

                        <body align="start" v-html="testingRoomInfo(testingRoom)"></body>
                    </v-card-text>
                    <!-- style="display: flex !important; flex-wrap: wrap; align-content: center; justify-content: end;" -->


                    <v-card-actions
                        style="display: flex; flex-wrap: wrap; align-content: baseline; justify-content: space-around;">
                        <v-btn small color="primary" dark outlined @click="editTestingRoom(testingRoom)">Edit</v-btn>
                        <v-btn small color="warning" dark outlined @click="deleteTestingRoom(testingRoom)">Delete</v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>

        </v-row>
        <!-- additional card to add new room -->


        <!-- Pop-up dialog -->
        <v-dialog v-model="dialogVisible" max-width="500px">
            <v-card>
                <v-card-title>{{ dialogTitle }}</v-card-title>
                <v-card-text>
                    <v-form ref="formTestRoom" v-model="validTestRoom" lazy-validation>
                        <v-text-field hide-details :rules="$rules.required" v-model="currentTestingRoom.name"
                            label="Testing Room Name"></v-text-field>
                        <v-text-field hide-details :rules="$rules.required" v-model="currentTestingRoom.location"
                            label="Location"></v-text-field>
                        <v-text-field hide-details v-model="currentTestingRoom.calendarId"
                            label="Google Calendar ID (optional)"></v-text-field>
                    </v-form>
                </v-card-text>
                <v-card-actions
                    style="display: flex; flex-wrap: wrap; align-content: baseline; justify-content: space-around;">
                    <v-btn small color="primary" dark outlined @click="confirmChanges">Confirm</v-btn>
                    <v-btn small color="warning" dark outlined @click="cancelChanges">Cancel</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script>
import calendar from "../services/calendar";
import testingRoom from "@/services/testingRoom";

export default {
    props: {
        testingRooms: Array,
        labId: Number
    },
    data() {
        return {
            dialogVisible: false,
            dialogTitle: '',
            dialogName: '',
            dialogCalID: '',
            dialogLocation: '',
            currentTestingRoom: {
                name: '',
                location: '',
                calendarId: '',
                FK_Lab: this.labId
            },
            validTestRoom: false,
            testingRoomIndex: null,
        }
    },
    methods: {
        createTestingRoom() {
            this.dialogTitle = 'Create Testing Room';
            this.currentTestingRoom = {
                name: '',
                location: '',
                calendarId: '',
                FK_Lab: this.labId
            }

            this.dialogVisible = true;
        },
        editTestingRoom(testingRoom) {
            this.dialogTitle = 'Edit Testing Room';
            this.currentTestingRoom = testingRoom;
            this.testingRoomIndex = this.testingRooms.indexOf(testingRoom);
            this.dialogVisible = true;
        },
        deleteTestingRoom(testingRoom) {
            console.log(testingRoom)
            // Handle delete logic here
        },
        async confirmChanges() {
            const validationResults = this.$refs.formTestRoom.validate();

            if (validationResults) {

                if (this.dialogTitle === 'Create Testing Room') {
                    this.currentTestingRoom.createdBy = this.$store.state.userID;
                    this.currentTestingRoom.calendar = this.currentTestingRoom.name;

                    if (this.currentTestingRoom.calendarId === '') {
                        const newCal = await calendar.createSecondaryCalendar({ lab: this.$store.state.lab, calendarName: this.currentTestingRoom.name });
                        this.currentTestingRoom.calendarId = newCal.data.calendarId;
                    }

                    const createdTestingRoom = await testingRoom.create(this.currentTestingRoom);

                    this.testingRooms.push(createdTestingRoom.data);

                } else {
                    const updatedTestingRoom = {
                        id: this.currentTestingRoom.id,
                        name: this.currentTestingRoom.name,
                        location: this.currentTestingRoom.location,
                        calendarId: this.currentTestingRoom.calendarId,
                        createdBy: this.$store.state.userID,
                        calendar: this.currentTestingRoom.name
                    }

                    await testingRoom.update(updatedTestingRoom);

                    this.testingRooms[this.testingRoomIndex] = this.currentTestingRoom;
                }

                this.$store.dispatch("setTestingRooms", this.testingRooms);
                this.dialogVisible = false;
            }
        },
        cancelChanges() {
            // Handle cancel logic here
            this.dialogVisible = false;
        },
        testingRoomInfo(testingRoom) {
            const studiesInthisRoom = this.$store.state.studies.filter(study => study.FK_TestingRoom === testingRoom.id)

            return `
            <div>
                <div><strong>Location: </strong> ${testingRoom.location}</div>
                <div><strong>Number of studies: </strong> ${studiesInthisRoom.length || 0}</div>
            </div>
            `
        }
    }
}
</script>