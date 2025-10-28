'use client';

import { useEffect } from 'react';
import { X, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import { useProtecarStore } from '@/store/useProtecarStore';

interface WhatsAppQRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WhatsAppQRModal({ isOpen, onClose }: WhatsAppQRModalProps) {
  const consultorAtual = useProtecarStore(state => state.consultorAtual);
  const conectarWhatsApp = useProtecarStore(state => state.conectarWhatsApp);

  // Iniciar conexão quando o modal abrir
  useEffect(() => {
    if (isOpen && consultorAtual?.statusConexao === 'offline') {
      console.log('🚀 Modal aberto, iniciando conexão WhatsApp...');
      conectarWhatsApp();
    }
  }, [isOpen, consultorAtual?.statusConexao, conectarWhatsApp]);

  // Fechar modal quando conectar
  useEffect(() => {
    if (consultorAtual?.statusConexao === 'online') {
      console.log('✅ WhatsApp conectado! Fechando modal...');
      setTimeout(() => {
        onClose();
      }, 1500); // Dar tempo para ver a mensagem de sucesso
    }
  }, [consultorAtual?.statusConexao, onClose]);

  // Logs para debug
  useEffect(() => {
    if (isOpen) {
      console.log('📱 Modal QR Code aberto');
      console.log('Status atual:', consultorAtual?.statusConexao);
      console.log('Tem QR Code?', !!consultorAtual?.qrCode);
    }
  }, [isOpen, consultorAtual?.statusConexao, consultorAtual?.qrCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#075E54] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="w-6 h-6" />
            <h2 className="text-xl font-bold">Conectar WhatsApp</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {/* QR Code */}
          <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
            {consultorAtual?.statusConexao === 'online' ? (
              /* Conectado */
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                <p className="text-gray-900 font-bold">WhatsApp Conectado!</p>
              </div>
            ) : consultorAtual?.statusConexao === 'offline' && !consultorAtual?.qrCode ? (
              /* Erro */
              <div className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                <p className="text-gray-900 font-medium">Falha ao gerar QR Code</p>
                <p className="text-xs text-gray-400 mt-1">Verifique o backend (F12)</p>
              </div>
            ) : consultorAtual?.qrCode ? (
              /* QR Code */
              <div className="flex flex-col items-center">
                <img
                  src={consultorAtual.qrCode}
                  alt="QR Code WhatsApp"
                  className="w-56 h-56 rounded-lg"
                  onLoad={() => console.log('✅ QR Code renderizado')}
                />
                <div className="flex items-center gap-2 text-[#128C7E] mt-4">
                  <div className="w-2 h-2 bg-[#128C7E] rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Aguardando leitura...</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Escaneie com seu WhatsApp</p>
              </div>
            ) : (
              /* Gerando */
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#128C7E] mb-3"></div>
                <p className="text-gray-900 font-medium">Gerando QR Code...</p>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
