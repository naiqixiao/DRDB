<template>
  <v-container fluid>
    <v-row
      class="grey lighten-5"
      style="height: 500px;"
      justify="space-around"
      dense
    >
      <v-col cols="12" lg="4" md="4">
        <v-text-field
          @keydown.enter="search"
          @click:prepend="queryString = {}"
          label="Family ID"
          id="familyId"
          v-model.lazy="queryString.id"
          prepend-icon="mdi-magnify"
        ></v-text-field>
        <v-text-field
          @keydown.enter="search"
          @click:prepend="queryString = {}"
          label="Mother's Name"
          id="NameMom"
          v-model.lazy="queryString.NameMom"
          prepend-icon="mdi-magnify"
        ></v-text-field>
        <v-text-field
          @keydown.enter="search"
          @click:prepend="queryString = {}"
          label="Email"
          id="Email"
          v-model.lazy="queryString.Email"
          prepend-icon="mdi-magnify"
        ></v-text-field>
        <div class="text-center">
          <h4>{{ page + " / " + NofFamily }}</h4>

          <v-pagination
            @next="nextPage"
            @previous="previousPage"
            circle
            v-model="page"
            :length="NofFamily"
            total-visible="1"
          ></v-pagination>
        </div>
      </v-col>
      <v-col cols="12" lg="5">
        <ChildInfo
          :Children="queryString.Children"
          :familyId="parseInt(queryString.id)"
          @CreateAppointment="updateAppointment($event)"
        ></ChildInfo>
      </v-col>
      <v-col cols="12" lg="3" md="4">
        <v-data-table
          hide-default-footer
          height="300px"
          dense
          fixed-header
          single-select
          no-data-text="No conversation is stored."
          :headers="headers"
          :items="queryString.Conversations"
          class="elevation-1"
          justify-center
        >
          <template #item.Time="{ value }">
            <DateDisplay :date="value" :format="'short'" />
          </template>
          <template v-slot:item.actions="{ item }">
            <v-icon @click="deleteItem(item)">delete</v-icon>
          </template>
        </v-data-table>

        <v-textarea
          label="Conversation with parents"
          outlined
          filled
          no-resize
          rows="3"
          solo
          v-model="conv"
          :disabled="!parseInt(queryString.id)"
        ></v-textarea>
        <v-btn
          color="purple"
          text
          :disabled="!parseInt(queryString.id) && conv.length > 5"
          @click="submitConversation"
          >submit</v-btn
        >
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
import DateDisplay from "@/components/DateDisplay";
import ChildInfo from "@/components/ChildInfo";
import AppointmentTable from "@/components/AppointmentTable";

import family from "@/services/family";
import conversation from "@/services/conversation";

export default {
  components: {
    DateDisplay,
    AppointmentTable,
    ChildInfo
  },
  data() {
    return {
      conv: "",
      page: null,
      NofFamily: 0,
      Families: [],
      queryString: {},
      dialog: false,
      headers: [
        { text: "Time", align: "center", value: "Time" },
        { text: "Conversation", align: "center", value: "Conversation" },
        { text: "Actions", align: "center", value: "actions", sortable: false }
      ]
    };
  },
  methods: {
    // SearchMode() {
    //   this.searchMode == true;
    //   this.queryString = {};
    // },
    async search() {
      try {
        const Result = await family.search(this.queryString);
        this.NofFamily = Result.data.length;
        if (this.NofFamily > 0) {
          console.log("the family is: " + JSON.stringify(Result.data));

          this.page = 1;
          this.Families = Result.data;
          this.queryString = this.Families[this.page - 1];
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

    nextPage() {
      this.queryString = this.Families[this.page - 1];
    },

    previousPage() {
      this.queryString = this.Families[this.page - 1];
    },

    async submitConversation() {
      const newConversation = {
        FK_Family: this.queryString.id,
        Conversation: this.conv,
        Time: new Date().toISOString()
      };

      try {
        await conversation.create(newConversation);
        this.conv = ""
        this.queryString.Conversations.push(newConversation);
        console.log("Conversation added!");
      } catch (error) {
        console.log("Conversation failed!");
      }
    },

    async deleteItem(item) {
      const index = this.queryString.Conversations.indexOf(item);
      if (
        confirm("Are you sure you want to delete this conversation record?")
      ) {
        try {
          await conversation.delete(item.id);
          this.queryString.Conversations.splice(index, 1);
          console.log("conversation deleted.");
        } catch (error) {
          console.log(error);
        }
      }
    },

    async updateAppointment() {
      try {
        const Result = await family.search(this.queryString);
        this.NofFamily = Result.data.length;
        if (this.NofFamily > 0) {
          // console.log("the family is: " + JSON.stringify(Result.data));

          this.page = 1;
          this.Families = Result.data;
          this.queryString = this.Families[this.page - 1];
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

.v-container {
  display: flex; /* or inline-flex */
  flex-direction: row;
}
</style>
