export default {
  install(Vue) {
    Vue.prototype.$familyFields = [
      {
        label: "Email",
        field: "Email",
        rules: "email",
        width: "4",
        searchable: true,
      },
      {
        label: "Phone",
        field: "Phone",
        rules: "phone",
        width: "3",
        searchable: true,
      },
      {
        label: "Cell Phone",
        field: "CellPhone",
        rules: "phone",
        width: "3",
        searchable: true,
      },
      { label: "Family ID", field: "id", width: "2", searchable: true },
      {
        label: "Parimary Caregiver",
        field: "NamePrimary",
        rules: "name",
        width: "4",
        searchable: true,
      },
      {
        label: "Language (P)",
        field: "LanguagePrimary",
        width: "4",
        options: "language",
      },
      { label: "Race (P)", field: "RacePrimary", width: "3", options: "race" },
      {
        label: "Secondary Caregiver",
        field: "NameSecondary",
        width: "4",
        rules: "name",
        searchable: true,
      },
      {
        label: "Language (S)",
        field: "LanguageSecondary",
        width: "4",
        options: "language",
      },
      { label: "Race (S)", field: "RaceSecondary", width: "3", options: "race" },
      { label: "Vehicle", field: "Vehicle", width: "5" },
      { label: "English %", width: "2", field: "EnglishPercent" },
      { label: "Postal Code", field: "Address", width: "2" },
      { label: "Next Contact Date", width: "4", field: "NextContactDate" },
      { label: "Last Contact Date", width: "4", field: "LastContactDate" },
      {
        label: "Recruited via",
        field: "RecruitmentMethod",
        width: "3",
        options: "recruitmentMethod",
      },
    ];

    Vue.prototype.$familyBasicInfo = [
      {
        label: "Parimary Caregiver",
        field: "NamePrimary",
        rules: "name",
        width: "4",
        searchable: true,
      },
      {
        label: "Language (P)",
        field: "LanguagePrimary",
        width: "4",
        options: "language",
      },
      { label: "Race (P)", field: "RacePrimary", width: "3", options: "race" },
      {
        label: "Secondary Caregiver",
        field: "NameSecondary",
        width: "4",
        rules: "name",
        searchable: true,
      },
      {
        label: "Language (S)",
        field: "LanguageSecondary",
        width: "4",
        options: "language",
      },
      { label: "Race (S)", field: "RaceSecondary", width: "3", options: "race" },
      { label: "English %", width: "3", field: "EnglishPercent" },
      { label: "Postal Code", field: "Address", width: "3" },
    ];

    Vue.prototype.$familyContactInfo = [
      {
        label: "Email",
        field: "Email",
        rules: "email",
        width: "3",
        searchable: true,
      },
      {
        label: "Phone",
        field: "Phone",
        rules: "phone",
        width: "3",
        searchable: true,
      },
      {
        label: "Cell Phone",
        field: "CellPhone",
        rules: "phone",
        width: "3",
        searchable: true,
      },
      {
        label: "Recruited via",
        field: "RecruitmentMethod",
        width: "3",
        options: "recruitmentMethod",
      },
    ];

    Vue.prototype.$childInfo = [
      {
        label: "Name",
        field: "Name",
        rules: "name",
        width: "4",
      },
      {
        label: "Date of birth (YYYY-MM-DD)",
        field: "DoB",
        rules: "dob",
        width: "4",
      },
      {
        label: "Sex",
        field: "Sex",
        options: "sex",
        width: "2",
      },
      {
        label: "Gestational age (weeks)",
        field: "Gestation",
        width: "4",
      },
      {
        label: "Birth weight",
        field: "BirthWeight",
        rules: "birthWeight",
        width: "4",
      },
      {
        label: "Language",
        field: "Language",
        width: "4",
        options: "language",
      },
      {
        label: "School",
        field: "School",
        width: "4",
      },
      {
        label: "School Language",
        field: "SchoolLanguage",
        width: "4",
        options: "language",
      },
      {
        label: "Home Language",
        field: "HomeLanguage",
        width: "4",
        options: "language",
      },
      {
        label: "Note",
        field: "Note",
        width: "12",
      },
    ];

    Vue.prototype.$childSensitiveInfo = [
      { label: "Born prematurely?", field: "PrematureBirth", width: "3" },
      { label: "Vision deficit?", field: "VisionLoss", width: "3" },
      { label: "Hearing deficit?", field: "HearingLoss", width: "3" },
      { label: "Other illness?", field: "Illness", width: "3" },
    ];

    Vue.prototype.$labInfo = [
      {
        label: "Lab's Name",
        field: "LabName",
        rules: "required",
      },
    ];

    Vue.prototype.$labPI = [
      { label: "Name of PI/Manager", field: "Name", rules: "name" },
      { label: "Initials", field: "Initial", rules: "required" },
      { label: "Email of PI/Manager", field: "Email", rules: "email" },
      { label: "Phone", field: "Phone", rules: "phone" },
      {
        label: "Role",
        field: "Role",
        options: "role",
        rules: "required",
      },
      { label: "Calendar of PI/Manager", field: "Calendar", rules: "email" },
    ];

    Vue.prototype.$labEmailTemplate = [
      { label: "Email Opening", field: "EmailOpening", placeholder: "The opening sentence to parents" },
      { label: "Email Closing", field: "EmailClosing", placeholder: "The closing sentence to parents. It usually mentions how the parents can reach the lab." },
      { label: "Transportation Instructions", field: "TransportationInstructions", placeholder: "Instructions for how to come to the lab." },
      { label: "Lab Location", field: "Location", placeholder: "Lab location, showing in calendar events." },
    ];

    Vue.prototype.$studyCriteriaFields = [
      { label: "Min Age", field: "MinAge", width: "5" },
      { label: "Max Age", field: "MaxAge", width: "5" },
      { label: "Premature Participants", field: "PrematureParticipant", options: "inclusion", width: "3" },
      { label: "Ill Participants", field: "IllParticipant", options: "inclusion", width: "3" },
      { label: "Vision Loss Participants", field: "VisionLossParticipant", options: "inclusion", width: "3" },
      { label: "Hearing Loss Participants", field: "HearingLossParticipant", options: "inclusion", width: "3" },
    ];

    Vue.prototype.$studyPointofContact = [
      { label: "Name", field: "Name" },
      { label: "Email", field: "Email" },
      { label: "Phone", field: "Phone" },
    ];

    Vue.prototype.$studyBasicFields = [
      { label: "Study Name", field: "StudyName" },

      {
        label: "Study Type",
        field: "StudyType",
        options: "studyType",
      },
    ];

    Vue.prototype.$studyTimeSlots = [
      "08:30AM",
      "09:00AM",
      "09:30AM",
      "10:00AM",
      "10:30AM",
      "11:00AM",
      "11:30AM",
      "12:00PM",
      "12:30PM",
      "01:00PM",
      "01:30PM",
      "02:00PM",
      "02:30PM",
      "03:00PM",
      "03:30PM",
      "04:00PM",
      "04:30PM",
      "05:00PM",
      "05:30PM",
      "06:00PM",
    ];

    Vue.prototype.$headersSchedule = [
      {
        text: "Child",
        align: "center",
        value: "Child",
        width: "16%",
      },
      {
        text: "Study",
        align: "center",
        value: "Study",
        width: "18%",
      },
      {
        text: "Study Time",
        align: "center",
        value: "AppointmentTime",
        width: "18%",
      },
      {
        text: "Age",
        align: "center",
        value: "AgeByParticipation",
        width: "13%",
      },
      {
        text: "Status",
        align: "center",
        value: "Status",
        width: "8%",
      },
      {
        text: "Updated",
        align: "center",
        value: "updatedAt",
        width: "8%",
      },

      {
        text: "Actions",
        align: "center",
        value: "actions",
        sortable: false,
        width: "15%",
      },
      {
        text: "Reminder",
        align: "center",
        value: "Reminded",
        sortable: false,
        width: "5%",
      },
      {
        text: "Complete",
        align: "center",
        value: "Completed",
        sortable: false,
        width: "5%",
      },
    ];

    Vue.prototype.$headersAppointments = [
      { text: "Child", align: "center", value: "Child.Name", width: "8%" },
      {
        text: "Study",
        align: "center",
        value: "Study.StudyName",
        width: "15%",
      },
      {
        text: "Study Time",
        align: "center",
        value: "Schedule.AppointmentTime",
        width: "16%",
      },
      {
        text: "Age",
        align: "center",
        value: "AgeByParticipation",
        width: "10%",
      },
      {
        text: "Status",
        align: "center",
        value: "Schedule.Status",
        width: "10%",
      },
      {
        text: "Updated",
        align: "center",
        value: "Schedule.updatedAt",
        width: "12%",
      },

      {
        text: "Actions",
        align: "center",
        value: "actions",
        sortable: false,
        width: "15%",
      },
      {
        text: "Reminder",
        align: "center",
        value: "Schedule.Reminded",
        sortable: false,
        width: "8%",
      },
      {
        text: "Complete",
        align: "center",
        value: "Schedule.Completed",
        sortable: false,
        width: "10%",
      },
    ];

    Vue.prototype.$headersAppointmentsBrief = [
      { text: "Child", align: "center", value: "Child.Name", width: "10%" },
      {
        text: "Study",
        align: "center",
        value: "Study.StudyName",
        width: "20%",
      },
      {
        text: "Study Time",
        align: "center",
        value: "Schedule.AppointmentTime",
        sortable: true,
        width: "15%",
      },
      {
        text: "Age",
        align: "center",
        value: "AgeByParticipation",
        width: "15%",
      },
      {
        text: "Status",
        align: "center",
        value: "Schedule.Status",
        width: "15%",
      },
      {
        text: "Updated",
        align: "center",
        value: "Schedule.updatedAt",
        width: "10%",
      },
    ];

    Vue.prototype.$sex = ["F", "M"];

    Vue.prototype.$Options = {
      sex: ["F", "M"],
      language: ["English", "French", "Chinese", "Spanish", "Hindi"],
      race: ["Indian", "Asian", "African", "Hispanic", "Caucasian", "Arabic"],
      recruitmentMethod: [
        "Hospital",
        "Events",
        "SocialMedia",
        "PreviousParticipation",
      ],
    };

    Vue.prototype.$rules = {
      name: [
        // (value) => !!value || "Required.",
        (value) => {
          var pattern = /^[\w'\-,.][^0-9_!¡?÷?¿/\\+=@#$%ˆ&*{}|~<>;:[\]]{2,}$/;

          if (value) { return pattern.test(value) || "Invalid Name."; }
          else {
            return true
          }
        },
        (value) => {
          if (value) {
            return (value && value.length <= 50) || "Max 50 characters"
          } else {
            return true
          }
        }
      ],
      email: [
        // (value) => !!value || "Required.",
        (value) => {
          const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          if (value) { return pattern.test(value) || "Invalid e-mail."; }
          else {
            return true
          }
        },
        (value) => {
          if (value) {
            return (value && value.length <= 50) || "Max 50 characters"
          } else {
            return true
          }
        }
      ],
      phone: [
        (value) => {
          const pattern = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
          if (value) { return pattern.test(value) || "Invalid phone."; }
          else {
            return true
          }
        },
        // (value) => !!value || "Required.",
        (value) => {
          if (value) {
            return (value && value.length <= 10) || "Have to be 10 digits"
          } else {
            return true
          }
        }
      ],
      dob: [
        // (value) => !!value || "Required.",
        (value) => {
          const pattern = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/;
          if (value) {
            return pattern.test(value) || "Invalid Date of Birth.";
          }
          else {
            return true
          }
        },
      ],
      birthWeight: [
        (value) => {
          const pattern = /^[0-9]{1,4}[:.,-]?$/;

          if (value) {
            return pattern.test(value) || "Invalid Birth Weight.";
          } else {
            return true
          }

        },
      ],
      // noRule: [
      //   true
      // ]
      // required: [(value) => !!value || "Required."],
    };
  },
};
