'use client';

import { useCRMStore } from '@/store/useCRMStore';
import { getRoleLabel } from '@/lib/utils';
import { Bell, Settings, LogOut, ChevronDown, User, Menu } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const { currentUser, switchRole } = useCRMStore();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const roles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'gerente', label: 'Gerente' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'vendedor', label: 'Vendedor' },
  ];

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-700 sticky top-0 z-50 shadow-lg">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo e Menu */}
        <div className="flex items-center gap-4">
          <button className="lg:hidden p-2 hover:bg-blue-500 rounded-lg transition-colors">
            <Menu className="w-6 h-6 text-white" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
              <span className="text-blue-600 font-bold text-xl">V</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Vipseg CRM</h1>
              <p className="text-xs text-blue-200">Proteção Veicular</p>
            </div>
          </div>
        </div>

        {/* Centro - Trocar Nível (Mock) */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg transition-colors"
          >
            <User className="w-4 h-4" />
            <span className="font-medium text-sm">Trocar Nível (Mock)</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {showRoleMenu && (
            <div className="absolute top-full mt-2 right-0 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
              {roles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => {
                    switchRole(role.value as any);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                    currentUser.role === role.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Direita - Ações e Usuário */}
        <div className="flex items-center gap-3">
          {/* Notificações */}
          <button className="relative p-2 hover:bg-blue-500 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Configurações */}
          <button className="p-2 hover:bg-blue-500 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-white" />
          </button>

          {/* Menu do Usuário */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 pl-3 hover:bg-blue-500 rounded-lg transition-colors"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-white">{currentUser.name}</p>
                <p className="text-xs text-blue-200">{getRoleLabel(currentUser.role)}</p>
              </div>
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full border-2 border-blue-400"
                />
              ) : (
                <div className="w-10 h-10 rounded-full border-2 border-blue-400 bg-blue-300 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </button>

            {showUserMenu && (
              <div className="absolute top-full mt-2 right-0 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">{currentUser.email}</p>
                </div>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700">
                  <User className="w-4 h-4" />
                  Meu Perfil
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700">
                  <Settings className="w-4 h-4" />
                  Configurações
                </button>
                <hr className="my-2 border-gray-100" />
                <button className="w-full text-left px-4 py-2 hover:bg-red-50 transition-colors flex items-center gap-2 text-red-600">
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navegação secundária - apenas para não-admin */}
      {currentUser.role !== 'admin' && (
        <div className="bg-blue-800 px-6 py-2">
          <div className="flex items-center gap-6 text-sm">
            <button className="text-blue-200 hover:text-white transition-colors font-medium">
              Vendas
            </button>
            <button className="text-blue-200 hover:text-white transition-colors font-medium">
              Atividades
            </button>
            <button className="text-blue-200 hover:text-white transition-colors font-medium">
              Minha Conta
            </button>
            <button className="text-blue-200 hover:text-white transition-colors font-medium">
              Relatórios
            </button>
            <button className="text-blue-200 hover:text-white transition-colors font-medium">
              Financeiro
            </button>
            <button className="text-blue-200 hover:text-white transition-colors font-medium">
              Minha Empresa
            </button>
            <button className="text-blue-200 hover:text-white transition-colors font-medium">
              Ferramentas
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
