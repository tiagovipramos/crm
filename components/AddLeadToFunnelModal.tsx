'use client';

import { useState } from 'react';
import { X, User, Phone, Save } from 'lucide-react';

interface AddLeadToFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nome: string, telefone: string) => Promise<void>;
}

export default function AddLeadToFunnelModal({ isOpen, onClose, onSave }: AddLeadToFunnelModalProps) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  if (!isOpen) return null;

  const formatarTelefone = (valor: string) => {
    // Remove tudo que não é número
    const apenasNumeros = valor.replace(/\D/g, '');
    
    // Limita: DDD (2 dígitos) + número (8 dígitos) = 10 dígitos
    const limitado = apenasNumeros.substring(0, 10);
    
    return limitado;
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    const formatado = formatarTelefone(valor);
    setTelefone(formatado);
    setErro('');
  };

  const validarTelefone = (tel: string): boolean => {
    // Valida: deve ter DDD (2 dígitos) + número (8 dígitos)
    if (tel.length < 10) {
      setErro('Telefone incompleto. Digite DDD + 8 dígitos do número');
      return false;
    }

    const ddd = parseInt(tel.substring(0, 2));
    if (ddd < 11 || ddd > 99) {
      setErro('DDD inválido. Digite um DDD válido (11-99)');
      return false;
    }

    return true;
  };

  const handleSalvar = async () => {
    // Validações
    if (!nome.trim()) {
      setErro('Por favor, digite o nome do lead');
      return;
    }

    if (!telefone) {
      setErro('Por favor, digite o telefone');
      return;
    }

    if (!validarTelefone(telefone)) {
      return;
    }

    setSalvando(true);
    setErro('');

    try {
      // Concatenar 55 + telefone digitado
      const telefoneCompleto = '55' + telefone;
      await onSave(nome.trim(), telefoneCompleto);
      
      // Limpar campos após salvar
      setNome('');
      setTelefone('');
      setErro('');
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar lead:', error);
      
      // Tratar erros específicos
      if (error?.response?.status === 400) {
        const errorData = error.response.data;
        
        // Se o erro contém informações sobre lead existente
        if (errorData?.leadExistente) {
          setErro(`❌ Já existe um lead cadastrado com este telefone!\n\nNome: ${errorData.leadExistente.nome}\n\nPor favor, use um telefone diferente ou edite o lead existente.`);
        } else if (errorData?.error?.includes('telefone')) {
          setErro('❌ Já existe um lead cadastrado com este número de telefone. Por favor, use um telefone diferente.');
        } else {
          setErro(errorData?.error || '❌ Dados inválidos. Verifique as informações e tente novamente.');
        }
      } else if (error?.response?.status === 500) {
        setErro('❌ Erro no servidor. Por favor, tente novamente em alguns instantes.');
      } else {
        setErro(error?.message || '❌ Erro ao salvar o lead. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setSalvando(false);
    }
  };

  const handleFechar = () => {
    if (!salvando) {
      setNome('');
      setTelefone('');
      setErro('');
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !salvando) {
      handleSalvar();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#128C7E] to-[#075E54] px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Adicionar Lead</h2>
              <p className="text-white/80 text-sm">Novo lead será adicionado ao funil</p>
            </div>
          </div>
          <button
            onClick={handleFechar}
            disabled={salvando}
            className="p-2 hover:bg-white/10 rounded-full transition disabled:opacity-50"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  setErro('');
                }}
                onKeyPress={handleKeyPress}
                disabled={salvando}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#128C7E] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Digite o nome do lead"
                autoFocus
              />
            </div>
          </div>

          {/* Telefone WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone WhatsApp *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <span className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-700 font-mono font-semibold">
                +55
              </span>
              <input
                type="tel"
                value={telefone}
                onChange={handleTelefoneChange}
                onKeyPress={handleKeyPress}
                disabled={salvando}
                className="w-full pl-[4.5rem] pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#128C7E] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed font-mono"
                placeholder="8199999999"
                maxLength={10}
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              Digite apenas: DDD (2 dígitos) + número (8 dígitos)
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              Exemplo: 8188012255
            </p>
          </div>

          {/* Mensagem de Erro */}
          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{erro}</p>
            </div>
          )}

          {/* Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              💡 O lead será adicionado na primeira etapa do funil (Novo Lead) e você poderá movê-lo entre as etapas conforme o progresso.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3 rounded-b-xl">
          <button
            onClick={handleFechar}
            disabled={salvando}
            className="px-5 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="px-5 py-2.5 bg-[#128C7E] hover:bg-[#075E54] text-white rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {salvando ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Adicionar Lead</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
