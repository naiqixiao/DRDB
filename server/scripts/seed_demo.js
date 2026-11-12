#!/usr/bin/env node
/**
 * Seed a fresh, empty DRDB database with fictional demo data for screenshots,
 * training and trying the system. Every person, family, child, email address and
 * phone number here is invented. Emails use example.org and phones use the
 * fictional 555-01xx range, so nothing can reach a real person.
 *
 * The data matches the story on the project page (site/index.html):
 *   - five studies across three labs, with the age windows of Fig. 2
 *     (Lab A eye tracking 6–12 mo, Lab B word learning 14–26 mo, Lab C parent
 *     report 28–40 mo, Lab B motor play 30–42 mo, Lab C school readiness 44–58 mo)
 *     plus three more that exercise bundling, sibling eligibility and exclusions;
 *   - the featured Rivera family: an infant just inside Lab A's window and a
 *     three-year-old sibling, linked as siblings, with a conversation log;
 *   - the Chen family, whose infant completed Lab A's study and is therefore
 *     excluded from Lab C's face-perception study;
 *   - about a year of past visits (so the analytics charts have shape), upcoming
 *     visits this week (Upcoming Appointments and the parking board), follow-ups
 *     due, phone-only families, a duplicate pair, a retired experimenter and a
 *     handful of training-mode families.
 *
 * Dates are relative to the day the script runs, so ages and "upcoming" visits
 * stay correct. Re-seed (into a new empty database) before taking screenshots.
 *
 * Usage (from server/):
 *   1. Create an empty database, e.g.  CREATE DATABASE DRDB_DEMO;
 *   2. DB_NAME=DRDB_DEMO node scripts/seed_demo.js
 *   3. DB_NAME=DRDB_DEMO npm start   and sign in as  demo.admin@example.org / drdb-demo
 *
 * Safety: the script refuses to run unless DB_NAME contains "demo" (override with
 * --allow-any-db) and the database is fresh: only the default lab and admin that
 * DRDB creates on first start, and no families. All writes happen in one
 * transaction, so a failure leaves the database as it was.
 */

const bcrypt = require("bcryptjs");

const DEMO_PASSWORD = "drdb-demo";
const ALLOW_ANY_DB = process.argv.includes("--allow-any-db");

// ---------------------------------------------------------------------------
// Deterministic randomness, so two runs on the same day give the same data.
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const SEED = 2020_03_29;
let rand = mulberry32(SEED);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const chance = (p) => rand() < p;
const between = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// Dates. Eligibility in DRDB compares age in days with months × 30.5.
// ---------------------------------------------------------------------------
const DAY = 24 * 3600 * 1000;
const today = new Date(); today.setHours(0, 0, 0, 0);
const daysFromToday = (n) => new Date(today.getTime() + n * DAY);
const dateOnly = (d) => {
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const ageDaysOn = (dob, on) => Math.floor((on.getTime() - dob.getTime()) / DAY);
const dobForAgeMonths = (months, extraDays = 0) => daysFromToday(-Math.round(months * 30.5) - extraDays);
const inWindow = (dob, on, study) => {
  const d = ageDaysOn(dob, on);
  return d >= study.min * 30.5 - 1 && d <= study.max * 30.5 - 1;
};
function atTime(day, hour, minute = 0) {
  const d = new Date(day); d.setHours(hour, minute, 0, 0); return d;
}
// Move weekend dates to the next Monday; labs book weekdays.
function weekday(day) {
  const d = new Date(day);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}

// ---------------------------------------------------------------------------
// Fictional names and contact details.
// ---------------------------------------------------------------------------
const ADULT_FIRST = [
  "Amira", "Ben", "Carmen", "Dev", "Elif", "Farah", "Gabriel", "Hannah", "Ines", "Jamal",
  "Keiko", "Liam", "Maya", "Nikhil", "Olga", "Pedro", "Quinn", "Rosa", "Sanjay", "Tara",
  "Uma", "Victor", "Wen", "Ximena", "Yusuf", "Zoe", "Aaron", "Bianca", "Chidi", "Dana",
  "Emeka", "Fiona", "Goran", "Hye-jin", "Isaac", "Jasmine", "Kofi", "Lucia", "Mateo", "Noor",
  "Omar", "Priya", "Rafael", "Sara", "Tomasz", "Valentina", "Will", "Yara", "Zain", "Leah",
];
const LAST = [
  "Abara", "Bergstrom", "Castillo", "Dimitriou", "Eze", "Fournier", "Ghosh", "Haddad", "Ishikawa", "Jovanovic",
  "Kaur", "Lindqvist", "Moreau", "Nakamura", "Osei", "Petrova", "Quintero", "Rahimi", "Silva", "Tanaka",
  "Ulloa", "Varga", "Whitfield", "Xu", "Yilmaz", "Zielinski", "Alvarez", "Brennan", "Chaudhry", "Delacroix",
  "Ekwueme", "Ferreira", "Gallagher", "Horvat", "Iyer", "Janssen", "Kowal", "Lemaire", "Mensah", "Novak",
  "Okonjo", "Park", "Rossi", "Sato", "Thorsen", "Usman", "Vasquez", "Weller", "Yamada", "Zhou",
];
const CHILD_F = ["Ava", "Mila", "Nora", "Isla", "Aria", "Lina", "Zara", "Ella", "Sana", "Ivy", "Chloe", "Amaya", "Freya", "Hana", "Leila", "Maeve", "Ruby", "Sienna", "Tessa", "Yuna"];
const CHILD_M = ["Noah", "Eli", "Arjun", "Kai", "Felix", "Omar", "Theo", "Luca", "Ezra", "Jonah", "Mason", "Rohan", "Sami", "Hugo", "Idris", "Jasper", "Kenji", "Milo", "Nico", "Owen"];
const STREETS = ["Maple Avenue", "Birch Street", "Cedar Lane", "Willow Road", "Elm Court", "Aspen Drive", "Juniper Way", "Linden Crescent", "Oak Terrace", "Rowan Place"];
const RACES = ["Asian", "African", "Hispanic", "Caucasian", "Arabic", "Indian"];
const LANGS = ["English", "English", "English", "English", "French", "Spanish", "Chinese", "Hindi"];
const RECRUIT = ["Hospital", "Events", "SocialMedia", "PreviousParticipation"];
const ascii = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z]/g, "").toLowerCase();

// Phones: 555-0100 to 555-0199 are reserved for fiction in every North American
// area code. Family.Phone must be unique, or DRDB's duplicate finder flags it.
// The column is varchar(11), so numbers are stored as digits; the app formats them.
let phoneSeq = 0;
function nextPhone() {
  // 0199 is kept for the featured family's cell phone.
  if (phoneSeq > 98) throw new Error("Ran out of fictional 555-01xx numbers; reduce the family count.");
  return `55555501${String(phoneSeq++).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Lab, people, rooms and studies.
// ---------------------------------------------------------------------------
const LABS = {
  A: { LabName: "Lab A · Infant Cognition", PI: "Dr. Elena Marsh", Email: "lab-a@example.org", room: ["Eye-tracking room", "Psychology Building, Room 101"], room2: ["EEG suite", "Psychology Building, Room 103"] },
  B: { LabName: "Lab B · Language Development", PI: "Dr. Hana Sato", Email: "lab-b@example.org", room: ["Play room", "Psychology Building, Room 210"] },
  C: { LabName: "Lab C · Social Development", PI: "Dr. Samuel Adeyemi", Email: "lab-c@example.org", room: ["Observation room", "Psychology Building, Room 305"] },
};

// key, lab, name, role. Lab A's admin is the account DRDB created on first start.
const PEOPLE = [
  ["priya", "A", "Priya Natarajan", "Lab manager"],
  ["jonah", "A", "Jonah Feld", "GradStudent"],
  ["amara", "A", "Amara Okafor", "RA"],
  ["tomas", "A", "Tomás Herrera", "RA"],      // retired three months ago
  ["hana", "B", "Hana Sato", "PI"],
  ["oliver", "B", "Oliver Grant", "RA"],
  ["lucy", "B", "Lucy Brandt", "Undergrad"],
  ["fatima", "C", "Fatima Rahman", "PostDoc"],
  ["ben", "C", "Ben Kowalski", "RA"],
];
const RETIRED_KEY = "tomas";
const RETIRED_DAYS_AGO = 90;

const STUDY_TEXT = {
  phone: (what) => `Hi, may I speak with the parent or guardian? My name is ___ and I'm calling from the ${what} Lab. You signed up to hear about our studies, and your child is now the right age for one. It takes about 30 minutes, and you would stay with your child the whole time. Would you like to hear more?`,
  email: (what) => `<p>We are inviting your family to take part in <strong>${what}</strong>. The visit takes about 30 minutes, and a parent stays with the child throughout.</p><p>Reply to this email or call us to choose a time that suits you.</p>`,
  reminder: `<p>This is a reminder of your visit tomorrow. Please arrive five minutes early; parking details are below.</p>`,
  thanks: `<p>Thank you for visiting us. Your child's certificate is attached.</p>`,
};

// key, lab, name, type, [min, max] months, rules (by study key), health, contact, room key, experimenters
const STUDIES = [
  ["A1", "A", "Eye tracking: hidden objects", "EyeTracking", [6, 12], [], { VisionLossParticipant: "Exclude" }, "jonah", "room", ["jonah", "amara", "tomas"]],
  ["A2", "A", "Infant EEG: faces and voices", "EEG/ERP", [5, 10], [], {}, "jonah", "room2", ["jonah", "priya"]],
  ["A3", "A", "Storybook attention (online)", "Online", [30, 48], [], {}, "amara", null, ["amara", "priya"]],
  ["B1", "B", "Word learning", "Behavioural", [14, 26], [], { HearingLossParticipant: "Exclude" }, "hana", "room", ["hana", "oliver", "lucy"]],
  ["B2", "B", "Motor play", "Behavioural", [30, 42], [], {}, "oliver", "room", ["oliver", "lucy"]],
  ["C1", "C", "Parent report: early social language", "Online", [28, 40], [], {}, "fatima", null, ["fatima", "ben"]],
  ["C2", "C", "Face perception", "EyeTracking", [10, 16], [{ operator: "NONE", studies: ["A1"] }], { VisionLossParticipant: "Exclude" }, "ben", "room", ["ben", "fatima"]],
  ["C3", "C", "School readiness", "Behavioural", [44, 58], [{ operator: "ANY", studies: ["C1"] }], { VisionLossParticipant: "Exclude" }, "fatima", "room", ["fatima", "ben"]],
];

// ---------------------------------------------------------------------------
async function main() {
  const dbName = process.env.DB_NAME || "DRDB";
  if (!/demo/i.test(dbName) && !ALLOW_ANY_DB) {
    console.error(`Refusing to seed "${dbName}". Point DB_NAME at a fresh demo database (its name must contain "demo"), or pass --allow-any-db.`);
    process.exit(1);
  }

  // Loading the models runs DRDB's normal startup in the background: migrations,
  // personnel-history upkeep and, on an empty database, the first-run seeder that
  // makes a default lab and admin. Writing while that runs causes lock and schema
  // errors, so wait until it reports that it has finished.
  const startupFinished = watchStartup();
  const model = require("../api/models/DRDB");
  await model.schemaReady;
  await startupFinished;

  const [labCount, personnelCount, familyCount] = await Promise.all([
    model.lab.count(), model.personnel.count(), model.family.count(),
  ]);
  if (labCount !== 1 || personnelCount !== 1 || familyCount !== 0) {
    console.error(`"${dbName}" is not a fresh database (labs: ${labCount}, personnel: ${personnelCount}, families: ${familyCount}). Create a new empty database and run this again.`);
    await model.sequelize.close();
    process.exit(1);
  }

  // On a brand-new database DRDB's startup migrations alter the Study table just
  // before creating the default admin, and MariaDB can then reject the next
  // transaction with "Table definition has changed" (errno 1412). The transaction
  // rolls back cleanly, so wait briefly and try again.
  let summary;
  for (let attempt = 1; ; attempt++) {
    try {
      summary = await model.sequelize.transaction((t) => seed(model, t));
      break;
    } catch (error) {
      const errno = (error.original || error.parent || {}).errno;
      if (![1412, 1213].includes(errno) || attempt >= 4) throw error;
      console.warn(`The database schema was still settling (attempt ${attempt}); retrying in 2 seconds.`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  await model.sequelize.close();
  printSummary(dbName, summary);
  process.exit(0); // the model module can leave timers running
}

function watchStartup() {
  return new Promise((resolve, reject) => {
    const log = console.log, error = console.error;
    const restore = () => { console.log = log; console.error = error; clearTimeout(timer); };
    const timer = setTimeout(() => { restore(); reject(new Error("DRDB's startup tasks did not finish within 60 seconds.")); }, 60000);
    console.log = (...args) => {
      log(...args);
      if (/Seeding complete|Skipping seeder/.test(args.join(" "))) { restore(); resolve(); }
    };
    console.error = (...args) => {
      error(...args);
      if (/Error during startup sync\/seeding/.test(args.map(String).join(" "))) { restore(); reject(new Error("DRDB's startup tasks failed; see the error above.")); }
    };
  });
}

async function seed(model, t) {
  // Reset generator state so a retried attempt produces the same data.
  rand = mulberry32(SEED);
  phoneSeq = 0;
  const T = { transaction: t };
  const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  const tz = process.env.TIMEZONE || "America/Toronto";

  // --- labs -----------------------------------------------------------------
  const labCommon = (L) => ({
    LabName: L.LabName, PI: L.PI, Email: L.Email, Timezone: tz,
    Location: "Psychology Building, 1280 University Avenue",
    TransportationInstructions: "<p>Free visitor parking is in Lot M, next to the Psychology Building. We will leave a parking pass for you at the front desk.</p>",
    EmailOpening: `<p>Hello from the ${L.LabName.split(" · ")[1]} team,</p>`,
    EmailClosing: `<p>With thanks,<br>${L.PI} and the ${L.LabName.split(" · ")[1]} team</p>`,
    TYEmail: STUDY_TEXT.thanks,
    ZoomLink: "https://zoom.us/j/0000000000",
  });
  const labA = await model.lab.findOne(T);
  await labA.update(labCommon(LABS.A), T);
  const lab = { A: labA };
  for (const k of ["B", "C"]) lab[k] = await model.lab.create(labCommon(LABS[k]), T);

  // --- people ---------------------------------------------------------------
  const admin = await model.personnel.findOne(T);
  await admin.update({
    Name: "Demo Admin", Initial: "DA", Role: "Admin", Email: "demo.admin@example.org",
    Calendar: "demo.admin@example.org", Password: hash, temporaryPassword: 0, FK_Lab: labA.id,
  }, T);
  await model.systemSetting.update({ SettingValue: "false" }, { where: { SettingKey: "isFirstRun" }, ...T });

  const person = { admin };
  const joined = daysFromToday(-700);
  for (const [key, labKey, name, role] of PEOPLE) {
    const [first, last] = name.split(" ");
    const email = `${ascii(first)}.${ascii(last)}@example.org`;
    const retired = key === RETIRED_KEY;
    person[key] = await model.personnel.create({
      Name: name, Initial: (first[0] + last[0]).toUpperCase(), Role: role, FK_Lab: lab[labKey].id,
      Active: retired ? 0 : 1, Retired: retired ? 1 : 0, Password: hash, temporaryPassword: 0,
      Email: email, Calendar: email, Phone: null, ZoomLink: "https://zoom.us/j/0000000000",
    }, T);
    await model.personnelHistory.create({
      FK_Personnel: person[key].id, FK_Lab: lab[labKey].id, EventType: "joined",
      EffectiveDate: daysFromToday(-between(200, 700)), Role: role, Imported: 0, CreatedBy: admin.id,
    }, T);
  }
  const labMembers = (labKey) => Object.values(person).filter((p) => p.FK_Lab === lab[labKey].id && !p.Retired);

  // --- rooms ----------------------------------------------------------------
  const rooms = {};
  for (const k of ["A", "B", "C"]) {
    for (const slot of ["room", "room2"]) {
      const spec = LABS[k][slot];
      if (!spec) continue;
      const handle = `${ascii(spec[0])}@example.org`;
      rooms[`${k}.${slot}`] = await model.testingRoom.create({
        name: spec[0], location: spec[1], FK_Lab: lab[k].id,
        calendar: handle, calendarId: handle, createdBy: admin.id,
      }, T);
    }
  }

  // --- studies --------------------------------------------------------------
  const study = {};
  for (const [key, labKey, name, type, [min, max], , health, contact, roomKey] of STUDIES) {
    study[key] = {
      key, labKey, name, type, min, max, inPerson: type !== "Online",
      row: await model.study.create({
        StudyName: name, StudyType: type, FK_Lab: lab[labKey].id, FK_Personnel: person[contact].id,
        FK_TestingRoom: roomKey ? rooms[`${labKey}.${roomKey}`].id : null,
        // Plain text: the study editor shows Description in a plain textarea.
        Description: `${name}: a ${type === "Online" ? "video-call" : "lab"} study for children aged ${min}–${max} months.`,
        PhoneScript: STUDY_TEXT.phone(LABS[labKey].LabName.split(" · ")[1]),
        IntroductionEmailSubject: `Invitation: ${name}`,
        EmailTemplate: STUDY_TEXT.email(name), ReminderTemplate: STUDY_TEXT.reminder,
        FollowUPEmailSnippet: STUDY_TEXT.thanks,
        ...health,
        createdAt: daysFromToday(-between(400, 800)),
      }, T),
    };
    await model.studyAgeGroup.create({ FK_Study: study[key].row.id, MinAge: min, MaxAge: max }, T);
  }
  // Participation rules refer to other studies, so set them once every study exists.
  for (const [key, , , , , rules] of STUDIES) {
    study[key].rules = rules;
    if (!rules.length) continue;
    await study[key].row.update({
      ParticipationRules: rules.map((g) => ({ operator: g.operator, studyIds: g.studies.map((s) => study[s].row.id) })),
    }, T);
  }
  for (const [key, , , , , , , , , experimenters] of STUDIES) {
    study[key].experimenters = experimenters.map((k) => person[k]);
    for (const p of study[key].experimenters) {
      await model.experimenter.create({ FK_Experimenter: p.id, FK_Study: study[key].row.id }, T);
    }
  }

  // --- families -------------------------------------------------------------
  const families = []; // { row, children: [{ row, dob, appts: [{ studyKey, date, completed }] }] }
  let nameIdx = 0;

  async function addFamily(spec) {
    const row = await model.family.create({
      NamePrimary: spec.primary, NameSecondary: spec.secondary || null,
      Email: spec.email === undefined ? `${ascii(spec.primary.split(" ")[0])}.${ascii(spec.primary.split(" ").slice(-1)[0])}@example.org` : spec.email,
      Phone: spec.phone || nextPhone(), CellPhone: spec.cell || null,
      RacePrimary: spec.race || pick(RACES), LanguagePrimary: spec.language || pick(LANGS),
      EnglishPercent: between(40, 100), Address: `${between(10, 990)} ${pick(STREETS)}`,
      Note: spec.note || null, NextContactDate: spec.nextContact || null, NextContactNote: spec.nextContactNote || null,
      RecruitmentMethod: spec.recruitment || pick(RECRUIT), OnlineStudyOnly: spec.onlineOnly ? 1 : 0,
      NoMoreContact: spec.noMoreContact ? 1 : 0, TrainingSet: spec.training ? 1 : 0,
      AutismHistory: 0, CreatedBy: admin.id, UpdatedBy: admin.id,
      createdAt: spec.createdAt || daysFromToday(-between(30, 900)),
    }, T);
    const fam = { row, children: [], training: !!spec.training, noMoreContact: !!spec.noMoreContact, featured: !!spec.featured };
    for (const [i, c] of spec.children.entries()) {
      const childRow = await model.child.create({
        Name: c.name, Sex: c.sex, DoB: dateOnly(c.dob), Age: ageDaysOn(c.dob, today),
        Language: "English", HomeLanguage: row.LanguagePrimary, IdWithinFamily: "abcdefgh"[i],
        VisionLoss: c.visionLoss ? 1 : 0, HearingLoss: 0, PrematureBirth: c.premature ? 1 : 0, ASD: 0, Illness: 0,
        FK_Family: row.id, RecruitmentMethod: row.RecruitmentMethod,
        Gestation: c.premature ? 34 : 39, BirthWeight: c.premature ? 2300 : between(2900, 4000),
      }, T);
      fam.children.push({ row: childRow, dob: c.dob, appts: [] });
    }
    // DRDB stores siblings in both directions.
    for (const a of fam.children) for (const b of fam.children) {
      if (a !== b) await model.sibling.create({ FK_Child: a.row.id, Sibling: b.row.id }, T);
    }
    families.push(fam);
    return fam;
  }

  function randomChildren() {
    const n = chance(0.7) ? 1 : chance(0.85) ? 2 : 3;
    const kids = [];
    // Infant studies need the most candidates, so weight the youngest child toward infancy.
    let ageMonths = chance(0.4) ? between(3, 16) : between(2, 62);
    for (let i = 0; i < n; i++) {
      const sex = chance(0.5) ? "F" : "M";
      kids.push({ name: pick(sex === "F" ? CHILD_F : CHILD_M), sex, dob: dobForAgeMonths(ageMonths, between(0, 25)), visionLoss: chance(0.02), premature: chance(0.06) });
      ageMonths += between(18, 40);
    }
    return kids;
  }
  function nextAdultName() {
    const first = ADULT_FIRST[nameIdx % ADULT_FIRST.length];
    const last = LAST[(nameIdx * 7) % LAST.length];
    nameIdx++;
    return `${first} ${last}`;
  }

  // Featured family from the page's story. The infant is just inside Lab A's
  // window (and Lab A's EEG window, so booking shows a second eligible study);
  // her brother is eligible for Lab A's online study and Lab B's motor play.
  const rivera = await addFamily({
    featured: true, primary: "Daniela Rivera", secondary: "Marcus Rivera", email: "daniela.rivera@example.org",
    cell: "5555550199", race: "Hispanic", language: "English", recruitment: "Events",
    note: "Met at the public library's baby fair. Prefers email; mornings work best. Needs a parking pass.",
    createdAt: dobForAgeMonths(2),
    children: [
      { name: "Sofia", sex: "F", dob: dobForAgeMonths(6, 8) },
      { name: "Leo", sex: "M", dob: dobForAgeMonths(38) },
    ],
  });
  // Infant who already did Lab A's eye-tracking study, so Lab C's face-perception
  // study (NONE: Lab A eye tracking) leaves her out of its eligible list.
  const chen = await addFamily({
    featured: true, primary: "Grace Chen", secondary: "Wei Chen", race: "Asian", recruitment: "Hospital",
    note: "Completed Lab A's eye-tracking study; happy to be contacted again.",
    children: [{ name: "Mia", sex: "F", dob: dobForAgeMonths(12, 4) }],
  });
  // A likely duplicate: the same parent registered twice with the same phone.
  const dupPhone = nextPhone();
  await addFamily({ primary: "Jordan Ellis", email: "jordan.ellis@example.org", phone: dupPhone, recruitment: "Events", children: [{ name: "Ruby", sex: "F", dob: dobForAgeMonths(20, 3) }] });
  await addFamily({ primary: "Jordan Ellis", email: "j.ellis@example.org", phone: dupPhone, recruitment: "SocialMedia", children: [{ name: "Ruby", sex: "F", dob: dobForAgeMonths(20, 2) }] });

  for (let i = 0; i < 80; i++) {
    const phoneOnly = i % 12 === 5;           // about five families with no email
    const secondary = chance(0.6) ? nextAdultName() : null;
    const primary = nextAdultName();
    await addFamily({
      primary, secondary,
      email: phoneOnly ? null : undefined,
      onlineOnly: i % 15 === 7,
      noMoreContact: i === 41 || i === 67,
      note: phoneOnly ? "No email on file; call between 4 and 7 pm." : chance(0.35) ? pick([
        "Prefers text messages to calls.", "Both parents work days; evenings or Saturdays.",
        "Older sibling took part in 2024.", "Lives about 40 minutes away; prefers online studies when possible.",
        "Asked to be contacted by email only.",
      ]) : null,
      children: randomChildren(),
    });
  }
  for (let i = 0; i < 6; i++) {
    await addFamily({
      training: true, primary: `Practice Family ${i + 1}`, email: `practice${i + 1}@example.org`,
      note: "Practice family for training mode. Not a real participant.", children: randomChildren(),
    });
  }

  // --- appointments ---------------------------------------------------------
  let scheduleCount = 0;
  async function book({ fam, child, studyKey, when, status, completed, scheduledBy, experimenters }) {
    const s = study[studyKey];
    // `when` is null for schedules still waiting on a time (TBD, Rescheduling).
    const retiredOk = (p) => !p.Retired || (when && when < daysFromToday(-RETIRED_DAYS_AGO));
    const crew = experimenters || shuffle(s.experimenters.filter(retiredOk)).slice(0, 2);
    const by = scheduledBy || crew[0] || person.admin;
    const schedule = await model.schedule.create({
      AppointmentTime: when, Status: status, Completed: completed ? 1 : 0,
      Reminded: when && when < today ? 1 : 0, ThankYouEmail: completed ? 1 : 0,
      ScheduledBy: by.id, FK_Family: fam.row.id,
      Note: s.inPerson ? null : "Online session; Zoom link sent with the confirmation.",
      createdAt: when ? new Date(when.getTime() - between(5, 20) * DAY) : daysFromToday(-between(7, 14)),
    }, T);
    const appt = await model.appointment.create({
      FK_Study: s.row.id, FK_Child: child.row.id, FK_Schedule: schedule.id, FK_Family: fam.row.id,
    }, T);
    if (crew[0]) await model.experimenterAssignment.create({ FK_Experimenter: crew[0].id, FK_Appointment: appt.id }, T);
    if (crew[1]) await model.experimenterAssignment_2nd.create({ FK_Experimenter: crew[1].id, FK_Appointment: appt.id }, T);
    child.appts.push({ studyKey, date: when, completed: status === "Confirmed" && completed });
    scheduleCount++;
    return schedule;
  }

  function rulesMet(child, s, on) {
    const done = new Set(child.appts.filter((a) => a.completed && a.date <= on).map((a) => a.studyKey));
    const touched = new Set(child.appts.map((a) => a.studyKey));
    return s.rules.every((g) =>
      g.operator === "NONE" ? !g.studies.some((k) => touched.has(k))
        : g.operator === "ALL" ? g.studies.every((k) => done.has(k))
          : g.studies.some((k) => done.has(k)));
  }
  const pool = () => families.filter((f) => !f.training && !f.noMoreContact && !f.featured);

  // The story's fixed history first.
  const leo = rivera.children[1];
  await book({ fam: rivera, child: leo, studyKey: "C1", when: atTime(weekday(daysFromToday(-150)), 10), status: "Confirmed", completed: true });
  const mia = chen.children[0];
  await book({ fam: chen, child: mia, studyKey: "A1", when: atTime(weekday(daysFromToday(-130)), 11), status: "Confirmed", completed: true });

  // About a year of past visits, oldest first so prerequisites can be met.
  const statuses = [["Confirmed", true, 0.8], ["No Show", false, 0.08], ["Cancelled", false, 0.07], ["Rejected", false, 0.05]];
  const drawStatus = () => { let r = rand(); for (const [s, c, p] of statuses) { if ((r -= p) < 0) return [s, c]; } return ["Confirmed", true]; };
  for (let week = 52; week >= 1; week--) {
    for (let n = between(2, 4); n > 0; n--) {
      const when = atTime(weekday(daysFromToday(-week * 7 + between(-2, 2))), pick([9, 10, 11, 13, 14, 15]), pick([0, 30]));
      if (when >= today) continue;
      const s = study[pick(Object.keys(study))];
      const candidates = [];
      for (const fam of pool()) for (const child of fam.children) {
        if (child.appts.some((a) => a.studyKey === s.key)) continue;
        if (fam.row.OnlineStudyOnly && s.inPerson) continue;
        if (inWindow(child.dob, when, s) && rulesMet(child, s, when)) candidates.push([fam, child]);
      }
      if (!candidates.length) continue;
      const [fam, child] = pick(candidates);
      const [status, completed] = drawStatus();
      await book({ fam, child, studyKey: s.key, when, status, completed });
    }
  }

  // Visits this week: Upcoming Appointments, the calendar and the parking board.
  // A confirmed future visit locks the family to that lab.
  let upcoming = 0;
  for (const [i, key] of ["A1", "B1", "B2", "C2", "A2", "C3", "B1"].entries()) {
    const s = study[key];
    const when = atTime(weekday(daysFromToday(1 + i)), pick([9, 10, 11, 14]), 0);
    const candidates = [];
    for (const fam of pool()) {
      if (fam.row.AssignedLab || (fam.row.OnlineStudyOnly && s.inPerson)) continue;
      for (const child of fam.children) {
        if (!child.appts.some((a) => a.studyKey === s.key) && inWindow(child.dob, when, s) && rulesMet(child, s, when)) candidates.push([fam, child]);
      }
    }
    if (!candidates.length) continue;
    const [fam, child] = pick(candidates);
    await book({ fam, child, studyKey: key, when, status: "Confirmed", completed: false });
    await fam.row.update({ AssignedLab: lab[s.labKey].id, LastContactDate: dateOnly(daysFromToday(-between(3, 10))) }, T);
    upcoming++;
  }

  // Follow-ups due: families who were contacted but have not settled on a time.
  let followUps = 0;
  for (const [status, key] of [["TBD", "B1"], ["TBD", "A1"], ["Rescheduling", "C2"], ["No Show", "B2"], ["TBD", "C3"], ["Rescheduling", "A2"]]) {
    const s = study[key];
    const candidates = [];
    for (const fam of pool()) {
      if (fam.row.AssignedLab || fam.row.NextContactDate) continue;
      for (const child of fam.children) {
        if (!child.appts.some((a) => a.studyKey === s.key) && inWindow(child.dob, today, s) && rulesMet(child, s, today)) candidates.push([fam, child]);
      }
    }
    if (!candidates.length) continue;
    const [fam, child] = pick(candidates);
    const when = status === "No Show" ? atTime(weekday(daysFromToday(-between(3, 8))), 10) : null;
    await book({ fam, child, studyKey: key, when, status, completed: false });
    await fam.row.update({
      NextContactDate: dateOnly(daysFromToday(-between(1, 3))), LastContactDate: dateOnly(daysFromToday(-between(7, 14))),
      NextContactNote: status === "No Show" ? "Missed the visit; call to rebook." : "Left a voicemail; parent asked us to call back this week.",
    }, T);
    followUps++;
  }

  // Recently contacted families wait for their next-contact date and so drop out
  // of the eligible lists for now.
  for (const fam of shuffle(pool()).filter((f) => !f.row.AssignedLab && !f.row.NextContactDate).slice(0, 8)) {
    await fam.row.update({
      NextContactDate: dateOnly(daysFromToday(between(3, 12))), LastContactDate: dateOnly(daysFromToday(-between(1, 6))),
      NextContactNote: pick(["Parent will check the family calendar and call back.", "Interested; asked us to call after the holidays.", "Emailed study information; follow up next week."]),
    }, T);
  }

  // --- conversation logs ----------------------------------------------------
  const riveraLog = [
    [-55, "Registered at the library baby fair. Both children entered; parent prefers email."],
    [-20, "Sent a newsletter. Parent replied that Leo enjoyed his last visit with Lab C."],
    [-2, "Called about Lab A's eye-tracking study for Sofia. Parent interested; asked for a weekday morning. Will confirm by email."],
  ];
  for (const [d, text] of riveraLog) {
    await model.conversations.create({ FK_Family: rivera.row.id, Conversation: text, Time: atTime(daysFromToday(d), 10, 15) }, T);
  }
  for (const fam of families.filter((f) => !f.featured && f.children.some((c) => c.appts.length))) {
    if (!chance(0.6)) continue;
    const last = fam.children.flatMap((c) => c.appts).filter((a) => a.date).sort((a, b) => b.date - a.date)[0];
    if (!last) continue;
    await model.conversations.create({
      FK_Family: fam.row.id, Time: new Date(last.date.getTime() - between(4, 12) * DAY),
      Conversation: pick([
        `Called and booked ${study[last.studyKey].name}. Confirmation email sent.`,
        `Parent replied by email; booked ${study[last.studyKey].name}.`,
        `Left a voicemail about ${study[last.studyKey].name}; parent called back and booked.`,
      ]),
    }, T);
  }

  // Keep stored ages consistent with the nightly update-child-ages job.
  await model.sequelize.query("UPDATE Child SET Age = DATEDIFF(CURDATE(), DoB)", T);

  return {
    labs: 3, people: PEOPLE.length + 1, studies: STUDIES.length,
    families: families.length, training: families.filter((f) => f.training).length,
    children: families.reduce((n, f) => n + f.children.length, 0),
    schedules: scheduleCount, upcoming, followUps,
  };
}

function printSummary(dbName, s) {
  console.log(`
Seeded "${dbName}" with fictional demo data:
  ${s.labs} labs, ${s.people} people (1 retired), ${s.studies} studies
  ${s.families} families (${s.training} in training mode), ${s.children} children
  ${s.schedules} schedules: ${s.upcoming} upcoming this week, ${s.followUps} follow-ups due

Sign in (every account uses the password "${DEMO_PASSWORD}"):
  demo.admin@example.org      Admin, Lab A
  priya.natarajan@example.org Lab manager, Lab A  (use with the admin for the two-browser warning shot)
  hana.sato@example.org       PI, Lab B
  fatima.rahman@example.org   PostDoc, Lab C

Where things are for screenshots:
  Eligible list      Schedule > "Eye tracking: hidden objects" (Lab A): Sofia Rivera is in the list.
  Booking            Book Sofia: "Infant EEG: faces and voices" is also eligible; brother Leo is eligible
                     for "Storybook attention (online)".
  Exclusion          Lab C "Face perception": Mia Chen is left out (she did Lab A's eye-tracking study).
  Prerequisite       Lab C "School readiness" requires "Parent report: early social language".
  Family record      Family > Daniela Rivera: two siblings, notes and a three-entry conversation log.
  Follow-ups         Family or Appointment > Follow-ups.
  Duplicates         Family > Find Duplicates: the two "Jordan Ellis" records share a phone number.
  Retired person     Personnel > turn off "Show Active Only": Tomás Herrera.
  Training mode      Header switch: six "Practice Family" records.
`);
}

main().catch((error) => {
  console.error("Seeding failed; no changes were saved.\n", error);
  process.exit(1);
});
