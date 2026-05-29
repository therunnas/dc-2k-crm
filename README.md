# DC 2K CRM Legacy — 2K Command OS Prototype

![Status](https://img.shields.io/badge/status-legado%20%2F%20prot%C3%B3tipo-8b5cf6)
![React](https://img.shields.io/badge/React-19-22d3ee)
![Vite](https://img.shields.io/badge/Vite-frontend-646cff)
![TypeScript](https://img.shields.io/badge/TypeScript-app-3178c6)
![Node.js](https://img.shields.io/badge/Node.js-backend-4ade80)
![Express](https://img.shields.io/badge/Express-API-111827)

> **Status:** projeto legado / protótipo local.
>
> Este repositório representa uma versão antiga/local/teste do **2K Command OS / DC 2K CRM**.
> Ele foi preservado como referência visual, histórica e operacional.
>
> O projeto SaaS atual e principal está separado no repositório **`therunnas/2k-web-saas`**.

---

## O que é este projeto

O **DC 2K CRM Legacy** é um painel operacional local da **2K Studios** criado para centralizar, em uma versão experimental, áreas como:

- dashboard financeiro;
- produções;
- clientes;
- agenda;
- automações;
- Obsidian;
- Discord Bot;
- importação de planilhas;
- executores locais para Windows e macOS.

Ele roda localmente com:

- frontend **React/Vite/TypeScript**;
- backend **Node.js/Express/TypeScript**;
- leitura de planilhas com `xlsx`;
- módulos visuais de dashboard e operação interna.

Este projeto **não representa a arquitetura final do SaaS**. Ele deve ser usado como referência de UI, histórico e base de consulta.

---

## Relação com o 2K Web SaaS

A separação correta é:

```txt
therunnas/dc-2k-crm     = projeto legado / protótipo / referência visual
therunnas/2k-web-saas   = SaaS atual / projeto principal
```

Não copie este projeto inteiro para dentro do `2k-web-saas`.

O que pode ser aproveitado como referência:

- visual dark;
- composição da sidebar;
- cards financeiros;
- gráficos;
- organização dos módulos;
- linguagem visual do 2K Command OS;
- ideias de fluxo financeiro e operacional.

O que não deve ser migrado automaticamente:

- estrutura inteira do projeto;
- executores locais;
- arquivos de ambiente;
- dados locais;
- dependências sem revisão;
- integrações antigas;
- qualquer código sem adaptação ao SaaS novo.

---

## Stack identificada

### Frontend

Local:

```txt
apps/web
```

Principais tecnologias:

- React 19;
- Vite;
- TypeScript;
- React Router DOM;
- Recharts;
- Framer Motion;
- Zustand;
- Lucide React;
- Axios.

Scripts principais:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

### Backend

Local:

```txt
apps/server
```

Principais tecnologias:

- Node.js;
- Express;
- TypeScript;
- tsx;
- multer;
- xlsx;
- dotenv;
- cors;
- discord.js.

Scripts principais:

```bash
npm run dev
npm run build
npm run start
```

---

## Requisitos

Antes de usar, instale:

- Git;
- Node.js LTS;
- npm;
- navegador atualizado.

Teste no terminal:

```bash
node -v
npm -v
git --version
```

---

## Como rodar localmente

Clone o projeto:

```bash
git clone https://github.com/therunnas/dc-2k-crm.git
cd dc-2k-crm
```

### Backend

```bash
cd apps/server
npm install
npm run dev
```

Backend típico:

```txt
http://localhost:3333
```

### Frontend

Em outro terminal:

```bash
cd apps/web
npm install
npm run dev
```

Frontend típico:

```txt
http://localhost:5173
```

---

## URLs locais

```txt
Frontend:  http://localhost:5173
Dashboard: http://localhost:5173/dashboard
Backend:   http://localhost:3333
Health:    http://localhost:3333/health
```

---

## Módulos do protótipo

- **Dashboard** — visão executiva do fluxo financeiro e operacional.
- **Financeiro** — importação de planilha e controle de entradas/saídas.
- **Produções** — projetos e operações audiovisuais.
- **Clientes** — grupos, marcas e faturamento por cliente.
- **Agenda** — prazos, próximos recebimentos e operação.
- **Automações** — ações sugeridas e alertas operacionais.
- **Obsidian** — apoio à documentação interna.
- **Discord** — status/integração local experimental com bot.

> Alguns módulos podem ser protótipos, mockups ou integrações locais. Validar no código antes de migrar qualquer parte para o SaaS novo.

---

## Importar planilha

Fluxo previsto no protótipo:

1. abrir o sistema local;
2. acessar `/financeiro`;
3. selecionar uma planilha `.xlsx`;
4. importar os dados;
5. conferir os indicadores no dashboard.

---

## Estrutura principal

```txt
dc-2k-crm/
├── apps/
│   ├── server/
│   └── web/
├── launchers/
│   ├── windows/
│   └── mac/
├── README.md
├── LEGACY_NOTICE.md
└── .gitignore
```

---

## Segurança

Nunca envie para o GitHub:

```txt
.env
.env.*
apps/server/.env
apps/server/data/
node_modules/
dist/
build/
.vite/
obsidian-vault/
```

Esses itens devem permanecer locais e ignorados pelo `.gitignore`.

---

## Documentação relacionada

- `LEGACY_NOTICE.md` — aviso formal de projeto legado.
- `docs/PROJECT_CONTEXT.md` — contexto técnico e relação com o SaaS novo, quando disponível.

---

## Status atual

```txt
Tipo: projeto legado / protótipo local
Uso principal: referência visual e histórica
Projeto principal atual: therunnas/2k-web-saas
Migração automática: não recomendada
```

---

## Licença

Uso interno/experimental da 2K Studios. Ajustar licença formal antes de uso público amplo.
