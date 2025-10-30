import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WAMessage,
  proto
} from 'baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import { query } from '../config/db-helper';
import pino from 'pino';

interface WhatsAppSession {
  sock: any;
  qrCode?: string;
  connected: boolean;
}

class WhatsAppService {
  private sessions: Map<string, WhatsAppSession> = new Map();
  private io: any; // Socket.IO instance
  private reconnecting: Set<string> = new Set();

  setSocketIO(io: any) {
    this.io = io;
  }

  // Tentar reconectar sessões existentes ao iniciar
  async tryReconnectExistingSessions(consultorId: string): Promise<boolean> {
    // Evitar múltiplas tentativas simultâneas
    if (this.reconnecting.has(consultorId)) {
      console.log('⏳ Já existe uma tentativa de reconexão em andamento');
      return false;
    }

    // Verificar se já está conectado
    const session = this.sessions.get(consultorId);
    if (session?.connected) {
      console.log('✅ Sessão já está conectada');
      return true;
    }

    // Verificar se existe pasta de autenticação
    const fs = require('fs');
    const authPath = `./auth_${consultorId}`;
    
    if (!fs.existsSync(authPath)) {
      console.log('📁 Nenhuma sessão salva encontrada');
      return false;
    }

    console.log('🔄 Tentando reconectar sessão existente...');
    this.reconnecting.add(consultorId);

    try {
      // Tentar conectar usando sessão salva
      await this.conectar(consultorId);
      this.reconnecting.delete(consultorId);
      return true;
    } catch (error) {
      console.error('❌ Erro ao reconectar:', error);
      this.reconnecting.delete(consultorId);
      return false;
    }
  }

  async conectar(consultorId: string): Promise<string | null> {
    try {
      // Verificar se já está conectando/conectado
      const existingSession = this.sessions.get(consultorId);
      if (existingSession && existingSession.connected) {
        console.log('✅ WhatsApp já está conectado');
        return null;
      }

      const { state, saveCreds } = await useMultiFileAuthState(`./auth_${consultorId}`);

      const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }) as any, // Reduz logs no console
        browser: ['VIP CRM', 'Chrome', '1.0.0'],
        connectTimeoutMs: 60000, // 60 segundos de timeout
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        // Configurações de retry
        retryRequestDelayMs: 250,
        maxMsgRetryCount: 5,
        // Marca mensagens como lidas automaticamente
        markOnlineOnConnect: true,
      });

      sock.ev.on('creds.update', saveCreds);

      return new Promise((resolve) => {
        let qrTimeout: NodeJS.Timeout | null = null;
        let connectionEstablished = false;

        sock.ev.on('connection.update', async (update) => {
          const { connection, lastDisconnect, qr } = update;

          if (qr) {
            // Gerar QR Code em base64
            const qrCodeDataUrl = await QRCode.toDataURL(qr);
            
            // Emitir QR Code via Socket.IO
            if (this.io) {
              this.io.to(`consultor_${consultorId}`).emit('qr_code', {
                qrCode: qrCodeDataUrl,
                consultorId
              });
            }

            // Atualizar no banco
            await query(
              'UPDATE consultores SET status_conexao = ? WHERE id = ?',
              ['connecting', consultorId]
            );

            // ✅ Iniciar timeout APENAS quando QR Code é gerado
            if (!qrTimeout) {
              qrTimeout = setTimeout(() => {
                if (!connectionEstablished) {
                  console.log('⏰ Timeout ao gerar QR Code');
                  sock.end(undefined);
                  resolve(null);
                }
              }, 60000);
            }

            resolve(qrCodeDataUrl);
          }

          if (connection === 'close') {
            // ✅ Limpar timeout ao fechar conexão
            if (qrTimeout) {
              clearTimeout(qrTimeout);
              qrTimeout = null;
            }
            const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
            const errorMsg = (lastDisconnect?.error as any)?.message || 'Desconhecido';

            console.log(`❌ WhatsApp desconectado. Motivo: ${errorMsg} (Code: ${statusCode})`);
            console.log(`📋 Status Code: ${statusCode}, Logout Code: ${DisconnectReason.loggedOut}`);
            
            // Remover sessão do map
            this.sessions.delete(consultorId);
            
            // ✅ CORREÇÃO: Não reconectar automaticamente em timeouts ou erros de QR Code
            // Apenas reconectar em casos de desconexão temporária de rede
            const isLogout = statusCode === DisconnectReason.loggedOut;
            const isTimeout = errorMsg.includes('timeout') || errorMsg.includes('Timeout');
            const isQRError = statusCode === 401 || statusCode === undefined;
            
            if (!isLogout && !isTimeout && !isQRError && statusCode >= 500) {
              // Reconectar apenas para erros de servidor (5xx) que indicam problema temporário
              console.log('🔄 Problema temporário detectado. Tentando reconectar em 10 segundos...');
              
              await query(
                'UPDATE consultores SET status_conexao = ? WHERE id = ?',
                ['reconnecting', consultorId]
              );
              
              if (this.io) {
                this.io.to(`consultor_${consultorId}`).emit('whatsapp_reconnecting', {
                  consultorId,
                  reason: errorMsg
                });
              }
              
              setTimeout(() => {
                this.conectar(consultorId).catch(err => {
                  console.error('Erro ao reconectar:', err);
                });
              }, 10000);
            } else if (isLogout) {
              // Logout explícito (desconectou no aparelho) - LIMPAR TUDO
              console.log('🗑️ LOGOUT DETECTADO - Limpando sessão automaticamente...');
              this.sessions.delete(consultorId);
              
              const fs = require('fs');
              const path = require('path');
              const authPath = path.join(process.cwd(), `auth_${consultorId}`);
              
              console.log(`📂 Verificando pasta: ${authPath}`);
              
              // Deletar pasta de autenticação de forma mais robusta
              try {
                if (fs.existsSync(authPath)) {
                  console.log('🗑️ Deletando arquivos de autenticação...');
                  
                  // Usar rmSync com opções mais agressivas
                  fs.rmSync(authPath, { 
                    recursive: true, 
                    force: true,
                    maxRetries: 3,
                    retryDelay: 100
                  });
                  
                  // Verificar se foi realmente deletado
                  if (!fs.existsSync(authPath)) {
                    console.log('✅ Arquivos de autenticação removidos com sucesso!');
                  } else {
                    console.warn('⚠️ Pasta ainda existe após tentativa de remoção');
                  }
                } else {
                  console.log('ℹ️ Pasta de autenticação não encontrada (já foi removida?)');
                }
              } catch (deleteError) {
                console.error('❌ Erro ao deletar pasta de autenticação:', deleteError);
                // Tentar método alternativo
                try {
                  console.log('🔄 Tentando método alternativo de remoção...');
                  const { execSync } = require('child_process');
                  if (process.platform === 'win32') {
                    execSync(`rmdir /s /q "${authPath}"`, { stdio: 'ignore' });
                  } else {
                    execSync(`rm -rf "${authPath}"`, { stdio: 'ignore' });
                  }
                  console.log('✅ Pasta removida com comando do sistema');
                } catch (cmdError) {
                  console.error('❌ Falha no método alternativo:', cmdError);
                }
              }
              
              // Atualizar banco de dados
              await query(
                'UPDATE consultores SET status_conexao = ?, sessao_whatsapp = NULL WHERE id = ?',
                ['offline', consultorId]
              );
              console.log('✅ Status atualizado no banco: offline');

              // Emitir evento de desconexão para o frontend
              if (this.io) {
                // Para o consultor
                this.io.to(`consultor_${consultorId}`).emit('whatsapp_disconnected', {
                  consultorId,
                  reason: 'logged_out',
                  message: 'WhatsApp desconectado. Sessão limpa automaticamente.'
                });
                
                // Para admins (tempo real)
                this.io.to('admins').emit('whatsapp_disconnected', {
                  consultorId,
                  reason: 'logged_out',
                  message: 'WhatsApp desconectado. Sessão limpa automaticamente.'
                });
                
                console.log('📡 Evento de desconexão emitido para o frontend e admins');
              }
            }

            resolve(null);
          } else if (connection === 'open') {
            // ✅ Marcar conexão como estabelecida e limpar timeout
            connectionEstablished = true;
            if (qrTimeout) {
              clearTimeout(qrTimeout);
              qrTimeout = null;
            }

            console.log('✅ WhatsApp conectado para consultor:', consultorId);

            // Capturar número do WhatsApp conectado
            let numeroWhatsapp: string | undefined;
            try {
              const user = sock.user;
              if (user?.id) {
                // Número vem no formato: 5511999999999:XX@s.whatsapp.net
                numeroWhatsapp = user.id.split(':')[0].replace('@s.whatsapp.net', '');
                console.log('📱 Número WhatsApp capturado:', numeroWhatsapp);
              }
            } catch (error) {
              console.log('⚠️ Não foi possível capturar número do WhatsApp');
            }

            const session: WhatsAppSession = {
              sock,
              connected: true
            };

            this.sessions.set(consultorId, session);

            // Atualizar status no banco COM O NÚMERO DO WHATSAPP
            await query(
              'UPDATE consultores SET status_conexao = ?, sessao_whatsapp = ?, numero_whatsapp = ? WHERE id = ?',
              ['online', `session_${Date.now()}`, numeroWhatsapp || null, consultorId]
            );

            // Emitir evento de conexão bem-sucedida
            if (this.io) {
              // Para o consultor
              this.io.to(`consultor_${consultorId}`).emit('whatsapp_connected', {
                consultorId,
                status: 'online',
                numeroWhatsapp
              });
              
              // Para admins (tempo real)
              this.io.to('admins').emit('whatsapp_connected', {
                consultorId,
                status: 'online',
                numeroWhatsapp
              });
            }

            // 🔄 SINCRONIZAÇÃO AUTOMÁTICA ao conectar
            console.log('🔄 Iniciando sincronização automática...');
            setTimeout(async () => {
              try {
                const resultado = await this.sincronizarConversas(consultorId);
                console.log(`✅ Sincronização automática concluída: ${resultado.mensagensNovas} mensagens novas`);
                
                // Emitir evento de sincronização concluída
                if (this.io) {
                  this.io.to(`consultor_${consultorId}`).emit('sincronizacao_concluida', {
                    mensagensNovas: resultado.mensagensNovas,
                    erros: resultado.erros
                  });
                }
              } catch (error) {
                console.error('❌ Erro na sincronização automática:', error);
              }
            }, 5000); // Aguardar 3 segundos após conectar para estabilizar

            resolve(null);
          }
        });

        // ✅ REMOVIDO: Timeout duplicado que causava desconexões
        // O timeout agora é criado APENAS quando QR Code é gerado

        // Receber mensagens
        console.log('🔧 [DEBUG] Registrando listener messages.upsert para consultor:', consultorId);
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
          console.log('📨 [DEBUG] Evento messages.upsert recebido:', {
            type,
            quantidade: messages.length,
            consultorId
          });
          
          // ✅ IMPORTANTE: Apenas processar mensagens com type='notify'
          // 'append' é usado quando VOCÊ envia mensagens (fromMe: true)
          // 'notify' é usado quando RECEBE mensagens de outros (fromMe: false)
          if (type === 'notify') {
            for (const message of messages) {
              console.log('🔍 [DEBUG] Mensagem recebida:', {
                messageId: message.key.id,
                fromMe: message.key.fromMe,
                remoteJid: message.key.remoteJid,
                hasContent: !!message.message
              });
              
              // ✅ Apenas processar mensagens RECEBIDAS (não enviadas por mim)
              if (!message.key.fromMe && message.message) {
                await this.processarMensagemRecebida(consultorId, message);
              } else if (message.key.fromMe) {
                console.log('⏩ [IGNORANDO] Mensagem fromMe (enviada por mim), já foi salva no método enviarMensagem');
              }
            }
          } else {
            console.log(`⏩ [IGNORANDO] Evento tipo '${type}' (não é 'notify'). Mensagens enviadas são salvas no método enviarMensagem.`);
          }
        });

        // Escutar atualizações de status das mensagens
        sock.ev.on('messages.update', async (updates) => {
          for (const update of updates) {
            if (update.update.status) {
              await this.atualizarStatusMensagem(consultorId, update);
            }
          }
        });
      });
    } catch (error) {
      console.error('Erro ao conectar WhatsApp:', error);
      throw error;
    }
  }

  async desconectar(consultorId: string) {
    const session = this.sessions.get(consultorId);
    if (session?.sock) {
      await session.sock.logout();
      this.sessions.delete(consultorId);

      await query(
        'UPDATE consultores SET status_conexao = ?, sessao_whatsapp = NULL WHERE id = ?',
        ['offline', consultorId]
      );
    }
  }

  async enviarMensagem(consultorId: string, numero: string, conteudo: string, leadIdEspecifico?: string) {
    const session = this.sessions.get(consultorId);
    
    if (!session || !session.connected) {
      throw new Error('WhatsApp não conectado. Por favor, leia o QR Code primeiro.');
    }

    try {
      // Formatar número corretamente
      const jid = numero.includes('@') ? numero : `${numero.replace(/\D/g, '')}@s.whatsapp.net`;
      
      // Enviar mensagem e capturar ID
      const sentMsg = await session.sock.sendMessage(jid, { text: conteudo });
      const whatsappMessageId = sentMsg?.key?.id || null;
      
      console.log('📤 Mensagem enviada com WhatsApp ID:', whatsappMessageId);

      // ✅ USAR lead_id específico se fornecido, senão buscar pelo telefone
      let leadId: string;
      
      if (leadIdEspecifico) {
        console.log('✅ Usando lead_id específico fornecido:', leadIdEspecifico);
        leadId = leadIdEspecifico;
      } else {
        // Buscar lead_id pelo telefone (comportamento antigo)
        const leadResult = await query(
          'SELECT id FROM leads WHERE telefone = ? AND consultor_id = ? ORDER BY data_criacao DESC LIMIT 1',
          [numero.replace(/\D/g, ''), consultorId]
        );

        if (leadResult.rows.length === 0) {
          throw new Error(`Lead não encontrado para telefone: ${numero}`);
        }

        leadId = leadResult.rows[0].id;
        console.log('📋 Lead encontrado pelo telefone:', leadId);
      }

      // Salvar no banco COM O ID DO WHATSAPP
      const insertResult = await query(
        `INSERT INTO mensagens (lead_id, consultor_id, conteudo, tipo, remetente, status, whatsapp_message_id, timestamp)
         VALUES (?, ?, ?, 'texto', 'consultor', 'enviada', ?, NOW())`,
        [leadId, consultorId, conteudo, whatsappMessageId]
      );

      // Buscar o ID da mensagem recém-criada
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
          console.log('✅ ID da mensagem recuperado:', mensagemId);
        }
      }

      // Atualizar última mensagem do lead
      await query(
        `UPDATE leads SET ultima_mensagem = ?, data_atualizacao = NOW() 
         WHERE telefone = ?`,
        [conteudo.substring(0, 50), numero.replace(/\D/g, '')]
      );

      // 📡 Emitir evento Socket.IO para atualizar o frontend em tempo real
      if (this.io) {
        console.log('📡 Emitindo evento nova_mensagem para mensagem enviada automaticamente');
        this.io.to(`consultor_${consultorId}`).emit('nova_mensagem', {
          id: mensagemId, // ✅ Incluir ID da mensagem
          leadId,
          consultorId,
          numero: numero.replace(/\D/g, ''),
          conteudo,
          tipo: 'texto',
          remetente: 'consultor',
          status: 'enviada',
          mediaUrl: null,
          mediaName: null,
          timestamp: new Date().toISOString(),
          isNovoLead: false
        });
        console.log('✅ Evento Socket.IO emitido com sucesso para mensagem automática (ID:', mensagemId, ')');
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  async enviarArquivo(consultorId: string, numero: string, caminhoArquivo: string, tipo: 'image' | 'video' | 'document' | 'audio', caption?: string) {
    const session = this.sessions.get(consultorId);
    
    if (!session || !session.connected) {
      throw new Error('WhatsApp não conectado. Por favor, leia o QR Code primeiro.');
    }

    try {
      const fs = require('fs');
      const path = require('path');
      const jid = numero.includes('@') ? numero : `${numero.replace(/\D/g, '')}@s.whatsapp.net`;
      
      // Ler arquivo
      const fileBuffer = fs.readFileSync(caminhoArquivo);
      
      // Extrair nome do arquivo do caminho completo
      const fileName = path.basename(caminhoArquivo);
      
      // Determinar o media_url baseado no tipo e localização do arquivo
      let mediaUrl: string;
      if (caminhoArquivo.includes('\\audios\\') || caminhoArquivo.includes('/audios/')) {
        // Áudio gravado pelo AudioRecorder está em /uploads/audios/
        mediaUrl = `/uploads/audios/${fileName}`;
      } else {
        // Arquivos do uploadController estão em /uploads/
        mediaUrl = `/uploads/${fileName}`;
      }
      
      console.log('📁 [DEBUG] Media URL calculada:', mediaUrl);
      
      // ✅ BUSCAR LEAD_ID PRIMEIRO (evitar falha silenciosa do SUBSELECT)
      const leadResult = await query(
        'SELECT id FROM leads WHERE telefone = ? AND consultor_id = ? LIMIT 1',
        [numero.replace(/\D/g, ''), consultorId]
      );
      
      if (leadResult.rows.length === 0) {
        throw new Error(`Lead não encontrado para telefone: ${numero}`);
      }
      
      const leadId = leadResult.rows[0].id;
      console.log('📋 [DEBUG] Lead encontrado:', leadId);
      
      // ✅ SALVAR NO BANCO PRIMEIRO (antes de tentar enviar pelo WhatsApp)
      // Mapear tipo do WhatsApp para tipo do frontend
      const tipoMapeado = tipo === 'image' ? 'imagem' :
                          tipo === 'video' ? 'video' :
                          tipo === 'audio' ? 'audio' :
                          'documento';  // document -> documento
      
      // Para imagens e vídeos, nunca incluir caption (nome do arquivo)
      const tipoTexto = tipo === 'image' ? '📷 Imagem' :
                        tipo === 'video' ? '🎥 Vídeo' :
                        tipo === 'audio' ? '🎤 Áudio' :
                        '📄 Documento';
      const conteudo = (tipo === 'image' || tipo === 'video') ? tipoTexto : (caption ? `${tipoTexto}: ${caption}` : tipoTexto);
      
      // ✅ CRÍTICO: Salvar no banco com tratamento de erro explícito
      let mensagemId = null;
      try {
        console.log('💾 [PRE-INSERT] Tentando inserir no banco:', { leadId, consultorId, conteudo: conteudo.substring(0, 30), tipoMapeado, mediaUrl, fileName });
        
        const insertResult = await query(
          `INSERT INTO mensagens (lead_id, consultor_id, conteudo, tipo, remetente, status, media_url, media_name, timestamp)
           VALUES (?, ?, ?, ?, 'consultor', 'enviada', ?, ?, NOW())`,
          [leadId, consultorId, conteudo, tipoMapeado, mediaUrl, fileName]
        );
        
        console.log('💾 [POST-INSERT] Resultado do INSERT:', JSON.stringify(insertResult, null, 2));
        console.log('💾 [POST-INSERT] insertResult.affectedRows:', insertResult.affectedRows);
        
        // ✅ CORREÇÃO: UUID não retorna insertId válido, precisamos fazer SELECT
        if (insertResult.affectedRows && insertResult.affectedRows > 0) {
          console.log('✅ INSERT bem-sucedido, buscando UUID gerado...');
          const selectResult = await query(
            `SELECT id FROM mensagens 
             WHERE lead_id = ? AND consultor_id = ? AND media_url = ? AND remetente = 'consultor'
             ORDER BY timestamp DESC LIMIT 1`,
            [leadId, consultorId, mediaUrl]
          );
          
          if (selectResult.rows.length > 0) {
            mensagemId = selectResult.rows[0].id;
            console.log('✅ UUID recuperado com sucesso:', mensagemId);
          } else {
            console.error('❌ Não foi possível recuperar UUID após INSERT');
          }
        }
        
        console.log('💾 [DEBUG] Mensagem salva no banco! ID final:', mensagemId, 'mediaUrl:', mediaUrl, 'fileName:', fileName);
      } catch (dbError) {
        console.error('❌ [ERRO CRÍTICO] Falha ao salvar mensagem no banco de dados:', dbError);
        console.error('Detalhes:', { leadId, consultorId, conteudo, tipoMapeado, mediaUrl, fileName });
        throw new Error('Falha ao salvar mensagem no banco de dados: ' + (dbError as Error).message);
      }
      
      // Agora tentar enviar pelo WhatsApp (se falhar, a mensagem já está salva)
      let whatsappMessageId: string | null = null;
      try {
        // Preparar mensagem baseada no tipo
        let messageContent: any = {};
        
        switch (tipo) {
          case 'image':
            messageContent = {
              image: fileBuffer,
              caption: ''  // Não enviar caption com nome do arquivo
            };
            break;
          case 'video':
            messageContent = {
              video: fileBuffer,
              caption: ''  // Não enviar caption com nome do arquivo
            };
            break;
          case 'audio':
            messageContent = {
              audio: fileBuffer,
              mimetype: 'audio/mp4'
            };
            break;
          case 'document':
          default:
            messageContent = {
              document: fileBuffer,
              fileName: caption || 'documento',
              mimetype: 'application/pdf'
            };
            break;
        }
        
        // Enviar arquivo e capturar ID
        const sentMsg = await session.sock.sendMessage(jid, messageContent);
        whatsappMessageId = sentMsg?.key?.id || null;
        
        console.log('📤 Arquivo enviado com WhatsApp ID:', whatsappMessageId);
        
        // Atualizar mensagem com whatsapp_message_id
        if (whatsappMessageId) {
          await query(
            `UPDATE mensagens 
             SET whatsapp_message_id = ? 
             WHERE lead_id = (SELECT id FROM leads WHERE telefone = ? LIMIT 1) 
             AND consultor_id = ? 
             AND media_url = ?
             AND whatsapp_message_id IS NULL
             ORDER BY timestamp DESC 
             LIMIT 1`,
            [whatsappMessageId, numero.replace(/\D/g, ''), consultorId, mediaUrl]
          );
          console.log('✅ WhatsApp Message ID atualizado no banco');
        }
      } catch (whatsappError) {
        console.error('⚠️ Erro ao enviar pelo WhatsApp, mas mensagem JÁ FOI SALVA no banco:', whatsappError);
        // Não lançar erro - a mensagem está salva e será exibida no frontend
      }

      // Atualizar última mensagem do lead
      await query(
        `UPDATE leads SET ultima_mensagem = ?, data_atualizacao = NOW() 
         WHERE telefone = ?`,
        [conteudo.substring(0, 50), numero.replace(/\D/g, '')]
      );

      console.log(`✅ ${tipoTexto} enviado com sucesso para ${numero}`);
      return { success: true };
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      throw error;
    }
  }

  private async atualizarStatusMensagem(consultorId: string, update: any) {
    try {
      const { key, update: messageUpdate } = update;
      const status = messageUpdate.status;
      
      // Mapear status do WhatsApp para nosso sistema
      let novoStatus: 'enviada' | 'entregue' | 'lida' = 'enviada';
      
      if (status === 2) { // Entregue (delivered)
        novoStatus = 'entregue';
      } else if (status === 3 || status === 4) { // Lida (read ou played)
        novoStatus = 'lida';
      }
      
      // Extrair número do destinatário
      const numero = key.remoteJid?.replace('@s.whatsapp.net', '') || '';
      
      if (!numero) return;
      
      console.log(`✅ Atualizando status da mensagem para ${numero}: ${novoStatus}`);
      
      // Buscar lead pelo telefone
      const leadResult = await query(
        'SELECT id FROM leads WHERE telefone = ? AND consultor_id = ?',
        [numero, consultorId]
      );
      
      if (leadResult.rows.length === 0) {
        console.log('⚠️ Lead não encontrado para atualização de status');
        return;
      }
      
      const leadId = leadResult.rows[0].id;
      
      // Atualizar status da última mensagem enviada para este lead
      await query(
        `UPDATE mensagens 
         SET status = ? 
         WHERE lead_id = ? 
         AND remetente = 'consultor' 
         AND status != 'lida'
         ORDER BY timestamp DESC 
         LIMIT 1`,
        [novoStatus, leadId]
      );
      
      // Emitir evento via Socket.IO para atualizar frontend
      if (this.io) {
        this.io.to(`consultor_${consultorId}`).emit('status_mensagem_atualizado', {
          leadId,
          status: novoStatus,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`✅ Status atualizado para: ${novoStatus}`);
    } catch (error) {
      console.error('❌ Erro ao atualizar status da mensagem:', error);
    }
  }

  private async processarMensagemRecebida(consultorId: string, message: WAMessage) {
    try {
      // ✅ VERIFICAR SE MENSAGEM JÁ EXISTE NO BANCO (evita duplicação no re-sync)
      const whatsappMessageId = message.key.id;
      console.log('🔍 [DEBUG] Processando mensagem - WhatsApp ID:', whatsappMessageId);
      
      if (whatsappMessageId) {
        const mensagemExistente = await query(
          'SELECT id FROM mensagens WHERE whatsapp_message_id = ?',
          [whatsappMessageId]
        );
        
        console.log('🔍 [DEBUG] Verificação de duplicidade:', {
          whatsappMessageId,
          existeNoBanco: mensagemExistente.rows.length > 0,
          resultado: mensagemExistente.rows.length > 0 ? 'IGNORAR' : 'PROCESSAR'
        });
        
        if (mensagemExistente.rows.length > 0) {
          console.log(`⏩ [DUPLICIDADE DETECTADA] Mensagem já existe no banco (WhatsApp ID: ${whatsappMessageId}), ignorando re-sincronização`);
          return;
        }
      }
      
      const numero = message.key.remoteJid?.replace('@s.whatsapp.net', '') || '';
      
      // Extrair conteúdo da mensagem
      let conteudo = message.message?.conversation || 
                     message.message?.extendedTextMessage?.text || 
                     '';
      let tipo = 'texto';
      let mediaUrl: string | null = null;
      let mediaName: string | null = null;

      // Processar mensagem de áudio
      if (message.message?.audioMessage) {
        const audioMessage = message.message.audioMessage;
        console.log(`🎤 Áudio recebido de ${numero}`);
        console.log('📋 Detalhes do áudio:', JSON.stringify(audioMessage, null, 2));
        
        try {
          const fs = require('fs');
          const path = require('path');
          
          // Criar diretório de uploads se não existir
          // process.cwd() já aponta para a pasta backend quando o servidor está rodando
          const uploadsDir = path.join(process.cwd(), 'uploads', 'audios');
          if (!fs.existsSync(uploadsDir)) {
            console.log('📁 Criando diretório de uploads...');
            fs.mkdirSync(uploadsDir, { recursive: true });
            console.log('✅ Diretório criado:', uploadsDir);
          } else {
            console.log('📁 Diretório já existe:', uploadsDir);
          }
          
          // Baixar áudio - passar consultorId para pegar socket correto
          console.log('📥 Tentando baixar áudio...');
          const buffer = await this.downloadMedia(message, consultorId);
          
          if (buffer && buffer.length > 0) {
            // Salvar arquivo
            const fileName = `audio_${Date.now()}_${numero}.ogg`;
            const filePath = path.join(uploadsDir, fileName);
            
            console.log(`💾 Salvando arquivo em: ${filePath}`);
            fs.writeFileSync(filePath, buffer);
            
            // Verificar se foi salvo
            if (fs.existsSync(filePath)) {
              const stats = fs.statSync(filePath);
              console.log(`✅ Arquivo salvo com sucesso! Tamanho: ${stats.size} bytes`);
              
              tipo = 'audio';
              const duracao = audioMessage.seconds || 0;
              conteudo = `🎤 Áudio (${Math.floor(duracao / 60)}:${(duracao % 60).toString().padStart(2, '0')})`;
              mediaUrl = `/uploads/audios/${fileName}`;
              mediaName = fileName;
            } else {
              console.error('❌ Arquivo não foi salvo!');
              conteudo = '🎤 Áudio (erro ao salvar)';
            }
          } else {
            console.error('❌ Buffer vazio ou nulo! Tamanho:', buffer?.length || 0);
            conteudo = '🎤 Áudio (erro no download)';
          }
        } catch (error) {
          console.error('❌ Erro ao processar áudio:', error);
          console.error('Stack:', (error as Error).stack);
          conteudo = '🎤 Áudio (erro ao baixar)';
        }
      }
      
      // Processar mensagem de imagem
      else if (message.message?.imageMessage) {
        const imageMessage = message.message.imageMessage;
        console.log(`📷 Imagem recebida de ${numero}`);
        
        try {
          const fs = require('fs');
          const path = require('path');
          
          // Criar diretório de uploads se não existir
          const uploadsDir = path.join(process.cwd(), 'uploads', 'images');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          
          // Baixar imagem
          const buffer = await this.downloadMedia(message, consultorId);
          
          if (buffer && buffer.length > 0) {
            // Determinar extensão baseada no mimetype
            const mimetype = imageMessage.mimetype || 'image/jpeg';
            const ext = mimetype.split('/')[1] || 'jpg';
            const fileName = `image_${Date.now()}_${numero}.${ext}`;
            const filePath = path.join(uploadsDir, fileName);
            
            fs.writeFileSync(filePath, buffer);
            
            if (fs.existsSync(filePath)) {
              console.log(`✅ Imagem salva com sucesso! Tamanho: ${buffer.length} bytes`);
              tipo = 'imagem';
              mediaUrl = `/uploads/images/${fileName}`;
              mediaName = fileName;
              conteudo = '📷 Imagem';
              const caption = imageMessage.caption;
              if (caption) conteudo += `: ${caption}`;
            } else {
              console.error('❌ Arquivo de imagem não foi salvo!');
              conteudo = '📷 Imagem (erro ao salvar)';
            }
          } else {
            console.error('❌ Buffer de imagem vazio!');
            conteudo = '📷 Imagem (erro no download)';
          }
        } catch (error) {
          console.error('❌ Erro ao processar imagem:', error);
          conteudo = '📷 Imagem (erro ao baixar)';
        }
      }
      
      // Processar mensagem de vídeo
      else if (message.message?.videoMessage) {
        const videoMessage = message.message.videoMessage;
        console.log(`🎥 Vídeo recebido de ${numero}`);
        
        try {
          const fs = require('fs');
          const path = require('path');
          
          // Criar diretório de uploads se não existir
          const uploadsDir = path.join(process.cwd(), 'uploads', 'videos');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          
          // Baixar vídeo
          const buffer = await this.downloadMedia(message, consultorId);
          
          if (buffer && buffer.length > 0) {
            // Determinar extensão baseada no mimetype
            const mimetype = videoMessage.mimetype || 'video/mp4';
            const ext = mimetype.split('/')[1] || 'mp4';
            const fileName = `video_${Date.now()}_${numero}.${ext}`;
            const filePath = path.join(uploadsDir, fileName);
            
            fs.writeFileSync(filePath, buffer);
            
            if (fs.existsSync(filePath)) {
              console.log(`✅ Vídeo salvo com sucesso! Tamanho: ${buffer.length} bytes`);
              tipo = 'video';
              mediaUrl = `/uploads/videos/${fileName}`;
              mediaName = fileName;
              conteudo = '🎥 Vídeo';
              const caption = videoMessage.caption;
              if (caption) conteudo += `: ${caption}`;
            } else {
              console.error('❌ Arquivo de vídeo não foi salvo!');
              conteudo = '🎥 Vídeo (erro ao salvar)';
            }
          } else {
            console.error('❌ Buffer de vídeo vazio!');
            conteudo = '🎥 Vídeo (erro no download)';
          }
        } catch (error) {
          console.error('❌ Erro ao processar vídeo:', error);
          conteudo = '🎥 Vídeo (erro ao baixar)';
        }
      }
      
      // Processar documento
      else if (message.message?.documentMessage) {
        const documentMessage = message.message.documentMessage;
        console.log(`📄 Documento recebido de ${numero}`);
        
        try {
          const fs = require('fs');
          const path = require('path');
          
          // Criar diretório de uploads se não existir
          const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          
          // Baixar documento
          const buffer = await this.downloadMedia(message, consultorId);
          
          if (buffer && buffer.length > 0) {
            const originalName = documentMessage.fileName || 'documento';
            const fileName = `doc_${Date.now()}_${numero}_${originalName}`;
            const filePath = path.join(uploadsDir, fileName);
            
            fs.writeFileSync(filePath, buffer);
            
            if (fs.existsSync(filePath)) {
              console.log(`✅ Documento salvo com sucesso! Tamanho: ${buffer.length} bytes`);
              tipo = 'documento';
              mediaUrl = `/uploads/documents/${fileName}`;
              mediaName = originalName;
              conteudo = `📄 ${originalName}`;
            } else {
              console.error('❌ Arquivo de documento não foi salvo!');
              conteudo = `📄 ${originalName} (erro ao salvar)`;
            }
          } else {
            console.error('❌ Buffer de documento vazio!');
            conteudo = `📄 ${documentMessage.fileName || 'documento'} (erro no download)`;
          }
        } catch (error) {
          console.error('❌ Erro ao processar documento:', error);
          conteudo = `📄 ${documentMessage.fileName || 'documento'} (erro ao baixar)`;
        }
      }

      if (!conteudo) return;

      console.log(`📱 Mensagem recebida de ${numero}: ${conteudo}`);

      // Verificar se o lead já existe
      const leadResult = await query(
        'SELECT id, nome FROM leads WHERE telefone = ? AND consultor_id = ?',
        [numero, consultorId]
      );

      let leadId: string;
      let isNovoLead = false;

      if (leadResult.rows.length === 0) {
        // Criar novo lead
        console.log('👤 Criando novo lead para:', numero);
        // Formatar número como (DDD) NUMERO
        const numeroSem55 = numero.startsWith('55') ? numero.substring(2) : numero;
        const ddd = numeroSem55.substring(0, 2);
        const resto = numeroSem55.substring(2);
        const nomeFormatado = `(${ddd}) ${resto}`;
        
        const novoLeadResult = await query(
          `INSERT INTO leads (nome, telefone, origem, status, consultor_id, mensagens_nao_lidas, data_criacao, data_atualizacao)
           VALUES (?, ?, 'WhatsApp', 'novo', ?, 1, NOW(), NOW())`,
          [nomeFormatado, numero, consultorId]
        );
        
        // Para MySQL, o insertId vem em result.insertId
        if (novoLeadResult.insertId) {
          leadId = String(novoLeadResult.insertId);
        } else {
          // Fallback: buscar o lead recém-criado
          const leadCriado = await query(
            'SELECT id FROM leads WHERE telefone = ? AND consultor_id = ? ORDER BY data_criacao DESC LIMIT 1',
            [numero, consultorId]
          );
          leadId = leadCriado.rows[0]?.id;
        }
        
        console.log('✅ Novo lead criado com ID:', leadId);
        isNovoLead = true;
      } else {
        leadId = leadResult.rows[0].id;
        console.log('📋 Lead existente encontrado:', leadId);

        // Incrementar mensagens não lidas
        await query(
          'UPDATE leads SET mensagens_nao_lidas = mensagens_nao_lidas + 1, data_atualizacao = NOW() WHERE id = ?',
          [leadId]
        );
      }

      // ✅ Salvar mensagem no banco COM O ID ÚNICO DO WHATSAPP
      console.log('💾 [DEBUG] Salvando mensagem no banco:', {
        leadId,
        consultorId,
        conteudo: conteudo.substring(0, 50),
        tipo,
        whatsappMessageId
      });
      
      await query(
        `INSERT INTO mensagens (lead_id, consultor_id, conteudo, tipo, remetente, status, media_url, media_name, whatsapp_message_id, timestamp)
         VALUES (?, ?, ?, ?, 'lead', 'lida', ?, ?, ?, NOW())`,
        [leadId, consultorId, conteudo, tipo, mediaUrl, mediaName, whatsappMessageId]
      );
      console.log('✅ [DEBUG] Mensagem salva com sucesso! WhatsApp ID:', whatsappMessageId);

      // Atualizar última mensagem do lead
      await query(
        'UPDATE leads SET ultima_mensagem = ? WHERE id = ?',
        [conteudo.substring(0, 50), leadId]
      );

      // Buscar informações completas do lead para enviar ao frontend
      const leadCompleto = await query(
        'SELECT * FROM leads WHERE id = ?',
        [leadId]
      );

      const lead = leadCompleto.rows[0];

      // Emitir evento de nova mensagem via Socket.IO
      if (this.io) {
        console.log('📡 Emitindo evento nova_mensagem via Socket.IO');
        
        // Emitir para o consultor
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
          numero,
          conteudo,
          tipo,
          remetente: 'lead', // IMPORTANTE: Identificar como mensagem do lead
          mediaUrl,
          mediaName,
          timestamp: new Date().toISOString(),
          isNovoLead
        });
        console.log('✅ Evento nova_mensagem emitido com mediaUrl:', mediaUrl);
        
        // Emitir também para admins
        this.io.to('admins').emit('nova_mensagem', {
          leadId,
          lead: {
            id: lead.id,
            nome: lead.nome,
            telefone: lead.telefone,
            origem: lead.origem,
            status: lead.status,
            mensagensNaoLidas: lead.mensagens_nao_lidas
          },
          numero,
          conteudo,
          tipo,
          remetente: 'lead',
          mediaUrl,
          mediaName,
          timestamp: new Date().toISOString(),
          isNovoLead
        });
        console.log('✅ Evento nova_mensagem emitido para admins também');

        // Se for novo lead, emitir evento adicional
        if (isNovoLead) {
          console.log('📡 Emitindo evento novo_lead via Socket.IO');
          
          // Emitir para o consultor
          this.io.to(`consultor_${consultorId}`).emit('novo_lead', {
            lead: {
              id: lead.id,
              nome: lead.nome,
              telefone: lead.telefone,
              origem: lead.origem,
              status: lead.status,
              mensagensNaoLidas: lead.mensagens_nao_lidas,
              dataCriacao: lead.data_criacao,
              dataAtualizacao: lead.data_atualizacao
            }
          });
          console.log('✅ Evento novo_lead emitido para consultor');
          
          // Emitir também para admins
          this.io.to('admins').emit('novo_lead', {
            lead: {
              id: lead.id,
              nome: lead.nome,
              telefone: lead.telefone,
              origem: lead.origem,
              status: lead.status,
              mensagensNaoLidas: lead.mensagens_nao_lidas,
              dataCriacao: lead.data_criacao,
              dataAtualizacao: lead.data_atualizacao
            }
          });
          console.log('✅ Evento novo_lead emitido para admins também');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao processar mensagem recebida:', error);
    }
  }

  getStatus(consultorId: string): { connected: boolean; hasSession: boolean } {
    const session = this.sessions.get(consultorId);
    return {
      connected: session?.connected || false,
      hasSession: !!session
    };
  }

  // Método para verificar se está conectado
  isConnected(consultorId: string): boolean {
    const session = this.sessions.get(consultorId);
    return session?.connected || false;
  }

  // Método para obter o socket de uma sessão específica
  getSocket(consultorId: string): any | null {
    const session = this.sessions.get(consultorId);
    if (session?.connected && session.sock) {
      return session.sock;
    }
    return null;
  }

  // Método para obter qualquer socket ativo (para validações)
  getAnyActiveSocket(): any | null {
    for (const [consultorId, session] of this.sessions.entries()) {
      if (session.connected && session.sock) {
        console.log(`✅ Usando socket ativo do consultor: ${consultorId}`);
        return session.sock;
      }
    }
    console.log('⚠️ Nenhum socket ativo encontrado');
    return null;
  }

  // Sincronizar todas as conversas do WhatsApp com o banco de dados
  async sincronizarConversas(consultorId: string): Promise<{ success: boolean; mensagensNovas: number; erros: number }> {
    try {
      console.log('🔄 Iniciando sincronização de conversas para consultor:', consultorId);
      
      const session = this.sessions.get(consultorId);
      if (!session || !session.sock) {
        throw new Error('WhatsApp não conectado');
      }

      const sock = session.sock;
      let mensagensNovas = 0;
      let erros = 0;

      // Buscar todos os chats do WhatsApp
      const chats = await sock.store.chats.all();
      console.log(`📱 Total de chats encontrados no WhatsApp: ${chats.length}`);

      // Processar cada chat
      for (const chat of chats) {
        try {
          const jid = chat.id;
          
          // Pular chats de grupos e status
          if (jid.includes('@g.us') || jid.includes('@broadcast') || jid === 'status@broadcast') {
            continue;
          }

          // Buscar mensagens do chat (últimas 50)
          const messages = await sock.fetchMessages(jid, 50);
          console.log(`  📨 Chat ${jid}: ${messages.length} mensagens encontradas`);

          // Processar cada mensagem
          for (const message of messages) {
            // Apenas processar mensagens RECEBIDAS (não enviadas por mim)
            if (message.key.fromMe) continue;

            // Verificar se já existe no banco
            const whatsappMessageId = message.key.id;
            if (whatsappMessageId) {
              const existe = await query(
                'SELECT id FROM mensagens WHERE whatsapp_message_id = ?',
                [whatsappMessageId]
              );

              if (existe.rows.length === 0) {
                // Mensagem nova, processar
                await this.processarMensagemRecebida(consultorId, message);
                mensagensNovas++;
                console.log(`    ✅ Mensagem nova sincronizada: ${whatsappMessageId}`);
              }
            }
          }
        } catch (chatError) {
          console.error(`  ❌ Erro ao processar chat:`, chatError);
          erros++;
        }
      }

      console.log(`✅ Sincronização concluída: ${mensagensNovas} mensagens novas, ${erros} erros`);
      return { success: true, mensagensNovas, erros };
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      return { success: false, mensagensNovas: 0, erros: 1 };
    }
  }

  // Sincronizar um chat específico
  async sincronizarChatEspecifico(consultorId: string, numeroTelefone: string, limit: number = 500): Promise<{ success: boolean; mensagensNovas: number }> {
    try {
      console.log('🔄 INÍCIO SINCRONIZAÇÃO - Chat:', numeroTelefone);
      console.log(`📊 Limite de mensagens a buscar: ${limit}`);
      
      const session = this.sessions.get(consultorId);
      if (!session || !session.sock) {
        throw new Error('WhatsApp não conectado');
      }

      const sock = session.sock;
      
      // 🔄 INÍCIO HISTÓRICO
      // Buscar o telefone no banco para verificar o formato correto (pode ser @lid ou @s.whatsapp.net)
      const leadResult = await query(
        'SELECT telefone FROM leads WHERE telefone LIKE ? AND consultor_id = ? LIMIT 1',
        [`%${numeroTelefone}%`, consultorId]
      );
      
      let jid: string;
      let jidAlternativo: string | null = null;
      
      if (leadResult.rows.length > 0 && leadResult.rows[0].telefone.includes('@')) {
        // Usar o formato exato salvo no banco
        jid = leadResult.rows[0].telefone;
        console.log('📱 JID do banco:', jid);
      } else {
        // Tentar ambos os formatos: @s.whatsapp.net E @lid
        const numeroLimpo = numeroTelefone.replace(/\D/g, '');
        jid = `${numeroLimpo}@s.whatsapp.net`;
        jidAlternativo = `${numeroLimpo}@lid`;
        console.log('📱 JID primário:', jid);
        console.log('📱 JID alternativo:', jidAlternativo);
      }
      
      let mensagensNovas = 0;
      let mensagensTotais = 0;
      let mensagensEnviadas = 0;
      let mensagensRecebidas = 0;

      console.log('📥 Buscando mensagens do WhatsApp...');
      
      // Buscar mensagens do store (já carregadas na memória)
      let messages: any[] = [];
      
      try {
        // Acessar mensagens do store do Baileys
        const storeMessages = sock.store?.messages?.[jid];
        
        if (storeMessages) {
          // Converter objeto de mensagens em array
          messages = Object.values(storeMessages).filter((msg: any) => msg && msg.key);
          console.log(`✅ ${messages.length} mensagens encontradas no store para ${jid}`);
        }
        
        // Se não encontrou mensagens, tentar com JID alternativo
        if (messages.length === 0 && jidAlternativo) {
          console.log(`⚠️ Nenhuma mensagem com ${jid}, tentando ${jidAlternativo}...`);
          const storeMessagesAlt = sock.store?.messages?.[jidAlternativo];
          
          if (storeMessagesAlt) {
            messages = Object.values(storeMessagesAlt).filter((msg: any) => msg && msg.key);
            jid = jidAlternativo; // Usar o JID que funcionou
            console.log(`✅ ${messages.length} mensagens encontradas no store para ${jid}`);
          }
        }
        
        // Limitar ao número solicitado
        if (messages.length > limit) {
          messages = messages.slice(-limit); // Pegar as mais recentes
        }
      } catch (error) {
        console.error('❌ Erro ao buscar mensagens do store:', error);
        messages = [];
      }
      
      mensagensTotais = messages.length;
      console.log(`📨 ${mensagensTotais} mensagens encontradas no histórico do WhatsApp`);

      // Processar cada mensagem (AMBAS: enviadas e recebidas)
      for (const message of messages) {
        // Verificar se já existe no banco
        const whatsappMessageId = message.key.id;
        if (!whatsappMessageId) continue;

        const existe = await query(
          'SELECT id FROM mensagens WHERE whatsapp_message_id = ?',
          [whatsappMessageId]
        );

        if (existe.rows.length === 0) {
          // Mensagem nova, processar
          if (message.key.fromMe) {
            // Mensagem ENVIADA por mim
            await this.processarMensagemEnviada(consultorId, message);
            mensagensNovas++;
            mensagensEnviadas++;
            console.log(`  📤 Mensagem enviada sincronizada: ${whatsappMessageId.substring(0, 20)}...`);
          } else {
            // Mensagem RECEBIDA
            await this.processarMensagemRecebida(consultorId, message);
            mensagensNovas++;
            mensagensRecebidas++;
            console.log(`  📨 Mensagem recebida sincronizada: ${whatsappMessageId.substring(0, 20)}...`);
          }
        }
      }
      // 🔄 FIM HISTÓRICO

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ SINCRONIZAÇÃO CONCLUÍDA');
      console.log(`📊 Estatísticas:`);
      console.log(`   • Total no WhatsApp: ${mensagensTotais}`);
      console.log(`   • Novas sincronizadas: ${mensagensNovas}`);
      console.log(`   • Enviadas: ${mensagensEnviadas}`);
      console.log(`   • Recebidas: ${mensagensRecebidas}`);
      console.log(`   • Já existentes: ${mensagensTotais - mensagensNovas}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return { success: true, mensagensNovas };
    } catch (error) {
      console.error('❌ Erro ao sincronizar chat:', error);
      console.error('Stack:', (error as Error).stack);
      return { success: false, mensagensNovas: 0 };
    }
  }

  // Processar mensagem enviada durante sincronização
  private async processarMensagemEnviada(consultorId: string, message: WAMessage) {
    try {
      const whatsappMessageId = message.key.id;
      console.log('🔍 [SYNC-ENVIADA] Processando mensagem enviada - WhatsApp ID:', whatsappMessageId);
      
      const numero = message.key.remoteJid?.replace('@s.whatsapp.net', '') || '';
      
      // Extrair conteúdo da mensagem
      let conteudo = message.message?.conversation || 
                     message.message?.extendedTextMessage?.text || 
                     '';
      let tipo = 'texto';
      let mediaUrl: string | null = null;
      let mediaName: string | null = null;

      // Processar mensagens de mídia (áudio, imagem, vídeo, documento)
      if (message.message?.audioMessage) {
        tipo = 'audio';
        const duracao = message.message.audioMessage.seconds || 0;
        conteudo = `🎤 Áudio (${Math.floor(duracao / 60)}:${(duracao % 60).toString().padStart(2, '0')})`;
      } else if (message.message?.imageMessage) {
        tipo = 'imagem';
        conteudo = '📷 Imagem';
        const caption = message.message.imageMessage.caption;
        if (caption) conteudo += `: ${caption}`;
      } else if (message.message?.videoMessage) {
        tipo = 'video';
        conteudo = '🎥 Vídeo';
        const caption = message.message.videoMessage.caption;
        if (caption) conteudo += `: ${caption}`;
      } else if (message.message?.documentMessage) {
        tipo = 'documento';
        const fileName = message.message.documentMessage.fileName || 'documento';
        conteudo = `📄 ${fileName}`;
      }

      if (!conteudo) return;

      console.log(`📤 [SYNC-ENVIADA] Mensagem enviada para ${numero}: ${conteudo}`);

      // Buscar lead
      const leadResult = await query(
        'SELECT id FROM leads WHERE telefone = ? AND consultor_id = ?',
        [numero, consultorId]
      );

      if (leadResult.rows.length === 0) {
        console.log('⚠️ [SYNC-ENVIADA] Lead não encontrado, criando...');
        // Criar lead se não existir
        const numeroSem55 = numero.startsWith('55') ? numero.substring(2) : numero;
        const ddd = numeroSem55.substring(0, 2);
        const resto = numeroSem55.substring(2);
        const nomeFormatado = `(${ddd}) ${resto}`;
        
        const novoLeadResult = await query(
          `INSERT INTO leads (nome, telefone, origem, status, consultor_id, mensagens_nao_lidas, data_criacao, data_atualizacao)
           VALUES (?, ?, 'WhatsApp', 'novo', ?, 0, NOW(), NOW())`,
          [nomeFormatado, numero, consultorId]
        );
        
        const leadId = novoLeadResult.insertId ? String(novoLeadResult.insertId) : (await query(
          'SELECT id FROM leads WHERE telefone = ? AND consultor_id = ? ORDER BY data_criacao DESC LIMIT 1',
          [numero, consultorId]
        )).rows[0]?.id;

        if (!leadId) {
          console.error('❌ [SYNC-ENVIADA] Não foi possível criar lead');
          return;
        }

        // Salvar mensagem
        await query(
          `INSERT INTO mensagens (lead_id, consultor_id, conteudo, tipo, remetente, status, media_url, media_name, whatsapp_message_id, timestamp)
           VALUES (?, ?, ?, ?, 'consultor', 'enviada', ?, ?, ?, FROM_UNIXTIME(?))`,
          [leadId, consultorId, conteudo, tipo, mediaUrl, mediaName, whatsappMessageId, message.messageTimestamp]
        );

        await query(
          'UPDATE leads SET ultima_mensagem = ?, data_atualizacao = NOW() WHERE id = ?',
          [conteudo.substring(0, 50), leadId]
        );
      } else {
        const leadId = leadResult.rows[0].id;

        // Salvar mensagem
        await query(
          `INSERT INTO mensagens (lead_id, consultor_id, conteudo, tipo, remetente, status, media_url, media_name, whatsapp_message_id, timestamp)
           VALUES (?, ?, ?, ?, 'consultor', 'enviada', ?, ?, ?, FROM_UNIXTIME(?))`,
          [leadId, consultorId, conteudo, tipo, mediaUrl, mediaName, whatsappMessageId, message.messageTimestamp]
        );

        await query(
          'UPDATE leads SET ultima_mensagem = ?, data_atualizacao = NOW() WHERE id = ?',
          [conteudo.substring(0, 50), leadId]
        );
      }

      console.log('✅ [SYNC-ENVIADA] Mensagem enviada salva com sucesso!');
    } catch (error) {
      console.error('❌ [SYNC-ENVIADA] Erro ao processar mensagem enviada:', error);
    }
  }

  // Método auxiliar para baixar mídia
  private async downloadMedia(message: WAMessage, consultorId: string): Promise<Buffer | null> {
    try {
      console.log('📥 Iniciando download de mídia...');
      
      // Obter o socket da sessão do consultor específico
      const session = this.sessions.get(consultorId);
      if (!session || !session.sock) {
        console.error('❌ Socket não encontrado para o consultor:', consultorId);
        return null;
      }

      const sock = session.sock;

      // Usar downloadMediaMessage do Baileys diretamente
      const { downloadMediaMessage } = await import('baileys');
      
      console.log('🔄 Baixando buffer da mensagem...');
      const buffer = await downloadMediaMessage(
        message,
        'buffer',
        {},
        {
          logger: require('pino')({ level: 'silent' }),
          reuploadRequest: sock.updateMediaMessage
        }
      );

      if (buffer) {
        console.log(`✅ Mídia baixada com sucesso! Tamanho: ${buffer.length} bytes`);
        return buffer as Buffer;
      }

      console.error('❌ Buffer vazio retornado');
      return null;
    } catch (error) {
      console.error('❌ Erro ao baixar mídia:', error);
      console.error('Stack completo:', (error as Error).stack);
      return null;
    }
  }
}

export const whatsappService = new WhatsAppService();
