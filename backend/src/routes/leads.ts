import express from 'express';
import * as leadsController from '../controllers/leadsController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

router.get('/', leadsController.getLeads);
router.get('/:id', leadsController.getLead);
router.post('/', leadsController.createLead);
router.put('/:id', leadsController.updateLead);
router.patch('/:id/status', leadsController.updateStatus);
router.delete('/:id', leadsController.deleteLead);
router.post('/:id/tags', leadsController.addTag);
router.delete('/:id/tags/:tag', leadsController.removeTag);

export default router;
