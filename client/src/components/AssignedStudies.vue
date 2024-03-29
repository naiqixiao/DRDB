<template>
  <div>
    <v-row dense justify="start">
      <v-col cols="12" md="4" v-for="study in Studies" :key="study.id" dense>
        <v-card class="child-card d-flex flex-column">
          <v-card-title class="title" style="padding: 8px">
            {{ study.StudyName }}
            <v-spacer></v-spacer>
            {{ " (" + study.StudyType + ")" }}
          </v-card-title>

          <v-card-text
            class="body-1"
            align="start"
            style="padding: 8px; color: var(--v-primary)"
          >
            {{
              "Age range: " +
                AgeFormated2(study.MinAge) +
                " to " +
                AgeFormated2(study.MaxAge)
            }}
          </v-card-text>
          <v-card-text
            class="body-1"
            align="end"
            style="padding: 8px; color: red"
          >
            {{ study.Completed ? "Completed" : "In progress" }}
          </v-card-text>
        </v-card>
      </v-col>

      <div>
        <v-dialog v-model="dialogStudy" max-width="800px">
          <v-card>
            <v-card-title class="title" style="padding: 8px">{{
              "Assign studies to " + personnelName
            }}</v-card-title>

            <v-card-text>
              <v-row justify="center" align="center" style="height: 200px;" dense>
                <v-col cols="12" md="8">
                  <v-select
                    :items="labStudies"
                    :item-value="'id'"
                    :item-text="'StudyName'"
                    v-model="editedStudies"
                    return-object
                    label="Studies"
                    multiple
                    hide-details
                    height="48px"
                    placeholder="  "
                    outlined
                    dense
                    chip
                  ></v-select>
                </v-col>
              </v-row>
            </v-card-text>
            
            <v-card-actions style="padding: 16px;">
              <v-row justify="space-between">
                <v-col md="3"></v-col>
                <v-col md="2">
                  <v-btn color="primary" @click="close()">Cancel</v-btn>
                </v-col>
                <v-col md="2">
                  <v-btn color="primary" @click="save()">Save</v-btn>
                </v-col>
                <v-col md="3"></v-col>
              </v-row>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </div>
    </v-row>
    <v-row align="center" justify="end">
      <v-col cols="12" md="2" dense>
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <div v-on="on">
              <v-btn
                color="primary"
                fab
                large
                @click.stop="updateStudies"
                :disabled="
                  !(
                    personnelId == $store.state.userID ||
                    $store.state.role == 'Admin' ||
                    $store.state.role == 'PI' ||
                    $store.state.role == 'Lab manager'
                  )
                "
              >
                <v-icon>badge</v-icon>
              </v-btn>
            </div>
          </template>
          <span>Assign studies to this person</span>
        </v-tooltip>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import experimenter from "@/services/experimenter";

export default {
  components: {},
  props: {
    Studies: Array,
    labStudies: Array,
    personnelId: Number,
    personnelName: String,
  },

  data() {
    return {
      dialogStudy: false,
      editedStudies: [],
    };
  },
  methods: {
    updateStudies() {
      this.editedStudies = this.Studies;
      this.dialogStudy = true;
    },

    async save() {
      var newStudies = {};

      newStudies.studies = this.editedStudies.map((study) => {
        return {
          FK_Experimenter: this.personnelId,
          FK_Study: study.id,
        };
      });

      try {
        await experimenter.postStudies(newStudies);

        this.$emit("updatedStudies", this.editedStudies);

        this.close();
        console.log("Studies updated.");
      } catch (error) {
        console.error(error);
      }
    },

    close() {
      this.dialogStudy = false;
      this.editedStudies = {};
    },

    AgeFormated2(Age) {
      var formated = "Not born yet.";
      if (Age > 0) {
        var years = Math.floor(Age / 12);
        var months = Age % 12;
        var Y = years > 0 ? years + " y " : "";
        var M = months + " m";
        formated = Y + M;
      }
      return formated;
    },
  },
  computed: {},
  watch: {
    dialogStudy(val) {
      val || this.close();
    },
  },
};
</script>

<style lang="scss" scoped></style>
