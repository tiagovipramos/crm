-- Adicionar coluna avatar na tabela indicadores
ALTER TABLE indicadores ADD COLUMN avatar LONGTEXT NULL;

-- Comentário da coluna
ALTER TABLE indicadores MODIFY COLUMN avatar LONGTEXT NULL COMMENT 'Foto de perfil do indicador em base64';
