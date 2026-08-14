import { useState, useEffect } from "react";
import api from "../../api/axios";
import Modal from "../../components/Modal";
import { Plus, Edit2, Trash2 } from "lucide-react";

export default function SemestersPage() {
  const [semesters, setSemesters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", courseId: "", academicYearId: "" });
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchSemesters();
    fetchCourses();
    fetchAcademicYears();
  }, []);

  const fetchSemesters = async () => {
    try {
      const res = await api.get("/academic/semesters");
      setSemesters(res.data.data.semesters);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get("/academic/courses");
      setCourses(res.data.data.courses);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const res = await api.get("/academic/years");
      setAcademicYears(res.data.data.years);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/academic/semesters/${editingId}`, formData);
      } else {
        await api.post("/academic/semesters", formData);
      }
      setIsModalOpen(false);
      setFormData({ name: "", courseId: "", academicYearId: "" });
      setEditingId(null);
      fetchSemesters();
    } catch (err) {
      alert("Error saving semester");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure?")) {
      try {
        await api.delete(`/academic/semesters/${id}`);
        fetchSemesters();
        setSelectedIds(prev => prev.filter(i => i !== id));
      } catch (err) {
        alert("Error deleting semester");
      }
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === semesters.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(semesters.map(s => s._id));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} semesters?`)) {
      try {
        await api.post("/academic/semesters/bulk-delete", { ids: selectedIds });
        setSelectedIds([]);
        fetchSemesters();
      } catch (err) {
        alert("Error deleting semesters");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Semesters</h2>
          <p className="text-gray-500 mt-1">Manage terms within courses</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: "", courseId: "", academicYearId: "" });
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all shadow-md shadow-blue-500/20"
        >
          <Plus size={20} />
          Add Semester
        </button>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex justify-between items-center animate-in fade-in zoom-in-95">
          <span className="text-red-700 font-medium">{selectedIds.length} semesters selected</span>
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
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="py-4 px-6 w-12">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                  checked={semesters.length > 0 && selectedIds.length === semesters.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Name</th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Program</th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Academic Year</th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {semesters.map((sem) => (
              <tr key={sem._id} className={`hover:bg-gray-50/50 transition-colors group ${selectedIds.includes(sem._id) ? 'bg-blue-50/30' : ''}`}>
                <td className="py-4 px-6">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                    checked={selectedIds.includes(sem._id)}
                    onChange={() => toggleSelection(sem._id)}
                  />
                </td>
                <td className="py-4 px-6 text-gray-900 font-medium">{sem.name}</td>
                <td className="py-4 px-6 text-gray-500">{sem.courseId?.name || "-"}</td>
                <td className="py-4 px-6 text-gray-500">{sem.academicYearId?.year || "-"}</td>
                <td className="py-4 px-6 text-right">
                  <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setFormData({ 
                          name: sem.name, 
                          courseId: sem.courseId?._id || "", 
                          academicYearId: sem.academicYearId?._id || "" 
                        });
                        setEditingId(sem._id);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(sem._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {semesters.length === 0 && (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-500">
                  No semesters found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Semester" : "New Semester"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name (e.g., Sem 1)</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
            <select
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.courseId}
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
            >
              <option value="">Select Program...</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.academicYearId}
              onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
            >
              <option value="">Select Year...</option>
              {academicYears.map((y) => (
                <option key={y._id} value={y._id}>{y.year}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors mt-6">
            {editingId ? "Save Changes" : "Create Semester"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
