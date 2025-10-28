import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database';

// ============================================
// TIPOS
// ============================================

interface FollowUpSequencia {
  id: number;
  nome: string;
  descricao: string;
  fase_inicio: 'novo' | 'primeiro_contato' | 'proposta_enviada' | 'convertido' | 'perdido';
  ativo: boolean;
  automatico: boolean;
  prioridade: number;
  criado_por: number;
  criado_em: string;
  atualizado_em: string;
}

interface FollowUpMensagem {
  id: number;
  sequencia_id: number;
  ordem: number;
  dias_espera: number;
  conteudo: string;
  tipo_mensagem: 'texto' | 'audio' | 'imagem' | 'documento';
  media_url?: string;
  ativo: boolean;
}

interface FollowUpLead {
  id: number;
  lead_id: number;
  sequencia_id: number;
  mensagem_atual: number;
  status: 'ativo' | 'pausado' | 'concluido' | 'cancelado';
  data_inicio: string;
  data_proxima_mensagem: string;
  pausado_em?: string;
  concluido_em?: string;
  motivo_pausa?: string;
}

// ============================================
// SEQUÊNCIAS
// ============================================

/**
 * Listar todas as sequências de follow-up
 */
export const listarSequencias = async (req: Request, res: Response) => {
  try {
    const [sequencias] = await pool.query<RowDataPacket[]>(
      `SELECT s.*, 
        COUNT(DISTINCT fl.id) as total_leads_ativos,
        u.nome as criador_nome
      FROM followup_sequencias s
      LEFT JOIN followup_leads fl ON s.id = fl.sequencia_id AND fl.status = 'ativo'
      LEFT JOIN usuarios u ON s.criado_por = u.id
      GROUP BY s.id
      ORDER BY s.prioridade DESC, s.criado_em DESC`
    );

    res.json(sequencias);
  } catch (error) {
    console.error('Erro ao listar sequências:', error);
    res.status(500).json({ error: 'Erro ao listar sequências' });
  }
};

/**
 * Buscar uma sequência por ID com suas mensagens
 */
export const buscarSequencia = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Buscar sequência
    const [sequencias] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM followup_sequencias WHERE id = ?',
      [id]
    );

    if (sequencias.length === 0) {
      return res.status(404).json({ error: 'Sequência não encontrada' });
    }

    // Buscar mensagens da sequência
    const [mensagens] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM followup_mensagens WHERE sequencia_id = ? ORDER BY ordem ASC',
      [id]
    );

    res.json({
      ...sequencias[0],
      mensagens
    });
  } catch (error) {
    console.error('Erro ao buscar sequência:', error);
    res.status(500).json({ error: 'Erro ao buscar sequência' });
  }
};

/**
 * Criar nova sequência de follow-up
 */
export const criarSequencia = async (req: Request, res: Response) => {
  try {
    const { nome, descricao, fase_inicio, ativo, automatico, prioridade, mensagens } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Validação
    if (!nome || !fase_inicio) {
      return res.status(400).json({ error: 'Nome e fase de início são obrigatórios' });
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Inserir sequência
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO followup_sequencias (nome, descricao, fase_inicio, ativo, automatico, prioridade, criado_por)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nome, descricao || null, fase_inicio, ativo !== false, automatico !== false, prioridade || 0, userId]
      );

      const sequenciaId = result.insertId;

      // Inserir mensagens se fornecidas
      if (mensagens && Array.isArray(mensagens) && mensagens.length > 0) {
        for (let i = 0; i < mensagens.length; i++) {
          const msg = mensagens[i];
          await connection.query(
            `INSERT INTO followup_mensagens (sequencia_id, ordem, dias_espera, conteudo, tipo_mensagem, media_url, ativo)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [sequenciaId, i + 1, msg.dias_espera, msg.conteudo, msg.tipo_mensagem || 'texto', msg.media_url || null, msg.ativo !== false]
          );
        }
      }

      await connection.commit();

      // Buscar sequência criada com mensagens
      const [sequencia] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM followup_sequencias WHERE id = ?',
        [sequenciaId]
      );

      const [mensagensDb] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM followup_mensagens WHERE sequencia_id = ? ORDER BY ordem ASC',
        [sequenciaId]
      );

      res.status(201).json({
        ...sequencia[0],
        mensagens: mensagensDb
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erro ao criar sequência:', error);
    res.status(500).json({ error: 'Erro ao criar sequência' });
  }
};

/**
 * Atualizar sequência existente
 */
export const atualizarSequencia = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, descricao, fase_inicio, ativo, automatico, prioridade, mensagens } = req.body;

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Atualizar sequência
      await connection.query(
        `UPDATE followup_sequencias 
         SET nome = ?, descricao = ?, fase_inicio = ?, ativo = ?, automatico = ?, prioridade = ?
         WHERE id = ?`,
        [nome, descricao, fase_inicio, ativo, automatico, prioridade, id]
      );

      // Se mensagens foram fornecidas, atualizar
      if (mensagens && Array.isArray(mensagens)) {
        // Deletar mensagens antigas
        await connection.query('DELETE FROM followup_mensagens WHERE sequencia_id = ?', [id]);

        // Inserir novas mensagens
        for (let i = 0; i < mensagens.length; i++) {
          const msg = mensagens[i];
          await connection.query(
            `INSERT INTO followup_mensagens (sequencia_id, ordem, dias_espera, conteudo, tipo_mensagem, media_url, ativo)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, i + 1, msg.dias_espera, msg.conteudo, msg.tipo_mensagem || 'texto', msg.media_url || null, msg.ativo !== false]
          );
        }
      }

      await connection.commit();

      // Buscar sequência atualizada
      const [sequencia] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM followup_sequencias WHERE id = ?',
        [id]
      );

      const [mensagensDb] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM followup_mensagens WHERE sequencia_id = ? ORDER BY ordem ASC',
        [id]
      );

      res.json({
        ...sequencia[0],
        mensagens: mensagensDb
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erro ao atualizar sequência:', error);
    res.status(500).json({ error: 'Erro ao atualizar sequência' });
  }
};

/**
 * Deletar sequência
 */
export const deletarSequencia = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM followup_sequencias WHERE id = ?', [id]);

    res.json({ message: 'Sequência deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar sequência:', error);
    res.status(500).json({ error: 'Erro ao deletar sequência' });
  }
};

// ============================================
// GESTÃO DE LEADS EM FOLLOW-UP
// ============================================

/**
 * Adicionar lead a uma sequência de follow-up
 */
export const adicionarLeadSequencia = async (req: Request, res: Response) => {
  try {
    const { leadId, sequenciaId } = req.body;

    // Verificar se lead já está nesta sequência
    const [existente] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM followup_leads WHERE lead_id = ? AND sequencia_id = ? AND status = "ativo"',
      [leadId, sequenciaId]
    );

    if (existente.length > 0) {
      return res.status(400).json({ error: 'Lead já está nesta sequência' });
    }

    // Buscar primeira mensagem da sequência
    const [mensagens] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM followup_mensagens WHERE sequencia_id = ? AND ativo = TRUE ORDER BY ordem ASC LIMIT 1',
      [sequenciaId]
    );

    if (mensagens.length === 0) {
      return res.status(400).json({ error: 'Sequência não possui mensagens ativas' });
    }

    const primeiraMensagem = mensagens[0];
    
    // Calcular data da próxima mensagem
    const dataProxima = new Date();
    dataProxima.setDate(dataProxima.getDate() + primeiraMensagem.dias_espera);

    // Adicionar lead à sequência
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO followup_leads (lead_id, sequencia_id, mensagem_atual, status, data_proxima_mensagem)
       VALUES (?, ?, 1, 'ativo', ?)`,
      [leadId, sequenciaId, dataProxima]
    );

    res.status(201).json({
      id: result.insertId,
      lead_id: leadId,
      sequencia_id: sequenciaId,
      status: 'ativo',
      data_proxima_mensagem: dataProxima
    });
  } catch (error) {
    console.error('Erro ao adicionar lead à sequência:', error);
    res.status(500).json({ error: 'Erro ao adicionar lead à sequência' });
  }
};

/**
 * Pausar follow-up de um lead
 */
export const pausarFollowUp = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    await pool.query(
      `UPDATE followup_leads 
       SET status = 'pausado', pausado_em = NOW(), motivo_pausa = ?
       WHERE id = ?`,
      [motivo || 'Pausado manualmente', id]
    );

    res.json({ message: 'Follow-up pausado com sucesso' });
  } catch (error) {
    console.error('Erro ao pausar follow-up:', error);
    res.status(500).json({ error: 'Erro ao pausar follow-up' });
  }
};

/**
 * Reativar follow-up pausado
 */
export const reativarFollowUp = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Buscar follow-up
    const [followups] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM followup_leads WHERE id = ?',
      [id]
    );

    if (followups.length === 0) {
      return res.status(404).json({ error: 'Follow-up não encontrado' });
    }

    const followup = followups[0];

    // Buscar mensagem atual
    const [mensagens] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM followup_mensagens WHERE sequencia_id = ? AND ordem = ?',
      [followup.sequencia_id, followup.mensagem_atual]
    );

    if (mensagens.length === 0) {
      return res.status(400).json({ error: 'Mensagem não encontrada' });
    }

    // Recalcular próxima mensagem
    const dataProxima = new Date();
    dataProxima.setDate(dataProxima.getDate() + mensagens[0].dias_espera);

    await pool.query(
      `UPDATE followup_leads 
       SET status = 'ativo', pausado_em = NULL, motivo_pausa = NULL, data_proxima_mensagem = ?
       WHERE id = ?`,
      [dataProxima, id]
    );

    res.json({ message: 'Follow-up reativado com sucesso' });
  } catch (error) {
    console.error('Erro ao reativar follow-up:', error);
    res.status(500).json({ error: 'Erro ao reativar follow-up' });
  }
};

/**
 * Cancelar follow-up de um lead
 */
export const cancelarFollowUp = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE followup_leads 
       SET status = 'cancelado'
       WHERE id = ?`,
      [id]
    );

    res.json({ message: 'Follow-up cancelado com sucesso' });
  } catch (error) {
    console.error('Erro ao cancelar follow-up:', error);
    res.status(500).json({ error: 'Erro ao cancelar follow-up' });
  }
};

/**
 * Listar follow-ups ativos de um lead
 */
export const listarFollowUpsLead = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;

    const [followups] = await pool.query<RowDataPacket[]>(
      `SELECT fl.*, s.nome as sequencia_nome, s.fase_inicio
       FROM followup_leads fl
       JOIN followup_sequencias s ON fl.sequencia_id = s.id
       WHERE fl.lead_id = ?
       ORDER BY fl.criado_em DESC`,
      [leadId]
    );

    res.json(followups);
  } catch (error) {
    console.error('Erro ao listar follow-ups do lead:', error);
    res.status(500).json({ error: 'Erro ao listar follow-ups do lead' });
  }
};

// ============================================
// AUTOMAÇÃO E PROCESSAMENTO
// ============================================

/**
 * Processar envios programados
 * Esta função deve ser chamada por um cron job ou scheduler
 */
export const processarEnviosProgramados = async (req: Request, res: Response) => {
  try {
    console.log('🔄 Processando envios programados...');

    // Buscar follow-ups que precisam enviar mensagem
    const [followups] = await pool.query<RowDataPacket[]>(
      `SELECT fl.*, fm.conteudo, fm.tipo_mensagem, fm.media_url, l.telefone
       FROM followup_leads fl
       JOIN followup_mensagens fm ON fl.sequencia_id = fm.sequencia_id AND fm.ordem = fl.mensagem_atual
       JOIN leads l ON fl.lead_id = l.id
       WHERE fl.status = 'ativo'
         AND fl.data_proxima_mensagem <= NOW()
       LIMIT 50`
    );

    console.log(`📬 ${followups.length} mensagens para enviar`);

    const resultados = [];

    for (const followup of followups) {
      try {
        // TODO: Integrar com whatsappService para enviar mensagem real
        console.log(`📤 Enviando mensagem para lead ${followup.lead_id}`);

        // Registrar no histórico
        await pool.query(
          `INSERT INTO followup_historico (followup_lead_id, mensagem_id, lead_id, status_envio)
           VALUES (?, (SELECT id FROM followup_mensagens WHERE sequencia_id = ? AND ordem = ?), ?, 'sucesso')`,
          [followup.id, followup.sequencia_id, followup.mensagem_atual, followup.lead_id]
        );

        // Buscar próxima mensagem
        const [proximasMensagens] = await pool.query<RowDataPacket[]>(
          'SELECT * FROM followup_mensagens WHERE sequencia_id = ? AND ordem = ? AND ativo = TRUE',
          [followup.sequencia_id, followup.mensagem_atual + 1]
        );

        if (proximasMensagens.length > 0) {
          // Há próxima mensagem
          const proximaMensagem = proximasMensagens[0];
          const dataProxima = new Date();
          dataProxima.setDate(dataProxima.getDate() + proximaMensagem.dias_espera);

          await pool.query(
            `UPDATE followup_leads 
             SET mensagem_atual = mensagem_atual + 1, data_proxima_mensagem = ?
             WHERE id = ?`,
            [dataProxima, followup.id]
          );

          resultados.push({ leadId: followup.lead_id, status: 'enviado', proxima: dataProxima });
        } else {
          // Sequência concluída
          await pool.query(
            `UPDATE followup_leads 
             SET status = 'concluido', concluido_em = NOW(), data_proxima_mensagem = NULL
             WHERE id = ?`,
            [followup.id]
          );

          resultados.push({ leadId: followup.lead_id, status: 'concluido' });
        }
      } catch (error) {
        console.error(`❌ Erro ao processar follow-up ${followup.id}:`, error);
        
        // Registrar erro no histórico
        await pool.query(
          `INSERT INTO followup_historico (followup_lead_id, mensagem_id, lead_id, status_envio, erro)
           VALUES (?, (SELECT id FROM followup_mensagens WHERE sequencia_id = ? AND ordem = ?), ?, 'falha', ?)`,
          [followup.id, followup.sequencia_id, followup.mensagem_atual, followup.lead_id, (error as Error).message]
        );

        resultados.push({ leadId: followup.lead_id, status: 'erro', erro: (error as Error).message });
      }
    }

    res.json({
      processados: followups.length,
      resultados
    });
  } catch (error) {
    console.error('Erro ao processar envios programados:', error);
    res.status(500).json({ error: 'Erro ao processar envios programados' });
  }
};

/**
 * Verificar e aplicar follow-ups automáticos quando lead muda de fase
 */
export const aplicarFollowUpAutomatico = async (leadId: number, novaFase: string) => {
  try {
    console.log(`🔍 Verificando follow-ups automáticos para lead ${leadId} na fase ${novaFase}`);

    // Pausar follow-ups ativos anteriores
    await pool.query(
      `UPDATE followup_leads 
       SET status = 'pausado', pausado_em = NOW(), motivo_pausa = 'Lead mudou de fase'
       WHERE lead_id = ? AND status = 'ativo'`,
      [leadId]
    );

    // Buscar sequência automática para esta fase
    const [sequencias] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM followup_sequencias 
       WHERE fase_inicio = ? AND ativo = TRUE AND automatico = TRUE
       ORDER BY prioridade DESC
       LIMIT 1`,
      [novaFase]
    );

    if (sequencias.length > 0) {
      const sequencia = sequencias[0];
      console.log(`✅ Sequência encontrada: ${sequencia.nome}`);

      // Buscar primeira mensagem
      const [mensagens] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM followup_mensagens WHERE sequencia_id = ? AND ativo = TRUE ORDER BY ordem ASC LIMIT 1',
        [sequencia.id]
      );

      if (mensagens.length > 0) {
        const primeiraMensagem = mensagens[0];
        const dataProxima = new Date();
        dataProxima.setDate(dataProxima.getDate() + primeiraMensagem.dias_espera);

        // Adicionar lead à sequência
        await pool.query(
          `INSERT INTO followup_leads (lead_id, sequencia_id, mensagem_atual, status, data_proxima_mensagem)
           VALUES (?, ?, 1, 'ativo', ?)
           ON DUPLICATE KEY UPDATE status = 'ativo', mensagem_atual = 1, data_proxima_mensagem = ?`,
          [leadId, sequencia.id, dataProxima, dataProxima]
        );

        console.log(`✅ Follow-up automático aplicado para lead ${leadId}`);
      }
    }
  } catch (error) {
    console.error('Erro ao aplicar follow-up automático:', error);
  }
};

// ============================================
// ESTATÍSTICAS E RELATÓRIOS
// ============================================

/**
 * Obter estatísticas das sequências
 */
export const obterEstatisticas = async (req: Request, res: Response) => {
  try {
    const [estatisticas] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM v_followup_estatisticas'
    );

    res.json(estatisticas);
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
};

/**
 * Obter próximos envios programados
 */
export const obterProximosEnvios = async (req: Request, res: Response) => {
  try {
    const { limit = 50 } = req.query;

    const [envios] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM v_followup_proximos_envios LIMIT ?',
      [parseInt(limit as string)]
    );

    res.json(envios);
  } catch (error) {
    console.error('Erro ao obter próximos envios:', error);
    res.status(500).json({ error: 'Erro ao obter próximos envios' });
  }
};

/**
 * Obter histórico de envios de um lead
 */
export const obterHistoricoLead = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;

    const [historico] = await pool.query<RowDataPacket[]>(
      `SELECT h.*, fm.conteudo, fm.tipo_mensagem, s.nome as sequencia_nome
       FROM followup_historico h
       JOIN followup_mensagens fm ON h.mensagem_id = fm.id
       JOIN followup_leads fl ON h.followup_lead_id = fl.id
       JOIN followup_sequencias s ON fl.sequencia_id = s.id
       WHERE h.lead_id = ?
       ORDER BY h.enviado_em DESC`,
      [leadId]
    );

    res.json(historico);
  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    res.status(500).json({ error: 'Erro ao obter histórico' });
  }
};
