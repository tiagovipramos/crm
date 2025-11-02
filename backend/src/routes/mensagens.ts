import express from 'express';
import * as mensagensController from '../controllers/mensagensController';
import { upload, uploadAndSendFile } from '../controllers/uploadController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

router.get('/lead/:leadId', mensagensController.getMensagens);
router.post('/send', mensagensController.enviarMensagem);
router.post('/upload', upload.single('file'), uploadAndSendFile);
router.post('/send-audio', upload.single('audio'), mensagensController.enviarAudio);
router.put('/lead/:leadId/mark-read', mensagensController.marcarComoLida);

export default router;
