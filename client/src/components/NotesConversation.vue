<template>
  <v-card>
    <v-tabs fixed-tabs v-model="tabs" color="var(--v-secondary-base)" background-color="var(--v-primary-base)">
      <v-tab>
        <v-icon style="padding-right: 4px">format_list_bulleted</v-icon>
        Notes
      </v-tab>
      <v-tab>
        <v-icon style="padding-right: 4px">forum</v-icon>
        Conv.
      </v-tab>

      <v-tab-item class="tabs-items">
        <v-row justify="space-between" align="end" dense>
          <v-col class="noPadding">
            <v-textarea class="conv-textarea" label="Notes about the family." no-resize rows="23" hide-details
              v-model="newNotes" :disabled="!familyId" @change="saveNotes"></v-textarea>
          </v-col>
        </v-row>
      </v-tab-item>

      <v-tab-item class="tabs-items">
        <v-row justify="space-between" align="end" dense>
          <v-col cols="12" md="12" class="noPadding">
            <v-data-table hide-default-footer height="450px" dense fixed-header single-select
              no-data-text="No conversation is stored." :headers="headers" :items="Conversation" class="elevation-1"
              justify-center calculate-widths disable-pagination>
              <template #item.Time="{ value }">
                <DateDisplay :date="value" :format="'short'" />
              </template>
              <template #item.Conversation="{ value }">
                <div style="text-align: left">{{ value }}</div>
              </template>

              <template #item.actions="{ item }">
                <v-icon @click="deleteItem(item)">delete</v-icon>
              </template>
            </v-data-table>
          </v-col>
          <v-col class="noPadding">
            <v-textarea class="conv-textarea" label="Conversation with parents" outlined no-resize rows="4" hide-details
              v-model="conv" :disabled="!familyId" append-icon="mdi-send" @click:append="submitConversation"></v-textarea>
          </v-col>
        </v-row>
      </v-tab-item>
    </v-tabs>

  </v-card>
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
    notes: String,
    familyId: Number,
  },

  data() {
    return {
      tabs: null,
      conv: "",
      newNotes: "",
      headers: [
        {
          text: "Time",
          align: "center",
          value: "Time",
          sortable: false,
          width: "25%",
        },
        {
          text: "Conversation",
          align: "center",
          value: "Conversation",
          sortable: false,
          width: "67%",
        },
        {
          text: "",
          align: "center",
          value: "actions",
          sortable: false,
          width: "8%",
        },
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
        const result = await conversation.create(newConversation);
        newConversation.id = result.data.id;

        this.conv = "";
        this.Conversation.push(newConversation);
        console.log("Conversation added!");
      } catch (error) {
        console.log("Conversation failed!");
      }
    },

    saveNotes() {
      this.$emit("updateNotes", this.newNotes);
    },

    async deleteItem(item) {
      const index = this.Conversation.indexOf(item);
      if (
        confirm("Are you sure you want to delete this conversation record?")
      ) {
        try {
          await conversation.delete({ id: item.id });
          this.Conversation.splice(index, 1);
          console.log("conversation deleted.");
        } catch (error) {
          console.log(error);
        }
      }
    },
  },

  watch: {
    familyId(val) {
      if (val) {
        this.newNotes = this.notes;
      }
      if (!val) {
        this.newNotes = "";
      }
    },
    // notes(val) {
    //   if (val) {
    //     this.newNotes = this.notes;
    //   }
    // },
  },
};
</script>

<style lang="scss" scoped>
.noPadding {
  padding: 8px 8px 4px 8px !important;
}

.tabs-items {
  background-color: rgba($color: #000000, $alpha: 0);
  height: 600px;
}

.v-tab {
  max-width: 50%;
}
</style>
