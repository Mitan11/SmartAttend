import { parseExcel, processStudentImport, parseFacultyExcel, processFacultyImport } from "./import.service.js";
import Student from "../../models/Student.js";
import Faculty from "../../models/Faculty.js";
import { sendSuccess } from "../../utils/response.js";
import * as error from "../../shared/error/globalError.js";

export default class ImportController {
    async previewImport(req, res) {
        if (!req.file) {
            throw new error.BADREQUESTERROR("No file uploaded");
        }

        const { importType } = req.body;
        const type = importType || "student"; // default to student

        if (type === "student") {
            const studentsData = parseExcel(req.file.buffer);
            const enrollmentNos = studentsData.map(s => s.enrollmentNo);
            const existingStudents = await Student.find({ enrollmentNo: { $in: enrollmentNos } });
            const existingSet = new Set(existingStudents.map(s => s.enrollmentNo));

            const previewData = studentsData.map(s => ({
                ...s,
                isNew: !existingSet.has(s.enrollmentNo)
            }));

            return sendSuccess(res, 200, "Preview generated", {
                totalRows: studentsData.length,
                newStudents: previewData.filter(s => s.isNew).length,
                existingStudents: previewData.filter(s => !s.isNew).length,
                preview: previewData.slice(0, 5)
            });
        } else if (type === "faculty") {
            const facultiesData = parseFacultyExcel(req.file.buffer);
            const employeeIds = facultiesData.map(f => f.employeeId);
            const existingFaculties = await Faculty.find({ employeeId: { $in: employeeIds } });
            const existingSet = new Set(existingFaculties.map(f => f.employeeId));

            const previewData = facultiesData.map(f => ({
                ...f,
                isNew: !existingSet.has(f.employeeId)
            }));

            return sendSuccess(res, 200, "Preview generated", {
                totalRows: facultiesData.length,
                newStudents: previewData.filter(f => f.isNew).length,
                existingStudents: previewData.filter(f => !f.isNew).length,
                preview: previewData.slice(0, 5)
            });
        }
    }

    async executeImport(req, res) {
        if (!req.file) {
            throw new error.BADREQUESTERROR("No file uploaded");
        }

        const { semesterId, departmentId, importType, section } = req.body;
        const type = importType || "student";

        if (type === "student") {
            if (!semesterId) throw new error.BADREQUESTERROR("semesterId is required for student import");
            const studentsData = parseExcel(req.file.buffer);
            const results = await processStudentImport(studentsData, semesterId, section);
            return sendSuccess(res, 200, "Student import completed", { results });
        } else if (type === "faculty") {
            if (!departmentId) throw new error.BADREQUESTERROR("departmentId is required for faculty import");
            const facultiesData = parseFacultyExcel(req.file.buffer);
            const results = await processFacultyImport(facultiesData, departmentId);
            return sendSuccess(res, 200, "Faculty import completed", { results });
        } else {
            throw new error.BADREQUESTERROR("Invalid importType");
        }
    }
}
