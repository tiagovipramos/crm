import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { whatsappService } from '../services/whatsappService';

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Nome único: timestamp + nome original
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// Filtro de tipos de arquivo
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Aceitar imagens, vídeos, áudios e documentos
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|avi|mov|webm|ogg|mp3|wav|m4a|pdf|doc|docx|xls|xlsx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  // Tipos MIME permitidos
  const allowedMimetypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/avi', 'video/quicktime', 'video/webm',
    'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-m4a',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  
  const mimetypeValid = allowedMimetypes.some(type => file.mimetype.includes(type));

  if (extname || mimetypeValid) {
    cb(null, true);
  } else {
    console.error('❌ Tipo de arquivo rejeitado:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      extname: path.extname(file.originalname)
    });
    cb(new Error('Tipo de arquivo não suportado'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max (para vídeos)
    files: 1 // Apenas 1 arquivo por request
  }
});

export const uploadAndSendFile = async (req: Request, res: Response) => {
  try {
    const consultorId = req.user?.id;
    const { leadId } = req.body;
    const file = req.file;

    if (!consultorId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    // ✅ Validação de tamanho mínimo (1KB)
    if (file.size < 1024) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Arquivo muito pequeno ou vazio' });
    }

    // ✅ Validação de tamanho máximo por tipo
    const maxSizes: Record<string, number> = {
      image: 10 * 1024 * 1024, // 10MB
      audio: 16 * 1024 * 1024, // 16MB
      video: 100 * 1024 * 1024, // 100MB
      document: 25 * 1024 * 1024 // 25MB
    };

    let tipoCategoria = 'document';
    if (file.mimetype.startsWith('image/')) tipoCategoria = 'image';
    else if (file.mimetype.startsWith('audio/')) tipoCategoria = 'audio';
    else if (file.mimetype.startsWith('video/')) tipoCategoria = 'video';

    if (file.size > maxSizes[tipoCategoria]) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ 
        error: `Arquivo ${tipoCategoria === 'image' ? 'imagem' : tipoCategoria === 'audio' ? 'áudio' : tipoCategoria === 'video' ? 'vídeo' : 'documento'} muito grande. Máximo: ${maxSizes[tipoCategoria] / 1024 / 1024}MB` 
      });
    }

    if (!leadId) {
      // Deletar arquivo se não tiver leadId
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Lead ID é obrigatório' });
    }

    console.log('📤 Upload de arquivo recebido:', {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      leadId
    });

    // Buscar número do telefone do lead
    const { query } = require('../config/db-helper');
    const leadResult = await query(
      'SELECT telefone FROM leads WHERE id = ? AND consultor_id = ?',
      [leadId, consultorId]
    );

    if (leadResult.rows.length === 0) {
      fs.unlinkSync(file.path);
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const telefone = leadResult.rows[0].telefone;
    const filePath = file.path;

    // Enviar arquivo via WhatsApp
    let tipoMensagem = 'document';  // Para whatsappService
    let tipoFrontend = 'documento';  // Para buscar no banco depois
    let caption = file.originalname;

    if (file.mimetype.startsWith('image/')) {
      tipoMensagem = 'image';
      tipoFrontend = 'imagem';
    } else if (file.mimetype.startsWith('video/')) {
      tipoMensagem = 'video';
      tipoFrontend = 'video';
    } else if (file.mimetype.startsWith('audio/')) {
      tipoMensagem = 'audio';
      tipoFrontend = 'audio';
    }

    // Enviar arquivo via WhatsApp (já salva no banco dentro do whatsappService)
    await whatsappService.enviarArquivo(consultorId, telefone, filePath, tipoMensagem as any, caption || file.originalname);

    console.log('✅ Arquivo enviado via WhatsApp e salvo no banco');

    // Buscar a mensagem recém-salva pelo whatsappService (usando o tipo mapeado do frontend)
    console.log('🔍 Buscando mensagem de arquivo salva no banco...', { leadId, consultorId, tipoFrontend });
    const mensagemResult = await query(
      `SELECT * FROM mensagens 
       WHERE lead_id = ? AND consultor_id = ? AND tipo = ? AND remetente = 'consultor'
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [leadId, consultorId, tipoFrontend]
    );

    let mensagemSalva: any = null;
    
    if (mensagemResult.rows.length > 0) {
      mensagemSalva = mensagemResult.rows[0];
      console.log('✅ Mensagem de arquivo encontrada no banco:', mensagemSalva.id);
    } else {
      console.error('❌ Mensagem de arquivo não encontrada no banco após envio');
      // Criar fallback
      const mediaUrl = `/uploads/${file.filename}`;
      let conteudo = '';
      
      switch (tipoFrontend) {
        case 'imagem':
          conteudo = '📷 Imagem';
          break;
        case 'video':
          conteudo = '🎥 Vídeo';
          break;
        case 'audio':
          conteudo = '🎤 Áudio';
          break;
        default:
          conteudo = `📄 ${file.originalname}`;
      }
      
      mensagemSalva = {
        id: Date.now(),
        lead_id: leadId,
        consultor_id: consultorId,
        conteudo,
        tipo: tipoFrontend,  // Usar tipo do frontend, não do WhatsApp
        remetente: 'consultor',
        status: 'enviada',
        media_url: mediaUrl,
        media_name: file.originalname,
        timestamp: new Date().toISOString()
      };
    }

    // ✅ EMITIR via Socket.IO com evento correto (nova_mensagem)
    const io = (req as any).app.get('io');
    if (io) {
      console.log('📡 Emitindo nova_mensagem (arquivo) via Socket.IO para consultor:', consultorId);
      io.to(`consultor_${consultorId}`).emit('nova_mensagem', {
        id: mensagemSalva.id,
        leadId: mensagemSalva.lead_id,
        consultorId: mensagemSalva.consultor_id,
        conteudo: mensagemSalva.conteudo,
        tipo: mensagemSalva.tipo,
        remetente: mensagemSalva.remetente,
        status: mensagemSalva.status,
        mediaUrl: mensagemSalva.media_url,
        mediaName: mensagemSalva.media_name,
        timestamp: mensagemSalva.timestamp
      });
      console.log('✅ Evento de arquivo emitido com sucesso, mediaUrl:', mensagemSalva.media_url);
    }

    // NÃO deletar o arquivo, pois ele precisa ficar disponível para visualização
    console.log('📁 Arquivo mantido em:', mensagemSalva.media_url);

    res.json({
      success: true,
      message: 'Arquivo enviado com sucesso',
      file: {
        name: file.originalname,
        type: tipoMensagem,
        size: file.size
      }
    });

  } catch (error) {
    console.error('❌ Erro ao fazer upload e enviar arquivo:', error);
    
    // Deletar arquivo em caso de erro
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Erro ao enviar arquivo' });
  }
};
