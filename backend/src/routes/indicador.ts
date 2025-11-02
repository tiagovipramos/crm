import express from 'express';
import {
  register,
  login,
  getMe,
  getDashboard,
  validarWhatsApp,
  criarIndicacao,
  getIndicacoes,
  getIndicacao,
  deletarTodasIndicacoes,
  getTransacoes,
  solicitarSaque,
  getSaques,
  atualizarAvatar,
  getLootBoxStatus,
  abrirLootBox,
  compartilharPremio
} from '../controllers/indicadorController';
import { authIndicador } from '../middleware/authIndicador';

const router = express.Router();

// ============================================
// ROTAS PÚBLICAS (SEM AUTENTICAÇÃO)
// ============================================

// Autenticação
router.post('/register', register);
router.post('/login', login);

// ============================================
// ROTAS PROTEGIDAS (COM AUTENTICAÇÃO)
// ============================================

// Perfil
router.get('/me', authIndicador, getMe);

// Dashboard
router.get('/dashboard', authIndicador, getDashboard);

// Validação de WhatsApp
router.post('/validar-whatsapp', authIndicador, validarWhatsApp);

// Indicações
router.post('/indicar', authIndicador, criarIndicacao);
router.get('/indicacoes', authIndicador, getIndicacoes);
router.get('/indicacoes/:id', authIndicador, getIndicacao);
router.delete('/indicacoes', authIndicador, deletarTodasIndicacoes);

// Transações
router.get('/transacoes', authIndicador, getTransacoes);

// Saques
router.post('/solicitar-saque', authIndicador, solicitarSaque);
router.get('/saques', authIndicador, getSaques);

// Avatar
router.post('/avatar', authIndicador, atualizarAvatar);

// Loot Box / Caixa Misteriosa
router.get('/lootbox/status', authIndicador, getLootBoxStatus);
router.post('/lootbox/abrir', authIndicador, abrirLootBox);
router.post('/lootbox/compartilhar', authIndicador, compartilharPremio);

export default router;
