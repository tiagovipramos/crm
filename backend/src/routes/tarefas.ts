import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getTarefas,
  getTarefasByLead,
  createTarefa,
  completeTarefa,
  deleteTarefa
} from '../controllers/tarefasController';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Listar todas as tarefas do consultor
router.get('/', getTarefas);

// Buscar tarefas por lead
router.get('/lead/:leadId', getTarefasByLead);

// Criar nova tarefa
router.post('/', createTarefa);

// Atualizar tarefa
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Se está marcando como concluída, usar a função específica
    if (status === 'concluida') {
      return completeTarefa(req, res);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
});

// Marcar tarefa como concluída
router.put('/:id/concluir', completeTarefa);

// Deletar tarefa
router.delete('/:id', deleteTarefa);

export default router;
