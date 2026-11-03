const moment = require("moment");

// ─── Mock data fixtures ──────────────────────────────────────────────
// These simulate real Sequelize model shapes so the template builders
// can process them exactly as they would with real data.

const MOCK = {
  labName: "McMaster BabyLab",
  labEmail: "babylab@mcmaster.ca",
  labZoom: "https://zoom.us/j/1234567890",
  transportationInstructions:
    "<p>Our lab is located at Psychology Building, McMaster University. There are 3 parking lots in front of the building.</p>",
  emailClosing: "<p>Please feel free to let us know if you have questions.</p>",

  parentName: "Sarah Johnson",
  parentEmail: "sarah@example.org",
  parentPhone: "9055550100",
  childName: "Liam Johnson",
  childDob: "2024-06-15",

  experimenterName: "Alex Chen",
  experimenterEmail: "alex@example.org",
  experimenterZoom: "https://zoom.us/j/9876543210",

  e2Name: "Priya Patel",
  e2Email: "priya@example.org",

  studyName: "Infant Visual Attention Study",
  studyName2: "Language Development Study",
  reminderTemplate:
    "<p>${{childName}} will be sitting on your lap and watch a short clip of videos on a screen in front of them. The study will last for about 10 minutes.</p>",

  password: "xK9mQ3vB7nR2",
  role: "Lab manager",
  appUrl: "https://drdb.example.com",
};

/**
 * Build a mock schedule object that matches the Sequelize model shape
 * expected by buildFamilyReminderBody / buildManualReminderBody.
 */
function mockScheduleForFamily(opts = {}) {
  const studyType = opts.studyType || "In-person";
  const hasEmail = opts.hasEmail !== false;

  return {
    AppointmentTime: moment().add(1, "days").hour(10).minute(30).toDate(),
    Family: {
      NamePrimary: hasEmail ? MOCK.parentName : null,
      Email: hasEmail ? MOCK.parentEmail : null,
      TrainingSet: false,
    },
    Personnel: {
      Name: MOCK.experimenterName,
      Role: "Research Assistant",
    },
    Appointments: [
      {
        Child: { Name: MOCK.childName, DoB: MOCK.childDob, Sex: "M" },
        Study: {
          StudyName: MOCK.studyName,
          StudyType: studyType,
          ReminderTemplate: MOCK.reminderTemplate,
          Lab: {
            id: 1,
            LabName: MOCK.labName,
            Email: MOCK.labEmail,
            ZoomLink: MOCK.labZoom,
            TransportationInstructions: MOCK.transportationInstructions,
            EmailClosing: MOCK.emailClosing,
          },
        },
        PrimaryExperimenter: [
          {
            Name: MOCK.experimenterName,
            Email: MOCK.experimenterEmail,
            ZoomLink: MOCK.experimenterZoom,
          },
        ],
        SecondaryExperimenter: [
          { Name: MOCK.e2Name, Email: MOCK.e2Email },
        ],
      },
    ],
  };
}

/**
 * Build mock scheduleList for completion/rejection reminder templates.
 */
function mockScheduleList() {
  return [
    {
      id: 101,
      Email: MOCK.parentEmail,
      Name: MOCK.parentName,
      StudyName: MOCK.studyName,
      AppointmentTime: moment().subtract(1, "days").hour(10).minute(30).toDate(),
      Status: "TBD",
      LabName: MOCK.labName,
      LabEmail: MOCK.labEmail,
      LabID: 1,
      updatedAt: moment().subtract(7, "days").hour(15).minute(15).toDate(),
    },
    {
      id: 102,
      Email: "michael@example.org",
      Name: "Michael Wong",
      StudyName: MOCK.studyName2,
      AppointmentTime: moment().subtract(1, "days").hour(14).minute(0).toDate(),
      Status: "No Show",
      LabName: MOCK.labName,
      LabEmail: MOCK.labEmail,
      LabID: 1,
      updatedAt: moment().subtract(8, "days").hour(11).minute(0).toDate(),
    },
  ];
}

/**
 * Build a mock experimenter object for the experimenter reminder template.
 */
function mockExperimenter() {
  return {
    Name: MOCK.experimenterName,
    Email: MOCK.experimenterEmail,
    ZoomLink: MOCK.experimenterZoom,
    Lab: { id: 1, LabName: MOCK.labName, Email: MOCK.labEmail },
    PrimaryExperimenterof: [
      {
        Schedule: {
          AppointmentTime: moment().add(1, "days").hour(10).minute(30).toDate(),
        },
        Study: { StudyName: MOCK.studyName },
        Child: {
          Name: MOCK.childName,
          Family: {
            NamePrimary: MOCK.parentName,
            Phone: MOCK.parentPhone,
            Email: MOCK.parentEmail,
          },
        },
        SecondaryExperimenter: [
          { Name: MOCK.e2Name, Email: MOCK.e2Email },
        ],
      },
    ],
    SecondaryExperimenterof: [
      {
        Schedule: {
          AppointmentTime: moment().add(1, "days").hour(14).minute(0).toDate(),
        },
        Study: { StudyName: MOCK.studyName2 },
        Child: {
          Name: "Emma Wong",
          Family: {
            NamePrimary: "Michael Wong",
            Phone: "4165550199",
            Email: "michael@example.org",
          },
        },
        PrimaryExperimenter: [
          { Name: MOCK.e2Name, Email: MOCK.e2Email, ZoomLink: null },
        ],
        SecondaryExperimenter: [
          { Name: MOCK.experimenterName, Email: MOCK.experimenterEmail },
        ],
      },
    ],
  };
}


module.exports = { MOCK, mockScheduleForFamily, mockScheduleList, mockExperimenter };
