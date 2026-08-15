import { useState, useEffect } from "react";
import api from "../../api/axios";
import Modal from "../../components/Modal";
import { Plus, Edit2, Trash2, Search } from "lucide-react";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", code: "" });
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/academic/departments");
      setDepartments(res.data.data.departments);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/academic/departments/${editingId}`, formData);
      } else {
        await api.post("/academic/departments", formData);
      }
      setIsModalOpen(false);
      setFormData({ name: "", code: "" });
      setEditingId(null);
      fetchDepartments();
    } catch (err) {
      alert("Error saving department");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure?")) {
      try {
        await api.delete(`/academic/departments/${id}`);
        fetchDepartments();
        setSelectedIds(prev => prev.filter(i => i !== id));
      } catch (err) {
        alert("Error deleting department");
      }
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === departments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(departments.map(d => d._id));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} departments?`)) {
      try {
        await api.post("/admin/departments/bulk-delete", { ids: selectedIds });
        setSelectedIds([]);
        fetchDepartments();
      } catch (err) {
        alert("Error deleting departments");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Departments</h2>
          <p className="text-gray-500 mt-1">Manage academic departments</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: "", code: "" });
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all shadow-md shadow-blue-500/20"
        >
          <Plus size={20} />
          Add Department
        </button>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex justify-between items-center animate-in fade-in zoom-in-95">
          <span className="text-red-700 font-medium">{selectedIds.length} departments selected</span>
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
                  checked={departments.length > 0 && selectedIds.length === departments.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Name</th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Code</th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {departments.map((dept) => (
              <tr key={dept._id} className={`hover:bg-gray-50/50 transition-colors group ${selectedIds.includes(dept._id) ? 'bg-blue-50/30' : ''}`}>
                <td className="py-4 px-6">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                    checked={selectedIds.includes(dept._id)}
                    onChange={() => toggleSelection(dept._id)}
                  />
                </td>
                <td className="py-4 px-6 text-gray-900 font-medium">{dept.name}</td>
                <td className="py-4 px-6 text-gray-500">
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                    {dept.code}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setFormData({ name: dept.name, code: dept.code });
                        setEditingId(dept._id);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(dept._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan="4" className="py-8 text-center text-gray-500">
                  No departments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Department" : "New Department"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors mt-6">
            {editingId ? "Save Changes" : "Create Department"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
