import { Router } from "express";
import SettingController from "./setting.controller.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";

const settingRoutes = Router();
const settingController = new SettingController();

settingRoutes.use(authenticate);

settingRoutes.get(
  "/",
  authorize("Admin", "Teacher"),
  asyncHandler(settingController.getSettings.bind(settingController))
);

settingRoutes.patch(
  "/",
  authorize("Admin"),
  asyncHandler(settingController.updateSettings.bind(settingController))
);

export default settingRoutes;
