import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { MessageSquare, Database, Settings, LogOut, LayoutDashboard } from "lucide-react";

export default function DashboardLayout() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-16 md:w-64 bg-white border-r border-gray-200 flex flex-col items-center md:items-stretch transition-all duration-300 shadow-sm z-20">
        <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-gray-100">
          <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-kaiu-forest to-kaiu-gold tracking-tight">
            KAIU<span className="hidden md:inline text-gray-400 font-light text-sm ml-2">Control</span>
          </span>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-2 px-2 md:px-4">
          <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Resumen" active={location.pathname === "/dashboard"} />
          <NavItem to="/dashboard/chats" icon={<MessageSquare size={20} />} label="Conversaciones" active={isActive("/dashboard/chats")} />
          <NavItem to="/dashboard/knowledge" icon={<Database size={20} />} label="Conocimiento" active={isActive("/dashboard/knowledge")} />
          <div className="flex-1"></div>
          <NavItem to="/dashboard/settings" icon={<Settings size={20} />} label="Ajustes" active={isActive("/dashboard/settings")} />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button className="flex items-center justify-center md:justify-start w-full p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors gap-3">
            <LogOut size={20} />
            <span className="hidden md:inline font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
            <h1 className="text-lg font-semibold text-gray-700">
              {isActive("/dashboard/chats") ? "Gestión de Conversaciones" : 
               isActive("/dashboard/knowledge") ? "Base de Conocimiento RAG" : 
               "Panel de Control"}
            </h1>
            <div className="flex items-center gap-4">
               <div className="w-8 h-8 rounded-full bg-kaiu-sage flex items-center justify-center text-white font-bold">A</div>
            </div>
          </header>
          
          <div className="flex-1 overflow-auto bg-gray-50/50">
             <Outlet />
          </div>
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, active }: { to: string, icon: any, label: string, active: boolean }) {
  return (
    <Link to={to} className={`
      flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group
      ${active ? 'bg-kaiu-forest/10 text-kaiu-forest font-semibold shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}
    `}>
      <span className={`${active ? 'text-kaiu-forest' : 'text-gray-400 group-hover:text-gray-600'}`}>
        {icon}
      </span>
      <span className="hidden md:block text-sm">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-kaiu-forest hidden md:block"></div>}
    </Link>
  )
}
