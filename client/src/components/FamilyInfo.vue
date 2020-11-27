<template>
  <div>
    <v-row justify="start" dense>
      <v-col cols="12" md="12" style="text-align: start">
        <span class="title">Family information</span>
      </v-col>
      <v-col
        cols="12"
        md="6"
        dense
        v-for="item in searchingFields"
        :key="item.label"
      >
        <v-text-field
          :label="item.label"
          :value="
            item.label === 'Phone'
              ? PhoneFormated(currentFamily[item.field])
              : currentFamily[item.field]
          "
          readonly
          height="48px"
          background-color="textbackground"
          hide-details
          placeholder="  "
          outlined
          dense
        ></v-text-field>
      </v-col>
    </v-row>

    <v-row justify="end">
      <v-col cols="12" md="3" dense>
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <div v-on="on">
              <v-btn
                color="primary"
                fab
                @click.stop="editFamily"
                :disabled="!currentFamily.id"
              >
                <v-icon>edit</v-icon>
              </v-btn>
            </div>
          </template>
          <span>Edit family information</span>
        </v-tooltip>
      </v-col>
    </v-row>

    <v-dialog
      v-model="dialog"
      max-width="1200px"
      :retain-focus="false"
      persistent
    >
      <v-card>
        <v-card-title>
          <span class="headline">Edit family information</span>
          <v-spacer></v-spacer>
          <span class="headline">{{ "Family ID: " + editedItem.id }}</span>
        </v-card-title>

        <v-form ref="form" v-model="valid" lazy-validation>
          <v-row>
            <v-col md="12" class="subtitle">
              <v-divider></v-divider>
              <h4 class="text-left">Family information:</h4>
            </v-col>
            <v-col
              cols="12"
              :md="item.width"
              v-for="item in this.$familyBasicInfo"
              :key="item.label"
            >
              <div v-if="!!item.options">
                <!-- :item-value="$Options[item.options]" -->
                <v-combobox
                  justify="start"
                  :items="$Options[item.options]"
                  v-model="editedItem[item.field]"
                  outlined
                  :label="item.label"
                  dense
                ></v-combobox>
              </div>
              <div v-else-if="item.rules">
                <v-text-field
                  :label="item.label"
                  :rules="$rules[item.rules]"
                  v-model="editedItem[item.field]"
                  outlined
                  hide-details
                  dense
                ></v-text-field>
              </div>
              <div v-else>
                <v-text-field
                  :label="item.label"
                  v-model="editedItem[item.field]"
                  outlined
                  hide-details
                  dense
                ></v-text-field>
              </div>
            </v-col>

            <v-col md="12" class="subtitle">
              <v-divider></v-divider>
              <h4 class="text-left">Contact information:</h4>
            </v-col>
            <v-col
              cols="12"
              :md="item.width"
              v-for="item in this.$familyContactInfo"
              :key="item.label"
            >
              <div v-if="item.options">
                <v-combobox
                  justify="start"
                  :items="$Options[item.options]"
                  v-model="editedItem[item.field]"
                  outlined
                  :label="item.label"
                  dense
                ></v-combobox>
              </div>
              <div v-else-if="item.rules">
                <v-text-field
                  :label="item.label"
                  :rules="$rules[item.rules]"
                  v-model="editedItem[item.field]"
                  outlined
                  hide-details
                  dense
                ></v-text-field>
              </div>
              <div v-else>
                <v-text-field
                  :label="item.label"
                  v-model="editedItem[item.field]"
                  outlined
                  hide-details
                  dense
                ></v-text-field>
              </div>
            </v-col>
          </v-row>
        </v-form>
        <v-card-actions>
          <v-row justify="space-between" style="height: 50px">
            <v-col md="4"></v-col>
            <v-col md="2">
              <v-btn color="primary" @click="dialog = false">Cancel</v-btn>
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
</template>

<script>
import family from "@/services/family";
import store from "@/store";

export default {
  props: {
    currentFamily: Object,
  },

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
      this.editedItem = Object.assign({}, this.currentFamily);
      this.editableFields = this.searchingFields.concat(this.otherInfo);
      this.editableFields.shift();
      this.editableFields.pop();
      this.editableFields.pop();
      this.dialog = true;
    },

    async save() {
      var validationResults = this.$refs.form.validate();

      if (validationResults) {
        try {
          this.editedItem.UpdatedBy = store.state.userID;

          await family.update(this.editedItem);

          this.$emit("updateFamily", this.editedItem);

          console.log("Family information updated!");
          this.$refs.form.resetValidation();
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
  },

  computed: {},
};
</script>

<style scoped>
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
