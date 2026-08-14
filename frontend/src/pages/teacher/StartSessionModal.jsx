import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Modal from "../../components/Modal";
import { Play } from "lucide-react";

export default function StartSessionModal({ isOpen, onClose, subjectOffering }) {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [formData, setFormData] = useState({ classroomId: "", radius: 50, duration: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [classroomsRes, settingsRes] = await Promise.all([
        api.get("/sessions/classrooms"),
        api.get("/settings")
      ]);
      setClassrooms(classroomsRes.data.data.classrooms);
      setSettings(settingsRes.data.data.setting);
      setFormData(prev => ({ 
        ...prev, 
        radius: settingsRes.data.data.setting.defaultGeofenceRadius 
      }));
    } catch (err) {
      console.error("Error fetching data", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post("/sessions", {
        subjectOfferingId: subjectOffering._id,
        classroomId: formData.classroomId,
        radius: settings?.allowTeacherOverrides ? Number(formData.radius) : settings?.defaultGeofenceRadius,
        duration: Number(formData.duration)
      });
      onClose();
      navigate(`/teacher/sessions/${res.data.data.session._id}/live`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to start session");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Start Session: ${subjectOffering?.subjectId?.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Classroom</label>
          <select
            required
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.classroomId}
            onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
          >
            <option value="">Choose a location...</option>
            {classrooms.map((c) => (
              <option key={c._id} value={c._id}>{c.name} (Cap: {c.capacity})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Radius Threshold (meters)</label>
          <input
            type="number"
            required
            min="10"
            max="1000"
            disabled={settings && !settings.allowTeacherOverrides}
            className={`w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${settings && !settings.allowTeacherOverrides ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
            value={formData.radius}
            onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">
            {settings && !settings.allowTeacherOverrides ? "Radius locked by Administrator." : "Maximum allowed distance for student check-ins."}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Session Duration (minutes)</label>
          <input
            type="number"
            required
            min="1"
            max="180"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">The QR code will stay active for this duration, then automatically close.</p>
        </div>
        <button
          type="submit"
          disabled={isLoading || !formData.classroomId}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6"
        >
          <Play size={18} />
          {isLoading ? "Starting..." : "Start Live Session"}
        </button>
      </form>
    </Modal>
  );
}
