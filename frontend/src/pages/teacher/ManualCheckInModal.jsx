import { useState } from "react";
import api from "../../api/axios";
import Modal from "../../components/Modal";

export default function ManualCheckInModal({ isOpen, onClose, sessionId, onCheckInSuccess }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("Present");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/attendance/manual", {
        sessionId,
        email,
        status
      });
      onCheckInSuccess();
      onClose();
      setEmail("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add manual record.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manual Check-In">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Student Email</label>
          <input
            type="email"
            required
            placeholder="student@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Excused">Excused</option>
            <option value="Flagged">Flagged</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2.5 rounded-lg transition-colors mt-6"
        >
          {loading ? "Adding..." : "Add Record"}
        </button>
      </form>
    </Modal>
  );
}
