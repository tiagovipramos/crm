-- ============================================
-- Migração: Correção de Cadastro de Usuários Admin v2
-- Data: 2025-11-01
-- Descrição: Adiciona colunas faltantes e tabelas necessárias
-- ============================================

SET @OLD_SQL_SAFE_UPDATES = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 1;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 1. ADICIONAR COLUNA created_by NA TABELA consultores
-- ============================================
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'consultores' 
    AND COLUMN_NAME = 'created_by'
);

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE consultores ADD COLUMN created_by VARCHAR(36) NULL COMMENT \'ID do usuário que criou este registro\', ADD INDEX idx_created_by (created_by)',
    'SELECT "Coluna consultores.created_by já existe" as msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. ADICIONAR COLUNAS FALTANTES NA TABELA indicadores
-- ============================================
-- Adicionar cpf
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'indicadores' 
    AND COLUMN_NAME = 'cpf'
);

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE indicadores ADD COLUMN cpf VARCHAR(20) NULL COMMENT \'Alias para cpf_cnpj\'',
    'SELECT "Coluna indicadores.cpf já existe" as msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Copiar dados de cpf_cnpj para cpf
UPDATE indicadores SET cpf = cpf_cnpj WHERE cpf IS NULL AND cpf_cnpj IS NOT NULL;

-- Adicionar saldo_disponivel
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'indicadores' AND COLUMN_NAME = 'saldo_disponivel');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE indicadores ADD COLUMN saldo_disponivel DECIMAL(10,2) DEFAULT 0.00 COMMENT \'Saldo disponível para saque\'', 'SELECT "Coluna indicadores.saldo_disponivel já existe" as msg');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Adicionar saldo_bloqueado
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'indicadores' AND COLUMN_NAME = 'saldo_bloqueado');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE indicadores ADD COLUMN saldo_bloqueado DECIMAL(10,2) DEFAULT 0.00 COMMENT \'Saldo em análise/bloqueado\'', 'SELECT "Coluna indicadores.saldo_bloqueado já existe" as msg');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Adicionar saldo_perdido
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'indicadores' AND COLUMN_NAME = 'saldo_perdido');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE indicadores ADD COLUMN saldo_perdido DECIMAL(10,2) DEFAULT 0.00 COMMENT \'Saldo perdido\'', 'SELECT "Coluna indicadores.saldo_perdido já existe" as msg');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Adicionar total_indicacoes
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'indicadores' AND COLUMN_NAME = 'total_indicacoes');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE indicadores ADD COLUMN total_indicacoes INT DEFAULT 0 COMMENT \'Total de indicações feitas\'', 'SELECT "Coluna indicadores.total_indicacoes já existe" as msg');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Adicionar indicacoes_respondidas
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'indicadores' AND COLUMN_NAME = 'indicacoes_respondidas');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE indicadores ADD COLUMN indicacoes_respondidas INT DEFAULT 0 COMMENT \'Indicações com resposta\'', 'SELECT "Coluna indicadores.indicacoes_respondidas já existe" as msg');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Adicionar indicacoes_convertidas
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'indicadores' AND COLUMN_NAME = 'indicacoes_convertidas');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE indicadores ADD COLUMN indicacoes_convertidas INT DEFAULT 0 COMMENT \'Indicações convertidas em vendas\'', 'SELECT "Coluna indicadores.indicacoes_convertidas já existe" as msg');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Adicionar created_by em indicadores
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'indicadores' AND COLUMN_NAME = 'created_by');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE indicadores ADD COLUMN created_by VARCHAR(36) NULL COMMENT \'ID do usuário que criou este registro\', ADD INDEX idx_indicadores_created_by (created_by)', 'SELECT "Coluna indicadores.created_by já existe" as msg');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Migrar dados existentes
UPDATE indicadores 
SET 
    saldo_disponivel = COALESCE(saldo_atual, 0),
    total_indicacoes = COALESCE(total_leads, 0),
    indicacoes_convertidas = COALESCE(leads_convertidos, 0)
WHERE saldo_disponivel = 0 OR total_indicacoes = 0;

-- ============================================
-- 3. CRIAR TABELA saques_indicador
-- ============================================
CREATE TABLE IF NOT EXISTS saques_indicador (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    indicador_id VARCHAR(36) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    status ENUM('solicitado', 'aprovado', 'pago', 'rejeitado') DEFAULT 'solicitado',
    metodo_pagamento VARCHAR(50) NULL COMMENT 'pix, transferencia, etc',
    chave_pix VARCHAR(255) NULL,
    banco VARCHAR(100) NULL,
    agencia VARCHAR(20) NULL,
    conta VARCHAR(30) NULL,
    comprovante TEXT NULL COMMENT 'URL ou dados do comprovante',
    observacao TEXT NULL,
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_aprovacao TIMESTAMP NULL,
    data_pagamento TIMESTAMP NULL,
    aprovado_por VARCHAR(36) NULL COMMENT 'ID do admin que aprovou',
    pago_por VARCHAR(36) NULL COMMENT 'ID do admin que marcou como pago',
    
    FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE,
    INDEX idx_indicador (indicador_id),
    INDEX idx_status (status),
    INDEX idx_data_solicitacao (data_solicitacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Registros de saques solicitados por indicadores';

-- ============================================
-- 4. CRIAR TABELA transacoes_indicador
-- ============================================
CREATE TABLE IF NOT EXISTS transacoes_indicador (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    indicador_id VARCHAR(36) NOT NULL,
    tipo ENUM('credito', 'debito', 'estorno', 'bonus') NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    descricao TEXT NULL,
    lead_id VARCHAR(36) NULL COMMENT 'Referência ao lead se aplicável',
    saque_id VARCHAR(36) NULL COMMENT 'Referência ao saque se aplicável',
    saldo_anterior DECIMAL(10,2) DEFAULT 0.00,
    saldo_novo DECIMAL(10,2) DEFAULT 0.00,
    data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por VARCHAR(36) NULL,
    
    FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE,
    INDEX idx_indicador_transacao (indicador_id),
    INDEX idx_tipo (tipo),
    INDEX idx_data (data_transacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Histórico de transações financeiras dos indicadores';

-- ============================================
-- 5. ADICIONAR FOREIGN KEYS
-- ============================================
SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'consultores'
    AND CONSTRAINT_NAME = 'fk_consultores_created_by'
);

SET @sql = IF(@constraint_exists = 0, 
    'ALTER TABLE consultores ADD CONSTRAINT fk_consultores_created_by FOREIGN KEY (created_by) REFERENCES consultores(id) ON DELETE SET NULL',
    'SELECT "FK consultores.created_by já existe" as msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'indicadores'
    AND CONSTRAINT_NAME = 'fk_indicadores_created_by'
);

SET @sql = IF(@constraint_exists = 0, 
    'ALTER TABLE indicadores ADD CONSTRAINT fk_indicadores_created_by FOREIGN KEY (created_by) REFERENCES consultores(id) ON DELETE SET NULL',
    'SELECT "FK indicadores.created_by já existe" as msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 6. VALIDAÇÕES
-- ============================================
SELECT 'VALIDAÇÃO DA MIGRAÇÃO' as tipo;
SELECT '========================' as separador;

SELECT 
    'consultores.created_by' as coluna,
    CASE WHEN COUNT(*) > 0 THEN '✓ OK' ELSE '✗ FALHOU' END as status
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'consultores'
AND COLUMN_NAME = 'created_by';

SELECT 
    'indicadores.cpf' as coluna,
    CASE WHEN COUNT(*) > 0 THEN '✓ OK' ELSE '✗ FALHOU' END as status
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'indicadores'
AND COLUMN_NAME = 'cpf';

SELECT 
    'indicadores.saldo_disponivel' as coluna,
    CASE WHEN COUNT(*) > 0 THEN '✓ OK' ELSE '✗ FALHOU' END as status
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'indicadores'
AND COLUMN_NAME = 'saldo_disponivel';

SELECT 
    'saques_indicador (tabela)' as item,
    CASE WHEN COUNT(*) > 0 THEN '✓ OK' ELSE '✗ FALHOU' END as status
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'saques_indicador';

SELECT 
    'transacoes_indicador (tabela)' as item,
    CASE WHEN COUNT(*) > 0 THEN '✓ OK' ELSE '✗ FALHOU' END as status
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'transacoes_indicador';

-- Restaurar configurações
SET SQL_SAFE_UPDATES = @OLD_SQL_SAFE_UPDATES;

SELECT 'MIGRAÇÃO CONCLUÍDA COM SUCESSO!' as resultado;
