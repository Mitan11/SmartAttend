import mongoose from "mongoose";

const academicYearSchema = new mongoose.Schema({
  year: { type: String, required: true, unique: true }, // e.g., "2026-27"
}, { timestamps: true });

export default mongoose.model("AcademicYear", academicYearSchema);
