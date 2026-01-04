# Verification script
Write-Host "================================================"
Write-Host "Keystroke Service Integration Verification"
Write-Host "================================================"

Write-Host "`nChecking service files..."
$files = @(
    "services\python\keystroke-service\main.py",
    "services\python\keystroke-service\Dockerfile",
    "infra\docker\docker-compose.yml",
    "services\go\api-gateway\config\config.go",
    "services\go\api-gateway\routes\routes.go"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "[OK] $file" -ForegroundColor Green
    } else {
        Write-Host "[MISSING] $file" -ForegroundColor Red
    }
}

Write-Host "`nIntegration complete! See KEYSTROKE_INTEGRATION_SUMMARY.md for details."
