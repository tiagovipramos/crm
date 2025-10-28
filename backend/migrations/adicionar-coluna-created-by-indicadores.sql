-- =========================================
-- ADICIONAR COLUNA created_by NA TABELA indicadores
-- =========================================

-- Adicionar coluna created_by para rastrear quem criou o indicador
ALTER TABLE indicadores 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL,
ADD CONSTRAINT fk_indicadores_created_by 
FOREIGN KEY (created_by) REFERENCES consultores(id) ON DELETE SET NULL;

-- Verificar a alteração
SELECT 'Coluna created_by adicionada na tabela indicadores' AS status;
