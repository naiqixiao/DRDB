<template>
  <v-row>
    <template v-slot:top>
      <v-dialog v-model="dobPicker" max-width="360px">
        <v-card>
          <v-row align="center">
            <v-col cols="12" lg="12">
              <v-date-picker
                v-model="editedItem.DoB"
                show-current
                :max="new Date().toISOString()"
                @click:date="dobPicker = false"
              ></v-date-picker>
            </v-col>
          </v-row>
        </v-card>
      </v-dialog>
    </template>

    <template v-slot:top>
      <v-dialog v-model="dialogChild" max-width="760px" :retain-focus="false">
        <v-card>
          <v-card-title>
            <span class="headline">Child's information</span>
          </v-card-title>

          <v-form ref="formChild" v-model="validChild" lazy-validation>
            <v-container>
              <v-row>
                <v-col cols="12" sm="6" md="4">
                  <v-text-field
                    v-model="editedItem.Name"
                    :rules="this.$rules.name"
                    label="Name"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-text-field
                    v-model="editedItem.DoB"
                    append-icon="event"
                    @click:append="dobPicker = true"
                    :rules="this.$rules.dob"
                    label="Date of birth (YYYY-MM-DD)"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-select
                    v-model="editedItem.Sex"
                    :items="this.$Sex"
                    filled
                    label="Sex"
                    chip
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-text-field
                    v-model="editedItem.BirthWeight"
                    :rules="this.$rules.birthWeight"
                    label="Birth weight"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-container>
          </v-form>

          <v-card-actions>
            <v-row justify="space-between" style="height: 50px">
              <v-col md="4"></v-col>
              <v-col md="2">
                <v-btn color="primary" @click="dialogChild = false"
                  >Cancel</v-btn
                >
              </v-col>
              <v-col md="2">
                <v-btn color="primary" @click="save">Save</v-btn>
              </v-col>
              <v-col md="4"></v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>

    <v-col cols="12" md="10" v-for="child in Children" :key="child.id" dense>
      <v-row justify="space-around">
        <v-col cols="12" md="2">
          <h3>{{ child.Name }}</h3>
        </v-col>
        <v-col cols="12" md="3">
          <AgeDisplay :DoB="child.DoB" />
        </v-col>
        <v-col cols="12" md="3">
          <ElegibleStudies
            ref="elegibleStudies"
            :child="child"
            @selectStudy="selectStudy"
          ></ElegibleStudies>
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            :items="PotentialExperimenters"
            :item-value="'id'"
            :item-text="'Name'"
            v-model="selectedExperimenters"
            @change="selectExperimenters"
            return-object
            label="Experimenters"
            multiple
            chip
          ></v-select>
        </v-col>
        <v-col cols="12" md="1">
          <v-icon @click.stop="editChild(child)">create</v-icon>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script>
import AgeDisplay from "@/components/AgeDisplay";
import ElegibleStudies from "@/components/ElegibleStudies";

import child from "@/services/child";

export default {
  components: {
    AgeDisplay,
    ElegibleStudies,
  },
  props: {
    Children: Array,
    ScheduleID: Number,
  },
  data() {
    return {
      dialogChild: false,
      dobPicker: false,
      validChild: true,
      appointments: [],
      editedItem: {
        Name: null,
        Sex: null,
        DoB: new Date().toISOString(),
        FK_Family: this.familyId,
        Age: null,
        Hearingloss: 0,
        VisionLoss: 0,
        PrematureBirth: 0,
        Illness: 0,
        Note: null,
        BirthWeight: null,
        Appointments: [],
      },
      defaultItem: {
        Name: null,
        Sex: null,
        DoB: null,
        FK_Family: this.familyId,
        Age: null,
        Hearingloss: 0,
        VisionLoss: 0,
        PrematureBirth: 0,
        Illness: 0,
        Note: null,
        BirthWeight: null,
        Appointments: [],
      },
      editedIndex: -1,
    };
  },
  methods: {
    editChild(child) {
      this.editedIndex = this.Children.indexOf(child);
      this.editedItem = Object.assign({}, child);
      this.dialogChild = true;
    },

    async save() {
      try {
        var validationResults = false;

        validationResults = this.$refs.formChild.validate();

        if (validationResults) {
          this.editedItem.Age = Math.floor(
            (new Date() - new Date(this.editedItem.DoB)) / (24 * 3600 * 1000)
          );

          await child.update(this.editedItem);

          Object.assign(this.Children[this.editedIndex], this.editedItem);

          this.$emit("updateSibling", this.Children);
          console.log("Child information updated!");

          this.close();
        }
      } catch (error) {
        console.log(error.response);
      }
    },

    selectStudy(selectedStudy) {
      selectedStudy.studies.forEach((study) => {
        var appointment = {
          FK_Schedule: this.ScheduleID,
          FK_Family: this.Children[0].FK_Family,
          FK_Child: selectedStudy.child.id,
          FK_Study: study.id,
          Child: {
            Name: selectedStudy.child.Name,
            DoB: selectedStudy.child.DoB,
          },
          Study: {
            StudyName: study.StudyName,
            MinAge: study.MinAge,
            MaxAge: study.MaxAge,
          },
        };
        this.appointments.push(appointment);
      });
    },

    close() {
      this.editedIndex = -1;
      this.dialogChild = false;
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
      }, 200);
    },

    saveAppointment() {
      this.appointments = [];

      for (var i = 0; i < this.Children.length; i++) {
        this.$refs.elegibleStudies[i].selectStudy();
      }

      for (i = 0; i < this.Children.length; i++) {
        this.$refs.elegibleStudies[i].clear();
      }

      this.$emit("updateSiblingStudies", this.appointments);
    },
  },
  computed: {},
  watch: {
    dialogChild(val) {
      val || this.close();
    },
  },
};
</script>

<style lang="scss" scoped></style>
