param(
  [string]$Username = "admin"
)

$ErrorActionPreference = 'Stop'

# 1) Generar token de reanudación (resume) y su hash base64 (sha256)
$nodeCmd = @"
const crypto = require('crypto');
const token = crypto.randomBytes(32).toString('hex');
const hashed = crypto.createHash('sha256').update(token).digest('base64');
console.log(JSON.stringify({ token, hashed }));
"@

$gen = node -e $nodeCmd | ConvertFrom-Json
$token = $gen.token
$hashed = $gen.hashed

Write-Host "Resume token generado (solo se usa para obtener authToken, no lo compartas): $token"

# 2) Crear script de mongosh que inserta el resume token para el admin
$tmpFile = New-TemporaryFile
$js = @'
(function(){
  var u = db.users.findOne({ username: "' + $Username + '" }, { _id: 1 });
  if (!u) { print("admin not found"); quit(2); }
  db.users.updateOne(
    { _id: u._id },
    { $set: { "services.resume.loginTokens": [ { "hashedToken": "' + $hashed + '", "when": new Date() } ] } }
  );
  print("Seeded resume token for user: ' + $Username + '");
})();
'@
Set-Content -Path $tmpFile -Value $js -Encoding UTF8

# 3) Copiar y ejecutar dentro del contenedor de Mongo
& docker cp $tmpFile.FullName nexus-rc-mongo:/tmp/seed-resume.js | Out-Null
& docker exec nexus-rc-mongo mongosh rocketchat --quiet /tmp/seed-resume.js

# 4) Intercambiar resume token por authToken (login API)
$rcUrl = $env:RC_URL
if (-not $rcUrl) { $rcUrl = 'http://localhost:4000' }

$loginResp = curl.exe -s -H "Content-Type: application/json" -X POST -d "{`"resume`":`"$token`"}" "$rcUrl/api/v1/login" | ConvertFrom-Json
if (-not $loginResp -or -not $loginResp.success) {
  Write-Error "Fallo el login por resume: $($loginResp | ConvertTo-Json -Depth 5)"
  exit 1
}

$userId = $loginResp.data.userId
$authToken = $loginResp.data.authToken

Write-Host "Login OK. userId=$userId"
Write-Host "authToken=$authToken"

# 5) Exportar variables de entorno en esta sesión
$env:RC_ADMIN_ID = $userId
$env:RC_ADMIN_TOKEN = $authToken
Write-Host "Variables de entorno RC_ADMIN_ID y RC_ADMIN_TOKEN preparadas para esta sesión."
