import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true }
}, { timestamps: true });

export default mongoose.model("Course", courseSchema);
