'use client';

import { useAdminStore } from '@/store/useAdminStore';
import { 
  Users, 
  TrendingUp, 
  CheckCircle, 
  DollarSign, 
  Mail, 
  Phone, 
  Calendar,
  Award,
  Target,
  BarChart3,
  Clock,
  Search
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function IndicadoresListView() {
  const indicadores = useAdminStore((state) => state.indicadores);
  const fetchIndicadores = useAdminStore((state) => state.fetchIndicadores);
  const isLoading = useAdminStore((state) => state.isLoadingIndicadores);
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'ativos' | 'inativos'>('ativos');
  const [ordenacao, setOrdenacao] = useState<'nome' | 'nome-desc' | 'indicacoes' | 'indicacoes-desc' | 'taxa' | 'taxa-desc' | 'saldo' | 'saldo-desc'>('indicacoes');
  const [busca, setBusca] = useState('');

  // Carregar indicadores ao montar o componente
  useEffect(() => {
    fetchIndicadores();
  }, [fetchIndicadores]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando indicadores...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Filtrar indicadores
  const indicadoresFiltrados = indicadores.filter(ind => {
    // Filtro por status
    let passaFiltroStatus = true;
    if (filtroAtivo === 'ativos') passaFiltroStatus = ind.ativo;
    if (filtroAtivo === 'inativos') passaFiltroStatus = !ind.ativo;

    // Filtro por busca de nome
    const passaFiltroBusca = busca.trim() === '' || 
      ind.nome.toLowerCase().includes(busca.toLowerCase().trim());

    return passaFiltroStatus && passaFiltroBusca;
  });

  // Ordenar indicadores
  const indicadoresOrdenados = [...indicadoresFiltrados].sort((a, b) => {
    switch (ordenacao) {
      case 'nome':
        return a.nome.localeCompare(b.nome);
      case 'nome-desc':
        return b.nome.localeCompare(a.nome);
      case 'indicacoes':
        return b.totalIndicacoes - a.totalIndicacoes;
      case 'indicacoes-desc':
        return a.totalIndicacoes - b.totalIndicacoes;
      case 'taxa':
        return b.taxaConversao - a.taxaConversao;
      case 'taxa-desc':
        return a.taxaConversao - b.taxaConversao;
      case 'saldo':
        return b.saldoDisponivel - a.saldoDisponivel;
      case 'saldo-desc':
        return a.saldoDisponivel - b.saldoDisponivel;
      default:
        return 0;
    }
  });

  // Estatísticas gerais
  const totalIndicadores = indicadores.length;
  const indicadoresAtivos = indicadores.filter(i => i.ativo).length;
  const totalIndicacoes = indicadores.reduce((acc, i) => acc + i.totalIndicacoes, 0);
  const totalConvertidas = indicadores.reduce((acc, i) => acc + i.indicacoesConvertidas, 0);
  const saldoTotalDisponivel = indicadores.reduce((acc, i) => acc + i.saldoDisponivel, 0);
  const taxaConversaoMedia = totalIndicacoes > 0 ? (totalConvertidas / totalIndicacoes) * 100 : 0;

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="w-8 h-8" />
            Indicadores
          </h2>
          <p className="text-purple-100 text-lg">Visão geral de todos os indicadores cadastrados</p>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 shadow-lg text-white">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-8 h-8 opacity-80" />
            <span className="text-xs font-semibold bg-white bg-opacity-20 px-2 py-1 rounded-full">Total</span>
          </div>
          <p className="text-3xl font-bold">{totalIndicadores}</p>
          <p className="text-sm text-blue-100 mt-1">Indicadores cadastrados</p>
          <div className="mt-2 text-xs text-blue-100">
            {indicadoresAtivos} ativos
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 shadow-lg text-white">
          <div className="flex items-center justify-between mb-3">
            <Target className="w-8 h-8 opacity-80" />
            <span className="text-xs font-semibold bg-white bg-opacity-20 px-2 py-1 rounded-full">Indicações</span>
          </div>
          <p className="text-3xl font-bold">{totalIndicacoes}</p>
          <p className="text-sm text-green-100 mt-1">Total de indicações</p>
          <div className="mt-2 text-xs text-green-100">
            {totalConvertidas} convertidas
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 shadow-lg text-white">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <span className="text-xs font-semibold bg-white bg-opacity-20 px-2 py-1 rounded-full">Performance</span>
          </div>
          <p className="text-3xl font-bold">{taxaConversaoMedia.toFixed(1)}%</p>
          <p className="text-sm text-orange-100 mt-1">Taxa conversão média</p>
          <div className="mt-2 text-xs text-orange-100">
            Desempenho geral
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 shadow-lg text-white">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-8 h-8 opacity-80" />
            <span className="text-xs font-semibold bg-white bg-opacity-20 px-2 py-1 rounded-full">Saldo</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(saldoTotalDisponivel)}</p>
          <p className="text-sm text-emerald-100 mt-1">Saldo disponível total</p>
          <div className="mt-2 text-xs text-emerald-100">
            Para saques
          </div>
        </div>
      </div>

      {/* Filtros e Ordenação */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Campo de Busca */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar por nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              {busca && (
                <button
                  onClick={() => setBusca('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="h-8 w-px bg-slate-300"></div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Filtrar:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFiltroAtivo('todos')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filtroAtivo === 'todos'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({totalIndicadores})
              </button>
              <button
                onClick={() => setFiltroAtivo('ativos')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filtroAtivo === 'ativos'
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Ativos ({indicadoresAtivos})
              </button>
              <button
                onClick={() => setFiltroAtivo('inativos')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filtroAtivo === 'inativos'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Inativos ({totalIndicadores - indicadoresAtivos})
              </button>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-300"></div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Ordenar por:</span>
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="indicacoes">Mais indicações</option>
              <option value="indicacoes-desc">Menos indicações</option>
              <option value="taxa">Maior taxa conversão</option>
              <option value="taxa-desc">Menor taxa conversão</option>
              <option value="saldo">Maior saldo</option>
              <option value="saldo-desc">Menor saldo</option>
              <option value="nome">Nome (A-Z)</option>
              <option value="nome-desc">Nome (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Indicadores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {indicadoresOrdenados.map((indicador, index) => (
          <div
            key={indicador.id}
            className="group relative overflow-hidden bg-white rounded-xl border-2 border-slate-200 hover:border-purple-300 transition-all duration-300 shadow-sm hover:shadow-lg"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 opacity-5 rounded-full -mr-16 -mt-16 group-hover:opacity-10 transition-opacity"></div>
            
            <div className="relative z-10 p-5">
              {/* Header do Card */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{indicador.nome}</h3>
                      {!indicador.ativo && (
                        <span className="text-xs text-red-600 font-semibold">Inativo</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{indicador.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{indicador.telefone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Cadastro: {formatDate(indicador.dataCadastro)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Métricas em Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-slate-600 font-medium">Indicações</span>
                  </div>
                  <p className="text-xl font-bold text-blue-600">{indicador.totalIndicacoes}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {indicador.indicacoesRespondidas} respondidas
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-slate-600 font-medium">Convertidas</span>
                  </div>
                  <p className="text-xl font-bold text-green-600">{indicador.indicacoesConvertidas}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {indicador.taxaConversao.toFixed(1)}% taxa
                  </p>
                </div>
              </div>

              {/* Saldos */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-3 border border-emerald-200 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-700">Financeiro</span>
                  </div>
                  <Award className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Disponível:</span>
                    <span className="text-sm font-bold text-emerald-600">{formatCurrency(indicador.saldoDisponivel)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Bloqueado:</span>
                    <span className="text-xs font-semibold text-orange-600">{formatCurrency(indicador.saldoBloqueado)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Total pago:</span>
                    <span className="text-xs font-semibold text-blue-600">{formatCurrency(indicador.totalPago)}</span>
                  </div>
                </div>
              </div>

              {/* Performance Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-slate-700">Performance</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  indicador.taxaConversao >= 18 
                    ? 'bg-green-100 text-green-700' 
                    : indicador.taxaConversao >= 15
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {indicador.taxaConversao >= 18 ? 'Excelente' : indicador.taxaConversao >= 15 ? 'Bom' : 'Regular'}
                </div>
              </div>

              {/* Último Acesso */}
              {indicador.ultimoAcesso && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Último acesso: {formatDate(indicador.ultimoAcesso)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mensagem quando não há resultados */}
      {indicadoresOrdenados.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-600 mb-2">Nenhum indicador encontrado</p>
          <p className="text-sm text-slate-500">Ajuste os filtros para ver mais resultados</p>
        </div>
      )}
    </div>
  );
}
