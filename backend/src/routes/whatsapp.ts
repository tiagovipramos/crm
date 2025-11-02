import express from 'express';
import * as whatsappController from '../controllers/whatsappController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

router.post('/connect', whatsappController.conectar);
router.post('/disconnect', whatsappController.desconectar);
router.get('/status', whatsappController.getStatus);

export default router;
