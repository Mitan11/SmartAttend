import { Router } from "express";
import AcademicController from "./academic.controller.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";

const academicRoutes = Router();
const academicController = new AcademicController();

academicRoutes.use(authenticate);
academicRoutes.use(authorize("Admin")); // Protect all structural endpoints to Admin

// Departments
academicRoutes.get("/departments", asyncHandler(academicController.getDepartments.bind(academicController)));
academicRoutes.post("/departments", asyncHandler(academicController.createDepartment.bind(academicController)));
academicRoutes.put("/departments/:id", asyncHandler(academicController.updateDepartment.bind(academicController)));
academicRoutes.delete("/departments/:id", asyncHandler(academicController.deleteDepartment.bind(academicController)));

// Courses
academicRoutes.get("/courses", asyncHandler(academicController.getCourses.bind(academicController)));
academicRoutes.post("/courses", asyncHandler(academicController.createCourse.bind(academicController)));
academicRoutes.put("/courses/:id", asyncHandler(academicController.updateCourse.bind(academicController)));
academicRoutes.delete("/courses/:id", asyncHandler(academicController.deleteCourse.bind(academicController)));

// Academic Years
academicRoutes.post("/years/bulk-delete", asyncHandler(academicController.bulkDeleteAcademicYears.bind(academicController)));
academicRoutes.get("/years", asyncHandler(academicController.getAcademicYears.bind(academicController)));
academicRoutes.post("/years", asyncHandler(academicController.createAcademicYear.bind(academicController)));
academicRoutes.put("/years/:id", asyncHandler(academicController.updateAcademicYear.bind(academicController)));
academicRoutes.delete("/years/:id", asyncHandler(academicController.deleteAcademicYear.bind(academicController)));

// Semesters
academicRoutes.post("/semesters/bulk-delete", asyncHandler(academicController.bulkDeleteSemesters.bind(academicController)));
academicRoutes.get("/semesters", asyncHandler(academicController.getSemesters.bind(academicController)));
academicRoutes.post("/semesters", asyncHandler(academicController.createSemester.bind(academicController)));
academicRoutes.put("/semesters/:id", asyncHandler(academicController.updateSemester.bind(academicController)));
academicRoutes.delete("/semesters/:id", asyncHandler(academicController.deleteSemester.bind(academicController)));

// Faculty list
academicRoutes.get("/faculty", asyncHandler(academicController.getFaculty.bind(academicController)));

export default academicRoutes;
