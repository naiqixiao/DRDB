/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Study', {
		id: {
			autoIncrement: true,
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true
		},
		StudyName: {
			type: DataTypes.STRING(45),
			allowNull: false
		},
		MinAge: {
			type: DataTypes.DECIMAL,
			allowNull: false
		},
		MaxAge: {
			type: DataTypes.DECIMAL,
			allowNull: false
		},
		Description: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		PhoneScript: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		EmailTemplate: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		Completed: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
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
		FK_Personnel: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: {
					tableName: 'Personnel',
				},
				key: 'id'
			}
		},
		StudyType: {
			type: DataTypes.STRING(30),
			allowNull: false
		},
		ASDParticipant: {
			type: DataTypes.ENUM('Include','Exclude','Only'),
			allowNull: false,
			defaultValue: "Include"
		},
		PrematureParticipant: {
			type: DataTypes.ENUM('Include','Exclude','Only'),
			allowNull: false,
			defaultValue: "Include"
		},
		VisionLossParticipant: {
			type: DataTypes.ENUM('Include','Exclude','Only'),
			allowNull: false,
			defaultValue: "Include"
		},
		HearingLossParticipant: {
			type: DataTypes.ENUM('Include','Exclude','Only'),
			allowNull: false,
			defaultValue: "Include"
		},
		IllParticipant: {
			type: DataTypes.ENUM('Include','Exclude','Only'),
			allowNull: false,
			defaultValue: "Include"
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
		ReminderTemplate: {
			type: DataTypes.TEXT,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: 'Study'
	});
};
