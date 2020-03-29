/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    "Sibling",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
        unique: true
      },
      FK_Child: {
        type: DataTypes.INTEGER,
        allowNull: false,
        // unique: "uniqueTag",
        references: {
          model: "Child",
          key: "id"
        }
      },
      Sibling: {
        type: DataTypes.INTEGER,
        allowNull: false,
        // unique: "uniqueTag",
        references: {
          model: "Child",
          key: "id"
        }
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
      }
    },
    {
      uniqueKeys: {
        actions_unique: {
          fields: ["FK_Child", "Sibling"]
        }
      }
    },
    {
      tableName: "Sibling"
    }
  );
};
