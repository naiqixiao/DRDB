const asyncHandler = require("express-async-handler");
const model = require("../models/DRDB");
const migration = require("../services/systemMigrationService");

async function requireAdmin(req, res) {
  const personnel = await model.personnel.findByPk(req.userData?.id, {
    attributes: ["id", "Role", "Retired"],
  });
  if (!personnel || personnel.Retired || personnel.Role !== "Admin") {
    res.status(403).json({ message: "Only an active Administrator can migrate this system." });
    return null;
  }
  return personnel;
}

exports.getStatus = asyncHandler(async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  res.json({ busy: migration.isBusy(), maxUploadBytes: migration.MAX_ARCHIVE_BYTES });
});

exports.exportMigration = asyncHandler(async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const passphrase = req.body?.passphrase;
  if (!migration.isValidPassphrase(passphrase)) {
    return res.status(400).json({ message: "Use a migration passphrase of at least 12 characters." });
  }
  const archive = await migration.createExport(passphrase);
  const name = `drdb-migration-${new Date().toISOString().slice(0, 10)}.drdb-migration`;
  res.download(archive, name, () => migration.removeTemporaryFile(archive).catch(() => {}));
});

exports.importMigration = asyncHandler(async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const passphrase = req.headers["x-migration-passphrase"];
  if (!migration.isValidPassphrase(passphrase)) {
    return res.status(400).json({ message: "Use the migration archive passphrase." });
  }
  if (req.headers["x-migration-confirmation"] !== "REPLACE THIS SYSTEM") {
    return res.status(400).json({ message: "The destructive confirmation did not match." });
  }
  const uploadedFile = await migration.saveUpload(req);
  try {
    res.json(await migration.importArchive(uploadedFile, passphrase));
  } finally {
    await migration.removeTemporaryFile(uploadedFile);
  }
});
