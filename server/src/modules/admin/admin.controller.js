import User from "../../models/User.js";
import Department from "../../models/Department.js";
import Course from "../../models/Course.js";
import Classroom from "../../models/Classroom.js";
import Session from "../../models/Session.js";
import Attendance from "../../models/Attendance.js";
import Student from "../../models/Student.js";
import Faculty from "../../models/Faculty.js";
import Enrollment from "../../models/Enrollment.js";
import { sendSuccess } from "../../utils/response.js";
import * as error from "../../shared/error/globalError.js";

export default class AdminController {
  // --- USERS ---
  async getUsers(req, res) {
    const users = await User.find().select("-password").populate("departmentId", "name").lean();
    
    // Fetch students and enrollments to attach semester and section
    const studentUsers = users.filter(u => u.role === "Student");
    if (studentUsers.length > 0) {
      const studentUserIds = studentUsers.map(u => u._id);
      const students = await Student.find({ userId: { $in: studentUserIds } });
      const studentIds = students.map(s => s._id);
      const enrollments = await Enrollment.find({ studentId: { $in: studentIds }, status: "Active" }).populate("semesterId", "name");
      
      const studentMap = {};
      students.forEach(s => { studentMap[s.userId.toString()] = s; });
      const enrollmentMap = {};
      enrollments.forEach(e => { enrollmentMap[e.studentId.toString()] = e; });

      users.forEach(u => {
        if (u.role === "Student") {
          const student = studentMap[u._id.toString()];
          if (student) {
            u.enrollmentNo = student.enrollmentNo;
            const enrollment = enrollmentMap[student._id.toString()];
            if (enrollment) {
              u.semester = enrollment.semesterId?.name;
              u.semesterId = enrollment.semesterId?._id;
              u.section = enrollment.section;
            }
          }
        }
      });
    }

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
      Session.countDocuments({ status: "Completed" }),
      Attendance.countDocuments({ status: "Present" }),
      Attendance.countDocuments({ status: "Flagged" })
    ]);

    // 7-day trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentAttendance = await Attendance.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo } } },
      { 
        $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing days
    const trend = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const record = recentAttendance.find(r => r._id === dateStr);
      trend.push({
        date: dateStr,
        checkIns: record ? record.count : 0
      });
    }

    const data = {
      users: { students: totalStudents, teachers: totalTeachers },
      sessions: { active: activeSessions, closed: closedSessions },
      attendance: { present: presentAttendance, flagged: flaggedAttendance },
      trend
    };

    return sendSuccess(res, 200, "Analytics retrieved successfully", data);
  }

  async createUser(req, res) {
    if (req.body.departmentId === "") req.body.departmentId = null;
    const user = await User.create(req.body);

    if (user.role === "Student") {
      const student = await Student.create({
        userId: user._id,
        enrollmentNo: req.body.enrollmentNo || `STU-${Date.now()}`,
        fullName: user.name
      });
      if (req.body.semesterId) {
        await Enrollment.create({
          studentId: student._id,
          semesterId: req.body.semesterId,
          section: req.body.section || "A",
          status: "Active"
        });
      }
    } else if (user.role === "Teacher") {
      await Faculty.create({
        userId: user._id,
        fullName: user.name,
        departmentId: user.departmentId,
        employeeId: req.body.employeeId || `EMP-${Date.now()}`,
      });
    }

    const userObj = user.toObject();
    delete userObj.password;
    return sendSuccess(res, 201, "User created", { user: userObj });
  }
  async updateUser(req, res) {
    if (req.body.departmentId === "") req.body.departmentId = null;
    
    let updatedUser;
    if (req.body.password) {
      const user = await User.findById(req.params.id);
      if (!user) throw new error.NOTFOUNDERROR("User not found");
      Object.assign(user, req.body);
      await user.save(); // Triggers pre-save hook for password hash
      const userObj = user.toObject();
      delete userObj.password;
      updatedUser = userObj;
    } else {
      const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-password");
      if (!user) throw new error.NOTFOUNDERROR("User not found");
      updatedUser = user.toObject ? user.toObject() : user;
    }

    // Sync sub-profiles
    if (updatedUser.role === "Student") {
      const student = await Student.findOneAndUpdate(
        { userId: updatedUser._id },
        { fullName: updatedUser.name },
        { new: true }
      );
      if (student && req.body.semesterId) {
        await Enrollment.findOneAndUpdate(
          { studentId: student._id },
          { semesterId: req.body.semesterId, section: req.body.section || "A", status: "Active" },
          { upsert: true }
        );
      }
    } else if (updatedUser.role === "Teacher") {
      await Faculty.findOneAndUpdate(
        { userId: updatedUser._id },
        { fullName: updatedUser.name, departmentId: updatedUser.departmentId }
      );
    }

    return sendSuccess(res, 200, "User updated", { user: updatedUser });
  }
  async deleteUser(req, res) {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) throw new error.NOTFOUNDERROR("User not found");

    // Cascade delete associated role profiles
    if (user.role === "Student") {
      const student = await Student.findOneAndDelete({ userId: user._id });
      if (student) {
        await Enrollment.deleteMany({ studentId: student._id });
      }
    } else if (user.role === "Teacher") {
      await Faculty.findOneAndDelete({ userId: user._id });
    }

    return sendSuccess(res, 200, "User deleted");
  }

  async bulkDeleteUsers(req, res) {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) throw new error.BADREQUESTERROR("Invalid IDs array");
    
    // We iterate so cascading deletes are processed
    for (const id of ids) {
      const user = await User.findByIdAndDelete(id);
      if (user) {
        if (user.role === "Student") {
          const student = await Student.findOneAndDelete({ userId: user._id });
          if (student) {
            await Enrollment.deleteMany({ studentId: student._id });
          }
        } else if (user.role === "Teacher") {
          await Faculty.findOneAndDelete({ userId: user._id });
        }
      }
    }
    return sendSuccess(res, 200, "Users deleted successfully");
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

  async bulkDeleteDepartments(req, res) {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) throw new error.BADREQUESTERROR("Invalid IDs array");
    await Department.deleteMany({ _id: { $in: ids } });
    return sendSuccess(res, 200, "Departments deleted successfully");
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

  async bulkDeleteCourses(req, res) {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) throw new error.BADREQUESTERROR("Invalid IDs array");
    await Course.deleteMany({ _id: { $in: ids } });
    return sendSuccess(res, 200, "Courses deleted successfully");
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

  async bulkDeleteClassrooms(req, res) {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) throw new error.BADREQUESTERROR("Invalid IDs array");
    await Classroom.deleteMany({ _id: { $in: ids } });
    return sendSuccess(res, 200, "Classrooms deleted successfully");
  }
}
