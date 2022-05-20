<template>
  <div>
    <v-row align="start" justify="end">
      <v-col cols="12" md="2" dense>
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <div v-on="on">
              <v-btn
                color="primary"
                fab
                large
                @click.stop="updateExperimenters"
                :disabled="
                  !studyId ||
                    !(
                      PointofContactId == $store.state.userID ||
                      $store.state.role == 'Admin' ||
                      $store.state.role == 'PI' ||
                      $store.state.role == 'Lab manager'
                    )
                "
              >
                <v-icon>group_add</v-icon>
              </v-btn>
            </div>
          </template>
          <span>Assign experimenters to this study</span>
        </v-tooltip>
      </v-col>

      <div>
        <v-dialog v-model="dialogExperimenter" max-width="800px">
          <v-card>
            <v-card-title class="title" style="padding: 8px">{{
              "Assign this study to"
            }}</v-card-title>

            <v-card-text>
              <v-row
                align="center"
                justify="center"
                style="height: 200px;" dense
              >
                <v-col cols="12" lg="10">
                  <v-select
                    :items="labMembers"
                    :item-value="'id'"
                    :item-text="'Name'"
                    v-model="editedExperimenter"
                    return-object
                    label="Experimenters"
                    multiple
                    chip
                    outlined
                    dense
                  ></v-select>
                </v-col>
              </v-row>
            </v-card-text>

            <v-card-actions tyle="padding: 16px;">
              <v-row justify="space-between">
                <v-col md="3"></v-col>
                <v-col md="2">
                  <v-btn color="primary" @click="close">Cancel</v-btn>
                </v-col>
                <v-col md="2">
                  <v-btn color="primary" @click="save">Confirm</v-btn>
                </v-col>
                <v-col md="3"></v-col>
              </v-row>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </div>
    </v-row>
    <div style="overflow-y: scroll !important">
      <v-row dense>
        <v-col
          cols="12"
          md="6"
          v-for="experimenter in Experimenters"
          :key="experimenter.id"
          dense
        >
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
              >{{ "Email: " + experimenter.Email }}</v-card-text
            >

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
      </v-row>
    </div>
  </div>
</template>

<script>
import experimenter from "@/services/experimenter";

export default {
  components: {},
  props: {
    Experimenters: Array,
    labMembers: Array,
    studyId: Number,
    PointofContactId: Number,
  },

  data() {
    return {
      dialogExperimenter: false,
      editedExperimenter: [],
    };
  },
  methods: {
    updateExperimenters() {
      this.editedExperimenter = this.Experimenters;
      this.dialogExperimenter = true;
    },

    async save() {
      var newExperimenters = {};
      newExperimenters.experimenters = this.editedExperimenter.map(
        (experimenter) => {
          return {
            FK_Study: this.studyId,
            FK_Experimenter: experimenter.id,
          };
        }
      );

      try {
        await experimenter.postExperimenters(newExperimenters);

        this.$emit("updatedExperimenters", this.editedExperimenter);
        this.close();

        console.log("Experimenters updated.");
      } catch (error) {
        console.error(error.response);
      }
    },

    close() {
      this.dialogExperimenter = false;
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
