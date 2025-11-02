'use client';

import { useProtecarStore } from '@/store/useProtecarStore';
import { Calendar, CheckCircle2, Clock, Trash2, User, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function TarefasView() {
  const {
    getTarefasPendentes,
    concluirTarefa,
    deletarTarefa,
    leads,
    consultorAtual
  } = useProtecarStore();

  const [filtro, setFiltro] = useState<'todas' | 'hoje' | 'proximas' | 'atrasadas'>('todas');

  const tarefasPendentes = getTarefasPendentes();

  // Parse manual para evitar conversão de timezone
  const parseDataMySQL = (dataMySQL: string) => {
    // Formato esperado: "2025-10-22 14:00:00"
    // Mas pode vir como ISO: "2025-10-22T14:00:00.000Z"
    
    // Limpar possível "T" e parte de segundos/timezone
    const dataLimpa = dataMySQL.replace('T', ' ').split('.')[0];
    const [dataParte, horaParte] = dataLimpa.split(' ');
    
    if (!dataParte || !horaParte) {
      // Fallback: tentar parse normal
      const d = new Date(dataMySQL);
      return {
        ano: d.getFullYear(),
        mes: d.getMonth() + 1,
        dia: d.getDate(),
        hora: d.getHours(),
        minuto: d.getMinutes()
      };
    }
    
    const [ano, mes, dia] = dataParte.split('-').map(Number);
    const [hora, minuto] = horaParte.split(':').map(Number);
    
    return { ano, mes, dia, hora, minuto };
  };

  // Filtrar tarefas
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const tarefasFiltradas = tarefasPendentes.filter(tarefa => {
    const { ano, mes, dia } = parseDataMySQL(tarefa.dataLembrete);
    const dataTarefa = new Date(ano, mes - 1, dia, 0, 0, 0, 0);

    switch (filtro) {
      case 'hoje':
        return dataTarefa.getTime() === hoje.getTime();
      case 'proximas':
        return dataTarefa.getTime() >= amanha.getTime();
      case 'atrasadas':
        return dataTarefa.getTime() < hoje.getTime();
      default:
        return true;
    }
  });

  const formatarData = (dataMySQL: string) => {
    const { ano, mes, dia, hora, minuto } = parseDataMySQL(dataMySQL);
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataTarefa = new Date(ano, mes - 1, dia, 0, 0, 0, 0);

    const horaFormatada = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;

    if (dataTarefa.getTime() === hoje.getTime()) {
      return `Hoje às ${horaFormatada}`;
    }

    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    if (dataTarefa.getTime() === amanha.getTime()) {
      return `Amanhã às ${horaFormatada}`;
    }

    return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano} às ${horaFormatada}`;
  };

  const getLeadNome = (leadId?: string) => {
    if (!leadId) return 'Sem lead associado';
    const lead = leads.find(l => l.id === leadId);
    return lead ? lead.nome : 'Lead não encontrado';
  };

  const handleConcluir = async (tarefaId: string) => {
    if (confirm('Deseja marcar esta tarefa como concluída?')) {
      concluirTarefa(tarefaId);
    }
  };

  const handleDeletar = async (tarefaId: string) => {
    if (confirm('Deseja excluir esta tarefa permanentemente?')) {
      deletarTarefa(tarefaId);
    }
  };

  // Estatísticas
  const tarefasHoje = tarefasPendentes.filter(t => {
    const { ano, mes, dia } = parseDataMySQL(t.dataLembrete);
    const dataTarefa = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
    return dataTarefa.getTime() === hoje.getTime();
  }).length;

  const tarefasAtrasadas = tarefasPendentes.filter(t => {
    const { ano, mes, dia } = parseDataMySQL(t.dataLembrete);
    const dataTarefa = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
    return dataTarefa.getTime() < hoje.getTime();
  }).length;

  const tarefasProximas = tarefasPendentes.filter(t => {
    const { ano, mes, dia } = parseDataMySQL(t.dataLembrete);
    const dataTarefa = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
    return dataTarefa.getTime() >= amanha.getTime();
  }).length;

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tarefas</h1>
          <p className="text-gray-600">
            Gerencie suas tarefas e compromissos
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setFiltro('todas')}
            className={`bg-white p-4 rounded-lg shadow-sm border-2 transition ${
              filtro === 'todas' ? 'border-[#128C7E]' : 'border-transparent hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{tarefasPendentes.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-[#128C7E]" />
            </div>
          </button>

          <button
            onClick={() => setFiltro('hoje')}
            className={`bg-white p-4 rounded-lg shadow-sm border-2 transition ${
              filtro === 'hoje' ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hoje</p>
                <p className="text-2xl font-bold text-blue-600">{tarefasHoje}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </button>

          <button
            onClick={() => setFiltro('atrasadas')}
            className={`bg-white p-4 rounded-lg shadow-sm border-2 transition ${
              filtro === 'atrasadas' ? 'border-red-500' : 'border-transparent hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Atrasadas</p>
                <p className="text-2xl font-bold text-red-600">{tarefasAtrasadas}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </button>

          <button
            onClick={() => setFiltro('proximas')}
            className={`bg-white p-4 rounded-lg shadow-sm border-2 transition ${
              filtro === 'proximas' ? 'border-purple-500' : 'border-transparent hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Próximas</p>
                <p className="text-2xl font-bold text-purple-600">{tarefasProximas}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </button>
        </div>

        {/* Lista de Tarefas */}
        {tarefasFiltradas.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Tudo resolvido!</h3>
            <p className="text-gray-600">
              {filtro === 'todas' 
                ? 'Você não tem tarefas pendentes 🎉'
                : filtro === 'hoje'
                ? 'Você não tem tarefas para hoje 🎉'
                : filtro === 'atrasadas'
                ? 'Você não tem tarefas atrasadas! 🎉'
                : 'Você não tem tarefas próximas 📅'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tarefasFiltradas.map((tarefa) => {
              const { ano, mes, dia } = parseDataMySQL(tarefa.dataLembrete);
              const dataTarefa = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
              const isAtrasada = dataTarefa.getTime() < hoje.getTime();
              const isHoje = dataTarefa.getTime() === hoje.getTime();

              return (
                <div
                  key={tarefa.id}
                  className={`bg-white rounded-lg shadow-sm p-6 border-l-4 transition hover:shadow-md ${
                    isAtrasada
                      ? 'border-red-500'
                      : isHoje
                      ? 'border-blue-500'
                      : 'border-[#128C7E]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {tarefa.titulo}
                        </h3>
                        {isAtrasada && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                            Atrasada
                          </span>
                        )}
                        {isHoje && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            Hoje
                          </span>
                        )}
                      </div>

                      {tarefa.descricao && (
                        <p className="text-gray-600 mb-3">{tarefa.descricao}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatarData(tarefa.dataLembrete)}</span>
                        </div>

                        {tarefa.leadId && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{getLeadNome(tarefa.leadId)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleConcluir(tarefa.id)}
                        className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition"
                        title="Marcar como concluída"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => handleDeletar(tarefa.id)}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
                        title="Excluir tarefa"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
