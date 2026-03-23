const Sequelize = require('sequelize');
const { faker } = require('@faker-js/faker');

const sequelize = new Sequelize("DRDB_FAKE", "root", "", {
  host: "localhost",
  dialect: "mysql",
  logging: false,
});

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Family
    const [families] = await sequelize.query('SELECT id, NamePrimary FROM Family');
    for (const f of families) {
      await sequelize.query(`
        UPDATE Family SET
          NamePrimary = ?,
          NameSecondary = ?,
          Email = ?,
          Phone = ?,
          CellPhone = ?,
          Address = ?
        WHERE id = ?
      `, {
        replacements: [
          faker.person.firstName() + ' ' + faker.person.lastName(),
          faker.helpers.maybe(() => faker.person.firstName() + ' ' + faker.person.lastName()) || null,
          faker.internet.email(),
          faker.string.numeric(10),
          faker.string.numeric(10),
          faker.location.streetAddress(),
          f.id
        ]
      });
    }
    console.log('Family done');

    // Child
    const [children] = await sequelize.query('SELECT id FROM Child');
    for (const c of children) {
      await sequelize.query(`
        UPDATE Child SET
          Name = ?,
          School = ?
        WHERE id = ?
      `, {
        replacements: [
          faker.person.firstName(),
          faker.company.name() + ' School',
          c.id
        ]
      });
    }
    console.log('Child done');

    // Personnel
    const [personnel] = await sequelize.query('SELECT id FROM Personnel');
    for (const p of personnel) {
      await sequelize.query(`
        UPDATE Personnel SET
          Name = ?,
          Initial = ?,
          Email = ?,
          Phone = ?,
          Calendar = ?,
          ZoomLink = ?
        WHERE id = ?
      `, {
        replacements: [
          faker.person.fullName(),
          faker.person.lastName().substring(0,2).toUpperCase(),
          faker.internet.email(),
          faker.string.numeric(10),
          faker.internet.email(),
          faker.internet.url(),
          p.id
        ]
      });
    }
    console.log('Personnel done');

    // Study
    const [studies] = await sequelize.query('SELECT id FROM Study');
    for (const s of studies) {
      await sequelize.query(`
        UPDATE Study SET
          StudyName = ?,
          Description = ?,
          PhoneScript = ?,
          EmailTemplate = ?,
          ReminderTemplate = ?,
          FollowUPEmailSnippet = ?
        WHERE id = ?
      `, {
        replacements: [
          faker.science.chemicalElement().name + ' Study',
          faker.lorem.paragraph(),
          faker.lorem.paragraph(),
          faker.lorem.paragraph(),
          faker.lorem.paragraph(),
          faker.lorem.paragraph(),
          s.id
        ]
      });
    }
    console.log('Study done');

    // Lab
    const [labs] = await sequelize.query('SELECT id FROM Lab');
    for (const l of labs) {
      await sequelize.query(`
        UPDATE Lab SET
          LabName = ?,
          PI = ?,
          Email = ?,
          EmailOpening = ?,
          EmailClosing = ?,
          Location = ?,
          TransportationInstructions = ?,
          ZoomLink = ?,
          TYEmail = ?
        WHERE id = ?
      `, {
        replacements: [
          faker.company.name() + ' Lab',
          faker.person.fullName(),
          faker.internet.email(),
          faker.lorem.sentence(),
          faker.lorem.sentence(),
          faker.location.streetAddress(),
          faker.lorem.sentence(),
          faker.internet.url(),
          faker.lorem.paragraph(),
          l.id
        ]
      });
    }
    console.log('Lab done');

    console.log('Obfuscation complete');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
}

run();
