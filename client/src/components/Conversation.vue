<template>
  <v-container>
    <v-data-table
      hide-default-footer
      height="300px"
      dense
      fixed-header
      single-select
      no-data-text="No conversation is stored."
      :headers="headers"
      :items="Conversation"
      class="elevation-1"
      justify-center
    >
      <template #item.Time="{ value }">
        <DateDisplay :date="value" :format="'short'" />
      </template>

      <template #item.actions="{ item }">
        <v-icon @click="deleteItem(item)">delete</v-icon>
      </template>
    </v-data-table>
    <v-row align="center">
      <v-col cols="12" lg="9">
        <v-textarea
          label="Conversation with parents"
          outlined
          filled
          no-resize
          rows="4"
          solo
          v-model="conv"
          :disabled="!familyId"
        ></v-textarea>
      </v-col>
      <v-col cols="12" lg="2" 
        ><v-btn
          color="purple"
          text
          :disabled="!parseInt(familyId) && conv.length > 5"
          @click="submitConversation"
          >submit</v-btn
        ></v-col
      >
    </v-row>
  </v-container>
</template>

<script>
import DateDisplay from "@/components/DateDisplay";
import conversation from "@/services/conversation";

export default {
  components: {
    DateDisplay
  },
  props: {
    Conversation: Array,
    familyId: Number
  },

  data() {
    return {
      conv: "",
      headers: [
        { text: "Time", align: "center", value: "Time" },
        { text: "Conversation", align: "left", value: "Conversation" },
        { text: "Actions", align: "center", value: "actions", sortable: false }
      ]
    };
  },

  methods: {
    async submitConversation() {
      const newConversation = {
        FK_Family: this.familyId,
        Conversation: this.conv,
        Time: new Date().toISOString()
      };

      try {
        await conversation.create(newConversation);
        this.conv = "";
        this.Conversation.push(newConversation);
        console.log("Conversation added!");
      } catch (error) {
        console.log("Conversation failed!");
      }
    },

    async deleteItem(item) {
      const index = this.Conversation.indexOf(item);
      if (
        confirm("Are you sure you want to delete this conversation record?")
      ) {
        try {
          await conversation.delete(item.id);
          this.Conversation.splice(index, 1);
          console.log("conversation deleted.");
        } catch (error) {
          console.log(error);
        }
      }
    }
  }
};
</script>
