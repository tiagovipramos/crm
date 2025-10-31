#!/bin/sh
# ✅ Bug #19: Script de inicialização com validação de migrations

echo "🚀 Iniciando aplicação..."
echo ""

# Executar migrations se existir o script
if [ -f "dist/setup-database.js" ]; then
  echo "📊 Executando migrations do banco de dados..."
  node dist/setup-database.js
  
  MIGRATION_EXIT_CODE=$?
  
  if [ $MIGRATION_EXIT_CODE -ne 0 ]; then
    echo ""
    echo "❌ ERRO: Migrations falharam com código de saída $MIGRATION_EXIT_CODE"
    echo "❌ A aplicação NÃO será iniciada até que as migrations sejam corrigidas."
    echo ""
    exit 1
  fi
  
  echo ""
  echo "✅ Migrations executadas com sucesso!"
  echo ""
else
  echo "⚠️  Aviso: Script de migrations não encontrado, pulando..."
  echo ""
fi

# Iniciar aplicação
echo "🎯 Iniciando servidor..."
exec npm start
