<template>
  <div>
    <v-row dense justify="start">
      <v-col cols="12" md="4" v-for="study in Studies" :key="study.id" dense>
        <v-card class="mx-auto" width="360px" height="120px">
          <v-card-title>{{ study.StudyName }}</v-card-title>

          <v-card-text align="start">{{
            "Age range: " + study.MinAge + " to " + study.MaxAge
          }}</v-card-text>
          <h4 align="end">{{ "Type: " + study.StudyType }}</h4>
        </v-card>
      </v-col>

      <div>
        <v-dialog v-model="dialogStudy" max-width="1200px">
          <v-card>
            <v-row align="center" justify="center">
              <v-col cols="12" lg="10">
                <v-select
                  :items="labStudies"
                  :item-value="'id'"
                  :item-text="'StudyName'"
                  v-model="editedStudies"
                  return-object
                  label="Studies"
                  multiple
                >
                </v-select>
              </v-col>
            </v-row>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="green darken-1" text @click="save">Confirm</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </div>
    </v-row>
    <v-row align="center" justify="end">
      <v-col cols="12" md="2" dense>
        <v-btn color="primary" fab large @click.stop="updateStudies"
          ><v-icon>add</v-icon></v-btn
        >
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
      var newStudies = this.editedStudies.map((study) => {
        return {
          FK_Experimenter: this.personnelId,
          FK_Study: study.id,
        };
      });

      try {
        await experimenter.postStudies(newStudies);

        this.$emit("updatedStudies", this.editedStudies);
        this.dialogStudy = false;

        console.log("Studies updated.");
      } catch (error) {
        console.error(error.response);
      }
    },
  },
  computed: {},
  watch: {
    dialog(val) {
      val || this.close();
    },
  },
};
</script>

<style lang="scss" scoped></style>
