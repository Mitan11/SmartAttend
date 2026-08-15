import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { LogOut, LayoutDashboard, History, FileText, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function TeacherLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavClick = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-700">Teacher Portal</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto p-1 text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
            {user?.name?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem to="/teacher" end={true} icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={handleNavClick} />
          <NavItem to="/teacher/sessions" icon={<History size={20} />} label="Session History" onClick={handleNavClick} />
          <NavItem to="/teacher/leave-approvals" icon={<FileText size={20} />} label="Leave Approvals" onClick={handleNavClick} />
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 w-full rounded-lg transition-colors text-left"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-8 shadow-sm justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu size={22} />
            </button>
            <div className="text-gray-500 font-medium">Dashboard</div>
          </div>
        </header>
        <div className="p-4 sm:p-8 flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === "/teacher"}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
          ? "bg-blue-50 text-blue-700 font-medium"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
