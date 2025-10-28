'use client';

import { useAdminStore } from '@/store/useAdminStore';
import { DollarSign, Check, X, TrendingUp, Clock, CheckCircle, XCircle, Calendar, Mail, User } from 'lucide-react';
import { useState } from 'react';

export default function FinanceiroView() {
  const solicitacoesSaque = useAdminStore((state) => state.solicitacoesSaque);
  const aprovarSaque = useAdminStore((state) => state.aprovarSaque);
  const rejeitarSaque = useAdminStore((state) => state.rejeitarSaque);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [saqueRejeitando, setSaqueRejeitando] = useState<number | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleAprovar = (id: number) => {
    if (confirm('Confirma a aprovação deste saque?')) {
      aprovarSaque(id);
    }
  };

  const handleRejeitar = (id: number) => {
    if (motivoRejeicao.trim()) {
      rejeitarSaque(id, motivoRejeicao);
      setMotivoRejeicao('');
      setSaqueRejeitando(null);
    }
  };

  const saquesPendentes = solicitacoesSaque.filter(s => s.status === 'pendente');
  const saquesAprovados = solicitacoesSaque.filter(s => s.status === 'aprovado');
  const saquesRejeitados = solicitacoesSaque.filter(s => s.status === 'rejeitado');

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header com gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <TrendingUp className="w-8 h-8" />
            Gestão Financeira
          </h2>
          <p className="text-blue-100 text-lg">Gerenciamento de saques e comissões</p>
        </div>
      </div>

      {/* Cards de Estatísticas Premium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Pendentes */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-white bg-opacity-20 backdrop-blur-sm">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <span className="px-3 py-1 rounded-full bg-white bg-opacity-20 text-white text-xs font-semibold backdrop-blur-sm">
                Em Análise
              </span>
            </div>
            <p className="text-orange-100 text-sm font-medium mb-1">Saques Pendentes</p>
            <p className="text-4xl font-bold text-white mb-3">{saquesPendentes.length}</p>
            <div className="flex items-center justify-between pt-3 border-t border-white border-opacity-20">
              <span className="text-orange-100 text-xs">Valor Total</span>
              <span className="text-white font-bold">
                {formatCurrency(saquesPendentes.reduce((acc, s) => acc + s.valor, 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Card Aprovados */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-white bg-opacity-20 backdrop-blur-sm">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <span className="px-3 py-1 rounded-full bg-white bg-opacity-20 text-white text-xs font-semibold backdrop-blur-sm">
                Processados
              </span>
            </div>
            <p className="text-green-100 text-sm font-medium mb-1">Saques Aprovados</p>
            <p className="text-4xl font-bold text-white mb-3">{saquesAprovados.length}</p>
            <div className="flex items-center justify-between pt-3 border-t border-white border-opacity-20">
              <span className="text-green-100 text-xs">Valor Total</span>
              <span className="text-white font-bold">
                {formatCurrency(saquesAprovados.reduce((acc, s) => acc + s.valor, 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Card Rejeitados */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-white bg-opacity-20 backdrop-blur-sm">
                <XCircle className="w-7 h-7 text-white" />
              </div>
              <span className="px-3 py-1 rounded-full bg-white bg-opacity-20 text-white text-xs font-semibold backdrop-blur-sm">
                Recusados
              </span>
            </div>
            <p className="text-red-100 text-sm font-medium mb-1">Saques Rejeitados</p>
            <p className="text-4xl font-bold text-white mb-3">{saquesRejeitados.length}</p>
            <div className="flex items-center justify-between pt-3 border-t border-white border-opacity-20">
              <span className="text-red-100 text-xs">Valor Total</span>
              <span className="text-white font-bold">
                {formatCurrency(saquesRejeitados.reduce((acc, s) => acc + s.valor, 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Saques Pendentes - Layout em Grid 3 Colunas */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Saques Pendentes</h3>
                <p className="text-xs text-slate-600">Aguardando aprovação</p>
              </div>
            </div>
            {saquesPendentes.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-orange-500 text-white font-bold text-xs shadow-lg">
                {saquesPendentes.length} pendente{saquesPendentes.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        
        <div className="p-6">
          {saquesPendentes.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block p-4 rounded-full bg-slate-100 mb-3">
                <CheckCircle className="w-12 h-12 text-slate-400" />
              </div>
              <p className="text-lg font-semibold text-slate-600 mb-1">Tudo em dia!</p>
              <p className="text-sm text-slate-500">Nenhum saque pendente no momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {saquesPendentes.map((saque) => (
                <div key={saque.id} className="group relative overflow-hidden bg-gradient-to-br from-white to-slate-50 rounded-xl border-2 border-slate-200 hover:border-orange-300 transition-all duration-300 shadow-sm hover:shadow-md">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500 opacity-5 rounded-full -mr-12 -mt-12 group-hover:opacity-10 transition-opacity"></div>
                  
                  <div className="relative z-10 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 rounded-lg bg-blue-100">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <p className="font-bold text-sm text-slate-800">{saque.indicadorNome}</p>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate">{saque.indicadorEmail}</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(saque.dataSolicitacao).toLocaleDateString('pt-BR', { 
                              day: '2-digit', 
                              month: 'short'
                            })} às {new Date(saque.dataSolicitacao).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center mb-3 py-2 bg-orange-50 rounded-lg">
                      <p className="text-xs text-slate-600 mb-0.5">Valor Solicitado</p>
                      <p className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                        {formatCurrency(saque.valor)}
                      </p>
                    </div>

                    {saqueRejeitando === saque.id ? (
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-red-900">
                          Motivo da Rejeição
                        </label>
                        <textarea
                          value={motivoRejeicao}
                          onChange={(e) => setMotivoRejeicao(e.target.value)}
                          placeholder="Descreva o motivo..."
                          rows={2}
                          className="w-full px-3 py-2 text-sm border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRejeitar(saque.id)}
                            disabled={!motivoRejeicao.trim()}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow hover:shadow-md"
                          >
                            <XCircle className="w-4 h-4" />
                            Confirmar
                          </button>
                          <button
                            onClick={() => {
                              setSaqueRejeitando(null);
                              setMotivoRejeicao('');
                            }}
                            className="px-3 py-2 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all font-semibold"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAprovar(saque.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow hover:shadow-md"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Aprovar
                        </button>
                        <button
                          onClick={() => setSaqueRejeitando(saque.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow hover:shadow-md"
                        >
                          <XCircle className="w-4 h-4" />
                          Rejeitar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Histórico de Saques Aprovados - Layout Compacto */}
      {saquesAprovados.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Histórico de Aprovações</h3>
                <p className="text-xs text-slate-600">Últimos saques processados</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {saquesAprovados.slice(0, 6).map((saque, index) => (
                <div 
                  key={saque.id} 
                  className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 hover:border-green-300 transition-all duration-300 hover:shadow-md"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-full bg-green-500 shadow-lg flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 text-sm truncate">{saque.indicadorNome}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-600 truncate">
                          Por <span className="font-semibold text-green-700">{saque.processadoPorNome}</span>
                        </span>
                        <span className="text-xs text-slate-500 flex-shrink-0">
                          {saque.dataProcessamento && new Date(saque.dataProcessamento).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-lg font-bold text-green-600">{formatCurrency(saque.valor)}</p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-green-500 text-white text-xs font-semibold">
                      Aprovado
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
