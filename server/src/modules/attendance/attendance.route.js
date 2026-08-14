import { Router } from "express";
import AttendanceController from "./attendance.controller.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";

const attendanceRoutes = Router();
const attendanceController = new AttendanceController();

attendanceRoutes.use(authenticate);

attendanceRoutes.post(
  "/mark",
  authorize("Student"),
  asyncHandler(attendanceController.markAttendance.bind(attendanceController))
);

attendanceRoutes.get(
  "/my-history",
  authorize("Student"),
  asyncHandler(attendanceController.getMyHistory.bind(attendanceController))
);

attendanceRoutes.patch(
  "/:id",
  authorize("Teacher"),
  asyncHandler(attendanceController.updateAttendanceStatus.bind(attendanceController))
);

attendanceRoutes.post(
  "/manual",
  authorize("Teacher"),
  asyncHandler(attendanceController.manualCheckIn.bind(attendanceController))
);

export default attendanceRoutes;
