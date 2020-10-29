/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Lab', {
		id: {
			autoIncrement: true,
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true
		},
		LabName: {
			type: DataTypes.STRING(45),
			allowNull: false,
			unique: true
		},
		PI: {
			type: DataTypes.STRING(45),
			allowNull: false,
			unique: true
		},
		Email: {
			type: DataTypes.STRING(45),
			allowNull: true,
			unique: true
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
		},
		EmailOpening: {
			type: 'MEDIUMTEXT',
			allowNull: true
		},
		EmailClosing: {
			type: 'MEDIUMTEXT',
			allowNull: true
		},
		Location: {
			type: 'MEDIUMTEXT',
			allowNull: true
		},
		TransportationInstructions: {
			type: 'MEDIUMTEXT',
			allowNull: true
		}
	}, {
		sequelize,
		tableName: 'Lab'
	});
};
