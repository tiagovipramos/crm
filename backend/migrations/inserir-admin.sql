-- Inserir usuário admin no banco
USE protecar_crm;

-- Deletar admin se existir
DELETE FROM consultores WHERE email = 'admin@protecar.com';

-- Inserir admin (senha: admin123)
INSERT INTO consultores (id, nome, email, senha, telefone, status_conexao)
VALUES (
  'b9bc4ffc-ade8-11f0-9914-8cb0e93127ca',
  'Administrador',
  'admin@protecar.com',
  '$2a$10$cN6ppacqn0lyZk1ZyYxhBOxD6Ph9h0dytY6lOJ/qjLGzysr7zAW2.',
  '11987654321',
  'offline'
);

SELECT 'Admin inserido com sucesso!' AS status;
SELECT * FROM consultores WHERE email = 'admin@protecar.com';
