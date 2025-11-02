import express from 'express';
import {
  listarSequencias,
  buscarSequencia,
  criarSequencia,
  atualizarSequencia,
  deletarSequencia,
  adicionarLeadSequencia,
  pausarFollowUp,
  reativarFollowUp,
  cancelarFollowUp,
  listarFollowUpsLead,
  processarEnviosProgramados,
  obterEstatisticas,
  obterProximosEnvios,
  obterHistoricoLead
} from '../controllers/followupController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// ============================================
// ROTAS DE SEQUÊNCIAS
// ============================================

/**
 * @route   GET /api/followup/sequencias
 * @desc    Listar todas as sequências de follow-up
 * @access  Private
 */
router.get('/sequencias', authMiddleware, listarSequencias);

/**
 * @route   GET /api/followup/sequencias/:id
 * @desc    Buscar uma sequência por ID com suas mensagens
 * @access  Private
 */
router.get('/sequencias/:id', authMiddleware, buscarSequencia);

/**
 * @route   POST /api/followup/sequencias
 * @desc    Criar nova sequência de follow-up
 * @access  Private
 */
router.post('/sequencias', authMiddleware, criarSequencia);

/**
 * @route   PUT /api/followup/sequencias/:id
 * @desc    Atualizar sequência existente
 * @access  Private
 */
router.put('/sequencias/:id', authMiddleware, atualizarSequencia);

/**
 * @route   DELETE /api/followup/sequencias/:id
 * @desc    Deletar sequência
 * @access  Private
 */
router.delete('/sequencias/:id', authMiddleware, deletarSequencia);

// ============================================
// ROTAS DE GESTÃO DE LEADS
// ============================================

/**
 * @route   POST /api/followup/leads
 * @desc    Adicionar lead a uma sequência de follow-up
 * @access  Private
 */
router.post('/leads', authMiddleware, adicionarLeadSequencia);

/**
 * @route   GET /api/followup/leads/:leadId
 * @desc    Listar follow-ups ativos de um lead
 * @access  Private
 */
router.get('/leads/:leadId', authMiddleware, listarFollowUpsLead);

/**
 * @route   PUT /api/followup/leads/:id/pausar
 * @desc    Pausar follow-up de um lead
 * @access  Private
 */
router.put('/leads/:id/pausar', authMiddleware, pausarFollowUp);

/**
 * @route   PUT /api/followup/leads/:id/reativar
 * @desc    Reativar follow-up pausado
 * @access  Private
 */
router.put('/leads/:id/reativar', authMiddleware, reativarFollowUp);

/**
 * @route   PUT /api/followup/leads/:id/cancelar
 * @desc    Cancelar follow-up de um lead
 * @access  Private
 */
router.put('/leads/:id/cancelar', authMiddleware, cancelarFollowUp);

/**
 * @route   GET /api/followup/leads/:leadId/historico
 * @desc    Obter histórico de envios de um lead
 * @access  Private
 */
router.get('/leads/:leadId/historico', authMiddleware, obterHistoricoLead);

// ============================================
// ROTAS DE AUTOMAÇÃO
// ============================================

/**
 * @route   POST /api/followup/processar
 * @desc    Processar envios programados (chamado por cron job)
 * @access  Private
 */
router.post('/processar', authMiddleware, processarEnviosProgramados);

// ============================================
// ROTAS DE ESTATÍSTICAS
// ============================================

/**
 * @route   GET /api/followup/estatisticas
 * @desc    Obter estatísticas das sequências
 * @access  Private
 */
router.get('/estatisticas', authMiddleware, obterEstatisticas);

/**
 * @route   GET /api/followup/proximos-envios
 * @desc    Obter próximos envios programados
 * @access  Private
 */
router.get('/proximos-envios', authMiddleware, obterProximosEnvios);

export default router;
