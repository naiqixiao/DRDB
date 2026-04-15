const bcrypt = require("bcryptjs");

/**
 * Seeds the database with default data if it is completely empty.
 * @param {Object} models - The exported models object from DRDB.js
 */
async function seedDatabase(models) {
  try {
    // 1. Check if the database has already been seeded
    // We check the Personnel table because an Admin is required to use the system
    const adminCount = await models.personnel.count();
    
    if (adminCount > 0) {
      // Database already has users, skip seeding silently
      return;
    }

    console.log("🌱 Empty database detected. Seeding initial default data...");

    // 2. Create a default Lab
    const defaultLab = await models.lab.create({
      LabName: "Default Lab",
      PI: "System Administrator",
      Email: "admin@example.com",
      Timezone: "America/Toronto",
      EmailOpening: "<p>Welcome to our lab.</p>",
      EmailClosing: "<p>Thank you,</p>",
      Location: "Main Campus",
      TransportationInstructions: "<p>Standard parking available.</p>"
    });

    // 3. Create the default Admin Personnel
    const defaultPassword = "admin";
    const hashPassword = bcrypt.hashSync(defaultPassword, 10);

    await models.personnel.create({
      Name: "System Admin",
      Initial: "SA",
      Role: "Admin",
      Email: "admin@example.com",
      Password: hashPassword,
      Calendar: "admin@example.com", // Placeholder calendar
      Active: 1,
      temporaryPassword: 1, // Flags that they need to change it
      FK_Lab: defaultLab.id
    });

    // 4. Set the System Setting flag for the Frontend Wizard
    await models.systemSetting.findOrCreate({
      where: { SettingKey: "isFirstRun" },
      defaults: { SettingValue: "true" }
    });

    console.log("✅ Database seeding completed successfully.");
    console.log("---------------------------------------------------");
    console.log("🚀 Default Login Credentials:");
    console.log("📧 Email:    admin@example.com");
    console.log("🔑 Password: admin");
    console.log("---------------------------------------------------");

  } catch (error) {
    console.error("❌ Error during database seeding:", error);
  }
}

module.exports = { seedDatabase };
