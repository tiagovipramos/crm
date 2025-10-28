'use client';

import { useEffect, useState } from 'react';
import { useProtecarStore } from '@/store/useProtecarStore';
import { Bell, X, CheckCircle2, Clock } from 'lucide-react';

export default function TarefaNotification() {
  const { getTarefasPendentes, concluirTarefa, leads, selecionarLead, setViewMode } = useProtecarStore();
  const [tarefasParaNotificar, setTarefasParaNotificar] = useState<any[]>([]);
  const [tarefasNotificadas, setTarefasNotificadas] = useState<Set<string>>(new Set());

  useEffect(() => {
    const verificarTarefas = () => {
      const agora = new Date();
      const tarefas = getTarefasPendentes();

      const tarefasVencendo = tarefas.filter(tarefa => {
        // Já notificou esta tarefa?
        if (tarefasNotificadas.has(tarefa.id)) {
          return false;
        }

        // Parse da data/hora da tarefa (formato MySQL: yyyy-mm-dd hh:mm:ss)
        const dataLembrete = new Date(tarefa.dataLembrete.replace(' ', 'T'));
        const diferenca = dataLembrete.getTime() - agora.getTime();
        
        // Notificar se está dentro de 5 minutos antes ou já passou (até 1h atrasada)
        return diferenca <= 5 * 60 * 1000 && diferenca >= -60 * 60 * 1000;
      });

      if (tarefasVencendo.length > 0) {
        setTarefasParaNotificar(prev => {
          const novasTarefas = tarefasVencendo.filter(t => !prev.find(p => p.id === t.id));
          if (novasTarefas.length > 0) {
            // Tocar som de notificação
            try {
              const audio = new Audio('/notification.mp3');
              audio.play().catch(() => {}); // Ignora erro se não houver som
            } catch (e) {}
            
            // Marcar como notificadas
            setTarefasNotificadas(prev => {
              const novo = new Set(prev);
              novasTarefas.forEach(t => novo.add(t.id));
              return novo;
            });
          }
          return [...prev, ...novasTarefas];
        });
      }
    };

    // Verificar a cada 30 segundos
    const intervalo = setInterval(verificarTarefas, 30000);
    verificarTarefas(); // Verificar imediatamente

    return () => clearInterval(intervalo);
  }, [getTarefasPendentes]);

  const removerNotificacao = (tarefaId: string) => {
    setTarefasParaNotificar(prev => prev.filter(t => t.id !== tarefaId));
  };

  const handleConcluir = (tarefaId: string) => {
    concluirTarefa(tarefaId);
    removerNotificacao(tarefaId);
  };

  const handleAbrirChat = (leadId: string) => {
    // Muda para view de chat
    setViewMode('chat');
    // Seleciona o lead
    selecionarLead(leadId);
  };

  const getLeadNome = (leadId?: string) => {
    if (!leadId) return null;
    const lead = leads.find(l => l.id === leadId);
    return lead?.nome;
  };

  const formatarHorario = (dataISO: string) => {
    const data = new Date(dataISO);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (tarefasParaNotificar.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-sm">
      {tarefasParaNotificar.map((tarefa) => {
        const leadNome = getLeadNome(tarefa.leadId);
        const agora = new Date();
        const dataLembrete = new Date(tarefa.dataLembrete);
        const atrasada = dataLembrete < agora;

        return (
          <div
            key={tarefa.id}
            className={`rounded-lg shadow-2xl border-2 p-4 animate-slide-in relative overflow-hidden ${
              atrasada ? 'border-red-500' : 'border-[#25D366]'
            }`}
            style={{
              background: atrasada 
                ? 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)'
                : 'linear-gradient(135deg, #d4f4dd 0%, #a7e9af 100%)'
            }}
          >
            {/* Ícone de destaque animado */}
            <div className="absolute -right-8 -top-8 w-32 h-32 opacity-10">
              <Bell className="w-full h-full animate-pulse" />
            </div>
            {/* Header */}
            <div className="flex items-start justify-between mb-2 relative z-10">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-full shadow-lg ${
                  atrasada ? 'bg-red-600 animate-bounce' : 'bg-[#25D366]'
                }`}>
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-base">
                    {atrasada ? '⚠️ Tarefa Atrasada!' : '🔔 Lembrete de Tarefa'}
                  </p>
                  <p className="text-sm font-medium text-gray-700">
                    ⏰ {formatarHorario(tarefa.dataLembrete)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removerNotificacao(tarefa.id)}
                className="text-gray-600 hover:text-gray-900 transition bg-white/50 hover:bg-white rounded-full p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="mb-3 relative z-10 bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/50">
              <h4 className="font-bold text-gray-900 mb-2 text-base">{tarefa.titulo}</h4>
              {tarefa.descricao && (
                <p className="text-sm text-gray-700 mb-2 leading-relaxed">{tarefa.descricao}</p>
              )}
              {leadNome && (
                <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                  <span className="text-lg">👤</span> {leadNome}
                </p>
              )}
            </div>

            {/* Ações */}
            <div className="flex gap-2 relative z-10">
              {tarefa.leadId && (
                <button
                  onClick={() => handleAbrirChat(tarefa.leadId)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-[#128C7E] border-2 border-[#128C7E] rounded-lg hover:bg-[#128C7E] hover:text-white transition-all text-sm font-bold shadow-md"
                >
                  💬 Abrir Chat
                </button>
              )}
              <button
                onClick={() => handleConcluir(tarefa.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#128C7E] text-white rounded-lg hover:bg-[#0d7a6e] transition-all text-sm font-bold shadow-md"
              >
                <CheckCircle2 className="w-5 h-5" />
                Concluir
              </button>
              <button
                onClick={() => removerNotificacao(tarefa.id)}
                className="px-3 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all text-sm shadow-md"
              >
                <Clock className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      })}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
