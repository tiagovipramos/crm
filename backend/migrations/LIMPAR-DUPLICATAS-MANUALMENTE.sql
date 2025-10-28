-- ==========================================
-- LIMPAR MENSAGENS DUPLICADAS - EXECUTAR NO phpMyAdmin
-- ==========================================

-- 1. Ver quantas duplicatas existem
SELECT 
    conteudo, 
    lead_id, 
    timestamp, 
    COUNT(*) as quantidade
FROM mensagens
WHERE remetente = 'consultor'
GROUP BY conteudo, lead_id, DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i')
HAVING COUNT(*) > 1
ORDER BY timestamp DESC;

-- 2. DELETAR DUPLICATAS (mantém apenas a primeira)
DELETE m1 FROM mensagens m1
INNER JOIN mensagens m2 
WHERE 
    m1.id > m2.id
    AND m1.conteudo = m2.conteudo
    AND m1.lead_id = m2.lead_id
    AND m1.remetente = 'consultor'
    AND ABS(TIMESTAMPDIFF(SECOND, m1.timestamp, m2.timestamp)) < 5;

-- 3. Verificar se limpou
SELECT COUNT(*) as 'Total de mensagens após limpeza' FROM mensagens;
