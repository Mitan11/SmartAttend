import Subject from "../../models/Subject.js";
import SubjectOffering from "../../models/SubjectOffering.js";
import { sendSuccess } from "../../utils/response.js";
import * as error from "../../shared/error/globalError.js";

export default class SubjectController {
  // --- SUBJECTS (Master Catalog) ---
  async getSubjects(req, res) {
    const subjects = await Subject.find();
    return sendSuccess(res, 200, "Subjects retrieved", { subjects });
  }
  async createSubject(req, res) {
    const subject = await Subject.create(req.body);
    return sendSuccess(res, 201, "Subject created", { subject });
  }
  async updateSubject(req, res) {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subject) throw new error.NOTFOUNDERROR("Subject not found");
    return sendSuccess(res, 200, "Subject updated", { subject });
  }
  async deleteSubject(req, res) {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) throw new error.NOTFOUNDERROR("Subject not found");
    return sendSuccess(res, 200, "Subject deleted");
  }

  async bulkDeleteSubjects(req, res) {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) throw new error.BADREQUESTERROR("Invalid IDs array");
    await Subject.deleteMany({ _id: { $in: ids } });
    return sendSuccess(res, 200, "Subjects deleted successfully");
  }

  // --- SUBJECT OFFERINGS ---
  async getOfferings(req, res) {
    const offerings = await SubjectOffering.find()
      .populate("subjectId", "name code")
      .populate("semesterId", "name")
      .populate("facultyId", "fullName employeeId");
    return sendSuccess(res, 200, "Subject offerings retrieved", { offerings });
  }
  async createOffering(req, res) {
    const offering = await SubjectOffering.create(req.body);
    return sendSuccess(res, 201, "Subject offering created", { offering });
  }
  async updateOffering(req, res) {
    const offering = await SubjectOffering.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!offering) throw new error.NOTFOUNDERROR("Subject offering not found");
    return sendSuccess(res, 200, "Subject offering updated", { offering });
  }
  async deleteOffering(req, res) {
    const offering = await SubjectOffering.findByIdAndDelete(req.params.id);
    if (!offering) throw new error.NOTFOUNDERROR("Subject offering not found");
    return sendSuccess(res, 200, "Subject offering deleted");
  }

  async bulkDeleteOfferings(req, res) {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) throw new error.BADREQUESTERROR("Invalid IDs array");
    await SubjectOffering.deleteMany({ _id: { $in: ids } });
    return sendSuccess(res, 200, "Subject offerings deleted successfully");
  }
}
