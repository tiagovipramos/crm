import express from 'express';
import * as whatsappController from '../controllers/whatsappController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

router.post('/connect', whatsappController.conectar);
router.post('/disconnect', whatsappController.desconectar);
router.get('/status', whatsappController.getStatus);
router.post('/sincronizar', whatsappController.sincronizar);
router.post('/sincronizar-chat', whatsappController.sincronizarChat);

// Rotas da API Oficial
router.post('/configurar-api-oficial', whatsappController.configurarApiOficial);
router.post('/alterar-tipo-api', whatsappController.alterarTipoApi);

// Webhook da API Oficial (não requer autenticação JWT)
router.all('/webhook-oficial', whatsappController.webhookOficial);

export default router;
