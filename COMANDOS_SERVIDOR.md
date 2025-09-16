# 🛑 Comandos para Gestionar el Servidor Next.js

## Detener el servidor Next.js:
```powershell
Stop-Job -Name NextServer; Remove-Job -Name NextServer
```

## Iniciar el servidor Next.js:
```powershell
Start-Job -Name "NextServer" -ScriptBlock { cd "C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores"; npm run dev } | Out-Null
```

## Reiniciar el servidor (detener e iniciar):
```powershell
Stop-Job -Name NextServer; Remove-Job -Name NextServer; Start-Sleep -Seconds 2; Start-Job -Name "NextServer" -ScriptBlock { cd "C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores"; npm run dev } | Out-Null
```

## Ver logs del servidor en tiempo real:
```powershell
# Ver últimas 30 líneas
Receive-Job -Name NextServer -Keep | Select-Object -Last 30

# Ver todas las líneas
Receive-Job -Name NextServer -Keep

# Limpiar logs acumulados
Receive-Job -Name NextServer
```

## Verificar estado del servidor:
```powershell
Get-Job -Name NextServer
```

## Gestionar Docker (Rocket.Chat y MongoDB):
```powershell
# Detener Docker
Stop-Job -Name DockerServices; Remove-Job -Name DockerServices

# Ver logs de Docker
Receive-Job -Name DockerServices -Keep | Select-Object -Last 30

# Ver contenedores activos
docker ps
```

## Comandos directos (sin Jobs):
```bash
# Iniciar servidor directamente (bloqueante)
npm run dev

# Detener con Ctrl+C
```
