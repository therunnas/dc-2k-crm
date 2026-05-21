import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  Layers3,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  TimerReset
} from "lucide-react";

import "./Agenda.css";

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

type AgendaType = "Recebimento" | "Emissão NF" | "Referência";
type ViewMode = "prioridade" | "timeline" | "tabela";

type AgendaItem = {
  id: string;
  type: AgendaType;
  date: string | null;
  project: string | null;
  group: string | null;
  brand: string | null;
  value: number;
  status: string | null;
  nf?: string | number | null;
  source: Producao;
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

function formatDate(value?: string | null) {
  const date = parseDate(value);

  if (!date) return "Sem data";

  return new Intl.DateTimeFormat("pt-BR").format(date);
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

function isPaid(status?: string | null) {
  return normalize(status) === "pago";
}

function getStatusClass(status?: string | null) {
  const value = normalize(status);

  if (value === "pago") return "agenda-status paid";
  if (value.includes("aguardando")) return "agenda-status waiting";
  if (value.includes("gerar")) return "agenda-status nf";
  if (value.includes("confirmar")) return "agenda-status info";
  if (value.includes("atrasado")) return "agenda-status late";

  return "agenda-status neutral";
}

function getUrgencyClass(item: AgendaItem) {
  const days = getDaysFromToday(item.date);

  if (isPaid(item.status)) return "done";
  if (days === null) return "neutral";
  if (days < 0) return "late";
  if (days <= 7) return "soon";
  if (days <= 30) return "month";

  return "future";
}

function getAgendaSortValue(item: AgendaItem) {
  return parseDate(item.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
}

export function Agenda() {
  const [producoes, setProducoes] = useState<Producao[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("prioridade");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");

  async function loadAgenda() {
    try {
      setLoading(true);
      setMessage("");

      const response = await api.get<Producao[]>("/api/producoes");
      setProducoes(response.data);
    } catch {
      setMessage("Erro ao carregar Agenda. Verifique se o backend está rodando e se a planilha foi importada.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAgenda();
  }, []);

  const agendaItems = useMemo<AgendaItem[]>(() => {
    const items: AgendaItem[] = [];

    producoes.forEach((producao, index) => {
      if (producao.previsaoRecebimento) {
        items.push({
          id: `${producao.id ?? index}-recebimento`,
          type: "Recebimento",
          date: producao.previsaoRecebimento,
          project: producao.projeto,
          group: producao.grupo,
          brand: producao.marca,
          value: producao.valor,
          status: producao.statusFinanceiro,
          nf: producao.nf,
          source: producao
        });
      }

      if (producao.dataEmissao) {
        items.push({
          id: `${producao.id ?? index}-emissao`,
          type: "Emissão NF",
          date: producao.dataEmissao,
          project: producao.projeto,
          group: producao.grupo,
          brand: producao.marca,
          value: producao.valor,
          status: producao.statusFinanceiro,
          nf: producao.nf,
          source: producao
        });
      }

      if (producao.mesRef) {
        items.push({
          id: `${producao.id ?? index}-referencia`,
          type: "Referência",
          date: producao.mesRef,
          project: producao.projeto,
          group: producao.grupo,
          brand: producao.marca,
          value: producao.valor,
          status: producao.statusFinanceiro,
          nf: producao.nf,
          source: producao
        });
      }
    });

    return items.sort((a, b) => getAgendaSortValue(a) - getAgendaSortValue(b));
  }, [producoes]);

  const statuses = useMemo(() => {
    const values = agendaItems
      .map((item) => item.status)
      .filter(Boolean)
      .map(String);

    return ["Todos", ...Array.from(new Set(values)).sort()];
  }, [agendaItems]);

  const types = ["Todos", "Recebimento", "Emissão NF", "Referência"];

  const filteredItems = useMemo(() => {
    return agendaItems.filter((item) => {
      const text = normalize(
        `${item.type} ${item.project} ${item.group} ${item.brand} ${item.status} ${item.nf}`
      );

      const matchesSearch = !search || text.includes(normalize(search));
      const matchesType = typeFilter === "Todos" || item.type === typeFilter;
      const matchesStatus = statusFilter === "Todos" || item.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [agendaItems, search, typeFilter, statusFilter]);

  const lateItems = useMemo(() => {
    return filteredItems.filter((item) => {
      const days = getDaysFromToday(item.date);

      return (
        item.type === "Recebimento" &&
        days !== null &&
        days < 0 &&
        !isPaid(item.status)
      );
    });
  }, [filteredItems]);

  const todayItems = useMemo(() => {
    return filteredItems.filter((item) => getDaysFromToday(item.date) === 0);
  }, [filteredItems]);

  const next7Items = useMemo(() => {
    return filteredItems.filter((item) => {
      const days = getDaysFromToday(item.date);

      return (
        days !== null &&
        days >= 0 &&
        days <= 7 &&
        !isPaid(item.status) &&
        item.type !== "Referência"
      );
    });
  }, [filteredItems]);

  const next30Items = useMemo(() => {
    return filteredItems.filter((item) => {
      const days = getDaysFromToday(item.date);

      return (
        days !== null &&
        days >= 0 &&
        days <= 30 &&
        !isPaid(item.status) &&
        item.type !== "Referência"
      );
    });
  }, [filteredItems]);

  const priorityItems = useMemo(() => {
    return [...lateItems, ...next7Items]
      .filter((item, index, array) => array.findIndex((entry) => entry.id === item.id) === index)
      .sort((a, b) => getAgendaSortValue(a) - getAgendaSortValue(b));
  }, [lateItems, next7Items]);

  const upcomingReceivables = useMemo(() => {
    return filteredItems
      .filter((item) => {
        const days = getDaysFromToday(item.date);

        return (
          item.type === "Recebimento" &&
          days !== null &&
          days >= 0 &&
          !isPaid(item.status)
        );
      })
      .sort((a, b) => getAgendaSortValue(a) - getAgendaSortValue(b))
      .slice(0, 8);
  }, [filteredItems]);

  const stats = {
    total: filteredItems.length,
    late: lateItems.length,
    today: todayItems.length,
    next7: next7Items.length,
    next30: next30Items.length,
    receivableTotal: upcomingReceivables.reduce((sum, item) => sum + (item.value || 0), 0),
    lateTotal: lateItems.reduce((sum, item) => sum + (item.value || 0), 0)
  };

  const visibleItems = useMemo(() => {
    if (viewMode === "prioridade") return priorityItems;
    if (viewMode === "timeline") return filteredItems;
    return filteredItems;
  }, [filteredItems, priorityItems, viewMode]);

  return (
    <div className="agenda-page">
      <section className="agenda-header">
        <div>
          <p className="agenda-overline">Agenda / Prazos & Follow-up</p>
          <h1>Central de prazos financeiros e operacionais.</h1>
          <p>
            Acompanhe recebimentos, emissões de NF, itens atrasados e ações de
            curto prazo a partir dos projetos importados da planilha Fluxo 2026.
          </p>
        </div>

        <div className="agenda-header-card">
          <TimerReset size={30} />
          <span>Prioridade agora</span>
          <strong>{priorityItems.length}</strong>
          <small>{formatMoney(stats.lateTotal)} em atrasos filtrados</small>
        </div>
      </section>

      {message && <div className="agenda-message">{message}</div>}

      <section className="agenda-kpi-grid">
        <div className="agenda-kpi-card late">
          <div>
            <span>Atrasados</span>
            <strong>{stats.late}</strong>
            <small>{formatMoney(stats.lateTotal)}</small>
          </div>
          <AlertTriangle />
        </div>

        <div className="agenda-kpi-card today">
          <div>
            <span>Hoje</span>
            <strong>{stats.today}</strong>
            <small>eventos no dia</small>
          </div>
          <CheckCircle2 />
        </div>

        <div className="agenda-kpi-card week">
          <div>
            <span>Próximos 7 dias</span>
            <strong>{stats.next7}</strong>
            <small>ações de curto prazo</small>
          </div>
          <Clock3 />
        </div>

        <div className="agenda-kpi-card month">
          <div>
            <span>Próximos 30 dias</span>
            <strong>{stats.next30}</strong>
            <small>{formatMoney(stats.receivableTotal)} a receber</small>
          </div>
          <CalendarDays />
        </div>
      </section>

      <section className="agenda-toolbar">
        <div className="agenda-search">
          <Search size={18} />
          <input
            placeholder="Buscar projeto, grupo, marca, NF ou status..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="agenda-select">
          <Filter size={18} />
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            {types.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="agenda-select">
          <Sparkles size={18} />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>

        <button type="button" onClick={loadAgenda}>
          {loading ? <Loader2 className="agenda-spin" size={16} /> : <RefreshCw size={16} />}
          Atualizar
        </button>
      </section>

      <section className="agenda-tabs">
        <button
          type="button"
          className={viewMode === "prioridade" ? "active" : ""}
          onClick={() => setViewMode("prioridade")}
        >
          <AlertTriangle size={16} />
          Prioridade
        </button>

        <button
          type="button"
          className={viewMode === "timeline" ? "active" : ""}
          onClick={() => setViewMode("timeline")}
        >
          <CalendarDays size={16} />
          Timeline
        </button>

        <button
          type="button"
          className={viewMode === "tabela" ? "active" : ""}
          onClick={() => setViewMode("tabela")}
        >
          <Layers3 size={16} />
          Tabela
        </button>
      </section>

      {viewMode !== "tabela" && (
        <section className="agenda-main-grid">
          <div className="agenda-panel agenda-timeline-panel">
            <div className="agenda-panel-header">
              <div>
                <p className="agenda-overline">
                  {viewMode === "prioridade" ? "Ação imediata" : "Linha do tempo"}
                </p>
                <h2>
                  {viewMode === "prioridade"
                    ? "Itens que exigem atenção"
                    : "Todos os eventos filtrados"}
                </h2>
              </div>
              <CalendarDays />
            </div>

            <div className="agenda-timeline">
              {loading && <div className="agenda-empty">Carregando agenda...</div>}

              {!loading &&
                visibleItems.slice(0, 80).map((item) => (
                  <div
                    className={`agenda-timeline-row ${getUrgencyClass(item)}`}
                    key={item.id}
                  >
                    <div className="agenda-date-box">
                      <strong>{formatDate(item.date)}</strong>
                      <span>{getDateLabel(item.date)}</span>
                    </div>

                    <div className="agenda-event-content">
                      <div className="agenda-event-title">
                        <strong>{item.project ?? "Projeto sem nome"}</strong>
                        <span className="agenda-type">{item.type}</span>
                      </div>

                      <p>
                        {item.group ?? "Sem grupo"} · {item.brand ?? "Sem marca"} ·{" "}
                        {formatMoney(item.value)}
                      </p>

                      <div className="agenda-event-meta">
                        <span className={getStatusClass(item.status)}>
                          {item.status ?? "A classificar"}
                        </span>
                        <span>NF: {item.nf ?? "—"}</span>
                      </div>
                    </div>
                  </div>
                ))}

              {!loading && !visibleItems.length && (
                <div className="agenda-empty">Nenhum evento encontrado.</div>
              )}
            </div>
          </div>

          <aside className="agenda-side-stack">
            <div className="agenda-panel">
              <div className="agenda-panel-header">
                <div>
                  <p className="agenda-overline">Recebimentos</p>
                  <h2>Próximos a receber</h2>
                </div>
                <Clock3 />
              </div>

              <div className="agenda-mini-list">
                {upcomingReceivables.map((item) => (
                  <div key={`${item.id}-receivable`}>
                    <strong>{formatDate(item.date)}</strong>
                    <span>{item.project ?? "Projeto sem nome"}</span>
                    <p>{formatMoney(item.value)}</p>
                  </div>
                ))}

                {!upcomingReceivables.length && (
                  <div className="agenda-empty">Nenhum recebimento futuro filtrado.</div>
                )}
              </div>
            </div>

            <div className="agenda-panel">
              <div className="agenda-panel-header">
                <div>
                  <p className="agenda-overline">Atrasos</p>
                  <h2>Follow-up crítico</h2>
                </div>
                <AlertTriangle />
              </div>

              <div className="agenda-mini-list danger">
                {lateItems.slice(0, 8).map((item) => (
                  <div key={`${item.id}-late`}>
                    <strong>{formatDate(item.date)}</strong>
                    <span>{item.project ?? "Projeto sem nome"}</span>
                    <p>{formatMoney(item.value)}</p>
                  </div>
                ))}

                {!lateItems.length && (
                  <div className="agenda-empty">Nenhum atraso crítico encontrado.</div>
                )}
              </div>
            </div>
          </aside>
        </section>
      )}

      {viewMode === "tabela" && (
        <section className="agenda-panel agenda-table-panel">
          <div className="agenda-panel-header">
            <div>
              <p className="agenda-overline">Base completa</p>
              <h2>Eventos filtrados da agenda</h2>
            </div>
            <FileText />
          </div>

          <div className="agenda-table">
            <div className="agenda-table-head">
              <span>Data</span>
              <span>Tipo</span>
              <span>Projeto</span>
              <span>Grupo</span>
              <span>Marca</span>
              <span>Valor</span>
              <span>Status</span>
              <span>NF</span>
            </div>

            {filteredItems.map((item) => (
              <div className="agenda-table-row" key={`${item.id}-table`}>
                <span>{formatDate(item.date)}</span>
                <span>{item.type}</span>
                <span>{item.project ?? "—"}</span>
                <span>{item.group ?? "—"}</span>
                <span>{item.brand ?? "—"}</span>
                <span>{formatMoney(item.value)}</span>
                <span>
                  <strong className={getStatusClass(item.status)}>
                    {item.status ?? "—"}
                  </strong>
                </span>
                <span>{item.nf ?? "—"}</span>
              </div>
            ))}

            {!filteredItems.length && (
              <div className="agenda-empty">Nenhum evento encontrado.</div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
