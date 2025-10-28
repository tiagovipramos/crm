-- Adicionar coluna created_by para rastrear quem criou cada usuário

-- Adicionar coluna created_by na tabela consultores
ALTER TABLE consultores 
ADD COLUMN created_by VARCHAR(36) NULL;

-- Adicionar coluna created_by na tabela indicadores  
ALTER TABLE indicadores 
ADD COLUMN created_by VARCHAR(36) NULL;

-- Criar índices para melhor performance
CREATE INDEX idx_consultores_created_by ON consultores(created_by);
CREATE INDEX idx_indicadores_created_by ON indicadores(created_by);

-- Adicionar foreign keys APÓS criar as colunas
ALTER TABLE consultores 
ADD FOREIGN KEY (created_by) REFERENCES consultores(id) ON DELETE SET NULL;

ALTER TABLE indicadores 
ADD FOREIGN KEY (created_by) REFERENCES consultores(id) ON DELETE SET NULL;

SELECT 'Coluna created_by adicionada com sucesso!' AS status;
