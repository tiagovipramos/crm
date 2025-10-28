'use client';

import { useEffect } from 'react';
import { useAdminStore } from '@/store/useAdminStore';
import {
  DollarSign,
  Users,
  TrendingUp,
  BarChart3,
  Clock,
  Target,
  AlertTriangle,
  Trophy,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export default function DashboardCRMView() {
  const estatisticasCRM = useAdminStore((state) => state.estatisticasCRM);
  const topPerformers = useAdminStore((state) => state.topPerformers);
  const alertas = useAdminStore((state) => state.alertas);
  const distribuicaoFunil = useAdminStore((state) => state.distribuicaoFunil);
  const fetchEstatisticasCRM = useAdminStore((state) => state.fetchEstatisticasCRM);
  const fetchTopPerformers = useAdminStore((state) => state.fetchTopPerformers);
  const fetchDistribuicaoFunil = useAdminStore((state) => state.fetchDistribuicaoFunil);
  const fetchAlertas = useAdminStore((state) => state.fetchAlertas);
  const isLoading = useAdminStore((state) => state.isLoadingEstatisticasCRM);

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchEstatisticasCRM();
    fetchTopPerformers();
    fetchDistribuicaoFunil();
    fetchAlertas();
  }, [fetchEstatisticasCRM, fetchTopPerformers, fetchDistribuicaoFunil, fetchAlertas]);

  // Loading state
  if (isLoading || !estatisticasCRM) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard CRM</h2>
        <p className="text-slate-600">Visão geral do sistema de vendas</p>
      </div>

      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento Total */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-50">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-medium text-green-600 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              +12%
            </span>
          </div>
          <p className="text-sm text-slate-600 mb-1">Faturamento Total</p>
          <p className="text-2xl font-bold text-slate-800">
            {formatCurrency(estatisticasCRM.faturamentoTotal)}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Mês: {formatCurrency(estatisticasCRM.faturamentoMesAtual)}
          </p>
        </div>

        {/* Leads Totais */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-50">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              +8%
            </span>
          </div>
          <p className="text-sm text-slate-600 mb-1">Leads Total</p>
          <p className="text-2xl font-bold text-slate-800">
            {estatisticasCRM.leadsTotal}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Ativos: {estatisticasCRM.leadsAtivos}
          </p>
        </div>

        {/* Conversões */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-50">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-purple-600 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              +5%
            </span>
          </div>
          <p className="text-sm text-slate-600 mb-1">Conversões</p>
          <p className="text-2xl font-bold text-slate-800">
            {estatisticasCRM.conversoes}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Taxa: {(estatisticasCRM.taxaConversao || 0).toFixed(1)}%
          </p>
        </div>

        {/* Tempo Médio */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-orange-50">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-xs font-medium text-red-600 flex items-center gap-1">
              <ArrowDown className="w-3 h-3" />
              -2d
            </span>
          </div>
          <p className="text-sm text-slate-600 mb-1">Tempo Médio</p>
          <p className="text-2xl font-bold text-slate-800">
            {(estatisticasCRM.tempoMedioFechamento || 0).toFixed(1)} dias
          </p>
          <p className="text-xs text-slate-500 mt-2">Fechamento</p>
        </div>
      </div>

      {/* Linha 2: Meta Mensal e Taxa de Conversão */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Meta Mensal */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-cyan-50">
              <Target className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Meta Mensal</p>
              <p className="text-lg font-bold text-slate-800">
                {(estatisticasCRM.metaAtingida || 0).toFixed(1)}% atingida
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Faturamento</span>
              <span className="font-medium text-slate-800">
                {formatCurrency(estatisticasCRM.faturamentoMesAtual || 0)} /{' '}
                {formatCurrency(estatisticasCRM.metaMensal || 0)}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((estatisticasCRM.metaAtingida || 0), 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Taxa de Conversão */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-green-50">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Taxa de Conversão</p>
              <p className="text-lg font-bold text-slate-800">
                {(estatisticasCRM.taxaConversao || 0).toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Conversões</span>
              <span className="font-medium text-slate-800">
                {estatisticasCRM.conversoesMes || 0} no mês
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((estatisticasCRM.taxaConversao || 0) * 5, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Vendedores */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-bold text-slate-800">Top Vendedores</h3>
        </div>
        <div className="space-y-4">
          {Array.isArray(topPerformers) && topPerformers.length > 0 ? topPerformers.map((performer) => (
            <div
              key={performer.id}
              className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold">
                  {performer.posicao}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{performer.nome}</p>
                  <p className="text-sm text-slate-600">
                    {performer.vendas} vendas • {(performer.taxaConversao || 0).toFixed(0)}% taxa
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">
                  {formatCurrency(performer.faturamento)}
                </p>
                <p className="text-xs text-slate-500">Faturamento</p>
              </div>
            </div>
          )) : (
            <p className="text-center text-slate-500 py-4">Nenhum vendedor com vendas ainda</p>
          )}
        </div>
      </div>

      {/* Distribuição do Funil */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Distribuição do Funil</h3>
        {!Array.isArray(distribuicaoFunil) || distribuicaoFunil.length === 0 ? (
          <p className="text-center text-slate-500">Nenhum lead no funil ainda</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {distribuicaoFunil.map((item) => (
            <div key={item.etapa} className="text-center">
              <div
                className="w-full h-24 rounded-lg flex items-center justify-center mb-2"
                style={{ backgroundColor: item.cor + '20' }}
              >
                <p className="text-3xl font-bold" style={{ color: item.cor }}>
                  {item.quantidade}
                </p>
              </div>
              <p className="text-sm font-medium text-slate-700">{item.etapa}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alertas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-bold text-slate-800">Alertas</h3>
        </div>
        <div className="space-y-3">
          {Array.isArray(alertas) && alertas.length > 0 ? alertas
            .filter((a) => !a.lido)
            .slice(0, 4)
            .map((alerta) => (
              <div
                key={alerta.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alerta.tipo === 'error'
                    ? 'bg-red-50 border-red-500'
                    : alerta.tipo === 'warning'
                    ? 'bg-orange-50 border-orange-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <p className="font-semibold text-slate-800 mb-1">{alerta.titulo}</p>
                <p className="text-sm text-slate-600">{alerta.mensagem}</p>
              </div>
            )) : (
            <p className="text-center text-slate-500 py-4">Nenhum alerta no momento</p>
          )}
        </div>
      </div>
    </div>
  );
}
