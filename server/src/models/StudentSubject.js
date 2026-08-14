import mongoose from "mongoose";

const studentSubjectSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  subjectOfferingId: { type: mongoose.Schema.Types.ObjectId, ref: "SubjectOffering", required: true },
  status: { type: String, enum: ["Enrolled", "Dropped", "Completed"], default: "Enrolled" },
}, { timestamps: true });

export default mongoose.model("StudentSubject", studentSubjectSchema);
