const model = require("../models/DRDB");
const asyncHandler = require("express-async-handler");

exports.create = asyncHandler(async (req, res) => {
  const testingRoomInfo = req.body;

  console.log(testingRoomInfo);

  try {
    const testingRoom = await model.testingRoom.create(testingRoomInfo);

    res.status(200).send(testingRoom);
  } catch (error) {
    throw error;
  }
});

exports.search = asyncHandler(async (req, res) => {
  const labId = req.query.labId;

  try {
    const testingRooms = await model.testingRoom.findAll({
      where: { FK_Lab: labId, voided: 0 },
    });
    res.status(200).send(testingRooms);
  } catch (error) {
    throw error;
  }
});

exports.update = asyncHandler(async (req, res) => {
  const testingRoomInfo = req.body;

  try {
    const testingRoom = await model.testingRoom.update(testingRoomInfo, {
      where: { id: testingRoomInfo.id },
    });

    res.status(200).send(testingRoom);
  } catch (error) {
    throw error;
  }
});

exports.delete = asyncHandler(async (req, res) => {
  var testingRoomInfo = JSON.parse(req.query.testingRoomInfo);

  try {
    testingRoomInfo.voided = 1;

    await model.testingRoom.update(testingRoomInfo, {
      where: { id: testingRoomInfo.id },
    });

    res
      .status(200)
      .send(`Testing Room: ${testingRoomInfo.name} has been deleted`);
  } catch (error) {
    throw error;
  }
});
