import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { History, CheckCircle, AlertCircle } from "lucide-react";

export default function StudentHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/attendance/my-history");
      setHistory(res.data.data.history);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <History className="text-blue-600" />
            My Attendance History
          </h2>
          <p className="text-gray-500 mt-1">Review your past check-ins and attendance status.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No attendance records found. 
            <br />
            <Link to="/student/scan" className="text-blue-600 hover:underline mt-2 inline-block">Scan a QR code to check in.</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-medium">Subject</th>
                  <th className="px-6 py-4 font-medium">Time Scanned</th>
                  <th className="px-6 py-4 font-medium">Distance</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {record.sessionId?.subjectOfferingId?.subjectId?.name || "Unknown Subject"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {record.sessionId?.subjectOfferingId?.subjectId?.code || "N/A"} • Sec {record.sessionId?.subjectOfferingId?.section || "A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(record.timestamp)}</td>
                    <td className="px-6 py-4 text-gray-600">{Math.round(record.distance)}m</td>
                    <td className="px-6 py-4">
                      {record.status === "Present" && (
                        <span className="inline-flex items-center gap-1 text-green-700 font-medium bg-green-50 px-2.5 py-1 rounded-full text-xs">
                          <CheckCircle size={14} /> Present
                        </span>
                      )}
                      {record.status === "Absent" && (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1 text-red-700 font-medium bg-red-50 px-2.5 py-1 rounded-full text-xs w-max mb-1">
                            <AlertCircle size={14} /> Absent
                          </span>
                          {record.remarks && <span className="text-xs text-gray-500">{record.remarks}</span>}
                        </div>
                      )}
                      {record.status === "Late" && (
                        <span className="inline-flex items-center gap-1 text-orange-700 font-medium bg-orange-50 px-2.5 py-1 rounded-full text-xs w-max mb-1">
                          <AlertCircle size={14} /> Late
                        </span>
                      )}
                      {record.status === "Excused" && (
                        <span className="inline-flex items-center gap-1 text-blue-700 font-medium bg-blue-50 px-2.5 py-1 rounded-full text-xs w-max mb-1">
                          <CheckCircle size={14} /> Excused
                        </span>
                      )}
                      {/* Handle fallback/flagged state if status is something else */}
                      {!["Present", "Absent", "Late", "Excused"].includes(record.status) && (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1 text-orange-700 font-medium bg-orange-50 px-2.5 py-1 rounded-full text-xs w-max mb-1">
                            <AlertCircle size={14} /> {record.status || "Flagged"}
                          </span>
                          {record.remarks && <span className="text-xs text-gray-500">{record.remarks}</span>}
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
    </div>
  );
}
