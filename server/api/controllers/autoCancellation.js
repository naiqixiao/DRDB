const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const moment = require("moment");
const log = require("../controllers/log");

// System-wide defaults (used when a lab has no custom setting)
const DEFAULTS = {
  autoCancellationDays: 14,
  autoCompletionDays: 2,
  staleScheduleDays: 13,
};

/** Ensures a duration value stays within a reasonable range (1–14 days). */
function clampDays(value, fallback, min = 1, max = 14) {
  const n = parseInt(value, 10);
  if (isNaN(n) || n < min) return fallback;
  if (n > max) return max;
  return n;
}

/**
 * Returns a Map of labId (number) → parsed settings object
 * for every lab that has a LabSettings_<id> row in SystemSetting.
 */
async function getLabSettingsMap() {
  const rows = await model.systemSetting.findAll({
    where: { SettingKey: { [Op.like]: "LabSettings_%" } },
  });

  const map = new Map();
  for (const row of rows) {
    try {
      const labId = parseInt(row.SettingKey.split("_")[1], 10);
      if (!isNaN(labId)) {
        map.set(labId, JSON.parse(row.SettingValue));
      }
    } catch (e) {
      // ignore malformed rows
    }
  }
  return map;
}

/**
 * Given a labSettingsMap, partitions labs for one (feature, duration) pair.
 *
 * Returns:
 *   excludeFromDefault — labIds that must NOT appear in the default-duration
 *                        query (opted-out labs + labs with a non-default duration)
 *   customGroups       — Map<days, labIds[]> for labs that use a non-default
 *                        duration and should each get their own query
 */
function buildGroups(labSettingsMap, featureKey, durationKey, defaultDays) {
  const excludeFromDefault = [];
  const customGroups = new Map();

  for (const [labId, settings] of labSettingsMap) {
    if (settings[featureKey] === false) {
      // Feature disabled — exclude from all queries for this feature
      excludeFromDefault.push(labId);
      continue;
    }

    const days = clampDays(settings[durationKey] ?? defaultDays, defaultDays);

    if (days !== defaultDays) {
      // Non-default duration — give it its own query bucket
      if (!customGroups.has(days)) customGroups.set(days, []);
      customGroups.get(days).push(labId);
      excludeFromDefault.push(labId); // keep out of the default query
    }
    // If days === defaultDays the lab is handled by the default query — no action needed
  }

  return { excludeFromDefault, customGroups };
}

/**
 * Builds a Sequelize where-clause fragment that targets all labs EXCEPT those
 * in excludeFromDefault (and always includes rows where AssignedLab IS NULL).
 */
function defaultLabFilter(excludeFromDefault) {
  if (excludeFromDefault.length === 0) return {};
  return {
    "$Family.AssignedLab$": {
      [Op.or]: [{ [Op.notIn]: excludeFromDefault }, { [Op.is]: null }],
    },
  };
}

/**
 * Builds a Sequelize where-clause fragment that targets only a specific set
 * of labs.
 */
function specificLabFilter(labIds) {
  return { "$Family.AssignedLab$": { [Op.in]: labIds } };
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto Cancellation
//
// If a family hasn't been contacted in N days and the schedule is still TBD /
// Rescheduling, mark it as Rejected and release the family.
// ─────────────────────────────────────────────────────────────────────────────

exports.autoCancellation = asyncHandler(async (req, res) => {
  const User = { Name: "", Email: "", LabName: "" };

  const labSettingsMap = await getLabSettingsMap();
  const { excludeFromDefault, customGroups } = buildGroups(
    labSettingsMap,
    "autoCancellation",
    "autoCancellationDays",
    DEFAULTS.autoCancellationDays
  );

  /**
   * Runs one cancellation sweep for the given cutoff (days) and lab filter.
   */
  const runCancellation = async (days, labFilter) => {
    const schedules = await model.schedule.findAll({
      attributes: ["id", "FK_Family"],
      raw: true,
      include: [model.family],
      where: {
        "$Family.NextContactDate$": {
          [Op.lte]: moment().subtract(days, "days").toDate(),
        },
        Status: { [Op.in]: ["TBD", "Rescheduling"] },
        ...labFilter,
      },
    });

    const scheduleIds = schedules.map((s) => s.id);
    if (scheduleIds.length > 0) {
      await model.schedule.update(
        { Status: "Rejected", Completed: true },
        { where: { id: { [Op.in]: scheduleIds } } }
      );
      await log.createLog(
        "Auto cancellation",
        User,
        `marked ${scheduleIds.length} schedule(s) as Rejected (threshold: ${days} days).`
      );
    }

    // Release the families so they can be recruited again
    const familyIds = [
      ...new Set(
        schedules.map((s) => s.FK_Family).filter((id) => id != null)
      ),
    ];
    if (familyIds.length > 0) {
      await model.family.update(
        { AssignedLab: null },
        { where: { id: familyIds } }
      );
      await log.createLog(
        "Family Lab Assignment Release",
        {},
        `Families (${familyIds.join(", ")}) released via auto cancellation.`
      );
    }
  };

  try {
    // Default-duration sweep (covers all labs not in excludeFromDefault)
    await runCancellation(
      DEFAULTS.autoCancellationDays,
      defaultLabFilter(excludeFromDefault)
    );

    // Per-lab custom-duration sweeps
    for (const [days, labIds] of customGroups) {
      await runCancellation(days, specificLabFilter(labIds));
    }
  } catch (error) {
    console.error("Auto-cancellation error:", error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Auto Completion
//
// Three sub-operations run in sequence:
//   Op1 — Confirmed schedules whose appointment time has passed by N days
//          → mark Completed
//   Op2 — Stale TBD / Rescheduling / No Show / Cancelled schedules not updated
//          in N days → mark Rejected + Completed
//   Op3 — Any Rejected schedule still flagged as incomplete → mark Completed
//          (cleanup sweep, no duration; respects opt-out only)
// ─────────────────────────────────────────────────────────────────────────────

exports.autoCompletion = asyncHandler(async (req, res) => {
  const labSettingsMap = await getLabSettingsMap();

  // Build a simple opt-out list for Op3 (no per-lab duration needed)
  const completionOptOutIds = [];
  for (const [labId, settings] of labSettingsMap) {
    if (settings.autoCompletion === false) completionOptOutIds.push(labId);
  }

  // Op1 groups — keyed by autoCompletionDays
  const op1 = buildGroups(
    labSettingsMap,
    "autoCompletion",
    "autoCompletionDays",
    DEFAULTS.autoCompletionDays
  );

  // Op2 groups — keyed by staleScheduleDays (same feature flag)
  const op2 = buildGroups(
    labSettingsMap,
    "autoCompletion",
    "staleScheduleDays",
    DEFAULTS.staleScheduleDays
  );

  // ── Op 1 ──────────────────────────────────────────────────────────────────
  const runCompletion = async (days, labFilter) => {
    const schedules = await model.schedule.findAll({
      attributes: ["id"],
      raw: true,
      include: [model.family],
      where: {
        Status: "Confirmed",
        Completed: 0,
        AppointmentTime: {
          [Op.lt]: moment().subtract(days, "days").startOf("day").toDate(),
        },
        ...labFilter,
      },
    });

    const ids = schedules.map((s) => s.id);
    if (ids.length > 0) {
      await model.schedule.update(
        { Completed: 1 },
        { where: { id: { [Op.in]: ids } } }
      );
      await log.createLog(
        "Auto Completion",
        {},
        `marked ${ids.length} schedule(s) as Completed (threshold: ${days} days after appointment).`
      );
    }
  };

  // ── Op 2 ──────────────────────────────────────────────────────────────────
  const runStaleRejection = async (days, labFilter) => {
    const schedules = await model.schedule.findAll({
      attributes: ["id"],
      raw: true,
      include: [model.family],
      where: {
        Status: { [Op.in]: ["TBD", "Rescheduling", "No Show", "Cancelled"] },
        Completed: 0,
        updatedAt: {
          [Op.lt]: moment().subtract(days, "days").startOf("day").toDate(),
        },
        ...labFilter,
      },
    });

    const ids = schedules.map((s) => s.id);
    if (ids.length > 0) {
      await model.schedule.update(
        { Status: "Rejected", Completed: true },
        { where: { id: { [Op.in]: ids } } }
      );
      await log.createLog(
        "Auto Completion",
        {},
        `marked ${ids.length} stale schedule(s) as Rejected (threshold: ${days} days inactive).`
      );
    }
  };

  // ── Op 3 ──────────────────────────────────────────────────────────────────
  const runOrphanCompletion = async (labFilter) => {
    const schedules = await model.schedule.findAll({
      attributes: ["id"],
      raw: true,
      include: [model.family],
      where: {
        Status: "Rejected",
        Completed: false,
        ...labFilter,
      },
    });

    const ids = schedules.map((s) => s.id);
    if (ids.length > 0) {
      await model.schedule.update(
        { Completed: true },
        { where: { id: { [Op.in]: ids } } }
      );
      await log.createLog(
        "Auto Completion",
        {},
        `marked ${ids.length} rejected schedule(s) as Completed (cleanup sweep).`
      );
    }
  };

  try {
    // Op 1 — default + custom duration sweeps
    await runCompletion(
      DEFAULTS.autoCompletionDays,
      defaultLabFilter(op1.excludeFromDefault)
    );
    for (const [days, labIds] of op1.customGroups) {
      await runCompletion(days, specificLabFilter(labIds));
    }

    // Op 2 — default + custom duration sweeps
    await runStaleRejection(
      DEFAULTS.staleScheduleDays,
      defaultLabFilter(op2.excludeFromDefault)
    );
    for (const [days, labIds] of op2.customGroups) {
      await runStaleRejection(days, specificLabFilter(labIds));
    }

    // Op 3 — single sweep excluding opted-out labs only
    await runOrphanCompletion(
      completionOptOutIds.length > 0
        ? {
            "$Family.AssignedLab$": {
              [Op.or]: [
                { [Op.notIn]: completionOptOutIds },
                { [Op.is]: null },
              ],
            },
          }
        : {}
    );

    if (res) {
      res.status(200).json({ message: "Auto completion complete." });
    }
  } catch (error) {
    console.error("Auto-completion error:", error);
  }
});
