import mongoose from "mongoose";

const attendanceChangeLogSchema = new mongoose.Schema({
  attendanceId: { type: mongoose.Schema.Types.ObjectId, ref: "Attendance", required: true },
  oldStatus: { type: String, required: true },
  newStatus: { type: String, required: true },
  reason: { type: String, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default mongoose.model("AttendanceChangeLog", attendanceChangeLogSchema);
