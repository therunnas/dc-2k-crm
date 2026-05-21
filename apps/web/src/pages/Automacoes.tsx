import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Database,
  FileSpreadsheet,
  FileText,
  Link2,
  Loader2,
  RefreshCw,
  Rocket,
  ServerCog,
  Sparkles,
  Workflow,
  Zap
} from "lucide-react";

import "./Automacoes.css";

type Task = {
  id: string;
  title: string;
  area: string;
  priority: string;
  status: "Pendente" | "Em andamento" | "Concluída";
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

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  date.setHours(0, 0, 0, 0);
  return date;
}

function getDaysFromToday(value?: string | null) {
  const date = parseDate(value);

  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = date.getTime() - today.getTime();

  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function getStatusClass(status?: string | null) {
  const value = normalize(status);

  if (value === "pago") return "auto-status paid";
  if (value.includes("aguardando")) return "auto-status waiting";
  if (value.includes("gerar")) return "auto-status nf";
  if (value.includes("confirmar")) return "auto-status info";
  if (value.includes("atrasado")) return "auto-status late";

  return "auto-status neutral";
}

export function Automacoes() {
  const [apiOnline, setApiOnline] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entradas, setEntradas] = useState<EntradaFinanceira[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadAutomationData();
  }, []);

  const resumo = summary?.dashboardFinanceiro?.resumo;

  const pendingTasks = tasks.filter((task) => task.status === "Pendente");
  const progressTasks = tasks.filter((task) => task.status === "Em andamento");

  const gerarNf = entradas.filter((item) =>
    normalize(item.status).includes("gerar")
  );

  const confirmarInfo = entradas.filter((item) =>
    normalize(item.status).includes("confirmar")
  );

  const atrasados = entradas.filter((item) => {
    const status = normalize(item.status);
    const days = getDaysFromToday(item.previsaoRecebimento);

    if (status.includes("pago")) return false;
    if (status.includes("atrasado")) return true;

    return status.includes("aguardando") && days !== null && days < 0;
  });

  const followUp7Dias = entradas.filter((item) => {
    const status = normalize(item.status);
    const days = getDaysFromToday(item.previsaoRecebimento);

    return (
      status.includes("aguardando") &&
      days !== null &&
      days >= 0 &&
      days <= 7
    );
  });

  const automationQueue = useMemo(() => {
    const queue = [
      ...atrasados.map((item) => ({
        type: "Cobrança",
        title: item.projeto,
        client: item.grupo,
        value: item.valor,
        status: item.status,
        date: item.previsaoRecebimento,
        priority: "Alta"
      })),
      ...followUp7Dias.map((item) => ({
        type: "Follow-up",
        title: item.projeto,
        client: item.grupo,
        value: item.valor,
        status: item.status,
        date: item.previsaoRecebimento,
        priority: "Média"
      })),
      ...gerarNf.map((item) => ({
        type: "Gerar NF",
        title: item.projeto,
        client: item.grupo,
        value: item.valor,
        status: item.status,
        date: item.dataEmissao,
        priority: "Média"
      })),
      ...confirmarInfo.map((item) => ({
        type: "Confirmar info",
        title: item.projeto,
        client: item.grupo,
        value: item.valor,
        status: item.status,
        date: item.dataEmissao,
        priority: "Baixa"
      }))
    ];

    return queue.slice(0, 18);
  }, [atrasados, confirmarInfo, followUp7Dias, gerarNf]);

  const automationCards = [
    {
      title: "API local",
      value: apiOnline ? "Online" : "Offline",
      description: "Backend Express em localhost:3333",
      icon: ServerCog,
      state: apiOnline ? "good" : "bad"
    },
    {
      title: "Planilha",
      value: summary?.lastImport ? "Importada" : "Pendente",
      description: formatDateTime(summary?.lastImport?.importadoEm),
      icon: FileSpreadsheet,
      state: summary?.lastImport ? "good" : "warn"
    },
    {
      title: "Tarefas abertas",
      value: String(pendingTasks.length + progressTasks.length),
      description: `${pendingTasks.length} pendente(s), ${progressTasks.length} em andamento`,
      icon: Workflow,
      state: pendingTasks.length + progressTasks.length > 0 ? "warn" : "good"
    },
    {
      title: "Alertas financeiros",
      value: String(atrasados.length + followUp7Dias.length + gerarNf.length),
      description: "Cobrança, follow-up e emissão de NF",
      icon: AlertTriangle,
      state: atrasados.length > 0 ? "bad" : "warn"
    }
  ];

  const runbookItems = [
    {
      title: "Importação financeira",
      description: "Planilha Fluxo 2026 alimentando dashboard, financeiro, clientes, produções e agenda.",
      done: Boolean(summary?.lastImport)
    },
    {
      title: "Monitoramento de cobrança",
      description: "Itens aguardando pagamento e atrasados são detectados pela data de previsão.",
      done: entradas.length > 0
    },
    {
      title: "Geração de tarefas",
      description: "Tarefas manuais já estão funcionando no dashboard.",
      done: true
    },
    {
      title: "Obsidian",
      description: "Notas podem ser criadas via backend; falta uma tela operacional mais completa.",
      done: false
    },
    {
      title: "Discord",
      description: "Widget do servidor já está integrado no dashboard.",
      done: true
    },
    {
      title: "Google Sheets automático",
      description: "Futuro: puxar dados direto da nuvem sem upload manual.",
      done: false
    }
  ];

  return (
    <div className="auto-page">
      <section className="auto-hero">
        <div>
          <p className="auto-overline">Automações / Command Center</p>
          <h1>Central de rotinas, alertas e integrações operacionais.</h1>
          <p>
            Monitore a saúde do sistema, acompanhe alertas financeiros, veja a fila
            de ações sugeridas e organize os próximos passos de automação da 2K Studios.
          </p>

          <div className="auto-tags">
            <span>API</span>
            <span>Planilha</span>
            <span>Financeiro</span>
            <span>Obsidian</span>
            <span>Discord</span>
          </div>
        </div>

        <div className="auto-hero-card">
          <Bot size={30} />
          <span>Fila operacional</span>
          <strong>{automationQueue.length}</strong>
          <small>ações detectadas automaticamente</small>
        </div>
      </section>

      {message && <div className="auto-message">{message}</div>}

      <section className="auto-card-grid">
        {automationCards.map((card) => {
          const Icon = card.icon;

          return (
            <div className={`auto-status-card ${card.state}`} key={card.title}>
              <div>
                <span>{card.title}</span>
                <strong>{card.value}</strong>
                <small>{card.description}</small>
              </div>
              <Icon />
            </div>
          );
        })}
      </section>

      <section className="auto-main-grid">
        <div className="auto-panel auto-queue-panel">
          <div className="auto-panel-header">
            <div>
              <p className="auto-overline">Fila de automação</p>
              <h2>Ações sugeridas pelo sistema</h2>
            </div>

            <button className="auto-icon-button" type="button" onClick={loadAutomationData}>
              {loading ? <Loader2 className="auto-spin" size={16} /> : <RefreshCw size={16} />}
            </button>
          </div>

          <div className="auto-queue-list">
            {automationQueue.map((item, index) => (
              <div className="auto-queue-row" key={`${item.type}-${item.title}-${index}`}>
                <div className="auto-queue-icon">
                  {item.type === "Cobrança" && <AlertTriangle size={16} />}
                  {item.type === "Follow-up" && <Clock3 size={16} />}
                  {item.type === "Gerar NF" && <FileText size={16} />}
                  {item.type === "Confirmar info" && <Sparkles size={16} />}
                </div>

                <div className="auto-queue-content">
                  <div className="auto-queue-title">
                    <strong>{item.type}</strong>
                    <span className={`auto-priority ${item.priority.toLowerCase()}`}>
                      {item.priority}
                    </span>
                  </div>

                  <p>{item.title ?? "Projeto sem nome"}</p>

                  <div className="auto-queue-meta">
                    <span>{item.client ?? "Sem grupo"}</span>
                    <span>{formatMoney(item.value)}</span>
                    <span className={getStatusClass(item.status)}>
                      {item.status ?? "Sem status"}
                    </span>
                  </div>
                </div>

                <div className="auto-queue-date">
                  <span>{item.date ? formatDateTime(item.date).split(",")[0] : "Sem data"}</span>
                </div>
              </div>
            ))}

            {!automationQueue.length && (
              <div className="auto-empty">
                Nenhuma ação crítica encontrada no momento.
              </div>
            )}
          </div>
        </div>

        <aside className="auto-side-stack">
          <div className="auto-panel">
            <div className="auto-panel-header">
              <div>
                <p className="auto-overline">Financeiro</p>
                <h2>Resumo dos alertas</h2>
              </div>
              <CircleDollarSign />
            </div>

            <div className="auto-metric-list">
              <div>
                <span>A receber</span>
                <strong>{formatMoney(resumo?.totalAReceber ?? 0)}</strong>
              </div>

              <div>
                <span>Atrasados detectados</span>
                <strong>{atrasados.length}</strong>
              </div>

              <div>
                <span>Gerar NF</span>
                <strong>{gerarNf.length}</strong>
              </div>

              <div>
                <span>Confirmar info</span>
                <strong>{confirmarInfo.length}</strong>
              </div>
            </div>
          </div>

          <div className="auto-panel">
            <div className="auto-panel-header">
              <div>
                <p className="auto-overline">Atalhos</p>
                <h2>Ações rápidas</h2>
              </div>
              <Rocket />
            </div>

            <div className="auto-shortcuts">
              <a href="/financeiro">
                <FileSpreadsheet size={16} />
                Importar planilha
                <ArrowUpRight size={14} />
              </a>

              <a href="/agenda">
                <CalendarClock size={16} />
                Ver agenda operacional
                <ArrowUpRight size={14} />
              </a>

              <a href="/producoes">
                <Database size={16} />
                Conferir produções
                <ArrowUpRight size={14} />
              </a>

              <a href="/clientes">
                <Link2 size={16} />
                Ver CRM de clientes
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </aside>
      </section>

      <section className="auto-panel">
        <div className="auto-panel-header">
          <div>
            <p className="auto-overline">Roadmap técnico</p>
            <h2>Checklist das automações do Command OS</h2>
          </div>
          <Zap />
        </div>

        <div className="auto-runbook-grid">
          {runbookItems.map((item) => (
            <div className={item.done ? "auto-runbook done" : "auto-runbook"} key={item.title}>
              <div>
                {item.done ? <CheckCircle2 size={18} /> : <Clock3 size={18} />}
              </div>

              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}