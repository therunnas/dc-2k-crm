import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Filter,
  Layers3,
  ListFilter,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Target,
  TrendingUp
} from "lucide-react";

import "./Producoes.css";

type Producao = {
  id: string | null;
  mesRef?: string | null;
  projeto: string | null;
  grupo: string | null;
  marca: string | null;
  valor: number;
  nf?: string | number | null;
  statusFinanceiro: string | null;
  dataEmissao?: string | null;
  previsaoRecebimento: string | null;
  diasParaReceber?: number | null;
  recebido?: string | null;
  etapa: string;
};

type ViewMode = "pipeline" | "tabela" | "analise";

type BucketKey =
  | "aguardando"
  | "atrasado"
  | "gerarNf"
  | "confirmarInfo"
  | "pago"
  | "outros";

type Bucket = {
  key: BucketKey;
  title: string;
  description: string;
  icon: typeof Clock3;
  items: Producao[];
  total: number;
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

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = parseDate(value);

  if (!date) return value;

  return new Intl.DateTimeFormat("pt-BR").format(date);
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

  if (days === null) return "Sem previsão";
  if (days === 0) return "Hoje";
  if (days === 1) return "Amanhã";
  if (days < 0) return `${Math.abs(days)} dias atrás`;

  return `Em ${days} dias`;
}

function getStatusClass(status?: string | null) {
  const value = normalize(status);

  if (value === "pago") return "prodops-status paid";
  if (value.includes("aguardando")) return "prodops-status waiting";
  if (value.includes("gerar")) return "prodops-status nf";
  if (value.includes("confirmar")) return "prodops-status info";
  if (value.includes("atrasado")) return "prodops-status late";

  return "prodops-status neutral";
}

function getProjectSortValue(item: Producao) {
  const date =
    parseDate(item.mesRef) ??
    parseDate(item.dataEmissao) ??
    parseDate(item.previsaoRecebimento);

  return date?.getTime() ?? Number.MAX_SAFE_INTEGER;
}

function getBucketKey(item: Producao): BucketKey {
  const status = normalize(item.statusFinanceiro);
  const days = getDaysFromToday(item.previsaoRecebimento);

  if (status === "pago") return "pago";

  if (status.includes("atrasado")) return "atrasado";

  if (status.includes("aguardando") && days !== null && days < 0) {
    return "atrasado";
  }

  if (status.includes("aguardando")) return "aguardando";

  if (status.includes("gerar") || status.includes("nf a enviar")) {
    return "gerarNf";
  }

  if (status.includes("confirmar")) return "confirmarInfo";

  return "outros";
}

function getBucketMeta(key: BucketKey) {
  const map = {
    aguardando: {
      title: "Aguardando pagamento",
      description: "NF emitida ou pagamento programado.",
      icon: Clock3
    },
    atrasado: {
      title: "Atrasados",
      description: "Recebimentos vencidos ou marcados como atrasados.",
      icon: AlertTriangle
    },
    gerarNf: {
      title: "Gerar NF",
      description: "Projetos em pré-faturamento.",
      icon: FileText
    },
    confirmarInfo: {
      title: "Confirmar info",
      description: "Itens que precisam de validação antes do faturamento.",
      icon: SlidersHorizontal
    },
    pago: {
      title: "Pagos",
      description: "Recebimentos confirmados.",
      icon: CheckCircle2
    },
    outros: {
      title: "Outros",
      description: "Itens fora dos status principais.",
      icon: Layers3
    }
  };

  return map[key];
}

export function Producoes() {
  const [producoes, setProducoes] = useState<Producao[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("pipeline");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [grupoFilter, setGrupoFilter] = useState("Todos");

  async function loadProducoes() {
    try {
      setLoading(true);
      setMessage("");

      const response = await api.get<Producao[]>("/api/producoes");
      setProducoes(response.data);
    } catch {
      setMessage("Erro ao carregar produções. Verifique se o backend está rodando e se a planilha foi importada.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducoes();
  }, []);

  const statuses = useMemo(() => {
    const values = producoes
      .map((item) => item.statusFinanceiro)
      .filter(Boolean)
      .map(String);

    return ["Todos", ...Array.from(new Set(values)).sort()];
  }, [producoes]);

  const grupos = useMemo(() => {
    const values = producoes
      .map((item) => item.grupo)
      .filter(Boolean)
      .map(String);

    return ["Todos", ...Array.from(new Set(values)).sort()];
  }, [producoes]);

  const filteredProducoes = useMemo(() => {
    return producoes
      .filter((item) => {
        const text = normalize(
          `${item.id} ${item.projeto} ${item.grupo} ${item.marca} ${item.statusFinanceiro} ${item.nf}`
        );

        const matchesSearch = !search || text.includes(normalize(search));
        const matchesStatus =
          statusFilter === "Todos" || item.statusFinanceiro === statusFilter;
        const matchesGrupo = grupoFilter === "Todos" || item.grupo === grupoFilter;

        return matchesSearch && matchesStatus && matchesGrupo;
      })
      .sort((a, b) => getProjectSortValue(a) - getProjectSortValue(b));
  }, [producoes, search, statusFilter, grupoFilter]);

  const buckets = useMemo<Bucket[]>(() => {
    const base: Record<BucketKey, Producao[]> = {
      aguardando: [],
      atrasado: [],
      gerarNf: [],
      confirmarInfo: [],
      pago: [],
      outros: []
    };

    for (const item of filteredProducoes) {
      base[getBucketKey(item)].push(item);
    }

    const order: BucketKey[] = [
      "atrasado",
      "aguardando",
      "gerarNf",
      "confirmarInfo",
      "pago",
      "outros"
    ];

    return order.map((key) => {
      const meta = getBucketMeta(key);
      const items = base[key];

      return {
        key,
        title: meta.title,
        description: meta.description,
        icon: meta.icon,
        items,
        total: items.reduce((sum, item) => sum + (item.valor || 0), 0)
      };
    });
  }, [filteredProducoes]);

  const stats = useMemo(() => {
    const totalValor = filteredProducoes.reduce((sum, item) => sum + (item.valor || 0), 0);

    const pagos = buckets.find((item) => item.key === "pago");
    const aguardando = buckets.find((item) => item.key === "aguardando");
    const atrasados = buckets.find((item) => item.key === "atrasado");
    const gerarNf = buckets.find((item) => item.key === "gerarNf");

    return {
      projetos: filteredProducoes.length,
      totalValor,
      pagos: pagos?.items.length ?? 0,
      aguardando: aguardando?.items.length ?? 0,
      atrasados: atrasados?.items.length ?? 0,
      gerarNf: gerarNf?.items.length ?? 0,
      totalPago: pagos?.total ?? 0,
      totalAguardando: aguardando?.total ?? 0,
      totalAtrasado: atrasados?.total ?? 0,
      totalGerarNf: gerarNf?.total ?? 0
    };
  }, [buckets, filteredProducoes]);

  const topGrupos = useMemo(() => {
    const map = new Map<string, { nome: string; total: number; quantidade: number }>();

    for (const item of filteredProducoes) {
      const nome = item.grupo || "Sem grupo";
      const current = map.get(nome) ?? {
        nome,
        total: 0,
        quantidade: 0
      };

      current.total += item.valor || 0;
      current.quantidade += 1;
      map.set(nome, current);
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [filteredProducoes]);

  return (
    <div className="prodops-page">
      <section className="prodops-header">
        <div>
          <p className="prodops-overline">Produções / Operação</p>
          <h1>Pipeline operacional dos projetos importados.</h1>
          <p>
            Acompanhe projetos por status financeiro, prazos, NF, cliente, marca e valor.
            Esta página é a visão operacional das produções, diferente do Dashboard e do Financeiro.
          </p>
        </div>

        <div className="prodops-header-card">
          <Target size={30} />
          <span>Projetos filtrados</span>
          <strong>{stats.projetos}</strong>
          <small>{formatMoney(stats.totalValor)} em valor total</small>
        </div>
      </section>

      {message && <div className="prodops-message">{message}</div>}

      <section className="prodops-kpi-grid">
        <div className="prodops-kpi-card late">
          <div>
            <span>Atrasados</span>
            <strong>{stats.atrasados}</strong>
            <small>{formatMoney(stats.totalAtrasado)}</small>
          </div>
          <AlertTriangle />
        </div>

        <div className="prodops-kpi-card waiting">
          <div>
            <span>Aguardando pagamento</span>
            <strong>{stats.aguardando}</strong>
            <small>{formatMoney(stats.totalAguardando)}</small>
          </div>
          <Clock3 />
        </div>

        <div className="prodops-kpi-card nf">
          <div>
            <span>Gerar NF</span>
            <strong>{stats.gerarNf}</strong>
            <small>{formatMoney(stats.totalGerarNf)}</small>
          </div>
          <FileText />
        </div>

        <div className="prodops-kpi-card paid">
          <div>
            <span>Pagos</span>
            <strong>{stats.pagos}</strong>
            <small>{formatMoney(stats.totalPago)}</small>
          </div>
          <CheckCircle2 />
        </div>
      </section>

      <section className="prodops-toolbar">
        <div className="prodops-search">
          <Search size={18} />
          <input
            placeholder="Buscar projeto, grupo, marca, NF ou status..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="prodops-select">
          <Filter size={18} />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="prodops-select">
          <ListFilter size={18} />
          <select
            value={grupoFilter}
            onChange={(event) => setGrupoFilter(event.target.value)}
          >
            {grupos.map((grupo) => (
              <option key={grupo}>{grupo}</option>
            ))}
          </select>
        </div>

        <button type="button" onClick={loadProducoes}>
          {loading ? <Loader2 className="prodops-spin" size={16} /> : <RefreshCw size={16} />}
          Atualizar
        </button>
      </section>

      <section className="prodops-tabs">
        <button
          type="button"
          className={viewMode === "pipeline" ? "active" : ""}
          onClick={() => setViewMode("pipeline")}
        >
          <Layers3 size={16} />
          Pipeline
        </button>

        <button
          type="button"
          className={viewMode === "tabela" ? "active" : ""}
          onClick={() => setViewMode("tabela")}
        >
          <FileText size={16} />
          Tabela
        </button>

        <button
          type="button"
          className={viewMode === "analise" ? "active" : ""}
          onClick={() => setViewMode("analise")}
        >
          <TrendingUp size={16} />
          Análise
        </button>
      </section>

      {viewMode === "pipeline" && (
        <section className="prodops-pipeline">
          {buckets.map((bucket) => {
            const Icon = bucket.icon;

            return (
              <div className={`prodops-column ${bucket.key}`} key={bucket.key}>
                <div className="prodops-column-header">
                  <div>
                    <p className="prodops-overline">{bucket.items.length} projeto(s)</p>
                    <h2>{bucket.title}</h2>
                    <span>{bucket.description}</span>
                  </div>
                  <Icon />
                </div>

                <div className="prodops-column-total">
                  <span>Total</span>
                  <strong>{formatMoney(bucket.total)}</strong>
                </div>

                <div className="prodops-card-list">
                  {bucket.items.slice(0, 12).map((item, index) => (
                    <article className="prodops-project-card" key={`${item.id}-${item.projeto}-${index}`}>
                      <div className="prodops-project-top">
                        <strong>{item.projeto || "Projeto sem nome"}</strong>
                        <span className={getStatusClass(item.statusFinanceiro)}>
                          {item.statusFinanceiro || "Sem status"}
                        </span>
                      </div>

                      <p>{item.grupo || "Sem grupo"} · {item.marca || "Sem marca"}</p>

                      <div className="prodops-project-meta">
                        <span>{formatMoney(item.valor)}</span>
                        <span>NF: {item.nf ?? "—"}</span>
                      </div>

                      <div className="prodops-project-date">
                        <CalendarDays size={14} />
                        <span>{formatDate(item.previsaoRecebimento)} · {getDateLabel(item.previsaoRecebimento)}</span>
                      </div>
                    </article>
                  ))}

                  {!bucket.items.length && (
                    <div className="prodops-empty">Nenhum projeto neste status.</div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {viewMode === "tabela" && (
        <section className="prodops-panel prodops-table-panel">
          <div className="prodops-panel-header">
            <div>
              <p className="prodops-overline">Tabela operacional</p>
              <h2>Projetos importados da planilha</h2>
            </div>
            <strong>{formatMoney(stats.totalValor)}</strong>
          </div>

          <div className="prodops-table">
            <div className="prodops-table-head">
              <span>ID</span>
              <span>Mês</span>
              <span>Projeto</span>
              <span>Grupo</span>
              <span>Marca</span>
              <span>Valor</span>
              <span>Status</span>
              <span>Emissão</span>
              <span>Previsão</span>
              <span>Dias</span>
              <span>NF</span>
              <span>Etapa</span>
            </div>

            {filteredProducoes.map((item, index) => (
              <div className="prodops-table-row" key={`${item.id}-${item.projeto}-${index}`}>
                <span>{item.id ?? "—"}</span>
                <span>{formatDate(item.mesRef)}</span>
                <span>{item.projeto ?? "—"}</span>
                <span>{item.grupo ?? "—"}</span>
                <span>{item.marca ?? "—"}</span>
                <span>{formatMoney(item.valor)}</span>
                <span>
                  <strong className={getStatusClass(item.statusFinanceiro)}>
                    {item.statusFinanceiro ?? "—"}
                  </strong>
                </span>
                <span>{formatDate(item.dataEmissao)}</span>
                <span>{formatDate(item.previsaoRecebimento)}</span>
                <span>{item.diasParaReceber ?? "—"}</span>
                <span>{item.nf ?? "—"}</span>
                <span>{item.etapa ?? "—"}</span>
              </div>
            ))}

            {!filteredProducoes.length && (
              <div className="prodops-empty">Nenhum projeto encontrado.</div>
            )}
          </div>
        </section>
      )}

      {viewMode === "analise" && (
        <section className="prodops-analysis-grid">
          <div className="prodops-panel">
            <div className="prodops-panel-header">
              <div>
                <p className="prodops-overline">Status</p>
                <h2>Resumo por etapa operacional</h2>
              </div>
              <CircleDollarSign />
            </div>

            <div className="prodops-status-summary">
              {buckets.map((bucket) => (
                <div key={bucket.key}>
                  <span>{bucket.title}</span>
                  <strong>{formatMoney(bucket.total)}</strong>
                  <small>{bucket.items.length} projeto(s)</small>
                </div>
              ))}
            </div>
          </div>

          <div className="prodops-panel">
            <div className="prodops-panel-header">
              <div>
                <p className="prodops-overline">Clientes</p>
                <h2>Top grupos nas produções</h2>
              </div>
              <ArrowIcon />
            </div>

            <div className="prodops-ranking-list">
              {topGrupos.map((grupo, index) => (
                <div key={grupo.nome}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{grupo.nome}</strong>
                    <small>{grupo.quantidade} projeto(s)</small>
                  </div>
                  <p>{formatMoney(grupo.total)}</p>
                </div>
              ))}

              {!topGrupos.length && (
                <div className="prodops-empty">Nenhum grupo encontrado.</div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function ArrowIcon() {
  return <TrendingUp size={22} />;
}
