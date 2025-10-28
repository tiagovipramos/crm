-- Script para remover tabelas de campanhas de envio em massa

-- Remover tabela de logs primeiro (devido à chave estrangeira)
DROP TABLE IF EXISTS campanhas_envio_logs;

-- Remover tabela de campanhas
DROP TABLE IF EXISTS campanhas_envio;

-- Confirmar remoção
SELECT 'Tabelas de campanhas removidas com sucesso!' AS status;
