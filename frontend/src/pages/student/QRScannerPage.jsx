import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { MapPin, CheckCircle, XCircle } from "lucide-react";
import api from "../../api/axios";

export default function QRScannerPage() {
  const [deviceId, setDeviceId] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState("scanning"); // scanning, processing, success, error
  const [message, setMessage] = useState("");
  const scannerRef = useRef(null);

  useEffect(() => {
    // 1. Initialize Device Fingerprint
    let id = localStorage.getItem("smartAttend_deviceId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("smartAttend_deviceId", id);
    }
    setDeviceId(id);

    // 2. Initialize Scanner
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scannerRef.current.render(onScanSuccess, onScanFailure);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      }
    };
  }, []);

  const onScanFailure = (error) => {
    // handle scan failure, usually better to ignore and keep scanning
  };

  const onScanSuccess = async (decodedText) => {
    if (status !== "scanning") return;

    try {
      // Pause scanner
      if (scannerRef.current) {
        scannerRef.current.clear();
      }

      setStatus("processing");
      setMessage("Acquiring GPS location...");
      
      const payload = JSON.parse(decodedText);
      if (!payload.sessionId || !payload.token) {
        throw new Error("Invalid QR Code format");
      }

      // Get Location
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setMessage("Verifying token and location...");
          
          try {
            const currentDeviceId = localStorage.getItem("smartAttend_deviceId");
            const res = await api.post("/attendance/mark", {
              sessionId: payload.sessionId,
              token: payload.token,
              location: { lat: latitude, lng: longitude },
              deviceId: currentDeviceId
            });
            
            setStatus("success");
            setMessage("Attendance marked successfully!");
          } catch (err) {
            setStatus("error");
            setMessage(err.response?.data?.message || "Verification failed");
          }
        },
        (geoError) => {
          setStatus("error");
          setMessage("Failed to acquire GPS location. Please ensure location permissions are granted.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

    } catch (err) {
      setStatus("error");
      setMessage("Invalid QR Code. Please try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Mark Attendance</h2>
        <p className="text-gray-500 mt-2 text-sm flex items-center justify-center gap-1">
          <MapPin size={16} /> GPS verification active
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
        {status === "scanning" && (
          <div className="flex-1 flex flex-col">
            <div id="qr-reader" className="w-full rounded-xl overflow-hidden border-2 border-gray-100" />
            <p className="text-center text-sm text-gray-500 mt-4">Point your camera at the Teacher's screen</p>
          </div>
        )}

        {status === "processing" && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            <p className="text-lg font-medium text-gray-900">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-center">
            <CheckCircle size={80} className="text-green-500" />
            <h3 className="text-xl font-bold text-gray-900">Success!</h3>
            <p className="text-gray-600">{message}</p>
            <button 
              onClick={() => window.location.href = '/student'}
              className="mt-6 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-center">
            <XCircle size={80} className="text-red-500" />
            <h3 className="text-xl font-bold text-gray-900">Failed</h3>
            <p className="text-red-600 font-medium">{message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
