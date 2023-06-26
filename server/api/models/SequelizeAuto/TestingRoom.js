
module.exports = function(sequelize, DataTypes) {
	return sequelize.define('TestingRoom', {
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
    online: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
    calendar: {
			type: DataTypes.STRING(255),
			allowNull: false,
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
	}, {
		sequelize,
		tableName: 'TestingRoom'
	});
};
