import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Semester 1"
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
}, { timestamps: true });

export default mongoose.model("Semester", semesterSchema);
