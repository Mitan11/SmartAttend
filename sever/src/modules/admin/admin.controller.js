import User from "../../models/User.js";
import Department from "../../models/Department.js";
import Course from "../../models/Course.js";
import Classroom from "../../models/Classroom.js";
import Session from "../../models/Session.js";
import Attendance from "../../models/Attendance.js";
import { sendSuccess } from "../../utils/response.js";
import * as error from "../../shared/error/globalError.js";

export default class AdminController {
  // --- USERS ---
  async getUsers(req, res) {
    const users = await User.find().select("-password").populate("departmentId", "name");
    return sendSuccess(res, 200, "Users retrieved successfully", { users });
  }

  // --- Analytics ---
  async getAnalytics(req, res) {
    const [
      totalStudents,
      totalTeachers,
      activeSessions,
      closedSessions,
      presentAttendance,
      flaggedAttendance
    ] = await Promise.all([
      User.countDocuments({ role: "Student" }),
      User.countDocuments({ role: "Teacher" }),
      Session.countDocuments({ status: "Active" }),
      Session.countDocuments({ status: "Closed" }),
      Attendance.countDocuments({ status: "Present" }),
      Attendance.countDocuments({ status: "Flagged" })
    ]);

    const data = {
      users: { students: totalStudents, teachers: totalTeachers },
      sessions: { active: activeSessions, closed: closedSessions },
      attendance: { present: presentAttendance, flagged: flaggedAttendance }
    };

    return sendSuccess(res, 200, "Analytics retrieved successfully", data);
  }

  async createUser(req, res) {
    // Password is required in User.js; we can set a default or let validation handle it.
    const user = await User.create(req.body);
    const userObj = user.toObject();
    delete userObj.password;
    return sendSuccess(res, 201, "User created", { user: userObj });
  }
  async updateUser(req, res) {
    if (req.body.password) {
      const user = await User.findById(req.params.id);
      if (!user) throw new error.NOTFOUNDERROR("User not found");
      Object.assign(user, req.body);
      await user.save(); // Triggers pre-save hook for password hash
      const userObj = user.toObject();
      delete userObj.password;
      return sendSuccess(res, 200, "User updated", { user: userObj });
    } else {
      const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-password");
      if (!user) throw new error.NOTFOUNDERROR("User not found");
      return sendSuccess(res, 200, "User updated", { user });
    }
  }
  async deleteUser(req, res) {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) throw new error.NOTFOUNDERROR("User not found");
    return sendSuccess(res, 200, "User deleted");
  }

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
    const courses = await Course.find().populate("teacherId", "name").populate("departmentId", "name");
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

  // --- CLASSROOMS ---
  async getClassrooms(req, res) {
    const classrooms = await Classroom.find();
    return sendSuccess(res, 200, "Classrooms retrieved", { classrooms });
  }
  async createClassroom(req, res) {
    const classroom = await Classroom.create(req.body);
    return sendSuccess(res, 201, "Classroom created", { classroom });
  }
  async updateClassroom(req, res) {
    const classroom = await Classroom.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!classroom) throw new error.NOTFOUNDERROR("Classroom not found");
    return sendSuccess(res, 200, "Classroom updated", { classroom });
  }
  async deleteClassroom(req, res) {
    const classroom = await Classroom.findByIdAndDelete(req.params.id);
    if (!classroom) throw new error.NOTFOUNDERROR("Classroom not found");
    return sendSuccess(res, 200, "Classroom deleted");
  }
}
