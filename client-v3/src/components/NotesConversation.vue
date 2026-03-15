<template>
  <v-card class="ds-card h-100 d-flex flex-column" variant="flat">
    <v-tabs v-model="tab" color="primary" bg-color="grey-lighten-4" align-tabs="center">
      <v-tab value="notes">
        <v-icon start>mdi-format-list-bulleted</v-icon>
        Notes
      </v-tab>
      <v-tab value="conv">
        <v-icon start>mdi-forum</v-icon>
        Conv.
      </v-tab>
    </v-tabs>

    <v-window v-model="tab" class="tabs-items flex-grow-1 h-100">
      <v-window-item value="notes" class="h-100">
        <v-container class="h-100 pa-2 d-flex flex-column">
          <v-textarea 
            class="conv-textarea flex-grow-1 d-flex flex-column h-100" 
            label="Notes about the family." 
            variant="outlined"
            no-resize 
            hide-details
            v-model="newNotes" 
            :disabled="!familyId" 
            @update:model-value="saveNotes"
          ></v-textarea>
        </v-container>
      </v-window-item>

      <v-window-item value="conv" class="h-100">
        <v-container class="h-100 pa-2 d-flex flex-column">
          <div class="flex-grow-1" style="position: relative; min-height: 0;">
            <div style="position: absolute; top: 0; bottom: 0; left: 0; right: 0;">
              <v-data-table 
                :headers="headers" 
                :items="Conversation" 
                class="elevation-1 h-100 d-flex flex-column"
                fixed-header
                height="100%"
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
            </div>
          </div>
          
          <div class="flex-shrink-0 mt-2">
            <v-textarea 
              class="conv-textarea-small" 
              label="Conversation with parents" 
              variant="outlined" 
              no-resize 
              rows="3" 
              hide-details
              v-model="conv" 
              :disabled="!familyId" 
              append-inner-icon="mdi-send" 
              @click:append-inner="submitConversation"
              @keydown.enter.prevent="submitConversation"
            ></v-textarea>
          </div>
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
:deep(.v-window__container) {
  height: 100%;
}
:deep(.v-window-item) {
  height: 100%;
}
:deep(.conv-textarea .v-input__control) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
:deep(.conv-textarea .v-field) {
  height: 100%;
}
</style>
