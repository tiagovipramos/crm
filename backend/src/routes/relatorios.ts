import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getTempoMedioResposta } from '../controllers/relatoriosController';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// GET /api/relatorios/tempo-medio-resposta
router.get('/tempo-medio-resposta', getTempoMedioResposta);

export default router;
