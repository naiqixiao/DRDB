const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const fs = require("fs");

const log = require("../controllers/log");
const { recordPersonnelHistory } = require("../services/personnelHistoryService");

exports.updateExperimenters = asyncHandler(async (req, res) => {
  const experimenters = req.body.experimenters;

  try {
    await model.experimenter.destroy({
      where: { FK_Study: experimenters[0].FK_Study }
    });

    const assignedStudies = await model.experimenter.bulkCreate(experimenters);

    // Log
    const User = req.body.User || { Name: "System", Email: "", LabName: "System" };

    await log.createLog("Experimenter Assignment Updated", User, "updated experimenter assignment for a study (" +
      experimenters[0].FK_Study + ")");

    res.status(200).send(assignedStudies);
  } catch (error) {
    res.status(500).send(error);
  }
});

exports.updateStudies = asyncHandler(async (req, res) => {
  const studies = req.body.studies || [];
  const personnelId = Number(req.body.personnelId || studies[0]?.FK_Experimenter);
  if (!Number.isInteger(personnelId) || personnelId <= 0) {
    return res.status(400).json({ error: "Personnel ID is required." });
  }
  try {
    const assignedStudies = await model.sequelize.transaction(async (transaction) => {
      const member = await model.personnel.findByPk(personnelId, { transaction });
      if (!member) throw new Error("Personnel record not found.");
      const priorAssignments = await model.experimenter.findAll({ where: { FK_Experimenter: personnelId }, transaction });
      const priorIds = new Set(priorAssignments.map((assignment) => assignment.FK_Study));
      const requestedIds = [...new Set(studies.map((study) => Number(study.FK_Study)).filter(Number.isInteger))];
      const requestedStudies = requestedIds.length
        ? await model.study.findAll({ where: { id: requestedIds, FK_Lab: member.FK_Lab }, transaction }) : [];
      if (requestedStudies.length !== requestedIds.length) throw new Error("All assigned studies must belong to the member's lab.");

      const requestedById = new Map(requestedStudies.map((study) => [study.id, study]));
      await model.experimenter.destroy({ where: { FK_Experimenter: personnelId }, transaction });
      if (requestedIds.length) {
        await model.experimenter.bulkCreate(requestedIds.map((FK_Study) => ({ FK_Experimenter: personnelId, FK_Study })), { transaction });
      }

      const priorStudies = priorIds.size ? await model.study.findAll({ where: { id: [...priorIds] }, transaction }) : [];
      const priorById = new Map(priorStudies.map((study) => [study.id, study]));
      for (const studyId of priorIds) {
        if (!requestedById.has(studyId)) {
          const study = priorById.get(studyId);
          await recordPersonnelHistory(model, { FK_Personnel: personnelId, FK_Lab: member.FK_Lab, EventType: "project_ended", FK_Study: studyId, StudyName: study?.StudyName || null, CreatedBy: req.userData?.id || null }, { transaction });
        }
      }
      for (const [studyId, study] of requestedById) {
        if (!priorIds.has(studyId)) {
          await recordPersonnelHistory(model, { FK_Personnel: personnelId, FK_Lab: member.FK_Lab, EventType: "project_started", FK_Study: studyId, StudyName: study.StudyName, CreatedBy: req.userData?.id || null }, { transaction });
        }
      }
      return requestedStudies;
    });

    // Log
    const User = req.body.User || { Name: "System", Email: "", LabName: "System" };
    await log.createLog("Experimenter Assignment Updated", User, "updated experimenter assignment for an experimenter (" +
      personnelId + ")");

    res.status(200).send(assignedStudies);
  } catch (error) {
    res.status(500).send(error);
  }
});
