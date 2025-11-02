'use client';

import { useState } from 'react';
import { useProtecarStore } from '@/store/useProtecarStore';
import { Smartphone } from 'lucide-react';
import WhatsAppQRModal from '@/components/WhatsAppQRModal';

export default function ConfiguracoesView() {
  const { consultorAtual } = useProtecarStore();
  const [mostrarModalQR, setMostrarModalQR] = useState(false);

  return (
    <>
      <WhatsAppQRModal isOpen={mostrarModalQR} onClose={() => setMostrarModalQR(false)} />
      
      <div className="h-full bg-gray-50 flex">
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Conexão WhatsApp</h3>
                  <p className="text-sm text-gray-600">Conecte seu WhatsApp ao CRM</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {consultorAtual?.statusConexao === 'online' ? (
                    <>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <div>
                        <p className="font-medium text-gray-900">Conectado</p>
                        <p className="text-sm text-gray-600">
                          WhatsApp ativo{consultorAtual.numeroWhatsapp ? ` 📱 ${consultorAtual.numeroWhatsapp}` : ''}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <div>
                        <p className="font-medium text-gray-900">Desconectado</p>
                        <p className="text-sm text-gray-600">Clique para conectar</p>
                      </div>
                    </>
                  )}
                </div>
                {consultorAtual?.statusConexao === 'online' ? (
                  <button
                    onClick={() => alert('Para desconectar, use o WhatsApp no celular → Aparelhos conectados')}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition flex items-center gap-2"
                  >
                    <Smartphone className="w-5 h-5" />
                    Conectado
                  </button>
                ) : (
                  <button
                    onClick={() => setMostrarModalQR(true)}
                    className="px-6 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-medium rounded-lg transition flex items-center gap-2"
                  >
                    <Smartphone className="w-5 h-5" />
                    Conectar WhatsApp
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
