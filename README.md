# 2K Command OS — Internal CRM & Operations Dashboard

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-8b5cf6)
![React](https://img.shields.io/badge/React-19-22d3ee)
![Vite](https://img.shields.io/badge/Vite-frontend-646cff)
![TypeScript](https://img.shields.io/badge/TypeScript-app-3178c6)
![Node.js](https://img.shields.io/badge/Node.js-backend-4ade80)
![Express](https://img.shields.io/badge/Express-API-111827)

**2K Command OS** é um painel operacional interno criado para centralizar a gestão da **2K Studios**, conectando dados financeiros, produções, clientes, agenda, automações, Obsidian e Discord em uma única interface.

O projeto funciona como um **Command Center empresarial**, transformando a planilha operacional da empresa em uma visão clara, visual e acionável.

---

## Visão geral

O sistema foi criado para acompanhar:

- fluxo financeiro;
- faturamento;
- valores recebidos;
- valores a receber;
- saídas e despesas;
- lucro por competência;
- resultado de caixa;
- projetos e produções;
- clientes, grupos e marcas;
- prazos e follow-ups;
- alertas operacionais;
- documentação no Obsidian;
- integrações futuras com automações e Discord.

---

## Estrutura do projeto

dc-2k-crm/
├── apps/
│   ├── server/          Backend Node.js + Express
│   └── web/             Frontend React + Vite + TypeScript
├── README.md
├── package.json
└── .gitignore

---

## Módulos principais

### Dashboard

Tela executiva principal do sistema.

Mostra faturamento, recebido, a receber, saídas, lucro por competência, resultado de caixa, margem, gráficos financeiros, top clientes, categorias de saída, próximos recebimentos e riscos financeiros.

### Financeiro

Área de conferência detalhada dos dados financeiros.

Inclui upload da planilha Fluxo 2026, entradas financeiras, saídas financeiras, conferência de regras, filtros por status, busca por projeto, grupo, marca, fornecedor ou NF e validação de valores.

Regra principal usada no sistema:

A receber = Aguardando pagamento + Atrasado

### Produções

Página operacional para acompanhar os projetos importados.

Inclui pipeline por status, projetos atrasados, projetos aguardando pagamento, projetos para gerar NF, projetos pagos, tabela completa, filtros e análise por cliente/grupo.

### Clientes / CRM

Área comercial para análise da carteira de clientes.

Inclui ranking de grupos, ranking de marcas, ticket médio, participação no faturamento, projetos vinculados, distribuição financeira por status e visão de perfil comercial do cliente selecionado.

### Agenda

Central de prazos e follow-up operacional.

Inclui recebimentos próximos, emissões de NF, itens atrasados, eventos de hoje, próximos 7 dias, próximos 30 dias, timeline operacional e tabela completa.

### Automações

Painel para acompanhamento de rotinas internas e alertas.

Inclui status da API, status da planilha, alertas financeiros, fila operacional, checklist técnico e atalhos para módulos principais.

### Obsidian

Integração com documentação operacional.

Permite criar notas estruturadas para diário operacional, clientes, produções, financeiro, problemas e soluções, automações, reuniões e notas livres.

### Discord

Painel dedicado ao servidor e ao bot.

Inclui status do servidor, membros online, checklist do bot, roadmap de comandos e ideias de automação para comunidade.

---

## Stack utilizada

### Frontend

- React
- Vite
- TypeScript
- CSS dedicado por página
- Recharts
- Lucide React

### Backend

- Node.js
- Express
- TypeScript
- Multer
- XLSX
- JSON local para persistência dos dados processados

---

## Como rodar o projeto

### 1. Clonar o repositório

git clone https://github.com/therunnas/dc-2k-crm.git
cd dc-2k-crm

### 2. Rodar o backend

cd apps/server
npm install
npm run dev

Backend:

http://localhost:3333

Teste:

http://localhost:3333/health

### 3. Rodar o frontend

Em outro terminal:

cd apps/web
npm install
npm run dev

Frontend:

http://localhost:5173

---

## Rotas principais da API

GET  /health
POST /api/import/fluxo
GET  /api/import/fluxo/summary
GET  /api/dashboard/financeiro
GET  /api/financeiro/entradas
GET  /api/financeiro/saidas
GET  /api/producoes
GET  /api/tasks
POST /api/tasks
PATCH /api/tasks/:id/status
DELETE /api/tasks/:id
POST /api/obsidian/note

---

## Dados locais e privacidade

Este projeto processa dados financeiros e operacionais internos.

Por segurança, os seguintes arquivos e pastas não devem ser enviados ao GitHub:

.env
apps/server/data/
apps/server/uploads/
obsidian-vault/
reports/
node_modules/
dist/

Esses caminhos devem estar no .gitignore.

---

## Fluxo de uso

1. Rodar backend.
2. Rodar frontend.
3. Abrir /financeiro.
4. Importar a planilha Fluxo 2026.
5. Conferir os valores.
6. Acessar Dashboard, Produções, Clientes e Agenda.
7. Usar Obsidian e Automações para documentação e acompanhamento.

---

## Status do projeto

### Concluído

- estrutura frontend/backend;
- importação de planilha;
- dashboard financeiro;
- página financeira;
- produções;
- clientes/CRM;
- agenda operacional;
- automações;
- Obsidian;
- Discord;
- CSS dedicado por página.

### Em andamento

- refinamento visual final;
- validação completa dos valores da planilha;
- melhorias nas automações;
- organização final para uso operacional.

### Próximos passos

- melhorar a página de Automações;
- revisar Obsidian;
- revisar Discord;
- limpar CSS global antigo;
- criar documentação técnica mais detalhada;
- preparar versão mais estável para apresentação.

---

## Objetivo final

Transformar a operação da 2K Studios em um sistema interno organizado, visual e escalável, reduzindo retrabalho manual e centralizando dados importantes em um único painel.

O 2K Command OS é o início de uma base operacional própria para gestão de produção audiovisual, clientes, financeiro, documentação e automação.


---

Atualiza��o final: 2K Command OS documentado com Dashboard, Financeiro, Discord Bot, atalhos Windows e fluxo de uso local.

