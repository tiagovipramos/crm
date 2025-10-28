'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, LogOut, ChevronDown, LayoutDashboard, Users, DollarSign, MessageSquare, Menu, X } from 'lucide-react';

export default function HeaderAdminSimples() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('admin-user');
      if (user) {
        setUsuario(JSON.parse(user));
      }
    }

    // Fechar menu ao clicar fora
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAberto(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin-user');
    }
    router.push('/admin/login');
  };

  const toggleMenu = (menu: string) => {
    setMenuAberto(menuAberto === menu ? null : menu);
  };

  const navegar = (url: string) => {
    router.push(url);
    setMenuAberto(null);
  };

  const menus = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      items: [
        { label: 'Dashboard CRM', url: '/admin?view=dashboard-crm' },
        { label: 'Dashboard Indicação', url: '/admin?view=dashboard-indicacao' },
      ]
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Painel Admin</h1>
              <p className="text-xs text-slate-500">Protecar CRM</p>
            </div>
          </div>

          {/* Menu Desktop */}
          <nav className="hidden md:flex items-center gap-1" ref={menuRef}>
            {menus.map((menu) => {
              const Icon = menu.icon;
              const isActive = menuAberto === menu.id;

              return (
                <div key={menu.id} className="relative">
                  <button
                    onClick={() => toggleMenu(menu.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{menu.label}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        isActive ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Submenu */}
                  {isActive && (
                    <div className="absolute top-full left-0 mt-1 min-w-[220px] bg-white rounded-lg shadow-xl border border-slate-200 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      {menu.items.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => navegar(item.url)}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Botão Usuários - Direto sem submenu */}
            <button
              onClick={() => navegar('/admin?view=usuarios')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Usuários</span>
            </button>
            
            {/* Botão CRM Chat - Direto sem submenu */}
            <button
              onClick={() => navegar('/admin?view=chat')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">CRM Chat</span>
            </button>
            
            {/* Botão Indicadores - Direto sem submenu */}
            <button
              onClick={() => navegar('/admin?view=indicadores-lista')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Indicadores</span>
            </button>
            
            {/* Botão Financeiro - Apenas para Diretor */}
            {usuario?.role === 'diretor' && (
              <button
                onClick={() => navegar('/admin?view=financeiro')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Financeiro</span>
              </button>
            )}
          </nav>

          {/* User Info + Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-slate-800">{usuario?.nome || 'Admin'}</p>
              <p className="text-xs text-slate-500">{usuario?.role || 'Usuário'}</p>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm">
              {usuario?.nome?.charAt(0) || 'A'}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
