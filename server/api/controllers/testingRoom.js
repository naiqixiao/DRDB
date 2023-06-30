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