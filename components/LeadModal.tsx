'use client';

import { Lead } from '@/types';
import { X, Phone, Mail, MapPin, FileText, Link2, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useProtecarStore } from '@/store/useProtecarStore';

interface LeadModalProps {
  lead: Lead;
  onClose: () => void;
}

export default function LeadModal({ lead, onClose }: LeadModalProps) {
  const [activeTab, setActiveTab] = useState('atividades');
  const [activity, setActivity] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    nome: lead.nome,
    telefone: lead.telefone,
    email: lead.email,
    cidade: lead.cidade,
    modeloVeiculo: lead.modeloVeiculo,
    placaVeiculo: lead.placaVeiculo,
    corVeiculo: lead.corVeiculo,
    anoVeiculo: lead.anoVeiculo?.toString() || '',
    observacoes: lead.observacoes,
    informacoesComerciais: lead.informacoesComerciais
  });
  
  const { consultorAtual, atualizarLead } = useProtecarStore();

  const tabs = [
    { id: 'atividades', label: 'Atividades' },
    { id: 'associado', label: 'Associado' },
    { id: 'cotacao', label: 'Cotação' },
  ];

  const handleSave = async () => {
    if (!editData.nome || !editData.telefone) {
      alert('Nome e telefone são obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      // Converter anoVeiculo para number se houver valor
      const dataToSave = {
        ...editData,
        anoVeiculo: editData.anoVeiculo ? parseInt(editData.anoVeiculo) : undefined
      };
      
      console.log('🔍 DEBUG - Dados antes de salvar:', editData);
      console.log('🔍 DEBUG - Dados processados:', dataToSave);
      console.log('🔍 DEBUG - PlacaVeiculo:', dataToSave.placaVeiculo);
      
      await atualizarLead(lead.id, dataToSave);
      alert('Lead atualizado com sucesso!');
      
      // Fechar o modal após salvar para forçar refresh dos dados
      onClose();
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      alert('Erro ao salvar as alterações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">{lead.origem || 'Origem não informada'}</p>
                <h2 className="text-lg font-semibold text-gray-900">{lead.nome}</h2>
                <p className="text-sm text-gray-600">{lead.telefone}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">ID: {lead.id}</span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex gap-6 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex gap-6 p-6">
            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {activeTab === 'atividades' && (
                <>
                  {/* Nova Atividade */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Atividades</h3>
                    
                    <div className="flex gap-4 mb-4">
                      <button className="p-2 hover:bg-blue-50 rounded transition-colors" title="Ligar">
                        <Phone className="w-5 h-5 text-blue-600" />
                      </button>
                      <button className="p-2 hover:bg-blue-50 rounded transition-colors" title="WhatsApp">
                        <Phone className="w-5 h-5 text-green-600" />
                      </button>
                      <button className="p-2 hover:bg-blue-50 rounded transition-colors" title="Email">
                        <Mail className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-blue-50 rounded transition-colors" title="Local">
                        <MapPin className="w-5 h-5 text-red-600" />
                      </button>
                      <button className="p-2 hover:bg-blue-50 rounded transition-colors" title="Tarefa">
                        <FileText className="w-5 h-5 text-orange-600" />
                      </button>
                      <button className="p-2 hover:bg-blue-50 rounded transition-colors" title="Anexo">
                        <Link2 className="w-5 h-5 text-purple-600" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">Responsável</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>{consultorAtual?.nome} (Você)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">Lembrete</label>
                        <input
                          type="datetime-local"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="text-sm text-gray-600 mb-1 block">O que pretende fazer</label>
                      <textarea
                        value={activity}
                        onChange={(e) => setActivity(e.target.value)}
                        placeholder="Descreva a atividade..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium">
                      Salvar
                    </button>
                  </div>

                  {/* Lista de Atividades */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Atividades</h3>
                    <div className="flex items-center justify-center py-8 text-gray-400">
                      <div className="text-center">
                        <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Sem atividades nesta negociação.</p>
                      </div>
                    </div>
                  </div>

                  {/* Histórico */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Histórico</h3>
                    <div className="flex items-center justify-center py-8 text-gray-400">
                      <div className="text-center">
                        <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Sem histórico nesta negociação.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'associado' && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Dados do Lead</h3>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Editar
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Nome</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.nome}
                          onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="font-medium">{lead.nome}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Telefone</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.telefone}
                          onChange={(e) => setEditData({ ...editData, telefone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="font-medium">{lead.telefone}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">E-mail</label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editData.email || ''}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="font-medium">{lead.email || 'Não informado'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Cidade</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.cidade || ''}
                          onChange={(e) => setEditData({ ...editData, cidade: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="font-medium">{lead.cidade || 'Não informada'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Modelo do Veículo</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.modeloVeiculo || ''}
                          onChange={(e) => setEditData({ ...editData, modeloVeiculo: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="font-medium">{lead.modeloVeiculo || 'Não informado'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Ano do Veículo</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.anoVeiculo || ''}
                          onChange={(e) => setEditData({ ...editData, anoVeiculo: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="font-medium">{lead.anoVeiculo || 'Não informado'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Placa</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.placaVeiculo || ''}
                          onChange={(e) => {
                            console.log('🚗 Placa digitada:', e.target.value);
                            setEditData({ ...editData, placaVeiculo: e.target.value });
                            console.log('🚗 Estado após atualizar:', { ...editData, placaVeiculo: e.target.value });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Digite a placa do veículo"
                        />
                      ) : (
                        <p className="font-medium">{lead.placaVeiculo || 'Não informada'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Cor do Veículo</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.corVeiculo || ''}
                          onChange={(e) => setEditData({ ...editData, corVeiculo: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="font-medium">{lead.corVeiculo || 'Não informada'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Observações</label>
                      {isEditing ? (
                        <textarea
                          value={editData.observacoes || ''}
                          onChange={(e) => setEditData({ ...editData, observacoes: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="font-medium text-gray-700 whitespace-pre-wrap">{lead.observacoes || 'Nenhuma observação'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Informações Comerciais</label>
                      {isEditing ? (
                        <textarea
                          value={editData.informacoesComerciais || ''}
                          onChange={(e) => setEditData({ ...editData, informacoesComerciais: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="font-medium text-gray-700 whitespace-pre-wrap">{lead.informacoesComerciais || 'Nenhuma informação comercial'}</p>
                      )}
                    </div>
                  </div>
                  
                  {isEditing && (
                    <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isSaving ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditData({
                            nome: lead.nome,
                            telefone: lead.telefone,
                            email: lead.email,
                            cidade: lead.cidade,
                            modeloVeiculo: lead.modeloVeiculo,
                            placaVeiculo: lead.placaVeiculo,
                            corVeiculo: lead.corVeiculo,
                            anoVeiculo: lead.anoVeiculo?.toString() || '',
                            observacoes: lead.observacoes,
                            informacoesComerciais: lead.informacoesComerciais
                          });
                        }}
                        disabled={isSaving}
                        className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'cotacao' && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Cotação</h3>
                  <div className="flex items-center justify-center py-12 text-gray-400">
                    <div className="text-center">
                      <FileText className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm font-medium mb-1">Nenhuma cotação disponível</p>
                      <p className="text-xs text-gray-500">Envie uma proposta para o lead visualizar.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="w-80 space-y-4">
              {/* Responsável */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <label className="text-sm text-gray-600 mb-2 block">Responsável</label>
                <p className="font-medium">{consultorAtual?.nome}</p>
              </div>

              {/* Status */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <label className="text-sm text-gray-600 mb-2 block">Status</label>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    lead.status === 'novo' ? 'bg-blue-500' :
                    lead.status === 'primeiro_contato' ? 'bg-purple-500' :
                    lead.status === 'proposta_enviada' ? 'bg-yellow-500' :
                    lead.status === 'convertido' ? 'bg-green-500' :
                    'bg-gray-500'
                  }`}></div>
                  <span className="font-medium capitalize">{lead.status.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Origem do Lead */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <label className="text-sm text-gray-600 mb-2 block">Origem</label>
                <p className="font-medium">{lead.origem || 'Não informado'}</p>
              </div>

              {/* Mensagens não lidas */}
              {lead.mensagensNaoLidas > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <label className="text-sm text-gray-600 mb-2 block">Mensagens não lidas</label>
                  <p className="text-2xl font-bold text-blue-600">{lead.mensagensNaoLidas}</p>
                </div>
              )}

              {/* Tags */}
              {lead.tags && lead.tags.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <label className="text-sm text-gray-600 mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {lead.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Datas */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <label className="text-sm text-gray-600 mb-2 block">Informações</label>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Criado em:</span>
                    <p className="font-medium">{new Date(lead.dataCriacao).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Atualizado em:</span>
                    <p className="font-medium">{new Date(lead.dataAtualizacao).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
