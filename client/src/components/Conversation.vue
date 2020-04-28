<template>
  <v-row justify="space-between" align="end" dense>
    <v-col cols="12" md="12" class="noPadding">
      <v-data-table
        hide-default-footer
        height="360px"
        dense
        fixed-header
        single-select
        no-data-text="No conversation is stored."
        :headers="headers"
        class="elevation-1"
        :items="Conversation"
        justify-center
      >
        <template #item.Time="{ value }">
          <DateDisplay :date="value" :format="'short'" />
        </template>

        <template #item.actions="{ item }">
          <v-icon @click="deleteItem(item)">delete</v-icon>
        </template>
      </v-data-table>
    </v-col>
    <v-col class="noPadding">
      <v-textarea
        class="conv-textarea"
        label="Conversation with parents"
        outlined
        no-resize
        rows="4"
        solo
        hide-details
        v-model="conv"
        :disabled="!familyId"
        append-icon="mdi-send"
        @click:append="submitConversation"
      ></v-textarea>
    </v-col>
  </v-row>
</template>

<script>
import DateDisplay from "@/components/DateDisplay";
import conversation from "@/services/conversation";

export default {
  components: {
    DateDisplay,
  },
  props: {
    Conversation: Array,
    familyId: Number,
  },

  data() {
    return {
      conv: "",
      headers: [
        { text: "Time", align: "center", value: "Time" },
        { text: "Conversation", align: "left", value: "Conversation" },
        { text: "Actions", align: "center", value: "actions", sortable: false },
      ],
    };
  },

  methods: {
    async submitConversation() {
      const newConversation = {
        FK_Family: this.familyId,
        Conversation: this.conv,
        Time: new Date().toISOString(),
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
    },
  },
};
</script>

<style lang="scss">
.noPadding {

  padding: 8px 0px 12px 0px !important;
}
</style>
