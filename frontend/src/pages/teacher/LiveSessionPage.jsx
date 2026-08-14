import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Users, Clock, AlertTriangle } from "lucide-react";
import api from "../../api/axios";
import io from "socket.io-client";

const SOCKET_URL = "http://localhost:3000";

export default function LiveSessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [qrToken, setQrToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [isEnding, setIsEnding] = useState(false);
  
  // This would eventually hold the real-time list of students who joined
  const [roster, setRoster] = useState([]);

  useEffect(() => {
    // 1. Fetch Session Details
    const fetchSession = async () => {
      try {
        const res = await api.get(`/sessions/${id}`);
        setSession(res.data.data.session);
        if (res.data.data.qrToken) {
          setQrToken(res.data.data.qrToken);
        }
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load session");
        setLoading(false);
      }
    };
    fetchSession();

    // 2. Setup Socket.IO
    const socket = io(SOCKET_URL, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("join-session", id);
    });

    socket.on("token-update", (data) => {
      setQrToken(data.token);
      if (data.durationMs) {
        setTimeLeft(Math.floor(data.durationMs / 1000));
      } else {
        setTimeLeft(60);
      }
    });

    socket.on("attendance-marked", (data) => {
      setRoster((prev) => [data, ...prev]);
    });

    socket.on("session-closed", (data) => {
      alert(data.message || "Session ended.");
      navigate("/teacher");
    });

    // Clean up on unmount
    return () => {
      socket.disconnect();
    };
  }, [id, navigate]);

  useEffect(() => {
    // Countdown timer for UI
    if (!qrToken) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [qrToken]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const handleEndSession = async () => {
    if (!window.confirm("Are you sure you want to end this session?")) return;
    
    setIsEnding(true);
    try {
      await api.patch(`/sessions/${id}/close`);
      navigate("/teacher");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to end session");
      setIsEnding(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div></div>;
  if (error) return <div className="p-8 text-red-500 font-medium text-center">{error}</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      
      {/* QR Code Column */}
      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center min-h-[500px]">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Scan to Mark Attendance</h2>
        <p className="text-gray-500 mb-8">{session?.subjectOfferingId?.subjectId?.name} ({session?.subjectOfferingId?.subjectId?.code})</p>
        
        <div className="relative p-6 bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
          {qrToken ? (
            <QRCodeSVG value={JSON.stringify({ sessionId: id, token: qrToken })} size={300} />
          ) : (
            <div className="w-[300px] h-[300px] bg-gray-50 flex items-center justify-center animate-pulse rounded-xl">
              <span className="text-gray-400 font-medium">Generating Token...</span>
            </div>
          )}
          
          {/* Overlay progress ring or timer could go here */}
        </div>

        <div className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
          <Clock size={16} />
          <span>Session ends in {formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Roster Column */}
      <div className="w-full lg:w-96 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Users size={18} className="text-blue-600" />
            Live Roster
          </h3>
          <p className="text-xs text-gray-500 mt-1">Students will appear here as they scan.</p>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          {roster.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-50">
              <Users size={48} className="text-gray-300" />
              <p className="text-sm font-medium text-gray-500">Waiting for students...</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {roster.map((student, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{student.name}</p>
                    <p className="text-xs text-gray-500">Just now</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-100">
          <button 
            onClick={handleEndSession}
            disabled={isEnding}
            className="w-full py-2.5 px-4 border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
          >
            {isEnding ? "Ending..." : "End Session"}
          </button>
        </div>
      </div>
      
    </div>
  );
}
