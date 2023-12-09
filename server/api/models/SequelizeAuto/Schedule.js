/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Schedule', {
		id: {
			autoIncrement: true,
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true
		},
		AppointmentTime: {
			type: DataTypes.DATE,
			allowNull: true
		},
		Status: {
			type: DataTypes.ENUM('Confirmed','TBD','Rescheduling','Rescheduled','No Show','Cancelled','Rejected'),
			allowNull: false
		},
		Reminded: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		},
		ThankYouEmail: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		},
		Note: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		ScheduledBy: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: {
					tableName: 'Personnel',
				},
				key: 'id'
			}
		},
		FK_Family: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: {
					tableName: 'Family',
				},
				key: 'id'
			}
		},
		eventURL: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		calendarEventId: {
			type: DataTypes.STRING(255),
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
		},
		Completed: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		}
	}, {
		sequelize,
		tableName: 'Schedule'
	});
};
