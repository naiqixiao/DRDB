/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('PersonnelHistory', {
		id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
		FK_Personnel: { type: DataTypes.INTEGER, allowNull: false, references: { model: { tableName: 'Personnel' }, key: 'id' } },
		FK_Lab: { type: DataTypes.INTEGER, allowNull: false, references: { model: { tableName: 'Lab' }, key: 'id' } },
		EventType: { type: DataTypes.STRING(45), allowNull: false },
		EffectiveDate: { type: DataTypes.DATE, allowNull: false },
		Role: { type: DataTypes.STRING(45), allowNull: true },
		FK_Study: { type: DataTypes.INTEGER, allowNull: true, references: { model: { tableName: 'Study' }, key: 'id' } },
		StudyName: { type: DataTypes.STRING(100), allowNull: true },
		Category: { type: DataTypes.STRING(45), allowNull: true },
		Title: { type: DataTypes.STRING(255), allowNull: true },
		Detail: { type: DataTypes.TEXT, allowNull: true },
		Imported: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
		CreatedBy: { type: DataTypes.INTEGER, allowNull: true, references: { model: { tableName: 'Personnel' }, key: 'id' } },
		createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
		updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') }
	}, { sequelize, tableName: 'PersonnelHistory' });
};
