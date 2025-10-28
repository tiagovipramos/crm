import { Request, Response } from 'express';
import { pool } from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// =========================================
// LOGIN DE ADMIN
// =========================================
export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const connection = await pool.getConnection();
    
    try {
      // Buscar admin no banco
      const [admins]: any = await connection.query(
        'SELECT id, nome, email, senha, telefone, role, ativo FROM consultores WHERE email = ?',
        [email]
      );

      if (admins.length === 0) {
        connection.release();
        return res.status(401).json({ error: 'Email ou senha inválidos' });
      }

      const admin = admins[0];

      // Verificar se o usuário está ativo
      if (admin.ativo === false || admin.ativo === 0) {
        connection.release();
        return res.status(403).json({ error: 'Usuário Bloqueado' });
      }

      // Verificar senha
      const senhaValida = await bcrypt.compare(senha, admin.senha);

      if (!senhaValida) {
        connection.release();
        return res.status(401).json({ error: 'Email ou senha inválidos' });
      }

      // Atualizar último acesso
      await connection.query(
        'UPDATE consultores SET ultimo_acesso = NOW() WHERE id = ?',
        [admin.id]
      );

      // Gerar token JWT
      const secret = process.env.JWT_SECRET || 'secret';
      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: admin.role },
        secret,
        { expiresIn: '7d' }
      );

      connection.release();

      // Não retornar a senha
      delete admin.senha;

      res.json({
        token,
        admin: {
          id: admin.id,
          nome: admin.nome,
          email: admin.email,
          telefone: admin.telefone,
          role: admin.role || 'vendedor'
        }
      });
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erro no login admin:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

// =========================================
// ESTATÍSTICAS DO CRM
// =========================================
export const getEstatisticasCRM = async (req: Request, res: Response) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Obter faturamento total (vamos considerar conversões com valor médio de R$ 2.200)
    const [conversoes]: any = await connection.query(`
      SELECT COUNT(*) as total_conversoes
      FROM leads 
      WHERE status = 'convertido'
    `);
    
    const totalConversoes = parseInt(conversoes[0]?.total_conversoes || 0);
    const valorMedioVenda = 2200; // R$ 2.200 por venda
    const faturamentoTotal = totalConversoes * valorMedioVenda;
    
    // Conversões do mês atual
    const [conversoesMes]: any = await connection.query(`
      SELECT COUNT(*) as conversoes_mes
      FROM leads 
      WHERE status = 'convertido' 
      AND MONTH(data_atualizacao) = MONTH(NOW())
      AND YEAR(data_atualizacao) = YEAR(NOW())
    `);
    
    const conversoesMesAtual = parseInt(conversoesMes[0]?.conversoes_mes || 0);
    const faturamentoMesAtual = conversoesMesAtual * valorMedioVenda;
    
    // Leads totais e ativos
    const [leads]: any = await connection.query(`
      SELECT 
        COUNT(*) as total_leads,
        SUM(CASE WHEN status NOT IN ('convertido', 'perdido') THEN 1 ELSE 0 END) as leads_ativos
      FROM leads
    `);
    
    const leadsTotal = parseInt(leads[0]?.total_leads || 0);
    const leadsAtivos = parseInt(leads[0]?.leads_ativos || 0);
    
    // Taxa de conversão
    const taxaConversao = leadsTotal > 0 ? (totalConversoes / leadsTotal) * 100 : 0;
    
    // Tempo médio de fechamento (em dias)
    const [tempoMedio]: any = await connection.query(`
      SELECT AVG(DATEDIFF(data_atualizacao, data_criacao)) as tempo_medio
      FROM leads 
      WHERE status = 'convertido'
      AND data_atualizacao IS NOT NULL
      AND data_criacao IS NOT NULL
    `);
    
    const tempoMedioFechamento = parseFloat(tempoMedio[0]?.tempo_medio || 0);
    
    // Meta mensal (R$ 50.000)
    const metaMensal = 50000;
    const metaAtingida = metaMensal > 0 ? (faturamentoMesAtual / metaMensal) * 100 : 0;
    
    res.json({
      faturamentoTotal,
      faturamentoMesAtual,
      leadsTotal,
      leadsAtivos,
      conversoes: totalConversoes,
      conversoesMes: conversoesMesAtual,
      taxaConversao: parseFloat(taxaConversao.toFixed(1)),
      tempoMedioFechamento: parseFloat(tempoMedioFechamento.toFixed(1)),
      metaMensal,
      metaAtingida: parseFloat(metaAtingida.toFixed(1))
    });
    
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas CRM:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Erro ao buscar estatísticas', error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// =========================================
// TOP PERFORMERS (VENDEDORES)
// =========================================
export const getTopPerformers = async (req: Request, res: Response) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [vendedores]: any = await connection.query(`
      SELECT 
        c.id,
        c.nome,
        COUNT(CASE WHEN l.status = 'convertido' THEN 1 END) as vendas,
        COUNT(CASE WHEN l.status = 'convertido' THEN 1 END) * 2200 as faturamento,
        CASE 
          WHEN COUNT(l.id) > 0 
          THEN (COUNT(CASE WHEN l.status = 'convertido' THEN 1 END) / COUNT(l.id)) * 100 
          ELSE 0 
        END as taxa_conversao
      FROM consultores c
      LEFT JOIN leads l ON l.consultor_id = c.id
      WHERE (c.role = 'vendedor' OR c.role IS NULL OR c.role = '')
      GROUP BY c.id, c.nome
      HAVING vendas > 0
      ORDER BY faturamento DESC
      LIMIT 5
    `);
    
    const topPerformers = vendedores.map((v: any, index: number) => ({
      id: v.id,
      nome: v.nome,
      vendas: parseInt(v.vendas) || 0,
      faturamento: parseFloat(v.faturamento) || 0,
      taxaConversao: parseFloat(parseFloat(v.taxa_conversao || 0).toFixed(1)) || 0,
      posicao: index + 1
    }));
    
    res.json(topPerformers);
    
  } catch (error) {
    console.error('Erro ao buscar top performers:', error);
    res.status(500).json({ message: 'Erro ao buscar top performers' });
  } finally {
    if (connection) connection.release();
  }
};

// =========================================
// DISTRIBUIÇÃO DO FUNIL
// =========================================
export const getDistribuicaoFunil = async (req: Request, res: Response) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [distribuicao]: any = await connection.query(`
      SELECT 
        status,
        COUNT(*) as quantidade
      FROM leads
      GROUP BY status
    `);
    
    // Mapear status para etapas do funil
    const etapasMap: Record<string, { etapa: string, cor: string }> = {
      'novo': { etapa: 'Novo', cor: '#3b82f6' },
      'contato': { etapa: 'Contato', cor: '#8b5cf6' },
      'proposta': { etapa: 'Proposta', cor: '#f59e0b' },
      'aguardando': { etapa: 'Aguardando', cor: '#ef4444' },
      'vistoria': { etapa: 'Vistoria', cor: '#06b6d4' },
      'convertido': { etapa: 'Convertido', cor: '#10b981' },
      'perdido': { etapa: 'Perdido', cor: '#64748b' }
    };
    
    const distribuicaoFunil = distribuicao.map((d: any) => ({
      etapa: etapasMap[d.status]?.etapa || d.status,
      quantidade: d.quantidade || 0,
      cor: etapasMap[d.status]?.cor || '#64748b'
    }));
    
    res.json(distribuicaoFunil);
    
  } catch (error) {
    console.error('Erro ao buscar distribuição do funil:', error);
    res.status(500).json({ message: 'Erro ao buscar distribuição do funil' });
  } finally {
    if (connection) connection.release();
  }
};

// =========================================
// ESTATÍSTICAS DE INDICAÇÕES
// =========================================
export const getEstatisticasIndicacao = async (req: Request, res: Response) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Total pago e bloqueado
    const [totais]: any = await connection.query(`
      SELECT 
        SUM(saldo_disponivel) as total_disponivel,
        SUM(saldo_bloqueado) as total_bloqueado,
        SUM(saldo_perdido) as total_perdido,
        SUM(total_indicacoes) as total_indicacoes,
        SUM(indicacoes_respondidas) as total_respondidas,
        SUM(indicacoes_convertidas) as total_convertidas
      FROM indicadores
    `);
    
    const totalPago = parseFloat(totais[0]?.total_disponivel || 0);
    const totalBloqueado = parseFloat(totais[0]?.total_bloqueado || 0);
    const totalPerdido = parseFloat(totais[0]?.total_perdido || 0);
    const indicacoesTotal = totais[0]?.total_indicacoes || 0;
    const indicacoesRespondidas = totais[0]?.total_respondidas || 0;
    const indicacoesConvertidas = totais[0]?.total_convertidas || 0;
    
    // Taxa de conversão
    const taxaConversao = indicacoesTotal > 0 
      ? (indicacoesConvertidas / indicacoesTotal) * 100 
      : 0;
    
    // Saques
    const [saques]: any = await connection.query(`
      SELECT 
        SUM(CASE WHEN status IN ('aprovado', 'pago') THEN 1 ELSE 0 END) as aprovados,
        SUM(CASE WHEN status = 'solicitado' THEN 1 ELSE 0 END) as pendentes,
        SUM(CASE WHEN status = 'rejeitado' THEN 1 ELSE 0 END) as rejeitados
      FROM saques_indicador
    `);
    
    res.json({
      totalPago,
      totalBloqueado,
      totalPerdido,
      indicacoesTotal,
      indicacoesRespondidas,
      indicacoesConvertidas,
      taxaConversao: parseFloat(taxaConversao.toFixed(1)),
      saquesAprovados: saques[0]?.aprovados || 0,
      saquesPendentes: saques[0]?.pendentes || 0,
      saquesRejeitados: saques[0]?.rejeitados || 0
    });
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas de indicação:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas de indicação' });
  } finally {
    if (connection) connection.release();
  }
};

// =========================================
// TOP INDICADORES
// =========================================
export const getTopIndicadores = async (req: Request, res: Response) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [indicadores]: any = await connection.query(`
      SELECT 
        id,
        nome,
        total_indicacoes as indicacoes,
        indicacoes_convertidas as convertidas,
        indicacoes_convertidas * 2200 as faturamento_gerado,
        (saldo_disponivel + saldo_bloqueado) as comissoes_recebidas
      FROM indicadores
      WHERE total_indicacoes > 0
      ORDER BY comissoes_recebidas DESC
      LIMIT 5
    `);
    
    const topIndicadores = indicadores.map((i: any, index: number) => ({
      id: i.id,
      nome: i.nome,
      indicacoes: i.indicacoes || 0,
      convertidas: i.convertidas || 0,
      faturamentoGerado: parseFloat(i.faturamento_gerado) || 0,
      comissoesRecebidas: parseFloat(i.comissoes_recebidas) || 0,
      posicao: index + 1
    }));
    
    res.json(topIndicadores);
    
  } catch (error) {
    console.error('Erro ao buscar top indicadores:', error);
    res.status(500).json({ message: 'Erro ao buscar top indicadores' });
  } finally {
    if (connection) connection.release();
  }
};

// =========================================
// ALERTAS
// =========================================
export const getAlertas = async (req: Request, res: Response) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const alertas = [];
    
    // Alerta 1: Leads sem resposta há mais de 3 dias
    const [leadsSemResposta]: any = await connection.query(`
      SELECT COUNT(*) as total
      FROM leads
      WHERE status = 'novo'
      AND DATEDIFF(CURRENT_DATE(), data_criacao) > 3
    `);
    
    if (leadsSemResposta[0]?.total > 0) {
      alertas.push({
        id: 1,
        tipo: 'warning',
        titulo: 'Leads sem resposta',
        mensagem: `${leadsSemResposta[0].total} leads sem resposta há mais de 3 dias`,
        data: new Date().toISOString().replace('T', ' ').substring(0, 19),
        lido: false,
        link: '/admin?view=relatorios-crm'
      });
    }
    
    // Alerta 2: Propostas pendentes há mais de 7 dias
    const [propostasPendentes]: any = await connection.query(`
      SELECT COUNT(*) as total
      FROM leads
      WHERE status = 'aguardando'
      AND DATEDIFF(CURRENT_DATE(), data_atualizacao) > 7
    `);
    
    if (propostasPendentes[0]?.total > 0) {
      alertas.push({
        id: 2,
        tipo: 'warning',
        titulo: 'Propostas pendentes',
        mensagem: `${propostasPendentes[0].total} propostas aguardando retorno há mais de 7 dias`,
        data: new Date().toISOString().replace('T', ' ').substring(0, 19),
        lido: false,
        link: '/admin?view=relatorios-crm'
      });
    }
    
    // Alerta 3: Saques pendentes
    const [saquesPendentes]: any = await connection.query(`
      SELECT COUNT(*) as total
      FROM saques_indicador
      WHERE status = 'solicitado'
    `);
    
    if (saquesPendentes[0]?.total > 0) {
      alertas.push({
        id: 3,
        tipo: 'info',
        titulo: 'Saques pendentes',
        mensagem: `${saquesPendentes[0].total} solicitações de saque aguardando aprovação`,
        data: new Date().toISOString().replace('T', ' ').substring(0, 19),
        lido: false,
        link: '/admin?view=financeiro'
      });
    }
    
    // Alerta 4: Indicadores inativos
    const [indicadoresInativos]: any = await connection.query(`
      SELECT COUNT(*) as total
      FROM indicadores
      WHERE ultimo_acesso IS NOT NULL
      AND DATEDIFF(CURRENT_DATE(), ultimo_acesso) > 30
    `);
    
    if (indicadoresInativos[0]?.total > 0) {
      alertas.push({
        id: 4,
        tipo: 'info',
        titulo: 'Indicadores inativos',
        mensagem: `${indicadoresInativos[0].total} indicadores sem indicar há mais de 30 dias`,
        data: new Date().toISOString().replace('T', ' ').substring(0, 19),
        lido: false,
        link: '/admin?view=usuarios-lista'
      });
    }
    
    res.json(alertas);
    
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    res.status(500).json({ message: 'Erro ao buscar alertas' });
  } finally {
    if (connection) connection.release();
  }
};

// =========================================
// LISTA DE VENDEDORES
// =========================================
export const getVendedores = async (req: Request, res: Response) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Obter informações do usuário logado
    const usuarioLogado = (req as any).user;
    const userId = usuarioLogado?.id;
    const userRole = usuarioLogado?.role;
    
    console.log('[getVendedores] User ID:', userId);
    console.log('[getVendedores] User Role:', userRole);
    
    // Construir a query com filtro baseado no role
    let whereClause = `WHERE (c.role = 'vendedor' OR c.role IS NULL OR c.role = '')`;
    
    // Hierarquia em cascata:
    // - Diretor vê TODOS
    // - Gerente vê: o que ele cadastrou + o que os supervisores dele cadastraram
    // - Supervisor vê: apenas o que ele cadastrou
    
    if (userRole === 'gerente' && userId) {
      console.log('[getVendedores] Aplicando filtro de gerente (cascata)');
      // Gerente vê vendedores que ele cadastrou OU que foram cadastrados por supervisores que ele cadastrou
      whereClause += ` AND (c.created_by = '${userId}' OR c.created_by IN (
        SELECT id FROM consultores WHERE created_by = '${userId}' AND role = 'supervisor'
      ))`;
    } else if (userRole === 'supervisor' && userId) {
      // Supervisor vê apenas os que ele cadastrou
      console.log('[getVendedores] Aplicando filtro de supervisor');
      whereClause += ` AND c.created_by = '${userId}'`;
    }
    // Diretor vê todos os vendedores (sem filtro adicional)
    
    const [vendedores]: any = await connection.query(`
      SELECT 
        c.id,
        c.nome,
        c.email,
        c.telefone,
        c.status_conexao as whatsapp_conectado,
        c.data_criacao as data_cadastro,
        c.ultimo_acesso,
        c.created_by,
        c.ativo,
        criador.nome as gestor_nome,
        COUNT(l.id) as leads_ativos,
        COUNT(CASE WHEN l.status = 'convertido' THEN 1 END) as conversoes,
        CASE 
          WHEN COUNT(l.id) > 0 
          THEN (COUNT(CASE WHEN l.status = 'convertido' THEN 1 END) / COUNT(l.id)) * 100 
          ELSE 0 
        END as taxa_conversao,
        COUNT(CASE WHEN l.status = 'convertido' THEN 1 END) * 2200 as faturamento
      FROM consultores c
      LEFT JOIN leads l ON l.consultor_id = c.id
      LEFT JOIN consultores criador ON c.created_by = criador.id
      ${whereClause}
      GROUP BY c.id, c.nome, c.email, c.telefone, c.status_conexao, c.data_criacao, c.ultimo_acesso, c.created_by, c.ativo, criador.nome
      ORDER BY c.nome
    `);
    
    const vendedoresFormatados = vendedores.map((v: any) => ({
      id: v.id,
      nome: v.nome,
      email: v.email,
      telefone: v.telefone || '',
      whatsappConectado: v.whatsapp_conectado === 'online',
      dataCadastro: v.data_cadastro,
      ultimoAcesso: v.ultimo_acesso,
      ativo: v.ativo !== false && v.ativo !== 0,
      gestorNome: v.gestor_nome || 'Sistema',
      leadsAtivos: parseInt(v.leads_ativos) || 0,
      conversoes: parseInt(v.conversoes) || 0,
      taxaConversao: parseFloat(v.taxa_conversao) || 0,
      faturamento: parseFloat(v.faturamento) || 0
    }));
    
    res.json(vendedoresFormatados);
    
  } catch (error: any) {
    console.error('Erro ao buscar vendedores:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'Erro ao buscar vendedores', error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// =========================================
// LISTA DE ADMINS
// =========================================
export const getAdmins = async (req: Request, res: Response) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Obter informações do usuário logado
    const usuarioLogado = (req as any).user;
    const userId = usuarioLogado?.id;
    const userRole = usuarioLogado?.role;
    
    // Construir a query com filtro baseado no role
    let whereClause = `WHERE c.role IN ('diretor', 'gerente', 'supervisor')`;
    
    // Se for gerente, apenas listar supervisores que ele cadastrou
    if (userRole === 'gerente' && userId) {
      whereClause = `WHERE c.role = 'supervisor' AND c.created_by = '${userId}'`;
    } else if (userRole === 'supervisor') {
      // Supervisor não vê outros admins na lista
      whereClause = `WHERE c.role = 'supervisor' AND c.id = '${userId}'`;
    }
    // Diretor vê todos os admins
    
    const [admins]: any = await connection.query(`
      SELECT 
        c.id,
        c.nome,
        c.email,
        c.telefone,
        c.role,
        c.data_criacao as data_cadastro,
        c.ultimo_acesso,
        c.created_by,
        c.ativo,
        criador.nome as gestor_nome
      FROM consultores c
      LEFT JOIN consultores criador ON c.created_by = criador.id
      ${whereClause}
      ORDER BY 
        CASE c.role 
          WHEN 'diretor' THEN 1
          WHEN 'gerente' THEN 2  
          WHEN 'supervisor' THEN 3
        END,
        c.nome
    `);
    
    const adminsFormatados = admins.map((a: any) => ({
      id: a.id,
      nome: a.nome,
      email: a.email,
      telefone: a.telefone || '',
      role: a.role,
      nivel: a.role === 'diretor' ? 1 : a.role === 'gerente' ? 2 : 3,
      dataCadastro: a.data_cadastro,
      ultimoAcesso: a.ultimo_acesso,
      ativo: a.ativo !== false && a.ativo !== 0,
      gestorNome: a.gestor_nome || 'Sistema',
      vendedores: [],
      supervisores: []
    }));
    
    res.json(adminsFormatados);
    
  } catch (error: any) {
    console.error('Erro ao buscar admins:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'Erro ao buscar admins', error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// =========================================
// LISTA DE INDICADORES
// =========================================
export const getIndicadores = async (req: Request, res: Response) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Obter informações do usuário logado
    const usuarioLogado = (req as any).user;
    const userId = usuarioLogado?.id;
    const userRole = usuarioLogado?.role;
    
    // Construir a query com filtro baseado no role
    let whereClause = '';
    
    // Hierarquia em cascata (mesma lógica dos vendedores):
    // - Diretor vê TODOS
    // - Gerente vê: o que ele cadastrou + o que os supervisores dele cadastraram
    // - Supervisor vê: apenas o que ele cadastrou
    
    if (userRole === 'gerente' && userId) {
      // Gerente vê indicadores que ele cadastrou OU que foram cadastrados por supervisores que ele cadastrou
      whereClause = `WHERE (created_by = '${userId}' OR created_by IN (
        SELECT id FROM consultores WHERE created_by = '${userId}' AND role = 'supervisor'
      ))`;
    } else if (userRole === 'supervisor' && userId) {
      // Supervisor vê apenas os que ele cadastrou
      whereClause = `WHERE created_by = '${userId}'`;
    }
    // Diretor vê todos os indicadores (sem filtro)
    
    const [indicadores]: any = await connection.query(`
      SELECT 
        i.id,
        i.nome,
        i.email,
        i.telefone,
        i.cpf,
        i.data_criacao as data_cadastro,
        i.ultimo_acesso,
        i.ativo,
        i.created_by,
        criador.nome as gestor_nome,
        i.saldo_disponivel,
        i.saldo_bloqueado,
        i.saldo_perdido,
        i.total_indicacoes,
        i.indicacoes_respondidas,
        i.indicacoes_convertidas,
        CASE 
          WHEN i.total_indicacoes > 0 
          THEN (i.indicacoes_convertidas / i.total_indicacoes) * 100 
          ELSE 0 
        END as taxa_conversao,
        (i.saldo_disponivel + i.saldo_bloqueado) as total_pago
      FROM indicadores i
      LEFT JOIN consultores criador ON i.created_by = criador.id
      ${whereClause}
      ORDER BY i.nome
    `);
    
    const indicadoresFormatados = indicadores.map((i: any) => ({
      id: i.id,
      nome: i.nome,
      email: i.email,
      telefone: i.telefone,
      cpf: i.cpf,
      dataCadastro: i.data_cadastro,
      ultimoAcesso: i.ultimo_acesso,
      ativo: i.ativo,
      gestorNome: i.gestor_nome || 'Sistema',
      saldoDisponivel: parseFloat(i.saldo_disponivel),
      saldoBloqueado: parseFloat(i.saldo_bloqueado),
      saldoPerdido: parseFloat(i.saldo_perdido),
      totalIndicacoes: i.total_indicacoes,
      indicacoesRespondidas: i.indicacoes_respondidas,
      indicacoesConvertidas: i.indicacoes_convertidas,
      taxaConversao: parseFloat(i.taxa_conversao) || 0,
      totalPago: parseFloat(i.total_pago)
    }));
    
    res.json(indicadoresFormatados);
    
  } catch (error: any) {
    console.error('Erro ao buscar indicadores:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'Erro ao buscar indicadores', error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// =========================================
// SOLICITAÇÕES DE SAQUE
// =========================================
export const getSolicitacoesSaque = async (req: Request, res: Response) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [saques]: any = await connection.query(`
      SELECT 
        s.id,
        s.indicador_id,
        i.nome as indicador_nome,
        i.email as indicador_email,
        s.valor,
        s.data_solicitacao,
        s.status
      FROM saques_indicador s
      INNER JOIN indicadores i ON i.id = s.indicador_id
      WHERE s.status = 'solicitado'
      ORDER BY s.data_solicitacao DESC
    `);
    
    const saquesFormatados = saques.map((s: any) => ({
      id: s.id,
      indicadorId: s.indicador_id,
      indicadorNome: s.indicador_nome,
      indicadorEmail: s.indicador_email,
      valor: parseFloat(s.valor),
      dataSolicitacao: s.data_solicitacao,
      status: s.status
    }));
    
    res.json(saquesFormatados);
    
  } catch (error) {
    console.error('Erro ao buscar solicitações de saque:', error);
    res.status(500).json({ message: 'Erro ao buscar solicitações de saque' });
  } finally {
    if (connection) connection.release();
  }
};

// =========================================
// CRIAR VENDEDOR/CONSULTOR
// =========================================
export const criarVendedor = async (req: Request, res: Response) => {
  try {
    const { nome, email, telefone, senha } = req.body;
    
    if (!nome || !email || !telefone || !senha) {
      return res.status(400).json({ message: 'Dados incompletos' });
    }

    const usuarioLogado = (req as any).user;
    const createdBy = usuarioLogado?.id || null;

    const connection = await pool.getConnection();
    
    try {
      const [existente]: any = await connection.query(
        'SELECT id FROM consultores WHERE email = ?',
        [email]
      );
      
      if (existente.length > 0) {
        connection.release();
        return res.status(400).json({ message: 'Email já cadastrado' });
      }

      const senhaHash = await bcrypt.hash(senha, 10);
      
      const [result]: any = await connection.query(
        `INSERT INTO consultores (nome, email, senha, telefone, status_conexao, created_by) 
         VALUES (?, ?, ?, ?, 'offline', ?)`,
        [nome, email, senhaHash, telefone, createdBy]
      );
      
      connection.release();
      
      res.status(201).json({
        id: result.insertId,
        nome,
        email,
        telefone,
        whatsappConectado: false,
        dataCadastro: new Date().toISOString(),
        ativo: true,
        leadsAtivos: 0,
        conversoes: 0,
        taxaConversao: 0,
        faturamento: 0
      });
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erro ao criar vendedor:', error);
    res.status(500).json({ message: 'Erro ao criar vendedor' });
  }
};

// =========================================
// CRIAR INDICADOR
// =========================================
export const criarIndicador = async (req: Request, res: Response) => {
  try {
    const { nome, email, telefone, cpf, senha } = req.body;
    
    if (!nome || !email || !telefone || !cpf || !senha) {
      return res.status(400).json({ message: 'Dados incompletos' });
    }

    const usuarioLogado = (req as any).user;
    const createdBy = usuarioLogado?.id || null;

    const connection = await pool.getConnection();
    
    try {
      const [existente]: any = await connection.query(
        'SELECT id FROM indicadores WHERE email = ? OR cpf = ?',
        [email, cpf]
      );
      
      if (existente.length > 0) {
        connection.release();
        return res.status(400).json({ message: 'Email ou CPF já cadastrado' });
      }

      const senhaHash = await bcrypt.hash(senha, 10);
      
      const [result]: any = await connection.query(
        `INSERT INTO indicadores (nome, email, senha, telefone, cpf, created_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [nome, email, senhaHash, telefone, cpf, createdBy]
      );
      
      connection.release();
      
      res.status(201).json({
        id: result.insertId,
        nome,
        email,
        telefone,
        cpf,
        dataCadastro: new Date().toISOString(),
        ativo: true,
        saldoDisponivel: 0,
        saldoBloqueado: 0,
        saldoPerdido: 0,
        totalIndicacoes: 0,
        indicacoesRespondidas: 0,
        indicacoesConvertidas: 0,
        taxaConversao: 0,
        totalPago: 0
      });
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erro ao criar indicador:', error);
    res.status(500).json({ message: 'Erro ao criar indicador' });
  }
};

// =========================================
// CRIAR ADMIN/GERENTE/SUPERVISOR
// =========================================
export const criarAdmin = async (req: Request, res: Response) => {
  try {
    const { nome, email, telefone, senha, role } = req.body;
    
    if (!nome || !email || !telefone || !senha || !role) {
      return res.status(400).json({ message: 'Dados incompletos' });
    }

    const usuarioLogado = (req as any).user;
    const createdBy = usuarioLogado?.id || null;
    
    if (usuarioLogado) {
      if (usuarioLogado.role === 'gerente' && role === 'diretor') {
        return res.status(403).json({ message: 'Você não tem permissão para criar Admin (Diretor)' });
      }
      
      if (usuarioLogado.role === 'supervisor' && (role === 'diretor' || role === 'gerente')) {
        return res.status(403).json({ message: 'Você não tem permissão para criar Admin/Gerente' });
      }
    }

    const connection = await pool.getConnection();
    
    try {
      const [existente]: any = await connection.query(
        'SELECT id FROM consultores WHERE email = ?',
        [email]
      );
      
      if (existente.length > 0) {
        connection.release();
        return res.status(400).json({ message: 'Email já cadastrado' });
      }

      const senhaHash = await bcrypt.hash(senha, 10);
      
      const [result]: any = await connection.query(
        `INSERT INTO consultores (nome, email, senha, telefone, status_conexao, role, created_by) 
         VALUES (?, ?, ?, ?, 'offline', ?, ?)`,
        [nome, email, senhaHash, telefone, role, createdBy]
      );
      
      connection.release();
      
      res.status(201).json({
        id: result.insertId,
        nome,
        email,
        telefone,
        role,
        nivel: role === 'diretor' ? 1 : role === 'gerente' ? 2 : 3,
        dataCadastro: new Date().toISOString(),
        ativo: true
      });
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erro ao criar admin:', error);
    res.status(500).json({ message: 'Erro ao criar admin' });
  }
};

// =========================================
// ATUALIZAR STATUS VENDEDOR
// =========================================
export const atualizarStatusVendedor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ativo } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
      await connection.query(
        'UPDATE consultores SET ativo = ? WHERE id = ?',
        [ativo, id]
      );
      
      connection.release();
      res.json({ message: 'Status atualizado' });
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erro ao atualizar status vendedor:', error);
    res.status(500).json({ message: 'Erro ao atualizar status' });
  }
};

// =========================================
// ATUALIZAR STATUS ADMIN
// =========================================
export const atualizarStatusAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ativo } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
      await connection.query(
        'UPDATE consultores SET ativo = ? WHERE id = ?',
        [ativo, id]
      );
      
      connection.release();
      res.json({ message: 'Status atualizado' });
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erro ao atualizar status admin:', error);
    res.status(500).json({ message: 'Erro ao atualizar status' });
  }
};

// =========================================
// ATUALIZAR STATUS INDICADOR
// =========================================
export const atualizarStatusIndicador = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ativo } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
      await connection.query(
        'UPDATE indicadores SET ativo = ? WHERE id = ?',
        [ativo, id]
      );
      
      connection.release();
      res.json({ message: 'Status atualizado' });
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erro ao atualizar status indicador:', error);
    res.status(500).json({ message: 'Erro ao atualizar status' });
  }
};

// =========================================
// DELETAR VENDEDOR (EXCLUIR DO BANCO)
// =========================================
export const deletarVendedor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const connection = await pool.getConnection();
    
    try {
      // Antes de deletar, remover referências nas tabelas relacionadas
      // Atualizar leads para não referenciar este consultor
      await connection.query('UPDATE leads SET consultor_id = NULL WHERE consultor_id = ?', [id]);
      
      // Deletar mensagens relacionadas aos leads deste consultor (se houver coluna consultor_id em mensagens)
      // await connection.query('DELETE FROM mensagens WHERE consultor_id = ?', [id]);
      
      // Deletar tarefas atribuídas a este consultor
      await connection.query('DELETE FROM tarefas WHERE consultor_id = ?', [id]);
      
      // Finalmente, deletar o vendedor
      const [result]: any = await connection.query(
        'DELETE FROM consultores WHERE id = ?',
        [id]
      );
      
      connection.release();
      
      if (result.affectedRows > 0) {
        res.json({ message: 'Vendedor deletado com sucesso' });
      } else {
        res.status(404).json({ message: 'Vendedor não encontrado' });
      }
      
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Erro ao deletar vendedor:', error);
    res.status(500).json({ message: 'Erro ao deletar vendedor', error: error.message });
  }
};

// =========================================
// DELETAR INDICADOR
// =========================================
export const deletarIndicador = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const connection = await pool.getConnection();
    
    try {
      await connection.query('UPDATE leads SET indicador_id = NULL WHERE indicador_id = ?', [id]);
      await connection.query('DELETE FROM saques_indicador WHERE indicador_id = ?', [id]);
      
      const [result]: any = await connection.query('DELETE FROM indicadores WHERE id = ?', [id]);
      
      connection.release();
      
      if (result.affectedRows > 0) {
        res.json({ message: 'Indicador deletado com sucesso' });
      } else {
        res.status(404).json({ message: 'Indicador não encontrado' });
      }
      
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Erro ao deletar indicador:', error);
    res.status(500).json({ message: 'Erro ao deletar indicador', error: error.message });
  }
};

// =========================================
// DELETAR ADMIN (EXCLUIR DO BANCO)
// =========================================
export const deletarAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const connection = await pool.getConnection();
    
    try {
      // Verificar se existem usuários criados por este admin
      const [usuariosCriados]: any = await connection.query(
        'SELECT COUNT(*) as total FROM consultores WHERE created_by = ?',
        [id]
      );
      
      const [indicadoresCriados]: any = await connection.query(
        'SELECT COUNT(*) as total FROM indicadores WHERE created_by = ?',
        [id]
      );
      
      const totalCriados = (usuariosCriados[0]?.total || 0) + (indicadoresCriados[0]?.total || 0);
      
      if (totalCriados > 0) {
        connection.release();
        return res.status(400).json({ 
          message: `Não é possível deletar este usuário pois existem ${totalCriados} usuário(s) criado(s) por ele. Transfira ou delete os usuários subordinados primeiro.` 
        });
      }
      
      // Antes de deletar, remover referências nas tabelas relacionadas
      // Atualizar leads para não referenciar este consultor
      await connection.query('UPDATE leads SET consultor_id = NULL WHERE consultor_id = ?', [id]);
      
      // Deletar tarefas atribuídas a este admin
      await connection.query('DELETE FROM tarefas WHERE consultor_id = ?', [id]);
      
      // Finalmente, deletar o admin
      const [result]: any = await connection.query(
        'DELETE FROM consultores WHERE id = ?',
        [id]
      );
      
      connection.release();
      
      if (result.affectedRows > 0) {
        res.json({ message: 'Admin deletado com sucesso' });
      } else {
        res.status(404).json({ message: 'Admin não encontrado' });
      }
      
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Erro ao deletar admin:', error);
    res.status(500).json({ message: 'Erro ao deletar admin', error: error.message });
  }
};

// =========================================
// EDITAR VENDEDOR
// =========================================
export const editarVendedor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, email, telefone, senha } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
      const updates: string[] = [];
      const values: any[] = [];
      
      if (nome) {
        updates.push('nome = ?');
        values.push(nome);
      }
      if (email) {
        updates.push('email = ?');
        values.push(email);
      }
      if (telefone) {
        updates.push('telefone = ?');
        values.push(telefone);
      }
      if (senha) {
        const senhaHash = await bcrypt.hash(senha, 10);
        updates.push('senha = ?');
        values.push(senhaHash);
      }
      
      if (updates.length === 0) {
        connection.release();
        return res.status(400).json({ message: 'Nenhum campo para atualizar' });
      }
      
      values.push(id);
      
      await connection.query(
        `UPDATE consultores SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      
      connection.release();
      res.json({ message: 'Vendedor atualizado com sucesso' });
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erro ao editar vendedor:', error);
    res.status(500).json({ message: 'Erro ao editar vendedor' });
  }
};

// =========================================
// EDITAR INDICADOR
// =========================================
export const editarIndicador = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, email, telefone, cpf, senha } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
      const updates: string[] = [];
      const values: any[] = [];
      
      if (nome) {
        updates.push('nome = ?');
        values.push(nome);
      }
      if (email) {
        updates.push('email = ?');
        values.push(email);
      }
      if (telefone) {
        updates.push('telefone = ?');
        values.push(telefone);
      }
      if (cpf) {
        updates.push('cpf = ?');
        values.push(cpf);
      }
      if (senha) {
        const senhaHash = await bcrypt.hash(senha, 10);
        updates.push('senha = ?');
        values.push(senhaHash);
      }
      
      if (updates.length === 0) {
        connection.release();
        return res.status(400).json({ message: 'Nenhum campo para atualizar' });
      }
      
      values.push(id);
      
      await connection.query(
        `UPDATE indicadores SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      
      connection.release();
      res.json({ message: 'Indicador atualizado com sucesso' });
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erro ao editar indicador:', error);
    res.status(500).json({ message: 'Erro ao editar indicador' });
  }
};

// =========================================
// EDITAR ADMIN
// =========================================
export const editarAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, email, telefone, senha } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
      const updates: string[] = [];
      const values: any[] = [];
      
      if (nome) {
        updates.push('nome = ?');
        values.push(nome);
      }
      if (email) {
        updates.push('email = ?');
        values.push(email);
      }
      if (telefone) {
        updates.push('telefone = ?');
        values.push(telefone);
      }
      if (senha) {
        const senhaHash = await bcrypt.hash(senha, 10);
        updates.push('senha = ?');
        values.push(senhaHash);
      }
      
      if (updates.length === 0) {
        connection.release();
        return res.status(400).json({ message: 'Nenhum campo para atualizar' });
      }
      
      values.push(id);
      
      await connection.query(
        `UPDATE consultores SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      
      connection.release();
      res.json({ message: 'Admin atualizado com sucesso' });
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erro ao editar admin:', error);
    res.status(500).json({ message: 'Erro ao editar admin' });
  }
};

// =========================================
// CHATS VENDEDORES
// =========================================
export const getChatsVendedores = async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      await connection.query(`
        ALTER TABLE consultores 
        ADD COLUMN IF NOT EXISTS sistema_online BOOLEAN DEFAULT FALSE AFTER status_conexao
      `);
    } catch (e) {
      // Coluna já existe
    }
    
    const usuarioLogado = (req as any).user;
    const userId = usuarioLogado?.id;
    const userRole = usuarioLogado?.role;
    
    let whereClause = `WHERE (c.role = 'vendedor' OR c.role IS NULL OR c.role = '')`;
    
    if (userRole === 'gerente' && userId) {
      whereClause += ` AND (c.created_by = '${userId}' OR c.created_by IN (
        SELECT id FROM consultores WHERE created_by = '${userId}' AND role = 'supervisor'
      ))`;
    } else if (userRole === 'supervisor' && userId) {
      whereClause += ` AND c.created_by = '${userId}'`;
    }
    
    const [vendedores]: any = await connection.query(`
      SELECT 
        c.id,
        c.nome,
        c.status_conexao,
        c.sistema_online,
        COUNT(DISTINCT l.id) as chats_ativos
      FROM consultores c
      LEFT JOIN leads l ON l.consultor_id = c.id
      ${whereClause}
      GROUP BY c.id, c.nome, c.status_conexao, c.sistema_online
      HAVING chats_ativos > 0
      ORDER BY chats_ativos DESC
    `);
    
    const chatsVendedores = await Promise.all(
      vendedores.map(async (vendedor: any) => {
        const [distribuicao]: any = await connection.query(`
          SELECT 
            status,
            COUNT(*) as quantidade
          FROM leads
          WHERE consultor_id = ?
          GROUP BY status
        `, [vendedor.id]);
        
        const totalChats = distribuicao.reduce((sum: number, d: any) => sum + (d.quantidade || 0), 0);
        
        const etapasMap: Record<string, string> = {
          'indicacao': 'Indicação',
          'novo': 'Novo Lead',
          'primeiro_contato': 'Primeiro Contato',
          'proposta_enviada': 'Proposta Enviada',
          'convertido': 'Convertido',
          'nao_solicitado': 'Não Solicitado',
          'perdido': 'Perdido'
        };
        
        const distribuicaoFormatada = distribuicao.map((d: any) => ({
          etapa: etapasMap[d.status] || d.status,
          quantidade: d.quantidade || 0,
          percentual: totalChats > 0 ? (d.quantidade / totalChats) * 100 : 0
        }));
        
        const [ultimaMensagem]: any = await connection.query(`
          SELECT 
            m.conteudo,
            m.timestamp
          FROM mensagens m
          INNER JOIN leads l ON l.id = m.lead_id
          WHERE l.consultor_id = ?
            AND m.remetente = 'consultor'
          ORDER BY m.timestamp DESC
          LIMIT 1
        `, [vendedor.id]);
        
        return {
          vendedorId: vendedor.id,
          vendedorNome: vendedor.nome,
          whatsappConectado: vendedor.status_conexao === 'online',
          sistemaOnline: vendedor.sistema_online === 1 || vendedor.sistema_online === true,
          chatsAtivos: parseInt(vendedor.chats_ativos) || 0,
          distribuicao: distribuicaoFormatada,
          ultimaMensagem: ultimaMensagem[0]?.conteudo || null,
          ultimaMensagemData: ultimaMensagem[0]?.timestamp || null
        };
      })
    );
    
    connection.release();
    res.json(chatsVendedores);
    
  } catch (error: any) {
    console.error('Erro ao buscar chats dos vendedores:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'Erro ao buscar chats dos vendedores', error: error.message });
  }
};

// =========================================
// GERAR TOKEN TEMPORÁRIO
// =========================================
export const gerarTokenTemporario = async (req: Request, res: Response) => {
  try {
    const { vendedorId } = req.params;
    
    const connection = await pool.getConnection();
    
    try {
      const [vendedores]: any = await connection.query(
        'SELECT id, nome, email, role FROM consultores WHERE id = ?',
        [vendedorId]
      );
      
      if (vendedores.length === 0) {
        connection.release();
        return res.status(404).json({ message: 'Vendedor não encontrado' });
      }
      
      const vendedor = vendedores[0];
      
      const secret = process.env.JWT_SECRET || 'secret';
      const token = jwt.sign(
        { 
          id: vendedor.id,
          nome: vendedor.nome,
          email: vendedor.email, 
          role: vendedor.role || 'vendedor',
          isTemporaryLogin: true 
        },
        secret,
        { expiresIn: '5m' }
      );
      
      connection.release();
      res.json({ token });
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erro ao gerar token temporário:', error);
    res.status(500).json({ message: 'Erro ao gerar token temporário' });
  }
};
