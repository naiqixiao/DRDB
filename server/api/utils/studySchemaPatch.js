const { DataTypes } = require('sequelize');

const COLUMNS = [
  { name: 'IntroductionEmailSubject', options: { type: DataTypes.STRING(255), allowNull: true }, sql: 'MySQL/migrate_study_introduction_subject.sql' },
  { name: 'ParticipationRules', options: { type: DataTypes.JSON, allowNull: true }, sql: 'MySQL/migrate_participation_rules.sql' },
];

async function addStudyColumn(queryInterface, { name, options, sql }) {
  try {
    await queryInterface.addColumn('Study', name, options);
  } catch (error) {
    // Another server process may have added it after our describeTable call.
    if (error.original?.errno === 1060 || error.parent?.errno === 1060) {
      const current = await queryInterface.describeTable('Study');
      if (Object.prototype.hasOwnProperty.call(current, name)) return;
    }
    throw new Error(`Could not add Study.${name}. Apply ${sql} to the application database, then restart the backend. ${error.message}`);
  }
}

// Await this before listening: all Study queries may select the new columns.
// sync({ force: false }) creates tables but never adds columns to existing ones.
async function patchStudyParticipationSchema(queryInterface) {
  const columns = await queryInterface.describeTable('Study');
  for (const column of COLUMNS) {
    if (!Object.prototype.hasOwnProperty.call(columns, column.name)) await addStudyColumn(queryInterface, column);
  }
}

module.exports = { patchStudyParticipationSchema };
