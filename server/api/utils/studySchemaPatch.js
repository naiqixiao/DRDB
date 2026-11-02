const { DataTypes } = require('sequelize');

// Await this before listening: all Study queries may select the new column.
async function patchStudyParticipationSchema(queryInterface) {
  const columns = await queryInterface.describeTable('Study');
  if (!columns.ParticipationRules) {
    await queryInterface.addColumn('Study', 'ParticipationRules', {
      type: DataTypes.JSON,
      allowNull: true,
    });
  }
}

module.exports = { patchStudyParticipationSchema };
