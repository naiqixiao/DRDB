<template>
  <v-card variant="outlined">
    <v-tabs v-model="tab" color="secondary" bg-color="primary" align-tabs="center">
      <v-tab value="notes">
        <v-icon class="pe-1">mdi-format-list-bulleted</v-icon>
        Notes
      </v-tab>
      <v-tab value="conv">
        <v-icon class="pe-1">mdi-forum</v-icon>
        Conv.
      </v-tab>
    </v-tabs>

    <v-window v-model="tab" class="tabs-items">
      <v-window-item value="notes">
        <v-container>
          <v-row dense>
            <v-col class="pa-2">
              <v-textarea 
                class="conv-textarea" 
                label="Notes about the family." 
                variant="outlined"
                no-resize 
                rows="21" 
                hide-details
                v-model="newNotes" 
                :disabled="!familyId" 
                @update:model-value="saveNotes"
              ></v-textarea>
            </v-col>
          </v-row>
        </v-container>
      </v-window-item>

      <v-window-item value="conv">
        <v-container style="height: 600px; display: flex; flex-direction: column;" class="pa-2">
          <v-row dense class="flex-grow-1">
            <v-col cols="12">
              <v-data-table 
                :headers="headers" 
                :items="Conversation" 
                class="elevation-1"
                height="450px"
                fixed-header
                items-per-page="-1"
                hide-default-footer
                no-data-text="No conversation is stored."
              >
                <!-- eslint-disable-next-line vue/valid-v-slot -->
                <template #item.Time="{ item }">
                  <DateDisplay :date="item.Time" format="short" />
                </template>
                <!-- eslint-disable-next-line vue/valid-v-slot -->
                <template #item.Conversation="{ item }">
                  <div class="text-start">{{ item.Conversation }}</div>
                </template>
                <!-- eslint-disable-next-line vue/valid-v-slot -->
                <template #item.actions="{ item }">
                  <v-btn icon="mdi-delete" variant="text" size="small" @click="deleteItem(item)"></v-btn>
                </template>
              </v-data-table>
            </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="12">
              <v-textarea 
                class="conv-textarea" 
                label="Conversation with parents" 
                variant="outlined" 
                no-resize 
                rows="4" 
                hide-details
                v-model="conv" 
                :disabled="!familyId" 
                append-inner-icon="mdi-send" 
                @click:append-inner="submitConversation"
              ></v-textarea>
            </v-col>
          </v-row>
        </v-container>
      </v-window-item>
    </v-window>
  </v-card>
</template>

<script>
import DateDisplay from "@/components/DateDisplay.vue";
import conversation from "@/services/conversation";

export default {
  name: "NotesConversation",
  components: {
    DateDisplay,
  },
  props: {
    Conversation: {
      type: Array,
      default: () => [],
    },
    notes: String,
    familyId: Number,
  },
  emits: ["updateNotes"],
  data() {
    return {
      tab: "notes",
      conv: "",
      newNotes: this.notes || "",
      headers: [
        { title: "Time", align: "center", key: "Time", sortable: false, width: "25%" },
        { title: "Conversation", align: "center", key: "Conversation", sortable: false, width: "67%" },
        { title: "", align: "center", key: "actions", sortable: false, width: "8%" },
      ],
    };
  },
  methods: {
    async submitConversation() {
      if (!this.conv.trim()) return;
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
        console.error("Conversation failed!", error);
      }
    },

    saveNotes() {
      this.$emit("updateNotes", this.newNotes);
    },

    async deleteItem(item) {
      const index = this.Conversation.indexOf(item);
      if (confirm("Are you sure you want to delete this conversation record?")) {
        try {
          await conversation.delete({ id: item.id });
          this.Conversation.splice(index, 1);
          console.log("conversation deleted.");
        } catch (error) {
          console.error(error);
        }
      }
    },
  },
  watch: {
    familyId(val) {
      if (val) {
        this.newNotes = this.notes;
      } else {
        this.newNotes = "";
      }
    },
    notes(val) {
      if (this.familyId) {
        this.newNotes = val;
      }
    }
  },
};
</script>

<style scoped>
.tabs-items {
  background-color: transparent;
}
</style>
