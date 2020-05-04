<template>
  <v-container>
    <v-row justify="start" dense>
      <v-col cols="12" md="12">
        <span class="headline">Family information</span>
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
          v-model="currentFamily[item.field]"
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

    <div>
      <v-dialog v-model="dialog" max-width="1200px" :retain-focus="false">
        <v-card>
          <v-card-title>
            <span class="headline">Family information</span>
          </v-card-title>

          <v-form ref="form" v-model="valid" lazy-validation>
            <v-container>
              <v-row>
                <v-col
                  cols="12"
                  sm="6"
                  md="3"
                  v-for="field in editableFields"
                  :key="field.label"
                >
                  <div v-if="field.options">
                    <v-combobox
                      justify="start"
                      :items="options[field.options]"
                      v-model="editedItem[field.field]"
                      :label="field.label"
                      height="48px"
                      background-color="textbackground"
                      hide-details
                      placeholder="  "
                      outlined
                      dense
                    ></v-combobox>
                  </div>
                  <div v-else-if="field.rules">
                    <v-text-field
                      :label="field.label"
                      v-model="editedItem[field.field]"
                      :rules="rules[field.rules]"
                      height="48px"
                      background-color="textbackground"
                      hide-details
                      placeholder="  "
                      outlined
                      dense
                    ></v-text-field>
                  </div>
                  <div v-else>
                    <v-text-field
                      :label="field.label"
                      v-model="editedItem[field.field]"
                      height="48px"
                      background-color="textbackground"
                      hide-details
                      placeholder="  "
                      outlined
                      dense
                    ></v-text-field>
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </v-form>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="green darken-1" text @click="dialog = false"
              >Cancel</v-btn
            >
            <v-btn color="green darken-1" text @click="save">Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>

    <v-row justify="end">
      <v-col cols="12" md="3" dense>
        <v-btn
          color="primary"
          fab
          @click.stop="editFamily"
          :disabled="!currentFamily.id"
          ><v-icon>edit</v-icon></v-btn
        >
      </v-col>
    </v-row>
  </v-container>
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
        NameMom: null,
        NameDad: null,
        Address: null,
        LanguageMom: null,
        LanguageDad: null,
        EnglishPercent: null,
        RaceMom: null,
        RaceDad: null,
        Vehicle: null,
        RecruitmentMethod: null,
      },
      familyTemplate: {
        id: null,
        Email: null,
        Phone: null,
        NameMom: null,
        NameDad: null,
        Address: null,
        LanguageMom: null,
        LanguageDad: null,
        EnglishPercent: null,
        RaceMom: null,
        RaceDad: null,
        Vehicle: null,
        RecruitmentMethod: null,
      },
      searchingFields: [
        { label: "Family ID", field: "id" },
        { label: "Postal Code", field: "Address" },
        { label: "Email", field: "Email", rules: "email" },
        { label: "Phone", field: "Phone", rules: "phone" },
        { label: "Mother's Name", field: "NameMom", rules: "name" },
        { label: "Father's Name", field: "NameDad", rules: "name" },
      ],
      otherInfo: [
        {
          label: "Mother's Language",
          field: "LanguageMom",
          options: "language",
        },
        {
          label: "Father's Language",
          field: "LanguageDad",
          options: "language",
        },
        { label: "English %", field: "EnglishPercent" },
        { label: "Mother's Race", field: "RaceMom", options: "race" },
        { label: "Father's Race", field: "RaceDad", options: "race" },
        { label: "Vehicle", field: "Vehicle" },
        {
          label: "Recruited via",
          field: "RecruitmentMethod",
          options: "recruitmentMethod",
        },
        { label: "Last Contact Date", field: "LastContactDate" },
        { label: "Next ContactDate", field: "NextContactDate" },
      ],
      options: {
        language: ["English", "French", "Chinese", "Spanish", "Hindi"],
        race: ["Indian", "Asian", "African", "Hispanic", "Caucasian", "Arabic"],
        recruitmentMethod: [
          "Hospital",
          "Events",
          "SocialMedia",
          "PreviousParticipation",
        ],
      },
      rules: {
        name: [
          (value) => !!value || "Required.",
          (value) => {
            var pattern = /^[\w'\-,.][^0-9_!¡?÷?¿/\\+=@#$%ˆ&*(){}|~<>;:[\]]{2,}$/;
            return pattern.test(value) || "Invalid Name.";
          },
          (value) => (value && value.length <= 30) || "Max 30 characters",
        ],
        email: [
          (value) => !!value || "Required.",
          (value) => {
            const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return pattern.test(value) || "Invalid e-mail.";
          },
          (value) => (value && value.length <= 30) || "Max 30 characters",
        ],
        phone: [
          (value) => {
            const pattern = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
            return pattern.test(value) || "Invalid phone.";
          },
          (value) => !!value || "Required.",
          (value) => (value && value.length == 10) || "Have to be 10 digits",
        ],
      },
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

          console.log("Family information updated!");
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
