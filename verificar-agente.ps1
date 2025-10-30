# Script para verificar progresso do agente
Write-Host "Aguardando 60 segundos..." -ForegroundColor Cyan
Start-Sleep -Seconds 60

Write-Host "`nVerificando se relatorio foi gerado..." -ForegroundColor Cyan

if (Test-Path "RELATORIO-AGENTE-AUTONOMO.md") {
    Write-Host "✅ Relatorio encontrado! Agente concluiu." -ForegroundColor Green
    Get-Content "RELATORIO-AGENTE-AUTONOMO.md" | Select-Object -First 50
} else {
    Write-Host "⏳ Agente ainda processando... Aguarde mais um momento." -ForegroundColor Yellow
}

Write-Host "`nVerificando processos Node..." -ForegroundColor Cyan
Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, CPU
