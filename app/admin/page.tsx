'use client';

import { useSearchParams } from 'next/navigation';
import DashboardCRMView from '@/components/admin/views/DashboardCRMView';
import DashboardIndicacaoView from '@/components/admin/views/DashboardIndicacaoView';
import UsuariosListView from '@/components/admin/views/UsuariosListView';
import ChatVisaoGeralView from '@/components/admin/views/ChatVisaoGeralView';
import FinanceiroView from '@/components/admin/views/FinanceiroView';
import IndicadoresListView from '@/components/admin/views/IndicadoresListView';

export default function AdminPage() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'dashboard-crm';

  const renderView = () => {
    switch (view) {
      case 'dashboard-crm':
        return <DashboardCRMView />;
      case 'dashboard-indicacao':
        return <DashboardIndicacaoView />;
      case 'usuarios':
      case 'usuarios-lista':
      case 'vendedores':
        return <UsuariosListView />;
      case 'chat':
        return <ChatVisaoGeralView />;
      case 'indicadores-lista':
        return <IndicadoresListView />;
      case 'financeiro':
      case 'comissoes':
        return <FinanceiroView />;
      default:
        return <DashboardCRMView />;
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      {renderView()}
    </div>
  );
}
