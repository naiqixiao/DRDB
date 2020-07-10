<template>
  <v-row dense>
    <v-col cols="12" md="12" v-for="experimenter in Experimenters" :key="experimenter.id" dense>
      <v-card class="child-card d-flex flex-column">
        <v-card-title class="title" style="padding: 8px">
          {{ experimenter.Name + " (" + experimenter.Initial + ")" }}
          <v-spacer></v-spacer>
          {{ experimenter.Role }}
        </v-card-title>

        <v-card-text
          class="body-1"
          align="start"
          style="padding: 8px; color: var(--v-primary)"
        >{{ "Email: " + experimenter.Email }}</v-card-text>

        <!-- <v-card-actions>
          <v-btn
            text
            @click="removeExperimenter(index)"
            :disabled="Experimenters.length == 1"
            >Delete</v-btn
          >
        </v-card-actions>-->
      </v-card>
    </v-col>
    <v-row align="end" justify="end">
      <v-col cols="12" md="2" dense>
        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              color="primary"
              fab
              large
              @click.stop="updateExperimenters"
              :disabled="!studyId"
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>edit</v-icon>
            </v-btn>
          </template>
          <span>Assign experimenters to this study</span>
        </v-tooltip>
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
              ></v-select>
            </v-col>
          </v-row>

          <v-card-actions>
            <v-row justify="space-between" style="height: 50px">
              <v-col md="4"></v-col>
              <v-col md="2">
                <v-btn color="primary" @click="dialogExperimenter = false">Cancel</v-btn>
              </v-col>
              <v-col md="2">
                <v-btn color="primary" @click="save">Confirm</v-btn>
              </v-col>
              <v-col md="4"></v-col>
            </v-row>
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
    studyId: Number
  },

  data() {
    return {
      dialogExperimenter: false,
      editedExperimenter: []
    };
  },
  methods: {
    updateExperimenters() {
      this.editedExperimenter = this.Experimenters;
      this.dialogExperimenter = true;
    },

    async save() {
      var newExperimenters = this.editedExperimenter.map(experimenter => {
        return {
          FK_Study: this.studyId,
          FK_Experimenter: experimenter.id
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
    }
  }
};
</script>

<style lang="scss" scoped></style>
