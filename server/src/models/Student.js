import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  enrollmentNo: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("Student", studentSchema);
