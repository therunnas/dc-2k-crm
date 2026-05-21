# 2K Command OS — Internal CRM & Operations Dashboard

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-8b5cf6)
![React](https://img.shields.io/badge/React-19-22d3ee)
![Vite](https://img.shields.io/badge/Vite-frontend-646cff)
![TypeScript](https://img.shields.io/badge/TypeScript-app-3178c6)
![Node.js](https://img.shields.io/badge/Node.js-backend-4ade80)
![Express](https://img.shields.io/badge/Express-API-111827)

# 2K Command OS

Painel operacional local da **2K Studios** para centralizar financeiro, produções, clientes, agenda, automações, Obsidian e Discord Bot.

O sistema transforma dados da planilha operacional da empresa em um painel interno com visão executiva, controle financeiro, acompanhamento de projetos e integração com Discord.

---

## Visão geral

O **2K Command OS** roda localmente no computador e possui:

- Dashboard executivo
- Importação de planilha `.xlsx`
- Financeiro com entradas, saídas e status de recebimento
- Produções importadas da planilha
- Clientes / CRM
- Agenda operacional
- Automações e ações sugeridas
- Obsidian para documentação
- Bot Discord integrado
- Executor visual para Windows
- Executor local para MacBook/macOS

---

## Requisitos

Antes de usar, instale:

### Windows

- Git
- Node.js LTS
- Google Chrome, Microsoft Edge ou outro navegador

### macOS

- Git
- Node.js LTS
- Terminal padrão do macOS
- Safari, Chrome ou outro navegador

Para conferir se está instalado:

```bash
node -v
npm -v
git --version
```

---

# Instalação no Windows

## 1. Clonar o projeto

Abra o PowerShell e vá para a pasta onde você guarda seus projetos:

```powershell
cd "$env:USERPROFILE\Documents\GitHub"
```

Clone o repositório:

```powershell
git clone https://github.com/therunnas/dc-2k-crm.git
```

Entre na pasta do projeto:

```powershell
cd dc-2k-crm
```

A pasta correta do projeto será algo como:

```txt
C:\Users\SEU_USUARIO\Documents\GitHub\dc-2k-crm
```

---

## 2. Abrir o executor visual no Windows

Na raiz do projeto, abra com duplo clique:

```txt
2K Command OS.vbs
```

Esse é o executor visual do Windows.

Ele permite:

- Salvar configuração
- Configurar ENV / Discord Bot
- Instalar dependências
- Abrir App Completo
- Abrir Backend
- Abrir Frontend
- Abrir navegador
- Atualizar projeto
- Testar status
- Parar tudo

---

## 3. Primeira configuração no Windows

No executor visual:

### 3.1 Conferir pasta do projeto

Confirme se o campo **Pasta do projeto dc-2k-crm** está apontando para a raiz do projeto:

```txt
C:\Users\SEU_USUARIO\Documents\GitHub\dc-2k-crm
```

Não selecione `apps`, `apps/web` ou `apps/server`.

Selecione sempre a raiz:

```txt
dc-2k-crm
```

---

### 3.2 Configurar ENV / Discord Bot

Preencha os campos:

```env
PORT=3333
DISCORD_BOT_ENABLED=true
DISCORD_BOT_TOKEN=SEU_TOKEN_DO_BOT
DISCORD_GUILD_ID=ID_DO_SERVIDOR
DISCORD_ALERT_CHANNEL_ID=ID_DO_CANAL_PADRAO
```

Depois clique em:

```txt
Salvar configuração
```

O arquivo `.env` será salvo em:

```txt
apps/server/.env
```

Esse arquivo não sobe para o GitHub.

O caminho do projeto fica salvo localmente em:

```txt
%APPDATA%\2KCommandOS
```

Você só precisa configurar isso novamente se trocar de máquina, trocar a pasta do projeto, trocar o bot, trocar o servidor ou trocar o canal padrão.

---

### 3.3 Instalar dependências

No primeiro uso, clique em:

```txt
Instalar dependências
```

ou:

```txt
Primeira configuração
```

Isso instala as dependências do backend e do frontend.

---

## 4. Uso diário no Windows

Depois da primeira configuração, o uso normal é:

1. Abrir:

```txt
2K Command OS.vbs
```

2. Clicar em:

```txt
Abrir App Completo
```

O executor inicia:

```txt
Backend   → http://localhost:3333
Frontend  → http://localhost:5173
Dashboard → http://localhost:5173/dashboard
```

Não é necessário configurar `.env`, Discord Bot ou dependências todos os dias.

---

## 5. Criar atalho na Área de Trabalho no Windows

Na raiz do projeto, rode uma vez no PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File ".\launchers\windows\instalar-atalho-windows.ps1"
```

Isso cria atalhos para o executor visual em:

```txt
Área de Trabalho > 2K Command OS
Menu Iniciar > 2K Command OS
```

Depois disso, use o atalho normalmente.

---

# Instalação no MacBook / macOS

## 1. Clonar o projeto

Abra o Terminal e rode:

```bash
mkdir -p ~/Documents/GitHub
cd ~/Documents/GitHub
git clone https://github.com/therunnas/dc-2k-crm.git
cd dc-2k-crm
```

A pasta correta do projeto será:

```txt
~/Documents/GitHub/dc-2k-crm
```

---

## 2. Liberar os executores do Mac

No Terminal, dentro da pasta do projeto, rode:

```bash
chmod +x "launchers/mac/criar-app-mac.command"
chmod +x "launchers/mac/instalar-atalho-mac.command"
```

---

## 3. Criar o app local do Mac

Rode:

```bash
./launchers/mac/criar-app-mac.command
```

Isso cria o app local:

```txt
launchers/mac/2K Command OS.app
```

---

## 4. Instalar o app na Mesa

Rode:

```bash
./launchers/mac/instalar-atalho-mac.command
```

Isso cria uma cópia do app na Mesa:

```txt
Desktop / Mesa > 2K Command OS.app
```

---

## 5. Abrir o app no Mac pela primeira vez

Se o macOS bloquear o app:

1. Clique com o botão direito em:

```txt
2K Command OS.app
```

2. Clique em:

```txt
Abrir
```

3. Confirme novamente em:

```txt
Abrir
```

Isso libera o app para uso.

---

## 6. Primeira configuração no Mac

Dentro do app:

### 6.1 Selecionar pasta do projeto

Clique em:

```txt
Selecionar pasta do projeto
```

Selecione:

```txt
~/Documents/GitHub/dc-2k-crm
```

---

### 6.2 Configurar ENV / Discord Bot

Clique em:

```txt
Configurar ENV / Discord Bot
```

Preencha:

```env
PORT=3333
DISCORD_BOT_ENABLED=true
DISCORD_BOT_TOKEN=SEU_TOKEN_DO_BOT
DISCORD_GUILD_ID=ID_DO_SERVIDOR
DISCORD_ALERT_CHANNEL_ID=ID_DO_CANAL_PADRAO
```

O arquivo será salvo em:

```txt
apps/server/.env
```

---

### 6.3 Instalar dependências

Clique em:

```txt
Instalar dependências
```

ou:

```txt
Primeira configuração guiada
```

---

## 7. Uso diário no Mac

Depois da primeira configuração:

1. Abra:

```txt
2K Command OS.app
```

2. Clique em:

```txt
Abrir App Completo
```

O app inicia:

```txt
Backend   → http://localhost:3333
Frontend  → http://localhost:5173
Dashboard → http://localhost:5173/dashboard
```

Não é necessário configurar `.env`, Discord Bot ou dependências todos os dias.

---

# Uso diário recomendado

## Windows

```txt
Abrir 2K Command OS.vbs
Clicar em Abrir App Completo
```

ou pelo atalho:

```txt
Área de Trabalho > 2K Command OS
```

## MacBook / macOS

```txt
Abrir 2K Command OS.app
Clicar em Abrir App Completo
```

---

# Quando configurar novamente

Você só precisa refazer a configuração se:

- Trocar de computador
- Mudar a pasta do projeto
- Trocar token do bot
- Trocar servidor do Discord
- Trocar canal padrão do Discord
- Apagar `apps/server/.env`
- Apagar `node_modules`
- Clonar o projeto em uma nova máquina

---

# Importar planilha

Com o sistema aberto:

1. Acesse:

```txt
http://localhost:5173/financeiro
```

2. Clique em:

```txt
Selecionar planilha
```

3. Importe a planilha `.xlsx`.

4. Confira os dados em:

```txt
Dashboard
Financeiro
Produções
Clientes
Agenda
Automações
```

---

# Dashboard

O Dashboard mostra:

- Faturamento no ano
- Recebido no caixa
- A receber
- Saídas
- Resultado de caixa
- Lucro por competência
- Margem
- Pré-faturamento
- Gráfico de faturamento por mês
- Status financeiro
- Top grupos por faturamento
- Próximos recebimentos

---

# Financeiro

A página Financeiro permite:

- Importar planilha `.xlsx`
- Conferir entradas
- Conferir saídas
- Ver totais por status
- Ver pagamentos recebidos
- Ver aguardando pagamento
- Ver itens para gerar NF
- Ver itens para confirmar informação

Status principais:

```txt
PAGO
AGUARDANDO PAGAMENTO
GERAR NF
CONFIRMAR INFO
ATRASADO
```

---

# Produções

A página Produções lista projetos importados da planilha, com:

- Projeto
- Grupo
- Marca
- Valor
- Status
- Mês
- Emissão
- Previsão
- NF

---

# Clientes / CRM

A página Clientes mostra:

- Grupos
- Marcas
- Ranking por faturamento
- Participação por cliente
- Projetos vinculados

---

# Agenda

A página Agenda organiza:

- Prazos
- Próximos recebimentos
- Follow-ups
- Itens vencidos
- Datas operacionais importantes

---

# Automações

A página Automações centraliza:

- Ações sugeridas
- Alertas financeiros
- Follow-ups
- Itens de NF
- Confirmações pendentes
- Checklist operacional

---

# Obsidian

A página Obsidian ajuda a criar notas operacionais em Markdown.

Templates previstos:

- Diário operacional
- Cliente
- Produção
- Financeiro
- Problema & solução
- Automação
- Agenda / reunião
- Nota livre

---

# Discord Bot

O bot Discord funciona enquanto o backend estiver ligado.

No modo local:

```txt
Backend ligado = bot online
Backend fechado = bot offline
PC/Mac desligado = bot offline
```

A aba Discord permite:

- Ver status real do bot
- Ver servidor conectado
- Ver canal padrão
- Listar canais do servidor
- Escolher uma sala
- Enviar mensagem manual pelo painel

Para deixar o bot online 24/7, será necessário hospedar o backend em servidor/cloud.

---

# Segurança

Nunca envie para o GitHub:

```txt
apps/server/.env
apps/server/data/
node_modules/
dist/
obsidian-vault/
```

Esses arquivos são locais e devem ficar protegidos pelo `.gitignore`.

O arquivo permitido é:

```txt
apps/server/.env.example
```

Ele serve apenas como modelo e não deve conter token real.

---

# Estrutura principal

```txt
dc-2k-crm/
├── 2K Command OS.vbs
├── apps/
│   ├── server/
│   └── web/
├── launchers/
│   ├── windows/
│   │   ├── 2K Command OS.hta
│   │   ├── instalar-atalho-windows.ps1
│   │   └── README-WINDOWS.md
│   └── mac/
│       ├── 2K Command OS.applescript
│       ├── criar-app-mac.command
│       ├── instalar-atalho-mac.command
│       └── README-MAC.md
├── README.md
└── .gitignore
```

---

# Rodar manualmente, se necessário

## Backend

```bash
cd apps/server
npm install
npm run dev
```

Backend:

```txt
http://localhost:3333
```

Teste:

```txt
http://localhost:3333/health
```

---

## Frontend

```bash
cd apps/web
npm install
npm run dev
```

Frontend:

```txt
http://localhost:5173
```

Dashboard:

```txt
http://localhost:5173/dashboard
```

---

# Atualizar projeto

## Pelo executor

Use o botão:

```txt
Atualizar projeto
```

## Manualmente

```bash
git pull origin main

cd apps/server
npm install
npm run build

cd ../web
npm install
npm run build
```

---

# Build

## Backend

```bash
cd apps/server
npm run build
```

## Frontend

```bash
cd apps/web
npm run build
```

O aviso de chunk grande do Vite não impede o funcionamento.

---

# GitHub

Antes de subir alterações:

```bash
git status
```

Adicionar arquivos:

```bash
git add README.md
git add "2K Command OS.vbs"
git add launchers/windows
git add launchers/mac
git add apps/server/src
git add apps/web/src
git add .gitignore
git add -u
```

Commit:

```bash
git commit -m "feat: update 2k command os"
```

Push:

```bash
git push origin main
```

Nunca faça commit de:

```txt
.env
apps/server/data/
node_modules/
dist/
obsidian-vault/
```

---

# Status atual

```txt
Dashboard: concluído
Financeiro: concluído
Produções: concluído
Clientes: concluído
Agenda: concluído
Automações: concluído
Obsidian: concluído
Discord Bot: concluído
Executor Windows: concluído
Executor Mac: preparado para teste no macOS
```

---

# Observação sobre iPhone/iPad

iPhone e iPad não executam este projeto localmente porque o sistema depende de backend Node.js.

Para usar em iOS, será necessário hospedar o backend e o frontend online.