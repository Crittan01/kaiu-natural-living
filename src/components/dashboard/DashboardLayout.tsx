import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { MessageSquare, Database, Settings, LogOut, LayoutDashboard, Package, ShoppingBag } from "lucide-react";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  userId: string;
  role: 'ADMIN' | 'WAREHOUSE' | 'SUPPORT';
  email: string;
  exp: number;
}

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => {
      if (path === '/dashboard') {
          return location.pathname === '/dashboard';
      }
      return location.pathname.startsWith(path);
  }

  // Session & RBAC logic
  const [role, setRole] = useState<'ADMIN' | 'WAREHOUSE' | 'SUPPORT' | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const token = sessionStorage.getItem('kaiu_admin_token');
    if (token) {
        try {
           const decoded = jwtDecode<DecodedToken>(token);
           setRole(decoded.role);
           setUserEmail(decoded.email);
        } catch (e) {
           console.error("Invalid token");
        }
    }
  }, []);

  const handleLogout = () => {
      sessionStorage.removeItem('kaiu_admin_token');
      sessionStorage.removeItem('kaiu_admin_user');
      navigate('/admin/login');
  };

  const getHeaderTitle = () => {
      if (isActive("/dashboard/chats")) return "Gestión de Conversaciones (IA & WA)";
      if (isActive("/dashboard/knowledge")) return "Base de Conocimiento RAG";
      if (isActive("/dashboard/orders")) return "Centro de Despachos";
      if (isActive("/dashboard/inventory")) return "Gestión de Inventario";
      if (isActive("/dashboard/settings")) return "Configuración";
      return "Panel de Control Principal";
  };

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
          
          {role === 'ADMIN' && (
             <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Resumen" active={location.pathname === "/dashboard"} />
          )}

          {(role === 'ADMIN' || role === 'WAREHOUSE') && (
            <>
              <NavItem to="/dashboard/orders" icon={<ShoppingBag size={20} />} label="Órdenes & Envíos" active={isActive("/dashboard/orders")} />
              <NavItem to="/dashboard/inventory" icon={<Package size={20} />} label="Inventario" active={isActive("/dashboard/inventory")} />
            </>
          )}

          {(role === 'ADMIN' || role === 'SUPPORT') && (
            <>
              <NavItem to="/dashboard/chats" icon={<MessageSquare size={20} />} label="Conversaciones" active={isActive("/dashboard/chats")} />
              <NavItem to="/dashboard/knowledge" icon={<Database size={20} />} label="Conocimiento RAG" active={isActive("/dashboard/knowledge")} />
            </>
          )}

          <div className="flex-1"></div>
          
          {role === 'ADMIN' && (
             <NavItem to="/dashboard/settings" icon={<Settings size={20} />} label="Ajustes" active={isActive("/dashboard/settings")} />
          )}

        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="flex items-center justify-center md:justify-start w-full p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors gap-3">
            <LogOut size={20} />
            <span className="hidden md:inline font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
            <h1 className="text-lg font-semibold text-gray-700">
               {getHeaderTitle()}
            </h1>
            <div className="flex items-center gap-4">
               <span className="text-sm font-medium text-gray-500 hidden sm:block">{userEmail}</span>
               <div className="w-8 h-8 rounded-full bg-kaiu-sage flex items-center justify-center text-white font-bold" title={role || ''}>
                   {userEmail ? userEmail[0].toUpperCase() : '👤'}
               </div>
            </div>
          </header>
          
          <div className="flex-1 overflow-auto bg-gray-50/50">
             <Outlet />
          </div>
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, active }: { to: string, icon: React.ReactNode, label: string, active: boolean }) {
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
