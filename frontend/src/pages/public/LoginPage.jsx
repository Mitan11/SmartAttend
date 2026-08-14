import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Eye, EyeOff, GraduationCap, QrCode, MapPin,
  BarChart3, Shield, Loader2, Sparkles
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const { login }               = useAuth();
  const navigate                = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    let finalEmail = email.trim().toLowerCase();
    if (!finalEmail.includes("@")) finalEmail = `${finalEmail}@smartattend.edu`;
    try {
      const user = await login(finalEmail, password);
      if (user.role === "Admin")        navigate("/admin/users");
      else if (user.role === "Teacher") navigate("/teacher");
      else                              navigate("/student");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <QrCode  size={18} />, title: "QR Attendance",    desc: "Real-time via dynamic QR codes" },
    { icon: <MapPin  size={18} />, title: "Location Verified", desc: "GPS geo-fencing for authenticity" },
    { icon: <BarChart3 size={18} />, title: "Live Analytics",  desc: "Instant reports & insights" },
    { icon: <Shield  size={18} />, title: "Anti-Proxy",        desc: "Dual verification, no buddy punching" },
  ];

  return (
    <div className="min-h-screen flex overflow-hidden">

      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 30%,#4338ca 65%,#6366f1 100%)" }}
      >
        {/* Animated blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle,#818cf8 0%,transparent 70%)", animation: "blobPulse 8s ease-in-out infinite" }} />
          <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle,#a5b4fc 0%,transparent 70%)", animation: "blobPulse 6s ease-in-out infinite 2s" }} />
          <div className="absolute -bottom-20 left-1/4 w-64 h-64 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle,#c7d2fe 0%,transparent 70%)", animation: "blobPulse 10s ease-in-out infinite 4s" }} />
          {/* Dot grid – CSS approach (reliable) */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <GraduationCap className="text-white" size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">SmartAttend</h1>
            <p className="text-indigo-300 text-xs font-medium tracking-widest uppercase">University Platform</p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-5xl font-black text-white leading-tight">
              Attendance
              <br />
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(90deg,#a5b4fc,#e0e7ff)" }}>
                Reimagined.
              </span>
            </h2>
            <p className="mt-4 text-indigo-200 text-lg leading-relaxed max-w-sm">
              Smart, secure and seamless attendance management for the modern campus.
            </p>
          </div>

          {/* Feature tiles */}
          <div className="grid grid-cols-2 gap-3">
            {features.map((f, i) => (
              <div key={i} className="p-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="flex items-center gap-2 mb-1 text-indigo-200">
                  {f.icon}
                  <span className="font-semibold text-sm text-white">{f.title}</span>
                </div>
                <p className="text-indigo-300 text-xs leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-indigo-400 text-sm">© 2025 SmartAttend. All rights reserved.</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#4338ca,#6366f1)" }}>
              <GraduationCap className="text-white" size={22} />
            </div>
            <span className="text-xl font-bold text-gray-900">SmartAttend</span>
          </div>

          {/* Heading */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-black text-gray-900">Welcome back</h2>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg,#4338ca,#6366f1)" }}>
                <Sparkles className="text-white" size={18} />
              </div>
            </div>
            <p className="text-gray-500 text-sm">Sign in with your university credentials to continue.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-center gap-3 bg-red-50 text-red-700 border border-red-100 p-4 rounded-2xl text-sm">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email or Enrollment No.
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 23CS001 or admin@smartattend.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 text-sm transition-all outline-none focus:border-indigo-500 focus:ring-4 focus:bg-white"
                style={{ "--tw-ring-color": "rgba(99,102,241,0.10)" }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 text-sm transition-all outline-none focus:border-indigo-500 focus:ring-4 focus:bg-white"
                  style={{ "--tw-ring-color": "rgba(99,102,241,0.10)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl text-white font-semibold text-sm transition-all duration-200 mt-2 disabled:opacity-70 hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: "linear-gradient(135deg,#4338ca 0%,#6366f1 100%)",
                boxShadow: "0 6px 20px rgba(99,102,241,0.35)",
              }}
            >
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> Signing in…</>
                : "Sign in to SmartAttend"
              }
            </button>
          </form>

          {/* Login Tips */}
          <div className="mt-8 pt-8 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400 font-medium uppercase tracking-widest mb-4">Login tips</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { role: "Student", hint: "Use enrollment no." },
                { role: "Teacher", hint: "Use email address" },
                { role: "Admin",   hint: "Use email address" },
              ].map(r => (
                <div key={r.role} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-bold text-gray-700">{r.role}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blobPulse {
          0%,100% { transform:scale(1);   opacity:0.2; }
          50%      { transform:scale(1.1); opacity:0.3; }
        }
      `}</style>
    </div>
  );
}
