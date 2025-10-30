UPDATE usuarios 
SET senha = '$2b$10$AleGEAqjEKHvNQN/3MkSPOyJlM0XoFpII1KHKr.ecmTlmD2EH85z6', 
    ativo = 1 
WHERE email = 'carlos@protecar.com';

SELECT id, nome, email, tipo, ativo, LEFT(senha, 30) as senha_preview 
FROM usuarios 
WHERE email = 'carlos@protecar.com';
