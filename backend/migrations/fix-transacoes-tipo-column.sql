-- Migration: Aumentar tamanho da coluna 'tipo' na tabela transacoes_indicador
-- Motivo: Coluna atual não comporta valores como 'bloqueio' e 'lootbox_vendas'
-- Data: 2025-01-11
-- Autor: Sistema

-- Aumentar coluna 'tipo' para suportar todos os valores possíveis
ALTER TABLE transacoes_indicador 
MODIFY COLUMN tipo VARCHAR(50) NOT NULL;
