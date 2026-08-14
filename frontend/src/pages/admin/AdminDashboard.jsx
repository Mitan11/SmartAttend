import { useState, useEffect } from "react";
import { Users, GraduationCap, PlayCircle, Archive, CheckCircle, AlertTriangle } from "lucide-react";
import api from "../../api/axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

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

  const pieData = [
    { name: 'Present', value: analytics.attendance.present },
    { name: 'Flagged', value: analytics.attendance.flagged },
  ];
  const PIE_COLORS = ['#22c55e', '#f97316'];

  // Format trend dates for display (e.g., "Aug 14")
  const trendData = analytics.trend?.map(item => {
    const d = new Date(item.date);
    return {
      ...item,
      displayDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    };
  }) || [];

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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">

        {/* Line Chart: 7-Day Trend */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-6">7-Day Attendance Trend</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="displayDate"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#e5e7eb', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="checkIns"
                  name="Check-ins"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Status Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Attendance Health</h3>
          <div className="h-72 w-full flex items-center justify-center">
            {analytics.attendance.present === 0 && analytics.attendance.flagged === 0 ? (
              <div className="text-gray-400 text-sm">No attendance data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
    </div>
  );
}
