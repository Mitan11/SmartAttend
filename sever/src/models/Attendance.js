import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  timestamp: { type: Date, default: Date.now },
  scannedToken: { type: String, required: true },
  reportedLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  distance: { type: Number, required: true },
  status: { type: String, enum: ["Present", "Flagged"], default: "Present" },
  flags: [{ type: String }]
}, { timestamps: true });

// Crucial: Duplicate-attendance unique constraint
attendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
