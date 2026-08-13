import { Outlet, NavLink } from "react-router-dom";
import { Users, Building2, BookOpen, Monitor, Settings } from "lucide-react";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            SmartAttend Admin
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavItem to="/admin" end={true} icon={<Monitor size={20} />} label="Overview" />
          <NavItem to="/admin/users" icon={<Users size={20} />} label="Users" />
          <NavItem to="/admin/departments" icon={<Building2 size={20} />} label="Departments" />
          <NavItem to="/admin/courses" icon={<BookOpen size={20} />} label="Courses" />
          <NavItem to="/admin/classrooms" icon={<Monitor size={20} />} label="Classrooms" />
          <NavItem to="/admin/settings" icon={<Settings size={20} />} label="Settings" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 shadow-sm">
          <div className="text-gray-500 font-medium">Dashboard</div>
        </header>
        <div className="p-8 flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
          isActive
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
