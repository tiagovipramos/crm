-- Script para corrigir banco de dados e habilitar login
-- Execute: docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < fix-login-database.sql

-- 1. Adicionar coluna role se não existir
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE table_schema = DATABASE() 
               AND table_name = 'consultores' 
               AND column_name = 'role');

SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE consultores ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT ''vendedor'' AFTER senha',
    'SELECT ''Coluna role já existe'' AS Info');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Adicionar coluna ativo se não existir
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE table_schema = DATABASE() 
               AND table_name = 'consultores' 
               AND column_name = 'ativo');

SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE consultores ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1',
    'SELECT ''Coluna ativo já existe'' AS Info');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Adicionar coluna numero_whatsapp se não existir
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE table_schema = DATABASE() 
               AND table_name = 'consultores' 
               AND column_name = 'numero_whatsapp');

SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE consultores ADD COLUMN numero_whatsapp VARCHAR(20) NULL',
    'SELECT ''Coluna numero_whatsapp já existe'' AS Info');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Adicionar coluna avatar se não existir
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE table_schema = DATABASE() 
               AND table_name = 'consultores' 
               AND column_name = 'avatar');

SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE consultores ADD COLUMN avatar VARCHAR(255) NULL',
    'SELECT ''Coluna avatar já existe'' AS Info');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Adicionar coluna sessao_whatsapp se não existir
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE table_schema = DATABASE() 
               AND table_name = 'consultores' 
               AND column_name = 'sessao_whatsapp');

SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE consultores ADD COLUMN sessao_whatsapp VARCHAR(100) NULL',
    'SELECT ''Coluna sessao_whatsapp já existe'' AS Info');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. Adicionar coluna status_conexao se não existir
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE table_schema = DATABASE() 
               AND table_name = 'consultores' 
               AND column_name = 'status_conexao');

SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE consultores ADD COLUMN status_conexao VARCHAR(20) DEFAULT ''desconectado''',
    'SELECT ''Coluna status_conexao já existe'' AS Info');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 7. Adicionar coluna created_by se não existir
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE table_schema = DATABASE() 
               AND table_name = 'consultores' 
               AND column_name = 'created_by');

SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE consultores ADD COLUMN created_by VARCHAR(36) NULL',
    'SELECT ''Coluna created_by já existe'' AS Info');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 8. Verificar se existe algum consultor
SELECT 'Verificando consultores existentes...' AS Info;
SELECT id, nome, email, role, ativo FROM consultores;

-- 9. Se existe pelo menos um consultor, transformar o primeiro em diretor
UPDATE consultores 
SET role = 'diretor', ativo = 1 
WHERE id = (SELECT MIN(id) FROM (SELECT id FROM consultores) AS temp);

-- 10. Se não existe nenhum consultor, criar um admin padrão
INSERT INTO consultores (nome, email, senha, role, ativo, meta_mensal, tipo_comissao, comissao_fixa, comissao_minima, comissao_maxima)
SELECT 'Diretor', 'diretor@protecar.com', '$2a$10$YourHashedPasswordHere', 'diretor', 1, 0, 'fixa', 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM consultores WHERE email = 'diretor@protecar.com');

-- 11. Ativar todos os consultores
UPDATE consultores SET ativo = 1 WHERE ativo = 0 OR ativo IS NULL;

-- 12. Mostrar resultado final
SELECT 'Resultado final:' AS Info;
SELECT id, nome, email, role, ativo FROM consultores ORDER BY id;

-- 13. Mostrar especificamente o admin
SELECT 'Usuário Admin:' AS Info;
SELECT id, nome, email, role, ativo FROM consultores WHERE role = 'diretor';
