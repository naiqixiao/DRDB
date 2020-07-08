<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="4">
        <v-data-table
          hide-default-footer
          disable-pagination
          fixed-header
          height="900"
          single-select
          no-data-text="No personnel to display."
          :headers="headerPersonnel"
          :items="Personnels"
          class="elevation-1"
          @click:row="rowSelected"
        >
          <template #item.updatedAt="{ value }">
            <DateDisplay :date="value" :format="'short'" />
          </template>

          <template #item.Active="{ item }">
            <v-simple-checkbox v-model="item.Active" @input="changePersonnelStatus(item)" dense></v-simple-checkbox>
          </template>
        </v-data-table>
      </v-col>

      <v-col cols="12" md="8">
        <v-col md="12" class="subtitle">
          <v-divider></v-divider>
          <h4 class="text-left">Personnel information:</h4>
        </v-col>
        <v-form ref="form" v-model="valid" lazy-validation>
          <v-container>
            <v-row>
              <v-col cols="12" sm="6" md="4" v-for="field in personnelFields" :key="field.label">
                <v-text-field
                  background-color="textbackground"
                  :label="field.label"
                  v-model="currentPersonnel[field.field]"
                  hide-details
                  height="48px"
                  placeholder="  "
                  outlined
                  dense
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row justify="space-around">
              <v-col cols="12" md="12">
                <v-row justify="space-around">
                  <v-col cols="12" md="2" dense>
                    <v-btn color="primary" fab @click.stop="createPersonnel">
                      <v-icon>add</v-icon>
                    </v-btn>
                  </v-col>
                  <v-col cols="12" md="2" dense>
                    <v-btn fab @click.stop="editPersonnel" :disabled="!currentPersonnel.id">
                      <v-icon>edit</v-icon>
                    </v-btn>
                  </v-col>
                  <v-col cols="12" md="2" dense>
                    <v-btn
                      fab
                      @click.stop="deletePersonnel"
                      :disabled="currentPersonnel.id == $store.state.userID || !currentPersonnel.id"
                    >
                      <v-icon>delete</v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </v-col>

              <v-col md="12" class="subtitle">
                <v-divider></v-divider>
                <h4 class="text-left">Assigned studies:</h4>
              </v-col>
              <v-col cols="12" md="12">
                <AssignedStudies
                  :Studies="currentPersonnel.Studies"
                  :labStudies="labStudies"
                  :personnelId="currentPersonnel.id"
                  :personnelName="currentPersonnel.Name"
                  @updatedStudies="updatedStudies"
                ></AssignedStudies>
              </v-col>
            </v-row>
          </v-container>

          <div>
            <v-dialog v-model="dialog" max-width="1000px" :retain-focus="false">
              <v-card>
                <v-card-title>
                  <span class="headline">Lab member information</span>
                </v-card-title>

                <v-form ref="form" v-model="valid" lazy-validation>
                  <v-container>
                    <v-row>
                      <v-col
                        cols="12"
                        sm="6"
                        md="4"
                        v-for="field in personnelFields"
                        :key="field.label"
                      >
                        <div v-if="field.options">
                          <v-combobox
                            justify="start"
                            :items="options[field.options]"
                            v-model="editedPersonnel[field.field]"
                            :label="field.label"
                            hide-details
                            height="48px"
                            placeholder="  "
                            outlined
                            dense
                          ></v-combobox>
                        </div>
                        <div v-else-if="field.rules">
                          <v-text-field
                            :label="field.label"
                            v-model="editedPersonnel[field.field]"
                            :rules="rules[field.rules]"
                            hide-details
                            height="48px"
                            placeholder="  "
                            outlined
                            dense
                          ></v-text-field>
                        </div>
                        <div v-else>
                          <v-text-field
                            :label="field.label"
                            v-model="editedPersonnel[field.field]"
                            hide-details
                            height="48px"
                            placeholder="  "
                            outlined
                            dense
                          ></v-text-field>
                        </div>
                      </v-col>
                    </v-row>

                    <v-row>
                      <v-col cols="12" md="8"></v-col>
                    </v-row>
                  </v-container>
                </v-form>
                <v-card-actions>
                  <v-row justify="space-between" style="height: 50px">
                    <v-col md="4"></v-col>
                    <v-col md="2">
                      <v-btn color="primary" @click="close">Cancel</v-btn>
                    </v-col>
                    <v-col md="2">
                      <v-btn color="primary" @click="save">Save</v-btn>
                    </v-col>
                    <v-col md="4"></v-col>
                  </v-row>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </div>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import DateDisplay from "@/components/DateDisplay";
import AssignedStudies from "@/components/AssignedStudies";

import study from "@/services/study";
import personnel from "@/services/personnel";
import login from "@/services/login";
import store from "@/store";

export default {
  components: {
    DateDisplay,
    AssignedStudies
  },
  data() {
    return {
      headerPersonnel: [
        {
          text: "Name",
          align: "center",
          value: "Name",
          width: "27%"
        },
        {
          text: "Email",
          align: "center",
          sortable: false,
          value: "Email",
          width: "35%"
        },
        {
          text: "Role",
          align: "center",
          sortable: false,
          value: "Role",
          width: "20%"
        },

        {
          text: "Active?",
          sortable: false,
          align: "center",
          value: "Active",
          width: "18%"
        }
      ],
      dialog: false,
      personnelFields: [
        { label: "Name", field: "Name" },
        { label: "Initial", field: "Initial" },
        { label: "Email", field: "Email" },
        {
          label: "Role",
          field: "Role",
          options: "role"
        },
        { label: "Calendar ID", field: "Calendar" }
      ],
      options: {
        role: [
          "PostDoc",
          "PI",
          "GradStudent",
          "Undergrad",
          "RA",
          "Lab manager",
          "Staff"
        ]
      },

      Personnels: [],
      currentPersonnel: {},
      editedPersonnel: {},
      defaultPersonnel: {
        Name: null,
        FK_Lab: store.state.lab,
        Initial: null,
        Email: null,
        Calendar: null,
        Role: null,
        Active: 1
      },
      editedIndex: -1,
      labStudies: [],
      valid: true
    };
  },

  methods: {
    async searchPersonnel() {
      var queryString = {
        FK_Lab: store.state.lab
      };

      try {
        const Result = await personnel.search(queryString);

        this.Personnels = Result.data;

        if (this.Personnels.length > 0) {
          this.editedIndex = this.editedIndex === -1 ? 0 : this.editedIndex;
          this.currentPersonnel = this.Personnels[this.editedIndex];
        }
      } catch (error) {
        if (error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login"
          });
        }
      }
    },

    async searchLabStudies() {
      var queryString = {
        FK_Lab: store.state.lab,
        Completed: 0
      };

      try {
        const Result = await study.search(queryString);

        this.labStudies = Result.data;
      } catch (error) {
        if (error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login"
          });
        }
      }
    },

    async changePersonnelStatus(item) {
      this.currentPersonnel = item;

      try {
        await personnel.update(this.currentPersonnel);
      } catch (error) {
        if (error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login"
          });
        }
      }
    },

    rowSelected(item, row) {
      row.select(true);
      this.currentPersonnel = item;
      this.editedIndex = this.Personnels.indexOf(this.currentPersonnel);
    },

    editPersonnel() {
      this.editedPersonnel = this.currentPersonnel;
      this.editedIndex = this.Personnels.indexOf(this.currentPersonnel);
      this.dialog = true;
    },

    createPersonnel() {
      this.editedPersonnel = Object.assign({}, this.defaultPersonnel);
      this.editedIndex = -1;
      this.dialog = true;
    },

    async save() {
      if (this.editedIndex < 0) {
        try {
          const Result = await login.register(this.editedPersonnel);
          this.editedPersonnel.id = Result.data.id;
          this.Personnels.push(this.editedPersonnel);
          console.log(Result.data.Email + " has been added to the system!");
        } catch (error) {
          alert(error.response.data.message);
          console.log(error.response);
        }
      } else {
        try {
          const Result = await personnel.update(this.editedPersonnel);

          this.currentPersonnel = Result.data;
          Object.assign(this.Personnels[this.editedIndex], Result.data);
        } catch (error) {
          if (error.response.status === 401) {
            alert("Authentication failed, please login.");
            this.$router.push({
              name: "Login"
            });
          }
        }
      }

      this.close();
    },

    close() {
      this.dialog = false;

      setTimeout(() => {
        // this.editedPersonnel = [];
        // this.editedIndex = -1;
      }, 300);
    },

    async deletePersonnel() {
      var personnelInfo = {
        id: this.currentPersonnel.id
      };

      try {
        await personnel.delete(personnelInfo);
        var index = this.Personnels.indexOf(this.currentPersonnel);
        this.Personnels.splice(index, 1);

        this.currentPersonnel = Object.assign({}, this.defaultPersonnel);
      } catch (error) {
        console.log(error.response);
      }
    },

    updatedStudies(updatedStudies) {
      this.currentPersonnel.Studies = updatedStudies;
    }
  },
  mounted: function() {
    this.searchPersonnel();
    this.searchLabStudies();
  }
};
</script>

<style lang="css" scoped>
.theme--light.v-data-table /deep/ thead /deep/ tr th:hover {
  color: var(--v-secondary-base) !important;
}

.v-data-table
  /deep/
  tbody
  /deep/
  tr:hover:not(.v-data-table__expanded__content) {
  /* border-bottom-width: 2px !important; */
  background-color: var(--v-secondary-lighten1) !important;
}
</style>
