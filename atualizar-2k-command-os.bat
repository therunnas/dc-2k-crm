@echo off
title 2K Command OS - Atualizar Projeto
color 0B

echo ============================================
echo  2K COMMAND OS - ATUALIZAR / VALIDAR
echo ============================================
echo.

set PROJECT_DIR=C:\Users\vinicius.macaneiro\Documents\GitHub\dc-2k-crm
set SERVER_DIR=%PROJECT_DIR%\apps\server
set WEB_DIR=%PROJECT_DIR%\apps\web

cd /d %PROJECT_DIR%

echo.
echo Atualizando repositorio Git...
git pull origin main

echo.
echo Instalando dependencias do backend...
cd /d %SERVER_DIR%
npm install

echo.
echo Instalando dependencias do frontend...
cd /d %WEB_DIR%
npm install

echo.
echo Rodando build do frontend...
npm run build

echo.
echo ============================================
echo  ATUALIZACAO FINALIZADA
echo ============================================
echo.
pause
