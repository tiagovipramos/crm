'use client';

import { useState, useEffect } from 'react';
import { useProtecarStore } from '@/store/useProtecarStore';
import { Smartphone, Settings, Key, Shield, CheckCircle2 } from 'lucide-react';
import WhatsAppQRModal from '@/components/WhatsAppQRModal';
import api from '@/lib/api';

type TipoApi = 'oficial' | 'nao_oficial';

export default function ConfiguracoesView() {
  const { consultorAtual } = useProtecarStore();
  const [mostrarModalQR, setMostrarModalQR] = useState(false);
  const [tipoApiSelecionado, setTipoApiSelecionado] = useState<TipoApi>('nao_oficial');
  const [mostrarConfigOficial, setMostrarConfigOficial] = useState(false);
  const [salvando, setSalvando] = useState(false);
  
  // Configurações da API Oficial
  const [configOficial, setConfigOficial] = useState({
    phoneNumberId: '',
    accessToken: '',
    webhookVerifyToken: ''
  });

  useEffect(() => {
    // Buscar tipo de API atual
    const fetchTipoApi = async () => {
      try {
        const response = await api.get('/whatsapp/status');
        if (response.data.tipoApi) {
          setTipoApiSelecionado(response.data.tipoApi);
        }
      } catch (error) {
        console.error('Erro ao buscar tipo de API:', error);
        // Manter padrão como API Não Oficial se houver erro
        setTipoApiSelecionado('nao_oficial');
      }
    };
    fetchTipoApi();
  }, []);

  const handleAlterarTipoApi = async (novoTipo: TipoApi) => {
    try {
      setSalvando(true);
      const response = await api.post('/whatsapp/alterar-tipo-api', { tipoApi: novoTipo });
      setTipoApiSelecionado(novoTipo);
      
      // Verificar se houve desconexão da API anterior
      const apiDesconectada = response.data.disconnected;
      
      if (apiDesconectada) {
        const nomeApiDesconectada = apiDesconectada === 'oficial' ? 'API Oficial' : 'API Não Oficial';
        const nomeApiNova = novoTipo === 'oficial' ? 'API Oficial' : 'API Não Oficial';
        
        alert(
          `✅ Tipo de API alterado com sucesso!\n\n` +
          `➡️ Mudou de: ${nomeApiDesconectada}\n` +
          `➡️ Para: ${nomeApiNova}\n\n` +
          `🔌 A ${nomeApiDesconectada} foi desconectada automaticamente.\n\n` +
          (novoTipo === 'oficial' 
            ? '⚠️ Configure agora as credenciais da API Oficial para começar a usar.' 
            : '⚠️ Conecte o WhatsApp via QR Code para começar a usar.')
        );
      } else {
        alert(`✅ Tipo de API alterado para: ${novoTipo === 'oficial' ? 'API Oficial' : 'API Não Oficial'}`);
      }
    } catch (error: any) {
      console.error('Erro ao alterar tipo de API:', error);
      
      // Verificar se é erro de migrations não executadas
      if (error.response?.data?.message?.includes('executar-migration-tipo-api')) {
        alert(
          '⚠️ MIGRATIONS NÃO EXECUTADAS\n\n' +
          'Você precisa executar as migrations primeiro:\n\n' +
          '1. Abra o terminal na pasta backend/\n' +
          '2. Execute: executar-migration-tipo-api.bat\n' +
          '3. Reinicie o backend\n' +
          '4. Recarregue esta página\n\n' +
          'Consulte backend/INSTRUCOES-API-WHATSAPP.md para mais detalhes.'
        );
      } else {
        alert('Erro ao alterar tipo de API. Tente novamente.');
      }
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarConfigOficial = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!configOficial.phoneNumberId || !configOficial.accessToken || !configOficial.webhookVerifyToken) {
      alert('Preencha todos os campos');
      return;
    }

    try {
      setSalvando(true);
      await api.post('/whatsapp/configurar-api-oficial', configOficial);
      alert('Configuração da API Oficial salva com sucesso!');
      setMostrarConfigOficial(false);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      alert('Erro ao salvar configuração. Verifique os dados e tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <WhatsAppQRModal isOpen={mostrarModalQR} onClose={() => setMostrarModalQR(false)} />
      
      <div className="h-full bg-gray-50 flex">
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Seleção de Tipo de API */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Tipo de API WhatsApp</h3>
                  <p className="text-sm text-gray-600">Escolha qual API você deseja utilizar</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* API Não Oficial */}
                <button
                  onClick={() => handleAlterarTipoApi('nao_oficial')}
                  disabled={salvando}
                  className={`p-6 rounded-lg border-2 transition relative ${
                    tipoApiSelecionado === 'nao_oficial'
                      ? 'border-[#25D366] bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {tipoApiSelecionado === 'nao_oficial' && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="w-6 h-6 text-[#25D366]" />
                    </div>
                  )}
                  <div className="flex flex-col items-start gap-2">
                    <Smartphone className="w-8 h-8 text-[#25D366]" />
                    <h4 className="font-semibold text-gray-900">API Não Oficial</h4>
                    <p className="text-sm text-gray-600 text-left">
                      Gratuita, usa QR Code, ideal para começar rapidamente
                    </p>
                    <div className="mt-2 flex flex-col gap-1 text-xs text-gray-500">
                      <span>✓ Gratuita</span>
                      <span>✓ Conexão via QR Code</span>
                      <span>✓ Todos os recursos</span>
                    </div>
                  </div>
                </button>

                {/* API Oficial */}
                <button
                  onClick={() => handleAlterarTipoApi('oficial')}
                  disabled={salvando}
                  className={`p-6 rounded-lg border-2 transition relative ${
                    tipoApiSelecionado === 'oficial'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {tipoApiSelecionado === 'oficial' && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="w-6 h-6 text-blue-600" />
                    </div>
                  )}
                  <div className="flex flex-col items-start gap-2">
                    <Shield className="w-8 h-8 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">API Oficial</h4>
                    <p className="text-sm text-gray-600 text-left">
                      WhatsApp Business API, mais estável e profissional
                    </p>
                    <div className="mt-2 flex flex-col gap-1 text-xs text-gray-500">
                      <span>✓ Mais estável</span>
                      <span>✓ Suporte oficial</span>
                      <span>✓ Webhooks nativos</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Configuração da API Selecionada */}
            {tipoApiSelecionado === 'nao_oficial' ? (
              /* API Não Oficial - QR Code */
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Conexão WhatsApp</h3>
                    <p className="text-sm text-gray-600">Conecte seu WhatsApp ao CRM via QR Code</p>
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
            ) : (
              /* API Oficial - Configuração */
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <Key className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Configuração API Oficial</h3>
                    <p className="text-sm text-gray-600">Configure suas credenciais da WhatsApp Business API</p>
                  </div>
                </div>

                {!mostrarConfigOficial ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Para usar a API Oficial, você precisa de uma conta WhatsApp Business API aprovada pela Meta.
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setMostrarConfigOficial(true)}
                      className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <Key className="w-5 h-5" />
                      Configurar Credenciais
                    </button>

                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Como obter as credenciais:</h4>
                      <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                        <li>Acesse o <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Meta for Developers</a></li>
                        <li>Crie ou selecione seu aplicativo WhatsApp Business</li>
                        <li>Copie o Phone Number ID e Access Token</li>
                        <li>Configure o Webhook Verify Token</li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSalvarConfigOficial} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number ID
                      </label>
                      <input
                        type="text"
                        value={configOficial.phoneNumberId}
                        onChange={(e) => setConfigOficial({ ...configOficial, phoneNumberId: e.target.value })}
                        placeholder="Digite o Phone Number ID"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Access Token
                      </label>
                      <input
                        type="password"
                        value={configOficial.accessToken}
                        onChange={(e) => setConfigOficial({ ...configOficial, accessToken: e.target.value })}
                        placeholder="Digite o Access Token"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Webhook Verify Token
                      </label>
                      <input
                        type="text"
                        value={configOficial.webhookVerifyToken}
                        onChange={(e) => setConfigOficial({ ...configOficial, webhookVerifyToken: e.target.value })}
                        placeholder="Digite o Webhook Verify Token"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={salvando}
                        className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                      >
                        {salvando ? 'Salvando...' : 'Salvar Configuração'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMostrarConfigOficial(false)}
                        className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
