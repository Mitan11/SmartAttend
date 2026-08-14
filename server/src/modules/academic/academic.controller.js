import Department from "../../models/Department.js";
import Course from "../../models/Course.js";
import AcademicYear from "../../models/AcademicYear.js";
import Semester from "../../models/Semester.js";
import Faculty from "../../models/Faculty.js";
import { sendSuccess } from "../../utils/response.js";
import * as error from "../../shared/error/globalError.js";

export default class AcademicController {
  // --- DEPARTMENTS ---
  async getDepartments(req, res) {
    const departments = await Department.find();
    return sendSuccess(res, 200, "Departments retrieved", { departments });
  }
  async createDepartment(req, res) {
    const department = await Department.create(req.body);
    return sendSuccess(res, 201, "Department created", { department });
  }
  async updateDepartment(req, res) {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!department) throw new error.NOTFOUNDERROR("Department not found");
    return sendSuccess(res, 200, "Department updated", { department });
  }
  async deleteDepartment(req, res) {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) throw new error.NOTFOUNDERROR("Department not found");
    return sendSuccess(res, 200, "Department deleted");
  }

  // --- COURSES ---
  async getCourses(req, res) {
    const courses = await Course.find().populate("departmentId", "name");
    return sendSuccess(res, 200, "Courses retrieved", { courses });
  }
  async createCourse(req, res) {
    const course = await Course.create(req.body);
    return sendSuccess(res, 201, "Course created", { course });
  }
  async updateCourse(req, res) {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!course) throw new error.NOTFOUNDERROR("Course not found");
    return sendSuccess(res, 200, "Course updated", { course });
  }
  async deleteCourse(req, res) {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) throw new error.NOTFOUNDERROR("Course not found");
    return sendSuccess(res, 200, "Course deleted");
  }

  // --- ACADEMIC YEARS ---
  async getAcademicYears(req, res) {
    const years = await AcademicYear.find();
    return sendSuccess(res, 200, "Academic Years retrieved", { years });
  }
  async createAcademicYear(req, res) {
    const year = await AcademicYear.create(req.body);
    return sendSuccess(res, 201, "Academic Year created", { year });
  }
  async updateAcademicYear(req, res) {
    const year = await AcademicYear.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!year) throw new error.NOTFOUNDERROR("Academic Year not found");
    return sendSuccess(res, 200, "Academic Year updated", { year });
  }
  async deleteAcademicYear(req, res) {
    const year = await AcademicYear.findByIdAndDelete(req.params.id);
    if (!year) throw new error.NOTFOUNDERROR("Academic Year not found");
    return sendSuccess(res, 200, "Academic Year deleted");
  }

  async bulkDeleteAcademicYears(req, res) {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) throw new error.BADREQUESTERROR("Invalid IDs array");
    await AcademicYear.deleteMany({ _id: { $in: ids } });
    return sendSuccess(res, 200, "Academic Years deleted successfully");
  }

  // --- SEMESTERS ---
  async getSemesters(req, res) {
    const semesters = await Semester.find()
      .populate({
        path: "courseId",
        select: "name code departmentId"
      })
      .populate("academicYearId", "year");
    return sendSuccess(res, 200, "Semesters retrieved", { semesters });
  }
  async createSemester(req, res) {
    const semester = await Semester.create(req.body);
    return sendSuccess(res, 201, "Semester created", { semester });
  }
  async updateSemester(req, res) {
    const semester = await Semester.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!semester) throw new error.NOTFOUNDERROR("Semester not found");
    return sendSuccess(res, 200, "Semester updated", { semester });
  }
  async deleteSemester(req, res) {
    const semester = await Semester.findByIdAndDelete(req.params.id);
    if (!semester) throw new error.NOTFOUNDERROR("Semester not found");
    return sendSuccess(res, 200, "Semester deleted");
  }

  async bulkDeleteSemesters(req, res) {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) throw new error.BADREQUESTERROR("Invalid IDs array");
    await Semester.deleteMany({ _id: { $in: ids } });
    return sendSuccess(res, 200, "Semesters deleted successfully");
  }

  // --- FACULTY (For dropdowns) ---
  async getFaculty(req, res) {
    const faculty = await Faculty.find().populate("departmentId", "name");
    return sendSuccess(res, 200, "Faculty retrieved", { faculty });
  }
}
