import mongoose from "mongoose";

const subjectOfferingSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  semesterId: { type: mongoose.Schema.Types.ObjectId, ref: "Semester", required: true },
  section: { type: String, default: "A", required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
  status: { type: String, enum: ["Active", "Completed", "Cancelled"], default: "Active" },
}, { timestamps: true });

export default mongoose.model("SubjectOffering", subjectOfferingSchema);
