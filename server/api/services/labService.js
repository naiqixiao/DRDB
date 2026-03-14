const model = require("../models/DRDB");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const fs = require("fs");
const { sendAdminEmail } = require("../utils/emailUtil");
const config = require("../../config/general");

/**
 * Create a new lab with associated personnel, a sample study,
 * a welcome email, and filesystem setup.
 *
 * @param {Object} labData - Lab creation payload (from the request body)
 * @returns {Object} The created lab record (with Personnels)
 */
exports.createLab = async (labData) => {
  // 1. Set default field values
  labData.EmailOpening = "<p>Email opening (currently not in use).<p>";
  labData.EmailClosing =
    "<p>Please feel free to let us know if you wish to change the time for your study. You can either send us an email.<p>";
  labData.TYEmail =
    "<p>Please, if you have a chance, consider spreading the word to other families you may know who might like to participate.<p>";
  labData.Location =
    "Psychology Building, McMaster University (used in calendar events)";
  labData.TransportationInstructions =
    "<p>Our lab is located at Psychology Building, McMaster University. There are 3 parking lots in front of the building that you can park when you come. We will wait for you at the parking lot.<p>";

  // 2. Generate secure passwords (crypto.randomBytes instead of Math.random)
  labData.Personnels.forEach((personnel) => {
    const rawPassword = crypto.randomBytes(8).toString("hex");
    personnel.unencryptedPassword = rawPassword; // Kept temporarily for the welcome email
    personnel.Password = bcrypt.hashSync(rawPassword, 10);
    personnel.temporaryPassword = true;
  });

  // 3. Create lab + personnel in the database
  const lab = await model.lab.create(labData, {
    include: [model.personnel],
  });

  // 4. Create a sample study
  await model.study.create({
    StudyName: "Sample study for " + lab.LabName,
    MinAge: "8.00",
    MaxAge: "24.00",
    PhoneScript: "hello there",
    Description:
      "Study description should be a short summary of a study. So RAs can read it to parents during recruitment.",
    EmailTemplate:
      "<p><strong style='background- color: rgb(254, 254, 254); '>${{childName}}&nbsp;</strong><span style='background - color: rgb(254, 254, 254); '>will be sitting on your lap and watch a short clip of videos on a screen in front of ${{him/her}}. To understand the development of neural system, ${{childName}} will be wearing a recording cap while watching the videos. We will use a camera to monitor ${{his/her}} attention status, which will help us determine the quality of recorded neural signals. The study will last for about 10 minutes.</span></p>",
    ReminderTemplate:
      "<p>Please enter a template for reminder email sent to parents for their upcoming study.</p>",
    FollowUPEmailSnippet: "<p>As we ment.</p>",
    Completed: false,
    StudyType: "Behavioural",
    ASDParticipant: "Include",
    PrematureParticipant: "Include",
    HearingLossParticipant: "Include",
    VisionLossParticipant: "Include",
    IllParticipant: "Include",
    FK_Personnel: lab.Personnels[0].id,
    FK_Lab: lab.id,
    FK_TestingRoom: 1,
  });

  // 5. Send welcome email to the first personnel (lab admin)
  const admin = labData.Personnels[0];
  await sendAdminEmail({
    to: `${admin.Name} <${admin.Email}>`,
    subject: "Your user account has been created!",
    htmlBody:
      "<p>Hello " +
      admin.Name.split(" ")[0] +
      ",</p> " +
      "<p>Welcome to the developmental research management system!</p>" +
      "<p>Your role is <b>" +
      admin.Role +
      "</b>, and your temporary password is <b><em>" +
      admin.unencryptedPassword +
      "</em></b>. Please login with your email and temporary password at <a href=" +
      config.URL +
      ">" +
      config.URL +
      "</a> to set your password" +
      config.otherRequirement +
      ".<br><b>If you're the lab manager, please update your lab email template in the Settings page.</p> " +
      "<p><a href='https://docs.google.com/document/d/1oaucm_FrpTxsO7UcOb-r-Y2Ck2zBe1G-BMvw_MD18N0/edit?usp=sharing'>A brief manual</a></p>" +
      "<p><a href='https://mcmasteru365-my.sharepoint.com/:p:/g/personal/xiaon8_mcmaster_ca/ERk1uev-LENDrca6aWXwSqYBAn1J1OEsJ3tNjPkbpvcwtA?e=Gz73ZK'>How to set up a Google account to activate email and calendar functions.</a></p>" +
      "<p>Thank you!<br>" +
      "Developmental Research Management System</p>",
  });

  // 6. Create lab filesystem directory
  const labFolderPath = "api/google/labs/lab" + lab.id;
  if (!fs.existsSync("api/google/labs")) {
    fs.mkdirSync("api/google/labs");
  }
  if (!fs.existsSync(labFolderPath)) {
    fs.mkdirSync(labFolderPath);
  }

  return lab;
};
