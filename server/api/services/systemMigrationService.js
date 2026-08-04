const crypto = require("crypto");
const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const path = require("path");
const { pipeline } = require("stream/promises");
const { spawn } = require("child_process");
const config = require("../../config/general");
const { pauseJobsForMigration, resumeJobsAfterMigration } = require("../../jobs/scheduler");

const MAGIC = Buffer.from("DRDBMIG1");
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const HEADER_LENGTH = MAGIC.length + SALT_LENGTH + IV_LENGTH;
const FORMAT_VERSION = 1;
const MAX_ARCHIVE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GiB
const RUNTIME_DIRS = ["api/google/general", "api/google/labs", "api/uploads", "data"];
let busy = false;
let maintenanceMode = false;

function isBusy() { return busy; }
function isMaintenanceMode() { return maintenanceMode; }
function isValidPassphrase(value) { return typeof value === "string" && value.length >= 12 && value.length <= 1024; }

function runtimeSource(relativePath) { return path.resolve(process.cwd(), relativePath); }
function assertInside(base, target) {
  const relative = path.relative(base, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Invalid migration archive path.");
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) return resolve();
      reject(new Error(`${command} failed${stderr ? `: ${stderr.slice(0, 500)}` : ""}`));
    });
  });
}

function runOutput(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve(stdout) : reject(new Error(`${command} failed: ${stderr.slice(0, 500)}`)));
  });
}

function dbArgs() {
  const args = ["-h", process.env.DB_HOST || "localhost", "-u", process.env.DB_USER || "drdb"];
  if (process.env.DB_PORT) args.push("-P", process.env.DB_PORT);
  args.push(config.DBName);
  return args;
}

async function dumpDatabase(destination) {
  const args = ["--single-transaction", "--routines", "--events", "--triggers", "--hex-blob", "--add-drop-table", "--add-drop-trigger", "--default-character-set=utf8mb4", ...dbArgs()];
  const child = spawn("mariadb-dump", args, { env: { ...process.env, MARIADB_PWD: process.env.DB_PASS || "" }, stdio: ["ignore", "pipe", "pipe"] });
  const output = fs.createWriteStream(destination, { mode: 0o600 });
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
  await Promise.all([
    pipeline(child.stdout, output),
    new Promise((resolve, reject) => {
      child.on("error", reject);
      child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`mariadb-dump failed: ${stderr.slice(0, 500)}`)));
    }),
  ]);
}

async function restoreDatabase(source) {
  await new Promise((resolve, reject) => {
    const child = spawn("mariadb", dbArgs(), { env: { ...process.env, MARIADB_PWD: process.env.DB_PASS || "" }, stdio: ["pipe", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    const input = fs.createReadStream(source);
    input.on("error", reject);
    input.pipe(child.stdin);
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`mariadb restore failed: ${stderr.slice(0, 500)}`)));
  });
}

async function sha256(filePath) {
  const hash = crypto.createHash("sha256");
  await pipeline(fs.createReadStream(filePath), hash);
  return hash.digest("hex");
}

async function fileIndex(root) {
  const entries = [];
  async function visit(current) {
    if (!fs.existsSync(current)) return;
    const stat = await fsp.lstat(current);
    if (stat.isSymbolicLink()) throw new Error("Migration runtime directories cannot contain symbolic links.");
    if (stat.isDirectory()) {
      for (const child of await fsp.readdir(current)) await visit(path.join(current, child));
      return;
    }
    const relative = path.relative(root, current).split(path.sep).join("/");
    entries.push({ path: relative, bytes: stat.size, sha256: await sha256(current) });
  }
  await visit(root);
  return entries.sort((a, b) => a.path.localeCompare(b.path));
}

async function copyRuntime(destination) {
  await fsp.mkdir(path.join(destination, "runtime"), { recursive: true, mode: 0o700 });
  for (const relative of RUNTIME_DIRS) {
    const source = runtimeSource(relative);
    const target = path.join(destination, "runtime", relative);
    if (fs.existsSync(source)) {
      await fsp.cp(source, target, {
        recursive: true,
        dereference: false,
        // Local rollback snapshots must never be nested into the next export.
        filter: (from) => path.resolve(from) !== path.resolve(runtimeSource("data/migration-backups")),
      });
    }
  }
}

function makeManifest(databaseHash, runtimeFiles) {
  return {
    format: "drdb-system-migration",
    formatVersion: FORMAT_VERSION,
    createdAt: new Date().toISOString(),
    database: { file: "database.sql", sha256: databaseHash },
    runtimeFiles,
    notes: "Contains participant data, password hashes, and Google credentials/tokens.",
  };
}

async function encrypt(source, destination, passphrase) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = await new Promise((resolve, reject) => crypto.scrypt(passphrase, salt, 32, (error, value) => error ? reject(error) : resolve(value)));
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const output = fs.createWriteStream(destination, { mode: 0o600 });
  output.write(Buffer.concat([MAGIC, salt, iv]));
  await pipeline(fs.createReadStream(source), cipher, output, { end: false });
  await new Promise((resolve, reject) => output.end(cipher.getAuthTag(), (error) => error ? reject(error) : resolve()));
}

async function decrypt(source, destination, passphrase) {
  const stat = await fsp.stat(source);
  if (stat.size < HEADER_LENGTH + TAG_LENGTH || stat.size > MAX_ARCHIVE_BYTES) throw new Error("Invalid or oversized migration archive.");
  const handle = await fsp.open(source, "r");
  const header = Buffer.alloc(HEADER_LENGTH);
  const tag = Buffer.alloc(TAG_LENGTH);
  await handle.read(header, 0, HEADER_LENGTH, 0);
  await handle.read(tag, 0, TAG_LENGTH, stat.size - TAG_LENGTH);
  await handle.close();
  if (!header.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error("This is not a DRDB migration archive.");
  const salt = header.subarray(MAGIC.length, MAGIC.length + SALT_LENGTH);
  const iv = header.subarray(MAGIC.length + SALT_LENGTH);
  const key = await new Promise((resolve, reject) => crypto.scrypt(passphrase, salt, 32, (error, value) => error ? reject(error) : resolve(value)));
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  try {
    await pipeline(fs.createReadStream(source, { start: HEADER_LENGTH, end: stat.size - TAG_LENGTH - 1 }), decipher, fs.createWriteStream(destination, { mode: 0o600 }));
  } catch (error) {
    throw new Error("Could not decrypt migration archive. Check the passphrase and file integrity.");
  }
}

async function createExport(passphrase) {
  if (busy) throw new Error("Another migration is already in progress.");
  busy = true;
  maintenanceMode = true;
  const work = await fsp.mkdtemp(path.join(os.tmpdir(), "drdb-export-"));
  try {
    await pauseJobsForMigration();
    const databasePath = path.join(work, "database.sql");
    await dumpDatabase(databasePath);
    await copyRuntime(work);
    const manifest = makeManifest(await sha256(databasePath), await fileIndex(path.join(work, "runtime")));
    await fsp.writeFile(path.join(work, "manifest.json"), JSON.stringify(manifest, null, 2), { mode: 0o600 });
    const tarPath = path.join(work, "migration.tar.gz");
    await run("tar", ["-czf", tarPath, "-C", work, "manifest.json", "database.sql", "runtime"]);
    const output = path.join(os.tmpdir(), `drdb-migration-${Date.now()}.drdb-migration`);
    await encrypt(tarPath, output, passphrase);
    return output;
  } finally {
    await fsp.rm(work, { recursive: true, force: true });
    maintenanceMode = false;
    busy = false;
    await resumeJobsAfterMigration().catch((error) => console.error("Could not resume jobs after export", error));
  }
}

async function saveUpload(req) {
  if (busy) throw new Error("Another migration is already in progress.");
  const length = Number(req.headers["content-length"] || 0);
  if (length && length > MAX_ARCHIVE_BYTES) throw new Error("Migration archive exceeds the 2 GiB limit.");
  const target = path.join(os.tmpdir(), `drdb-upload-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`);
  let total = 0;
  const output = fs.createWriteStream(target, { mode: 0o600 });
  req.on("data", (chunk) => {
    total += chunk.length;
    if (total > MAX_ARCHIVE_BYTES) req.destroy(new Error("Migration archive exceeds the 2 GiB limit."));
  });
  try {
    await pipeline(req, output);
  } catch (error) {
    await fsp.rm(target, { force: true });
    throw error;
  }
  return target;
}

async function validateExtracted(work) {
  const manifestPath = path.join(work, "manifest.json");
  const databasePath = path.join(work, "database.sql");
  if (!fs.existsSync(manifestPath) || !fs.existsSync(databasePath)) throw new Error("Migration archive is missing required files.");
  const manifest = JSON.parse(await fsp.readFile(manifestPath, "utf8"));
  if (manifest.format !== "drdb-system-migration" || manifest.formatVersion !== FORMAT_VERSION) throw new Error("Unsupported migration archive version.");
  if (manifest.database?.sha256 !== await sha256(databasePath)) throw new Error("Migration database checksum did not match.");
  const actual = await fileIndex(path.join(work, "runtime"));
  if (JSON.stringify(actual) !== JSON.stringify(manifest.runtimeFiles || [])) throw new Error("Migration runtime-file checksum did not match.");
  return manifest;
}

async function createPreImportBackup(destination) {
  await fsp.mkdir(destination, { recursive: true, mode: 0o700 });
  await dumpDatabase(path.join(destination, "database.sql"));
  await copyRuntime(destination);
  await fsp.writeFile(path.join(destination, "README.txt"), "Pre-import backup created automatically by DRDB. Restore with administrator assistance.\n", { mode: 0o600 });
}

async function replaceRuntime(work) {
  for (const relative of RUNTIME_DIRS) {
    const target = runtimeSource(relative);
    const source = path.join(work, "runtime", relative);
    assertInside(path.resolve(process.cwd()), target);
    if (relative === "data") {
      await fsp.mkdir(target, { recursive: true, mode: 0o700 });
      for (const entry of await fsp.readdir(target)) {
        if (entry !== "migration-backups") await fsp.rm(path.join(target, entry), { recursive: true, force: true });
      }
      if (fs.existsSync(source)) {
        for (const entry of await fsp.readdir(source)) {
          if (entry !== "migration-backups") await fsp.cp(path.join(source, entry), path.join(target, entry), { recursive: true, dereference: false });
        }
      }
      continue;
    }
    await fsp.rm(target, { recursive: true, force: true });
    if (fs.existsSync(source)) await fsp.cp(source, target, { recursive: true, dereference: false });
  }
}

async function importArchive(archive, passphrase) {
  if (busy) throw new Error("Another migration is already in progress.");
  busy = true;
  maintenanceMode = true;
  const work = await fsp.mkdtemp(path.join(os.tmpdir(), "drdb-import-"));
  try {
    await pauseJobsForMigration();
    const tarPath = path.join(work, "migration.tar.gz");
    await decrypt(archive, tarPath, passphrase);
    const listing = (await runOutput("tar", ["-tzf", tarPath])).split("\n").filter(Boolean);
    if (!listing.includes("manifest.json") || !listing.includes("database.sql") ||
      listing.some((entry) => entry.startsWith("/") || entry.split("/").includes("..") ||
        !(entry === "manifest.json" || entry === "database.sql" || entry === "runtime" || entry.startsWith("runtime/")))) {
      throw new Error("Migration archive has unsafe or unsupported contents.");
    }
    await run("tar", ["-xzf", tarPath, "-C", work, "--no-same-owner", "--no-same-permissions"]);
    const manifest = await validateExtracted(work);
    const backup = path.join(runtimeSource("data"), "migration-backups", new Date().toISOString().replace(/[:.]/g, "-"));
    await createPreImportBackup(backup);
    await restoreDatabase(path.join(work, "database.sql"));
    await replaceRuntime(work);
    return { message: "Migration imported successfully.", createdAt: manifest.createdAt, preImportBackup: backup };
  } finally {
    await fsp.rm(work, { recursive: true, force: true });
    maintenanceMode = false;
    busy = false;
    await resumeJobsAfterMigration().catch((error) => console.error("Could not resume jobs after import", error));
  }
}

async function removeTemporaryFile(file) { await fsp.rm(file, { force: true }); }

module.exports = { MAX_ARCHIVE_BYTES, createExport, importArchive, isBusy, isMaintenanceMode, isValidPassphrase, removeTemporaryFile, saveUpload };
