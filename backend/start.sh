#!/bin/sh
# ✅ Bug #19: Script de inicialização com validação de migrations

echo "🚀 Iniciando aplicação..."
echo ""

# Migrations são opcionais - apenas executar se schema existir
if [ -f "schema-mysql.sql" ] && [ -f "dist/setup-database.js" ]; then
  echo "📊 Executando migrations do banco de dados..."
  node dist/setup-database.js
  
  MIGRATION_EXIT_CODE=$?
  
  if [ $MIGRATION_EXIT_CODE -ne 0 ]; then
    echo ""
    echo "⚠️  Aviso: Migrations falharam, mas continuando inicialização..."
    echo "⚠️  O banco pode já estar configurado ou será configurado manualmente."
    echo ""
  else
    echo ""
    echo "✅ Migrations executadas com sucesso!"
    echo ""
  fi
else
  echo "⚠️  Schema não encontrado - assumindo que banco já está configurado."
  echo ""
fi

# Iniciar aplicação
echo "🎯 Iniciando servidor..."
exec npm start
