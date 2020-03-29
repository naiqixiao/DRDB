const Sequelize = require("sequelize");
const { Op } = require("sequelize");

const sequelize = new Sequelize("DRDB", "admin", "password", {
  host: "localhost",
  dialect: "mysql",
  define: {
    timestamps: false,
    freezeTableName: true
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch(err => {
    console.error("Unable to connect to the database:", err);
  });

const Family = sequelize.import(__dirname + "/SequelizeAuto/Family.js");
const Child = sequelize.import(__dirname + "/SequelizeAuto/Child.js");
const Conversations = sequelize.import(
  __dirname + "/SequelizeAuto/Conversations.js"
);

Family.hasMany(Child, {
  foreignKey: "FK_Family"
});
Child.belongsTo(Family, {
  foreignKey: "FK_Family"
});

Family.hasMany(Conversations, {
  foreignKey: "FK_Family"
});

Conversations.belongsTo(Family, {
  foreignKey: "FK_Family"
});

const Personnel = sequelize.import(__dirname + "/SequelizeAuto/Personnel.js");
const Study = sequelize.import(__dirname + "/SequelizeAuto/Study.js");
const Experimenter = sequelize.import(
  __dirname + "/SequelizeAuto/Experimenter.js"
);

Personnel.belongsToMany(Study, {
  through: "Experimenter",
  foreignKey: "FK_Experimenter"
});
Study.belongsToMany(Personnel, {
  through: "Experimenter",
  foreignKey: "FK_Study"
});

sequelize.sync({ force: false }).then(() => {
  // Family.findAll({
  //   include: [
  //     Conversations,
  //     Child
  //     //{ model: Child, as: "Children", where: { Age: { [Op.gt]: 50 } } }
  //   ],
  //   where: {
  //     id: {
  //       [Op.or]: [[1, 2, 15], { [Op.gt]: 10 }]
  //     }
  //   },
  //   offset: 10,
  //   limit: 2
  // }).then(family => {
  //   console.log("Families are:-", family);
  // });
});

Family.create(
  {
    NameMom: "Mom's name",
    Email: "email@gmail.com",
    Phone: "3927510316",
    FamilyCode: "9999",
    Conversations: {
      Conversation: "I don't care!",
      Time: new Date()
    },
    Children: [
      {
        Name: "K XA",
        Sex: "M",
        DoB: "2019-03-27", //new Date(Date.UTC(2017, 11, 12)),
        Age: 893
      },
      {
        Name: "J Simons",
        Sex: "F",
        DoB: "2014-11-7", //new Date(Date.UTC(2017, 11, 12)),
        Age: 3244
      }
    ]
  },
  {
    include: [Child, Conversations]
  }
).then(family => {
  console.log("Children are:-", JSON.stringify(family));
});

// Family.destroy({ where: { id: 108 } }).then(console.log("delete successful!"));

// Child.findAll({
//   include: [Family],
//   where: {
//     id: {
//       [Op.or]: [[1, 2, 15], { [Op.gt]: 10 }]
//     },
//     '$Family.Phone$': "6479297504"
//   },
//   limit: 1
// }).then(children => {
//   console.log("Children are:-", JSON.stringify(children));
// });

// sequelize.sync({ force: false }).then(() => {
//   // Family.findOne({ include: [Conversations] }).then((family) => {
//   //   console.log("Families are:-", JSON.stringify(family));
//   // });
// });

// sequelize.sync({ force: false }).then(() => {
//   Family.update(
//     {
//       Email: "K.Mandell@gmail.com"
//     },
//     {
//       where: { id: 18 }
//     }
//   ).then(() => {
//     console.log("Project with id = 18 updated successfully!");

//     Family.findOne({ where: { id: 18 } }).then(family => {
//       console.log("Families are:-", JSON.stringify(family));
//     });
//   }).catch(() => {

//     console.log("Update failed!")

//   });
// });
