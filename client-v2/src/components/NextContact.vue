<template>
  <v-container fluid>
    <v-card outlined>
      <div v-if="contactType != 'NoMoreContact'">
        <v-card-title>When to contact this family again?</v-card-title>
        <v-card-text>
          <v-row align="center" justify="start">
            <v-col cols="12" md="1"></v-col>
            <v-col cols="12" md="2">
              <v-text-field
                class="pa=3"
                label="After"
                suffix="days"
                hide-details
                v-model="daysAfter"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                class="pa=3"
                ref="contactDate"
                label="Contact after"
                v-model="nextContactDate"
                append-icon="event"
                hide-details
                @click:append="datePicker = true"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row align="center">
            <v-col cols="12" lg="9">
              <v-textarea
                class="conv-textarea"
                label="Notes for next contact"
                no-resize
                rows="6"
                hide-details
                outlined
                v-model="nextContactNote"
              ></v-textarea>
            </v-col>
          </v-row>
        </v-card-text>
      </div>
      <div v-else>
        <v-card-title>No more contact this family?</v-card-title>
        <v-card-text
          ><v-row align="center" justify="start">
            <v-col cols="12" md="1"></v-col>
            <v-col cols="12" md="4">
              <v-checkbox
                v-model="neverContact"
                hide-details
                label="No more contact"
              ></v-checkbox>
            </v-col>
          </v-row>

          <v-row align="center">
            <v-col cols="12" lg="9">
              <v-textarea
                label="Notes for next contact"
                no-resize
                rows="6"
                hide-details
                outlined
                v-model="nextContactNote"
              ></v-textarea>
            </v-col>
          </v-row>
        </v-card-text>
      </div>
    </v-card>

    <v-dialog v-model="datePicker" max-width="290px">
      <v-card outlined>
        <v-date-picker
          v-model="nextContactDate"
          show-current
          @click:date="datePick"
          :min="new Date().toISOString()"
        ></v-date-picker>
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
    labId: Number,
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
      Lab: this.labId,
    };
  },
  methods: {
    datePick() {
      this.datePicker = false;
      setTimeout(() => {
        this.$refs.contactDate.focus();
      }, 100);
    },

    async updateNextContact() {
      if (this.contactType == "NoMoreContact") {
        switch (this.neverContact) {
          case true:
            this.nextContactDate = moment()
              .startOf("day")
              .add(100, "y")
              .format("YYYY-MM-DD");
            break;
          case false:
            this.nextContactDate = moment()
              .startOf("day")
              .add(1, "d")
              .format("YYYY-MM-DD");
            break;
        }
      } else {
        this.neverContact = false;
      }

      var updatedFamilyInfo = {
        id: this.familyId,
        NextContactNote: this.nextContactNote,
        NextContactDate: this.nextContactDate,
        LastContactDate: moment()
          .startOf("day")
          .format("YYYY-MM-DD"),
        NoMoreContact: this.neverContact,
        AssignedLab: this.Lab,
      };

      try {
        await family.update(updatedFamilyInfo);

        this.$emit("nextContactDone", updatedFamilyInfo);
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

            this.nextContactNote =
              "The family is about to participate in a study on " +
              moment(this.studyDate).format("YYYY-MM-DD") +
              ". Contact the family at least 7 days (" +
              moment(this.studyDate)
                .add(7, "days")
                .format("YYYY-MM-DD") +
              ") after their participation.";
            break;

          case "Interested":
          case "Left a message":
            this.nextContactDate = moment()
              .startOf("day")
              .add(2, "days")
              .format("YYYY-MM-DD");
            this.nextContactNote =
              "Left a message or sent an email on " +
              moment().format("YYYY-MM-DD") +
              ", follow up in 2 days.";
            break;

          case "Rescheduling":
            this.nextContactDate = moment()
              .startOf("day")
              .add(2, "days")
              .format("YYYY-MM-DD");
            this.nextContactNote =
              "Rescheduling the family, need to confirm the rescheduled date and time. - " +
              moment().format("YYYY-MM-DD");
            break;

          case "No Show":
            this.nextContactDate = moment()
              .startOf("day")
              .add(2, "days")
              .format("YYYY-MM-DD");
            this.nextContactNote =
              "The family didn't show up on " +
              moment().format("YYYY-MM-DD") +
              ". Need to contact again to reschedule.";
            break;

          case "Rejected":
            this.nextContactDate = moment()
              .startOf("day")
              .add(7, "days")
              .format("YYYY-MM-DD");
            this.nextContactNote =
              "Rejected participation on " +
              moment().format("YYYY-MM-DD") +
              ", to contact the family after 7 days.";

            this.Lab = null;
            break;

          case "Cancelled":
            this.nextContactDate = moment()
              .startOf("day")
              .add(7, "days")
              .format("YYYY-MM-DD");
            this.nextContactNote =
              "Cancelled a study on " +
              moment().format("YYYY-MM-DD") +
              ", to contact the family after 7 days.";

            this.Lab = null;
            break;
        }
      } else {
        this.nextContactDate = null;
        this.nextContactNote = null;
      }
    },
  },

  mounted() {
    if (this.nextContactDialog) {
      switch (this.contactType) {
        case "Confirmed":
          this.nextContactDate = moment(this.studyDate)
            .add(7, "days")
            .format("YYYY-MM-DD");

          this.nextContactNote =
            "The family is about to participate in a study on " +
            moment(this.studyDate).format("YYYY-MM-DD") +
            ". Contact the family at least 7 days (" +
            moment(this.studyDate)
              .add(7, "days")
              .format("YYYY-MM-DD") +
            ") after their participation.";
          break;

        case "Interested":
        case "Left a message":
          this.nextContactDate = moment()
            .startOf("day")
            .add(2, "days")
            .format("YYYY-MM-DD");
          this.nextContactNote =
            "Left a message or sent an email on " +
            moment().format("YYYY-MM-DD") +
            ", follow up in 2 days.";
          break;

        case "Rescheduling":
          this.nextContactDate = moment()
            .startOf("day")
            .add(2, "days")
            .format("YYYY-MM-DD");
          this.nextContactNote =
            "Rescheduling the family, need to confirm the rescheduled date and time. - " +
            moment().format("YYYY-MM-DD");
          break;

        case "No Show":
          this.nextContactDate = moment()
            .startOf("day")
            .add(2, "days")
            .format("YYYY-MM-DD");
          this.nextContactNote =
            "The family didn't show up on " +
            moment().format("YYYY-MM-DD") +
            ". Need to contact again to reschedule.";
          break;

        case "Rejected":
          this.nextContactDate = moment()
            .startOf("day")
            .add(7, "days")
            .format("YYYY-MM-DD");
          this.nextContactNote =
            "Rejected participation on " +
            moment().format("YYYY-MM-DD") +
            ", to contact the family after 7 days.";

          this.Lab = null;
          break;

        case "Cancelled":
          this.nextContactDate = moment()
            .startOf("day")
            .add(7, "days")
            .format("YYYY-MM-DD");
          this.nextContactNote =
            "Cancelled a study on " +
            moment().format("YYYY-MM-DD") +
            ", to contact the family after 7 days.";

          this.Lab = null;
          break;
      }
    } else {
      this.nextContactDate = null;
      this.nextContactNote = null;
    }
  },
};
</script>

<style lang="scss" scoped></style>
