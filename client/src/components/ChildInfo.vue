<template>
  <v-row dense>
    <v-col cols="6" v-for="(child, index) in Children" :key="child.id" dense>
      <div>
        <v-dialog v-model="dialog" max-width="760px" :retain-focus="false">
          <v-card>
            <v-card-title>
              <span class="headline">Edit child's information</span>
            </v-card-title>

            <v-card-text>
              <v-container>
                <v-row>
                  <v-col cols="12" sm="6" md="4">
                    <v-text-field
                      v-model="editedItem.Name"
                      :rules="[rules.required, rules.name]"
                      label="Name"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <v-text-field
                      v-model="editedItem.DoB"
                      :rules="[rules.required, rules.dob]"
                      label="Date of birth (YYYY-MM-DD)"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <v-select
                      v-model="editedItem.Sex"
                      :items="Sex"
                      filled
                      label="Sex"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <v-text-field
                      v-model="editedItem.BirthWeight"
                      :rules="[rules.birthWeight]"
                      label="Birth weight"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-container>
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="green darken-1" text @click="dialog = false"
                >Cancel</v-btn
              >
              <v-btn color="green darken-1" text @click="save">Save</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </div>

      <v-card class="mx-auto" max-width="350px" max-height="300px">
        <v-card-title>{{ child.Name }}</v-card-title>

        <v-card-subtitle justify="start">
          <AgeDisplay :DoB="child.DoB" />
        </v-card-subtitle>
        <v-list-item-title class="headline mb-3">{{
          UniquePreviousStudies[index]
        }}</v-list-item-title>
        <v-list-item-title class="headline mb-1">{{
          ElegibleStudies[index]
        }}</v-list-item-title>
        <v-list-item-title class="headline mb-1">{{
          PotentialStudies[index]
        }}</v-list-item-title>

        <v-card-actions>
          <v-btn text @click.stop="EditChild(child, index)">Edit</v-btn>
          <v-btn text :disabled="ElegibleStudies[index].length == 0"
            >Schedule</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-col>

    <v-btn text @click.stop="AddChild" :disabled="!familyId">Add</v-btn>
  </v-row>
</template>

<script>
import AgeDisplay from "@/components/AgeDisplay";

import child from "@/services/child";
import store from "@/store";

export default {
  components: {
    AgeDisplay
  },
  props: {
    Children: Array,
    familyId: Number
  },
  data() {
    return {
      dialog: false,
      editedIndex: -1,
      editedItem: {
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
        Appointments: []
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
        Appointments: []
      },
      queryString: {},
      Sex: ["F", "M"],
      rules: {
        required: value => !!value || "Required.",
        counter: value => value.length <= 30 || "Max 30 characters",
        dob: value => {
          var pattern = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/;
          return pattern.test(value) || "Invalid Date of Birth.";
        },
        birthWeight: value => {
          var pattern = /^[0-9]{1,2}[:.,-]?$/;
          return pattern.test(value) || "Invalid Birth Weight.";
        },
        name: value => {
          var pattern = /^[\w'\-,.][^0-9_!¡?÷?¿/\\+=@#$%ˆ&*(){}|~<>;:[\]]{2,}$/;
          return pattern.test(value) || "Invalid Name.";
        }
      }
    };
  },
  methods: {
    AddChild() {
      this.editedIndex = -1;
      this.editedItem.FK_Family = this.familyId;
      this.dialog = true;
    },

    EditChild(child, index) {
      this.editedIndex = index;
      this.editedItem = Object.assign({}, child);
      this.dialog = true;
    },

    async save() {
      if (this.editedIndex > -1) {
        this.editedItem.Age = Math.floor(
          (new Date() - new Date(this.editedItem.DoB)) / (24 * 3600 * 1000)
        );

        await child.update(this.editedItem);

        Object.assign(this.Children[this.editedIndex], this.editedItem);

        console.log("Child information updated!");
      } else {
        this.editedItem.Age = Math.floor(
          (new Date() - new Date(this.editedItem.DoB)) / (24 * 3600 * 1000)
        );

        await child.create(this.editedItem);

        this.Children.push(this.editedItem);

        console.log("Child is creted and siblings are updated!");
      }

      this.close();
    },

    close() {
      this.dialog = false;
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      }, 300);
    }
  },
  computed: {
    ElegibleStudies: function() {
      var elegibleStudies = this.Children.map(child => {
        let studyIds = [];
        store.state.studies.forEach(study => {
          if (
            child.Age >= study.MinAge * 30.5 &&
            child.Age <= study.MaxAge * 30.5
          ) {
            studyIds.push(study.id);
          }
        });
        return studyIds;
      });

      return elegibleStudies;
    },

    UniquePreviousStudies: function() {
      return this.Children.map(child => {
        let studyIds = [];
        child.Appointments.forEach(appointment => {
          studyIds.push(appointment.FK_Study);
        });

        return studyIds;
      });
    },

    PotentialStudies: function() {
      var PotentialStudies = [];
      for (var i = 0; i < this.ElegibleStudies.length; i++) {
        var elegibleStudy = this.ElegibleStudies[i];
        var previousStudies = this.UniquePreviousStudies[i];

        previousStudies = Array.from(new Set(previousStudies));

        PotentialStudies[i] = elegibleStudy.filter(
          study => !previousStudies.includes(study)
        );
      }

      return PotentialStudies;
    }
  },
  watch: {
    dialog(val) {
      val || this.close();
    }
  }
};
</script>

<style lang="scss" scoped></style>
