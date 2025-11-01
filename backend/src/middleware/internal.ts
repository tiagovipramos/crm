import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para requisições internas (scheduler, cron jobs, etc)
 * Verifica o header X-Internal-Request ao invés de JWT
 */
export const internalMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const internalHeader = req.headers['x-internal-request'];
  
  // Aceitar se vier do scheduler ou de localhost
  if (internalHeader === 'scheduler' || req.ip === '127.0.0.1' || req.ip === '::1') {
    return next();
  }
  
  // Se não for requisição interna, retornar erro
  return res.status(403).json({ error: 'Acesso negado - Apenas requisições internas' });
};
