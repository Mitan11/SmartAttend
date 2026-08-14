import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  semesterId: { type: mongoose.Schema.Types.ObjectId, ref: "Semester", required: true },
  section: { type: String, default: "A", required: true },
  status: { type: String, enum: ["Active", "Dropped", "Completed"], default: "Active" }
}, { timestamps: true });

// Ensure a student can only enroll in a semester once
enrollmentSchema.index({ studentId: 1, semesterId: 1 }, { unique: true });

export default mongoose.model("Enrollment", enrollmentSchema);
