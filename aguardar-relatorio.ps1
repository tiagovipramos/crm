# Aguarda e exibe o relatório do agente quando estiver pronto
$contador = 0
$maxTentativas = 20

Write-Host "`n🤖 Aguardando conclusão do Agente DevOps Autônomo..." -ForegroundColor Cyan
Write-Host "Verificando a cada 10 segundos (máximo 200s)`n" -ForegroundColor Yellow

while ($contador -lt $maxTentativas) {
    if (Test-Path "RELATORIO-AGENTE-AUTONOMO.md") {
        Write-Host "✅ RELATÓRIO ENCONTRADO!" -ForegroundColor Green
        Write-Host "`n" + "="*70 -ForegroundColor Magenta
        Write-Host " RELATÓRIO DO AGENTE DEVOPS AUTÔNOMO" -ForegroundColor Magenta
        Write-Host "="*70 + "`n" -ForegroundColor Magenta
        
        Get-Content "RELATORIO-AGENTE-AUTONOMO.md"
        
        Write-Host "`n" + "="*70 -ForegroundColor Green
        Write-Host " ✅ AGENTE CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
        Write-Host "="*70 + "`n" -ForegroundColor Green
        exit 0
    }
    
    $contador++
    $tentativasRestantes = $maxTentativas - $contador
    Write-Host "[Tentativa $contador/$maxTentativas] Aguardando... ($tentativasRestantes restantes)" -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

Write-Host "`n⚠️  Tempo limite excedido. Verificando processo do agente..." -ForegroundColor Yellow
$nodeProcess = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcess) {
    Write-Host "✓ Agente ainda está executando (PID: $($nodeProcess.Id))" -ForegroundColor Cyan
} else {
    Write-Host "✗ Processo do agente não encontrado" -ForegroundColor Red
}
