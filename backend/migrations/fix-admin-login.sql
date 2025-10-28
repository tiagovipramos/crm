-- Script para corrigir o login do admin
-- Execute este script no phpMyAdmin ou MySQL

-- 1. Verificar se o usuário existe
SELECT id, nome, email, role 
FROM consultores 
WHERE email = 'diretor@protecar.com';

-- 2. Se não existir, criar o usuário admin
-- (descomente as linhas abaixo se necessário)
-- INSERT INTO consultores (nome, email, senha, telefone, status_conexao, role)
-- VALUES ('Admin Protecar', 'diretor@protecar.com', '$2a$10$YourHashedPasswordHere', '11999999999', 'offline', 'diretor');

-- 3. Atualizar senha para '123456' (já com hash bcrypt)
-- Hash bcrypt da senha '123456': $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
UPDATE consultores 
SET senha = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    role = 'diretor'
WHERE email = 'diretor@protecar.com';

-- 4. Verificar o resultado
SELECT id, nome, email, role, LENGTH(senha) as senha_length
FROM consultores 
WHERE email = 'diretor@protecar.com';
