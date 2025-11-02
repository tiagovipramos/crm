import { create } from 'zustand';
import { authAPI, leadsAPI, mensagensAPI, whatsappAPI } from '@/lib/api';
import type {
  Consultor,
  Lead,
  Mensagem,
  Proposta,
  Tarefa,
  TemplateMessage,
  AutomacaoRegra,
  EtapaFunil,
  ConfiguracaoSistema,
  PlanoProtecao,
  EstatisticasConsultor
} from '@/types';

interface ProtecarStore {
  // Estado de autenticação
  consultorAtual: Consultor | null;
  isAuthenticated: boolean;

  // Dados do sistema
  consultores: Consultor[];
  leads: Lead[];
  mensagens: Mensagem[];
  propostas: Proposta[];
  tarefas: Tarefa[];
  templates: TemplateMessage[];
  automacoes: AutomacaoRegra[];
  configuracao: ConfiguracaoSistema;

  // Estado da UI
  leadSelecionado: Lead | null;
  chatAberto: boolean;
  viewMode: 'dashboard' | 'chat' | 'funil' | 'tarefas' | 'followup' | 'configuracoes';
  filtroChat: 'todos' | 'novo' | 'primeiro_contato' | 'proposta_enviada' | 'convertido' | 'perdido';
  pesquisaChat: string;

  // Ações de Autenticação
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  atualizarConsultor: (dados: Partial<Consultor>) => void;

  // Ações de WhatsApp
  conectarWhatsApp: () => Promise<string>; // Retorna QR Code
  desconectarWhatsApp: () => void;
  atualizarStatusConexao: (status: 'online' | 'offline' | 'connecting') => void;

  // Ações de Leads
  carregarLeads: () => Promise<void>;
  carregarTarefas: () => Promise<void>;
  criarLead: (dados: Omit<Lead, 'id' | 'dataCriacao' | 'dataAtualizacao'>) => Promise<Lead>;
  atualizarLead: (leadId: string, dados: Partial<Lead>) => void;
  deletarLead: (leadId: string) => void;
  moverLeadStatus: (leadId: string, novoStatus: Lead['status']) => void;
  selecionarLead: (leadId: string | null) => void;
  getLeadsDoConsultor: () => Lead[];
  getLeadsPorStatus: (status: Lead['status']) => Lead[];
  adicionarTag: (leadId: string, tag: import('@/types').LeadTag) => void;
  removerTag: (leadId: string, tag: import('@/types').LeadTag) => void;

  // Ações de Mensagens
  enviarMensagem: (leadId: string, conteudo: string, tipo?: Mensagem['tipo']) => void;
  receberMensagem: (leadId: string, conteudo: string) => void;
  marcarMensagensLidas: (leadId: string) => void;
  getMensagensDoLead: (leadId: string) => Mensagem[];

  // Ações de Propostas
  criarProposta: (dados: Omit<Proposta, 'id'>) => Proposta;
  enviarProposta: (propostaId: string) => void;
  atualizarProposta: (propostaId: string, dados: Partial<Proposta>) => void;
  getPropostasDoLead: (leadId: string) => Proposta[];

  // Ações de Tarefas
  criarTarefa: (dados: Omit<Tarefa, 'id' | 'dataCriacao'>) => Tarefa;
  concluirTarefa: (tarefaId: string) => void;
  deletarTarefa: (tarefaId: string) => void;
  getTarefasPendentes: () => Tarefa[];
  getTarefasDoLead: (leadId: string) => Tarefa[];

  // Ações de Templates
  criarTemplate: (dados: Omit<TemplateMessage, 'id'>) => TemplateMessage;
  atualizarTemplate: (templateId: string, dados: Partial<TemplateMessage>) => void;
  deletarTemplate: (templateId: string) => void;
  getTemplatesAtivos: () => TemplateMessage[];

  // Ações de Automação
  processarAutomacao: (evento: AutomacaoRegra['evento'], leadId: string, dados?: any) => void;

  // Ações de UI
  setViewMode: (mode: ProtecarStore['viewMode']) => void;
  setFiltroChat: (filtro: ProtecarStore['filtroChat']) => void;
  setPesquisaChat: (pesquisa: string) => void;
  toggleChat: () => void;

  // Estatísticas
  getEstatisticas: (periodo: 'hoje' | 'semana' | 'mes') => EstatisticasConsultor;
}

// Configuração padrão do sistema
const configuracaoPadrao: ConfiguracaoSistema = {
  id: 'config-1',
  nomeEmpresa: 'VIP',
  corPrimaria: '#128C7E',
  corSecundaria: '#075E54',
  notificacaoSonora: true,
  darkMode: false,
  templatesGlobais: [],
  etapasFunil: [
    { id: 'indicacao', nome: 'Indicação', cor: '#EC4899', ordem: 0, sistema: true },
    { id: 'novo', nome: 'Novo Lead', cor: '#3B82F6', ordem: 1, sistema: true },
    { id: 'primeiro_contato', nome: 'Primeiro Contato', cor: '#8B5CF6', ordem: 2, sistema: true },
    { id: 'proposta_enviada', nome: 'Proposta Enviada', cor: '#F59E0B', ordem: 3, sistema: true },
    { id: 'convertido', nome: 'Convertido', cor: '#10B981', ordem: 4, sistema: true },
    { id: 'nao_solicitado', nome: 'Não Solicitado', cor: '#EF4444', ordem: 5, sistema: true },
    { id: 'perdido', nome: 'Perdido', cor: '#6B7280', ordem: 6, sistema: true },
  ],
  planosProtecao: [
    {
      id: 'basico',
      nome: 'Plano Básico',
      tipo: 'basico',
      valorBase: 150,
      franquia: 2000,
      coberturas: ['Roubo', 'Furto', 'Incêndio'],
      descricao: 'Proteção essencial para seu veículo',
      ativo: true
    },
    {
      id: 'completo',
      nome: 'Plano Completo',
      tipo: 'completo',
      valorBase: 250,
      franquia: 1500,
      coberturas: ['Roubo', 'Furto', 'Incêndio', 'Colisão', 'Vidros'],
      descricao: 'Proteção completa com mais coberturas',
      ativo: true
    },
    {
      id: 'premium',
      nome: 'Plano Premium',
      tipo: 'premium',
      valorBase: 350,
      franquia: 1000,
      coberturas: ['Roubo', 'Furto', 'Incêndio', 'Colisão', 'Vidros', 'Carro Reserva', 'Assistência 24h'],
      descricao: 'Máxima proteção e serviços exclusivos',
      ativo: true
    }
  ]
};

export const useProtecarStore = create<ProtecarStore>((set, get) => ({
  // Estado inicial
  consultorAtual: null,
  isAuthenticated: false,
  consultores: [],
  leads: [],
  mensagens: [],
  propostas: [],
  tarefas: [],
  templates: [],
  automacoes: [],
  configuracao: configuracaoPadrao,
  leadSelecionado: null,
  chatAberto: false,
  viewMode: 'dashboard',
  filtroChat: 'todos',
  pesquisaChat: '',

  // Autenticação
  login: async (email: string, senha: string) => {
    try {
      const { token, consultor } = await authAPI.login(email, senha);
      
      console.log('✅ Login bem-sucedido!');
      console.log('📱 Status do WhatsApp recebido:', consultor.statusConexao);
      
      set({ 
        consultorAtual: consultor,
        isAuthenticated: true,
        viewMode: 'dashboard'
      });
      
      // Se WhatsApp já está conectado, notificar
      if (consultor.statusConexao === 'online') {
        console.log('🟢 WhatsApp já está conectado! Reconectando interface...');
      }
      
      // Carregar leads do backend
      await get().carregarLeads();
      return true;
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      // Re-lançar o erro para ser capturado no componente
      throw error;
    }
  },

  logout: () => {
    // Salvar o status de conexão atual antes do logout
    const statusConexaoAtual = get().consultorAtual?.statusConexao;
    
    authAPI.logout();
    set({
      consultorAtual: null,
      isAuthenticated: false,
      leadSelecionado: null,
      chatAberto: false,
      viewMode: 'dashboard',
      leads: [],
      mensagens: []
    });
    
    console.log('🔐 Logout realizado. Status do WhatsApp mantido no backend:', statusConexaoAtual);
  },

  atualizarConsultor: (dados: Partial<Consultor>) => {
    const { consultorAtual } = get();
    if (!consultorAtual) return;

    const consultorAtualizado = { ...consultorAtual, ...dados };
    set({
      consultorAtual: consultorAtualizado,
      consultores: get().consultores.map(c =>
        c.id === consultorAtual.id ? consultorAtualizado : c
      )
    });
  },

  // WhatsApp
  conectarWhatsApp: async () => {
    const { consultorAtual } = get();
    if (!consultorAtual) {
      console.error('❌ Erro: Consultor não autenticado');
      return '';
    }

    console.log('🔄 Iniciando conexão WhatsApp...');
    console.log('📋 Consultor ID:', consultorAtual.id);

    try {
      // Atualizar estado para "conectando"
      set({
        consultorAtual: {
          ...consultorAtual,
          statusConexao: 'connecting',
          qrCode: undefined
        }
      });
      console.log('⏳ Status atualizado para: connecting');

      // Fazer chamada para o backend
      console.log('📡 Fazendo requisição para /api/whatsapp/connect...');
      const response = await whatsappAPI.connect();
      console.log('✅ Resposta recebida do backend:', response);
      
      const { qrCode, message } = response;
      
      if (qrCode) {
        console.log('📷 QR Code recebido do backend!');
        console.log('📏 Tamanho do QR Code:', qrCode.length, 'caracteres');
        console.log('🔤 Começa com:', qrCode.substring(0, 30) + '...');
        
        set({
          consultorAtual: {
            ...consultorAtual,
            statusConexao: 'connecting',
            qrCode
          }
        });
        console.log('✅ QR Code salvo no estado!');
        console.log('💡 Aguardando Socket.IO enviar QR Code atualizado...');
        return qrCode;
      } else if (message && message.includes('conectado')) {
        // Já estava conectado
        console.log('✅ WhatsApp já estava conectado!');
        set({
          consultorAtual: {
            ...consultorAtual,
            statusConexao: 'online',
            qrCode: undefined
          }
        });
        return '';
      }
      
      console.warn('⚠️ Resposta sem QR Code e sem mensagem de sucesso');
      return '';
    } catch (error: any) {
      console.error('❌ ERRO ao conectar WhatsApp:', error);
      console.error('📋 Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      set({
        consultorAtual: {
          ...consultorAtual,
          statusConexao: 'offline',
          qrCode: undefined
        }
      });
      
      const errorMessage = error?.response?.data?.error || error.message || 'Erro desconhecido';
      console.error('💬 Mensagem de erro:', errorMessage);
      alert('Erro ao conectar WhatsApp: ' + errorMessage + '\n\nVerifique se o backend está rodando na porta 3001.');
      return '';
    }
  },

  desconectarWhatsApp: async () => {
    const { consultorAtual } = get();
    if (!consultorAtual) return;

    console.log('🔴 Desconectando WhatsApp explicitamente...');
    
    try {
      // Chamar API para desconectar no backend
      await whatsappAPI.disconnect();
      console.log('✅ WhatsApp desconectado no backend');
      
      set({
        consultorAtual: {
          ...consultorAtual,
          statusConexao: 'offline',
          sessaoWhatsapp: undefined,
          qrCode: undefined
        }
      });
    } catch (error) {
      console.error('❌ Erro ao desconectar WhatsApp:', error);
    }
  },

  atualizarStatusConexao: (status) => {
    const { consultorAtual } = get();
    if (!consultorAtual) return;

    console.log('🔄 Atualizando status de conexão:', status);
    set({
      consultorAtual: {
        ...consultorAtual,
        statusConexao: status,
        ...(status === 'online' && { qrCode: undefined }) // Limpar QR quando conectar
      }
    });
  },

  // Leads
  criarLead: async (dados) => {
    const { consultorAtual } = get();
    if (!consultorAtual) throw new Error('Consultor não autenticado');

    try {
      console.log('🔄 Criando lead no backend...', dados);
      
      // Criar lead no backend
      const leadCriado = await leadsAPI.create({
        nome: dados.nome,
        telefone: dados.telefone,
        email: dados.email || null,
        cidade: dados.cidade || null,
        origem: dados.origem || 'WhatsApp',
        status: 'novo'
      });
      
      console.log('✅ Lead criado no backend:', leadCriado);
      
      // Atualizar lista local
      await get().carregarLeads();
      
      // Processa automação para novo lead
      get().processarAutomacao('novo_lead', leadCriado.id);
      
      return leadCriado;
    } catch (error) {
      console.error('❌ Erro ao criar lead no backend:', error);
      throw error;
    }
  },

  atualizarLead: async (leadId, dados) => {
    console.log('🔄 Atualizando lead:', leadId);
    console.log('📝 Dados para atualizar:', dados);
    
    // Encontrar o lead atual
    const leadAtual = get().leads.find(l => l.id === leadId);
    if (!leadAtual) {
      console.error('❌ Lead não encontrado:', leadId);
      return;
    }
    
    // Atualizar localmente primeiro (para UI responsiva)
    const leadAtualizado: Lead = {
      ...leadAtual,
      ...dados,
      dataAtualizacao: new Date().toISOString()
    };
    
    set({
      leads: get().leads.map(lead =>
        lead.id === leadId ? leadAtualizado : lead
      )
    });
    
    console.log('✅ Lead atualizado localmente na store');
    console.log('📊 Total de leads na store:', get().leads.length);
    
    // Atualizar no backend - filtrar apenas campos válidos do Lead
    try {
      // Lista de campos válidos do Lead que podem ser atualizados
      const camposValidos: (keyof Lead)[] = [
        'nome', 'telefone', 'email', 'cidade', 
        'modeloVeiculo', 'placaVeiculo', 'corVeiculo', 'anoVeiculo',
        'origem', 'status', 'observacoes', 'informacoesComerciais', 
        'mensalidade', 'fipe', 'plano', 'tags',
        'mensagensNaoLidas', 'ultimaMensagem', 'notasInternas'
      ];
      
      // Filtrar apenas campos válidos
      const dadosFiltrados: Partial<Lead> = {};
      Object.keys(dados).forEach((key) => {
        if (camposValidos.includes(key as keyof Lead)) {
          (dadosFiltrados as any)[key] = (dados as any)[key];
        }
      });
      
      console.log('📤 Enviando para o backend (após filtro):', dadosFiltrados);
      
      const resultado = await leadsAPI.update(leadId, dadosFiltrados);
      console.log('✅ Lead atualizado no backend:', resultado);
      
      // Recarregar leads para garantir sincronia
      await get().carregarLeads();
    } catch (error: any) {
      console.error('❌ Erro ao atualizar lead no backend:', error);
      console.error('📋 Detalhes do erro:', error?.response?.data || error?.message);
      // Em caso de erro, reverter a mudança local
      set({
        leads: get().leads
      });
      throw error;
    }
  },

  deletarLead: async (leadId) => {
    try {
      console.log('🗑️ Deletando lead:', leadId);
      
      // Deletar no backend
      await leadsAPI.delete(leadId);
      console.log('✅ Lead deletado no backend');
      
      // Atualizar estado local
      set({
        leads: get().leads.filter(l => l.id !== leadId),
        mensagens: get().mensagens.filter(m => m.leadId !== leadId),
        propostas: get().propostas.filter(p => p.leadId !== leadId),
        tarefas: get().tarefas.filter(t => t.leadId !== leadId),
        leadSelecionado: get().leadSelecionado?.id === leadId ? null : get().leadSelecionado
      });
      
      console.log('✅ Lead removido do estado local');
    } catch (error) {
      console.error('❌ Erro ao deletar lead:', error);
      throw error;
    }
  },

  moverLeadStatus: (leadId, novoStatus) => {
    const lead = get().leads.find(l => l.id === leadId);
    if (!lead) return;

    const statusAntigo = lead.status;
    
    get().atualizarLead(leadId, { status: novoStatus });

    // Processa automação de mudança de status
    get().processarAutomacao('mudanca_status', leadId, { statusAntigo, novoStatus });
  },

  carregarLeads: async () => {
    try {
      console.log('🔄 Buscando leads do backend...');
      const leads = await leadsAPI.getAll();
      console.log('📦 Leads recebidos do backend:', leads);
      console.log('📊 Total de leads:', leads.length);
      set({ leads });
      console.log('✅ Leads atualizados na store');
      
      // Carregar tarefas também
      await get().carregarTarefas();
      
      // SINCRONIZAR COM useCRMStore (store antiga usada pelo funil)
      try {
        const { useCRMStore } = await import('./useCRMStore');
        const crmLeads = leads.map((lead: Lead) => ({
          id: lead.id,
          nome: lead.nome,
          telefone: lead.telefone,
          placa: lead.placaVeiculo || '', // Usar placaVeiculo do banco
          veiculo: lead.modeloVeiculo || lead.origem || 'Sem info',
          fipe: '0',
          mensalidade: '0',
          status: lead.status,
          vendedorId: lead.consultorId,
          supervisorId: lead.consultorId,
          createdAt: lead.dataCriacao,
          lastContact: lead.dataAtualizacao,
        }));
        useCRMStore.setState({ leads: crmLeads as any });
        console.log('✅ Leads sincronizados com useCRMStore');
      } catch (syncError) {
        console.warn('⚠️ Não foi possível sincronizar com useCRMStore:', syncError);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar leads:', error);
      console.error('📋 Detalhes do erro:', error);
    }
  },

  selecionarLead: async (leadId) => {
    // ✅ Proteção contra cliques múltiplos
    const leadAtual = get().leadSelecionado;
    if (leadAtual?.id === leadId) {
      console.log('⏩ Lead já está selecionado, ignorando');
      return;
    }
    
    const lead = leadId ? get().leads.find(l => l.id === leadId) : null;
    
    if (lead && leadId) {
      // PRIMEIRO: Limpar TODAS as mensagens ANTES de qualquer coisa
      console.log('🗑️ Limpando TODAS as mensagens antigas');
      set({ mensagens: [], leadSelecionado: lead, chatAberto: true });
      
      // SEGUNDO: Aguardar um pouco para garantir que limpou
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // TERCEIRO: Carregar mensagens do banco de dados
      try {
        console.log('📥 Carregando mensagens do banco para lead:', leadId);
        const mensagens = await mensagensAPI.getByLead(leadId);
        console.log('✅ Mensagens carregadas do banco:', mensagens.length);
        
        // Converter formato do banco para formato da store
        const mensagensFormatadas = mensagens.map((msg: any) => {
          console.log('🔍 Convertendo mensagem:', {
            id: msg.id,
            tipo: msg.tipo,
            mediaUrl: msg.mediaUrl,
            media_url: msg.media_url,
            remetente: msg.remetente
          });
          
          return {
            id: String(msg.id),
            leadId: String(msg.leadId || msg.lead_id),
            consultorId: String(msg.consultorId || msg.consultor_id),
            conteudo: msg.conteudo,
            tipo: msg.tipo,
            remetente: msg.remetente,
            status: msg.status,
            mediaUrl: msg.mediaUrl || msg.media_url || null,
            mediaName: msg.mediaName || msg.media_name || null,
            timestamp: msg.timestamp
          };
        });
        
        // ✅ SALVAR IDs das mensagens carregadas do banco (para Socket ignorar)
        const idsCarregados = mensagensFormatadas.map((m: Mensagem) => m.id);
        console.log('💾 Salvando IDs carregados do banco:', idsCarregados.length);
        (window as any).__mensagensCarregadasIds = new Set(idsCarregados);
        
        // ✅ Substituir DIRETAMENTE as mensagens (não concatenar!)
        set({ mensagens: mensagensFormatadas });
        
        console.log('✅ Mensagens atualizadas na store. Total:', mensagensFormatadas.length);
      } catch (error) {
        console.error('❌ Erro ao carregar mensagens:', error);
      }
      
      // Marcar como lidas se necessário
      if (lead.mensagensNaoLidas > 0) {
        get().marcarMensagensLidas(lead.id);
      }
    } else {
      // Se está desselecionando, limpar mensagens E set de IDs
      set({ 
        leadSelecionado: null,
        chatAberto: false,
        mensagens: []
      });
      (window as any).__mensagensCarregadasIds = new Set();
    }
  },

  getLeadsDoConsultor: () => {
    const { consultorAtual, leads } = get();
    if (!consultorAtual) return [];
    return leads.filter(l => l.consultorId === consultorAtual.id);
  },

  getLeadsPorStatus: (status) => {
    return get().getLeadsDoConsultor().filter(l => l.status === status);
  },

  adicionarTag: (leadId, tag) => {
    const lead = get().leads.find(l => l.id === leadId);
    if (!lead) return;

    const tagsAtuais = lead.tags || [];
    if (tagsAtuais.includes(tag)) return; // Já tem a tag

    get().atualizarLead(leadId, {
      tags: [...tagsAtuais, tag]
    });
  },

  removerTag: (leadId, tag) => {
    const lead = get().leads.find(l => l.id === leadId);
    if (!lead || !lead.tags) return;

    get().atualizarLead(leadId, {
      tags: lead.tags.filter(t => t !== tag)
    });
  },

  // Mensagens
  enviarMensagem: async (leadId, conteudo, tipo = 'texto') => {
    const { consultorAtual } = get();
    if (!consultorAtual) return;

    try {
      console.log('📤 Enviando mensagem para lead:', leadId);
      const mensagem = await mensagensAPI.send(leadId, conteudo, tipo);
      console.log('✅ Mensagem enviada, resposta do backend:', mensagem);
      console.log('🆔 ID da mensagem retornada:', mensagem.id, 'tipo:', typeof mensagem.id);
      
      // ✅ NÃO adicionar localmente! Deixar apenas o Socket.IO adicionar
      console.log('⏩ Não adicionando localmente - aguardando Socket.IO');
      
      // Atualiza última mensagem do lead
      get().atualizarLead(leadId, {
        ultimaMensagem: conteudo.substring(0, 50) + (conteudo.length > 50 ? '...' : '')
      });
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
    }
  },

  receberMensagem: (leadId, conteudo) => {
    const { consultorAtual, leadSelecionado } = get();
    if (!consultorAtual) return;

    console.log('🔍 Procurando lead com ID:', leadId, 'tipo:', typeof leadId);
    console.log('📋 Leads disponíveis:', get().leads.map(l => ({ id: l.id, tipo: typeof l.id, nome: l.nome })));
    
    // Tentar encontrar o lead com conversão de tipo
    const lead = get().leads.find(l => String(l.id) === String(leadId));

    // Se o lead não existe localmente, a lista de leads será recarregada pelo Socket
    // Apenas adicionar a mensagem se o lead existir
    if (!lead) {
      console.error('❌ Lead não encontrado localmente após busca');
      console.error('📊 Total de leads na store:', get().leads.length);
      console.error('🔑 ID procurado:', leadId);
      console.error('📝 IDs disponíveis:', get().leads.map(l => l.id).join(', '));
      return;
    }

    console.log('✅ Lead encontrado:', lead.nome);

    const novaMensagem: Mensagem = {
      id: `msg-${Date.now()}`,
      leadId: lead.id,
      consultorId: consultorAtual.id,
      conteudo,
      tipo: 'texto',
      remetente: 'lead',
      status: 'lida',
      timestamp: new Date().toISOString()
    };

    set({ mensagens: [...get().mensagens, novaMensagem] });

    // Atualiza contador de não lidas se não estiver com o chat aberto
    if (leadSelecionado?.id !== lead.id) {
      get().atualizarLead(lead.id, {
        mensagensNaoLidas: lead.mensagensNaoLidas + 1,
        ultimaMensagem: conteudo.substring(0, 50) + (conteudo.length > 50 ? '...' : '')
      });
    } else {
      get().atualizarLead(lead.id, {
        ultimaMensagem: conteudo.substring(0, 50) + (conteudo.length > 50 ? '...' : '')
      });
    }
  },

  marcarMensagensLidas: (leadId) => {
    set({
      mensagens: get().mensagens.map(m =>
        m.leadId === leadId && m.remetente === 'lead'
          ? { ...m, status: 'lida' }
          : m
      )
    });

    get().atualizarLead(leadId, { mensagensNaoLidas: 0 });
  },

  getMensagensDoLead: (leadId) => {
    return get().mensagens
      .filter(m => m.leadId === leadId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  // Propostas
  criarProposta: (dados) => {
    const novaProposta: Proposta = {
      ...dados,
      id: `prop-${Date.now()}`,
      status: 'rascunho'
    };

    set({ propostas: [...get().propostas, novaProposta] });
    return novaProposta;
  },

  enviarProposta: (propostaId) => {
    const proposta = get().propostas.find(p => p.id === propostaId);
    if (!proposta) return;

    const linkProposta = `https://protecar.com/proposta/${propostaId}`;
    
    set({
      propostas: get().propostas.map(p =>
        p.id === propostaId
          ? { ...p, status: 'enviada', linkProposta, dataEnvio: new Date().toISOString() }
          : p
      )
    });

    // Envia mensagem com link da proposta
    get().enviarMensagem(
      proposta.leadId,
      `Olá! Preparei uma proposta especial para você. Confira em: ${linkProposta}`
    );

    // Processa automação
    get().processarAutomacao('proposta_enviada', proposta.leadId, { propostaId });
  },

  atualizarProposta: (propostaId, dados) => {
    set({
      propostas: get().propostas.map(p =>
        p.id === propostaId ? { ...p, ...dados } : p
      )
    });
  },

  getPropostasDoLead: (leadId) => {
    return get().propostas.filter(p => p.leadId === leadId);
  },

  carregarTarefas: async () => {
    try {
      console.log('🔄 Carregando tarefas do backend...');
      const { tarefasAPI } = await import('@/lib/api');
      const tarefasBackend = await tarefasAPI.getAll();
      
      console.log('📦 Tarefas recebidas do backend (raw):', tarefasBackend);
      
      // Converter de snake_case para camelCase
      const tarefasFormatadas: Tarefa[] = tarefasBackend.map((tarefa: any) => ({
        id: String(tarefa.id),
        consultorId: String(tarefa.consultor_id || tarefa.consultorId),
        leadId: tarefa.lead_id ? String(tarefa.lead_id) : undefined,
        titulo: tarefa.titulo,
        descricao: tarefa.descricao || undefined,
        tipo: 'outro' as const, // Tipo padrão pois não temos no banco
        dataLembrete: tarefa.data_hora || tarefa.dataLembrete,
        concluida: tarefa.status === 'concluida',
        dataCriacao: tarefa.criado_em || tarefa.dataCriacao || new Date().toISOString(),
        dataConclusao: tarefa.concluida_em || tarefa.dataConclusao
      }));
      
      console.log('✅ Tarefas formatadas:', tarefasFormatadas);
      set({ tarefas: tarefasFormatadas });
      console.log('✅ Tarefas carregadas na store');
    } catch (error) {
      console.error('❌ Erro ao carregar tarefas:', error);
    }
  },

  // Tarefas
  criarTarefa: (dados) => {
    const novaTarefa: Tarefa = {
      ...dados,
      id: `task-${Date.now()}`,
      concluida: false,
      dataCriacao: new Date().toISOString()
    };

    set({ tarefas: [...get().tarefas, novaTarefa] });
    return novaTarefa;
  },

  concluirTarefa: async (tarefaId) => {
    try {
      // Atualizar localmente primeiro
      set({
        tarefas: get().tarefas.map(t =>
          t.id === tarefaId
            ? { ...t, concluida: true, dataConclusao: new Date().toISOString() }
            : t
        )
      });
      
      // Atualizar no backend
      const { tarefasAPI } = await import('@/lib/api');
      await tarefasAPI.update(tarefaId, { status: 'concluida' });
      console.log('✅ Tarefa marcada como concluída no backend');
    } catch (error) {
      console.error('❌ Erro ao concluir tarefa:', error);
      // Reverter mudança local
      await get().carregarTarefas();
    }
  },

  deletarTarefa: async (tarefaId) => {
    try {
      // Deletar localmente primeiro
      set({ tarefas: get().tarefas.filter(t => t.id !== tarefaId) });
      
      // Deletar no backend
      const { tarefasAPI } = await import('@/lib/api');
      await tarefasAPI.delete(tarefaId);
      console.log('✅ Tarefa deletada no backend');
    } catch (error) {
      console.error('❌ Erro ao deletar tarefa:', error);
      // Reverter mudança local recarregando
      await get().carregarTarefas();
    }
  },

  getTarefasPendentes: () => {
    const { consultorAtual, tarefas } = get();
    
    if (!consultorAtual) {
      return [];
    }
    
    const tarefasFiltradas = tarefas.filter(t => {
      return String(t.consultorId) === String(consultorAtual.id) && !t.concluida;
    });
    
    return tarefasFiltradas.sort((a, b) => new Date(a.dataLembrete).getTime() - new Date(b.dataLembrete).getTime());
  },

  getTarefasDoLead: (leadId) => {
    return get().tarefas.filter(t => t.leadId === leadId);
  },

  // Templates
  criarTemplate: (dados) => {
    const novoTemplate: TemplateMessage = {
      ...dados,
      id: `tmpl-${Date.now()}`
    };

    set({ templates: [...get().templates, novoTemplate] });
    return novoTemplate;
  },

  atualizarTemplate: (templateId, dados) => {
    set({
      templates: get().templates.map(t =>
        t.id === templateId ? { ...t, ...dados } : t
      )
    });
  },

  deletarTemplate: (templateId) => {
    set({ templates: get().templates.filter(t => t.id !== templateId) });
  },

  getTemplatesAtivos: () => {
    const { consultorAtual, templates } = get();
    if (!consultorAtual) return [];

    return templates.filter(t => 
      t.ativo && (t.consultorId === consultorAtual.id || !t.consultorId)
    );
  },

  // Automações
  processarAutomacao: (evento, leadId, dados) => {
    const { automacoes, templates } = get();
    const automacoesAtivas = automacoes.filter(a => a.ativa && a.evento === evento);

    automacoesAtivas.forEach(automacao => {
      let executar = true;

      // Verifica condições
      if (automacao.condicao) {
        if (evento === 'mudanca_status') {
          executar = automacao.condicao.statusDestino === dados?.novoStatus;
        }
      }

      if (!executar) return;

      // Executa ação
      switch (automacao.acao) {
        case 'enviar_mensagem':
          if (automacao.parametros.templateId) {
            const template = templates.find(t => t.id === automacao.parametros.templateId);
            if (template) {
              get().enviarMensagem(leadId, template.conteudo);
            }
          } else if (automacao.parametros.mensagem) {
            get().enviarMensagem(leadId, automacao.parametros.mensagem);
          }
          break;

        case 'criar_tarefa':
          get().criarTarefa({
            consultorId: get().consultorAtual!.id,
            leadId,
            titulo: automacao.parametros.mensagem || 'Tarefa automática',
            tipo: 'outro',
            dataLembrete: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            concluida: false
          });
          break;
      }
    });
  },

  // UI
  setViewMode: (mode) => set({ viewMode: mode }),
  
  setFiltroChat: (filtro) => set({ filtroChat: filtro }),
  
  setPesquisaChat: (pesquisa) => set({ pesquisaChat: pesquisa }),
  
  toggleChat: () => set({ chatAberto: !get().chatAberto }),

  // Estatísticas
  getEstatisticas: (periodo) => {
    const { consultorAtual, leads, mensagens, propostas } = get();
    if (!consultorAtual) {
      return {
        consultorId: '',
        periodo,
        totalLeads: 0,
        leadsPorStatus: {},
        mensagensEnviadas: 0,
        mensagensRecebidas: 0,
        propostasEnviadas: 0,
        conversoes: 0,
        taxaConversao: 0,
        tempoMedioResposta: 0
      };
    }

    const leadsDoConsultor = leads.filter(l => l.consultorId === consultorAtual.id);
    const mensagensDoConsultor = mensagens.filter(m => m.consultorId === consultorAtual.id);
    
    let dataInicio = new Date();
    if (periodo === 'hoje') {
      dataInicio.setHours(0, 0, 0, 0);
    } else if (periodo === 'semana') {
      dataInicio.setDate(dataInicio.getDate() - 7);
    } else {
      dataInicio.setMonth(dataInicio.getMonth() - 1);
    }

    const leadsPeriodo = leadsDoConsultor.filter(l =>
      new Date(l.dataCriacao) >= dataInicio
    );

    const leadsPorStatus = leadsPeriodo.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const conversoes = leadsPeriodo.filter(l => l.status === 'convertido').length;

    return {
      consultorId: consultorAtual.id,
      periodo,
      totalLeads: leadsPeriodo.length,
      leadsPorStatus,
      mensagensEnviadas: mensagensDoConsultor.filter(m => 
        m.remetente === 'consultor' && new Date(m.timestamp) >= dataInicio
      ).length,
      mensagensRecebidas: mensagensDoConsultor.filter(m =>
        m.remetente === 'lead' && new Date(m.timestamp) >= dataInicio
      ).length,
      propostasEnviadas: propostas.filter(p =>
        p.consultorId === consultorAtual.id && p.dataEnvio && new Date(p.dataEnvio) >= dataInicio
      ).length,
      conversoes,
      taxaConversao: leadsPeriodo.length > 0 ? (conversoes / leadsPeriodo.length) * 100 : 0,
      tempoMedioResposta: 15 // Mock - em produção calcular tempo real
    };
  }
}));
