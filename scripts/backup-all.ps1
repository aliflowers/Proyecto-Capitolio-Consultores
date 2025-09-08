$ErrorActionPreference = "Stop"

& "$PSScriptRoot/backup-repo.ps1" | Out-Null
& "$PSScriptRoot/backup-db.ps1" | Out-Null

Write-Host "[backup:all] Repository and database backups completed."
