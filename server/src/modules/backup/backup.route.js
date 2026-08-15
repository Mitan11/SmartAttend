import { Router } from "express";
import multer from "multer";
import BackupController from "./backup.controller.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";

const backupRoutes = Router();
const backupController = new BackupController();

const upload = multer({ storage: multer.memoryStorage() });

// All backup routes require Admin authentication
backupRoutes.use(authenticate);
backupRoutes.use(authorize("Admin"));

// GET /api/backup/collections — list all DB collection names
backupRoutes.get(
  "/collections",
  asyncHandler(backupController.listCollections.bind(backupController))
);

// GET /api/backup/export — download full DB as ZIP
backupRoutes.get(
  "/export",
  asyncHandler(backupController.exportDatabase.bind(backupController))
);

// POST /api/backup/save — save a backup copy to server disk
backupRoutes.post(
  "/save",
  asyncHandler(backupController.saveBackup.bind(backupController))
);

// POST /api/backup/import — upload a ZIP to restore DB
backupRoutes.post(
  "/import",
  upload.single("file"),
  asyncHandler(backupController.importDatabase.bind(backupController))
);

// GET /api/backup/list — list saved backups on disk
backupRoutes.get(
  "/list",
  asyncHandler(backupController.listBackups.bind(backupController))
);

// GET /api/backup/download/:filename — download a saved backup
backupRoutes.get(
  "/download/:filename",
  asyncHandler(backupController.downloadBackup.bind(backupController))
);

// DELETE /api/backup/:filename — delete a saved backup
backupRoutes.delete(
  "/:filename",
  asyncHandler(backupController.deleteBackup.bind(backupController))
);

export default backupRoutes;
