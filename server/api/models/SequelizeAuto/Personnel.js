/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Personnel', {
		id: {
			autoIncrement: true,
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true
		},
		Name: {
			type: DataTypes.STRING(45),
			allowNull: false
		},
		Initial: {
			type: DataTypes.STRING(45),
			allowNull: false,
			unique: true
		},
		Role: {
			type: DataTypes.ENUM('Admin','PostDoc','PI','GradStudent','Undergrad','RA','Lab manager','Staff'),
			allowNull: false
		},
		FK_Lab: {
			type: DataTypes.INTEGER,
			allowNull: true,
			references: {
				model: {
					tableName: 'Lab',
				},
				key: 'id'
			}
		},
		Active: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 1
		},
		Password: {
			type: DataTypes.STRING(255),
			allowNull: false
		},
		Email: {
			type: DataTypes.STRING(45),
			allowNull: false,
			unique: true
		},
		Calendar: {
			type: DataTypes.STRING(100),
			allowNull: false,
			unique: true
		},
		Phone: {
			type: DataTypes.STRING(10),
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
		temporaryPassword: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		},
		ZoomLink: {
			type: DataTypes.STRING(300),
			allowNull: true
		},
		Retired: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		}
	}, {
		sequelize,
		tableName: 'Personnel'
	});
};
