/* jshint indent: 1 */

module.exports = function (sequelize, DataTypes) {
	return sequelize.define('StudyAgeGroup', {
		id: {
			autoIncrement: true,
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true
		},
		FK_Study: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: {
					tableName: 'Study',
				},
				key: 'id'
			}
		},
		MinAge: {
			type: DataTypes.DECIMAL,
			allowNull: false
		},
		MaxAge: {
			type: DataTypes.DECIMAL,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: 'StudyAgeGroup',
		timestamps: false
	});
};
