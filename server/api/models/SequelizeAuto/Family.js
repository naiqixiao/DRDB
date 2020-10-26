/* jshint indent: 1 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "Family",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
      },
      NamePrimary: {
        type: DataTypes.STRING(30),
        allowNull: true
      },
      NameSecondary: {
        type: DataTypes.STRING(30),
        allowNull: true
      },
      Email: {
        type: DataTypes.STRING(40),
        allowNull: false,
        unique: true
      },
      Phone: {
        type: DataTypes.STRING(10),
        allowNull: true,
        unique: true
      },
      CellPhone: {
        type: DataTypes.STRING(10),
        allowNull: true,
        unique: true
      },
      RacePrimary: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      RaceSecondary: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      LanguagePrimary: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      LanguageSecondary: {
        type: DataTypes.STRING(10),
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
        type: DataTypes.STRING(30),
        allowNull: true
      },
      CreatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Personnel",
          key: "id"
        }
      },
      AssignedLab: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Lab",
          key: "id"
        }
      },
      UpdatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Personnel",
          key: "id"
        }
      },
      NoMoreContact: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: "0"
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
      modelName: "Family",
      tableName: "Family",
      sequelize
    }
  );
};
