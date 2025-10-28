import express from 'express';
import * as authController from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Rota pública
router.post('/login', authController.login);

// Rotas protegidas
router.get('/me', authMiddleware, authController.getMe);

export default router;
