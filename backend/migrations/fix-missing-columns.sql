-- Fix missing columns in consultores table
ALTER TABLE consultores 
ADD COLUMN IF NOT EXISTS sistema_online BOOLEAN DEFAULT FALSE;

-- Fix missing columns in indicadores table
ALTER TABLE indicadores 
ADD COLUMN IF NOT EXISTS cpf VARCHAR(14) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS saldo_disponivel DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS saldo_bloqueado DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS saldo_perdido DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_indicacoes INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS indicacoes_respondidas INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS indicacoes_convertidas INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add foreign key for created_by if not exists
ALTER TABLE indicadores
ADD CONSTRAINT IF NOT EXISTS fk_indicador_created_by 
FOREIGN KEY (created_by) REFERENCES consultores(id) ON DELETE SET NULL;
