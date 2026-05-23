# Free port 8011 on Windows (run in PowerShell as needed)
$conn = Get-NetTCPConnection -LocalPort 8011 -ErrorAction SilentlyContinue
if (-not $conn) {
  Write-Host "Port 8011 is free."
  exit 0
}
$processIds = $conn.OwningProcess | Sort-Object -Unique
foreach ($processId in $processIds) {
  Write-Host "Stopping PID $processId on port 8011..."
  Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
}
Write-Host "Done."
