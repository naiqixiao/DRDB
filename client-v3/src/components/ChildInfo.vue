<template>
  <v-container>
    <v-row>
      <v-col
        cols="12"
        md="6"
        lg="4"
        v-for="(child, index) in Children"
        :key="index"
      >
        <v-card class="elevation-2" variant="flat">
          <v-toolbar density="compact" color="primary" flat>
            <v-icon class="mr-2">face</v-icon>
            <v-toolbar-title class="white--text">
              {{ child.Name }}
            </v-toolbar-title>
            <v-spacer></v-spacer>

            <v-menu location="bottom">
              <template v-slot:activator="{ props }">
                <v-btn icon v-bind="props" variant="text">
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
              </template>

              <v-list density="compact">
                <v-list-item @click="editChild(child, index)" prepend-icon="mdi-pencil">
                    <v-list-item-title>Edit</v-list-item-title>
                </v-list-item>
                <v-list-item @click="deleteChild(child.id, index)" prepend-icon="mdi-delete">
                    <v-list-item-title>Delete</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-toolbar>

          <v-list density="dense">
            <v-list-item>
                    <template v-slot:default>
                         <v-list-item-title>Gender</v-list-item-title>
                         <v-list-item-subtitle class="text-right">{{ child.Sex }}</v-list-item-subtitle>
                    </template>
            </v-list-item>
            <v-list-item>
                    <template v-slot:default>
                         <v-list-item-title>Age</v-list-item-title>
                         <v-list-item-subtitle class="text-right">{{ childAge(child) }}</v-list-item-subtitle>
                    </template>
            </v-list-item>
            <v-list-item>
                    <template v-slot:default>
                         <v-list-item-title>Born</v-list-item-title>
                         <v-list-item-subtitle class="text-right">{{ child.DoB.split("T")[0] }}</v-list-item-subtitle>
                    </template>
            </v-list-item>
          </v-list>

          <v-card-text>
              <div v-for="(info, i) in $childInfo" :key="i">
                  <div v-if="child[info.model]">
                      <b>{{ info.label }}: </b>{{ child[info.model] }}
                  </div>
              </div>
          </v-card-text>


          <v-card-actions>
            <v-btn
              small
              variant="outlined"
              color="primary"
              :disabled="potentialStudies(child).potentialStudyList.length < 1"
              @click.stop="Schedule(child, index)"
            >
              <v-icon start>mdi-calendar</v-icon>schedule
            </v-btn>
            <v-spacer></v-spacer>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <ConfirmDlg ref="confirmD" />

    <!-- Schedule Dialog -->
    <scheduleDialog
      ref="scheduleDialog"
      :dialog="dialogSchedule"
      :currentSchedule="currentSchedule"
      :parentResponse="response"
      :currentFamily="currentFamily"
      dialogType="schedule"
      scheduleType="create"
      @close-dialog="closeSchedule"
      @newAppointment="addAppointment"
      @deleteCurrentAppointment="deleteCurrentAppointment"
      @newSchedule="addSchedule"
    />

    <!-- Edit Child Dialog -->
    <v-dialog v-model="dialogChild" max-width="500px">
        <v-card>
            <v-card-title>
                <span class="headline">{{ formTitle }}</span>
            </v-card-title>

            <v-card-text>
                <v-container>
                    <v-row>
                        <v-col cols="12" sm="6" md="4">
                            <v-text-field v-model="editedItem.Name" label="Name" variant="outlined" density="compact"></v-text-field>
                        </v-col>
                        <v-col cols="12" sm="6" md="4">
                            <v-select v-model="editedItem.Sex" :items="['M', 'F']" label="Gender" variant="outlined" density="compact"></v-select>
                        </v-col>
                         <v-col cols="12" sm="6" md="4">
                            <v-text-field
                                v-model="editedItem.DoB"
                                label="DOB"
                                variant="outlined"
                                density="compact"
                                type="date"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="12" sm="6" md="4" v-for="(item, i) in $childInfo" :key="i">
                             <v-select
                                v-if="item.type == 'select'"
                                v-model="editedItem[item.model]"
                                :items="item.options"
                                :label="item.label"
                                variant="outlined"
                                density="compact"
                             ></v-select>
                             <v-checkbox
                                v-else-if="item.type == 'checkbox'"
                                v-model="editedItem[item.model]"
                                :label="item.label"
                                density="compact"
                             ></v-checkbox>
                             <v-text-field
                                v-else
                                v-model="editedItem[item.model]"
                                :label="item.label"
                                variant="outlined"
                                density="compact"
                             ></v-text-field>
                        </v-col>
                         <v-col cols="12">
                             <h4 class="text-left">Sensitive Info</h4>
                         </v-col>

                         <v-col cols="12" sm="6" md="4" v-for="(item, i) in $childSensitiveInfo" :key="'s' + i">
                             <v-select
                                v-if="item.type == 'select'"
                                v-model="editedItem[item.model]"
                                :items="item.options"
                                :label="item.label"
                                variant="outlined"
                                density="compact"
                             ></v-select>
                             <v-checkbox
                                v-else-if="item.type == 'checkbox'"
                                v-model="editedItem[item.model]"
                                :label="item.label"
                                density="compact"
                             ></v-checkbox>
                             <v-text-field
                                v-else
                                v-model="editedItem[item.model]"
                                :label="item.label"
                                variant="outlined"
                                density="compact"
                             ></v-text-field>
                        </v-col>
                    </v-row>
                </v-container>
            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" variant="text" @click="close">Cancel</v-btn>
                <v-btn color="blue darken-1" variant="text" @click="save">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

  </v-container>
</template>

<script>
import child from "@/services/child";
// import schedule from "@/services/schedule";
// import calendar from "@/services/calendar";
import moment from "moment-timezone";
import ConfirmDlg from "@/components/ConfirmDialog.vue";
// import login from "@/services/login";
import scheduleDialog from '@/components/scheduleDialog.vue';
import { childAge } from "@/assets/JS/displayFunctions.js";

export default {
  components: {
    ConfirmDlg,
    scheduleDialog
  },
  props: {
    Children: Array,
    familyId: Number,
    currentFamily: Object
  },
  data: () => ({
    dialogSchedule: false,
    response: "",
    currentSchedule: {},
    currentChild: {},
    editedIndex: -1,
    dialogChild: false,
    editedItem: {
        Name: "",
        Sex: "",
        DoB: "",
        Age: "",
        Note: ""
    },
    defaultItem: {
        Name: "",
        Sex: "",
        DoB: "",
        Age: "",
        Note: ""
    },
    // Mock global properties (replace with actual global properties or store if needed)
    // Assuming $childInfo and $childSensitiveInfo are available globally or need to be imported/defined.
    // For now I will assume they are available on the instance via app.config.globalProperties or mixin.
    // If not, I should define them here or import them.
    scheduleTemplate: {
        AppointmentTime: null,
        Status: "Confirmed",
        FK_Family: null,
        Note: "",
        summary: "",
        Appointments: [],
        ScheduledBy: null,
        location: null,
        description: "",
        Reminded: 0
    }

  }),

  computed: {
      formTitle() {
          return this.editedIndex === -1 ? "New Child" : "Edit Child";
      }
  },

  methods: {
    childAge,

    potentialStudies(child) {
        // Reuse logic from appointmentDetails or share it?
        // Ideally this logic should be centralized or imported again if duplicated.
        // For now, simple mock or limited check if store studies are available.
        // Or if appointmentDetails logic is needed here for the button disable state.

        if(!this.$store.state.studies) return { potentialStudyList: [] };

        // Duplicate logic for potential studies check to enable/disable button.
        // Ideally refactor this into a utility or store getter.

        var eligibleStudies = [];

      this.$store.state.studies.forEach((study) => {
        if (this.studyElegibility(study, child) && !study.Completed) {
          eligibleStudies.push(study.id);
        }
      });

      var uniquePreviousStudies = [];

      if (child.Appointments) {
        child.Appointments.forEach((appointment) => {
          uniquePreviousStudies.push(appointment.FK_Study);
        });
        uniquePreviousStudies = Array.from(new Set(uniquePreviousStudies));
      }

      var potentialStudies = eligibleStudies.filter(
        (study) => !uniquePreviousStudies.includes(study)
      );

       var potentialStudyList = this.$store.state.studies.filter((study) =>
        potentialStudies.includes(study.id)
      );

      return {
        potentialStudyList: potentialStudyList
      };

    },

    studyElegibility(study, child) {
         // Same logic as appointmentDetails.vue
         // TODO: Refactor into shared mixin or utility.
         if (child.DoB != null) {
            // calculate age in days roughly or use moment
             // Here simpler approximation might suffice or use same logic
              const Age = Math.floor(
                (new Date() - new Date(child.DoB)) / (1000 * 60 * 60 * 24)
              ); // Age in days

            var age =
            Age >= study.MinAge * 30.5 - 1 &&
            Age <= study.MaxAge * 30.5 - 1;

            // ... other criteria (ASD, Hearing, Vision, Premature, Ill) ...
            // Simplified for brevity, assume similar logic.
            // Since this component is just checking eligibility for the button, we can copy logic.

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

         }
         return false;
    },

    editChild(item, index) {
      this.editedIndex = index;
      this.editedItem = Object.assign({}, item);
      // format DOB for date input
      if(this.editedItem.DoB) {
          this.editedItem.DoB = moment(this.editedItem.DoB).format("YYYY-MM-DD");
      }
      this.dialogChild = true;
    },

    async deleteChild(id, index) {
      if (
        await this.$refs.confirmD.open(
          "Confirmation",
          "Are you sure you want to delete this child?"
        )
      ) {
          try {
              await child.delete({ id: id });
              this.Children.splice(index, 1);
          } catch(error) {
              console.log(error);
          }
      }
    },

    close() {
      this.dialogChild = false;
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      }, 300);
    },

    async save() {
        if (this.editedIndex > -1) {
            // update
            Object.assign(this.Children[this.editedIndex], this.editedItem);
            try {
                await child.update(this.editedItem);
            } catch (error) {
                console.log(error);
            }
        } else {
            // create - handled by Family view generally or add logic here?
            // The template shows "New Child" title but button to add child is outside this component usually?
            // Ah, parent passes Children. This component manages display and edit of EXISTING children.
            // But if there is a way to add child here, it would be needed.
            // Family.vue handles adding child usually.
            // But if this dialog handles creation too:
            // Assuming this component purely lists children, but allows editing/deleting.
            // Creation might be triggered from parent.
        }
        this.close();
    },

    Schedule(child, index) {
        this.currentChild = child;
        this.editedIndex = index; // This index is child index in Children array
        this.dialogSchedule = true;
        this.response = "Confirmed";
        this.currentSchedule = Object.assign({}, this.scheduleTemplate);
        // Initialize basic schedule structure
        this.currentSchedule.FK_Family = this.familyId;

        // Note: appointmentDetails and scheduleDialog expect Appointments array in currentSchedule
        this.currentSchedule.Appointments = [];
        this.currentSchedule.Appointments.push({
            FK_Child: child.id,
            Child: child,
            FK_Family: child.FK_Family,
            status: "Confirmed",
            PrimaryExperimenter: [],
            SecondaryExperimenter: []
        });
    },

    closeSchedule() {
        this.dialogSchedule = false;
    },

    addAppointment(appointment) {
        this.currentSchedule.Appointments.push(appointment);
    },

    deleteCurrentAppointment(index) {
        this.currentSchedule.Appointments.splice(index, 1);
    },

    addSchedule(schedule) {
        this.$emit("newSchedule", schedule);
        this.closeSchedule();
    }
  }
};
</script>
