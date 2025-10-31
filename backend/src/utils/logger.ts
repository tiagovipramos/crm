/**
 * ✅ Bug #17: Sistema de logging que só mostra em desenvolvimento
 * Em produção, apenas erros críticos são logados
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Log de informação - apenas em desenvolvimento
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Log de sucesso - apenas em desenvolvimento
   */
  success: (...args: any[]) => {
    if (isDevelopment) {
      console.log('✅', ...args);
    }
  },

  /**
   * Log de warning - sempre mostra
   */
  warn: (...args: any[]) => {
    console.warn('⚠️', ...args);
  },

  /**
   * Log de erro - sempre mostra
   */
  error: (...args: any[]) => {
    console.error('❌', ...args);
  },

  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  }
};
