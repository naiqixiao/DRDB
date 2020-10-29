/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Conversations', {
		id: {
			autoIncrement: true,
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true
		},
		Conversation: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		Time: {
			type: DataTypes.DATE,
			allowNull: false
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
		tableName: 'Conversations'
	});
};
