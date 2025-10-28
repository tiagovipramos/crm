'use client';

import { useEffect } from 'react';
import { useAdminStore } from '@/store/useAdminStore';
import { DollarSign, TrendingUp, Users, Trophy, AlertCircle } from 'lucide-react';

export default function DashboardIndicacaoView() {
  const estatisticasIndicacao = useAdminStore((state) => state.estatisticasIndicacao);
  const topIndicadores = useAdminStore((state) => state.topIndicadores);
  const solicitacoesSaque = useAdminStore((state) => state.solicitacoesSaque);
  const fetchEstatisticasIndicacao = useAdminStore((state) => state.fetchEstatisticasIndicacao);
  const fetchTopIndicadores = useAdminStore((state) => state.fetchTopIndicadores);
  const fetchSolicitacoesSaque = useAdminStore((state) => state.fetchSolicitacoesSaque);
  const isLoading = useAdminStore((state) => state.isLoadingEstatisticasIndicacao);

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchEstatisticasIndicacao();
    fetchTopIndicadores();
    fetchSolicitacoesSaque();
  }, [fetchEstatisticasIndicacao, fetchTopIndicadores, fetchSolicitacoesSaque]);

  // Loading state
  if (isLoading || !estatisticasIndicacao) {
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
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Indicações</h2>
        <p className="text-slate-600">Visão geral do sistema de indicações</p>
      </div>

      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-50">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-1">Total Pago</p>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(estatisticasIndicacao.totalPago)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-orange-50">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-1">Bloqueado</p>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(estatisticasIndicacao.totalBloqueado)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-50">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-1">Indicações</p>
          <p className="text-2xl font-bold text-slate-800">{estatisticasIndicacao.indicacoesTotal}</p>
          <p className="text-xs text-slate-500 mt-2">Convertidas: {estatisticasIndicacao.indicacoesConvertidas}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-50">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-1">Taxa Conversão</p>
          <p className="text-2xl font-bold text-slate-800">{estatisticasIndicacao.taxaConversao.toFixed(1)}%</p>
        </div>
      </div>

      {/* Top Indicadores */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-bold text-slate-800">Top Indicadores</h3>
        </div>
        <div className="space-y-4">
          {topIndicadores.map((indicador) => (
            <div key={indicador.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white font-bold">
                  {indicador.posicao}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{indicador.nome}</p>
                  <p className="text-sm text-slate-600">{indicador.indicacoes} indicações • {indicador.convertidas} vendas</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-purple-600">{formatCurrency(indicador.comissoesRecebidas)}</p>
                <p className="text-xs text-slate-500">Comissões</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Saques Pendentes */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Saques Pendentes: {solicitacoesSaque.filter(s => s.status === 'pendente').length}</h3>
        <div className="space-y-3">
          {solicitacoesSaque.filter(s => s.status === 'pendente').slice(0, 5).map((saque) => (
            <div key={saque.id} className="flex items-center justify-between p-4 rounded-lg bg-orange-50 border border-orange-200">
              <div>
                <p className="font-semibold text-slate-800">{saque.indicadorNome}</p>
                <p className="text-sm text-slate-600">Solicitado em {new Date(saque.dataSolicitacao).toLocaleDateString('pt-BR')}</p>
              </div>
              <p className="font-bold text-orange-600">{formatCurrency(saque.valor)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
