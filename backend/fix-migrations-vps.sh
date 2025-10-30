#!/bin/bash

echo "🔧 Organizando arquivos de migrations..."
echo ""

# Criar pasta para scripts manuais
mkdir -p scripts-manuais

# Mover arquivo que não deve ser executado automaticamente
echo "📝 Movendo LIMPAR-DUPLICATAS-MANUALMENTE.sql..."
mv migrations/LIMPAR-DUPLICATAS-MANUALMENTE.sql scripts-manuais/ 2>/dev/null || true

echo ""
echo "✅ Migrations organizadas!"
echo ""
echo "Arquivo movido para: scripts-manuais/LIMPAR-DUPLICATAS-MANUALMENTE.sql"
echo ""
