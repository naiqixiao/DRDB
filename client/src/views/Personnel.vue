<template>
  <v-container fluid>
    <div v-if="!$store.state.labEmailStatus">
      <v-alert
        border="left"
        type="error"
        color="#c73460"
        dense
        style="font-weight: 600"
        >Lab email is not been setup properly. Please set it up in the Settings
        page.</v-alert
      >
    </div>
    <div v-if="!$store.state.adminEmailStatus">
      <v-alert
        border="left"
        type="warning"
        color="#c7792c"
        dense
        style="font-weight: 600"
        >Admin email is not been setup properly. Please set it up in the
        Settings page.</v-alert
      >
    </div>

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
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <div v-on="on">
                  <v-simple-checkbox
                    class="mr-0 pa-0"
                    :value="!!item.Active"
                    @input="changePersonnelStatus(item)"
                    :disabled="
                      !(currentPersonnel.id == $store.state.userID ||
                        $store.state.role == 'Admin' ||
                        $store.state.role == 'PI' ||
                        $store.state.role == 'Lab manager'
                      )
                    "
                    dense
                  ></v-simple-checkbox>
                </div>
              </template>
              <span>Mark whether this person is available to run studies</span>
            </v-tooltip>
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
              <v-col
                cols="12"
                sm="6"
                md="4"
                v-for="item in personnelFields"
                :key="item.label"
              >
                <v-text-field
                  background-color="textbackground"
                  :label="item.label"
                  :value="
                    item.label === 'Phone'
                      ? PhoneFormated(currentPersonnel[item.field])
                      : currentPersonnel[item.field]
                  "
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
                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <div v-on="on">
                          <v-btn
                            fab
                            @click.stop="createPersonnel"
                            :disabled="
                              $store.state.role != 'Admin' &&
                              $store.state.role != 'PI' &&
                              $store.state.role != 'PostDoc' &&
                              $store.state.role != 'GradStudent' &&
                              $store.state.role != 'Lab manager'
                            "
                          >
                            <v-icon class="fabIcon">add</v-icon>
                          </v-btn>
                        </div>
                      </template>
                      <span>Add a new person to the lab</span>
                    </v-tooltip>
                  </v-col>
                  <v-col cols="12" md="2" dense>
                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <div v-on="on">
                          <v-btn
                            fab
                            @click.stop="editPersonnel"
                            :disabled="
                              !currentPersonnel.id ||
                              (currentPersonnel.id != $store.state.userID &&
                                $store.state.role != 'Admin' &&
                                $store.state.role != 'PI' &&
                                $store.state.role != 'Lab manager')
                            "
                          >
                            <v-icon class="fabIcon">edit</v-icon>
                          </v-btn>
                        </div>
                      </template>
                      <span>Edit personnel information</span>
                    </v-tooltip>
                  </v-col>
                  <v-col cols="12" md="2" dense>
                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <div v-on="on">
                          <v-btn
                            fab
                            @click.stop="deletePersonnel"
                            :disabled="
                              !currentPersonnel.id ||
                              ($store.state.role != 'Admin' &&
                                $store.state.role != 'PI' &&
                                $store.state.role != 'Lab manager')
                            "
                          >
                            <v-icon class="fabIcon">delete</v-icon>
                          </v-btn>
                        </div>
                      </template>
                      <span>Remove this person from the lab</span>
                    </v-tooltip>
                  </v-col>
                </v-row>
              </v-col>

              <v-col md="12" class="subtitle">
                <v-divider></v-divider>
                <h4 class="text-left">Assigned studies:</h4>
              </v-col>
              <v-col cols="12" md="12">
                <AssignedStudies
                  :Studies="currentPersonnel.AssignedStudies"
                  :labStudies="labStudies"
                  :personnelId="currentPersonnel.id"
                  :personnelName="currentPersonnel.Name"
                  @updatedStudies="updatedStudies"
                ></AssignedStudies>
              </v-col>
            </v-row>
          </v-container>

          <div>
            <v-dialog
              v-model="dialog"
              max-width="1000px"
              :retain-focus="false"
              persistent
            >
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
                        v-for="item in personnelFields"
                        :key="item.label"
                      >
                        <div v-if="item.options">
                          <v-select
                            justify="start"
                            :items="
                              $store.state.role == 'Admin' ||
                              $store.state.role == 'PI' ||
                              $store.state.role == 'Lab manager'
                                ? $Options.fullRoles
                                : $Options.limitedRoles
                            "
                            v-model="editedPersonnel[item.field]"
                            :label="item.label"
                            :rules="$rules[item.rules]"
                            hide-details
                            height="48px"
                            placeholder="  "
                            outlined
                            dense
                            chip
                          ></v-select>
                        </div>
                        <div v-else-if="item.rules">
                          <v-text-field
                            :label="item.label"
                            v-model="editedPersonnel[item.field]"
                            :rules="$rules[item.rules]"
                            hide-details
                            height="48px"
                            placeholder="  "
                            outlined
                            dense
                          ></v-text-field>
                        </div>
                        <div v-else>
                          <v-text-field
                            :label="item.label"
                            v-model="editedPersonnel[item.field]"
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
    AssignedStudies,
  },
  data() {
    return {
      headerPersonnel: [
        {
          text: "Name",
          align: "center",
          value: "Name",
          width: "27%",
        },
        {
          text: "Email",
          align: "center",
          sortable: false,
          value: "Email",
          width: "35%",
        },
        {
          text: "Role",
          align: "center",
          sortable: false,
          value: "Role",
          width: "20%",
        },

        {
          text: "Active?",
          sortable: false,
          align: "center",
          value: "Active",
          width: "18%",
        },
      ],
      dialog: false,
      personnelFields: [
        { label: "Name", field: "Name", rules: "name" },
        { label: "Initials", field: "Initial", rules: "required" },
        {
          label: "Role",
          field: "Role",
          options: "role",
          rules: "required",
        },
        { label: "Email", field: "Email", rules: "email" },
        { label: "Calendar ID", field: "Calendar", rules: "email" },
        { label: "Phone", field: "Phone", rules: "phone" },
      ],

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
        Active: true,
      },
      editedIndex: -1,
      labStudies: [],
      valid: true,
    };
  },

  methods: {
    async searchPersonnel() {
      var queryString = {
        FK_Lab: store.state.lab,
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
            name: "Login",
          });
        }
      }
    },

    async searchLabStudies() {
      var queryString = {
        FK_Lab: store.state.lab,
        Completed: 0,
      };

      try {
        const Result = await study.search(queryString);

        this.labStudies = Result.data;
      } catch (error) {
        if (error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login",
          });
        }
      }
    },

    async changePersonnelStatus(item) {
      // this.currentPersonnel = item;

      try {
        item.Active = !item.Active;
        await personnel.update(item);
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
      this.currentPersonnel = item;
      this.editedIndex = this.Personnels.indexOf(this.currentPersonnel);
    },

    editPersonnel() {
      this.editedPersonnel = Object.assign({}, this.currentPersonnel);
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
          const KKK = await fetch("https://api.ipify.org/?format=json");

          var ip = await KKK.json();

          this.editedPersonnel.IP = ip.ip;

          const Result = await login.register(this.editedPersonnel);
          this.editedPersonnel.id = Result.data.id;
          this.Personnels.push(this.editedPersonnel);
          alert(Result.data.Email + " has been added to the system!");
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
              name: "Login",
            });
          }
        }
      }

      this.close();
    },

    PhoneFormated(Phone) {
      if (Phone) {
        var cleaned = ("" + Phone).replace(/\D/g, "");
        var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
          return "(" + match[1] + ") " + match[2] + "-" + match[3];
        }
        return null;
      }
    },

    close() {
      this.dialog = false;

      setTimeout(() => {
        // this.currentPersonnel = Object.assign({}, this.editedPersonnel);
        this.editedPersonnel = {};
        // this.editedIndex = -1;
      }, 300);
    },

    async deletePersonnel() {
      var personnelInfo = {
        id: this.currentPersonnel.id,
      };

      try {
        await personnel.delete(personnelInfo);
        alert(this.currentPersonnel.Name + " is removed from the system.");

        var index = this.Personnels.indexOf(this.currentPersonnel);
        this.Personnels.splice(index, 1);

        this.currentPersonnel = Object.assign({}, this.defaultPersonnel);
      } catch (error) {
        console.log(error.response);
      }
    },

    updatedStudies(updatedStudies) {
      this.currentPersonnel.AssignedStudies = updatedStudies;
    },
  },
  mounted: function () {
    this.searchPersonnel();
    this.searchLabStudies();
  },
};
</script>

<style lang="css" scoped>
/* .theme--light.v-data-table /deep/ thead /deep/ tr th:hover {
  color: var(--v-secondary-base) !important;
}

.v-data-table
  /deep/
  tbody
  /deep/
  tr:hover:not(.v-data-table__expanded__content) {
  border-bottom-width: 2px !important;
  background-color: var(--v-secondary-lighten1) !important;
} */

/deep/ tr.v-data-table__selected {
  /* color: var(--v-secondary-lighten1) !important; */
  /* margin: 2px !important;
  border-style: double   !important; */
  background-color: var(--v-secondary-lighten1) !important;
}

.theme--light.v-icon {
  color: var(--v-primary-base);
  font-size: 28px;
  padding-left: 2px;
  padding-right: 2px;
}

.fabIcon {
  color: var(--v-secondary-base) !important;
}
</style>
