import express from "express";
import securityMiddleware from "./middlewares/security.middleware.js";
import authRoutes from "./modules/auth/auth.route.js";
import adminRoutes from "./modules/admin/admin.route.js";
import sessionRoutes from "./modules/session/session.route.js";
import attendanceRoutes from "./modules/attendance/attendance.route.js";
import settingRoutes from "./modules/setting/setting.route.js";
import importRoutes from "./modules/import/import.route.js";
import backupRoutes from "./modules/backup/backup.route.js";
import academicRoutes from "./modules/academic/academic.route.js";
import subjectRoutes from "./modules/subject/subject.route.js";
import errorHandler from "./middlewares/errorHandler.middleware.js";
import notFoundHandler from "./middlewares/notFound.middleware.js";
export default function createApp() {
  const app = express();

  securityMiddleware(app);

  app.use("/api/user", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/sessions", sessionRoutes);
  app.use("/api/attendance", attendanceRoutes);
  app.use("/api/settings", settingRoutes);
  app.use("/api/import", importRoutes);
  app.use("/api/backup", backupRoutes);
  app.use("/api/academic", academicRoutes);
  app.use("/api/subjects", subjectRoutes);

  app.get("/api/health", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Server is healthy",
      data: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
