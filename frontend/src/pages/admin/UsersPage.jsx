import { useState, useEffect } from "react";
import api from "../../api/axios";
import Modal from "../../components/Modal";
import { Plus, Edit2, Trash2 } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "Student", departmentId: "", enrollmentNo: "", semesterId: "", section: "" });
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [sectionFilter, setSectionFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const tabs = ["All", "Admin", "Teacher", "Student"];

  const filteredUsers = users.filter((u) => {
    const matchesTab = activeTab === "All" || u.role === activeTab;
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === "All" || u.departmentId?._id === deptFilter;
    const matchesSection = !sectionFilter || (u.section && u.section.toLowerCase() === sectionFilter.toLowerCase());
    return matchesTab && matchesSearch && matchesDept && matchesSection;
  });

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchSemesters();
  }, []);

  // Clear selections when tab/filters change
  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab, searchQuery, deptFilter, sectionFilter]);

  useEffect(() => {
    if (!editingId) {
      let newEmail = formData.email;
      let newPassword = formData.password;

      if (formData.role === "Teacher" || formData.role === "Admin") {
        if (formData.name) {
          let cleanName = formData.name.toLowerCase();
          cleanName = cleanName.replace(/^(dr\.?|mrs\.?|miss\.?|mr\.?|prof\.?)\s+/i, '');
          cleanName = cleanName.replace(/[^a-z0-9]/g, '');
          if (cleanName) {
            newEmail = `${cleanName}@smartattend.com`;
          }
        }
        // Set default password based on role
        if (!formData.password || formData.password === "teacher123" || formData.password === "admin123") {
           newPassword = formData.role === "Teacher" ? "teacher123" : "admin123";
        }
      } else if (formData.role === "Student") {
        if (formData.enrollmentNo) {
          const enNo = formData.enrollmentNo.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (enNo) {
            newEmail = `${enNo}@smartattend.edu`;
            if (formData.name && enNo.length >= 4) {
               const firstWord = formData.name.trim().split(/\s+/)[0].toUpperCase();
               const last4 = enNo.slice(-4);
               newPassword = `${firstWord}@${last4}`;
            }
          }
        }
      }

      setFormData(prev => ({ ...prev, email: newEmail, password: newPassword }));
    }
  }, [formData.name, formData.role, formData.enrollmentNo, editingId]);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data.data.users);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/admin/departments");
      setDepartments(res.data.data.departments);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password; // Don't send empty password if not changing
        await api.put(`/admin/users/${editingId}`, payload);
      } else {
        await api.post("/admin/users", formData);
      }
      setIsModalOpen(false);
      setFormData({ name: "", email: "", password: "", role: "Student", departmentId: "", enrollmentNo: "", semesterId: "", section: "" });
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      alert("Error saving user");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure?")) {
      try {
        await api.delete(`/admin/users/${id}`);
        fetchUsers();
        setSelectedIds(prev => prev.filter(i => i !== id));
      } catch (err) {
        alert("Error deleting user");
      }
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map(u => u._id));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} users?`)) {
      try {
        await api.post("/admin/users/bulk-delete", { ids: selectedIds });
        setSelectedIds([]);
        fetchUsers();
      } catch (err) {
        alert("Error deleting users");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Users</h2>
          <p className="text-gray-500 mt-1">Manage system users and roles</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: "", email: "", password: "", role: "Student", departmentId: "", enrollmentNo: "", semesterId: "", section: "" });
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all shadow-md shadow-blue-500/20"
        >
          <Plus size={20} />
          Add User
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="w-64 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="All">All Departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>{d.name}</option>
          ))}
        </select>
        {activeTab === "Student" && (
          <input
            type="text"
            placeholder="Filter Section (e.g. A)"
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="w-48 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex justify-between items-center animate-in fade-in zoom-in-95">
          <span className="text-red-700 font-medium">{selectedIds.length} users selected</span>
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
                  checked={filteredUsers.length > 0 && selectedIds.length === filteredUsers.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Name</th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Email</th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Role</th>
              {activeTab === "Student" && <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Sem / Sec</th>}
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Department</th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Status</th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <tr key={user._id} className={`hover:bg-gray-50/50 transition-colors group ${selectedIds.includes(user._id) ? 'bg-blue-50/30' : ''}`}>
                <td className="py-4 px-6">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                    checked={selectedIds.includes(user._id)}
                    onChange={() => toggleSelection(user._id)}
                  />
                </td>
                <td className="py-4 px-6 text-gray-900 font-medium">{user.name}</td>
                <td className="py-4 px-6 text-gray-500">{user.email}</td>
                <td className="py-4 px-6">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'Teacher' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                {activeTab === "Student" && (
                  <td className="py-4 px-6 text-gray-500">
                    {user.semester ? `${user.semester} • Sec ${user.section || "A"}` : "-"}
                  </td>
                )}
                <td className="py-4 px-6 text-gray-500">{user.departmentId?.name || "-"}</td>
                <td className="py-4 px-6">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setFormData({ 
                          name: user.name, 
                          email: user.email, 
                          password: "", 
                          role: user.role, 
                          departmentId: user.departmentId?._id || "",
                          status: user.status,
                          enrollmentNo: user.enrollmentNo || "",
                          semesterId: user.semesterId || "",
                          section: user.section || ""
                        });
                        setEditingId(user._id);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(user._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit User" : "New User"}>
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
          {formData.role === "Student" && !editingId ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment No (Used as Username)</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.enrollmentNo}
                onChange={(e) => setFormData({ ...formData, enrollmentNo: e.target.value })}
              />
            </div>
          ) : null}
          {formData.role === "Student" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <select
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <input
                  type="text"
                  placeholder="e.g. A"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                />
              </div>
            </div>
          )}
          {(formData.role !== "Student" || editingId) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                disabled={!editingId && (formData.role === "Teacher" || formData.role === "Admin" || formData.role === "Student")}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {editingId && "(Leave blank to keep unchanged)"}
            </label>
            <input
              type="password"
              required={!editingId}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="Student">Student</option>
                <option value="Teacher">Teacher</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              >
                <option value="">Select Dept...</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors mt-6">
            {editingId ? "Save Changes" : "Create User"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
