import { Router } from "express";
import AuthController from "./auth.controller.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as validation from "../../validation/validationRule.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post(
  "/register",
  validation.registerValidationRule,
  asyncHandler(authController.registerController.bind(authController))
);

authRoutes.post(
  "/login",
  validation.loginValidationRule,
  asyncHandler(authController.loginController.bind(authController))
);

authRoutes.post(
  "/logout",
  authenticate,
  asyncHandler(authController.logoutController.bind(authController))
);

authRoutes.get(
  "/me",
  authenticate,
  asyncHandler(authController.meController.bind(authController))
);

// Admin-only test route for role blocking
authRoutes.get(
  "/admin-only",
  authenticate,
  authorize("Admin"),
  (req, res) => res.json({ success: true, message: "Welcome Admin", data: {} })
);

export default authRoutes;
