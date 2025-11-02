// Tipos do Sistema Protecar CRM

export interface Consultor {
  id: string;
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  avatar?: string;
  sessaoWhatsapp?: string;
  statusConexao: 'online' | 'offline' | 'connecting';
  qrCode?: string;
  numeroWhatsapp?: string;
  dataCriacao: string;
  ultimoAcesso?: string;
}

export type LeadTag = 'vip' | 'urgente' | 'quente' | 'frio' | 'pendente';

export interface NotaInterna {
  id: string;
  texto: string;
  consultorId: string;
  consultorNome: string;
  dataHora: string;
}

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  cidade?: string;
  modeloVeiculo?: string;
  placaVeiculo?: string;
  corVeiculo?: string;
  anoVeiculo?: number;
  origem: string;
  status: 'novo' | 'primeiro_contato' | 'aguardando_retorno' | 'vistoria_agendada' | 'proposta_enviada' | 'convertido' | 'perdido' | 'engano';
  consultorId: string;
  observacoes?: string;
  informacoesComerciais?: string;
  mensalidade?: number;
  fipe?: number;
  plano?: 'START' | 'VIP' | 'TOP' | 'PREMIUM';
  notasInternas?: NotaInterna[];
  ultimaMensagem?: string;
  mensagensNaoLidas: number;
  tags?: LeadTag[];
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface Mensagem {
  id: string;
  leadId: string;
  consultorId: string;
  conteudo: string;
  tipo: 'texto' | 'imagem' | 'audio' | 'video' | 'documento';
  remetente: 'lead' | 'consultor';
  status: 'enviando' | 'enviada' | 'entregue' | 'lida' | 'erro';
  timestamp: string;
  mediaUrl?: string;
  mediaName?: string;
}

export interface Proposta {
  id: string;
  leadId: string;
  consultorId: string;
  plano: 'basico' | 'completo' | 'premium';
  valorMensal: number;
  franquia: number;
  coberturas: string[];
  observacoes?: string;
  status: 'rascunho' | 'enviada' | 'visualizada' | 'aceita' | 'recusada';
  linkProposta?: string;
  pdfUrl?: string;
  dataEnvio?: string;
  dataVisualizacao?: string;
  dataResposta?: string;
}

export interface PlanoProtecao {
  id: string;
  nome: string;
  tipo: 'basico' | 'completo' | 'premium';
  valorBase: number;
  franquia: number;
  coberturas: string[];
  descricao: string;
  ativo: boolean;
}

export interface Tarefa {
  id: string;
  consultorId: string;
  leadId?: string;
  titulo: string;
  descricao?: string;
  tipo: 'retornar_contato' | 'enviar_proposta' | 'acompanhar_vistoria' | 'follow_up' | 'outro';
  dataLembrete: string;
  concluida: boolean;
  dataCriacao: string;
  dataConclusao?: string;
}

export interface TemplateMessage {
  id: string;
  consultorId?: string; // null = template global
  nome: string;
  conteudo: string;
  categoria: 'boas_vindas' | 'proposta' | 'follow_up' | 'vistoria' | 'agradecimento' | 'outro';
  ativo: boolean;
}

export interface AutomacaoRegra {
  id: string;
  nome: string;
  evento: 'novo_lead' | 'mudanca_status' | 'sem_resposta' | 'proposta_enviada';
  condicao?: {
    statusOrigem?: string;
    statusDestino?: string;
    tempoSemResposta?: number; // em horas
  };
  acao: 'enviar_mensagem' | 'criar_tarefa' | 'notificar_consultor';
  parametros: {
    templateId?: string;
    mensagem?: string;
    tipoTarefa?: string;
  };
  ativa: boolean;
}

export interface EtapaFunil {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  sistema: boolean; // etapas do sistema não podem ser deletadas
}

export interface ConfiguracaoSistema {
  id: string;
  nomeEmpresa: string;
  logoUrl?: string;
  corPrimaria: string;
  corSecundaria: string;
  etapasFunil: EtapaFunil[];
  planosProtecao: PlanoProtecao[];
  templatesGlobais: string[]; // IDs dos templates
  notificacaoSonora: boolean;
  darkMode: boolean;
}

export interface StatusWhatsApp {
  consultorId: string;
  conectado: boolean;
  numero?: string;
  qrCode?: string;
  ultimaAtualizacao: string;
}

// Estatísticas
export interface EstatisticasConsultor {
  consultorId: string;
  periodo: 'hoje' | 'semana' | 'mes';
  totalLeads: number;
  leadsPorStatus: Record<string, number>;
  mensagensEnviadas: number;
  mensagensRecebidas: number;
  propostasEnviadas: number;
  conversoes: number;
  taxaConversao: number;
  tempoMedioResposta: number; // em minutos
}

// ============================================
// TIPOS DE FOLLOW-UP
// ============================================

export type FaseFollowUp = 'novo' | 'primeiro_contato' | 'proposta_enviada' | 'convertido' | 'perdido';

export interface FollowUpSequencia {
  id: number;
  nome: string;
  descricao?: string;
  fase_inicio: FaseFollowUp;
  ativo: boolean;
  automatico: boolean; // Se inicia automaticamente ao entrar na fase
  prioridade: number;
  criado_por: number;
  criador_nome?: string;
  total_leads_ativos?: number;
  criado_em: string;
  atualizado_em: string;
  mensagens?: FollowUpMensagem[];
}

export interface FollowUpMensagem {
  id: number;
  sequencia_id: number;
  ordem: number;
  dias_espera: number;
  conteudo: string;
  tipo_mensagem: 'texto' | 'audio' | 'imagem' | 'documento';
  media_url?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface FollowUpLead {
  id: number;
  lead_id: number;
  sequencia_id: number;
  sequencia_nome?: string;
  fase_inicio?: FaseFollowUp;
  mensagem_atual: number;
  status: 'ativo' | 'pausado' | 'concluido' | 'cancelado';
  data_inicio: string;
  data_proxima_mensagem?: string;
  pausado_em?: string;
  concluido_em?: string;
  motivo_pausa?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface FollowUpHistorico {
  id: number;
  followup_lead_id: number;
  mensagem_id: number;
  lead_id: number;
  conteudo?: string;
  tipo_mensagem?: string;
  sequencia_nome?: string;
  enviado_em: string;
  status_envio: 'sucesso' | 'falha' | 'pendente';
  erro?: string;
}

export interface FollowUpEstatisticas {
  sequencia_id: number;
  sequencia_nome: string;
  fase_inicio: FaseFollowUp;
  total_leads: number;
  leads_ativos: number;
  leads_concluidos: number;
  leads_pausados: number;
  leads_cancelados: number;
  total_mensagens_enviadas: number;
  mensagens_sucesso: number;
  mensagens_falha: number;
}

export interface ProximoEnvio {
  followup_lead_id: number;
  lead_id: number;
  lead_nome: string;
  lead_telefone: string;
  sequencia_nome: string;
  mensagem_conteudo: string;
  tipo_mensagem: string;
  data_proxima_mensagem: string;
  mensagem_atual: number;
  fase_inicio: FaseFollowUp;
}

// ============================================
// TIPOS DE INDICAÇÕES
// ============================================

export type StatusIndicacao = 'pendente' | 'enviado_crm' | 'respondeu' | 'converteu' | 'engano' | 'perdido';
export type TipoTransacaoIndicador = 'bloqueio' | 'liberacao' | 'perda' | 'saque' | 'estorno';
export type StatusSaque = 'solicitado' | 'aprovado' | 'pago' | 'rejeitado' | 'cancelado';
export type TipoPixIndicador = 'cpf' | 'email' | 'telefone' | 'aleatorio';

export interface Indicador {
  id: string;
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  cpf?: string;
  avatar?: string;
  saldoDisponivel: number;
  saldoBloqueado: number;
  saldoPerdido: number;
  totalIndicacoes: number;
  indicacoesRespondidas: number;
  indicacoesConvertidas: number;
  pixChave?: string;
  pixTipo?: TipoPixIndicador;
  ativo: boolean;
  dataCriacao: string;
  ultimoAcesso?: string;
}

export interface Indicacao {
  id: string;
  indicadorId: string;
  leadId?: string;
  nomeIndicado: string;
  telefoneIndicado: string;
  whatsappValidado: boolean;
  status: StatusIndicacao;
  comissaoResposta: number;
  comissaoVenda: number;
  dataIndicacao: string;
  dataResposta?: string;
  dataConversao?: string;
  dataValidacaoWhatsapp?: string;
}

export interface TransacaoIndicador {
  id: string;
  indicadorId: string;
  indicacaoId?: string;
  tipo: TipoTransacaoIndicador;
  valor: number;
  saldoAnterior: number;
  saldoNovo: number;
  descricao?: string;
  dataTransacao: string;
}

export interface SaqueIndicador {
  id: string;
  indicadorId: string;
  valor: number;
  pixChave: string;
  pixTipo: string;
  status: StatusSaque;
  comprovanteUrl?: string;
  dataSolicitacao: string;
  dataPagamento?: string;
  dataAtualizacao: string;
  observacoes?: string;
}

export interface DashboardIndicador {
  indicador: Indicador;
  saldos: {
    disponivel: number;
    bloqueado: number;
    perdido: number;
    total: number;
  };
  estatisticas: {
    totalIndicacoes: number;
    indicacoesRespondidas: number;
    indicacoesConvertidas: number;
    indicacoesPendentes: number;
    indicacoesEngano: number;
    taxaResposta: number;
    taxaConversao: number;
  };
  indicacoesRecentes: IndicacaoDetalhada[];
  transacoesRecentes: TransacaoIndicador[];
}

export interface IndicacaoDetalhada extends Indicacao {
  indicadorNome?: string;
  leadNome?: string;
  leadStatus?: string;
  consultorNome?: string;
}

export interface ValidacaoWhatsApp {
  telefone: string;
  valido: boolean;
  existe: boolean;
  mensagem?: string;
}
