import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/axios";
import { ArrowLeft, Users, AlertCircle, Clock, Plus, Download } from "lucide-react";
import ManualCheckInModal from "./ManualCheckInModal";

export default function SessionDetailsPage() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [sessionRes, attendanceRes] = await Promise.all([
        api.get(`/sessions/${id}`),
        api.get(`/sessions/${id}/attendance`)
      ]);
      setSession(sessionRes.data.data.session);
      setAttendance(attendanceRes.data.data.attendance);
    } catch (err) {
      setError("Failed to load session details.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (attendanceId, newStatus) => {
    setUpdatingId(attendanceId);
    try {
      await api.patch(`/attendance/${attendanceId}`, { status: newStatus });
      // Update local state
      setAttendance(prev => prev.map(a => 
        a._id === attendanceId ? { ...a, status: newStatus } : a
      ));
    } catch (err) {
      alert("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get(`/sessions/${id}/export`, { responseType: "blob" });
      // Create a Blob from the PDF Stream
      const file = new Blob([res.data], { type: "text/csv" });
      const fileURL = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = fileURL;
      
      // Attempt to extract filename from content-disposition header if available, otherwise fallback
      let fileName = "attendance.csv";
      const disposition = res.headers["content-disposition"];
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) fileName = matches[1].replace(/['"]/g, '');
      }

      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(fileURL);
    } catch (err) {
      alert("Failed to export CSV.");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading details...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  const presentCount = attendance.filter(a => a.status === "Present").length;
  const flaggedCount = attendance.filter(a => a.status === "Flagged").length;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center gap-4">
        <Link to="/teacher/sessions" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{session.courseId?.name}</h2>
          <p className="text-gray-500 text-sm">
            {new Date(session.createdAt).toLocaleDateString("en-US", { dateStyle: "full" })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Total Attendees</p>
            <p className="text-2xl font-bold text-gray-900">{attendance.length}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Successfully Present</p>
            <p className="text-2xl font-bold text-gray-900">{presentCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Flagged Entries</p>
            <p className="text-2xl font-bold text-gray-900">{flaggedCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">Final Roster</h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              <Download size={16} /> Export CSV
            </button>
            <button 
              onClick={() => setIsManualModalOpen(true)}
              className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors font-medium"
            >
              <Plus size={16} /> Add Student
            </button>
          </div>
        </div>
        {attendance.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No attendance records found for this session.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-medium">Student</th>
                  <th className="px-6 py-4 font-medium">Time</th>
                  <th className="px-6 py-4 font-medium">Distance</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendance.map((a) => (
                  <tr key={a._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{a.studentId?.name}</div>
                      <div className="text-xs text-gray-500">{a.studentId?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(a.timestamp)}</td>
                    <td className="px-6 py-4 text-gray-600">{Math.round(a.distance)}m</td>
                    <td className="px-6 py-4">
                      <select 
                        value={a.status}
                        onChange={(e) => handleStatusChange(a._id, e.target.value)}
                        disabled={updatingId === a._id}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full outline-none cursor-pointer border-r-8 border-transparent ${
                          a.status === "Present" ? "bg-green-50 text-green-700" :
                          a.status === "Flagged" ? "bg-orange-50 text-orange-700" :
                          a.status === "Absent" ? "bg-red-50 text-red-700" :
                          "bg-gray-100 text-gray-700"
                        } ${updatingId === a._id ? "opacity-50 cursor-wait" : ""}`}
                      >
                        <option value="Present">Present</option>
                        <option value="Flagged">Flagged</option>
                        <option value="Absent">Absent</option>
                        <option value="Excused">Excused</option>
                      </select>
                      {a.flags && a.flags.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1 max-w-[150px] truncate" title={a.flags.join(", ")}>
                          {a.flags.join(", ")}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <ManualCheckInModal 
        isOpen={isManualModalOpen} 
        onClose={() => setIsManualModalOpen(false)} 
        sessionId={id} 
        onCheckInSuccess={fetchData}
      />
    </div>
  );
}
