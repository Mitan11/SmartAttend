import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on role if they try to access something unauthorized
    if (user.role === "Admin") return <Navigate to="/admin/users" replace />;
    if (user.role === "Teacher") return <Navigate to="/teacher" replace />;
    if (user.role === "Student") return <Navigate to="/student" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
