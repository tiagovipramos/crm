'use client';

import { useCRMStore } from '@/store/useCRMStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Users, 
  Wrench, 
  CreditCard, 
  Table, 
  Truck, 
  Palette, 
  ClipboardCheck, 
  Link as LinkIcon, 
  FileText, 
  DollarSign,
  LayoutDashboard,
  MessageSquare,
  Target,
  Activity,
  BarChart3,
  UserCog
} from 'lucide-react';

export default function Sidebar() {
  const { currentUser } = useCRMStore();
  const pathname = usePathname();

  // Menus diferentes por nível
  const getMenuItems = () => {
    switch (currentUser.role) {
      case 'admin':
        return [
          { title: 'Minha Empresa', icon: Building2, href: '/dashboard' },
          { 
            title: 'Empresa / Sede', 
            icon: Building2, 
            items: [
              { title: 'Dados da Empresa', href: '/dashboard/empresa' },
              { title: 'Configurações', href: '/dashboard/configuracoes' }
            ]
          },
          { title: 'Regionais', icon: MapPin, href: '/dashboard/regionais' },
          { title: 'Cooperativas', icon: Building2, href: '/dashboard/cooperativas' },
          { title: 'Usuários', icon: Users, href: '/dashboard/usuarios' },
          { title: 'Serviços', icon: Wrench, href: '/dashboard/servicos' },
          { title: 'Planos', icon: CreditCard, href: '/dashboard/planos' },
          { title: 'Tabelas de Preços', icon: Table, href: '/dashboard/tabelas-precos' },
          { title: 'Implementos', icon: Truck, href: '/dashboard/implementos' },
          { title: 'Personalização', icon: Palette, href: '/dashboard/personalizacao' },
          { title: 'Vistoria', icon: ClipboardCheck, href: '/dashboard/vistoria' },
          { title: 'Integrações', icon: LinkIcon, href: '/dashboard/integracoes' },
          { title: 'Contrato', icon: FileText, href: '/dashboard/contrato' },
          { title: 'Cotação Personalizada', icon: DollarSign, href: '/dashboard/cotacao-personalizada' }
        ];

      case 'gerente':
        return [
          { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
          { title: 'Supervisores', icon: UserCog, href: '/dashboard/supervisores' },
          { title: 'Funil Geral', icon: Target, href: '/dashboard/funil' },
          { title: 'Toda Equipe', icon: Users, href: '/dashboard/equipe' },
          { title: 'Relatórios', icon: BarChart3, href: '/dashboard/relatorios' }
        ];

      case 'supervisor':
        return [
          { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
          { title: 'Minha Equipe', icon: Users, href: '/dashboard/equipe' },
          { title: 'Funil da Equipe', icon: Target, href: '/dashboard/funil' },
          { title: 'Performance', icon: BarChart3, href: '/dashboard/performance' },
          { title: 'Conversas', icon: MessageSquare, href: '/dashboard/conversas' }
        ];

      case 'vendedor':
        return [
          { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
          { title: 'Meu Funil', icon: Target, href: '/dashboard/funil' },
          { title: 'Conversas', icon: MessageSquare, href: '/dashboard/conversas' },
          { title: 'Atividades', icon: Activity, href: '/dashboard/atividades' },
          { title: 'Minhas Comissões', icon: DollarSign, href: '/dashboard/comissoes' }
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-112px)] overflow-y-auto">
      <nav className="p-4">
        <div className="space-y-1">
          {menuItems.map((item, index) => {
            if ('items' in item) {
              // Item com submenu
              return (
                <div key={index}>
                  <div className="flex items-center gap-3 px-3 py-2 text-gray-700 font-medium">
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm">{item.title}</span>
                  </div>
                  <div className="ml-8 space-y-1">
                    {item.items?.map((subItem, subIndex) => (
                      <Link
                        key={subIndex}
                        href={subItem.href}
                        className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                          pathname === subItem.href
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {subItem.title}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            // Item normal
            return (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
