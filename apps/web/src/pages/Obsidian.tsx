import { useMemo, useState, type FormEvent } from "react";
import { api } from "../services/api";
import {
  BookOpenText,
  Bot,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  FolderOpen,
  Layers3,
  Loader2,
  NotebookPen,
  Save,
  Sparkles,
  Workflow
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
  success: boolean;
  file: string;
};

const folders = [
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

const templates: Array<{
  key: TemplateKey;
  title: string;
  description: string;
  folder: string;
  icon: typeof FileText;
}> = [
  {
    key: "diario",
    title: "Diário operacional",
    description: "Registro do dia, decisões, pendências e próximos passos.",
    folder: "01 - Diário Operacional",
    icon: NotebookPen
  },
  {
    key: "cliente",
    title: "Cliente",
    description: "Resumo comercial, histórico, demandas e oportunidades.",
    folder: "02 - Clientes",
    icon: Building2
  },
  {
    key: "producao",
    title: "Produção",
    description: "Briefing, status, equipe, entrega e observações do job.",
    folder: "03 - Produções",
    icon: Layers3
  },
  {
    key: "financeiro",
    title: "Financeiro",
    description: "Notas sobre cobrança, NF, pagamento, custos e caixa.",
    folder: "04 - Financeiro",
    icon: ClipboardList
  },
  {
    key: "problema",
    title: "Problema & Solução",
    description: "Documentação de erro, causa, solução e prevenção.",
    folder: "05 - Problemas & Soluções",
    icon: Workflow
  },
  {
    key: "automacao",
    title: "Automação",
    description: "Ideias, fluxos, integrações, prompts e melhorias com IA.",
    folder: "09 - IA & Automação",
    icon: Bot
  },
  {
    key: "agenda",
    title: "Agenda / Reunião",
    description: "Pauta, ata, responsáveis, decisões e próximos passos.",
    folder: "10 - Reuniões",
    icon: BookOpenText
  },
  {
    key: "livre",
    title: "Nota livre",
    description: "Anotação simples enviada para Inbox.",
    folder: "00 - Inbox",
    icon: FileText
  }
];

function todayBR() {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short"
  }).format(new Date());
}

function buildTemplateContent(template: TemplateKey, notes: string) {
  const baseFooter = `

---
Fonte: 2K Command OS
Criado em: ${todayBR()}
`;

  const cleanNotes = notes.trim() || "Sem observações adicionais.";

  if (template === "diario") {
    return `## Resumo do dia

${cleanNotes}

## Decisões tomadas

- 

## Pendências

- 

## Próximos passos

- 

## Pontos de atenção

- 
${baseFooter}`;
  }

  if (template === "cliente") {
    return `## Visão geral do cliente

${cleanNotes}

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
${baseFooter}`;
  }

  if (template === "producao") {
    return `## Resumo da produção

${cleanNotes}

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
${baseFooter}`;
  }

  if (template === "financeiro") {
    return `## Registro financeiro

${cleanNotes}

## Tipo

- [ ] Cobrança
- [ ] NF
- [ ] Pagamento
- [ ] Custo
- [ ] Conferência

## Valor

R$ 

## Status

- 

## Responsável

- 

## Próxima ação

- 
${baseFooter}`;
  }

  if (template === "problema") {
    return `## Problema identificado

${cleanNotes}

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
${baseFooter}`;
  }

  if (template === "automacao") {
    return `## Ideia / Automação

${cleanNotes}

## Objetivo

- 

## Entrada de dados

- 

## Saída esperada

- 

## Ferramentas envolvidas

- 2K Command OS
- Obsidian
- Planilha
- Discord
- IA

## Status

- [ ] Ideia
- [ ] Em desenvolvimento
- [ ] Testando
- [ ] Funcionando

## Próximo passo

- 
${baseFooter}`;
  }

  if (template === "agenda") {
    return `## Pauta

${cleanNotes}

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
${baseFooter}`;
  }

  return `${cleanNotes}${baseFooter}`;
}

export function Obsidian() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>("diario");
  const [title, setTitle] = useState("");
  const [folder, setFolder] = useState("01 - Diário Operacional");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [createdFile, setCreatedFile] = useState("");

  const activeTemplate = templates.find((item) => item.key === selectedTemplate) ?? templates[0];

  const preview = useMemo(() => {
    return buildTemplateContent(selectedTemplate, notes);
  }, [selectedTemplate, notes]);

  function selectTemplate(template: TemplateKey) {
    const item = templates.find((entry) => entry.key === template);

    setSelectedTemplate(template);

    if (item) {
      setFolder(item.folder);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!title.trim()) {
      setMessage("Informe um título para a nota.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setCreatedFile("");

      const response = await api.post<ObsidianResponse>("/api/obsidian/note", {
        title: title.trim(),
        folder,
        content: preview
      });

      setCreatedFile(response.data.file);
      setMessage("Nota criada com sucesso no Obsidian.");
      setTitle("");
      setNotes("");
    } catch {
      setMessage("Erro ao criar nota. Verifique o backend e a rota do Obsidian.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="obs-page">
      <section className="obs-hero">
        <div>
          <p className="obs-overline">Obsidian / Base de Conhecimento</p>
          <h1>Documentação operacional conectada ao Command OS.</h1>
          <p>
            Crie notas estruturadas para clientes, produções, financeiro, problemas,
            automações, reuniões e registros diários sem sair do painel.
          </p>

          <div className="obs-tags">
            <span>2K-OS</span>
            <span>Documentação</span>
            <span>Processos</span>
            <span>Conhecimento</span>
          </div>
        </div>

        <div className="obs-hero-card">
          <Sparkles size={30} />
          <span>Template ativo</span>
          <strong>{activeTemplate.title}</strong>
          <small>{folder}</small>
        </div>
      </section>

      <section className="obs-template-grid">
        {templates.map((template) => {
          const Icon = template.icon;

          return (
            <button
              type="button"
              className={`obs-template-card ${
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

      <section className="obs-main-grid">
        <form className="obs-panel obs-form" onSubmit={handleSubmit}>
          <div className="obs-panel-header">
            <div>
              <p className="obs-overline">Criar nota</p>
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
            <span>Pasta do Obsidian</span>
            <select value={folder} onChange={(event) => setFolder(event.target.value)}>
              {folders.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Observações principais</span>
            <textarea
              placeholder="Digite aqui o conteúdo base. O Command OS vai organizar no template selecionado."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={10}
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="obs-spin" size={18} />
                Criando nota...
              </>
            ) : (
              <>
                <Save size={18} />
                Criar nota no Obsidian
              </>
            )}
          </button>

          {message && (
            <div className={createdFile ? "obs-message success" : "obs-message"}>
              {createdFile ? <CheckCircle2 size={16} /> : <FolderOpen size={16} />}
              <span>{message}</span>
            </div>
          )}

          {createdFile && (
            <div className="obs-created-file">
              <span>Arquivo criado</span>
              <strong>{createdFile}</strong>
            </div>
          )}
        </form>

        <aside className="obs-panel obs-preview">
          <div className="obs-panel-header">
            <div>
              <p className="obs-overline">Preview</p>
              <h2>Conteúdo que será salvo</h2>
            </div>
            <FileText />
          </div>

          <pre>{`# ${title || "Título da nota"}

${preview}`}</pre>
        </aside>
      </section>

      <section className="obs-panel">
        <div className="obs-panel-header">
          <div>
            <p className="obs-overline">Estrutura recomendada</p>
            <h2>Pastas do vault 2K-OS</h2>
          </div>
          <FolderOpen />
        </div>

        <div className="obs-folder-grid">
          {folders.map((item) => (
            <div key={item}>
              <FolderOpen size={16} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
