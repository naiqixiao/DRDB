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

    const systemTimezone = process.env.TIMEZONE || process.env.TZ || "America/Toronto";

    // 2. Create a default Lab
    const defaultLab = await models.lab.create({
      LabName: "Default Lab",
      PI: "System Administrator",
      Email: "admin@example.com",
      Timezone: systemTimezone,
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

    // 4. Set the System Settings
    const defaultSettings = [
      { SettingKey: "isFirstRun", SettingValue: "true" },
      { SettingKey: "GeneralTimezone", SettingValue: systemTimezone },
      { SettingKey: "BrandingAppTitle", SettingValue: "DRDB - Developmental Research Database" },
      { SettingKey: "BrandingLoginHeading", SettingValue: "DRDB" },
      { SettingKey: "BrandingLoginSubheading", SettingValue: "Developmental Research Database System" },
      { SettingKey: "BrandingLogoUrl", SettingValue: "/logo.png" },
      { SettingKey: "BrandingFaviconUrl", SettingValue: "/logo.png" }
    ];

    for (const setting of defaultSettings) {
      await models.systemSetting.findOrCreate({
        where: { SettingKey: setting.SettingKey },
        defaults: { SettingValue: setting.SettingValue }
      });
    }

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
