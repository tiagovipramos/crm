import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { cleanupService } from '../services/cleanupService';

const router = Router();

/**
 * GET /api/storage/stats
 * Retorna estatísticas de uso de espaço
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await cleanupService.obterEstatisticas();
    
    // Formatar resposta
    const response = {
      resumo: {
        totalArquivos: stats.totalArquivos,
        espacoUsadoBytes: stats.espacoUsado,
        espacoUsadoMB: Math.round(stats.espacoUsado / 1024 / 1024 * 100) / 100,
        espacoUsadoGB: Math.round(stats.espacoUsado / 1024 / 1024 / 1024 * 100) / 100
      },
      porPasta: {
        imagens: {
          arquivos: stats.porPasta.images?.arquivos || 0,
          tamanhoMB: Math.round((stats.porPasta.images?.tamanho || 0) / 1024 / 1024 * 100) / 100
        },
        videos: {
          arquivos: stats.porPasta.videos?.arquivos || 0,
          tamanhoMB: Math.round((stats.porPasta.videos?.tamanho || 0) / 1024 / 1024 * 100) / 100
        },
        audios: {
          arquivos: stats.porPasta.audios?.arquivos || 0,
          tamanhoMB: Math.round((stats.porPasta.audios?.tamanho || 0) / 1024 / 1024 * 100) / 100
        },
        documentos: {
          arquivos: stats.porPasta.documents?.arquivos || 0,
          tamanhoMB: Math.round((stats.porPasta.documents?.tamanho || 0) / 1024 / 1024 * 100) / 100
        }
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas de armazenamento' });
  }
});

/**
 * POST /api/storage/cleanup
 * Executa limpeza manual de arquivos antigos
 */
router.post('/cleanup', authMiddleware, async (req, res) => {
  try {
    console.log('🧹 Limpeza manual iniciada pelo usuário:', req.user?.id);
    const result = await cleanupService.limparArquivosAntigos();
    
    const response = {
      sucesso: true,
      estatisticas: {
        totalArquivos: result.totalArquivos,
        arquivosDeletados: result.arquivosDeletados,
        espacoLiberadoMB: Math.round(result.espacoLiberado / 1024 / 1024 * 100) / 100,
        espacoLiberadoGB: Math.round(result.espacoLiberado / 1024 / 1024 / 1024 * 100) / 100
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Erro ao executar limpeza:', error);
    res.status(500).json({ error: 'Erro ao executar limpeza de arquivos' });
  }
});

export default router;
