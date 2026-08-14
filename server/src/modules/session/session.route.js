import { Router } from "express";
import SessionController from "./session.controller.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";

const sessionRoutes = Router();
const sessionController = new SessionController();

sessionRoutes.use(authenticate);

// Teacher routes
sessionRoutes.get(
  "/my-subjects",
  authorize("Teacher"),
  asyncHandler(sessionController.getMySubjectOfferings.bind(sessionController))
);

sessionRoutes.get(
  "/my-sessions",
  authorize("Teacher"),
  asyncHandler(sessionController.getMySessions.bind(sessionController))
);

sessionRoutes.get(
  "/classrooms",
  authorize("Teacher"),
  asyncHandler(sessionController.getClassrooms.bind(sessionController))
);

sessionRoutes.post(
  "/",
  authorize("Teacher"),
  asyncHandler(sessionController.createSession.bind(sessionController))
);

// Shared routes (Admin/Teacher/Student might need this later, protecting to Teacher/Admin for now)
sessionRoutes.get(
  "/:id",
  authorize("Teacher", "Admin"),
  asyncHandler(sessionController.getSessionById.bind(sessionController))
);

sessionRoutes.patch(
  "/:id/close",
  authorize("Teacher"),
  asyncHandler(sessionController.closeSession.bind(sessionController))
);

sessionRoutes.get(
  "/:id/attendance",
  authorize("Teacher"),
  asyncHandler(sessionController.getSessionAttendance.bind(sessionController))
);

sessionRoutes.get(
  "/:id/export",
  authorize("Teacher", "Admin"),
  asyncHandler(sessionController.exportSessionAttendance.bind(sessionController))
);

sessionRoutes.get(
  "/offering/:id/report",
  authorize("Teacher", "Admin"),
  asyncHandler(sessionController.getSubjectOfferingReport.bind(sessionController))
);

export default sessionRoutes;
