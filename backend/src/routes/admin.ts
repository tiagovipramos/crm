import express from 'express';
import {
  loginAdmin,
  getEstatisticasCRM,
  getTopPerformers,
  getDistribuicaoFunil,
  getEstatisticasIndicacao,
  getTopIndicadores,
  getAlertas,
  getVendedores,
  getAdmins,
  getIndicadores,
  getSolicitacoesSaque
} from '../controllers/adminController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// =========================================
// ROTA DE LOGIN
// =========================================
router.post('/login', loginAdmin);

// =========================================
// ROTAS DE ESTATÍSTICAS (protegidas)
// =========================================
router.get('/estatisticas/crm', authMiddleware, getEstatisticasCRM);
router.get('/estatisticas/indicacao', authMiddleware, getEstatisticasIndicacao);

// =========================================
// ROTAS DE TOP PERFORMERS (protegidas)
// =========================================
router.get('/top-performers', authMiddleware, getTopPerformers);
router.get('/top-indicadores', authMiddleware, getTopIndicadores);

// =========================================
// ROTAS DE FUNIL (protegidas)
// =========================================
router.get('/distribuicao-funil', authMiddleware, getDistribuicaoFunil);

// =========================================
// ROTAS DE ALERTAS (protegidas)
// =========================================
router.get('/alertas', authMiddleware, getAlertas);

// =========================================
// ROTAS DE USUÁRIOS (protegidas com autenticação)
// =========================================
router.get('/vendedores', authMiddleware, getVendedores);
router.get('/admins', authMiddleware, getAdmins);
router.get('/indicadores', authMiddleware, getIndicadores);

// =========================================
// ROTAS DE SAQUES (protegidas)
// =========================================
router.get('/saques/pendentes', authMiddleware, getSolicitacoesSaque);

// =========================================
// ROTAS DE CHAT (protegidas)
// =========================================
import { getChatsVendedores } from '../controllers/adminController';
router.get('/chats-vendedores', authMiddleware, getChatsVendedores);

// =========================================
// ROTAS DE CRIAÇÃO DE USUÁRIOS (protegidas)
// =========================================
import { criarVendedor, criarIndicador, criarAdmin, atualizarStatusVendedor, atualizarStatusIndicador, deletarVendedor, deletarIndicador, deletarAdmin, atualizarStatusAdmin, gerarTokenTemporario } from '../controllers/adminController';

router.post('/vendedores', authMiddleware, criarVendedor);
router.post('/indicadores', authMiddleware, criarIndicador);
router.post('/admins', authMiddleware, criarAdmin);
router.post('/vendedores/:vendedorId/gerar-token', authMiddleware, gerarTokenTemporario);
router.put('/vendedores/:id/status', authMiddleware, atualizarStatusVendedor);
router.put('/indicadores/:id/status', authMiddleware, atualizarStatusIndicador);
router.put('/admins/:id/status', authMiddleware, atualizarStatusAdmin);
router.delete('/vendedores/:id', authMiddleware, deletarVendedor);
router.delete('/indicadores/:id', authMiddleware, deletarIndicador);
router.delete('/admins/:id', authMiddleware, deletarAdmin);

// ROTAS DE EDIÇÃO COMPLETA DE USUÁRIOS
import { editarVendedor, editarIndicador, editarAdmin } from '../controllers/adminController';
router.put('/vendedores/:id', authMiddleware, editarVendedor);
router.put('/indicadores/:id', authMiddleware, editarIndicador);
router.put('/admins/:id', authMiddleware, editarAdmin);

export default router;
