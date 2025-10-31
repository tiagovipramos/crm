-- Fix database schema - Adicionar colunas faltantes e criar tabelas necessárias
USE protecar_crm;

-- Adicionar colunas faltantes em consultores
ALTER TABLE consultores 
ADD COLUMN IF NOT EXISTS numero_whatsapp VARCHAR(20) NULL AFTER telefone,
ADD COLUMN IF NOT EXISTS session_data TEXT NULL AFTER sessao_whatsapp,
ADD COLUMN IF NOT EXISTS ativo TINYINT(1) DEFAULT 1 AFTER sistema_online;

-- Criar tabela indicadores se não existir
CREATE TABLE IF NOT EXISTS indicadores (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    cpf_cnpj VARCHAR(20),
    endereco TEXT,
    banco VARCHAR(100),
    agencia VARCHAR(20),
    conta VARCHAR(30),
    pix VARCHAR(100),
    saldo_atual DECIMAL(10,2) DEFAULT 0.00,
    saldo_receber DECIMAL(10,2) DEFAULT 0.00,
    total_ganho DECIMAL(10,2) DEFAULT 0.00,
    total_leads INT DEFAULT 0,
    leads_convertidos INT DEFAULT 0,
    ativo TINYINT(1) DEFAULT 1,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acesso TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela administradores se não existir
CREATE TABLE IF NOT EXISTS administradores (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    nivel_acesso VARCHAR(20) DEFAULT 'admin',
    ativo TINYINT(1) DEFAULT 1,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acesso TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir admin padrão se não existir
INSERT IGNORE INTO administradores (nome, email, senha, nivel_acesso)
VALUES ('Administrador', 'admin@protecar.com', '$2b$10$YourHashedPasswordHere', 'super_admin');

-- Criar tabela followup_historico se não existir
CREATE TABLE IF NOT EXISTS followup_historico (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    lead_id VARCHAR(36) NOT NULL,
    consultor_id VARCHAR(36) NOT NULL,
    tipo_followup VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    mensagem TEXT,
    data_agendada DATETIME NOT NULL,
    data_enviada DATETIME NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (consultor_id) REFERENCES consultores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela followup_config se não existir
CREATE TABLE IF NOT EXISTS followup_config (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    consultor_id VARCHAR(36) NOT NULL,
    tipo_followup VARCHAR(50) NOT NULL,
    dias_apos INT NOT NULL,
    hora_envio TIME NOT NULL,
    template_mensagem TEXT NOT NULL,
    ativo TINYINT(1) DEFAULT 1,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultor_id) REFERENCES consultores(id) ON DELETE CASCADE,
    UNIQUE KEY unique_consultor_tipo (consultor_id, tipo_followup)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verificar se a coluna indicador_id existe em leads
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'protecar_crm' 
AND TABLE_NAME = 'leads' 
AND COLUMN_NAME = 'indicador_id';

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE leads ADD COLUMN indicador_id VARCHAR(36) NULL AFTER consultor_id, ADD FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE SET NULL',
    'SELECT "Coluna indicador_id já existe"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar se a coluna comissao_indicador existe em leads
SELECT COUNT(*) INTO @col_exists2 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'protecar_crm' 
AND TABLE_NAME = 'leads' 
AND COLUMN_NAME = 'comissao_indicador';

SET @sql2 = IF(@col_exists2 = 0,
    'ALTER TABLE leads ADD COLUMN comissao_indicador DECIMAL(10,2) DEFAULT 0.00 AFTER indicador_id',
    'SELECT "Coluna comissao_indicador já existe"');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Atualizar senha do admin para 123456
UPDATE administradores 
SET senha = '$2b$10$rVZGJgqY5o.DQ8LKGxXzJOKN5FpP0q0xK6V1K5Z3YMb0X3KmqF8m2'
WHERE email = 'admin@protecar.com';

SELECT 'Database fix completed successfully!' as result;
