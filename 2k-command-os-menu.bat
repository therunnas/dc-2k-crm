@echo off
chcp 65001 > nul
title 2K Command OS - Menu
color 0B

set PROJECT_DIR=C:\Users\vinicius.macaneiro\Documents\GitHub\dc-2k-crm
set SERVER_DIR=%PROJECT_DIR%\apps\server
set WEB_DIR=%PROJECT_DIR%\apps\web
set APP_URL=http://localhost:5173/dashboard
set API_URL=http://localhost:3333/health

:menu
cls
echo ==================================================
echo              2K COMMAND OS - MENU
echo ==================================================
echo.
echo  [1] Abrir BACKEND  - localhost:3333
echo  [2] Abrir FRONTEND - localhost:5173
echo  [3] Abrir APP COMPLETO
echo  [4] Abrir NAVEGADOR
echo  [5] Atualizar projeto / npm install / build
echo  [6] Testar status das portas
echo  [7] Parar backend e frontend
echo  [0] Sair
echo.
echo ==================================================
echo.

set /p opcao=Escolha uma opcao: 

if "%opcao%"=="1" goto backend
if "%opcao%"=="2" goto frontend
if "%opcao%"=="3" goto completo
if "%opcao%"=="4" goto navegador
if "%opcao%"=="5" goto atualizar
if "%opcao%"=="6" goto status
if "%opcao%"=="7" goto parar
if "%opcao%"=="0" exit

goto menu

:backend
cls
echo Abrindo BACKEND...
echo Pasta: %SERVER_DIR%
echo.
if not exist "%SERVER_DIR%" (
  echo ERRO: Pasta do backend nao encontrada.
  pause
  goto menu
)
start "2K Command OS - Backend" cmd /k "cd /d "%SERVER_DIR%" && npm run dev"
echo Backend iniciado em nova janela.
echo Aguarde alguns segundos e teste: http://localhost:3333/health
pause
goto menu

:frontend
cls
echo Abrindo FRONTEND...
echo Pasta: %WEB_DIR%
echo.
if not exist "%WEB_DIR%" (
  echo ERRO: Pasta do frontend nao encontrada.
  pause
  goto menu
)
start "2K Command OS - Frontend" cmd /k "cd /d "%WEB_DIR%" && npm run dev"
echo Frontend iniciado em nova janela.
echo Aguarde alguns segundos e abra: http://localhost:5173/dashboard
pause
goto menu

:completo
cls
echo Reiniciando sistema completo...
echo.

call :stop_ports

echo.
echo Abrindo BACKEND...
start "2K Command OS - Backend" cmd /k "cd /d "%SERVER_DIR%" && npm run dev"

echo Aguardando backend iniciar...
timeout /t 5 /nobreak > nul

echo.
echo Abrindo FRONTEND...
start "2K Command OS - Frontend" cmd /k "cd /d "%WEB_DIR%" && npm run dev"

echo Aguardando frontend iniciar...
timeout /t 7 /nobreak > nul

echo.
echo Abrindo navegador...
start %APP_URL%

echo.
echo App completo iniciado.
pause
goto menu

:navegador
cls
echo Abrindo navegador...
start %APP_URL%
pause
goto menu

:atualizar
cls
echo ==================================================
echo        ATUALIZANDO 2K COMMAND OS
echo ==================================================
echo.

cd /d "%PROJECT_DIR%"

echo.
echo Verificando Git...
git status

echo.
echo Instalando dependencias do BACKEND...
cd /d "%SERVER_DIR%"
npm install

echo.
echo Instalando dependencias do FRONTEND...
cd /d "%WEB_DIR%"
npm install

echo.
echo Rodando build do FRONTEND...
npm run build

echo.
echo Atualizacao finalizada.
pause
goto menu

:status
cls
echo ==================================================
echo        STATUS DO 2K COMMAND OS
echo ==================================================
echo.

echo Testando BACKEND:
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-RestMethod 'http://localhost:3333/health' | ConvertTo-Json -Depth 10 } catch { Write-Host 'BACKEND OFFLINE OU COM ERRO' }"

echo.
echo Testando DISCORD BOT:
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-RestMethod 'http://localhost:3333/api/discord/bot/status' | ConvertTo-Json -Depth 10 } catch { Write-Host 'ROTA DO DISCORD OFFLINE OU BACKEND PARADO' }"

echo.
echo Testando FRONTEND:
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest 'http://localhost:5173' -UseBasicParsing; Write-Host 'FRONTEND ONLINE - Status:' $r.StatusCode } catch { Write-Host 'FRONTEND OFFLINE OU COM ERRO' }"

echo.
pause
goto menu

:parar
cls
echo Parando backend e frontend...
call :stop_ports
echo.
echo Finalizado.
pause
goto menu

:stop_ports
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 3333 -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -ne 0 } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -ne 0 } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
exit /b
