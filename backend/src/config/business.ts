/**
 * ✅ Bug #18: Configurações de negócio centralizadas
 * Valores que antes estavam hard-coded no código
 */

export const BUSINESS_CONFIG = {
  /**
   * Valor médio de uma venda convertida (em reais)
   * Usado para cálculos de faturamento
   */
  VALOR_MEDIO_VENDA: 2200,

  /**
   * Meta mensal de faturamento (em reais)
   * Usado no dashboard para calcular % de meta atingida
   */
  META_MENSAL_FATURAMENTO: 50000,

  /**
   * Comissão paga ao indicador por lead qualificado (em reais)
   * Valor bloqueado quando lead é criado
   */
  COMISSAO_POR_LEAD: 2.00,

  /**
   * Valor mínimo para solicitar saque (em reais)
   */
  VALOR_MINIMO_SAQUE: 50,

  /**
   * Percentual de comissão por venda convertida
   * Ex: 0.05 = 5% do valor da venda
   */
  PERCENTUAL_COMISSAO_VENDA: 0.05
};

/**
 * Helper para formatar valores monetários
 */
export const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
};
