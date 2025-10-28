import { Request, Response } from 'express';
import { whatsappService } from '../services/whatsappService';

export const conectar = async (req: Request, res: Response) => {
  try {
    const consultorId = req.user?.id;

    if (!consultorId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const qrCode = await whatsappService.conectar(consultorId);

    if (qrCode) {
      res.json({ 
        message: 'Aguardando leitura do QR Code',
        qrCode 
      });
    } else {
      res.json({ 
        message: 'WhatsApp conectado com sucesso' 
      });
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

    const status = whatsappService.getStatus(consultorId);

    res.json(status);
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    res.status(500).json({ error: 'Erro ao buscar status' });
  }
};
