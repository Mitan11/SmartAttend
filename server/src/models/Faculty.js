import mongoose from "mongoose";

const facultySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  employeeId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
}, { timestamps: true });

export default mongoose.model("Faculty", facultySchema);
