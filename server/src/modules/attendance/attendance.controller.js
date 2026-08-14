import Attendance from "../../models/Attendance.js";
import Session from "../../models/Session.js";
import Enrollment from "../../models/Enrollment.js";
import Student from "../../models/Student.js";
import Faculty from "../../models/Faculty.js";
import AttendanceChangeLog from "../../models/AttendanceChangeLog.js";
import { getActiveToken } from "../../services/session.service.js";
import { calculateDistance } from "../../utils/haversine.js";
import { sendSuccess } from "../../utils/response.js";
import { getIO } from "../../config/socket.js";
import * as error from "../../shared/error/globalError.js";

export default class AttendanceController {
  async markAttendance(req, res) {
    const { sessionId, token, location, deviceId } = req.body;
    
    if (!sessionId || !token || !location || location.lat === undefined || location.lng === undefined) {
      throw new error.BADREQUESTERROR("Missing required fields for attendance");
    }
    if (!deviceId) throw new error.BADREQUESTERROR("Device ID is required");

    // Device Verification Logic
    if (!req.user.registeredDeviceId) {
      req.user.registeredDeviceId = deviceId;
      await req.user.save();
    } else if (req.user.registeredDeviceId !== deviceId) {
      throw new error.FORBIDDENERROR("Device mismatch. You can only mark attendance from your registered device.");
    }

    // Lookup Student Profile
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      throw new error.FORBIDDENERROR("Student profile not found. Cannot mark attendance.");
    }
    const studentId = student._id;

    // 1. Verify Session exists and is active
    const session = await Session.findById(sessionId).populate(["classroomId", "subjectOfferingId"]);
    if (!session || session.status !== "Active") {
      throw new error.BADREQUESTERROR("Session is not active or does not exist");
    }

    // 2. Verify Enrollment (Student must be enrolled in the Semester)
    const enrollment = await Enrollment.findOne({ 
      studentId, 
      semesterId: session.subjectOfferingId.semesterId,
      status: "Active"
    });
    if (!enrollment) {
      throw new error.FORBIDDENERROR("You are not actively enrolled in this semester.");
    }
    if (enrollment.section !== session.subjectOfferingId.section) {
      throw new error.FORBIDDENERROR(`You are in Section ${enrollment.section}, but this session is for Section ${session.subjectOfferingId.section}.`);
    }

    // 3. Verify Token
    const activeSessionData = getActiveToken(sessionId);
    if (!activeSessionData || (activeSessionData.currentToken !== token && activeSessionData.previousToken !== token)) {
      throw new error.BADREQUESTERROR("Invalid or expired QR token");
    }

    // 4. Verify Distance (Haversine)
    let distance = 0;
    let status = "Present";
    let flags = [];

    if (session.classroomId && session.classroomId.location) {
        const classLoc = session.classroomId.location;
        distance = calculateDistance(location.lat, location.lng, classLoc.lat, classLoc.lng);

        if (distance > session.radius) {
          status = "Absent"; // Flagged/Absent logic
          flags.push(`Out of bounds: ${Math.round(distance)}m away (max ${session.radius}m)`);
        }
    }

    // 5. Save Attendance
    try {
      const attendance = await Attendance.create({
        sessionId,
        studentId,
        timestamp: Date.now(),
        scannedToken: token,
        reportedLocation: location,
        distance,
        status,
        remarks: flags.join("; ")
      });

      // 6. Real-time Event to Teacher
      const io = getIO();
      io.to(sessionId).emit("attendance-marked", {
        name: student.fullName,
        enrollmentNo: student.enrollmentNo,
        status,
        distance: Math.round(distance)
      });

      return sendSuccess(res, 201, "Attendance marked successfully", { attendance });
    } catch (err) {
      if (err.code === 11000) {
        throw new error.BADREQUESTERROR("You have already marked attendance for this session");
      }
      throw err;
    }
  }

  // Fetch attendance history for the logged-in student
  async getMyHistory(req, res) {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) throw new error.NOTFOUNDERROR("Student profile not found");

    const history = await Attendance.find({ studentId: student._id })
      .populate({
        path: "sessionId",
        populate: {
          path: "subjectOfferingId",
          populate: { path: "subjectId", select: "name code" }
        }
      })
      .sort({ timestamp: -1 });

    return sendSuccess(res, 200, "Attendance history retrieved", { history });
  }

  // Update existing attendance record status (Teacher override)
  async updateAttendanceStatus(req, res) {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!["Present", "Absent", "Late", "Excused"].includes(status)) {
      throw new error.BADREQUESTERROR("Invalid status");
    }
    if (!reason) {
      throw new error.BADREQUESTERROR("Reason is required when manually updating attendance status.");
    }

    const attendance = await Attendance.findById(id).populate({
        path: "sessionId",
        populate: { path: "subjectOfferingId" }
    });
    if (!attendance) {
      throw new error.NOTFOUNDERROR("Attendance record not found");
    }

    // Verify teacher owns this session
    const faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty || attendance.sessionId.subjectOfferingId.facultyId.toString() !== faculty._id.toString()) {
      throw new error.FORBIDDENERROR("You do not have permission to modify this record");
    }

    const oldStatus = attendance.status;
    
    // Update record
    attendance.status = status;
    attendance.remarks = reason;
    await attendance.save();

    // Log the change
    await AttendanceChangeLog.create({
        attendanceId: attendance._id,
        oldStatus,
        newStatus: status,
        reason,
        changedBy: req.user._id
    });

    return sendSuccess(res, 200, "Attendance updated successfully", { attendance });
  }

  // Manually add an attendance record for a student
  async manualCheckIn(req, res) {
    const { sessionId, enrollmentNo, status, reason } = req.body;

    const session = await Session.findById(sessionId).populate("subjectOfferingId");
    if (!session) {
      throw new error.NOTFOUNDERROR("Session not found");
    }

    const faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty || session.subjectOfferingId.facultyId.toString() !== faculty._id.toString()) {
      throw new error.FORBIDDENERROR("You do not have permission to modify this session");
    }

    // Look up student by enrollmentNo
    const student = await Student.findOne({ enrollmentNo });
    if (!student) {
      throw new error.NOTFOUNDERROR("Student not found with this enrollment number");
    }

    const studentId = student._id;

    // Verify Enrollment
    const enrollment = await Enrollment.findOne({
      studentId,
      semesterId: session.subjectOfferingId.semesterId,
      status: "Active"
    });
    if (!enrollment) {
      throw new error.BADREQUESTERROR("Student is not actively enrolled in this semester.");
    }
    if (enrollment.section !== session.subjectOfferingId.section) {
      throw new error.BADREQUESTERROR(`Student is in Section ${enrollment.section}, but this session is for Section ${session.subjectOfferingId.section}.`);
    }

    // Check if record already exists
    const existing = await Attendance.findOne({ sessionId, studentId });
    if (existing) {
      throw new error.BADREQUESTERROR("Attendance record already exists for this student");
    }

    const attendance = await Attendance.create({
      sessionId,
      studentId,
      timestamp: Date.now(),
      scannedToken: null, // Manual
      reportedLocation: { lat: 0, lng: 0 },
      distance: 0,
      status: status || "Present",
      remarks: reason || "Manually checked in by faculty",
      markedBy: req.user._id
    });

    return sendSuccess(res, 201, "Manual attendance created successfully", { attendance });
  }
}
