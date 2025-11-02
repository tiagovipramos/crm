import { Request, Response } from 'express';
import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Listar todas as tarefas do consultor
export const getTarefas = async (req: Request, res: Response) => {
  try {
    const consultorId = (req as any).user.id;

    const [tarefas] = await pool.query<RowDataPacket[]>(
      `SELECT t.*, 
       DATE_FORMAT(t.data_hora, '%Y-%m-%d %H:%i:%s') as data_hora,
       l.nome as lead_nome, l.telefone as lead_telefone
       FROM tarefas t
       LEFT JOIN leads l ON t.lead_id = l.id
       WHERE t.consultor_id = ?
       ORDER BY t.data_hora ASC`,
      [consultorId]
    );

    res.json(tarefas);
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    res.status(500).json({ error: 'Erro ao buscar tarefas' });
  }
};

// Buscar tarefas por lead
export const getTarefasByLead = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const consultorId = (req as any).user.id;

    const [tarefas] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM tarefas 
       WHERE lead_id = ? AND consultor_id = ?
       ORDER BY data_hora ASC`,
      [leadId, consultorId]
    );

    res.json(tarefas);
  } catch (error) {
    console.error('Erro ao buscar tarefas do lead:', error);
    res.status(500).json({ error: 'Erro ao buscar tarefas do lead' });
  }
};

// Criar nova tarefa
export const createTarefa = async (req: Request, res: Response) => {
  try {
    const { leadId, titulo, descricao, dataHora } = req.body;
    const consultorId = (req as any).user.id;

    console.log('📝 Dados recebidos para criar tarefa:', {
      leadId,
      titulo,
      descricao,
      dataHora,
      consultorId
    });

    // Validação
    if (!leadId || !titulo || !dataHora) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: leadId, titulo, dataHora' 
      });
    }

    // O frontend já envia no formato MySQL correto (yyyy-mm-dd hh:mm:ss)
    // NÃO converter com new Date() para evitar problemas de timezone
    const dataFormatada = dataHora;
    
    console.log('🕐 Data recebida (sem conversão):', dataFormatada);

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tarefas (lead_id, consultor_id, titulo, descricao, data_hora, status, criado_em)
       VALUES (?, ?, ?, ?, ?, 'pendente', NOW())`,
      [leadId, consultorId, titulo, descricao || '', dataFormatada]
    );

    console.log('✅ Tarefa criada com ID:', result.insertId);

    const [tarefa] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM tarefas WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(tarefa[0]);
  } catch (error: any) {
    console.error('❌ Erro ao criar tarefa:', error);
    console.error('📋 Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao criar tarefa',
      details: error.message 
    });
  }
};

// Marcar tarefa como concluída
export const completeTarefa = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const consultorId = (req as any).user.id;

    await pool.query(
      `UPDATE tarefas 
       SET status = 'concluida', concluida_em = NOW()
       WHERE id = ? AND consultor_id = ?`,
      [id, consultorId]
    );

    const [tarefa] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM tarefas WHERE id = ?',
      [id]
    );

    res.json(tarefa[0]);
  } catch (error) {
    console.error('Erro ao concluir tarefa:', error);
    res.status(500).json({ error: 'Erro ao concluir tarefa' });
  }
};

// Deletar tarefa
export const deleteTarefa = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const consultorId = (req as any).user.id;

    await pool.query(
      'DELETE FROM tarefas WHERE id = ? AND consultor_id = ?',
      [id, consultorId]
    );

    res.json({ message: 'Tarefa deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar tarefa:', error);
    res.status(500).json({ error: 'Erro ao deletar tarefa' });
  }
};
