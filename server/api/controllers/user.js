const model = require("../models/DRDB");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

exports.signup = (req, res) => {
  bcrypt.hash(req.body.Password, 10, (err, hashPassword) => {
    if (err) {
      return res.status(500).json({
        error: err
      });
    } else {
      var newUser = req.body;
      newUser.Password = hashPassword;

      model.personnel
        .create(newUser)
        .then(personnel => {
          res.status(200).send(personnel);
          console.log("User created! " + personnel.id);
        })
        .catch(err => {
          throw err;
        });
    }
  });
};

exports.login = asyncHandler(async (req, res) => {
  const { Email, Password } = req.body;
  const personnel = await model.personnel.findOne({
    where: {
      Email: Email
    },
    include: [
      {
        model: model.lab,
        include: [{ model: model.study }]
      }
    ]
  });

  if (!personnel) {
    return res.status(401).send({
      error: "The login information was incorrect"
    });
  }

  const isPasswordValid = await bcrypt.compare(Password, personnel.Password);

  if (!isPasswordValid) {
    return res.status(403).send({
      error: "The login information was incorrect"
    });
  }

  const token = jwt.sign(
    {
      email: personnel.Email,
      id: personnel.id
    },
    process.env.JWT_KEY,
    {
      expiresIn: "12h"
    }
  );

  res.send({
    message: "Auth succsessful.",
    user: personnel.Email,
    lab: personnel.FK_Lab,
    token: token,
    studies: personnel.Lab.Studies
  });
});
