import multer from "multer";
import {
  exportAllCollections,
  saveBackupToDisk,
  listLocalBackups,
  getBackupFilePath,
  deleteBackupFile,
  importFromZipBuffer,
} from "./backup.service.js";
import { sendSuccess } from "../../utils/response.js";
import * as error from "../../shared/error/globalError.js";

export default class BackupController {
  /**
   * GET /api/backup/export
   * Exports all (or selected) collections as a ZIP download.
   * Query param: ?collections=students,faculty (optional comma-separated list)
   * Query param: ?save=true (optional - also save a copy on disk)
   */
  async exportDatabase(req, res) {
    const { collections: colParam, save } = req.query;
    const selectedCollections = colParam
      ? colParam.split(",").map((s) => s.trim()).filter(Boolean)
      : null;

    const zipBuffer = await exportAllCollections(selectedCollections);

    if (save === "true") {
      await saveBackupToDisk(zipBuffer);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `smartattend-backup-${timestamp}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", zipBuffer.length);
    return res.end(zipBuffer);
  }

  /**
   * POST /api/backup/save
   * Exports and saves a backup copy to the server's disk.
   * Body: { collections: [] } (optional)
   */
  async saveBackup(req, res) {
    const { collections: selectedCollections } = req.body;
    const zipBuffer = await exportAllCollections(
      Array.isArray(selectedCollections) && selectedCollections.length
        ? selectedCollections
        : null
    );
    const filename = await saveBackupToDisk(zipBuffer);
    return sendSuccess(res, 200, "Backup saved successfully", { filename });
  }

  /**
   * POST /api/backup/import
   * Accepts a ZIP file upload and restores the database.
   * Body (multipart): file + optional collections[]
   */
  async importDatabase(req, res) {
    if (!req.file) {
      throw new error.BADREQUESTERROR("No backup file uploaded");
    }

    const { collections: colParam } = req.body;
    const selectedCollections = colParam
      ? (Array.isArray(colParam) ? colParam : colParam.split(","))
          .map((s) => s.trim())
          .filter(Boolean)
      : null;

    const result = await importFromZipBuffer(req.file.buffer, selectedCollections);
    return sendSuccess(res, 200, "Database restored successfully", result);
  }

  /**
   * GET /api/backup/list
   * Returns a list of backup files stored on the server.
   */
  async listBackups(req, res) {
    const backups = listLocalBackups();
    return sendSuccess(res, 200, "Backups retrieved", { backups });
  }

  /**
   * GET /api/backup/download/:filename
   * Streams a saved backup file as a download.
   */
  async downloadBackup(req, res) {
    const { filename } = req.params;
    let filepath;
    try {
      filepath = getBackupFilePath(filename);
    } catch {
      throw new error.NOTFOUNDERROR("Backup file not found");
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    const { createReadStream } = await import("fs");
    const stream = createReadStream(filepath);
    stream.pipe(res);
  }

  /**
   * DELETE /api/backup/:filename
   * Deletes a saved backup file from disk.
   */
  async deleteBackup(req, res) {
    const { filename } = req.params;
    try {
      deleteBackupFile(filename);
    } catch {
      throw new error.NOTFOUNDERROR("Backup file not found");
    }
    return sendSuccess(res, 200, "Backup deleted", { filename });
  }

  /**
   * GET /api/backup/collections
   * Returns a list of all collection names in the current DB.
   */
  async listCollections(req, res) {
    const mongoose = (await import("mongoose")).default;
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    return sendSuccess(res, 200, "Collections retrieved", {
      collections: collections.map((c) => c.name),
    });
  }
}
