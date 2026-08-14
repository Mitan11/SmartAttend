import { Router } from "express";
import SubjectController from "./subject.controller.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";

const subjectRoutes = Router();
const subjectController = new SubjectController();

subjectRoutes.use(authenticate);
subjectRoutes.use(authorize("Admin"));

// Subjects master
subjectRoutes.post("/master/bulk-delete", asyncHandler(subjectController.bulkDeleteSubjects.bind(subjectController)));
subjectRoutes.get("/master", asyncHandler(subjectController.getSubjects.bind(subjectController)));
subjectRoutes.post("/master", asyncHandler(subjectController.createSubject.bind(subjectController)));
subjectRoutes.put("/master/:id", asyncHandler(subjectController.updateSubject.bind(subjectController)));
subjectRoutes.delete("/master/:id", asyncHandler(subjectController.deleteSubject.bind(subjectController)));

// Subject Offerings
subjectRoutes.post("/offerings/bulk-delete", asyncHandler(subjectController.bulkDeleteOfferings.bind(subjectController)));
subjectRoutes.get("/offerings", asyncHandler(subjectController.getOfferings.bind(subjectController)));
subjectRoutes.post("/offerings", asyncHandler(subjectController.createOffering.bind(subjectController)));
subjectRoutes.put("/offerings/:id", asyncHandler(subjectController.updateOffering.bind(subjectController)));
subjectRoutes.delete("/offerings/:id", asyncHandler(subjectController.deleteOffering.bind(subjectController)));

export default subjectRoutes;
