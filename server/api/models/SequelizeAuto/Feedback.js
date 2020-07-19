/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Feedback', {
		id: {
			autoIncrement: true,
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true
		},
		Content: {
			type: 'LONGTEXT',
			allowNull: false
		},
		CreatedBy: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: {
					tableName: 'Personnel',
				},
				key: 'id'
			}
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
		CurrentPage: {
			type: DataTypes.STRING(45),
			allowNull: false
		},
		Title: {
			type: DataTypes.STRING(45),
			allowNull: false
		},
		Email: {
			type: DataTypes.STRING(45),
			allowNull: false
		}
	}, {
		sequelize,
		tableName: 'Feedback'
	});
};
