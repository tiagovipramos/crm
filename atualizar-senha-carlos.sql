-- Atualizar senha do usuário carlos@protecar.com
-- Hash bcrypt da senha "123456": $2b$10$NTviDX5.40LC.qBOmdCAzeAnT1bV2ugxUPsuPTPQBDHrmAk4LWYsi

USE crm;

-- Atualizar senha e garantir que usuário está ativo
UPDATE usuarios 
SET senha = '$2b$10$NTviDX5.40LC.qBOmdCAzeAnT1bV2ugxUPsuPTPQBDHrmAk4LWYsi', 
    ativo = 1 
WHERE email = 'carlos@protecar.com';

-- Verificar o resultado
SELECT id, nome, email, tipo, ativo, 
       SUBSTRING(senha, 1, 20) as senha_inicio,
       created_at, updated_at
FROM usuarios 
WHERE email = 'carlos@protecar.com';

-- Verificar se existe na tabela consultores
SELECT id, nome, email, usuario_id, ativo
FROM consultores 
WHERE email = 'carlos@protecar.com';
