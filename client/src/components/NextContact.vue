<template>
  <v-container fluid>
    
    <v-row>
      <v-col cols="12" md="9">
        <v-textarea
          label="Conversation with parents"
          outlined
          no-resize
          rows="4"
          solo
          v-model="conv"
        ></v-textarea>
         </v-col>
      <v-col cols="12" md="3"> </v-col>
    </v-row>

    <div>
      <v-dialog v-model="dialogNextContact" max-width="800px">
        <v-card>
          <v-card-title>When to contact this family again?</v-card-title>

          <v-row align="center" justify="start">
            <v-col cols="12" md="2">
              <v-text-field dense label="Days after" v-model="daysAfter">
              </v-text-field>
            </v-col>
            <v-col cols="12" md="2">
              <v-text-field
                ref="studyDate"
                label="Contact after"
                v-model="this.currentFamily.NextContactDate"
                append-icon="event"
                @click:append="datePicker = true"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-row align="center">
            <v-col cols="12" lg="9">
              <v-textarea
                label="Notes for next contact"
                outlined
                filled
                no-resize
                rows="2"
                solo
                v-model="this.currentFamily.NextContactNote"
              ></v-textarea>
            </v-col>
          </v-row>
          <v-card-actions>
            <v-btn color="green darken-1" text @click="closeNextContact"
              >Confirm</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="datePicker" max-width="360px">
        <v-card>
          <v-row align="center">
            <v-col cols="12" lg="12">
              <v-date-picker
                v-model="nextContactDate"
                show-current
                @click:date="datePick"
                :min="new Date()"
              ></v-date-picker>
            </v-col>
          </v-row>
        </v-card>
      </v-dialog>
    </div>
  </v-container>
</template>

<script>
import family from "@/services/family";

export default {
  components: {},
  props: {
    currentFamily: Object,
  },

  data() {
    return {
      daysAfter: Number,
      nextContactDate: Date,
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
        this.$refs.studyDate.focus();
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
  },
  computed: {},
};
</script>

<style lang="scss" scoped></style>
