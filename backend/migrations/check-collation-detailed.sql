-- Verificar collations das colunas críticas
SELECT 
    TABLE_NAME, 
    COLUMN_NAME, 
    COLLATION_NAME,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'protecar_crm' 
AND COLUMN_NAME IN ('id', 'indicador_id', 'lead_id', 'consultor_id')
ORDER BY TABLE_NAME, COLUMN_NAME;
