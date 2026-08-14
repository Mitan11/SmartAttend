import { useState, useEffect } from "react";
import api from "../../api/axios";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, CheckCircle, AlertCircle, XCircle, Info } from "lucide-react";
import Modal from "../../components/Modal";

export default function StudentCalendarPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Calendar Logic
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Group history by local date string (YYYY-MM-DD)
  const historyByDate = history.reduce((acc, record) => {
    const d = new Date(record.timestamp);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(record);
    return acc;
  }, {});

  const handleDayClick = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const records = historyByDate[dateStr] || [];
    if (records.length > 0) {
      setSelectedDate({ day, dateStr, records });
      setIsModalOpen(true);
    }
  };

  const renderGrid = () => {
    const grid = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      grid.push(<div key={`empty-${i}`} className="bg-gray-50/50 p-2 min-h-[100px] border border-gray-100 rounded-xl opacity-50"></div>);
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const records = historyByDate[dateStr] || [];
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      const hasRecords = records.length > 0;

      grid.push(
        <div 
          key={day} 
          onClick={() => handleDayClick(day)}
          className={`p-3 min-h-[100px] border rounded-xl flex flex-col transition-all duration-300 ${
            hasRecords 
              ? "cursor-pointer hover:shadow-md hover:-translate-y-1 bg-white border-blue-100" 
              : "bg-white border-gray-100"
          } ${isToday ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
        >
          <div className={`text-sm font-semibold mb-2 ${isToday ? "text-blue-600" : "text-gray-700"}`}>
            {day}
          </div>
          
          {hasRecords && (
            <div className="mt-auto space-y-1.5">
              {records.length > 1 ? (
                <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  {records.length} Sessions
                </div>
              ) : (
                records.map((r, idx) => (
                  <div key={idx} className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium truncate ${
                    r.status === "Present" ? "bg-green-50 text-green-700" :
                    r.status === "Flagged" ? "bg-orange-50 text-orange-700" :
                    "bg-red-50 text-red-700"
                  }`}>
                    {r.status === "Present" && <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>}
                    {r.status === "Flagged" && <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>}
                    {(r.status === "Absent" || r.status === "Excused") && <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>}
                    <span className="truncate">{r.sessionId?.subjectOfferingId?.subjectId?.code || r.status}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      );
    }
    return grid;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="text-blue-600" />
            Attendance Calendar
          </h2>
          <p className="text-gray-500 mt-1">Visualize your attendance history.</p>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-gray-900">
            {monthNames[month]} {year}
          </h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={prevMonth}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 transition-colors text-sm"
            >
              Today
            </button>
            <button 
              onClick={nextMonth}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-4 mb-4">
          {dayNames.map(day => (
            <div key={day} className="text-center font-semibold text-gray-400 text-sm tracking-wider uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="h-64 flex items-center justify-center text-gray-500">Loading calendar...</div>
        ) : (
          <div className="grid grid-cols-7 gap-4">
            {renderGrid()}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Activity on ${selectedDate?.dateStr}`}>
        <div className="space-y-4">
          {selectedDate?.records.map((record, idx) => (
            <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-gray-900 text-lg">
                  {record.sessionId?.subjectOfferingId?.subjectId?.name || "Unknown Subject"}
                </h4>
                <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {new Date(record.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {Math.round(record.distance)}m
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:items-end gap-1">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold w-max ${
                  record.status === "Present" ? "bg-green-100 text-green-700" :
                  record.status === "Flagged" ? "bg-orange-100 text-orange-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {record.status === "Present" && <CheckCircle size={16} />}
                  {record.status === "Flagged" && <AlertCircle size={16} />}
                  {(record.status === "Absent" || record.status === "Excused") && <XCircle size={16} />}
                  {record.status}
                </span>
                {record.remarks && record.remarks.length > 0 && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Info size={12} />
                    {record.remarks}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
