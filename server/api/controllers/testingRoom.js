const model = require("../models/DRDB");
const asyncHandler = require("express-async-handler");

exports.create = asyncHandler(async (req, res) => {
  const testingRoomInfo = req.body;

  try {
    await model.testingRoom.create(testingRoomInfo);

    res.status(200).send('a new testingRoom is created.');

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