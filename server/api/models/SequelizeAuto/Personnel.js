// const Promise = require("bluebird");
// const bcrypt = Promise.promisifyAll(require("bcrypt"));

// function hashPassword(user, options) {
//   const SALT_FACTOR = 8;

//   if (!user.changed("password")) {
//     return;
//   }

//   return bcrypt
//     .genSaltAsync(SALT_FACTOR)
//     .then((salt) => bcrypt.hashAsync(user.password, salt, null))
//     .then((hash) => {
//       user.setDataValue("password", hash);
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
        primaryKey: true,
      },
      Name: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },
      Initial: {
        type: DataTypes.STRING(45),
        allowNull: false,
        unique: true,
      },
      Role: {
        type: DataTypes.ENUM(
          "PostDoc",
          "PI",
          "GradStudent",
          "Undergrad",
          "RA",
          "Lab manager",
          "Staff"
        ),
        allowNull: false,
      },
      FK_Lab: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Lab",
          key: "id",
        },
      },
      Active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: "1",
      },
      temporaryPassword: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: "1",
      },
      Password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      Email: {
        type: DataTypes.STRING(45),
        allowNull: false,
        unique: true,
      },
      Calendar: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      hooks: {
        // beforeCreate: hashPassword,
        // beforeUpdate: hashPassword,
        // beforeSave: hashPassword,
      },
    },
    {
      tableName: "Personnel",
    }
  );

  // Personnel.prototype.comparePassword = function(password) {
  //   return bcrypt.compareAsync(password, this.Password);
  // };

  // Personnel.associate = function(models) {};

  return Personnel;
};
