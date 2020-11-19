/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Family', {
		id: {
			autoIncrement: true,
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true
		},
		NamePrimary: {
			type: DataTypes.STRING(50),
			allowNull: true
		},
		NameSecondary: {
			type: DataTypes.STRING(50),
			allowNull: true
		},
		Email: {
			type: DataTypes.STRING(40),
			allowNull: true
		},
		Phone: {
			type: DataTypes.STRING(11),
			allowNull: true
		},
		CellPhone: {
			type: DataTypes.STRING(11),
			allowNull: true
		},
		RacePrimary: {
			type: DataTypes.STRING(20),
			allowNull: true
		},
		RaceSecondary: {
			type: DataTypes.STRING(20),
			allowNull: true
		},
		LanguagePrimary: {
			type: DataTypes.STRING(20),
			allowNull: true
		},
		LanguageSecondary: {
			type: DataTypes.STRING(20),
			allowNull: true
		},
		EnglishPercent: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		Note: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		Vehicle: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		Address: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		LastContactDate: {
			type: DataTypes.DATEONLY,
			allowNull: true
		},
		NextContactDate: {
			type: DataTypes.DATEONLY,
			allowNull: true
		},
		NextContactNote: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		RecruitmentMethod: {
			type: DataTypes.STRING(100),
			allowNull: true,
			defaultValue: "Hospital"
		},
		AssignedLab: {
			type: DataTypes.INTEGER,
			allowNull: true,
			references: {
				model: {
					tableName: 'Lab',
				},
				key: 'id'
			}
		},
		CreatedBy: {
			type: DataTypes.INTEGER,
			allowNull: true,
			references: {
				model: {
					tableName: 'Personnel',
				},
				key: 'id'
			}
		},
		UpdatedBy: {
			type: DataTypes.INTEGER,
			allowNull: true,
			references: {
				model: {
					tableName: 'Personnel',
				},
				key: 'id'
			}
		},
		NoMoreContact: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: 0
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
		tableName: 'Family'
	});
};
