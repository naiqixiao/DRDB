/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('ScheduledJobSetting', {
		id: {
			autoIncrement: true,
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true
		},
		FK_Lab: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: {
					tableName: 'Lab',
				},
				key: 'id'
			}
		},
		JobId: {
			type: DataTypes.STRING(100),
			allowNull: false
		},
		CronExpression: {
			type: DataTypes.STRING(100),
			allowNull: false
		},
		Enabled: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true
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
		tableName: 'ScheduledJobSetting',
		indexes: [
			{
				name: 'uq_scheduled_job_setting_lab_job',
				unique: true,
				fields: ['FK_Lab', 'JobId']
			}
		]
	});
};