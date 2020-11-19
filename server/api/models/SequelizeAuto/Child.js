/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Child', {
		id: {
			autoIncrement: true,
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true
		},
		Name: {
			type: DataTypes.STRING(50),
			allowNull: true,
			defaultValue: "UNKNOWN"
		},
		Sex: {
			type: DataTypes.STRING(1),
			allowNull: true
		},
		DoB: {
			type: DataTypes.DATEONLY,
			allowNull: true
		},
		Age: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		Language: {
			type: DataTypes.STRING(45),
			allowNull: true
		},
		IdWithinFamily: {
			type: DataTypes.STRING(1),
			allowNull: true
		},
		HearingLoss: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: 0
		},
		VisionLoss: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: 0
		},
		PrematureBirth: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: 0
		},
		Illness: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: 0
		},
		Note: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		FK_Family: {
			type: DataTypes.INTEGER,
			allowNull: true,
			references: {
				model: {
					tableName: 'Family',
				},
				key: 'id'
			}
		},
		BirthWeight: {
			type: DataTypes.INTEGER,
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
		HomeLanguage: {
			type: DataTypes.STRING(100),
			allowNull: true
		},
		SchoolLanguage: {
			type: DataTypes.STRING(100),
			allowNull: true
		},
		School: {
			type: DataTypes.STRING(100),
			allowNull: true
		},
		Gestation: {
			type: DataTypes.INTEGER,
			allowNull: true
		}
	}, {
		sequelize,
		tableName: 'Child'
	});
};
