import axios from 'axios';
import { query } from '../config/db-helper';

interface WhatsAppOficialConfig {
  phoneNumberId: string;
  accessToken: string;
  webhookVerifyToken: string;
}

class WhatsAppOficialService {
  private io: any; // Socket.IO instance
  private configs: Map<string, WhatsAppOficialConfig> = new Map();

  setSocketIO(io: any) {
    this.io = io;
  }

  // Configurar credenciais da API oficial para um consultor
  async configurar(consultorId: string, phoneNumberId: string, accessToken: string, webhookVerifyToken: string) {
    try {
      console.log('⚙️ Configurando API Oficial para consultor:', consultorId);
      
      // Salvar configuração no mapa
      this.configs.set(consultorId, {
        phoneNumberId,
        accessToken,
        webhookVerifyToken
      });

      // Salvar no banco de dados (criar tabela se necessário)
      await query(
        `INSERT INTO whatsapp_oficial_config (consultor_id, phone_number_id, access_token, webhook_verify_token, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE 
         phone_number_id = VALUES(phone_number_id),
         access_token = VALUES(access_token),
         webhook_verify_token = VALUES(webhook_verify_token),
         updated_at = NOW()`,
        [consultorId, phoneNumberId, accessToken, webhookVerifyToken]
      );

      console.log('✅ Configuração da API Oficial salva com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao configurar API Oficial:', error);
      throw error;
    }
  }

  // Carregar configuração do banco
  async carregarConfig(consultorId: string): Promise<WhatsAppOficialConfig | null> {
    try {
      // Verificar se já está no mapa
      if (this.configs.has(consultorId)) {
        return this.configs.get(consultorId)!;
      }

      // Buscar no banco
      const result = await query(
        'SELECT phone_number_id, access_token, webhook_verify_token FROM whatsapp_oficial_config WHERE consultor_id = ?',
        [consultorId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const config: WhatsAppOficialConfig = {
        phoneNumberId: result.rows[0].phone_number_id,
        accessToken: result.rows[0].access_token,
        webhookVerifyToken: result.rows[0].webhook_verify_token
      };

      // Salvar no mapa
      this.configs.set(consultorId, config);

      return config;
    } catch (error) {
      console.error('❌ Erro ao carregar configuração:', error);
      return null;
    }
  }

  // Enviar mensagem usando API oficial
  async enviarMensagem(consultorId: string, numero: string, conteudo: string, leadIdEspecifico?: string) {
    try {
      const config = await this.carregarConfig(consultorId);
      
      if (!config) {
        throw new Error('API Oficial não configurada. Configure suas credenciais primeiro.');
      }

      // Formatar número (remover caracteres especiais)
      const numeroLimpo = numero.replace(/\D/g, '');

      // Enviar mensagem via API oficial
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: numeroLimpo,
          type: 'text',
          text: {
            body: conteudo
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const whatsappMessageId = response.data.messages?.[0]?.id || null;
      console.log('📤 Mensagem enviada com WhatsApp ID:', whatsappMessageId);

      // Buscar ou criar lead
      let leadId: string;
      
      if (leadIdEspecifico) {
        leadId = leadIdEspecifico;
      } else {
        const leadResult = await query(
          'SELECT id FROM leads WHERE telefone = ? AND consultor_id = ? ORDER BY data_criacao DESC LIMIT 1',
          [numeroLimpo, consultorId]
        );

        if (leadResult.rows.length === 0) {
          throw new Error(`Lead não encontrado para telefone: ${numero}`);
        }

        leadId = leadResult.rows[0].id;
      }

      // Salvar mensagem no banco
      const insertResult = await query(
        `INSERT INTO mensagens (lead_id, consultor_id, conteudo, tipo, remetente, status, whatsapp_message_id, timestamp)
         VALUES (?, ?, ?, 'texto', 'consultor', 'enviada', ?, NOW())`,
        [leadId, consultorId, conteudo, whatsappMessageId]
      );

      // Buscar ID da mensagem
      let mensagemId = null;
      if (insertResult.affectedRows && insertResult.affectedRows > 0) {
        const selectResult = await query(
          `SELECT id FROM mensagens 
           WHERE lead_id = ? AND consultor_id = ? AND conteudo = ? AND remetente = 'consultor'
           ORDER BY timestamp DESC LIMIT 1`,
          [leadId, consultorId, conteudo]
        );
        
        if (selectResult.rows.length > 0) {
          mensagemId = selectResult.rows[0].id;
        }
      }

      // Atualizar última mensagem do lead
      await query(
        `UPDATE leads SET ultima_mensagem = ?, data_atualizacao = NOW() 
         WHERE id = ?`,
        [conteudo.substring(0, 50), leadId]
      );

      // Emitir evento Socket.IO
      if (this.io) {
        this.io.to(`consultor_${consultorId}`).emit('nova_mensagem', {
          id: mensagemId,
          leadId,
          consultorId,
          numero: numeroLimpo,
          conteudo,
          tipo: 'texto',
          remetente: 'consultor',
          status: 'enviada',
          mediaUrl: null,
          mediaName: null,
          timestamp: new Date().toISOString(),
          isNovoLead: false
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Erro ao enviar mensagem pela API Oficial:', error);
      if (error.response) {
        console.error('Detalhes do erro:', error.response.data);
      }
      throw error;
    }
  }

  // Enviar arquivo usando API oficial
  async enviarArquivo(consultorId: string, numero: string, caminhoArquivo: string, tipo: 'image' | 'video' | 'document' | 'audio', caption?: string) {
    try {
      const config = await this.carregarConfig(consultorId);
      
      if (!config) {
        throw new Error('API Oficial não configurada. Configure suas credenciais primeiro.');
      }

      const numeroLimpo = numero.replace(/\D/g, '');
      const fs = require('fs');
      const path = require('path');
      const FormData = require('form-data');

      // 1. Fazer upload do arquivo
      const form = new FormData();
      form.append('messaging_product', 'whatsapp');
      form.append('file', fs.createReadStream(caminhoArquivo));
      form.append('type', tipo === 'image' ? 'image/jpeg' : tipo === 'video' ? 'video/mp4' : tipo === 'audio' ? 'audio/mp4' : 'application/pdf');

      const uploadResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${config.phoneNumberId}/media`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${config.accessToken}`
          }
        }
      );

      const mediaId = uploadResponse.data.id;
      console.log('📤 Arquivo enviado, Media ID:', mediaId);

      // 2. Enviar mensagem com o arquivo
      const messagePayload: any = {
        messaging_product: 'whatsapp',
        to: numeroLimpo,
        type: tipo
      };

      if (tipo === 'image') {
        messagePayload.image = { id: mediaId, caption: caption || '' };
      } else if (tipo === 'video') {
        messagePayload.video = { id: mediaId, caption: caption || '' };
      } else if (tipo === 'audio') {
        messagePayload.audio = { id: mediaId };
      } else if (tipo === 'document') {
        messagePayload.document = { id: mediaId, filename: caption || 'documento' };
      }

      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`,
        messagePayload,
        {
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const whatsappMessageId = response.data.messages?.[0]?.id || null;

      // Salvar no banco
      const fileName = path.basename(caminhoArquivo);
      const mediaUrl = caminhoArquivo.includes('\\audios\\') || caminhoArquivo.includes('/audios/')
        ? `/uploads/audios/${fileName}`
        : `/uploads/${fileName}`;

      const leadResult = await query(
        'SELECT id FROM leads WHERE telefone = ? AND consultor_id = ? LIMIT 1',
        [numeroLimpo, consultorId]
      );

      if (leadResult.rows.length === 0) {
        throw new Error(`Lead não encontrado para telefone: ${numero}`);
      }

      const leadId = leadResult.rows[0].id;
      const tipoMapeado = tipo === 'image' ? 'imagem' : tipo === 'video' ? 'video' : tipo === 'audio' ? 'audio' : 'documento';
      const tipoTexto = tipo === 'image' ? '📷 Imagem' : tipo === 'video' ? '🎥 Vídeo' : tipo === 'audio' ? '🎤 Áudio' : '📄 Documento';
      const conteudo = (tipo === 'image' || tipo === 'video') ? tipoTexto : (caption ? `${tipoTexto}: ${caption}` : tipoTexto);

      await query(
        `INSERT INTO mensagens (lead_id, consultor_id, conteudo, tipo, remetente, status, media_url, media_name, whatsapp_message_id, timestamp)
         VALUES (?, ?, ?, ?, 'consultor', 'enviada', ?, ?, ?, NOW())`,
        [leadId, consultorId, conteudo, tipoMapeado, mediaUrl, fileName, whatsappMessageId]
      );

      await query(
        `UPDATE leads SET ultima_mensagem = ?, data_atualizacao = NOW() WHERE id = ?`,
        [conteudo.substring(0, 50), leadId]
      );

      return { success: true };
    } catch (error: any) {
      console.error('❌ Erro ao enviar arquivo pela API Oficial:', error);
      if (error.response) {
        console.error('Detalhes do erro:', error.response.data);
      }
      throw error;
    }
  }

  // Processar webhook da API oficial (mensagens recebidas)
  async processarWebhook(data: any, consultorId: string) {
    try {
      console.log('📨 Processando webhook da API Oficial');

      const entry = data.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages;

      if (!messages || messages.length === 0) {
        return;
      }

      for (const message of messages) {
        const from = message.from;
        const messageId = message.id;
        const timestamp = message.timestamp;

        // Verificar duplicidade
        const existe = await query(
          'SELECT id FROM mensagens WHERE whatsapp_message_id = ?',
          [messageId]
        );

        if (existe.rows.length > 0) {
          console.log('⏩ Mensagem já existe no banco');
          continue;
        }

        // Extrair conteúdo
        let conteudo = '';
        let tipo = 'texto';
        let mediaUrl: string | null = null;
        let mediaName: string | null = null;

        if (message.type === 'text') {
          conteudo = message.text.body;
        } else if (message.type === 'image') {
          conteudo = '📷 Imagem';
          tipo = 'imagem';
          // TODO: Baixar imagem da API oficial
        } else if (message.type === 'video') {
          conteudo = '🎥 Vídeo';
          tipo = 'video';
        } else if (message.type === 'audio') {
          conteudo = '🎤 Áudio';
          tipo = 'audio';
        } else if (message.type === 'document') {
          conteudo = '📄 Documento';
          tipo = 'documento';
        }

        // Buscar ou criar lead
        const leadResult = await query(
          'SELECT id, nome FROM leads WHERE telefone = ? AND consultor_id = ?',
          [from, consultorId]
        );

        let leadId: string;
        let isNovoLead = false;

        if (leadResult.rows.length === 0) {
          // Criar novo lead
          const numeroSem55 = from.startsWith('55') ? from.substring(2) : from;
          const ddd = numeroSem55.substring(0, 2);
          const resto = numeroSem55.substring(2);
          const nomeFormatado = `(${ddd}) ${resto}`;

          const novoLeadResult = await query(
            `INSERT INTO leads (nome, telefone, origem, status, consultor_id, mensagens_nao_lidas, data_criacao, data_atualizacao)
             VALUES (?, ?, 'WhatsApp', 'novo', ?, 1, NOW(), NOW())`,
            [nomeFormatado, from, consultorId]
          );

          leadId = novoLeadResult.insertId ? String(novoLeadResult.insertId) : (await query(
            'SELECT id FROM leads WHERE telefone = ? AND consultor_id = ? ORDER BY data_criacao DESC LIMIT 1',
            [from, consultorId]
          )).rows[0]?.id;

          isNovoLead = true;
        } else {
          leadId = leadResult.rows[0].id;
          await query(
            'UPDATE leads SET mensagens_nao_lidas = mensagens_nao_lidas + 1, data_atualizacao = NOW() WHERE id = ?',
            [leadId]
          );
        }

        // Salvar mensagem
        await query(
          `INSERT INTO mensagens (lead_id, consultor_id, conteudo, tipo, remetente, status, media_url, media_name, whatsapp_message_id, timestamp)
           VALUES (?, ?, ?, ?, 'lead', 'lida', ?, ?, ?, FROM_UNIXTIME(?))`,
          [leadId, consultorId, conteudo, tipo, mediaUrl, mediaName, messageId, timestamp]
        );

        await query(
          'UPDATE leads SET ultima_mensagem = ? WHERE id = ?',
          [conteudo.substring(0, 50), leadId]
        );

        // Emitir evento Socket.IO
        if (this.io) {
          const leadCompleto = await query('SELECT * FROM leads WHERE id = ?', [leadId]);
          const lead = leadCompleto.rows[0];

          this.io.to(`consultor_${consultorId}`).emit('nova_mensagem', {
            leadId,
            lead: {
              id: lead.id,
              nome: lead.nome,
              telefone: lead.telefone,
              origem: lead.origem,
              status: lead.status,
              mensagensNaoLidas: lead.mensagens_nao_lidas
            },
            numero: from,
            conteudo,
            tipo,
            remetente: 'lead',
            mediaUrl,
            mediaName,
            timestamp: new Date().toISOString(),
            isNovoLead
          });
        }
      }
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
      throw error;
    }
  }

  // Verificar status da conexão (API oficial não usa QR Code)
  getStatus(consultorId: string): { connected: boolean; hasSession: boolean } {
    const config = this.configs.get(consultorId);
    return {
      connected: !!config,
      hasSession: !!config
    };
  }

  isConnected(consultorId: string): boolean {
    return this.configs.has(consultorId);
  }
}

export const whatsappOficialService = new WhatsAppOficialService();
