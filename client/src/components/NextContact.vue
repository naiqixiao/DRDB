<template>
  <v-container fluid>
    <v-card outlined>
      <v-card-title>When to contact this family again?</v-card-title>

      <v-row align="center" justify="start" dense>
        <v-col cols="12" md="2">
          <v-text-field label="After" suffix="days" v-model="daysAfter">
          </v-text-field>
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            ref="contactDate"
            label="Contact after"
            v-model="nextContactDate"
            append-icon="event"
            @click:append="datePicker = true"
          ></v-text-field>
        </v-col>
      </v-row>

      <v-row align="center" justify="start">
        <v-col cols="12" md="2">
          <v-switch
            v-if="contactType == 'NoMoreContact'"
            v-model="neverContact"
            label="No more contact"
          >
          </v-switch>
        </v-col>
      </v-row>

      <v-row align="center">
        <v-col cols="12" lg="9">
          <v-textarea
            class="conv-textarea"
            label="Notes for next contact"
            no-resize
            rows="3"
            solo
            hide-details
            v-model="nextContactNote"
          ></v-textarea>
        </v-col>
      </v-row>
    </v-card>

    <v-dialog v-model="datePicker" max-width="360px">
      <v-card>
        <v-row align="center">
          <v-col cols="12" lg="12">
            <v-date-picker
              v-model="nextContactDate"
              show-current
              @click:date="datePick"
              :min="new Date().toISOString()"
            ></v-date-picker>
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import family from "@/services/family";
import moment from "moment";

export default {
  components: {},
  props: {
    familyId: Number,
    studyDate: String,
    contactType: String,
    nextContactDialog: Boolean,
  },

  data() {
    return {
      nextContactDate: null,
      neverContact: false,
      nextContactNote: "",
      dialogNextContact: false,
      datePicker: false,
    };
  },
  methods: {
    datePick() {
      this.datePicker = false;
      setTimeout(() => {
        this.$refs.contactDate.focus();
      }, 100);
    },

    closeNextContact() {
      this.$emit("nextContactDone", {
        id: this.currentFamily.id,
        NextContactDate: this.nextContactDate,
        NextContactNote: this.nextContactNote,
        NoMoreContact: this.neverContact,
      });
    },

    async updateNextContact() {
      var updatedFamilyInfo = {
        id: this.familyId,
        NextContactNote: this.nextContactNote,
        NextContactDate: this.nextContactDate,
        LastContactDate: moment()
          .startOf("day")
          .format("YYYY-MM-DD"),
        NoMoreContact: this.neverContact,
      };

      try {
        await family.update(updatedFamilyInfo);
      } catch (error) {
        console.log(error.response);
      }
    },
  },

  computed: {
    daysAfter: {
      get() {
        if (this.nextContactDate) {
          return moment(this.nextContactDate).diff(
            moment().startOf("day"),
            "days"
          );
        } else {
          return 0;
        }
      },
      set(newValue) {
        this.nextContactDate = moment()
          .startOf("day")
          .add(parseInt(newValue), "days")
          .format("YYYY-MM-DD");
      },
    },
  },

  watch: {
    nextContactDialog(val) {
      if (val) {
        switch (this.contactType) {
          case "Confirmed":
            this.nextContactDate = moment(this.studyDate)
              .add(7, "days")
              .format("YYYY-MM-DD");

            this.nextContactNote = "7 days after their participation.";
            break;

          case "Interested":
          case "Left a message":
            this.nextContactDate = moment()
              .startOf("day")
              .add(2, "days")
              .format("YYYY-MM-DD");
            this.nextContactNote =
              "Left a message or sent an email, follow up.";
            break;

          case "NextContact":
            break;
        }
      } else {
        this.nextContactDate = null;
        this.nextContactNote = null;
      }
    },
  },
};
</script>

<style lang="scss" scoped></style>
