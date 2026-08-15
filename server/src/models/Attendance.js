import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  timestamp: { type: Date, default: Date.now },
  scannedToken: { type: String }, // Optional for manual check-ins
  reportedLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  distance: { type: Number },
  status: { type: String, enum: ["Present", "Absent", "Late", "Excused", "Flagged"], default: "Present" },
  remarks: { type: String },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // Null if scanned via QR
}, { timestamps: true });

// Crucial: Duplicate-attendance unique constraint
attendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
