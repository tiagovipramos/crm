import cron from 'node-cron';
import axios from 'axios';

/**
 * Serviço de agendamento para processar follow-ups automaticamente
 */
class FollowUpScheduler {
  private cronJob: cron.ScheduledTask | null = null;
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.API_URL || 'http://localhost:3001';
  }

  /**
   * Iniciar o scheduler
   * Executa a cada 15 minutos
   */
  start() {
    if (this.cronJob) {
      console.log('⚠️  Scheduler de Follow-Up já está rodando');
      return;
    }

    // Executar a cada 15 minutos: */15 * * * *
    // Para testes, pode usar: * * * * * (a cada minuto)
    this.cronJob = cron.schedule('*/15 * * * *', async () => {
      await this.processarEnvios();
    });

    console.log('✅ Scheduler de Follow-Up iniciado - Executa a cada 15 minutos');
    
    // Executar uma vez ao iniciar (após 30 segundos)
    setTimeout(() => {
      this.processarEnvios();
    }, 30000);
  }

  /**
   * Parar o scheduler
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('🛑 Scheduler de Follow-Up parado');
    }
  }

  /**
   * Processar envios programados
   */
  private async processarEnvios() {
    try {
      console.log('⏰ [CRON] Executando processamento de follow-ups...');
      
      // Como não temos token aqui, vamos chamar diretamente o controller
      // através de uma requisição interna
      const response = await axios.post(
        `${this.apiUrl}/api/followup/processar`,
        {},
        {
          headers: {
            'X-Internal-Request': 'scheduler'
          },
          timeout: 60000 // 60 segundos
        }
      );

      console.log(`✅ [CRON] Follow-ups processados:`, response.data);
    } catch (error: any) {
      if (error.response) {
        console.error('❌ [CRON] Erro ao processar follow-ups:', error.response.data);
      } else if (error.request) {
        console.error('❌ [CRON] Servidor não respondeu');
      } else {
        console.error('❌ [CRON] Erro:', error.message);
      }
    }
  }

  /**
   * Processar manualmente (útil para testes)
   */
  async processarManualmente() {
    console.log('🔧 Processamento manual iniciado...');
    await this.processarEnvios();
  }
}

// Exportar instância única (singleton)
export const followUpScheduler = new FollowUpScheduler();
