const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const log = require("../controllers/log");


exports.create = asyncHandler(async (req, res) => {
  const testingRoomInfo = req.body;

  try {
    await model.testingRoom.create(testingRoomInfo);

  } catch (error) {
    throw error;
  }
})

exports.search = asyncHandler(async (req, res) => {
  const labId = req.query.labId;

  try {
    const testingRooms = await model.testingRoom.findAll({
      where: {FK_Lab: labId},
    });
    res.status(200).send(testingRooms);

  } catch (error) {
    throw error;
  }
})