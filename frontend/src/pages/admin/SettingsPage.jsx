import { useState, useEffect } from "react";
import api from "../../api/axios";
import { Settings, Save, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    defaultGeofenceRadius: 50,
    qrRotationInterval: 15,
    allowTeacherOverrides: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get("/settings");
      if (res.data?.data?.setting) {
        setSettings(res.data.data.setting);
      }
    } catch (err) {
      setMessage({ text: "Failed to load settings.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });
    try {
      await api.patch("/settings", settings);
      setMessage({ text: "Settings saved successfully!", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      setMessage({ text: "Failed to save settings.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : Number(value)
    }));
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="text-blue-600" />
            Global Settings
          </h2>
          <p className="text-gray-500 mt-1">Configure systemic thresholds and defaults for the platform.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-2xl">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {message.text && (
            <div className={`p-4 rounded-xl flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <AlertCircle size={20} />
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Default Geofence Radius (meters)
              </label>
              <p className="text-sm text-gray-500 mb-3">The maximum allowable distance a student can be from the classroom.</p>
              <input 
                type="range" 
                name="defaultGeofenceRadius"
                min="10" 
                max="500" 
                step="10"
                value={settings.defaultGeofenceRadius}
                onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="mt-2 font-medium text-blue-600">{settings.defaultGeofenceRadius} m</div>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                QR Rotation Interval (seconds)
              </label>
              <p className="text-sm text-gray-500 mb-3">How frequently the cryptographic QR token refreshes during a live session.</p>
              <input 
                type="range" 
                name="qrRotationInterval"
                min="5" 
                max="60" 
                step="5"
                value={settings.qrRotationInterval}
                onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="mt-2 font-medium text-blue-600">{settings.qrRotationInterval} s</div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Allow Teacher Overrides
                </label>
                <p className="text-sm text-gray-500">Allow teachers to set custom radiuses when creating sessions.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="allowTeacherOverrides"
                  checked={settings.allowTeacherOverrides} 
                  onChange={handleChange}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={saving}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-70 transition-all shadow-sm hover:shadow-md"
            >
              <Save size={20} />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
