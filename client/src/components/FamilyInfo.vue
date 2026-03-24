<template>
  <div>
    <SectionHeader title="Family Information" icon="mdi-account-group" />

    <div class="info-grid info-grid--2">
      <InfoField label="Family ID" :value="currentFamily?.id" icon="mdi-identifier" highlight />
      <InfoField label="Email" :value="currentFamily?.Email" type="email" icon="mdi-email-outline" />
      <InfoField label="Phone" :value="currentFamily?.Phone" type="phone" icon="mdi-phone-outline" />
      <InfoField label="Postal Code" :value="currentFamily?.Address" icon="mdi-map-marker-outline" />
      <InfoField label="Primary Caregiver" :value="currentFamily?.NamePrimary" icon="mdi-account" />
      <InfoField label="Secondary Caregiver" :value="currentFamily?.NameSecondary" icon="mdi-account-outline" />
    </div>

    <div v-if="currentFamily?.NextContactNote" class="mt-3">
      <v-textarea class="conv-textarea" label="Notes for next contact" variant="outlined" no-resize rows="4"
        hide-details readonly :model-value="currentFamily?.NextContactNote"></v-textarea>
    </div>

    <v-row justify="end" class="mt-3">
      <v-col cols="auto">
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <div v-bind="props">
              <v-btn color="primary" icon="mdi-pencil" size="small" @click.stop="editFamily"
                :disabled="!currentFamily?.id"></v-btn>
            </div>
          </template>
          <span>Edit family information</span>
        </v-tooltip>
      </v-col>
    </v-row>

    <div class="mt-2">
      <NotesConversation v-if="currentFamily?.id" :Conversation="currentFamily.Conversations"
        :familyId="parseInt(currentFamily.id)" :notes="currentFamily.Note" @updateNotes="saveNotes"></NotesConversation>
    </div>

    <v-dialog v-model="dialog" max-width="1200px" :retain-focus="false">
      <v-card variant="outlined">
        <v-card-title class="d-flex">
          <span class="text-h5">Edit family information</span>
          <v-spacer></v-spacer>
          <span class="text-h5">{{ "Family ID: " + editedItem.id }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="formFamily" v-model="valid">
            <v-row dense style="padding: 8px 8px 4px">
              <v-col md="12" class="mt-4">
                <v-divider></v-divider>
                <h4 class="text-left mt-2">Family information:</h4>
              </v-col>
              <v-col cols="12" :md="item.width" v-for="item in $familyBasicInfo" :key="item.label">
                <div v-if="!!item.options">
                  <div v-if="item.field !== 'AutismHistory'">
                    <v-combobox justify="start" v-model="editedItem[item.field]" :items="$Options[item.options]"
                      variant="outlined" :label="item.label" density="compact"></v-combobox>
                  </div>
                  <div v-else>
                    <v-select :items="$Options[item.options]" v-model="editedItem[item.field]" :label="item.label"
                      variant="outlined" density="compact" item-title="title" item-value="value"></v-select>
                  </div>
                </div>
                <div v-else-if="item.rules">
                  <v-text-field :label="item.label" :rules="$rules[item.rules]" v-model="editedItem[item.field]"
                    variant="outlined" hide-details="auto" density="compact"></v-text-field>
                </div>
                <div v-else>
                  <v-text-field :label="item.label" v-model="editedItem[item.field]" variant="outlined" hide-details
                    density="compact"></v-text-field>
                </div>
              </v-col>

              <v-col md="12" class="mt-4">
                <v-divider></v-divider>
                <h4 class="text-left mt-2">Contact information:</h4>
              </v-col>
              <v-col cols="12" :md="item.width" v-for="item in $familyContactInfo" :key="item.label">
                <div v-if="item.options">
                  <v-combobox justify="start" :items="$Options[item.options]" v-model="editedItem[item.field]"
                    variant="outlined" :label="item.label" density="compact"></v-combobox>
                </div>
                <div v-else-if="item.rules">
                  <v-text-field :label="item.label" :rules="$rules[item.rules]" v-model="editedItem[item.field]"
                    variant="outlined" hide-details="auto" density="compact"></v-text-field>
                </div>
                <div v-else>
                  <v-text-field :label="item.label" v-model="editedItem[item.field]" variant="outlined" hide-details
                    density="compact"></v-text-field>
                </div>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions style="padding: 16px">
          <v-row justify="space-between">
            <v-col md="4"></v-col>
            <v-col md="2">
              <v-btn color="primary" variant="elevated" @click="close">Cancel</v-btn>
            </v-col>
            <v-col md="2">
              <v-btn color="primary" variant="elevated" @click="save">Save</v-btn>
            </v-col>
            <v-col md="4"></v-col>
          </v-row>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import family from "@/services/family";
import NotesConversation from "@/components/NotesConversation.vue";
import InfoField from "@/components/InfoField.vue";
import SectionHeader from "@/components/SectionHeader.vue";

import { useMainStore } from "@/stores/mainStore";

export default {
  setup() {
    const store = useMainStore();
    return { store };
  },
  name: "FamilyInfo",
  components: {
    NotesConversation,
    InfoField,
    SectionHeader,
  },
  props: {
    currentFamily: {
      type: Object,
      default: () => ({})
    },
  },
  emits: ["updateFamily"],
  data() {
    return {
      dialog: false,
      valid: true,
      editedItem: {
        id: null,
        Email: null,
        Phone: null,
        NamePrimary: null,
        NameSecondary: null,
        Address: null,
        LanguagePrimary: null,
        LanguageSecondary: null,
        EnglishPercent: null,
        RacePrimary: null,
        RaceSecondary: null,
        Vehicle: null,
        RecruitmentMethod: null,
      },
      familyTemplate: {
        id: null,
        Email: null,
        Phone: null,
        NamePrimary: null,
        NameSecondary: null,
        Address: null,
        LanguagePrimary: null,
        LanguageSecondary: null,
        EnglishPercent: null,
        RacePrimary: null,
        RaceSecondary: null,
        Vehicle: null,
        RecruitmentMethod: null,
      },
      searchingFields: [
        { label: "Family ID", field: "id" },
        { label: "Postal Code", field: "Address" },
        { label: "Email", field: "Email", rules: "email" },
        { label: "Phone", field: "Phone", rules: "phone" },
        { label: "Primary Caregiver", field: "NamePrimary", rules: "name" },
        { label: "Secondary Caregiver", field: "NameSecondary", rules: "name" },
      ],
      otherInfo: [
        {
          label: "Language (P)",
          field: "LanguagePrimary",
          options: "language",
        },
        {
          label: "Language (S)",
          field: "LanguageSecondary",
          options: "language",
        },
        { label: "English %", field: "EnglishPercent" },
        { label: "Race (P)", field: "RacePrimary", options: "race" },
        { label: "Race (S)", field: "RaceSecondary", options: "race" },
        { label: "Vehicle", field: "Vehicle" },
        {
          label: "Recruited via",
          field: "RecruitmentMethod",
          options: "recruitmentMethod",
        },
        { label: "Last Contact Date", field: "LastContactDate" },
        { label: "Next ContactDate", field: "NextContactDate" },
      ],
      editableFields: [],
    };
  },

  methods: {
    editFamily() {
      if (!this.currentFamily) return;
      this.editedItem = Object.assign({}, this.currentFamily);
      this.editableFields = this.searchingFields.concat(this.otherInfo);
      this.editableFields.shift();
      this.editableFields.pop();
      this.editableFields.pop();
      this.dialog = true;
    },

    async save() {
      let validationResults = true;
      if (this.$refs.formFamily) {
        const { valid } = await this.$refs.formFamily.validate();
        validationResults = valid;
      }

      if (validationResults) {
        try {
          this.editedItem.UpdatedBy = this.store.userID;
          await family.update(this.editedItem);
          this.$emit("updateFamily", this.editedItem);
          console.log("Family information updated!");

          if (this.$refs.formFamily) {
            this.$refs.formFamily.resetValidation();
          }
        } catch (error) {
          console.log(error.response);
        }

        this.close();
      }
    },

    close() {
      this.dialog = false;
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.familyTemplate);
      }, 300);
    },

    async saveNotes(newNotes) {
      if (!this.currentFamily) return;
      this.currentFamily.Note = newNotes;
      this.currentFamily.UpdatedBy = this.store.userID;
      await family.update(this.currentFamily);
    },

    PhoneFormated(Phone) {
      if (Phone) {
        const cleaned = ("" + Phone).replace(/\D/g, "");
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
          return "(" + match[1] + ") " + match[2] + "-" + match[3];
        }
        return null;
      }
      return "";
    },
  },
};
</script>

<style scoped></style>
