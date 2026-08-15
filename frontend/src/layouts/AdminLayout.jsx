import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Users, Building2, BookOpen, Monitor, Settings, Calendar, Library, BookMarked, Layers, FileUp, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout() {
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on navigation (mobile)
  const handleNavClick = () => setSidebarOpen(false);

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex">
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
        <div className="h-16 flex items-center px-6 border-b border-gray-200 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-600 to-indigo-600"></div>
          <h1 className="text-xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            SmartAttend Admin
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto p-1 text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem to="/admin" end={true} icon={<Monitor size={20} />} label="Overview" onClick={handleNavClick} />
          <NavItem to="/admin/departments" icon={<Building2 size={20} />} label="Departments" onClick={handleNavClick} />
          <NavItem to="/admin/courses" icon={<BookOpen size={20} />} label="Programs" onClick={handleNavClick} />
          <NavItem to="/admin/academic-years" icon={<Calendar size={20} />} label="Academic Years" onClick={handleNavClick} />
          <NavItem to="/admin/semesters" icon={<Layers size={20} />} label="Semesters" onClick={handleNavClick} />
          <NavItem to="/admin/subjects" icon={<Library size={20} />} label="Subjects" onClick={handleNavClick} />
          <NavItem to="/admin/subject-offerings" icon={<BookMarked size={20} />} label="Subject Offerings" onClick={handleNavClick} />
          <NavItem to="/admin/users" icon={<Users size={20} />} label="Users" onClick={handleNavClick} />
          <NavItem to="/admin/import" icon={<FileUp size={20} />} label="Bulk Import" onClick={handleNavClick} />
          <NavItem to="/admin/classrooms" icon={<Monitor size={20} />} label="Classrooms" onClick={handleNavClick} />
          <NavItem to="/admin/settings" icon={<Settings size={20} />} label="Settings" onClick={handleNavClick} />
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
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-8 shadow-sm gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <Menu size={22} />
          </button>
          <div className="text-gray-500 font-medium">Dashboard</div>
        </header>
        <div className="p-4 sm:p-8 flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
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
