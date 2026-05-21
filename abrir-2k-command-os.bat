@echo off
title 2K Command OS - Inicializador
color 0A

echo ============================================
echo  2K COMMAND OS - INICIANDO SISTEMA
echo ============================================
echo.

set PROJECT_DIR=C:\Users\vinicius.macaneiro\Documents\GitHub\dc-2k-crm
set SERVER_DIR=%PROJECT_DIR%\apps\server
set WEB_DIR=%PROJECT_DIR%\apps\web

echo Verificando backend...
if not exist "%SERVER_DIR%" (
  echo ERRO: Pasta do backend nao encontrada.
  pause
  exit
)

echo Verificando frontend...
if not exist "%WEB_DIR%" (
  echo ERRO: Pasta do frontend nao encontrada.
  pause
  exit
)

echo.
echo Abrindo backend na porta 3333...
start "2K Command OS - Backend" cmd /k "cd /d %SERVER_DIR% && npm run dev"

timeout /t 4 /nobreak > nul

echo.
echo Abrindo frontend na porta 5173...
start "2K Command OS - Frontend" cmd /k "cd /d %WEB_DIR% && npm run dev"

timeout /t 6 /nobreak > nul

echo.
echo Abrindo painel no navegador...
start http://localhost:5173/dashboard

echo.
echo Sistema iniciado.
echo Backend:  http://localhost:3333
echo Frontend: http://localhost:5173
echo.
echo Pode fechar esta janela. Mantenha abertas as janelas Backend e Frontend.
pause
