import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'protecar-secret-key-indicador-2024';

export interface IndicadorAuthRequest extends Request {
  indicadorId?: string;
  indicadorEmail?: string;
}

export const authIndicador = (req: IndicadorAuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        error: 'Token não fornecido',
        message: 'Autenticação necessária'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { 
      id: string; 
      email: string; 
      tipo: string;
    };

    // Verificar se é um token de indicador
    if (decoded.tipo !== 'indicador') {
      return res.status(403).json({ 
        error: 'Token inválido',
        message: 'Token não é de indicador'
      });
    }

    req.indicadorId = decoded.id;
    req.indicadorEmail = decoded.email;

    next();
  } catch (error) {
    console.error('Erro na autenticação do indicador:', error);
    return res.status(401).json({ 
      error: 'Token inválido',
      message: 'Sessão expirada ou inválida'
    });
  }
};

export const generateTokenIndicador = (id: string, email: string): string => {
  return jwt.sign(
    { id, email, tipo: 'indicador' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};
