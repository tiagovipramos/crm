-- ============================================
-- CORRIGIR CHARSET PARA UTF8MB4
-- Permite uso correto de emojis na tabela de prêmios
-- ============================================

-- Alterar charset da tabela lootbox_premios
ALTER TABLE lootbox_premios CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Alterar charset da coluna emoji especificamente
ALTER TABLE lootbox_premios MODIFY COLUMN emoji VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- Deletar registros antigos com encoding errado
DELETE FROM lootbox_premios;

-- Reinserir prêmios com emojis corretos
INSERT INTO lootbox_premios (valor, tipo, peso, cor_hex, emoji) VALUES
(5.00, 'comum', 40, '#10B981', '💵'),
(10.00, 'comum', 30, '#3B82F6', '💰'),
(50.00, 'raro', 20, '#8B5CF6', '💎'),
(75.00, 'epico', 7, '#F59E0B', '🏆'),
(100.00, 'lendario', 3, '#EF4444', '👑');
