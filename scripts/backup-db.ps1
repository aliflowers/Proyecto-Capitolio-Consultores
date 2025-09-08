$ErrorActionPreference = "Stop"

$stamp = (Get-Date -Format "yyyyMMdd_HHmmss")
$backupDir = Resolve-Path -Path (Join-Path $PSScriptRoot "../db-backups")
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }

$container = "nexus-postgres"
$dbname = "nexus_juridico"
$user = "nexus_admin"
$tempFile = "/tmp/db_$stamp.dump"
$localFile = Join-Path $backupDir "db_$stamp.dump"

Write-Host "[backup:db] Creating database dump..."

# Create dump inside container
docker exec $container pg_dump -U $user -d $dbname -Fc -f $tempFile

# Copy to local
docker cp "$container:$tempFile" "$localFile"

# Clean temp inside container
docker exec $container rm -f $tempFile

Write-Host "[backup:db] Dump saved to $localFile"

