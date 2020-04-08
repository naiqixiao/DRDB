/* jshint indent: 1 */
const bcrypt = require("bcrypt");

// function hashPassword(user, options) {
//   const SALT_FACTOR = 10;

//   if (!user.changed("Password")) {
//     return;
//   }

//   return bcrypt
//     .genSaltAsync(SALT_FACTOR)
//     .then(salt => bcrypt.hashAsync(user.Password, salt, null))
//     .then(hash => {
//       user.setDataValue("Password", hash);
//     });
// }

module.exports = function(sequelize, DataTypes) {
  const Personnel = sequelize.define(
    "Personnel",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
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
        type: DataTypes.ENUM("PostDoc", "PI", "GradStudent", "Undergrad", "RA", "Lab manager", "Staff"),
        allowNull: false
      },
      FK_Lab: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Lab",
          key: "id"
        }
      },
      Active: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: "1"
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
      hooks: {
        // beforeCreate: hashPassword,
        // beforeUpdate: hashPassword,
        // beforeSave: hashPassword
      }
    },
    {
      tableName: "Personnel"
    }
  );

  Personnel.prototype.comparePassword = function(password) {
    return bcrypt.compareAsync(password, this.Password);
  };

  // User.associate = function (models) {
  // }

  return Personnel;
};
