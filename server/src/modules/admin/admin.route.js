import { Router } from "express";
import AdminController from "./admin.controller.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";

const adminRoutes = Router();
const adminController = new AdminController();

// Protect all admin routes
adminRoutes.use(authenticate, authorize("Admin"));

// Analytics
adminRoutes.get("/analytics", asyncHandler(adminController.getAnalytics.bind(adminController)));

// Users CRUD
adminRoutes.post("/users/bulk-delete", asyncHandler(adminController.bulkDeleteUsers.bind(adminController)));
adminRoutes.get("/users", asyncHandler(adminController.getUsers.bind(adminController)));
adminRoutes.post("/users", asyncHandler(adminController.createUser.bind(adminController)));
adminRoutes.put("/users/:id", asyncHandler(adminController.updateUser.bind(adminController)));
adminRoutes.delete("/users/:id", asyncHandler(adminController.deleteUser.bind(adminController)));

// Departments CRUD
adminRoutes.post("/departments/bulk-delete", asyncHandler(adminController.bulkDeleteDepartments.bind(adminController)));
adminRoutes.get("/departments", asyncHandler(adminController.getDepartments.bind(adminController)));
adminRoutes.post("/departments", asyncHandler(adminController.createDepartment.bind(adminController)));
adminRoutes.put("/departments/:id", asyncHandler(adminController.updateDepartment.bind(adminController)));
adminRoutes.delete("/departments/:id", asyncHandler(adminController.deleteDepartment.bind(adminController)));

// Courses CRUD
adminRoutes.post("/courses/bulk-delete", asyncHandler(adminController.bulkDeleteCourses.bind(adminController)));
adminRoutes.get("/courses", asyncHandler(adminController.getCourses.bind(adminController)));
adminRoutes.post("/courses", asyncHandler(adminController.createCourse.bind(adminController)));
adminRoutes.put("/courses/:id", asyncHandler(adminController.updateCourse.bind(adminController)));
adminRoutes.delete("/courses/:id", asyncHandler(adminController.deleteCourse.bind(adminController)));

// Classrooms CRUD
adminRoutes.post("/classrooms/bulk-delete", asyncHandler(adminController.bulkDeleteClassrooms.bind(adminController)));
adminRoutes.get("/classrooms", asyncHandler(adminController.getClassrooms.bind(adminController)));
adminRoutes.post("/classrooms", asyncHandler(adminController.createClassroom.bind(adminController)));
adminRoutes.put("/classrooms/:id", asyncHandler(adminController.updateClassroom.bind(adminController)));
adminRoutes.delete("/classrooms/:id", asyncHandler(adminController.deleteClassroom.bind(adminController)));

export default adminRoutes;
