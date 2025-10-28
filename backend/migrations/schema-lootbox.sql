-- ============================================
-- SCHEMA LOOT BOX / CAIXA MISTERIOSA
-- Sistema de gamificação para indicadores
-- ============================================

-- Tabela de histórico de loot boxes
CREATE TABLE IF NOT EXISTS lootbox_historico (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  indicador_id VARCHAR(36) NOT NULL,
  premio_valor DECIMAL(10, 2) NOT NULL,
  premio_tipo VARCHAR(50) NOT NULL, -- 'comum', 'raro', 'epico', 'lendario'
  leads_acumulados INT NOT NULL, -- Quantidade de leads quando abriu
  data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  compartilhado BOOLEAN DEFAULT FALSE,
  data_compartilhamento TIMESTAMP NULL,
  FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE,
  INDEX idx_indicador (indicador_id),
  INDEX idx_data (data_abertura)
);

-- Adicionar coluna para controlar leads acumulados para próxima caixa
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS leads_para_proxima_caixa INT DEFAULT 0;
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS total_caixas_abertas INT DEFAULT 0;
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS total_ganho_caixas DECIMAL(10, 2) DEFAULT 0.00;

-- Inserir configuração de prêmios (pode ser ajustado pelo admin)
CREATE TABLE IF NOT EXISTS lootbox_premios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  valor DECIMAL(10, 2) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'comum', 'raro', 'epico', 'lendario'
  peso INT NOT NULL, -- Peso para sorteio (maior = mais comum)
  cor_hex VARCHAR(7) NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir prêmios padrão
INSERT INTO lootbox_premios (valor, tipo, peso, cor_hex, emoji) VALUES
(5.00, 'comum', 40, '#10B981', '💵'),
(10.00, 'comum', 30, '#3B82F6', '💰'),
(50.00, 'raro', 20, '#8B5CF6', '💎'),
(75.00, 'epico', 7, '#F59E0B', '🏆'),
(100.00, 'lendario', 3, '#EF4444', '👑');
