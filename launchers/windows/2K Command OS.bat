@echo off
chcp 65001 > nul
title 2K Command OS - Executor
color 0B

set PROJECT_DIR=%~dp0..\..
for %%i in ("%PROJECT_DIR%") do set PROJECT_DIR=%%~fi

set SERVER_DIR=%PROJECT_DIR%\apps\server
set WEB_DIR=%PROJECT_DIR%\apps\web
set ENV_FILE=%SERVER_DIR%\.env
set APP_URL=http://localhost:5173/dashboard

:menu
cls
echo ==================================================
echo              2K COMMAND OS - EXECUTOR
echo ==================================================
echo.
echo  Projeto:
echo  %PROJECT_DIR%
echo.
echo  [1] Primeira configuracao guiada
echo  [2] Configurar .env / Discord Bot
echo  [3] Instalar dependencias
echo  [4] Abrir BACKEND
echo  [5] Abrir FRONTEND
echo  [6] Abrir APP COMPLETO
echo  [7] Atualizar projeto
echo  [8] Testar status
echo  [9] Parar backend e frontend
echo  [0] Sair
echo.
echo ==================================================
echo.

if not exist "%ENV_FILE%" (
  echo  AVISO: .env ainda nao configurado.
  echo  Use a opcao [1] ou [2] antes de abrir o app completo.
  echo.
)

set /p opcao=Escolha uma opcao: 

if "%opcao%"=="1" goto primeira_config
if "%opcao%"=="2" goto configurar_env
if "%opcao%"=="3" goto instalar
if "%opcao%"=="4" goto backend
if "%opcao%"=="5" goto frontend
if "%opcao%"=="6" goto completo
if "%opcao%"=="7" goto atualizar
if "%opcao%"=="8" goto status
if "%opcao%"=="9" goto parar
if "%opcao%"=="0" exit

goto menu

:primeira_config
cls
echo ==================================================
echo        PRIMEIRA CONFIGURACAO GUIADA
echo ==================================================
echo.

call :check_tools
if errorlevel 1 goto menu

echo.
echo Configurando .env...
powershell -NoProfile -ExecutionPolicy Bypass -File "%PROJECT_DIR%\launchers\windows\configurar-env.ps1"

echo.
echo Instalando dependencias do backend...
cd /d "%SERVER_DIR%"
npm install

echo.
echo Instalando dependencias do frontend...
cd /d "%WEB_DIR%"
npm install

echo.
echo Testando build do backend...
cd /d "%SERVER_DIR%"
npm run build

echo.
echo Testando build do frontend...
cd /d "%WEB_DIR%"
npm run build

echo.
echo ==================================================
echo  Primeira configuracao finalizada.
echo  Agora use a opcao [6] Abrir APP COMPLETO.
echo ==================================================
pause
goto menu

:configurar_env
cls
powershell -NoProfile -ExecutionPolicy Bypass -File "%PROJECT_DIR%\launchers\windows\configurar-env.ps1"
pause
goto menu

:instalar
cls
echo Instalando dependencias...
echo.

call :check_tools
if errorlevel 1 goto menu

cd /d "%SERVER_DIR%"
npm install

cd /d "%WEB_DIR%"
npm install

echo.
echo Dependencias instaladas.
pause
goto menu

:backend
cls
echo Abrindo BACKEND...
echo.

if not exist "%ENV_FILE%" (
  echo .env nao encontrado. Configure antes.
  pause
  goto menu
)

start "2K Command OS - Backend" cmd /k "cd /d "%SERVER_DIR%" && npm run dev"
echo Backend iniciado.
pause
goto menu

:frontend
cls
echo Abrindo FRONTEND...
echo.

start "2K Command OS - Frontend" cmd /k "cd /d "%WEB_DIR%" && npm run dev"
echo Frontend iniciado.
pause
goto menu

:completo
cls
echo Abrindo APP COMPLETO...
echo.

if not exist "%ENV_FILE%" (
  echo .env nao encontrado.
  echo Abrindo configuracao agora...
  powershell -NoProfile -ExecutionPolicy Bypass -File "%PROJECT_DIR%\launchers\windows\configurar-env.ps1"
)

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
echo Sistema iniciado.
pause
goto menu

:atualizar
cls
echo Atualizando projeto...
echo.

call :check_tools
if errorlevel 1 goto menu

cd /d "%PROJECT_DIR%"

echo.
echo Git pull...
git pull origin main

echo.
echo Instalando backend...
cd /d "%SERVER_DIR%"
npm install

echo.
echo Instalando frontend...
cd /d "%WEB_DIR%"
npm install

echo.
echo Build backend...
cd /d "%SERVER_DIR%"
npm run build

echo.
echo Build frontend...
cd /d "%WEB_DIR%"
npm run build

echo.
echo Atualizacao finalizada.
pause
goto menu

:status
cls
echo ==================================================
echo              STATUS DO SISTEMA
echo ==================================================
echo.

echo BACKEND:
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-RestMethod 'http://localhost:3333/health' | ConvertTo-Json -Depth 10 } catch { Write-Host 'BACKEND OFFLINE' }"

echo.
echo DISCORD BOT:
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-RestMethod 'http://localhost:3333/api/discord/bot/status' | ConvertTo-Json -Depth 10 } catch { Write-Host 'BOT/ROTA OFFLINE' }"

echo.
echo CANAIS DISCORD:
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-RestMethod 'http://localhost:3333/api/discord/bot/channels' | ConvertTo-Json -Depth 4 } catch { Write-Host 'CANAIS OFFLINE OU BOT NAO INICIADO' }"

echo.
echo FRONTEND:
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest 'http://localhost:5173' -UseBasicParsing; Write-Host 'FRONTEND ONLINE - Status:' $r.StatusCode } catch { Write-Host 'FRONTEND OFFLINE' }"

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

:check_tools
where node >nul 2>nul
if errorlevel 1 (
  echo ERRO: Node.js nao encontrado. Instale o Node.js antes.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERRO: npm nao encontrado. Instale o Node.js antes.
  pause
  exit /b 1
)

where git >nul 2>nul
if errorlevel 1 (
  echo ERRO: Git nao encontrado. Instale o Git antes.
  pause
  exit /b 1
)

exit /b 0

:stop_ports
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 3333 -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -ne 0 } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -ne 0 } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
exit /b
