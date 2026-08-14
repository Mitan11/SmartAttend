import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  subjectOfferingId: { type: mongoose.Schema.Types.ObjectId, ref: "SubjectOffering", required: true },
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
  startTime: { type: Date, required: true, default: Date.now },
  endTime: { type: Date },
  status: { type: String, enum: ["Created", "Active", "Completed", "Locked"], default: "Created" },
  radius: { type: Number, default: 50 }
}, { timestamps: true });

export default mongoose.model("Session", sessionSchema);
