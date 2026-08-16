import { useState, useEffect } from "react";
import api from "../../api/axios";
import Modal from "../../components/Modal";
import { Plus, Edit2, Trash2 } from "lucide-react";

export default function SubjectOfferingsPage() {
  const [offerings, setOfferings] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [existingSections, setExistingSections] = useState([]); // sections from DB for selected semester
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ subjectId: "", semesterId: "", facultyId: "", section: "" });
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const selectedSemester = semesters.find(s => s._id === formData.semesterId);
  const selectedDepartmentId = selectedSemester?.courseId?.departmentId;

  const filteredFaculties = faculties.filter(f => {
    if (!selectedDepartmentId) return true;
    return f.departmentId?._id === selectedDepartmentId || f.departmentId === selectedDepartmentId;
  });

  useEffect(() => {
    fetchOfferings();
    fetchSubjects();
    fetchSemesters();
    fetchFaculties();
  }, []);

  // Fetch real sections from DB whenever semester changes
  useEffect(() => {
    if (formData.semesterId) {
      fetchSectionsBySemester(formData.semesterId);
    } else {
      setExistingSections([]);
    }
  }, [formData.semesterId]);

  const fetchOfferings = async () => {
    try {
      const res = await api.get("/subjects/offerings");
      setOfferings(res.data.data.offerings);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get("/subjects/master");
      setSubjects(res.data.data.subjects);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSemesters = async () => {
    try {
      const res = await api.get("/academic/semesters");
      setSemesters(res.data.data.semesters);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFaculties = async () => {
    try {
      const res = await api.get("/academic/faculty");
      setFaculties(res.data.data.faculty);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSectionsBySemester = async (semesterId) => {
    try {
      const res = await api.get(`/subjects/offerings/sections?semesterId=${semesterId}`);
      setExistingSections(res.data.data.sections || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/subjects/offerings/${editingId}`, formData);
      } else {
        await api.post("/subjects/offerings", formData);
      }
      setIsModalOpen(false);
      setFormData({ subjectId: "", semesterId: "", facultyId: "", section: "A" });
      setEditingId(null);
      fetchOfferings();
    } catch (err) {
      alert("Error saving subject offering");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure?")) {
      try {
        await api.delete(`/subjects/offerings/${id}`);
        fetchOfferings();
        setSelectedIds(prev => prev.filter(i => i !== id));
      } catch (err) {
        alert("Error deleting subject offering");
      }
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === offerings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(offerings.map(o => o._id));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} subject offerings?`)) {
      try {
        await api.post("/subjects/offerings/bulk-delete", { ids: selectedIds });
        setSelectedIds([]);
        fetchOfferings();
      } catch (err) {
        alert("Error deleting subject offerings");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subject Offerings</h2>
          <p className="text-gray-500 mt-1">Assign faculty to subjects for specific semesters</p>
        </div>
        <button
          onClick={() => {
            setFormData({ subjectId: "", semesterId: "", facultyId: "", section: "" });
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all shadow-md shadow-blue-500/20"
        >
          <Plus size={20} />
          Create Offering
        </button>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex justify-between items-center animate-in fade-in zoom-in-95">
          <span className="text-red-700 font-medium">{selectedIds.length} offerings selected</span>
          <button
            onClick={handleBulkDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} />
            Delete Selected
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="py-4 px-6 w-12">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                  checked={offerings.length > 0 && selectedIds.length === offerings.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Subject</th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Semester</th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Section</th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Faculty</th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {offerings.map((off) => (
              <tr key={off._id} className={`hover:bg-gray-50/50 transition-colors group ${selectedIds.includes(off._id) ? 'bg-blue-50/30' : ''}`}>
                <td className="py-4 px-6">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                    checked={selectedIds.includes(off._id)}
                    onChange={() => toggleSelection(off._id)}
                  />
                </td>
                <td className="py-4 px-6 text-gray-900 font-medium">
                  {off.subjectId?.name} <span className="text-gray-500 text-sm">({off.subjectId?.code})</span>
                </td>
                <td className="py-4 px-6 text-gray-500">{off.semesterId?.name || "-"}</td>
                <td className="py-4 px-6 text-gray-500 font-medium">Sec {off.section || "A"}</td>
                <td className="py-4 px-6 text-gray-500">{off.facultyId?.fullName || "-"}</td>
                <td className="py-4 px-6 text-right">
                  <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setFormData({
                          subjectId: off.subjectId?._id || "",
                          semesterId: off.semesterId?._id || "",
                          facultyId: off.facultyId?._id || "",
                          section: off.section || "A"
                        });
                        setEditingId(off._id);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(off._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {offerings.length === 0 && (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500">
                  No subject offerings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Offering" : "New Offering"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
            >
              <option value="">Select Subject...</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
            <select
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.semesterId}
              onChange={(e) => setFormData({ ...formData, semesterId: e.target.value })}
            >
              <option value="">Select Semester...</option>
              {semesters.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.courseId?.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Section
              {formData.semesterId && existingSections.length > 0 && (
                <span className="ml-2 text-xs text-blue-500 font-normal">
                  {existingSections.length} existing in this semester
                </span>
              )}
            </label>
            <input
              type="text"
              required
              list="section-options"
              autoComplete="off"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={
                formData.semesterId
                  ? existingSections.length > 0
                    ? `Existing: ${existingSections.join(", ")} — or type new`
                    : "Type section name (e.g. A, Full Stack…)"
                  : "Select a semester first"
              }
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
            />
            <datalist id="section-options">
              {existingSections.map((sec) => (
                <option key={sec} value={sec} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
            <select
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.facultyId}
              onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
              disabled={!formData.semesterId}
            >
              <option value="">
                {formData.semesterId ? "Select Faculty..." : "Select Semester first..."}
              </option>
              {filteredFaculties.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.fullName} {f.departmentId?.name ? `(${f.departmentId.name})` : ""}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors mt-6">
            {editingId ? "Save Changes" : "Create Offering"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
