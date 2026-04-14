/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('SystemSetting', {
		id: {
			autoIncrement: true,
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true
		},
		SettingKey: {
			type: DataTypes.STRING(100),
			allowNull: false,
			unique: true
		},
		SettingValue: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		createdAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
		},
		updatedAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
		}
	}, {
		sequelize,
		tableName: 'SystemSetting'
	});
};
