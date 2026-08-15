import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { LogOut, LayoutDashboard, History, Calendar, QrCode, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function StudentLayout() {
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
        <div className="h-16 flex items-center px-6 border-b border-gray-200 justify-between">
          <h1 className="text-xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            SmartAttend
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold shadow-inner shrink-0">
            {user?.name?.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SideNavItem to="/student" icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={handleNavClick} />
          <SideNavItem to="/student/scan" icon={<QrCode size={20} />} label="Scan QR" onClick={handleNavClick} />
          <SideNavItem to="/student/calendar" icon={<Calendar size={20} />} label="Calendar" onClick={handleNavClick} />
          <SideNavItem to="/student/history" icon={<History size={20} />} label="My History" onClick={handleNavClick} />
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 w-full rounded-xl transition-all font-medium"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header with Hamburger */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 shadow-sm gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu size={22} />
            </button>
            <div className="text-gray-500 font-medium lg:hidden">Menu</div>
          </div>
          <button onClick={logout} className="p-2 text-gray-500 hover:text-red-600 lg:hidden">
            <LogOut size={20} />
          </button>
        </header>

        {/* Dynamic Outlet */}
        <div className="flex-1 overflow-auto bg-gray-50 p-4 md:p-8">
          <div className="max-w-4xl mx-auto w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

function SideNavItem({ to, icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === "/student"}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
          ? "bg-linear-to-r from-blue-50 to-indigo-50 text-blue-700 font-semibold shadow-sm border border-blue-100/50"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium"
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
