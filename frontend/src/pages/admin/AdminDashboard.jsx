import { useState, useEffect } from "react";
import { Users, GraduationCap, PlayCircle, Archive, CheckCircle, AlertTriangle } from "lucide-react";
import api from "../../api/axios";

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get("/admin/analytics");
      setAnalytics(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) return <div className="text-gray-500 p-8">Failed to load analytics.</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Platform Overview</h2>
        <p className="text-gray-500 mt-1">High-level telemetry across the SmartAttend platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* User Stats */}
        <StatCard 
          title="Total Students" 
          value={analytics.users.students} 
          icon={<GraduationCap size={24} />} 
          color="bg-blue-50 text-blue-600" 
        />
        <StatCard 
          title="Total Teachers" 
          value={analytics.users.teachers} 
          icon={<Users size={24} />} 
          color="bg-indigo-50 text-indigo-600" 
        />
        
        {/* Session Stats */}
        <StatCard 
          title="Active Sessions" 
          value={analytics.sessions.active} 
          icon={<PlayCircle size={24} />} 
          color="bg-emerald-50 text-emerald-600" 
        />
        <StatCard 
          title="Closed Sessions" 
          value={analytics.sessions.closed} 
          icon={<Archive size={24} />} 
          color="bg-gray-100 text-gray-600" 
        />

        {/* Attendance Stats */}
        <StatCard 
          title="Present Records" 
          value={analytics.attendance.present} 
          icon={<CheckCircle size={24} />} 
          color="bg-green-50 text-green-600" 
        />
        <StatCard 
          title="Flagged Anomalies" 
          value={analytics.attendance.flagged} 
          icon={<AlertTriangle size={24} />} 
          color="bg-orange-50 text-orange-600" 
        />

      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
    </div>
  );
}
