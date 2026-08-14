import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/axios";
import { ArrowLeft, Download, FileSpreadsheet, Users, GraduationCap } from "lucide-react";

export default function SubjectReportPage() {
  const { id } = useParams();
  const [report, setReport] = useState([]);
  const [offering, setOffering] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const res = await api.get(`/sessions/offering/${id}/report`);
      setReport(res.data.data.report);
      setOffering(res.data.data.offering);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (report.length === 0) return;

    const headers = ["Enrollment No", "Student Name", "Total Sessions", "Present", "Absent", "Excused", "Flagged", "Percentage"];
    const rows = report.map(r => [
      `"${r.student.enrollmentNo}"`,
      `"${r.student.fullName}"`,
      r.stats.totalSessions,
      r.stats.present,
      r.stats.absent,
      r.stats.excused,
      r.stats.flagged,
      `"${r.stats.percentage}%"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const subjectCode = offering?.subjectId?.code || "REPORT";
    link.setAttribute("download", `Master_Attendance_${subjectCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!offering) return <div className="text-gray-500">Failed to load report.</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <Link to="/teacher" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{offering.subjectId?.name}</h2>
            <div className="flex items-center gap-2 mt-1 text-sm font-medium text-gray-500">
              <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">{offering.subjectId?.code}</span>
              <span>•</span>
              <span>Semester Master Report</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          <FileSpreadsheet size={18} />
          Export to CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Students</p>
            <p className="text-2xl font-bold text-gray-900">{report.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Avg Attendance</p>
            <p className="text-2xl font-bold text-gray-900">
              {report.length > 0 ? Math.round(report.reduce((acc, r) => acc + r.stats.percentage, 0) / report.length) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {report.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No students enrolled in this semester.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-medium">Student</th>
                  <th className="px-6 py-4 font-medium text-center">Classes Attended</th>
                  <th className="px-6 py-4 font-medium">Attendance %</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.map((row) => (
                  <tr key={row.student._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{row.student.fullName}</div>
                      <div className="text-xs text-gray-500">{row.student.enrollmentNo}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-gray-700">{row.stats.present}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-gray-500">{row.stats.totalSessions}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`font-semibold ${row.stats.percentage < 75 ? "text-red-600" : "text-gray-700"}`}>
                          {row.stats.percentage}%
                        </span>
                        <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${row.stats.percentage < 75 ? "bg-red-500" : "bg-green-500"}`} 
                            style={{ width: `${row.stats.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {row.stats.percentage >= 75 ? (
                        <span className="text-green-700 bg-green-50 px-2.5 py-1 rounded-full text-xs font-medium">Good Standing</span>
                      ) : (
                        <span className="text-red-700 bg-red-50 px-2.5 py-1 rounded-full text-xs font-medium">At Risk</span>
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
