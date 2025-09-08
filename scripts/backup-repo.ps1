param(
  [string]$OutputDir = "../backups"
)

$ErrorActionPreference = "Stop"

$repoRoot = (git rev-parse --show-toplevel)
$absOut = Resolve-Path -Path (Join-Path $PSScriptRoot $OutputDir)
if (-not (Test-Path $absOut)) { New-Item -ItemType Directory -Path $absOut | Out-Null }

$stamp = (Get-Date -Format "yyyyMMdd_HHmmss")
$zipPath = Join-Path $absOut "repo_$stamp.zip"

Write-Host "[backup] Creating repository snapshot at $zipPath"

# Build exclusion list
$excludes = @(".git","node_modules",".next","backups","db-backups")

# Gather all files except exclusions
$items = Get-ChildItem -Path $repoRoot -Recurse -Force | Where-Object {
  foreach ($ex in $excludes) { if ($_.FullName -like (Join-Path $repoRoot $ex + '*')) { return $false } }
  return $true
}

# Compress
Compress-Archive -Path $items.FullName -DestinationPath $zipPath -Force

Write-Host "[backup] Done."

