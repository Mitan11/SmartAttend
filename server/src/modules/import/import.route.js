import { Router } from "express";
import multer from "multer";
import ImportController from "./import.controller.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";

const importRoutes = Router();
const importController = new ImportController();

const upload = multer({ storage: multer.memoryStorage() });

importRoutes.use(authenticate);
importRoutes.use(authorize("Admin"));

importRoutes.post(
  "/preview",
  upload.single("file"),
  asyncHandler(importController.previewImport.bind(importController))
);

importRoutes.post(
  "/execute",
  upload.single("file"),
  asyncHandler(importController.executeImport.bind(importController))
);

export default importRoutes;
