<template>
    <v-container class="pa-0">
        <ConfirmDlg ref="confirmD" />

        <div class="d-flex flex-wrap" style="gap: 16px;">
            <!-- Add New Room Card -->
            <div class="room-card room-card-add" @click="createTestingRoom" :class="{ disabled: !labId }">
                <div class="room-card-add-inner">
                    <v-icon size="32" color="primary" style="opacity: 0.4">mdi-plus-circle-outline</v-icon>
                    <span class="text-caption text-muted mt-2">Add Room</span>
                </div>
            </div>

            <!-- Room Cards -->
            <div class="room-card" v-for="(room, index) in testingRooms" :key="room.id">
                <!-- Color accent bar -->
                <div class="room-accent" :style="{ background: roomColor(index) }"></div>

                <!-- Room content -->
                <div class="room-content">
                    <!-- Header: icon + name -->
                    <div class="d-flex align-center mb-2">
                        <v-avatar size="32" :color="roomColor(index)" class="mr-2" style="opacity: 0.15">
                            <v-icon size="18" :color="roomColor(index)" style="opacity: 1">mdi-door-open</v-icon>
                        </v-avatar>
                        <span class="text-subtitle-2 font-weight-bold text-truncate" style="flex: 1;">{{ room.name }}</span>
                    </div>

                    <!-- Meta rows -->
                    <div class="room-meta">
                        <div class="room-meta-row">
                            <v-icon size="14" class="mr-1" color="grey">mdi-map-marker-outline</v-icon>
                            <span class="text-caption">{{ room.location || '—' }}</span>
                        </div>
                        <div class="room-meta-row">
                            <v-icon size="14" class="mr-1" color="grey">mdi-flask-outline</v-icon>
                            <span class="text-caption">{{ getStudyCount(room) }} {{ getStudyCount(room) === 1 ? 'study' : 'studies' }}</span>
                        </div>
                        <div v-if="room.calendarId" class="room-meta-row">
                            <v-icon size="14" class="mr-1" color="grey">mdi-calendar-check-outline</v-icon>
                            <span class="text-caption" style="opacity: 0.6">Calendar linked</span>
                        </div>
                    </div>
                </div>

                <!-- Actions footer -->
                <div class="room-actions">
                    <v-btn variant="text" size="small" color="primary" density="compact"
                        prepend-icon="mdi-pencil-outline" @click="editTestingRoom(room, index)">Edit</v-btn>
                    <v-btn variant="text" size="small" color="error" density="compact"
                        prepend-icon="mdi-delete-outline" @click="deleteTestingRoom(room, index)">Delete</v-btn>
                </div>
            </div>
        </div>

        <!-- Create/Edit Dialog -->
        <v-dialog v-model="dialogVisible" max-width="480px" persistent>
            <v-card class="ds-card" variant="flat">
                <v-card-title class="d-flex justify-space-between align-center py-4 ds-header-gradient">
                    <span class="text-h6 font-weight-bold" style="font-family: var(--ds-font-family-heading)">
                        {{ dialogTitle }}
                    </span>
                    <v-btn icon="mdi-close" variant="text" density="comfortable" @click="cancelChanges"></v-btn>
                </v-card-title>
                
                <v-divider></v-divider>
                
                <v-card-text class="pt-6" style="background-color: var(--ds-field-bg);">
                    <v-form ref="formTestRoom" v-model="validTestRoom">
                        <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Room Name</div>
                        <v-text-field hide-details :rules="$rules.required" v-model="currentTestingRoom.name"
                            placeholder="e.g. Eye Tracking Room" variant="outlined" density="compact" class="mb-4"
                            prepend-inner-icon="mdi-tag-outline"></v-text-field>

                        <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Location</div>
                        <v-text-field hide-details :rules="$rules.required" v-model="currentTestingRoom.location"
                            placeholder="e.g. PC-104" variant="outlined" density="compact" class="mb-4"
                            prepend-inner-icon="mdi-map-marker-outline"></v-text-field>

                        <div class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1">Google Calendar ID</div>
                        <v-text-field hide-details v-model="currentTestingRoom.calendarId"
                            placeholder="Leave blank to auto-create" variant="outlined" density="compact"
                            prepend-inner-icon="mdi-calendar-outline"></v-text-field>
                    </v-form>
                </v-card-text>

                <v-card-actions class="px-6 pb-6 pt-0" style="background-color: var(--ds-field-bg);">
                    <v-spacer></v-spacer>
                    <v-btn color="grey-darken-1" variant="text" @click="cancelChanges">Cancel</v-btn>
                    <v-btn color="primary" variant="flat" @click="confirmChanges" prepend-icon="mdi-content-save">Save Room</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script>
import calendar from "@/services/calendar";
import testingRoom from "@/services/testingRoom";
import ConfirmDlg from "@/components/ConfirmDialog.vue";

const ROOM_COLORS = [
    '#4A90D9', '#7B61C4', '#E67E22', '#27AE60', '#E74C3C',
    '#2C3E50', '#16A085', '#8E44AD', '#D4AC0D', '#2980B9'
];

import { useMainStore } from "@/stores/mainStore";

export default {
  setup() {
    const store = useMainStore();
    return { store };
  },
    components: {
        ConfirmDlg
    },
    props: {
        testingRooms: Array,
        labId: Number,
    },
    data() {
        return {
            dialogVisible: false,
            dialogTitle: "",
            currentTestingRoom: {
                name: "",
                location: "",
                calendarId: "",
                FK_Lab: this.labId,
            },
            validTestRoom: false,
            testingRoomIndex: null,
        };
    },
    methods: {
        roomColor(index) {
            return ROOM_COLORS[index % ROOM_COLORS.length];
        },

        getStudyCount(room) {
            return (this.store.studies || []).filter(
                (s) => s.FK_TestingRoom === room.id
            ).length;
        },

        createTestingRoom() {
            if (!this.labId) return;
            this.dialogTitle = "Create Testing Room";
            this.currentTestingRoom = {
                name: "",
                location: "",
                calendarId: "",
                FK_Lab: this.labId,
            };
            this.dialogVisible = true;
        },

        editTestingRoom(room, index) {
            this.dialogTitle = "Edit Testing Room";
            this.currentTestingRoom = { ...room };
            this.testingRoomIndex = index;
            this.dialogVisible = true;
        },

        async deleteTestingRoom(room, index) {
            if (!(await this.$refs.confirmD.open('Confirm Delete', `Are you sure you want to delete Testing Room: ${room.name}?`))) {
                return;
            }
            try {
                await testingRoom.delete({ id: room.id, name: room.name });
                this.$refs.confirmD.open('Deleted', 'Testing Room: ' + room.name + ' has been deleted. Note: the associated Google Calendar has not been deleted.', { color: 'success', noconfirm: true });
                this.testingRooms.splice(index, 1);
                this.$emit("testingRoomsUpdated", this.testingRooms);
            } catch (error) {
                console.error(error);
            }
        },

        async confirmChanges() {
            const { valid } = await this.$refs.formTestRoom.validate();

            if (valid) {
                try {
                    if (this.dialogTitle === "Create Testing Room") {
                        this.currentTestingRoom.createdBy = this.store.userID;
                        this.currentTestingRoom.calendar = this.currentTestingRoom.name;

                        if (!this.currentTestingRoom.calendarId) {
                            const newCal = await calendar.createSecondaryCalendar({
                                lab: this.store.lab,
                                calendarName: this.currentTestingRoom.name,
                            });
                            this.currentTestingRoom.calendarId = newCal.data.calendarId;
                        }

                        const createdRoom = await testingRoom.create(this.currentTestingRoom);
                        this.testingRooms.push(createdRoom.data);
                    } else {
                        const updatedRoom = {
                            id: this.currentTestingRoom.id,
                            name: this.currentTestingRoom.name,
                            location: this.currentTestingRoom.location,
                            calendarId: this.currentTestingRoom.calendarId,
                            createdBy: this.store.userID,
                            calendar: this.currentTestingRoom.name,
                        };

                        await testingRoom.update(updatedRoom);
                        Object.assign(this.testingRooms[this.testingRoomIndex], this.currentTestingRoom);
                    }

                    this.$emit("testingRoomsUpdated", this.testingRooms);
                    this.dialogVisible = false;
                } catch (error) {
                    console.error(error);
                }
            }
        },

        cancelChanges() {
            this.currentTestingRoom = {
                name: "",
                location: "",
                calendarId: "",
                FK_Lab: this.labId,
            };
            this.dialogVisible = false;
        },
    },
};
</script>

<style scoped>
.room-card {
    width: 200px;
    border-radius: 10px;
    background: rgb(var(--v-theme-surface));
    border: 1px solid rgba(var(--v-border-color), 0.12);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: box-shadow 0.2s ease, transform 0.15s ease;
}

.room-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
}

.room-card-add {
    cursor: pointer;
    border: 2px dashed rgba(var(--v-theme-primary), 0.3);
    background: rgba(var(--v-theme-primary), 0.02);
}

.room-card-add:hover {
    border-color: rgba(var(--v-theme-primary), 0.6);
    background: rgba(var(--v-theme-primary), 0.05);
}

.room-card-add.disabled {
    opacity: 0.4;
    pointer-events: none;
}

.room-card-add-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 16px;
}

.room-accent {
    height: 4px;
    width: 100%;
    flex-shrink: 0;
}

.room-content {
    padding: 12px 14px 8px;
    flex: 1;
}

.room-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.room-meta-row {
    display: flex;
    align-items: center;
}

.room-actions {
    display: flex;
    justify-content: space-between;
    padding: 4px 8px 8px;
    border-top: 1px solid rgba(var(--v-border-color), 0.08);
}
</style>
