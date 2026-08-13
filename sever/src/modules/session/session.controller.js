import Course from "../../models/Course.js";
import Session from "../../models/Session.js";
import Classroom from "../../models/Classroom.js";
import Attendance from "../../models/Attendance.js";
import Setting from "../../models/Setting.js";
import { startSessionTimer, stopSessionTimer, getActiveToken } from "../../services/sessionManager.js";
import { getIO } from "../../config/socket.js";
import { sendSuccess } from "../../utils/response.js";
import * as error from "../../shared/error/globalError.js";

export default class SessionController {
  // Fetch courses assigned to the currently logged in teacher
  async getMyCourses(req, res) {
    const courses = await Course.find({ teacherId: req.user._id })
      .populate("departmentId", "name");
    return sendSuccess(res, 200, "Teacher courses retrieved", { courses });
  }

  // Fetch all sessions created by the currently logged in teacher
  async getMySessions(req, res) {
    const sessions = await Session.find({ teacherId: req.user._id })
      .populate("courseId", "name code")
      .populate("classroomId", "name")
      .sort({ createdAt: -1 }); // Newest first
    return sendSuccess(res, 200, "Teacher sessions retrieved", { sessions });
  }

  // Fetch all classrooms for session selection
  async getClassrooms(req, res) {
    const classrooms = await Classroom.find();
    return sendSuccess(res, 200, "Classrooms retrieved", { classrooms });
  }

  // Create a new active session
  async createSession(req, res) {
    const { courseId, classroomId, radius } = req.body;

    if (!courseId || !classroomId) {
      throw new error.BADREQUESTERROR("courseId and classroomId are required");
    }

    // Verify course belongs to this teacher
    const course = await Course.findOne({ _id: courseId, teacherId: req.user._id });
    if (!course) {
      throw new error.FORBIDDENERROR("You do not have permission to start a session for this course.");
    }

    // Ensure there are no currently active sessions for this course
    const existingSession = await Session.findOne({ courseId, status: "Active" });
    if (existingSession) {
      throw new error.BADREQUESTERROR("An active session already exists for this course.");
    }

    // Apply Global Settings
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({});
    }

    let finalRadius = radius;
    if (!setting.allowTeacherOverrides || !radius) {
      finalRadius = setting.defaultGeofenceRadius;
    }

    const session = await Session.create({
      courseId,
      teacherId: req.user._id,
      classroomId,
      status: "Active",
      radius: finalRadius
    });

    // Start generating QR tokens with configured interval
    startSessionTimer(session._id.toString(), setting.qrRotationInterval * 1000);

    const activeSessionData = getActiveToken(session._id.toString());
    const qrToken = activeSessionData ? activeSessionData.currentToken : null;

    return sendSuccess(res, 201, "Session created successfully", { session, qrToken });
  }

  // Retrieve session details
  async getSessionById(req, res) {
    const session = await Session.findById(req.params.id)
      .populate("courseId", "name code")
      .populate("classroomId", "name location capacity");
      
    if (!session) throw new error.NOTFOUNDERROR("Session not found");
    
    // Check access (only admin, or the teacher who created it, or maybe students - but for now protect it)
    if (req.user.role === "Teacher" && session.teacherId.toString() !== req.user._id.toString()) {
      throw new error.FORBIDDENERROR("Access denied");
    }

    let qrToken = null;
    if (session.status === "Active") {
      const activeSessionData = getActiveToken(session._id.toString());
      if (activeSessionData) qrToken = activeSessionData.currentToken;
    }

    return sendSuccess(res, 200, "Session retrieved", { session, qrToken });
  }

  // Close an active session
  async closeSession(req, res) {
    const { id } = req.params;
    
    const session = await Session.findById(id);
    if (!session) throw new error.NOTFOUNDERROR("Session not found");
    
    // Ensure only the teacher who created it can close it
    if (session.teacherId.toString() !== req.user._id.toString()) {
      throw new error.FORBIDDENERROR("You do not have permission to close this session");
    }

    if (session.status === "Closed") {
      throw new error.BADREQUESTERROR("Session is already closed");
    }

    session.status = "Closed";
    session.endTime = Date.now();
    await session.save();

    // Stop token rotation
    stopSessionTimer(id);

    // Emit closure event to clients
    const io = getIO();
    io.to(id).emit("session-closed", { message: "The session has been ended by the teacher." });

    return sendSuccess(res, 200, "Session closed successfully", { session });
  }

  // Get analytics/attendance for a specific session
  async getSessionAttendance(req, res) {
    const { id } = req.params;
    
    // Ensure session exists and teacher owns it
    const session = await Session.findById(id);
    if (!session) throw new error.NOTFOUNDERROR("Session not found");
    if (session.teacherId.toString() !== req.user._id.toString()) {
      throw new error.FORBIDDENERROR("Unauthorized to view this session's analytics");
    }

    const attendance = await Attendance.find({ sessionId: id })
      .populate("studentId", "name email")
      .sort({ timestamp: -1 });

    return sendSuccess(res, 200, "Attendance retrieved successfully", { attendance });
  }

  // Export attendance data as CSV
  async exportSessionAttendance(req, res) {
    const { id } = req.params;
    
    // Ensure session exists and teacher owns it
    const session = await Session.findById(id).populate("courseId");
    if (!session) throw new error.NOTFOUNDERROR("Session not found");
    if (session.teacherId.toString() !== req.user._id.toString() && req.user.role !== "Admin") {
      throw new error.FORBIDDENERROR("Unauthorized to export this session");
    }

    const records = await Attendance.find({ sessionId: id })
      .populate("studentId", "name email")
      .sort({ timestamp: 1 });

    // Generate CSV string
    const headers = ["Student Name", "Email", "Status", "Time Scanned", "Distance (m)", "Flags"];
    const rows = records.map(record => {
      const time = record.timestamp ? new Date(record.timestamp).toLocaleString("en-US") : "N/A";
      const flags = record.flags && record.flags.length > 0 ? record.flags.join("; ") : "";
      
      // Escape commas and quotes in values
      return [
        `"${record.studentId?.name || "Unknown"}"`,
        `"${record.studentId?.email || "Unknown"}"`,
        `"${record.status}"`,
        `"${time}"`,
        `"${Math.round(record.distance)}"`,
        `"${flags}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    const courseCode = session.courseId?.code || "COURSE";
    const dateStr = new Date(session.createdAt).toISOString().split("T")[0];
    const filename = `attendance_${courseCode}_${dateStr}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  }
}
