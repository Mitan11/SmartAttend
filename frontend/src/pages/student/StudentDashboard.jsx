import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { QrCode, Clock, MapPin, CheckCircle, AlertCircle } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [recentHistory, setRecentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/attendance/my-history");
      // Grab only the top 3 most recent entries
      setRecentHistory(res.data.data.history.slice(0, 3));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back, {user?.name?.split(" ")[0]}!</h2>
        <p className="text-gray-500 mt-1">Ready for your classes today?</p>
      </div>

      {/* Hero Scan Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-blue-900/10 group">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity duration-700"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-lg">
            <h3 className="text-2xl sm:text-3xl font-bold">Mark Your Attendance</h3>
            <p className="text-blue-100 text-lg">
              Point your camera at the teacher's screen to securely log your attendance using dynamic QR and Geolocation.
            </p>
          </div>
          <Link
            to="/student/scan"
            className="flex-shrink-0 relative inline-flex items-center justify-center gap-3 bg-white text-blue-700 hover:text-blue-800 font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <span className="absolute inset-0 w-full h-full rounded-2xl animate-ping opacity-20 bg-white"></span>
            <QrCode size={24} />
            <span className="text-lg">Scan Now</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Clock size={18} className="text-gray-400" />
            Recent Activity
          </h3>
          <Link to="/student/history" className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</Link>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded-2xl w-full"></div>
              ))}
            </div>
          ) : recentHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={24} className="text-gray-300" />
              </div>
              <p>No recent check-ins found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentHistory.map((record) => (
                <div key={record._id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-inner ${
                      record.status === "Present" ? "bg-green-100 text-green-600" :
                      record.status === "Flagged" ? "bg-orange-100 text-orange-600" :
                      "bg-red-100 text-red-600"
                    }`}>
                      {record.status === "Present" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        {record.sessionId?.subjectOfferingId?.subjectId?.name || "Unknown Subject"}
                        <span className="text-gray-500 font-normal ml-2 text-sm">
                          (Sec {record.sessionId?.subjectOfferingId?.section || "A"})
                        </span>
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={14} />
                        {Math.round(record.distance)}m away
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      record.status === "Present" ? "text-green-600" :
                      record.status === "Flagged" ? "text-orange-600" :
                      "text-red-600"
                    }`}>{record.status}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(record.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
