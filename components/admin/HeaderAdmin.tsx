'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminStore } from '@/store/useAdminStore';
import { ViewAdmin } from '@/types/admin';
import {
  Shield,
  ChevronDown,
  LayoutDashboard,
  Users,
  GitBranch,
  MessageSquare,
  BarChart3,
  DollarSign,
  Settings,
  FileText,
  LogOut,
  Bell,
  User,
} from 'lucide-react';

export default function HeaderAdmin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'dashboard-crm';
  
  const usuarioLogado = useAdminStore((state) => state.usuarioLogado);
  const logout = useAdminStore((state) => state.logout);
  const alertasNaoLidos = useAdminStore((state) => state.getAlertasNaoLidos());

  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAberto(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (menu: string) => {
    setMenuAberto(menuAberto === menu ? null : menu);
  };

  const handleViewChange = (view: string) => {
    router.push(`/admin?view=${view}`);
    setMenuAberto(null);
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      diretor: 'Diretor',
      gerente: 'Gerente',
      supervisor: 'Supervisor',
    };
    return labels[role as keyof typeof labels] || role;
  };

  // Filtrar menus baseado no role do usuário
  const allMenus = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      submenus: [
        { view: 'dashboard-crm' as ViewAdmin, label: 'CRM', icon: BarChart3 },
        { view: 'dashboard-indicacao' as ViewAdmin, label: 'Indicação', icon: DollarSign },
      ],
    },
    {
      id: 'funis',
      label: 'Funis',
      icon: GitBranch,
      submenus: [
        { view: 'funis-gestao' as ViewAdmin, label: 'Gerenciar Funis', icon: GitBranch },
      ],
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: MessageSquare,
      submenus: [
        { view: 'chat-visao-geral' as ViewAdmin, label: 'Visão Geral', icon: MessageSquare },
      ],
    },
    {
      id: 'indicadores',
      label: 'Indicadores',
      icon: Users,
      submenus: [
        { view: 'indicadores-lista' as ViewAdmin, label: 'Listar Todos', icon: Users },
      ],
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      icon: BarChart3,
      submenus: [
        { view: 'relatorios-crm' as ViewAdmin, label: 'CRM', icon: BarChart3 },
        { view: 'relatorios-indicacao' as ViewAdmin, label: 'Indicações', icon: DollarSign },
      ],
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: Settings,
      submenus: [
        { view: 'configuracoes' as ViewAdmin, label: 'Sistema', icon: Settings },
      ],
    },
    {
      id: 'auditoria',
      label: 'Auditoria',
      icon: FileText,
      submenus: [
        { view: 'auditoria' as ViewAdmin, label: 'Logs de Atividades', icon: FileText },
      ],
    },
  ];

  // Adicionar menu Financeiro APENAS para Diretor
  if (usuarioLogado?.role === 'diretor') {
    allMenus.splice(5, 0, {
      id: 'financeiro',
      label: 'Financeiro',
      icon: DollarSign,
      submenus: [
        { view: 'financeiro' as ViewAdmin, label: 'Gerenciar Saques', icon: DollarSign },
      ],
    });
  }

  const menus = allMenus;

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Título */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">
                Painel Admin
              </h1>
              <p className="text-xs text-slate-500">Protecar CRM</p>
            </div>
          </div>

          {/* Menu de Navegação */}
          <nav className="hidden lg:flex items-center gap-1" ref={menuRef}>
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
                    <div className="absolute top-full left-0 mt-1 min-w-[200px] bg-white rounded-lg shadow-lg border border-slate-200 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                      {menu.submenus.map((submenu) => {
                        const SubIcon = submenu.icon;
                        const isViewActive = currentView === submenu.view;

                        return (
                          <button
                            key={submenu.view}
                            onClick={() => handleViewChange(submenu.view)}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                              isViewActive
                                ? 'bg-blue-50 text-blue-600 font-medium'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <SubIcon className="w-4 h-4" />
                            <span>{submenu.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Botão Usuários - Direto sem submenu */}
            <button
              onClick={() => handleViewChange('usuarios-lista')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                currentView === 'usuarios-lista'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Usuários</span>
            </button>
          </nav>

          {/* Ações do Usuário */}
          <div className="flex items-center gap-3">
            {/* Notificações */}
            <button className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
              <Bell className="w-5 h-5" />
              {alertasNaoLidos.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* Perfil do Usuário */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-800">
                  {usuarioLogado?.nome}
                </p>
                <p className="text-xs text-slate-500">
                  {getRoleLabel(usuarioLogado?.role || '')}
                </p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                {usuarioLogado?.nome.charAt(0)}
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
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
