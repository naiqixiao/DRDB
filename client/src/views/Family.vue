<template>
  <v-container fluid>
    <v-row
      class="grey lighten-5"
      style="height: 500px;"
      justify="space-around"
      dense
    >
      <v-col cols="12" lg="4" md="4">
        <FamilyInfo
          @searchFamily="updateFamily"
        ></FamilyInfo>
      </v-col>
      <v-col cols="12" lg="5" >
        <ChildInfo
          :Children="queryString.Children"
          :familyId="parseInt(queryString.id)"
          @CreateAppointment="updateAppointment"
        ></ChildInfo>
      </v-col>
      <v-col cols="12" lg="3" md="4">
        <Conversation
          :Conversation="queryString.Conversations"
          :familyId="parseInt(queryString.id)"
        ></Conversation>
      </v-col>
    </v-row>
    <v-row class="grey lighten-5" style="height: 400px;" justify="start" dense>
      <v-col cols="12" lg="8" md="8">
        <AppointmentTable
          :Appointments="queryString.Appointments"
        ></AppointmentTable>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import ChildInfo from "@/components/ChildInfo";
import AppointmentTable from "@/components/AppointmentTable";
import Conversation from "@/components/Conversation";
import FamilyInfo from "@/components/FamilyInfo";

import family from "@/services/family";

export default {
  components: {
    AppointmentTable,
    ChildInfo,
    Conversation,
    FamilyInfo
  },
  data() {
    return {
      searchFamilies: [],
      queryString: {}
    };
  },
  methods: {
    async updateAppointment() {
      try {
        const Result = await family.search(this.queryString);
        this.NofFamily = Result.data.length;
        if (this.NofFamily > 0) {
          // console.log("the family is: " + JSON.stringify(Result.data));

          this.page = 1;
          this.searchFamilies = Result.data;
          this.queryString = this.searchFamilies[this.page - 1];
        } else {
          alert("no family can be found");
          this.page = 0;
          this.queryString = {};
        }
        // this.searchMode == false;
      } catch (error) {
        if (error.response.status === 401) {
          alert("Authentication failed, please login.");
          this.$router.push({
            name: "Login"
          });
        }
      }
    },

    updateFamily(family) {
      this.queryString = family;
    }
  },
  computed: {},
  watch: {}
};
</script>

<style scoped>
/deep/ .v-pagination__item {
  display: none;
}
/deep/ .v-pagination__more {
  display: none;
}

/deep/ .v-text-field .v-input__control .v-input__slot {
  width: "150px";
  dense: true;
  clearable: true;
  color: "primary";
  autocomplete: "off";
  outlined: true;
}

/deep/ .v-container {
  display: flex; /* or inline-flex */
  flex-direction: row;
}
</style>
