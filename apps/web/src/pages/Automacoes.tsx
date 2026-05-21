import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Database,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCw,
  ServerCog,
  Sparkles,
  Workflow,
  Zap
} from "lucide-react";

import "./Automacoes.css";

type TaskStatus = "Pendente" | "Em andamento" | "Concluída";

type Task = {
  id: string;
  title: string;
  area: string;
  priority: string;
  status: TaskStatus;
  createdAt?: string;
};

type EntradaFinanceira = {
  mesRef: string | null;
  grupo: string | null;
  marca: string | null;
  projeto: string | null;
  valor: number;
  nf: string | number | null;
  status: string | null;
  dataEmissao: string | null;
  previsaoRecebimento: string | null;
  diasParaReceber?: number | null;
  recebido: string | null;
  observacao: string | null;
  id: string | null;
};

type ImportSummary = {
  lastImport: {
    arquivoOriginal: string;
    salvoEm: string;
    importadoEm: string;
    entradas: number;
    saidas: number;
    grupos: number;
    marcas: number;
  } | null;
  dashboardFinanceiro: {
    atualizadoEm: string;
    resumo: {
      totalFaturado: number;
      totalRecebido: number;
      totalAReceber: number;
      totalAtrasado?: number;
      totalPreFaturamento?: number;
      totalSaidas: number;
      totalSaidasPagas?: number;
      lucroCompetencia: number;
      resultadoCaixa: number;
      margemCompetencia: number;
      quantidadeProjetos: number;
      quantidadeSaidas: number;
      quantidadeGrupos: number;
      quantidadeMarcas: number;
    };
  } | null;
};

type AutomationAction = {
  id: string;
  type: "Cobrança" | "Follow-up" | "Gerar NF" | "Confirmar info" | "Conferência";
  title: string;
  client: string;
  value: number;
  status: string | null;
  date: string | null;
  priority: "Alta" | "Média" | "Baixa";
  area: string;
  description: string;
};

type ViewMode = "acoes" | "saude" | "roadmap";

function normalize(value?: string | null) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value || 0);
}

function formatDate(value?: string | null) {
  if (!value) return "Sem data";

  const date = parseDate(value);

  if (!date) return value;

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return "Sem importação";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

function parseDate(value?: string | null) {
  if (!value) return null;

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }

  const br = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(value);

  if (br) {
    return new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function getDaysFromToday(value?: string | null) {
  const date = parseDate(value);

  if (!date) return null;

  const today = new Date();

  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getDateLabel(value?: string | null) {
  const days = getDaysFromToday(value);

  if (days === null) return "Sem data";
  if (days === 0) return "Hoje";
  if (days === 1) return "Amanhã";
  if (days === -1) return "Ontem";
  if (days < 0) return `${Math.abs(days)} dias atrasado`;

  return `Em ${days} dias`;
}

function getActionClass(type: AutomationAction["type"]) {
  if (type === "Cobrança") return "autoops-action-type danger";
  if (type === "Follow-up") return "autoops-action-type warning";
  if (type === "Gerar NF") return "autoops-action-type cyan";
  if (type === "Confirmar info") return "autoops-action-type purple";

  return "autoops-action-type neutral";
}

function getPriorityClass(priority: AutomationAction["priority"]) {
  if (priority === "Alta") return "autoops-priority high";
  if (priority === "Média") return "autoops-priority medium";

  return "autoops-priority low";
}

function getHealthClass(ok: boolean) {
  return ok ? "autoops-health-dot online" : "autoops-health-dot offline";
}

export function Automacoes() {
  const [apiOnline, setApiOnline] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entradas, setEntradas] = useState<EntradaFinanceira[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingTaskId, setCreatingTaskId] = useState<string | null>(null);
  const [createdActionIds, setCreatedActionIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("acoes");
  const [message, setMessage] = useState("");

  async function loadAutomationData() {
    try {
      setLoading(true);
      setMessage("");

      const [healthResponse, summaryResponse, tasksResponse, entradasResponse] =
        await Promise.all([
          api.get("/health"),
          api.get<ImportSummary>("/api/import/fluxo/summary"),
          api.get<Task[]>("/api/tasks"),
          api.get<EntradaFinanceira[]>("/api/financeiro/entradas")
        ]);

      setApiOnline(healthResponse.data?.status === "online");
      setSummary(summaryResponse.data);
      setTasks(tasksResponse.data);
      setEntradas(entradasResponse.data);
    } catch {
      setApiOnline(false);
      setMessage("Erro ao carregar automações. Verifique se o backend está rodando.");
    } finally {
      setLoading(false);
    }
  }

  async function createTaskFromAction(action: AutomationAction) {
    try {
      setCreatingTaskId(action.id);
      setMessage("");

      await api.post("/api/tasks", {
        title: `[${action.type}] ${action.title}`,
        area: action.area,
        priority: action.priority
      });

      setCreatedActionIds((current) => [...current, action.id]);

      const tasksResponse = await api.get<Task[]>("/api/tasks");
      setTasks(tasksResponse.data);

      setMessage("Tarefa criada com sucesso a partir da automação.");
    } catch {
      setMessage("Erro ao criar tarefa. Verifique o backend.");
    } finally {
      setCreatingTaskId(null);
    }
  }

  useEffect(() => {
    loadAutomationData();
  }, []);

  const resumo = summary?.dashboardFinanceiro?.resumo;

  const openTasks = tasks.filter((task) => task.status !== "Concluída");
  const pendingTasks = tasks.filter((task) => task.status === "Pendente");
  const progressTasks = tasks.filter((task) => task.status === "Em andamento");

  const automationActions = useMemo<AutomationAction[]>(() => {
    const actions: AutomationAction[] = [];

    for (const item of entradas) {
      const status = normalize(item.status);
      const days = getDaysFromToday(item.previsaoRecebimento);
      const title = item.projeto || "Projeto sem nome";
      const client = item.grupo || "Sem grupo";
      const value = item.valor || 0;

      if (status.includes("aguardando") && days !== null && days < 0) {
        actions.push({
          id: `cobranca-${item.id}-${item.projeto}`,
          type: "Cobrança",
          title,
          client,
          value,
          status: item.status,
          date: item.previsaoRecebimento,
          priority: "Alta",
          area: "Financeiro",
          description: "Recebimento aguardando pagamento com data vencida."
        });
      }

      if (status.includes("atrasado")) {
        actions.push({
          id: `atrasado-${item.id}-${item.projeto}`,
          type: "Cobrança",
          title,
          client,
          value,
          status: item.status,
          date: item.previsaoRecebimento,
          priority: "Alta",
          area: "Financeiro",
          description: "Item marcado como atrasado na planilha."
        });
      }

      if (status.includes("aguardando") && days !== null && days >= 0 && days <= 7) {
        actions.push({
          id: `followup-${item.id}-${item.projeto}`,
          type: "Follow-up",
          title,
          client,
          value,
          status: item.status,
          date: item.previsaoRecebimento,
          priority: "Média",
          area: "Financeiro",
          description: "Recebimento próximo. Acompanhar antes do vencimento."
        });
      }

      if (status.includes("gerar") || status.includes("nf a enviar")) {
        actions.push({
          id: `nf-${item.id}-${item.projeto}`,
          type: "Gerar NF",
          title,
          client,
          value,
          status: item.status,
          date: item.dataEmissao,
          priority: "Média",
          area: "Financeiro",
          description: "Projeto em etapa de emissão ou envio de nota fiscal."
        });
      }

      if (status.includes("confirmar")) {
        actions.push({
          id: `confirmar-${item.id}-${item.projeto}`,
          type: "Confirmar info",
          title,
          client,
          value,
          status: item.status,
          date: item.dataEmissao,
          priority: "Baixa",
          area: "Operacional",
          description: "Informações pendentes antes de avançar o fluxo."
        });
      }
    }

    const unique = actions.filter(
      (action, index, array) => array.findIndex((item) => item.id === action.id) === index
    );

    return unique.sort((a, b) => {
      const priorityWeight = {
        Alta: 0,
        Média: 1,
        Baixa: 2
      };

      const priorityDiff = priorityWeight[a.priority] - priorityWeight[b.priority];

      if (priorityDiff !== 0) return priorityDiff;

      const da = parseDate(a.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const db = parseDate(b.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;

      return da - db;
    });
  }, [entradas]);

  const criticalActions = automationActions.filter((action) => action.priority === "Alta");
  const mediumActions = automationActions.filter((action) => action.priority === "Média");
  const lowActions = automationActions.filter((action) => action.priority === "Baixa");

  const systemHealth = [
    {
      label: "API local",
      value: apiOnline ? "Online" : "Offline",
      description: "Backend em localhost:3333",
      ok: apiOnline,
      icon: ServerCog
    },
    {
      label: "Planilha",
      value: summary?.lastImport ? "Importada" : "Pendente",
      description: formatDateTime(summary?.lastImport?.importadoEm),
      ok: Boolean(summary?.lastImport),
      icon: FileSpreadsheet
    },
    {
      label: "Entradas",
      value: String(summary?.lastImport?.entradas ?? entradas.length),
      description: "Registros financeiros de entrada",
      ok: entradas.length > 0,
      icon: Database
    },
    {
      label: "Tarefas abertas",
      value: String(openTasks.length),
      description: `${pendingTasks.length} pendente(s), ${progressTasks.length} em andamento`,
      ok: openTasks.length === 0,
      icon: Workflow
    }
  ];

  const roadmapItems = [
    {
      title: "Importação pelo portal",
      description: "Upload da planilha pelo Financeiro e persistência no backend.",
      done: Boolean(summary?.lastImport)
    },
    {
      title: "Dashboard executivo",
      description: "Visão geral de faturamento, caixa, saídas, margem e riscos.",
      done: true
    },
    {
      title: "Produções operacionais",
      description: "Pipeline, tabela e análise dos projetos importados.",
      done: true
    },
    {
      title: "CRM de clientes",
      description: "Carteira de grupos, marcas e projetos vinculados.",
      done: true
    },
    {
      title: "Agenda de follow-up",
      description: "Prazos, atrasos, próximos recebimentos e timeline.",
      done: true
    },
    {
      title: "Criação de tarefas por automação",
      description: "Converter alerta financeiro em tarefa operacional.",
      done: true
    },
    {
      title: "Obsidian operacional",
      description: "Gerar notas estruturadas na base de conhecimento.",
      done: true
    },
    {
      title: "Google Sheets automático",
      description: "Futuro: sincronizar dados sem upload manual.",
      done: false
    },
    {
      title: "Notificações Discord",
      description: "Futuro: enviar alertas do Command OS para canais internos.",
      done: false
    }
  ];

  return (
    <div className="autoops-page">
      <section className="autoops-header">
        <div>
          <p className="autoops-overline">Automações / Central de Ações</p>
          <h1>Alertas operacionais convertidos em tarefas reais.</h1>
          <p>
            Esta tela detecta pendências financeiras e operacionais, mostra a saúde do sistema
            e permite criar tarefas diretamente a partir dos alertas encontrados na planilha.
          </p>
        </div>

        <div className="autoops-header-card">
          <Bot size={30} />
          <span>Ações detectadas</span>
          <strong>{automationActions.length}</strong>
          <small>{criticalActions.length} críticas · {mediumActions.length} médias</small>
        </div>
      </section>

      {message && <div className="autoops-message">{message}</div>}

      <section className="autoops-kpi-grid">
        <div className="autoops-kpi-card danger">
          <div>
            <span>Críticas</span>
            <strong>{criticalActions.length}</strong>
            <small>cobranças e atrasos</small>
          </div>
          <AlertTriangle />
        </div>

        <div className="autoops-kpi-card warning">
          <div>
            <span>Médias</span>
            <strong>{mediumActions.length}</strong>
            <small>follow-up e NF</small>
          </div>
          <Clock3 />
        </div>

        <div className="autoops-kpi-card info">
          <div>
            <span>Baixas</span>
            <strong>{lowActions.length}</strong>
            <small>confirmações e revisão</small>
          </div>
          <Sparkles />
        </div>

        <div className="autoops-kpi-card success">
          <div>
            <span>Tarefas abertas</span>
            <strong>{openTasks.length}</strong>
            <small>criadas ou em andamento</small>
          </div>
          <Workflow />
        </div>
      </section>

      <section className="autoops-tabs">
        <button
          type="button"
          className={viewMode === "acoes" ? "active" : ""}
          onClick={() => setViewMode("acoes")}
        >
          <Zap size={16} />
          Ações
        </button>

        <button
          type="button"
          className={viewMode === "saude" ? "active" : ""}
          onClick={() => setViewMode("saude")}
        >
          <Activity size={16} />
          Saúde do sistema
        </button>

        <button
          type="button"
          className={viewMode === "roadmap" ? "active" : ""}
          onClick={() => setViewMode("roadmap")}
        >
          <CheckCircle2 size={16} />
          Roadmap
        </button>
      </section>

      {viewMode === "acoes" && (
        <section className="autoops-main-grid">
          <div className="autoops-panel autoops-actions-panel">
            <div className="autoops-panel-header">
              <div>
                <p className="autoops-overline">Fila operacional</p>
                <h2>Ações sugeridas pela planilha</h2>
              </div>

              <button type="button" onClick={loadAutomationData}>
                {loading ? <Loader2 className="autoops-spin" size={16} /> : <RefreshCw size={16} />}
                Atualizar
              </button>
            </div>

            <div className="autoops-action-list">
              {loading && <div className="autoops-empty">Carregando automações...</div>}

              {!loading &&
                automationActions.map((action) => {
                  const alreadyCreated = createdActionIds.includes(action.id);

                  return (
                    <article className="autoops-action-row" key={action.id}>
                      <div className="autoops-action-main">
                        <div className="autoops-action-title">
                          <span className={getActionClass(action.type)}>
                            {action.type}
                          </span>

                          <span className={getPriorityClass(action.priority)}>
                            {action.priority}
                          </span>
                        </div>

                        <strong>{action.title}</strong>
                        <p>{action.description}</p>

                        <div className="autoops-action-meta">
                          <span>{action.client}</span>
                          <span>{formatMoney(action.value)}</span>
                          <span>{formatDate(action.date)} · {getDateLabel(action.date)}</span>
                          <span>{action.status ?? "Sem status"}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={alreadyCreated || creatingTaskId === action.id}
                        onClick={() => createTaskFromAction(action)}
                      >
                        {creatingTaskId === action.id ? (
                          <>
                            <Loader2 className="autoops-spin" size={15} />
                            Criando
                          </>
                        ) : alreadyCreated ? (
                          <>
                            <CheckCircle2 size={15} />
                            Criada
                          </>
                        ) : (
                          <>
                            <Workflow size={15} />
                            Criar tarefa
                          </>
                        )}
                      </button>
                    </article>
                  );
                })}

              {!loading && !automationActions.length && (
                <div className="autoops-empty">
                  Nenhuma ação crítica encontrada. A operação está limpa para os filtros atuais.
                </div>
              )}
            </div>
          </div>

          <aside className="autoops-side-stack">
            <div className="autoops-panel">
              <div className="autoops-panel-header">
                <div>
                  <p className="autoops-overline">Resumo financeiro</p>
                  <h2>Base de alertas</h2>
                </div>
                <FileSpreadsheet />
              </div>

              <div className="autoops-metric-list">
                <div>
                  <span>A receber</span>
                  <strong>{formatMoney(resumo?.totalAReceber ?? 0)}</strong>
                </div>

                <div>
                  <span>Pré-faturamento</span>
                  <strong>{formatMoney(resumo?.totalPreFaturamento ?? 0)}</strong>
                </div>

                <div>
                  <span>Atrasado</span>
                  <strong>{formatMoney(resumo?.totalAtrasado ?? 0)}</strong>
                </div>

                <div>
                  <span>Última importação</span>
                  <strong>{formatDateTime(summary?.lastImport?.importadoEm)}</strong>
                </div>
              </div>
            </div>

            <div className="autoops-panel">
              <div className="autoops-panel-header">
                <div>
                  <p className="autoops-overline">Atalhos</p>
                  <h2>Ir para módulos</h2>
                </div>
                <ArrowUpRight />
              </div>

              <div className="autoops-shortcuts">
                <a href="/financeiro">
                  <FileSpreadsheet size={16} />
                  Financeiro
                  <ArrowUpRight size={14} />
                </a>

                <a href="/agenda">
                  <CalendarClock size={16} />
                  Agenda
                  <ArrowUpRight size={14} />
                </a>

                <a href="/producoes">
                  <Database size={16} />
                  Produções
                  <ArrowUpRight size={14} />
                </a>

                <a href="/obsidian">
                  <FileText size={16} />
                  Obsidian
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          </aside>
        </section>
      )}

      {viewMode === "saude" && (
        <section className="autoops-panel">
          <div className="autoops-panel-header">
            <div>
              <p className="autoops-overline">Diagnóstico</p>
              <h2>Saúde do sistema local</h2>
            </div>

            <button type="button" onClick={loadAutomationData}>
              {loading ? <Loader2 className="autoops-spin" size={16} /> : <RefreshCw size={16} />}
              Verificar
            </button>
          </div>

          <div className="autoops-health-grid">
            {systemHealth.map((item) => {
              const Icon = item.icon;

              return (
                <div className="autoops-health-card" key={item.label}>
                  <div className={getHealthClass(item.ok)} />

                  <Icon />

                  <div>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <small>{item.description}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {viewMode === "roadmap" && (
        <section className="autoops-panel">
          <div className="autoops-panel-header">
            <div>
              <p className="autoops-overline">Roadmap técnico</p>
              <h2>Checklist das automações do Command OS</h2>
            </div>
            <CheckCircle2 />
          </div>

          <div className="autoops-roadmap-grid">
            {roadmapItems.map((item) => (
              <div className={item.done ? "autoops-roadmap-card done" : "autoops-roadmap-card"} key={item.title}>
                <div>
                  {item.done ? <CheckCircle2 size={18} /> : <Clock3 size={18} />}
                </div>

                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
