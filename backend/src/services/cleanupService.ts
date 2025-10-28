import * as fs from 'fs';
import * as path from 'path';

/**
 * Serviço de limpeza automática de arquivos antigos
 * Remove arquivos de mídia mais antigos que X dias
 */
class CleanupService {
  private uploadPath = path.join(process.cwd(), 'uploads');
  private diasParaManterArquivos = 90; // Manter arquivos por 90 dias (3 meses)

  /**
   * Configura quantos dias manter os arquivos
   */
  setDiasRetencao(dias: number) {
    this.diasParaManterArquivos = dias;
    console.log(`🗑️ Retenção de arquivos configurada para ${dias} dias`);
  }

  /**
   * Limpa arquivos antigos de todas as pastas de upload
   */
  async limparArquivosAntigos(): Promise<{
    totalArquivos: number;
    arquivosDeletados: number;
    espacoLiberado: number;
  }> {
    console.log('🧹 Iniciando limpeza de arquivos antigos...');
    
    let totalArquivos = 0;
    let arquivosDeletados = 0;
    let espacoLiberado = 0;

    const pastas = ['images', 'videos', 'audios', 'documents'];
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - this.diasParaManterArquivos);

    for (const pasta of pastas) {
      const pastaPath = path.join(this.uploadPath, pasta);
      
      if (!fs.existsSync(pastaPath)) continue;

      const arquivos = fs.readdirSync(pastaPath);
      totalArquivos += arquivos.length;

      for (const arquivo of arquivos) {
        const arquivoPath = path.join(pastaPath, arquivo);
        const stats = fs.statSync(arquivoPath);
        
        // Verificar se arquivo é mais antigo que o limite
        if (stats.mtime < dataLimite) {
          const tamanho = stats.size;
          fs.unlinkSync(arquivoPath);
          arquivosDeletados++;
          espacoLiberado += tamanho;
          console.log(`🗑️ Deletado: ${pasta}/${arquivo} (${this.formatarTamanho(tamanho)})`);
        }
      }
    }

    console.log('✅ Limpeza concluída:');
    console.log(`   📁 Total de arquivos: ${totalArquivos}`);
    console.log(`   🗑️ Arquivos deletados: ${arquivosDeletados}`);
    console.log(`   💾 Espaço liberado: ${this.formatarTamanho(espacoLiberado)}`);

    return { totalArquivos, arquivosDeletados, espacoLiberado };
  }

  /**
   * Obtém estatísticas de uso de espaço
   */
  async obterEstatisticas(): Promise<{
    totalArquivos: number;
    espacoUsado: number;
    porPasta: Record<string, { arquivos: number; tamanho: number }>;
  }> {
    const stats = {
      totalArquivos: 0,
      espacoUsado: 0,
      porPasta: {} as Record<string, { arquivos: number; tamanho: number }>
    };

    const pastas = ['images', 'videos', 'audios', 'documents'];

    for (const pasta of pastas) {
      const pastaPath = path.join(this.uploadPath, pasta);
      
      if (!fs.existsSync(pastaPath)) {
        stats.porPasta[pasta] = { arquivos: 0, tamanho: 0 };
        continue;
      }

      const arquivos = fs.readdirSync(pastaPath);
      let tamanhoTotal = 0;

      for (const arquivo of arquivos) {
        const arquivoPath = path.join(pastaPath, arquivo);
        const fileStat = fs.statSync(arquivoPath);
        tamanhoTotal += fileStat.size;
      }

      stats.porPasta[pasta] = {
        arquivos: arquivos.length,
        tamanho: tamanhoTotal
      };

      stats.totalArquivos += arquivos.length;
      stats.espacoUsado += tamanhoTotal;
    }

    return stats;
  }

  /**
   * Inicia limpeza automática agendada
   */
  iniciarLimpezaAutomatica() {
    // Executar limpeza a cada 24 horas (1 dia)
    const INTERVALO_24H = 24 * 60 * 60 * 1000;

    // Primeira limpeza após 1 hora do servidor iniciar
    setTimeout(() => {
      this.limparArquivosAntigos().catch(err => {
        console.error('❌ Erro na limpeza automática:', err);
      });
    }, 60 * 60 * 1000); // 1 hora

    // Limpezas subsequentes a cada 24 horas
    setInterval(() => {
      this.limparArquivosAntigos().catch(err => {
        console.error('❌ Erro na limpeza automática:', err);
      });
    }, INTERVALO_24H);

    console.log(`🤖 Limpeza automática ativada (a cada 24h, mantém ${this.diasParaManterArquivos} dias)`);
  }

  /**
   * Formata tamanho em bytes para formato legível
   */
  private formatarTamanho(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const tamanhos = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + tamanhos[i];
  }
}

export const cleanupService = new CleanupService();
