-- Adicionar coluna role na tabela consultores
ALTER TABLE consultores ADD COLUMN role VARCHAR(20) DEFAULT 'vendedor';

-- Atualizar usuários existentes baseado no email
UPDATE consultores SET role = 'diretor' WHERE email LIKE '%diretor%' OR email LIKE '%admin%';
UPDATE consultores SET role = 'gerente' WHERE email LIKE '%gerente%';
UPDATE consultores SET role = 'supervisor' WHERE email LIKE '%supervisor%';

-- Se não foi atualizado, deixa como vendedor
UPDATE consultores SET role = 'vendedor' WHERE role IS NULL OR role = '';
