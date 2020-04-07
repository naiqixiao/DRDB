<template>
  <v-row>
    <v-col cols="12" md="4">
      <v-data-table
        fixed-header
        height="900"
        single-select
        no-data-text="No study to display."
        :headers="headersStudy"
        :items="Studies"
        class="elevation-1"
        @click:row="rowSelected"
      >
        <template #item.updatedAt="{ value }">
          <DateDisplay :date="value" :format="'short'" />
        </template>
      </v-data-table>
    </v-col>

    <v-col cols="12" md="8">
      <v-form ref="form" v-model="valid" lazy-validation>
        <v-container>
          <v-row>
            <v-col
              cols="12"
              sm="6"
              md="4"
              v-for="field in studyFields"
              :key="field.label"
            >
              <v-text-field
                :label="field.label"
                v-model="currentStudy[field.field]"
                dense
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" md="8">
              <h3>Study summary & email template</h3>

              <v-textarea
                label="Study summary"
                outlined
                filled
                no-resize
                rows="3"
                solo
                v-model="currentStudy.Summary"
              ></v-textarea>
              <v-textarea
                label="Study email template"
                outlined
                filled
                no-resize
                rows="6"
                solo
                v-model="currentStudy.Template"
              ></v-textarea>
            </v-col>
            <v-col cols="12" md="4">
              <h3>Experimenters</h3>

              <Experimenters
                :Experimenters="currentStudy.Personnels"
                :labMembers="labMembers"
                :studyId="currentStudy.id"
                @updatedExperimenters="updateExperimenters"
              ></Experimenters>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" md="2" dense>
              <v-btn color="purple" text @click.stop="">Add</v-btn>
            </v-col>
            <v-col cols="12" md="2" dense>
              <v-btn color="purple" text @click.stop="">Edit</v-btn>
            </v-col>
            <v-col cols="12" md="2" dense>
              <v-btn color="purple" text @click.stop="">Delete</v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-form>
    </v-col>
  </v-row>
</template>

<script>
import DateDisplay from "@/components/DateDisplay";
import Experimenters from "@/components/Experimenters";

import study from "@/services/study";
import personnel from "@/services/personnel";
import store from "@/store";

export default {
  components: {
    DateDisplay,
    Experimenters,
  },
  data() {
    return {
      headersStudy: [
        {
          text: "Study Name",
          align: "center",
          value: "StudyName",
          width: "80px",
        },
        {
          text: "Type",
          align: "center",
          value: "StudyType",
          width: "60px",
        },
        {
          text: "Updated Time",
          align: "center",
          value: "updatedAt",
          width: "50px",
        },

        {
          text: "Completion",
          align: "center",
          value: "Completed",
          width: "50px",
        },
      ],
      studyFields: [
        { label: "Study Name", field: "StudyName" },
        { label: "Min Age", field: "MinAge" },
        { label: "Max Age", field: "MaxAge" },
        { label: "Study Type", field: "StudyType" },
        { label: "Premature Participants", field: "PrematureParticipant" },
      ],

      Studies: [],
      currentStudy: {},
      editedStudy: {},
      editedIndex: -1,
      labMembers: [],
      valid: true,
    };
  },

  methods: {
    async searchStudies() {
      var queryString = {
        FK_Lab: store.state.lab,
      };

      try {
        const Result = await study.search(queryString);

        this.Studies = Result.data;

        this.editedIndex = this.editedIndex === -1 ? 0 : this.editedIndex;
        this.currentStudy = this.Studies[this.editedIndex];
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
        FK_Lab: store.state.lab,
        Active: 1,
      };

      try {
        const Result = await personnel.search(queryString);

        this.labMembers = Result.data;

        //  exclude PIs
        this.labMembers = this.labMembers.filter((member) => {
          return member.Role !== "PI";
        });

        // this.labMembers = this.labMembers.map((member) => {
        //   return member.id;
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

    rowSelected(item, row) {
      row.select(true);
      // this.$emit("rowSelected", item.Appointments[0].FK_Family);
      this.currentStudy = item;
      this.editedIndex = this.Studies.indexOf(this.currentStudy);
    },

    updateExperimenters(updatedExperimenters) {
      this.currentStudy.Personnels = updatedExperimenters;
      // updatedExperimenters.forEach(experimenter => {
      // this.currentStudy.personnel

      // })
    },
  },
  mounted: function() {
    this.searchStudies();
    this.searchLabMembers();
  },
};
</script>
