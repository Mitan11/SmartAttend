import { useState, useEffect } from "react";
import api from "../../api/axios";
import Modal from "../../components/Modal";
import { Plus, Edit2, Trash2 } from "lucide-react";

export default function AcademicYearsPage() {
  const [years, setYears] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ year: "" });
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchYears();
  }, []);

  const fetchYears = async () => {
    try {
      const res = await api.get("/academic/years");
      setYears(res.data.data.years);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/academic/years/${editingId}`, formData);
      } else {
        await api.post("/academic/years", formData);
      }
      setIsModalOpen(false);
      setFormData({ year: "" });
      setEditingId(null);
      fetchYears();
    } catch (err) {
      alert("Error saving academic year");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure?")) {
      try {
        await api.delete(`/academic/years/${id}`);
        fetchYears();
        setSelectedIds(prev => prev.filter(i => i !== id));
      } catch (err) {
        alert("Error deleting academic year");
      }
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === years.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(years.map(y => y._id));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} academic years?`)) {
      try {
        await api.post("/academic/years/bulk-delete", { ids: selectedIds });
        setSelectedIds([]);
        fetchYears();
      } catch (err) {
        alert("Error deleting academic years");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Academic Years</h2>
          <p className="text-gray-500 mt-1">Manage cohort academic years</p>
        </div>
        <button
          onClick={() => {
            setFormData({ year: "" });
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all shadow-md shadow-blue-500/20"
        >
          <Plus size={20} />
          Add Year
        </button>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex justify-between items-center animate-in fade-in zoom-in-95">
          <span className="text-red-700 font-medium">{selectedIds.length} academic years selected</span>
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
                  checked={years.length > 0 && selectedIds.length === years.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Year</th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {years.map((year) => (
              <tr key={year._id} className={`hover:bg-gray-50/50 transition-colors group ${selectedIds.includes(year._id) ? 'bg-blue-50/30' : ''}`}>
                <td className="py-4 px-6">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                    checked={selectedIds.includes(year._id)}
                    onChange={() => toggleSelection(year._id)}
                  />
                </td>
                <td className="py-4 px-6 text-gray-900 font-medium">{year.year}</td>
                <td className="py-4 px-6 text-right">
                  <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setFormData({ year: year.year });
                        setEditingId(year._id);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(year._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {years.length === 0 && (
              <tr>
                <td colSpan="3" className="py-8 text-center text-gray-500">
                  No academic years found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Year" : "New Year"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year (e.g., 2026-27)</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors mt-6">
            {editingId ? "Save Changes" : "Create Year"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
