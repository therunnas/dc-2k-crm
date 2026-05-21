import { useMemo, useState, type FormEvent } from "react";
import { api } from "../services/api";
import {
  BookOpenText,
  Bot,
  Building2,
  CheckCircle2,
  Clipboard,
  ClipboardList,
  FileText,
  FolderOpen,
  Layers3,
  Loader2,
  NotebookPen,
  Save,
  SearchCheck,
  Sparkles,
  Workflow,
  type LucideIcon
} from "lucide-react";

import "./Obsidian.css";

type TemplateKey =
  | "diario"
  | "cliente"
  | "producao"
  | "financeiro"
  | "problema"
  | "automacao"
  | "agenda"
  | "livre";

type ObsidianResponse = {
  success?: boolean;
  file?: string;
  path?: string;
  message?: string;
};

type TemplateItem = {
  key: TemplateKey;
  title: string;
  description: string;
  folder: string;
  icon: LucideIcon;
  tag: string;
};

const folderOptions = [
  "00 - Inbox",
  "01 - Diário Operacional",
  "02 - Clientes",
  "03 - Produções",
  "04 - Financeiro",
  "05 - Problemas & Soluções",
  "06 - Processos Internos",
  "07 - Melhorias",
  "08 - Estratégia",
  "09 - IA & Automação",
  "10 - Reuniões",
  "11 - Equipe",
  "12 - Templates"
];

const templates: TemplateItem[] = [
  {
    key: "diario",
    title: "Diário operacional",
    description: "Registro diário da empresa, pendências, decisões e próximos passos.",
    folder: "01 - Diário Operacional",
    icon: NotebookPen,
    tag: "diario-operacional"
  },
  {
    key: "cliente",
    title: "Cliente",
    description: "Histórico comercial, contatos, demandas, oportunidades e follow-up.",
    folder: "02 - Clientes",
    icon: Building2,
    tag: "cliente"
  },
  {
    key: "producao",
    title: "Produção",
    description: "Briefing, status, equipe, entregas, prazos e observações do projeto.",
    folder: "03 - Produções",
    icon: Layers3,
    tag: "producao"
  },
  {
    key: "financeiro",
    title: "Financeiro",
    description: "Registro de cobrança, NF, pagamento, custo, caixa ou conferência.",
    folder: "04 - Financeiro",
    icon: ClipboardList,
    tag: "financeiro"
  },
  {
    key: "problema",
    title: "Problema & Solução",
    description: "Documentação de erro, causa, solução aplicada e prevenção.",
    folder: "05 - Problemas & Soluções",
    icon: Workflow,
    tag: "problema-solucao"
  },
  {
    key: "automacao",
    title: "Automação",
    description: "Ideias, fluxos, integrações, prompts, IA e melhorias internas.",
    folder: "09 - IA & Automação",
    icon: Bot,
    tag: "automacao"
  },
  {
    key: "agenda",
    title: "Agenda / Follow-up",
    description: "Pauta, ata, responsáveis, decisões e próximos passos.",
    folder: "10 - Reuniões",
    icon: BookOpenText,
    tag: "agenda"
  },
  {
    key: "livre",
    title: "Nota livre",
    description: "Nota simples enviada para Inbox, sem estrutura rígida.",
    folder: "00 - Inbox",
    icon: FileText,
    tag: "nota-livre"
  }
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function todayBR() {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short"
  }).format(new Date());
}

function sanitizeTitle(value: string) {
  return value.trim().replace(/[\\/:*?"<>|]/g, "-");
}

function buildFrontmatter(template: TemplateItem, title: string, folder: string) {
  return `---
title: "${title || "Sem título"}"
tipo: "${template.title}"
pasta: "${folder}"
tags:
  - 2k-command-os
  - ${template.tag}
criado_em: "${todayISO()}"
origem: "2K Command OS"
---`;
}

function buildTemplateContent(template: TemplateItem, title: string, folder: string, notes: string) {
  const content = notes.trim() || "Sem observações adicionais.";

  const frontmatter = buildFrontmatter(template, title, folder);

  if (template.key === "diario") {
    return `${frontmatter}

# ${title || "Diário operacional"}

## Resumo do dia

${content}

## Decisões tomadas

- 

## Pendências

- 

## Próximos passos

- 

## Pontos de atenção

- 

## Registro

Criado em: ${todayBR()}
`;
  }

  if (template.key === "cliente") {
    return `${frontmatter}

# ${title || "Cliente"}

## Visão geral

${content}

## Contatos e responsáveis

- 

## Histórico

- 

## Demandas abertas

- 

## Oportunidades

- 

## Próxima ação

- 

## Registro

Criado em: ${todayBR()}
`;
  }

  if (template.key === "producao") {
    return `${frontmatter}

# ${title || "Produção"}

## Resumo da produção

${content}

## Cliente / Grupo

- 

## Marca

- 

## Status atual

- 

## Equipe envolvida

- 

## Entregáveis

- 

## Prazos

- 

## Pendências

- 

## Próxima ação

- 

## Registro

Criado em: ${todayBR()}
`;
  }

  if (template.key === "financeiro") {
    return `${frontmatter}

# ${title || "Registro financeiro"}

## Contexto financeiro

${content}

## Tipo

- [ ] Cobrança
- [ ] Nota fiscal
- [ ] Pagamento
- [ ] Custo
- [ ] Conferência
- [ ] Fluxo de caixa

## Valor

R$ 

## Status

- 

## Responsável

- 

## Próxima ação

- 

## Registro

Criado em: ${todayBR()}
`;
  }

  if (template.key === "problema") {
    return `${frontmatter}

# ${title || "Problema & Solução"}

## Problema identificado

${content}

## Impacto

- 

## Causa provável

- 

## Solução aplicada

- 

## Como prevenir

- 

## Status

- [ ] Aberto
- [ ] Em análise
- [ ] Resolvido

## Registro

Criado em: ${todayBR()}
`;
  }

  if (template.key === "automacao") {
    return `${frontmatter}

# ${title || "Automação"}

## Ideia / Automação

${content}

## Objetivo

- 

## Entrada de dados

- 

## Saída esperada

- 

## Ferramentas envolvidas

- [ ] 2K Command OS
- [ ] Obsidian
- [ ] Planilha
- [ ] Discord
- [ ] IA
- [ ] Google Sheets
- [ ] API externa

## Status

- [ ] Ideia
- [ ] Em desenvolvimento
- [ ] Testando
- [ ] Funcionando

## Próximo passo

- 

## Registro

Criado em: ${todayBR()}
`;
  }

  if (template.key === "agenda") {
    return `${frontmatter}

# ${title || "Agenda / Follow-up"}

## Pauta

${content}

## Participantes

- 

## Decisões

- 

## Tarefas geradas

- [ ] 

## Responsáveis

- 

## Próxima reunião / follow-up

- 

## Registro

Criado em: ${todayBR()}
`;
  }

  return `${frontmatter}

# ${title || "Nota livre"}

${content}

## Registro

Criado em: ${todayBR()}
`;
}

export function Obsidian() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>("diario");
  const [title, setTitle] = useState("");
  const [folder, setFolder] = useState("01 - Diário Operacional");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [createdFile, setCreatedFile] = useState("");

  const activeTemplate =
    templates.find((template) => template.key === selectedTemplate) ?? templates[0];

  const markdownPreview = useMemo(() => {
    return buildTemplateContent(activeTemplate, title, folder, notes);
  }, [activeTemplate, title, folder, notes]);

  function selectTemplate(templateKey: TemplateKey) {
    const template = templates.find((item) => item.key === templateKey);

    if (!template) return;

    setSelectedTemplate(template.key);
    setFolder(template.folder);
    setMessage("");
    setCreatedFile("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const cleanTitle = sanitizeTitle(title);

    if (!cleanTitle) {
      setMessage("Informe um título para a nota.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setCreatedFile("");

      const response = await api.post<ObsidianResponse>("/api/obsidian/note", {
        title: cleanTitle,
        folder,
        content: markdownPreview
      });

      const filePath = response.data.file ?? response.data.path ?? `${folder}/${cleanTitle}.md`;

      setCreatedFile(filePath);
      setMessage("Nota criada com sucesso no Obsidian.");
      setTitle("");
      setNotes("");
    } catch {
      setMessage("Erro ao criar nota. Verifique o backend e o caminho do vault do Obsidian.");
    } finally {
      setLoading(false);
    }
  }

  async function copyPreview() {
    try {
      await navigator.clipboard.writeText(markdownPreview);
      setMessage("Markdown copiado para a área de transferência.");
    } catch {
      setMessage("Não foi possível copiar o Markdown.");
    }
  }

  return (
    <div className="obsops-page">
      <section className="obsops-header">
        <div>
          <p className="obsops-overline">Obsidian / Base de Conhecimento</p>
          <h1>Documentação operacional conectada ao Command OS.</h1>
          <p>
            Crie notas estruturadas para clientes, produções, financeiro, problemas,
            automações, agenda e rotina diária diretamente pelo portal.
          </p>
        </div>

        <div className="obsops-header-card">
          <Sparkles size={30} />
          <span>Template ativo</span>
          <strong>{activeTemplate.title}</strong>
          <small>{folder}</small>
        </div>
      </section>

      {message && (
        <div className={createdFile ? "obsops-message success" : "obsops-message"}>
          {createdFile ? <CheckCircle2 size={16} /> : <FolderOpen size={16} />}
          <span>{message}</span>
        </div>
      )}

      <section className="obsops-template-grid">
        {templates.map((template) => {
          const Icon = template.icon;

          return (
            <button
              type="button"
              className={`obsops-template-card ${
                selectedTemplate === template.key ? "active" : ""
              }`}
              key={template.key}
              onClick={() => selectTemplate(template.key)}
            >
              <Icon size={20} />
              <strong>{template.title}</strong>
              <span>{template.description}</span>
            </button>
          );
        })}
      </section>

      <section className="obsops-main-grid">
        <form className="obsops-panel obsops-form" onSubmit={handleSubmit}>
          <div className="obsops-panel-header">
            <div>
              <p className="obsops-overline">Criar nota</p>
              <h2>Enviar para o Obsidian</h2>
            </div>
            <Save />
          </div>

          <label>
            <span>Título da nota</span>
            <input
              placeholder="Ex: Follow-up financeiro — FG Empreendimentos"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <label>
            <span>Pasta do vault</span>
            <select value={folder} onChange={(event) => setFolder(event.target.value)}>
              {folderOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Conteúdo base</span>
            <textarea
              placeholder="Escreva o conteúdo principal. O Command OS organiza dentro do template selecionado."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={12}
            />
          </label>

          <div className="obsops-actions">
            <button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="obsops-spin" size={18} />
                  Criando nota...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Criar nota
                </>
              )}
            </button>

            <button type="button" className="secondary" onClick={copyPreview}>
              <Clipboard size={18} />
              Copiar Markdown
            </button>
          </div>

          {createdFile && (
            <div className="obsops-created-file">
              <span>Arquivo criado</span>
              <strong>{createdFile}</strong>
            </div>
          )}
        </form>

        <aside className="obsops-panel obsops-preview">
          <div className="obsops-panel-header">
            <div>
              <p className="obsops-overline">Preview</p>
              <h2>Markdown final</h2>
            </div>
            <FileText />
          </div>

          <pre>{markdownPreview}</pre>
        </aside>
      </section>

      <section className="obsops-grid-two">
        <div className="obsops-panel">
          <div className="obsops-panel-header">
            <div>
              <p className="obsops-overline">Estrutura</p>
              <h2>Pastas do vault 2K-OS</h2>
            </div>
            <FolderOpen />
          </div>

          <div className="obsops-folder-grid">
            {folderOptions.map((item) => (
              <div key={item}>
                <FolderOpen size={16} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="obsops-panel">
          <div className="obsops-panel-header">
            <div>
              <p className="obsops-overline">Validação</p>
              <h2>Como testar</h2>
            </div>
            <SearchCheck />
          </div>

          <div className="obsops-checklist">
            <div>
              <CheckCircle2 size={16} />
              <span>Escolha um template.</span>
            </div>

            <div>
              <CheckCircle2 size={16} />
              <span>Preencha título e conteúdo base.</span>
            </div>

            <div>
              <CheckCircle2 size={16} />
              <span>Clique em Criar nota.</span>
            </div>

            <div>
              <CheckCircle2 size={16} />
              <span>Confirme se o arquivo .md apareceu no vault.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
