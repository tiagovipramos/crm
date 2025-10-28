'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { useProtecarStore } from '@/store/useProtecarStore';

interface AddLeadModalProps {
  onClose: () => void;
}

export default function AddLeadModal({ onClose }: AddLeadModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    cidade: '',
    modeloVeiculo: '',
    placaVeiculo: '',
    anoVeiculo: '',
    observacoes: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  
  const { criarLead } = useProtecarStore();

  const handleSave = async () => {
    if (!formData.nome || !formData.telefone) {
      alert('Nome e telefone são obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      // Criar o lead - a função criarLead preenche automaticamente consultorId, status e mensagensNaoLidas
      await criarLead({
        nome: formData.nome,
        telefone: formData.telefone,
        email: formData.email || undefined,
        cidade: formData.cidade || undefined,
        modeloVeiculo: formData.modeloVeiculo || undefined,
        placaVeiculo: formData.placaVeiculo || undefined,
        anoVeiculo: formData.anoVeiculo ? parseInt(formData.anoVeiculo) : undefined,
        origem: 'Manual',
        observacoes: formData.observacoes || undefined,
        // Campos preenchidos automaticamente mas necessários para o tipo:
        status: 'novo',
        consultorId: '', // Será sobrescrito pela função
        mensagensNaoLidas: 0
      } as any);
      
      alert('Lead adicionado com sucesso!');
      onClose();
    } catch (error: any) {
      console.error('Erro ao criar lead:', error);
      
      // Verificar se é erro de telefone duplicado
      const errorMessage = error?.response?.data?.error || error?.message || '';
      const leadExistente = error?.response?.data?.leadExistente;
      
      if (errorMessage.includes('Já existe um lead') || errorMessage.includes('telefone')) {
        if (leadExistente) {
          alert(`❌ Erro: Já existe um lead com este telefone!\n\nLead existente: ${leadExistente.nome}\n\nNão é possível criar leads duplicados.`);
        } else {
          alert('❌ Erro: Já existe um lead cadastrado com este número de telefone.\n\nVerifique o funil de vendas para localizar o lead existente.');
        }
      } else {
        alert('Erro ao adicionar o lead. Tente novamente.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Adicionar Novo Lead</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Telefone <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">E-mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Cidade</label>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="Cidade"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="text-sm text-gray-600 mb-1 block">Modelo do Veículo</label>
                <input
                  type="text"
                  value={formData.modeloVeiculo}
                  onChange={(e) => setFormData({ ...formData, modeloVeiculo: e.target.value })}
                  placeholder="Ex: Honda Civic"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Ano</label>
                <input
                  type="text"
                  value={formData.anoVeiculo}
                  onChange={(e) => setFormData({ ...formData, anoVeiculo: e.target.value })}
                  placeholder="2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Placa do Veículo</label>
              <input
                type="text"
                value={formData.placaVeiculo}
                onChange={(e) => setFormData({ ...formData, placaVeiculo: e.target.value })}
                placeholder="ABC-1234"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Observações</label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Informações adicionais sobre o lead..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Adicionando...' : 'Adicionar Lead'}
          </button>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
