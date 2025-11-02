'use client';

import { useState } from 'react';
import { useProtecarStore } from '@/store/useProtecarStore';
import { Phone, Car, MessageSquare, Plus, GripVertical, X, Save, User, DollarSign, Tag, Trash2 } from 'lucide-react';
import type { Lead } from '@/types';
import AddLeadToFunnelModal from '@/components/AddLeadToFunnelModal';

export default function FunilView() {
  const {
    configuracao,
    getLeadsDoConsultor,
    moverLeadStatus,
    selecionarLead,
    setViewMode,
    atualizarLead,
    deletarLead,
    criarLead
  } = useProtecarStore();

  const [modalAberta, setModalAberta] = useState(false);
  const [leadEditando, setLeadEditando] = useState<Lead | null>(null);
  const [modalAdicionarAberta, setModalAdicionarAberta] = useState(false);

  const leads = getLeadsDoConsultor();
  const etapas = configuracao.etapasFunil.sort((a, b) => a.ordem - b.ordem);

  const getLeadsPorEtapa = (etapaId: string) => {
    return leads.filter(lead => lead.status === etapaId);
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, novoStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      moverLeadStatus(leadId, novoStatus as Lead['status']);
    }
  };

  const abrirChat = (lead: Lead) => {
    selecionarLead(lead.id);
    setViewMode('chat');
  };

  const handleDeletarLead = async (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const confirmacao = confirm(
      `⚠️ Tem certeza que deseja excluir este lead?\n\n` +
      `Nome: ${lead.nome}\n` +
      `Telefone: ${lead.telefone}\n\n` +
      `Esta ação não pode ser desfeita!`
    );

    if (!confirmacao) return;

    try {
      await deletarLead(lead.id);
      console.log('✅ Lead deletado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao deletar lead:', error);
      alert('Erro ao deletar o lead. Tente novamente.');
    }
  };

  const abrirModalEdicao = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    setLeadEditando(lead);
    setModalAberta(true);
  };

  const fecharModal = () => {
    setModalAberta(false);
    setLeadEditando(null);
  };

  const salvarLead = async () => {
    if (!leadEditando) return;
    
    console.log('Salvando lead:', leadEditando);
    
    try {
      await atualizarLead(leadEditando.id, leadEditando);
      console.log('✅ Lead salvo com sucesso!');
      fecharModal();
    } catch (error) {
      console.error('❌ Erro ao salvar lead:', error);
      alert('Erro ao salvar as alterações. Tente novamente.');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const etapa = etapas.find(e => e.id === status);
    return etapa?.cor || '#6B7280';
  };

  const getOrigemIcon = (origem: string) => {
    switch (origem) {
      case 'WhatsApp': return '💬';
      case 'Facebook': return '👥';
      case 'Instagram': return '📷';
      case 'Google': return '🔍';
      case 'Indicação': return '👋';
      default: return '📞';
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-hidden">
      {/* Header Compacto */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Funil de Vendas</h1>
            <p className="text-sm text-gray-600">Total: {leads.length} leads</p>
          </div>
          
          {/* Estatísticas e Botão */}
          <div className="flex items-center gap-6">
            {/* Estatísticas Inline */}
            <div className="flex items-center gap-4">
            {etapas.slice(0, 3).map((etapa) => {
              const count = getLeadsPorEtapa(etapa.id).length;
              return (
                <div key={etapa.id} className="text-center">
                  <div className="text-lg font-bold" style={{ color: etapa.cor }}>{count}</div>
                  <div className="text-xs text-gray-600">{etapa.nome}</div>
                </div>
              );
            })}
            </div>
            
            <button 
              onClick={() => setModalAdicionarAberta(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#128C7E] hover:bg-[#075E54] text-white rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">Adicionar Lead</span>
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board - Scroll Vertical no lado direito */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
        <div className="flex flex-wrap gap-3">
          {etapas.map((etapa) => {
            const leadsEtapa = getLeadsPorEtapa(etapa.id);

            return (
              <div
                key={etapa.id}
                className="flex flex-col w-64 bg-white rounded-lg shadow-sm"
                style={{ minHeight: '400px' }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, etapa.id)}
              >
                {/* Header da Coluna - Compacto */}
                <div
                  className="px-3 py-2 border-b-2"
                  style={{ borderColor: etapa.cor }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-gray-900">{etapa.nome}</h3>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: etapa.cor }}
                    >
                      {leadsEtapa.length}
                    </span>
                  </div>
                </div>

                {/* Lista de Cards */}
                <div className="flex-1 p-2 space-y-2">
                  {leadsEtapa.length === 0 ? (
                    <div className="text-center py-4 text-gray-400">
                      <p className="text-xs">Vazio</p>
                    </div>
                  ) : (
                    leadsEtapa.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className="relative bg-white border border-gray-200 rounded-md p-2.5 shadow-sm hover:shadow-md transition-shadow cursor-move group"
                      >
                        {/* Grip Icon */}
                        <GripVertical className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 left-1" />
                        
                        <div className="pl-3">
                          {/* Nome e Origem */}
                          <div className="flex items-start justify-between mb-1.5">
                            <h4 
                              onClick={(e) => abrirModalEdicao(lead, e)}
                              className="font-semibold text-sm text-gray-900 truncate pr-2 cursor-pointer hover:text-[#128C7E] transition"
                            >
                              {lead.nome}
                            </h4>
                            <span className="text-base flex-shrink-0" title={lead.origem}>
                              {getOrigemIcon(lead.origem)}
                            </span>
                          </div>

                          {/* Informações Compactas */}
                          <div className="space-y-1 mb-2">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Phone className="w-3 h-3" />
                              <span className="truncate">{lead.telefone}</span>
                            </div>

                            {(lead.modeloVeiculo || lead.placaVeiculo) && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <Car className="w-3 h-3" />
                                <span className="truncate">
                                  {lead.modeloVeiculo || 'Veículo'}
                                  {lead.placaVeiculo && <span className="font-semibold"> - {lead.placaVeiculo}</span>}
                                </span>
                              </div>
                            )}

                            {(lead.fipe || lead.mensalidade) && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <DollarSign className="w-3 h-3" />
                                <span className="truncate">
                                  {lead.fipe && <span>FIPE: {Number(lead.fipe).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
                                  {lead.fipe && lead.mensalidade && <span className="font-semibold"> - R$ </span>}
                                  {lead.mensalidade && <span>{Number(lead.mensalidade).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Última Mensagem */}
                          {lead.ultimaMensagem && (
                            <div className="mb-2 p-1.5 bg-gray-50 rounded text-xs text-gray-600 truncate">
                              "{lead.ultimaMensagem}"
                            </div>
                          )}

                          {/* Botões de Ação */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => abrirChat(lead)}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-[#128C7E] hover:bg-[#075E54] text-white text-xs rounded transition"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Abrir</span>
                            </button>
                            <button
                              onClick={(e) => handleDeletarLead(lead, e)}
                              className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition"
                              title="Excluir lead"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Badge de mensagens não lidas */}
                          {lead.mensagensNaoLidas > 0 && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                              {lead.mensagensNaoLidas}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Adicionar Lead ao Funil */}
      <AddLeadToFunnelModal
        isOpen={modalAdicionarAberta}
        onClose={() => setModalAdicionarAberta(false)}
        onSave={async (nome, telefone) => {
          try {
            console.log('🆕 Criando novo lead no funil:', { nome, telefone });
            
            await criarLead({
              nome,
              telefone,
              origem: 'WhatsApp',
              status: 'novo',
              consultorId: configuracao.id,
              mensagensNaoLidas: 0
            });
            
            console.log('✅ Lead adicionado ao funil com sucesso!');
          } catch (error) {
            console.error('❌ Erro ao adicionar lead:', error);
            throw error;
          }
        }}
      />

      {/* Modal de Edição de Lead */}
      {modalAberta && leadEditando && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header da Modal */}
            <div className="bg-gradient-to-r from-[#128C7E] to-[#075E54] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Editar Lead</h2>
                  <p className="text-white/80 text-sm">Gerencie as informações do cliente</p>
                </div>
              </div>
              <button
                onClick={fecharModal}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Conteúdo da Modal */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informações Pessoais */}
                <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-[#128C7E]" />
                    Informações Pessoais
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        value={leadEditando.nome}
                        onChange={(e) => setLeadEditando({ ...leadEditando, nome: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#128C7E] focus:border-transparent"
                        placeholder="Digite o nome completo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        value={leadEditando.telefone}
                        onChange={(e) => setLeadEditando({ ...leadEditando, telefone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#128C7E] focus:border-transparent"
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={leadEditando.email || ''}
                        onChange={(e) => setLeadEditando({ ...leadEditando, email: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#128C7E] focus:border-transparent"
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={leadEditando.cidade || ''}
                        onChange={(e) => setLeadEditando({ ...leadEditando, cidade: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#128C7E] focus:border-transparent"
                        placeholder="Cidade"
                      />
                    </div>
                  </div>
                </div>

                {/* Informações do Veículo */}
                <div className="md:col-span-2 bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-600" />
                    Informações do Veículo
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Modelo do Veículo
                      </label>
                      <input
                        type="text"
                        value={leadEditando.modeloVeiculo || ''}
                        onChange={(e) => setLeadEditando({ ...leadEditando, modeloVeiculo: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Honda Civic 2020"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Placa do Veículo
                      </label>
                      <input
                        type="text"
                        value={leadEditando.placaVeiculo || ''}
                        onChange={(e) => setLeadEditando({ ...leadEditando, placaVeiculo: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                        placeholder="ABC-1234"
                        maxLength={8}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ano do Veículo
                      </label>
                      <input
                        type="text"
                        value={leadEditando.anoVeiculo?.toString() || ''}
                        onChange={(e) => setLeadEditando({ ...leadEditando, anoVeiculo: parseInt(e.target.value) || undefined })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="2023"
                        maxLength={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cor do Veículo
                      </label>
                      <input
                        type="text"
                        value={leadEditando.corVeiculo || ''}
                        onChange={(e) => setLeadEditando({ ...leadEditando, corVeiculo: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Preto"
                      />
                    </div>
                  </div>
                </div>

                {/* Informações Comerciais */}
                <div className="md:col-span-2 bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Informações Comerciais
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mensalidade
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                        <input
                          type="text"
                          value={leadEditando.mensalidade ? Number(leadEditando.mensalidade).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                          onChange={(e) => {
                            const valor = e.target.value.replace(/\D/g, '');
                            const numero = valor ? parseFloat(valor) / 100 : undefined;
                            setLeadEditando({ ...leadEditando, mensalidade: numero });
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="0,00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        FIPE
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                        <input
                          type="text"
                          value={leadEditando.fipe ? Number(leadEditando.fipe).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                          onChange={(e) => {
                            const valor = e.target.value.replace(/\D/g, '');
                            const numero = valor ? parseFloat(valor) / 100 : undefined;
                            setLeadEditando({ ...leadEditando, fipe: numero });
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="0,00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Plano
                      </label>
                      <select
                        value={leadEditando.plano || ''}
                        onChange={(e) => setLeadEditando({ ...leadEditando, plano: e.target.value as Lead['plano'] })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Selecione</option>
                        <option value="START">START</option>
                        <option value="VIP">VIP</option>
                        <option value="TOP">TOP</option>
                        <option value="PREMIUM">PREMIUM</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observações Comerciais
                      </label>
                      <textarea
                        value={leadEditando.informacoesComerciais || ''}
                        onChange={(e) => setLeadEditando({ ...leadEditando, informacoesComerciais: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                        rows={2}
                        placeholder="Outras informações comerciais relevantes..."
                      />
                    </div>
                  </div>
                </div>

                {/* Outras Informações */}
                <div className="md:col-span-2 bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-purple-600" />
                    Outras Informações
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Origem do Lead
                      </label>
                      <select
                        value={leadEditando.origem}
                        onChange={(e) => setLeadEditando({ ...leadEditando, origem: e.target.value as Lead['origem'] })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Google">Google</option>
                        <option value="Indicação">Indicação</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={leadEditando.status}
                        onChange={(e) => setLeadEditando({ ...leadEditando, status: e.target.value as Lead['status'] })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        {etapas.map((etapa) => (
                          <option key={etapa.id} value={etapa.id}>{etapa.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observações
                      </label>
                      <textarea
                        value={leadEditando.observacoes || ''}
                        onChange={(e) => setLeadEditando({ ...leadEditando, observacoes: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        rows={3}
                        placeholder="Adicione observações sobre o lead..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer da Modal */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Última atualização:</span> {new Date(leadEditando.dataAtualizacao).toLocaleDateString('pt-BR')}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={fecharModal}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarLead}
                  className="px-6 py-2.5 bg-[#128C7E] hover:bg-[#075E54] text-white rounded-lg font-medium transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
