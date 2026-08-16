import SubjectOffering from "../../models/SubjectOffering.js";
import Faculty from "../../models/Faculty.js";
import Session from "../../models/Session.js";
import Classroom from "../../models/Classroom.js";
import Attendance from "../../models/Attendance.js";
import Setting from "../../models/Setting.js";
import Enrollment from "../../models/Enrollment.js";
import { startSessionTimer, stopSessionTimer, getActiveToken } from "../../services/session.service.js";
import { getIO } from "../../config/socket.js";
import { sendSuccess } from "../../utils/response.js";
import * as error from "../../shared/error/globalError.js";

export default class SessionController {
  // Fetch subject offerings assigned to the currently logged in teacher
  async getMySubjectOfferings(req, res) {
    const faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) throw new error.NOTFOUNDERROR("Faculty profile not found");

    const offerings = await SubjectOffering.find({ facultyId: faculty._id })
      .populate("subjectId", "name code")
      .populate("semesterId", "name");
    return sendSuccess(res, 200, "Teacher subjects retrieved", { offerings });
  }

  // Fetch all sessions created by the currently logged in teacher
  async getMySessions(req, res) {
    const faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) throw new error.NOTFOUNDERROR("Faculty profile not found");

    const offerings = await SubjectOffering.find({ facultyId: faculty._id });
    const offeringIds = offerings.map(o => o._id);

    const sessions = await Session.find({ subjectOfferingId: { $in: offeringIds } })
      .populate({
        path: "subjectOfferingId",
        populate: { path: "subjectId", select: "name code" }
      })
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
    const { subjectOfferingId, classroomId, radius, duration } = req.body;

    if (!subjectOfferingId || !classroomId) {
      throw new error.BADREQUESTERROR("subjectOfferingId and classroomId are required");
    }

    const faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) throw new error.NOTFOUNDERROR("Faculty profile not found");

    // Verify offering belongs to this teacher
    const offering = await SubjectOffering.findOne({ _id: subjectOfferingId, facultyId: faculty._id });
    if (!offering) {
      throw new error.FORBIDDENERROR("You do not have permission to start a session for this subject.");
    }

    // Ensure there are no currently active sessions for this subject offering
    const existingSession = await Session.findOne({ subjectOfferingId, status: "Active" });
    if (existingSession) {
      throw new error.BADREQUESTERROR("An active session already exists for this subject.");
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
      subjectOfferingId,
      classroomId,
      status: "Active",
      radius: finalRadius
    });

    const durationMs = duration ? Number(duration) * 60 * 1000 : 60000;

    // Start generating QR tokens with a fixed duration and auto-close callback
    startSessionTimer(session._id.toString(), durationMs, async (sessionId) => {
      try {
        const endedSession = await Session.findById(sessionId);
        if (endedSession && endedSession.status === "Active") {
          endedSession.status = "Completed";
          endedSession.endTime = Date.now();
          await endedSession.save();

          const io = getIO();
          io.to(sessionId).emit("session-closed", { message: "The session has ended automatically." });
        }
      } catch (err) {
        console.error("Auto-close session error", err);
      }
    });

    const activeSessionData = getActiveToken(session._id.toString());
    const qrToken = activeSessionData ? activeSessionData.currentToken : null;

    return sendSuccess(res, 201, "Session created successfully", { session, qrToken });
  }

  // Retrieve session details
  async getSessionById(req, res) {
    const session = await Session.findById(req.params.id)
      .populate({
        path: "subjectOfferingId",
        populate: [{ path: "subjectId", select: "name code" }, { path: "facultyId" }]
      })
      .populate("classroomId", "name location capacity");

    if (!session) throw new error.NOTFOUNDERROR("Session not found");

    if (req.user.role === "Teacher") {
      const faculty = await Faculty.findOne({ userId: req.user._id });
      if (!faculty || session.subjectOfferingId.facultyId._id.toString() !== faculty._id.toString()) {
        throw new error.FORBIDDENERROR("Access denied");
      }
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

    const session = await Session.findById(id).populate("subjectOfferingId");
    if (!session) throw new error.NOTFOUNDERROR("Session not found");

    const faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty || session.subjectOfferingId.facultyId.toString() !== faculty._id.toString()) {
      throw new error.FORBIDDENERROR("You do not have permission to close this session");
    }

    if (session.status === "Completed" || session.status === "Locked") {
      throw new error.BADREQUESTERROR("Session is already closed");
    }

    session.status = "Completed";
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

    const session = await Session.findById(id).populate("subjectOfferingId");
    if (!session) throw new error.NOTFOUNDERROR("Session not found");

    if (req.user.role === "Teacher") {
      const faculty = await Faculty.findOne({ userId: req.user._id });
      if (!faculty || session.subjectOfferingId.facultyId.toString() !== faculty._id.toString()) {
        throw new error.FORBIDDENERROR("Unauthorized to view this session's analytics");
      }
    }

    const attendance = await Attendance.find({ sessionId: id })
      .populate("studentId", "fullName enrollmentNo")
      .sort({ timestamp: -1 });

    return sendSuccess(res, 200, "Attendance retrieved successfully", { attendance });
  }

  // Export attendance data as CSV
  async exportSessionAttendance(req, res) {
    const { id } = req.params;

    const session = await Session.findById(id).populate({
      path: "subjectOfferingId",
      populate: { path: "subjectId" }
    });
    if (!session) throw new error.NOTFOUNDERROR("Session not found");

    if (req.user.role !== "Admin") {
      const faculty = await Faculty.findOne({ userId: req.user._id });
      if (!faculty || session.subjectOfferingId.facultyId.toString() !== faculty._id.toString()) {
        throw new error.FORBIDDENERROR("Unauthorized to export this session");
      }
    }

    const records = await Attendance.find({ sessionId: id })
      .populate("studentId", "fullName enrollmentNo")
      .sort({ timestamp: 1 });

    // Generate CSV string
    const headers = ["Enrollment No", "Student Name", "Status", "Time Scanned", "Remarks"];
    const rows = records.map(record => {
      const time = record.timestamp ? new Date(record.timestamp).toLocaleString("en-US") : "N/A";
      const remarks = record.remarks || "";

      // Escape commas and quotes in values
      return [
        `"${record.studentId?.enrollmentNo || "Unknown"}"`,
        `"${record.studentId?.fullName || "Unknown"}"`,
        `"${record.status}"`,
        `"${time}"`,
        `"${remarks}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    const subjectCode = session.subjectOfferingId?.subjectId?.code || "SUBJECT";
    const dateStr = new Date(session.createdAt).toISOString().split("T")[0];
    const filename = `attendance_${subjectCode}_${dateStr}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  }

  // Get aggregated report for a subject offering
  async getSubjectOfferingReport(req, res) {
    const { id } = req.params;

    const offering = await SubjectOffering.findById(id).populate("subjectId");
    if (!offering) throw new error.NOTFOUNDERROR("Subject Offering not found");

    if (req.user.role === "Teacher") {
      const faculty = await Faculty.findOne({ userId: req.user._id });
      if (!faculty || offering.facultyId.toString() !== faculty._id.toString()) {
        throw new error.FORBIDDENERROR("Unauthorized to view this report");
      }
    }

    // 1. Get all enrollments for the offering's semester
    const enrollments = await Enrollment.find({ semesterId: offering.semesterId, status: "Active" })
      .populate("studentId", "fullName enrollmentNo");

    // 2. Get all closed/completed sessions for this offering
    const sessions = await Session.find({ subjectOfferingId: id, status: { $in: ["Completed", "Locked"] } });
    const sessionIds = sessions.map(s => s._id);

    // 3. Get all attendance records for these sessions
    const attendanceRecords = await Attendance.find({ sessionId: { $in: sessionIds } });

    const totalSessions = sessions.length;

    // 4. Calculate stats per student
    const report = enrollments.map(enrollment => {
      const student = enrollment.studentId;
      const studentAttendance = attendanceRecords.filter(a => a.studentId.toString() === student._id.toString());

      const presentCount = studentAttendance.filter(a => a.status === "Present").length;
      const flaggedCount = studentAttendance.filter(a => a.status === "Flagged").length;
      const absentCount = studentAttendance.filter(a => a.status === "Absent").length;
      const excusedCount = studentAttendance.filter(a => a.status === "Excused").length;

      const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

      return {
        student: {
          _id: student._id,
          fullName: student.fullName,
          enrollmentNo: student.enrollmentNo
        },
        stats: {
          present: presentCount,
          flagged: flaggedCount,
          absent: absentCount,
          excused: excusedCount,
          totalSessions,
          percentage
        }
      };
    });

    return sendSuccess(res, 200, "Report generated successfully", { report, offering });
  }
}
