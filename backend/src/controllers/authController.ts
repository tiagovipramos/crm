import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db-helper';
import { whatsappService } from '../services/whatsappService';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar consultor no banco
    const result = await query(
      'SELECT id, nome, email, senha, telefone, avatar, sessao_whatsapp, status_conexao, numero_whatsapp, ativo FROM consultores WHERE email = ?',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const consultor = result.rows[0];

    // Verificar se o usuário está ativo
    if (consultor.ativo === false || consultor.ativo === 0) {
      return res.status(403).json({ error: 'Usuário Bloqueado' });
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, consultor.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Atualizar último acesso
    await query(
      'UPDATE consultores SET ultimo_acesso = NOW() WHERE id = ?',
      [consultor.id]
    );

    // Gerar token JWT
    const secret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign(
      { id: consultor.id, email: consultor.email },
      secret,
      { expiresIn: '7d' }
    );

    // Verificar status real do WhatsApp (com tratamento de erro robusto)
    let statusConexao = 'offline';
    
    try {
      let statusWhatsapp = whatsappService.getStatus(consultor.id);
      
      if (statusWhatsapp.connected) {
        statusConexao = 'online';
      } else if (statusWhatsapp.hasSession) {
        statusConexao = 'connecting';
      } else {
        // Se não está conectado, tentar reconectar sessão existente
        console.log('🔍 Verificando se existe sessão salva para reconectar...');
        try {
          const reconectado = await whatsappService.tryReconnectExistingSessions(consultor.id);
          
          if (reconectado) {
            // Aguardar um momento para a conexão estabelecer
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Verificar novamente o status
            statusWhatsapp = whatsappService.getStatus(consultor.id);
            if (statusWhatsapp.connected) {
              statusConexao = 'online';
            } else {
              statusConexao = 'connecting';
            }
          }
        } catch (reconnectError) {
          console.error('⚠️ Erro ao tentar reconectar WhatsApp (ignorado para não bloquear login):', reconnectError);
          statusConexao = 'offline';
        }
      }
    } catch (whatsappError) {
      console.error('⚠️ Erro ao verificar status do WhatsApp (ignorado para não bloquear login):', whatsappError);
      statusConexao = 'offline';
    }

    // Atualizar status no banco
    try {
      await query(
        'UPDATE consultores SET status_conexao = ? WHERE id = ?',
        [statusConexao, consultor.id]
      );
    } catch (updateError) {
      console.error('⚠️ Erro ao atualizar status de conexão no banco:', updateError);
      // Não bloquear login por causa disso
    }

    // Não retornar a senha
    delete consultor.senha;

    // Converter para camelCase e adicionar status
    const consultorResponse = {
      id: consultor.id,
      nome: consultor.nome,
      email: consultor.email,
      telefone: consultor.telefone,
      avatar: consultor.avatar,
      sessaoWhatsapp: consultor.sessao_whatsapp,
      statusConexao: statusConexao,
      numeroWhatsapp: consultor.numero_whatsapp,
      dataCriacao: consultor.data_criacao,
      ultimoAcesso: consultor.ultimo_acesso
    };

    res.json({
      token,
      consultor: consultorResponse
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const consultorId = req.user?.id;

    const result = await query(
      'SELECT id, nome, email, telefone, avatar, sessao_whatsapp, status_conexao, numero_whatsapp, data_criacao, ultimo_acesso FROM consultores WHERE id = ?',
      [consultorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Consultor não encontrado' });
    }

    const consultor = result.rows[0];

    // Converter para camelCase
    const consultorResponse = {
      id: consultor.id,
      nome: consultor.nome,
      email: consultor.email,
      telefone: consultor.telefone,
      avatar: consultor.avatar,
      sessaoWhatsapp: consultor.sessao_whatsapp,
      statusConexao: consultor.status_conexao || 'offline',
      numeroWhatsapp: consultor.numero_whatsapp,
      dataCriacao: consultor.data_criacao,
      ultimoAcesso: consultor.ultimo_acesso
    };

    res.json({ consultor: consultorResponse });
  } catch (error) {
    console.error('Erro ao buscar consultor:', error);
    res.status(500).json({ error: 'Erro ao buscar consultor' });
  }
};
