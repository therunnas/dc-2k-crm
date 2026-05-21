# 2K Command OS — Internal CRM & Operations Dashboard

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-8b5cf6)
![React](https://img.shields.io/badge/React-19-22d3ee)
![Vite](https://img.shields.io/badge/Vite-frontend-646cff)
![TypeScript](https://img.shields.io/badge/TypeScript-app-3178c6)
![Node.js](https://img.shields.io/badge/Node.js-backend-4ade80)
![Express](https://img.shields.io/badge/Express-API-111827)

Painel operacional local da **2K Studios** para centralizar financeiro, produções, clientes, agenda, automações, Obsidian e Discord Bot.

O sistema roda localmente com **backend Node.js/Express**, **frontend React/Vite** e executores para **Windows** e **macOS**.

---

## Requisitos

Antes de usar, instale:

- Git
- Node.js LTS
- Navegador atualizado

Teste no terminal:

```bash
node -v
npm -v
git --version
```

---

## Instalação no Windows

Clone o projeto:

```powershell
cd "$env:USERPROFILE\Documents\GitHub"
git clone https://github.com/therunnas/dc-2k-crm.git
cd dc-2k-crm
```

Abra o executor visual:

```txt
2K Command OS.vbs
```

No primeiro uso:

1. Confirme a pasta do projeto.
2. Configure o `.env` / Discord Bot.
3. Clique em **Salvar configuração**.
4. Clique em **Instalar dependências**.
5. Clique em **Abrir App Completo**.

Uso diário:

```txt
Abrir 2K Command OS.vbs
Clicar em Abrir App Completo
```

Para criar atalho na Área de Trabalho/Menu Iniciar:

```powershell
powershell -ExecutionPolicy Bypass -File ".\launchers\windows\instalar-atalho-windows.ps1"
```

---

## Instalação no macOS

Clone o projeto:

```bash
mkdir -p ~/Documents/GitHub
cd ~/Documents/GitHub
git clone https://github.com/therunnas/dc-2k-crm.git
cd dc-2k-crm
```

Libere os executores:

```bash
chmod +x "launchers/mac/criar-app-mac.command"
chmod +x "launchers/mac/instalar-atalho-mac.command"
```

Crie o app local:

```bash
./launchers/mac/criar-app-mac.command
```

Instale na Mesa:

```bash
./launchers/mac/instalar-atalho-mac.command
```

Abra:

```txt
2K Command OS.app
```

No primeiro uso:

1. Selecione a pasta do projeto.
2. Configure o `.env` / Discord Bot.
3. Instale as dependências.
4. Clique em **Abrir App Completo**.

Uso diário:

```txt
Abrir 2K Command OS.app
Clicar em Abrir App Completo
```

---

## Configuração do Discord Bot

O `.env` fica em:

```txt
apps/server/.env
```

Modelo:

```env
PORT=3333

DISCORD_BOT_ENABLED=true
DISCORD_BOT_TOKEN=SEU_TOKEN_DO_BOT
DISCORD_GUILD_ID=ID_DO_SERVIDOR
DISCORD_ALERT_CHANNEL_ID=ID_DO_CANAL_PADRAO
```

O bot fica online enquanto o backend estiver rodando.

```txt
Backend ligado = bot online
Backend fechado = bot offline
```

Para deixar o bot 24/7, será necessário hospedar o backend em servidor/cloud.

---

## URLs locais

```txt
Dashboard: http://localhost:5173/dashboard
Frontend:  http://localhost:5173
Backend:   http://localhost:3333
Health:    http://localhost:3333/health
```

---

## Módulos

- **Dashboard** — visão executiva do fluxo.
- **Financeiro** — importação da planilha e controle de entradas/saídas.
- **Produções** — projetos importados da planilha.
- **Clientes** — grupos, marcas e faturamento por cliente.
- **Agenda** — prazos e próximos recebimentos.
- **Automações** — ações sugeridas e alertas operacionais.
- **Obsidian** — apoio à documentação interna.
- **Discord** — status do bot e envio de mensagens por canal.

---

## Importar planilha

Com o sistema aberto:

1. Acesse `/financeiro`.
2. Clique em **Selecionar planilha**.
3. Importe o arquivo `.xlsx`.
4. Confira os dados no Dashboard.

---

## Estrutura principal

```txt
dc-2k-crm/
├── 2K Command OS.vbs
├── apps/
│   ├── server/
│   └── web/
├── launchers/
│   ├── windows/
│   │   ├── 2K Command OS.hta
│   │   └── instalar-atalho-windows.ps1
│   └── mac/
│       ├── 2K Command OS.applescript
│       ├── criar-app-mac.command
│       └── instalar-atalho-mac.command
├── README.md
└── .gitignore
```

---

## Rodar manualmente

Backend:

```bash
cd apps/server
npm install
npm run dev
```

Frontend:

```bash
cd apps/web
npm install
npm run dev
```

---

## Atualizar projeto

Pelo executor:

```txt
Atualizar projeto
```

Manual:

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

## Segurança

Nunca envie para o GitHub:

```txt
apps/server/.env
apps/server/data/
node_modules/
dist/
obsidian-vault/
```

Esses arquivos são locais e protegidos pelo `.gitignore`.

---

## Status

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
Executor macOS: preparado para teste
```