import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { ZipArchive } = require("archiver");
const unzipper = require("unzipper");
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import env from "../../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backup storage directory — configurable via BACKUP_DIR env variable
// On a VPS set: BACKUP_DIR=/var/data/smartattend/backups
// Falls back to <project-root>/backups/ for local development
const BACKUP_DIR = env.BACKUP_DIR
  ? path.resolve(env.BACKUP_DIR)
  : path.resolve(__dirname, "../../../../backups");

// Ensure backup directory exists
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Export all mongoose collections to an in-memory ZIP buffer.
 * @param {string[]} [selectedCollections] - Optional filter of collection names to export
 * @returns {Promise<Buffer>} ZIP buffer
 */
export async function exportAllCollections(selectedCollections = null) {
  const db = mongoose.connection.db;
  const allCollections = await db.listCollections().toArray();

  const filtered = allCollections.filter((col) =>
    selectedCollections ? selectedCollections.includes(col.name) : true
  );

  // Fetch all documents first (before creating the archive)
  const collectionData = [];
  for (const col of filtered) {
    const documents = await db.collection(col.name).find({}).toArray();
    collectionData.push({ name: col.name, documents });
  }

  // Build the ZIP synchronously so archiver doesn't get confused
  return new Promise((resolve, reject) => {
    const buffers = [];
    const archive = new ZipArchive();

    archive.on("data", (chunk) => buffers.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(buffers)));
    archive.on("error", reject);

    // Append all files synchronously — no async inside here
    for (const { name, documents } of collectionData) {
      archive.append(JSON.stringify(documents, null, 2), { name: `${name}.json` });
    }

    archive.finalize();
  });
}

/**
 * Save an export to disk and return the filename.
 * @param {Buffer} zipBuffer
 * @returns {string} filename
 */
export async function saveBackupToDisk(zipBuffer) {
  ensureBackupDir();
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);
  const filename = `backup-${timestamp}.zip`;
  const filepath = path.join(BACKUP_DIR, filename);
  fs.writeFileSync(filepath, zipBuffer);
  return filename;
}

/**
 * List all saved backup files on disk.
 * @returns {Array<{filename, size, createdAt}>}
 */
export function listLocalBackups() {
  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".zip"));
  return files
    .map((filename) => {
      const filepath = path.join(BACKUP_DIR, filename);
      const stat = fs.statSync(filepath);
      return {
        filename,
        size: stat.size,
        createdAt: stat.birthtime,
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Get the absolute path to a backup file (validated to be inside BACKUP_DIR).
 * @param {string} filename
 * @returns {string}
 */
export function getBackupFilePath(filename) {
  ensureBackupDir();
  const filepath = path.join(BACKUP_DIR, path.basename(filename));
  if (!fs.existsSync(filepath)) {
    throw new Error("Backup file not found");
  }
  return filepath;
}

/**
 * Delete a backup file from disk.
 * @param {string} filename
 */
export function deleteBackupFile(filename) {
  const filepath = getBackupFilePath(filename);
  fs.unlinkSync(filepath);
}

/**
 * Import data from a ZIP buffer. Clears existing collections and re-inserts.
 * @param {Buffer} zipBuffer
 * @param {string[]} [selectedCollections] - Optional filter; if empty restores all
 * @returns {Promise<{imported: string[], skipped: string[], totalDocuments: number}>}
 */
export async function importFromZipBuffer(zipBuffer, selectedCollections = null) {
  const db = mongoose.connection.db;
  const imported = [];
  const skipped = [];
  let totalDocuments = 0;

  // Parse the ZIP in memory
  const directory = await unzipper.Open.buffer(zipBuffer);

  for (const file of directory.files) {
    if (!file.path.endsWith(".json")) continue;

    const collectionName = path.basename(file.path, ".json");

    if (selectedCollections && !selectedCollections.includes(collectionName)) {
      skipped.push(collectionName);
      continue;
    }

    const content = await file.buffer();
    let documents;
    try {
      documents = JSON.parse(content.toString("utf8"));
    } catch {
      skipped.push(collectionName);
      continue;
    }

    if (!Array.isArray(documents)) {
      skipped.push(collectionName);
      continue;
    }

    const collection = db.collection(collectionName);
    await collection.deleteMany({});
    if (documents.length > 0) {
      await collection.insertMany(documents);
    }
    imported.push(collectionName);
    totalDocuments += documents.length;
  }

  return { imported, skipped, totalDocuments };
}
