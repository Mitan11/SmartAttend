import { useState, useEffect } from "react";
import api from "../../api/axios";
import Modal from "../../components/Modal";
import { Plus, Edit2, Trash2, LocateFixed } from "lucide-react";

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", capacity: 50, lat: 0, lng: 0 });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const res = await api.get("/admin/classrooms");
      setClassrooms(res.data.data.classrooms);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        capacity: Number(formData.capacity),
        location: { lat: Number(formData.lat), lng: Number(formData.lng) }
      };

      if (editingId) {
        await api.put(`/admin/classrooms/${editingId}`, payload);
      } else {
        await api.post("/admin/classrooms", payload);
      }
      setIsModalOpen(false);
      setFormData({ name: "", capacity: 50, lat: 0, lng: 0 });
      setEditingId(null);
      fetchClassrooms();
    } catch (err) {
      alert("Error saving classroom");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure?")) {
      try {
        await api.delete(`/admin/classrooms/${id}`);
        fetchClassrooms();
      } catch (err) {
        alert("Error deleting classroom");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Classrooms</h2>
          <p className="text-gray-500 mt-1">Manage physical locations and capacities</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: "", capacity: 50, lat: 0, lng: 0 });
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all shadow-md shadow-blue-500/20"
        >
          <Plus size={20} />
          Add Classroom
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Room Name</th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Capacity</th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Location (Lat, Lng)</th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {classrooms.map((room) => (
              <tr key={room._id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="py-4 px-6 text-gray-900 font-medium">{room.name}</td>
                <td className="py-4 px-6 text-gray-500">{room.capacity} seats</td>
                <td className="py-4 px-6 text-gray-500 font-mono text-sm">
                  {room.location.lat.toFixed(6)}, {room.location.lng.toFixed(6)}
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setFormData({ 
                          name: room.name, 
                          capacity: room.capacity, 
                          lat: room.location.lat, 
                          lng: room.location.lng 
                        });
                        setEditingId(room._id);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(room._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {classrooms.length === 0 && (
              <tr>
                <td colSpan="4" className="py-8 text-center text-gray-500">
                  No classrooms found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Classroom" : "New Classroom"}>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input
              type="number"
              required
              min="1"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 relative">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => setFormData({ ...formData, lat: pos.coords.latitude, lng: pos.coords.longitude }),
                  (err) => alert("Could not fetch location. Please enable location services.")
                );
              }
            }}
            className="w-full mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-2 border border-blue-200 bg-blue-50 py-2 rounded-lg transition-colors"
          >
            <LocateFixed size={16} />
            Fetch My Current Location
          </button>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors mt-6">
            {editingId ? "Save Changes" : "Create Classroom"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
