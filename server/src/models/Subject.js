import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // e.g., "CS501"
  name: { type: String, required: true }, // e.g., "Database Management"
  credits: { type: Number, required: true },
  type: { type: String, enum: ["Compulsory", "Elective"], default: "Compulsory" },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
}, { timestamps: true });

export default mongoose.model("Subject", subjectSchema);
