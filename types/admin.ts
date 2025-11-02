// ===== TIPOS DO PAINEL ADMIN =====

// Níveis hierárquicos
export type RoleAdmin = 'diretor' | 'gerente' | 'supervisor';

// Usuário Admin
export interface UsuarioAdmin {
  id: number;
  nome: string;
  email: string;
  senha: string;
  role: RoleAdmin;
  nivel: number;
  foto?: string;
  telefone?: string;
  dataCadastro: string;
  ultimoAcesso?: string;
  ativo: boolean;
  gestorNome?: string;
  // Relacionamentos hierárquicos
  supervisores?: number[]; // IDs - para gerentes
  vendedores?: number[]; // IDs - para gerentes e supervisores
}

// Vendedor (usuário do CRM)
export interface Vendedor {
  id: number;
  nome: string;
  email: string;
  foto?: string;
  telefone?: string;
  whatsappConectado: boolean;
  dataCadastro: string;
  ultimoAcesso?: string;
  ativo: boolean;
  supervisorId?: number;
  gerenteId?: number;
  gestorNome?: string;
  // Métricas
  leadsAtivos: number;
  conversoes: number;
  taxaConversao: number;
  faturamento: number;
}

// Indicador
export interface Indicador {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  dataCadastro: string;
  ultimoAcesso?: string;
  ativo: boolean;
  gestorNome?: string;
  // Financeiro
  saldoDisponivel: number;
  saldoBloqueado: number;
  saldoPerdido: number;
  totalPago: number;
  // Métricas
  totalIndicacoes: number;
  indicacoesRespondidas: number;
  indicacoesConvertidas: number;
  taxaConversao: number;
}

// Funil
export interface Funil {
  id: number;
  nome: string;
  descricao?: string;
  cor: string;
  icone: string;
  etapas: EtapaFunil[];
  ativo: boolean;
  global: boolean; // true = todos podem usar, false = apenas usuários específicos
  usuariosVinculados?: number[]; // IDs dos vendedores que podem usar
  dataCriacao: string;
}

// Etapa do Funil
export interface EtapaFunil {
  id: string;
  nome: string;
  ordem: number;
  cor: string;
}

// Solicitação de Saque
export interface SolicitacaoSaque {
  id: number;
  indicadorId: number;
  indicadorNome: string;
  indicadorEmail: string;
  valor: number;
  dataSolicitacao: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  motivoRejeicao?: string;
  dataProcessamento?: string;
  processadoPor?: string;
  processadoPorNome?: string;
}

// Estatísticas CRM
export interface EstatisticasCRM {
  faturamentoTotal: number;
  faturamentoMesAtual: number;
  leadsTotal: number;
  leadsAtivos: number;
  conversoes: number;
  conversoesMes: number;
  taxaConversao: number;
  tempoMedioFechamento: number; // em dias
  metaMensal: number;
  metaAtingida: number; // percentual
}

// Estatísticas Indicação
export interface EstatisticasIndicacao {
  totalPago: number;
  totalBloqueado: number;
  totalPerdido: number;
  indicacoesTotal: number;
  indicacoesRespondidas: number;
  indicacoesConvertidas: number;
  taxaConversao: number;
  saquesAprovados: number;
  saquesPendentes: number;
  saquesRejeitados: number;
}

// Top Performer (vendedor)
export interface TopPerformer {
  id: number;
  nome: string;
  foto?: string;
  vendas: number;
  faturamento: number;
  taxaConversao: number;
  posicao: number;
}

// Top Indicador
export interface TopIndicador {
  id: number;
  nome: string;
  indicacoes: number;
  convertidas: number;
  faturamentoGerado: number;
  comissoesRecebidas: number;
  posicao: number;
}

// Alerta do Sistema
export interface Alerta {
  id: number;
  tipo: 'warning' | 'error' | 'info';
  titulo: string;
  mensagem: string;
  data: string;
  lido: boolean;
  link?: string;
}

// Distribuição do Funil
export interface DistribuicaoFunil {
  etapa: string;
  quantidade: number;
  percentual: number;
}

// Chat do Vendedor (para visão geral)
export interface ChatVendedor {
  vendedorId: number;
  vendedorNome: string;
  vendedorFoto?: string;
  whatsappConectado: boolean;
  sistemaOnline: boolean;
  chatsAtivos: number;
  distribuicao: DistribuicaoFunil[];
  ultimaMensagem?: string;
  ultimaMensagemData?: string;
}

// Log de Auditoria
export interface LogAuditoria {
  id: number;
  usuarioId: number;
  usuarioNome: string;
  usuarioRole: string;
  acao: string;
  descricao: string;
  data: string;
  ip?: string;
  navegador?: string;
}

// Configuração do Sistema
export interface ConfiguracaoSistema {
  comissaoResposta: number;
  comissaoVenda: number;
  valorMinimoSaque: number;
  diasSemRespostaAlerta: number;
  metaMensalVendas: number;
  metaMensalFaturamento: number;
}

// View ativa no painel
export type ViewAdmin = 
  | 'dashboard-crm'
  | 'dashboard-indicacao'
  | 'usuarios-lista'
  | 'cadastro-vendedor'
  | 'cadastro-indicador'
  | 'cadastro-admin'
  | 'funis-gestao'
  | 'chat-visao-geral'
  | 'indicadores-lista'
  | 'relatorios-crm'
  | 'relatorios-indicacao'
  | 'financeiro'
  | 'configuracoes'
  | 'auditoria';
