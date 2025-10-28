'use client';

import { useState } from 'react';
import { useProtecarStore } from '@/store/useProtecarStore';
import { FileText, Plus, Send, Eye, Check, X, DollarSign, Shield } from 'lucide-react';

export default function PropostasView() {
  const {
    propostas,
    getLeadsDoConsultor,
    configuracao,
    criarProposta,
    enviarProposta,
    consultorAtual
  } = useProtecarStore();

  const [mostrarModal, setMostrarModal] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'rascunho' | 'enviada' | 'aceita'>('todas');

  const leads = getLeadsDoConsultor();
  const propostasDoConsultor = propostas.filter(p => p.consultorId === consultorAtual?.id);

  const propostasFiltradas = propostasDoConsultor.filter(p => {
    if (filtroStatus === 'todas') return true;
    return p.status === filtroStatus;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      rascunho: { label: 'Rascunho', color: 'bg-gray-500' },
      enviada: { label: 'Enviada', color: 'bg-blue-500' },
      visualizada: { label: 'Visualizada', color: 'bg-yellow-500' },
      aceita: { label: 'Aceita', color: 'bg-green-500' },
      recusada: { label: 'Recusada', color: 'bg-red-500' }
    };
    return badges[status as keyof typeof badges] || badges.rascunho;
  };

  const getPlanoNome = (tipo: string) => {
    const plano = configuracao.planosProtecao.find(p => p.tipo === tipo);
    return plano?.nome || tipo;
  };

  return (
    <div className="h-full bg-gray-50 p-6 overflow-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Propostas</h1>
          <p className="text-gray-600">Gerencie propostas de proteção veicular</p>
        </div>
        
        <button
          onClick={() => setMostrarModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#128C7E] hover:bg-[#075E54] text-white rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Proposta</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex gap-2">
        {[
          { id: 'todas', label: 'Todas' },
          { id: 'rascunho', label: 'Rascunhos' },
          { id: 'enviada', label: 'Enviadas' },
          { id: 'aceita', label: 'Aceitas' }
        ].map((filtro) => (
          <button
            key={filtro.id}
            onClick={() => setFiltroStatus(filtro.id as any)}
            className={`
              px-4 py-2 rounded-lg font-medium transition
              ${filtroStatus === filtro.id
                ? 'bg-[#128C7E] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
              }
            `}
          >
            {filtro.label}
          </button>
        ))}
      </div>

      {/* Cards de Propostas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {propostasFiltradas.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma proposta encontrada</p>
          </div>
        ) : (
          propostasFiltradas.map((proposta) => {
            const lead = leads.find(l => l.id === proposta.leadId);
            const statusBadge = getStatusBadge(proposta.status);
            
            return (
              <div key={proposta.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{lead?.nome || 'Lead desconhecido'}</h3>
                    <p className="text-sm text-gray-500">{lead?.telefone}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium text-white ${statusBadge.color}`}>
                    {statusBadge.label}
                  </span>
                </div>

                {/* Plano */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-[#128C7E]" />
                    <span className="font-semibold text-gray-900">{getPlanoNome(proposta.plano)}</span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Valor Mensal:</span>
                      <span className="font-semibold">R$ {proposta.valorMensal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Franquia:</span>
                      <span className="font-semibold">R$ {proposta.franquia.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Coberturas */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Coberturas:</p>
                  <div className="flex flex-wrap gap-1">
                    {proposta.coberturas.slice(0, 3).map((cobertura, i) => (
                      <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                        {cobertura}
                      </span>
                    ))}
                    {proposta.coberturas.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{proposta.coberturas.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Datas */}
                {proposta.dataEnvio && (
                  <p className="text-xs text-gray-500 mb-3">
                    Enviada em {new Date(proposta.dataEnvio).toLocaleDateString('pt-BR')}
                  </p>
                )}

                {/* Ações */}
                <div className="flex gap-2">
                  {proposta.status === 'rascunho' ? (
                    <button
                      onClick={() => enviarProposta(proposta.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#128C7E] hover:bg-[#075E54] text-white text-sm rounded-lg transition"
                    >
                      <Send className="w-4 h-4" />
                      <span>Enviar</span>
                    </button>
                  ) : (
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition">
                      <Eye className="w-4 h-4" />
                      <span>Ver Detalhes</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Estatísticas */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{propostasDoConsultor.length}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Enviadas</p>
              <p className="text-2xl font-bold text-blue-600">
                {propostasDoConsultor.filter(p => p.status === 'enviada' || p.status === 'visualizada').length}
              </p>
            </div>
            <Send className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aceitas</p>
              <p className="text-2xl font-bold text-green-600">
                {propostasDoConsultor.filter(p => p.status === 'aceita').length}
              </p>
            </div>
            <Check className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa Conversão</p>
              <p className="text-2xl font-bold text-[#128C7E]">
                {propostasDoConsultor.length > 0
                  ? Math.round((propostasDoConsultor.filter(p => p.status === 'aceita').length / propostasDoConsultor.length) * 100)
                  : 0}%
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-[#128C7E]" />
          </div>
        </div>
      </div>
    </div>
  );
}
