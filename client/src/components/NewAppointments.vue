<template>
  <v-row align="end" justify="space-around">
    <v-col cols="12" md="2" style="display: flex; justify-content: flex-end;">
      <h3 class="name">{{ child.Name + ":"}}</h3>
    </v-col>

    <v-col cols="12" md="2">
      <v-select
        :items="potentialExtraStudies"
        :item-value="'id'"
        :item-text="'StudyName'"
        @change="emitSelectedStudy"
        v-model="selectedStudy"
        return-object
        label="Studies"
        dense
        chip
      ></v-select>
    </v-col>
    <v-col cols="12" md="3">
      <v-select
        :items="potentialExperimenters"
        :item-value="'id'"
        :item-text="'Name'"
        v-model="selectedExperimenters"
        return-object
        label="Experimenters"
        multiple
        dense
        chip
      ></v-select>
    </v-col>
    <v-col cols="12" md="2">
      <v-btn text icon color="primary" @click="deleteAppointment">
        <v-icon>delete</v-icon>
      </v-btn>
    </v-col>
    <!-- <v-col cols="12" md="1"></v-col> -->
  </v-row>
</template>

<script>
// import store from "@/store";
import personnel from "@/services/personnel";

export default {
  props: {
    child: Object,
    targetChild: Object,
    potentialStudies: Array,
    currentStudy: Object,
    scheduleId: Number,
    participationDate: Date,
    index: Number,
  },
  data() {
    return {
      selectedStudy: this.currentStudy,
      selectedExperimenters: [],
    };
  },
  methods: {
    selectStudy() {
      const experimenterIds = this.selectedExperimenters.map((experimenter) => {
        return experimenter.id;
      });

      const appointment = {
        FK_Child: this.child.id,
        FK_Family: this.child.FK_Family,
        FK_Study: this.selectedStudy.id,
        FK_Schedule: this.scheduleId,
        Child: {
          Name: this.child.Name,
          DoB: this.child.DoB,
          IdWithinFamily: this.child.IdWithinFamily,
          Sex: this.child.Sex,
        },
        Study: {
          StudyName: this.selectedStudy.StudyName,
          MinAge: this.selectedStudy.MinAge,
          MaxAge: this.selectedStudy.MaxAge,
          StudyType: this.selectedStudy.StudyType,
        },
        Experimenters: experimenterIds,
      };

      const attendees = this.selectedExperimenters.map((experimenter) => {
        return {
          displayName: experimenter.Name,
          email: experimenter.Calendar + ".CAL",
        };
      });

      this.$emit("selectStudy", {
        index: this.index,
        appointment: appointment,
        attendees: attendees,
      });
    },

    emitSelectedStudy() {
      const selectedStudy = {
        studyId: this.selectedStudy.id,
        childId: this.child.id,
        index: this.index,
      };
      this.$emit("emitSelectedStudy", selectedStudy);
    },

    clear() {
      this.selectedStudy = [];
    },

    deleteAppointment() {
      this.$emit("deleteAppointment", this.index);
    },
  },
  computed: {
    potentialExtraStudies() {
      if (this.currentStudy && this.targetChild.id == this.child.id) {
        return this.potentialStudies.filter(
          (study) => this.currentStudy.id != study.id
        );
      } else {
        return this.potentialStudies;
      }
    },

    defaultSelected() {
      return this.currentStudy
        ? {
            id: this.currentStudy.id,
            StudyName: this.currentStudy.StudyName,
          }
        : {};
    },
  },

  asyncComputed: {
    async potentialExperimenters() {
      if (this.selectedStudy) {
        var studyId = null;

        if (this.index == 0 && this.currentStudy) {
          studyId = this.currentStudy.id;
        } else {
          studyId = this.selectedStudy.id;
        }

        try {
          var queryString = {
            study: studyId,
          };

          const results = await personnel.search(queryString);

          // filter the output based on experimenters' availability on the participation date.
          // this.participationDate

          return results.data;
        } catch (error) {
          console.log(error.response);
        }
      } else {
        return [];
      }
    },
  },
};
</script>
<style scoped>
.name {
  height: 30px;
  display: flex;
  align-items: flex-end;
}
</style>

