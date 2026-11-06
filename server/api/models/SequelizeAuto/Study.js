/* jshint indent: 1 */

module.exports = function (sequelize, DataTypes) {
	return sequelize.define('Study', {
		id: {
			autoIncrement: true,
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true
		},
		// Stored as JSON text (the database column is JSON/LONGTEXT). Declared as TEXT with
		// an explicit getter/setter because Sequelize's MariaDB driver JSON.parse()s every
		// JSON-typed column it reads and throws "Unexpected end of JSON input" (failing the
		// whole study query) when a row holds an empty or invalid value. NULL, '' and
		// unparsable text all read as null, which means "legacy prerequisites/exclusions".
		// Included (nested) studies were never parsed by the driver; this also fixes that.
		ParticipationRules: {
			type: DataTypes.TEXT('long'),
			allowNull: true,
			get() {
				const raw = this.getDataValue('ParticipationRules');
				if (raw === null || raw === undefined || raw === '') return null;
				if (typeof raw !== 'string') return raw;
				try {
					return JSON.parse(raw);
				} catch (error) {
					console.warn('Study ' + this.getDataValue('id') + ' has invalid ParticipationRules; treating as unset.');
					return null;
				}
			},
			set(value) {
				this.setDataValue('ParticipationRules', value === null || value === undefined ? null : JSON.stringify(value));
			}
		},
		StudyName: {
			type: DataTypes.STRING(45),
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
		IntroductionEmailSubject: {
			type: DataTypes.STRING(255),
			allowNull: true
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
    FK_TestingRoom: {
			type: DataTypes.INTEGER,
			allowNull: true,
			references: {
				model: {
					tableName: 'TestingRoom',
				},
				key: 'id'
			}
		},
		StudyType: {
			type: DataTypes.STRING(30),
			allowNull: false
		},
		ASDParticipant: {
			type: DataTypes.ENUM('Include', 'Exclude', 'Only'),
			allowNull: false,
			defaultValue: "Include"
		},
		PrematureParticipant: {
			type: DataTypes.ENUM('Include', 'Exclude', 'Only'),
			allowNull: false,
			defaultValue: "Include"
		},
		VisionLossParticipant: {
			type: DataTypes.ENUM('Include', 'Exclude', 'Only'),
			allowNull: false,
			defaultValue: "Include"
		},
		HearingLossParticipant: {
			type: DataTypes.ENUM('Include', 'Exclude', 'Only'),
			allowNull: false,
			defaultValue: "Include"
		},
		IllParticipant: {
			type: DataTypes.ENUM('Include', 'Exclude', 'Only'),
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
		},
		FollowUPEmailSnippet: {
			type: DataTypes.TEXT,
			allowNull: true
		}
	}, {
		sequelize,
		tableName: 'Study'
	});
};
