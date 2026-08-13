import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Public Pages
import LoginPage from "./pages/public/LoginPage";
import RegisterPage from "./pages/public/RegisterPage";

// Admin
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersPage from "./pages/admin/UsersPage";
import DepartmentsPage from "./pages/admin/DepartmentsPage";
import CoursesPage from "./pages/admin/CoursesPage";
import ClassroomsPage from "./pages/admin/ClassroomsPage";
import SettingsPage from "./pages/admin/SettingsPage";

// Teacher
import TeacherLayout from "./layouts/TeacherLayout";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import LiveSessionPage from "./pages/teacher/LiveSessionPage";
import SessionsPage from "./pages/teacher/SessionsPage";
import SessionDetailsPage from "./pages/teacher/SessionDetailsPage";

// Student
import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import QRScannerPage from "./pages/student/QRScannerPage";
import StudentHistoryPage from "./pages/student/StudentHistoryPage";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect root to appropriate dashboard if logged in, else login
  const getRootRedirect = () => {
    if (!user) return "/login";
    if (user.role === "Admin") return "/admin";
    if (user.role === "Teacher") return "/teacher";
    return "/student";
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to={getRootRedirect()} replace />} />
      
      {/* Public Routes */}
      <Route path="/login" element={user ? <Navigate to={getRootRedirect()} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={getRootRedirect()} replace /> : <RegisterPage />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={["Admin"]} />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="classrooms" element={<ClassroomsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Teacher Routes */}
      <Route path="/teacher" element={<ProtectedRoute allowedRoles={["Teacher"]} />}>
        <Route element={<TeacherLayout />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="sessions/:id" element={<SessionDetailsPage />} />
          <Route path="sessions/:id/live" element={<LiveSessionPage />} />
        </Route>
      </Route>

      {/* Student Routes */}
      <Route path="/student" element={<ProtectedRoute allowedRoles={["Student"]} />}>
        <Route element={<StudentLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="scan" element={<QRScannerPage />} />
          <Route path="history" element={<StudentHistoryPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
