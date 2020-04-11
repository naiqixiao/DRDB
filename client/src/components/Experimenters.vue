<template>
  <v-row dense>
    <v-col
      cols="12"
      md="12"
      v-for="experimenter in Experimenters"
      :key="experimenter.id"
      dense
    >
      <v-card class="mx-auto" width="360px" height="120px">
        <v-card-title>{{
          experimenter.Name + " (" + experimenter.Initial + ")"
        }}</v-card-title>

        <v-card-text align="start">{{
          "Email: " + experimenter.Email
        }}</v-card-text>
        <h4 align="end">{{ "Role: " + experimenter.Role }}</h4>

        <!-- <v-card-actions>
          <v-btn
            text
            @click="removeExperimenter(index)"
            :disabled="Experimenters.length == 1"
            >Delete</v-btn
          >
        </v-card-actions> -->
      </v-card>
    </v-col>
    <v-row align="center" justify="center">
      <v-col cols="12" md="2" dense>
        <v-btn color="purple" fab large @click.stop="updateExperimenters"
          >+</v-btn
        >
      </v-col>
    </v-row>

    <div>
      <v-dialog v-model="dialogExperimenter" max-width="1200px">
        <v-card>
          <v-row align="center" justify="center">
            <v-col cols="12" lg="10">
              <v-select
                :items="labMembers"
                :item-value="'id'"
                :item-text="'Name'"
                v-model="editedExperimenter"
                return-object
                label="Experimenters"
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
</template>

<script>
import experimenter from "@/services/experimenter";

export default {
  components: {},
  props: {
    Experimenters: Array,
    labMembers: Array,
    studyId: Number,
  },

  data() {
    return {
      dialogExperimenter: false,
      editedExperimenter: [],
    };
  },
  methods: {
    updateExperimenters() {

      this.editedExperimenter = this.Experimenters
      this.dialogExperimenter = true;
    },

    async save() {
      var newExperimenters = this.editedExperimenter.map((experimenter) => {
        return {
          FK_Study: this.studyId,
          FK_Experimenter: experimenter.id,
        };
      });

      try {
        await experimenter.postExperimenters(newExperimenters);

        this.$emit("updatedExperimenters", this.editedExperimenter);
        this.dialogExperimenter = false;

        console.log("Experimenters updated.");
      } catch (error) {
        console.error(error.response);
      }
    }
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
