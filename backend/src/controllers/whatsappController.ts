import { Request, Response } from 'express';
import { whatsappService } from '../services/whatsappService';
import { whatsappOficialService } from '../services/whatsappOficialService';
import { query } from '../config/db-helper';

// Obter tipo de API configurado para o consultor
async function getTipoApi(consultorId: string): Promise<'oficial' | 'nao_oficial'> {
  try {
    const result = await query(
      'SELECT tipo_api_whatsapp FROM consultores WHERE id = ?',
      [consultorId]
    );
    
    return result.rows[0]?.tipo_api_whatsapp || 'nao_oficial';
  } catch (error) {
    // Se a coluna ainda não existir (migration não executada), retorna padrão
    console.log('⚠️ Coluna tipo_api_whatsapp não encontrada, usando padrão: nao_oficial');
    return 'nao_oficial';
  }
}

export const conectar = async (req: Request, res: Response) => {
  try {
    const consultorId = req.user?.id;

    if (!consultorId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const tipoApi = await getTipoApi(consultorId);

    if (tipoApi === 'oficial') {
      // API Oficial não usa QR Code, apenas verifica configuração
      const config = await whatsappOficialService.carregarConfig(consultorId);
      if (config) {
        res.json({ 
          message: 'API Oficial já configurada',
          tipoApi: 'oficial'
        });
      } else {
        res.status(400).json({ 
          error: 'Configure suas credenciais da API Oficial primeiro',
          tipoApi: 'oficial'
        });
      }
    } else {
      // API Não Oficial (Baileys) usa QR Code
      const qrCode = await whatsappService.conectar(consultorId);

      if (qrCode) {
        res.json({ 
          message: 'Aguardando leitura do QR Code',
          qrCode,
          tipoApi: 'nao_oficial'
        });
      } else {
        res.json({ 
          message: 'WhatsApp conectado com sucesso',
          tipoApi: 'nao_oficial'
        });
      }
    }
  } catch (error) {
    console.error('Erro ao conectar WhatsApp:', error);
    res.status(500).json({ error: 'Erro ao conectar WhatsApp' });
  }
};

export const desconectar = async (req: Request, res: Response) => {
  try {
    const consultorId = req.user?.id;

    if (!consultorId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    await whatsappService.desconectar(consultorId);

    res.json({ message: 'WhatsApp desconectado com sucesso' });
  } catch (error) {
    console.error('Erro ao desconectar WhatsApp:', error);
    res.status(500).json({ error: 'Erro ao desconectar WhatsApp' });
  }
};

export const getStatus = async (req: Request, res: Response) => {
  try {
    const consultorId = req.user?.id;

    if (!consultorId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const tipoApi = await getTipoApi(consultorId);
    
    let status;
    if (tipoApi === 'oficial') {
      status = whatsappOficialService.getStatus(consultorId);
    } else {
      status = whatsappService.getStatus(consultorId);
    }

    res.json({ ...status, tipoApi });
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    res.status(500).json({ error: 'Erro ao buscar status' });
  }
};

export const sincronizar = async (req: Request, res: Response) => {
  try {
    const consultorId = req.user?.id;

    if (!consultorId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    console.log('🔄 Iniciando sincronização manual para consultor:', consultorId);
    const resultado = await whatsappService.sincronizarConversas(consultorId);

    res.json({
      success: true,
      mensagensNovas: resultado.mensagensNovas,
      erros: resultado.erros,
      message: `Sincronização concluída! ${resultado.mensagensNovas} mensagens novas encontradas.`
    });
  } catch (error) {
    console.error('Erro ao sincronizar:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao sincronizar conversas',
      details: (error as Error).message 
    });
  }
};

export const sincronizarChat = async (req: Request, res: Response) => {
  try {
    const consultorId = req.user?.id;
    const { numero } = req.body;

    if (!consultorId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!numero) {
      return res.status(400).json({ error: 'Número de telefone é obrigatório' });
    }

    const tipoApi = await getTipoApi(consultorId);

    if (tipoApi === 'oficial') {
      res.status(400).json({ 
        error: 'Sincronização não disponível para API Oficial',
        message: 'A API Oficial recebe mensagens via webhook automaticamente'
      });
      return;
    }

    console.log('🔄 Sincronizando chat específico:', numero);
    const resultado = await whatsappService.sincronizarChatEspecifico(consultorId, numero);

    res.json({
      success: true,
      mensagensNovas: resultado.mensagensNovas,
      message: `Chat sincronizado! ${resultado.mensagensNovas} mensagens novas encontradas.`
    });
  } catch (error) {
    console.error('Erro ao sincronizar chat:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao sincronizar chat',
      details: (error as Error).message 
    });
  }
};

// Configurar API Oficial
export const configurarApiOficial = async (req: Request, res: Response) => {
  try {
    const consultorId = req.user?.id;
    const { phoneNumberId, accessToken, webhookVerifyToken } = req.body;

    if (!consultorId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!phoneNumberId || !accessToken || !webhookVerifyToken) {
      return res.status(400).json({ 
        error: 'Todos os campos são obrigatórios',
        fields: ['phoneNumberId', 'accessToken', 'webhookVerifyToken']
      });
    }

    await whatsappOficialService.configurar(consultorId, phoneNumberId, accessToken, webhookVerifyToken);

    res.json({ 
      success: true,
      message: 'API Oficial configurada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao configurar API Oficial:', error);
    res.status(500).json({ error: 'Erro ao configurar API Oficial' });
  }
};

// Alterar tipo de API
export const alterarTipoApi = async (req: Request, res: Response) => {
  try {
    const consultorId = req.user?.id;
    const { tipoApi } = req.body;

    if (!consultorId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!tipoApi || !['oficial', 'nao_oficial'].includes(tipoApi)) {
      return res.status(400).json({ 
        error: 'Tipo de API inválido',
        valid: ['oficial', 'nao_oficial']
      });
    }

    try {
      // Obter o tipo atual antes de alterar
      const tipoAtual = await getTipoApi(consultorId);
      
      // Se está mudando de tipo, desconectar a API anterior
      if (tipoAtual !== tipoApi) {
        console.log(`🔄 Alternando de ${tipoAtual} para ${tipoApi} - desconectando API anterior...`);
        
        if (tipoAtual === 'nao_oficial') {
          // Desconectar API Não Oficial (Baileys)
          try {
            await whatsappService.desconectar(consultorId);
            console.log('✅ API Não Oficial desconectada');
          } catch (error) {
            console.log('⚠️ Erro ao desconectar API Não Oficial:', error);
            // Continua mesmo se der erro na desconexão
          }
        } else if (tipoAtual === 'oficial') {
          // Limpar status da API Oficial
          console.log('ℹ️ API Oficial não precisa de desconexão ativa');
          // A API Oficial não mantém conexão persistente, apenas usa webhook
        }
      }

      // Atualizar o tipo no banco de dados
      await query(
        'UPDATE consultores SET tipo_api_whatsapp = ? WHERE id = ?',
        [tipoApi, consultorId]
      );

      res.json({ 
        success: true,
        message: `Tipo de API alterado para: ${tipoApi === 'oficial' ? 'API Oficial' : 'API Não Oficial'}`,
        tipoApi,
        disconnected: tipoAtual !== tipoApi ? tipoAtual : null
      });
    } catch (dbError: any) {
      // Se a coluna não existir, informar que precisa executar migrations
      if (dbError.code === 'ER_BAD_FIELD_ERROR' || dbError.message?.includes('Unknown column')) {
        res.status(400).json({ 
          error: 'Migrations não executadas',
          message: 'Execute o script backend/executar-migration-tipo-api.bat antes de usar esta funcionalidade',
          detail: 'A coluna tipo_api_whatsapp não existe na tabela consultores'
        });
      } else {
        throw dbError;
      }
    }
  } catch (error) {
    console.error('Erro ao alterar tipo de API:', error);
    res.status(500).json({ error: 'Erro ao alterar tipo de API' });
  }
};

// Webhook da API Oficial
export const webhookOficial = async (req: Request, res: Response) => {
  try {
    // Verificação do webhook (GET)
    if (req.method === 'GET') {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      // Aqui você deve verificar o token contra o configurado
      // Por simplicidade, vamos aceitar qualquer token por enquanto
      if (mode === 'subscribe' && challenge) {
        console.log('✅ Webhook verificado');
        res.status(200).send(challenge);
      } else {
        res.status(403).send('Forbidden');
      }
      return;
    }

    // Recebimento de mensagens (POST)
    const data = req.body;
    
    // Extrair consultor_id do webhook (pode vir do phone_number_id)
    // Por simplicidade, vamos processar para todos os consultores configurados
    // Em produção, você deve mapear phone_number_id -> consultor_id
    
    console.log('📨 Webhook recebido:', JSON.stringify(data, null, 2));
    
    // TODO: Implementar lógica para identificar o consultor correto
    // Por enquanto, apenas retornamos sucesso
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
};
