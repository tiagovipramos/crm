'use client';

import { useProtecarStore } from '@/store/useProtecarStore';
import { TrendingUp, TrendingDown, Users, MessageSquare, FileText, CheckCircle, Clock, Target, DollarSign, Calendar } from 'lucide-react';

export default function DashboardView() {
  const { 
    consultorAtual, 
    getLeadsDoConsultor, 
    getLeadsPorStatus,
    getTarefasPendentes,
    getEstatisticas 
  } = useProtecarStore();

  const leads = getLeadsDoConsultor();
  const tarefasPendentes = getTarefasPendentes();
  const stats = getEstatisticas('mes');
  
  const leadsNovos = getLeadsPorStatus('novo');
  const leadsPrimeiroContato = getLeadsPorStatus('primeiro_contato');
  const leadsPropostaEnviada = getLeadsPorStatus('proposta_enviada');
  const leadsConvertidos = getLeadsPorStatus('convertido');
  
  const mensagensNaoLidas = leads.reduce((total, lead) => total + lead.mensagensNaoLidas, 0);
  
  // Meta do mês (simulado)
  const metaMensal = 20;
  const progressoMeta = (leadsConvertidos.length / metaMensal) * 100;

  const cards = [
    {
      title: 'Total de Leads',
      value: stats.totalLeads,
      icon: Users,
      color: '#3B82F6',
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Conversões',
      value: stats.conversoes,
      icon: CheckCircle,
      color: '#10B981',
      trend: '+8%',
      trendUp: true
    },
    {
      title: 'Taxa de Conversão',
      value: `${stats.taxaConversao.toFixed(1)}%`,
      icon: Target,
      color: '#F59E0B',
      trend: '-2%',
      trendUp: false
    },
    {
      title: 'Propostas Enviadas',
      value: stats.propostasEnviadas,
      icon: FileText,
      color: '#8B5CF6',
      trend: '+15%',
      trendUp: true
    }
  ];

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo, {consultorAtual?.nome}!
          </h1>
          <p className="text-gray-600">
            Aqui está a visão geral do seu escritório virtual de vendas
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${card.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: card.color }} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {card.trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {card.trend}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{card.value}</h3>
                <p className="text-sm text-gray-600">{card.title}</p>
              </div>
            );
          })}
        </div>

        {/* Performance do Período */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance do Mês</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{stats.mensagensEnviadas}</div>
              <div className="text-sm text-gray-600">Mensagens Enviadas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">{stats.mensagensRecebidas}</div>
              <div className="text-sm text-gray-600">Mensagens Recebidas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-1">{stats.propostasEnviadas}</div>
              <div className="text-sm text-gray-600">Propostas Enviadas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">{stats.tempoMedioResposta}min</div>
              <div className="text-sm text-gray-600">Tempo Médio de Resposta</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Funil de Vendas */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Funil de Vendas</h2>
            <div className="space-y-4">
              {[
                { label: 'Novos Leads', count: leadsNovos.length, total: leads.length, color: '#3B82F6' },
                { label: 'Primeiro Contato', count: leadsPrimeiroContato.length, total: leads.length, color: '#8B5CF6' },
                { label: 'Proposta Enviada', count: leadsPropostaEnviada.length, total: leads.length, color: '#F59E0B' },
                { label: 'Convertidos', count: leadsConvertidos.length, total: leads.length, color: '#10B981' }
              ].map((stage, index) => {
                const percentage = stage.total > 0 ? (stage.count / stage.total) * 100 : 0;
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                      <span className="text-sm font-bold text-gray-900">{stage.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: stage.color
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Meta do Mês */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Meta do Mês</h2>
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#E5E7EB"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#10B981"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - progressoMeta / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{leadsConvertidos.length}</div>
                    <div className="text-xs text-gray-500">de {metaMensal}</div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {progressoMeta.toFixed(0)}% da meta alcançada
              </p>
              <p className="text-xs text-gray-500">
                Faltam {metaMensal - leadsConvertidos.length} conversões
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tarefas Pendentes */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Tarefas Pendentes</h2>
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                {tarefasPendentes.length}
              </span>
            </div>
            
            {tarefasPendentes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhuma tarefa pendente</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {tarefasPendentes.slice(0, 5).map((tarefa) => {
                  const lead = leads.find(l => l.id === tarefa.leadId);
                  return (
                    <div key={tarefa.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{tarefa.titulo}</p>
                        {lead && (
                          <p className="text-xs text-gray-600">{lead.nome}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(tarefa.dataLembrete).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Atividades Recentes */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Mensagens Não Lidas</h2>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                {mensagensNaoLidas}
              </span>
            </div>
            
            {mensagensNaoLidas === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Todas as mensagens foram lidas</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {leads
                  .filter(l => l.mensagensNaoLidas > 0)
                  .slice(0, 5)
                  .map((lead) => (
                    <div key={lead.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-[#128C7E] flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {lead.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">{lead.nome}</p>
                          <span className="bg-[#25D366] text-white text-xs font-bold px-2 py-1 rounded-full">
                            {lead.mensagensNaoLidas}
                          </span>
                        </div>
                        {lead.ultimaMensagem && (
                          <p className="text-xs text-gray-600 truncate mt-1">{lead.ultimaMensagem}</p>
                        )}
                        {lead.modeloVeiculo && (
                          <p className="text-xs text-gray-500 mt-1">{lead.modeloVeiculo}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
