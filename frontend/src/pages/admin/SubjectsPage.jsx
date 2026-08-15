import { useState, useEffect } from "react";
import api from "../../api/axios";
import Modal from "../../components/Modal";
import { Plus, Edit2, Trash2 } from "lucide-react";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", code: "", credits: "" });
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await api.get("/subjects/master");
      setSubjects(res.data.data.subjects);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, credits: Number(formData.credits) };
      if (editingId) {
        await api.put(`/subjects/master/${editingId}`, payload);
      } else {
        await api.post("/subjects/master", payload);
      }
      setIsModalOpen(false);
      setFormData({ name: "", code: "", credits: "" });
      setEditingId(null);
      fetchSubjects();
    } catch (err) {
      alert("Error saving subject");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure?")) {
      try {
        await api.delete(`/subjects/master/${id}`);
        fetchSubjects();
        setSelectedIds(prev => prev.filter(i => i !== id));
      } catch (err) {
        alert("Error deleting subject");
      }
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === subjects.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(subjects.map(s => s._id));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} subjects?`)) {
      try {
        await api.post("/subjects/master/bulk-delete", { ids: selectedIds });
        setSelectedIds([]);
        fetchSubjects();
      } catch (err) {
        alert("Error deleting subjects");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subjects</h2>
          <p className="text-gray-500 mt-1">Manage master subject catalog</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: "", code: "", credits: "" });
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all shadow-md shadow-blue-500/20"
        >
          <Plus size={20} />
          Add Subject
        </button>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex justify-between items-center animate-in fade-in zoom-in-95">
          <span className="text-red-700 font-medium">{selectedIds.length} subjects selected</span>
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
                  checked={subjects.length > 0 && selectedIds.length === subjects.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Subject Name</th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Code</th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Credits</th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subjects.map((sub) => (
              <tr key={sub._id} className={`hover:bg-gray-50/50 transition-colors group ${selectedIds.includes(sub._id) ? 'bg-blue-50/30' : ''}`}>
                <td className="py-4 px-6">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                    checked={selectedIds.includes(sub._id)}
                    onChange={() => toggleSelection(sub._id)}
                  />
                </td>
                <td className="py-4 px-6 text-gray-900 font-medium">{sub.name}</td>
                <td className="py-4 px-6 text-gray-500">
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                    {sub.code}
                  </span>
                </td>
                <td className="py-4 px-6 text-gray-500">{sub.credits || "-"}</td>
                <td className="py-4 px-6 text-right">
                  <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setFormData({ 
                          name: sub.name, 
                          code: sub.code, 
                          credits: sub.credits || "" 
                        });
                        setEditingId(sub._id);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(sub._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {subjects.length === 0 && (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-500">
                  No subjects found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Subject" : "New Subject"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
              <input
                type="number"
                required
                min="1"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors mt-6">
            {editingId ? "Save Changes" : "Create Subject"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
