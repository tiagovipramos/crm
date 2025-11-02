'use client';

import { useProtecarStore } from '@/store/useProtecarStore';
import DashboardView from '@/components/views/DashboardView';
import ChatView from '@/components/views/ChatView';
import FunilView from '@/components/views/FunilView';
import TarefasView from '@/components/views/TarefasView';
import ConfiguracoesView from '@/components/views/ConfiguracoesView';
import FollowUpView from '@/components/views/FollowUpView';

export default function CRMPage() {
  const viewMode = useProtecarStore(state => state.viewMode);

  return (
    <>
      {viewMode === 'dashboard' && <DashboardView />}
      {viewMode === 'chat' && <ChatView />}
      {viewMode === 'funil' && <FunilView />}
      {viewMode === 'tarefas' && <TarefasView />}
      {viewMode === 'configuracoes' && <ConfiguracoesView />}
      {viewMode === 'followup' && <FollowUpView />}
    </>
  );
}
