import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
  startTime: { type: Date, required: true, default: Date.now },
  endTime: { type: Date },
  status: { type: String, enum: ["Active", "Closed"], default: "Active" },
  radius: { type: Number, default: 50 }
}, { timestamps: true });

export default mongoose.model("Session", sessionSchema);
