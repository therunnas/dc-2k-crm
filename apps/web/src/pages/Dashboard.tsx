import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader2,
  PieChart as PieChartIcon,
  RefreshCw,
  TrendingUp,
  WalletCards
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import "./Dashboard.css";

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
    arquivoOriginal?: string;
    salvoEm?: string;
    importadoEm?: string;
    entradas?: number;
    saidas?: number;
    grupos?: number;
    marcas?: number;
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

type ChartItem = {
  name: string;
  value: number;
};

const statusColors = ["#22d3ee", "#8b5cf6", "#f59e0b", "#fb7185", "#4ade80"];

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
    currency: "BRL",
    maximumFractionDigits: 2
  }).format(value || 0);
}

function formatCompactMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value || 0);
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";

  const percentValue = Math.abs(value) <= 1 ? value : value / 100;

  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    maximumFractionDigits: 1
  }).format(percentValue);
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

function formatDateTime(value?: string | null) {
  if (!value) return "Sem importação";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
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
  if (days < 0) return `${Math.abs(days)} dias atrasado`;

  return `Em ${days} dias`;
}

function getMonthLabel(value?: string | null) {
  if (!value) return "Sem mês";

  const normalized = value.trim();

  if (/^\d{2}\/\d{4}$/.test(normalized)) {
    return normalized;
  }

  if (/^\d{4}-\d{2}/.test(normalized)) {
    const [year, month] = normalized.split("-");
    return `${month}/${year}`;
  }

  const date = parseDate(normalized);

  if (date) {
    return new Intl.DateTimeFormat("pt-BR", {
      month: "2-digit",
      year: "numeric"
    }).format(date);
  }

  return normalized;
}

export function Dashboard() {
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [entradas, setEntradas] = useState<EntradaFinanceira[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setMessage("");

      const [summaryResponse, entradasResponse] = await Promise.all([
        api.get<ImportSummary>("/api/import/fluxo/summary"),
        api.get<EntradaFinanceira[]>("/api/financeiro/entradas")
      ]);

      setSummary(summaryResponse.data);
      setEntradas(entradasResponse.data ?? []);
    } catch {
      setMessage(
        "Não foi possível carregar o Dashboard. Verifique se o backend está rodando e se a planilha foi importada."
      );
      setSummary(null);
      setEntradas([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const resumo = summary?.dashboardFinanceiro?.resumo;

  const financeiroCalculado = useMemo(() => {
    const recebidos = entradas.filter((item) => normalize(item.status).includes("pago"));

    const aguardandoPagamento = entradas.filter((item) => {
      const status = normalize(item.status);
      return status.includes("aguardando") || status.includes("atrasado");
    });

    const preFaturamento = entradas.filter((item) => {
      const status = normalize(item.status);
      return status.includes("gerar") || status.includes("confirmar") || status.includes("nf a enviar");
    });

    const vencidos = aguardandoPagamento.filter((item) => {
      const days = getDaysFromToday(item.previsaoRecebimento);
      return days !== null && days < 0;
    });

    return {
      recebido: recebidos.reduce((sum, item) => sum + (item.valor || 0), 0),
      aReceber: aguardandoPagamento.reduce((sum, item) => sum + (item.valor || 0), 0),
      preFaturamento: preFaturamento.reduce((sum, item) => sum + (item.valor || 0), 0),
      atrasado: vencidos.reduce((sum, item) => sum + (item.valor || 0), 0),
      qtdAReceber: aguardandoPagamento.length,
      qtdPreFaturamento: preFaturamento.length,
      qtdVencidos: vencidos.length
    };
  }, [entradas]);

  const totals = {
    totalFaturado:
      resumo?.totalFaturado ?? entradas.reduce((sum, item) => sum + (item.valor || 0), 0),
    totalRecebido: resumo?.totalRecebido ?? financeiroCalculado.recebido,
    totalAReceber: financeiroCalculado.aReceber || resumo?.totalAReceber || 0,
    totalPreFaturamento:
      financeiroCalculado.preFaturamento || resumo?.totalPreFaturamento || 0,
    totalAtrasado: financeiroCalculado.atrasado || resumo?.totalAtrasado || 0,
    totalSaidas: resumo?.totalSaidas ?? 0,
    resultadoCaixa:
      resumo?.resultadoCaixa ??
      ((resumo?.totalRecebido ?? financeiroCalculado.recebido) - (resumo?.totalSaidas ?? 0)),
    lucroCompetencia:
      resumo?.lucroCompetencia ??
      ((resumo?.totalFaturado ?? 0) - (resumo?.totalSaidas ?? 0)),
    margemCompetencia: resumo?.margemCompetencia ?? 0,
    quantidadeProjetos: resumo?.quantidadeProjetos ?? entradas.length,
    quantidadeGrupos:
      resumo?.quantidadeGrupos ??
      new Set(entradas.map((item) => item.grupo).filter(Boolean)).size,
    quantidadeMarcas:
      resumo?.quantidadeMarcas ??
      new Set(entradas.map((item) => item.marca).filter(Boolean)).size
  };

  const monthChart = useMemo<ChartItem[]>(() => {
    const map = new Map<string, number>();

    entradas.forEach((item) => {
      const label = getMonthLabel(item.mesRef);
      map.set(label, (map.get(label) ?? 0) + (item.valor || 0));
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(-10);
  }, [entradas]);

  const statusChart = useMemo<ChartItem[]>(() => {
    return [
      {
        name: "Pago",
        value: entradas
          .filter((item) => normalize(item.status).includes("pago"))
          .reduce((sum, item) => sum + (item.valor || 0), 0)
      },
      {
        name: "A receber",
        value: entradas
          .filter((item) => {
            const status = normalize(item.status);
            return status.includes("aguardando") || status.includes("atrasado");
          })
          .reduce((sum, item) => sum + (item.valor || 0), 0)
      },
      {
        name: "Pré-faturamento",
        value: entradas
          .filter((item) => {
            const status = normalize(item.status);
            return status.includes("gerar") || status.includes("confirmar") || status.includes("nf a enviar");
          })
          .reduce((sum, item) => sum + (item.valor || 0), 0)
      }
    ];
  }, [entradas]);

  const topGroups = useMemo<ChartItem[]>(() => {
    const map = new Map<string, number>();

    entradas.forEach((item) => {
      const label = item.grupo || "Sem grupo";
      map.set(label, (map.get(label) ?? 0) + (item.valor || 0));
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [entradas]);

  const proximosRecebimentos = useMemo(() => {
    return entradas
      .filter((item) => {
        const status = normalize(item.status);
        return status.includes("aguardando") || status.includes("atrasado");
      })
      .sort((a, b) => {
        const da = parseDate(a.previsaoRecebimento)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const db = parseDate(b.previsaoRecebimento)?.getTime() ?? Number.MAX_SAFE_INTEGER;

        return da - db;
      })
      .slice(0, 7);
  }, [entradas]);

  const hasData = Boolean(summary?.lastImport) || entradas.length > 0;

  return (
    <div className="dashpro-page">
      <section className="dashpro-hero">
        <div>
          <p className="dashpro-overline">Dashboard / Visão executiva</p>
          <h1>Fluxo financeiro, operação e carteira em um único painel.</h1>
          <p>
            Resumo consolidado da planilha Fluxo 2026 com faturamento, caixa,
            valores a receber, saídas, margem, clientes e próximos recebimentos.
          </p>
        </div>

        <div className="dashpro-import-card">
          <RefreshCw size={28} />
          <span>Última importação</span>
          <strong>
            {formatDateTime(summary?.lastImport?.importadoEm ?? summary?.lastImport?.salvoEm)}
          </strong>
          <small>{summary?.lastImport?.arquivoOriginal ?? "Nenhuma planilha carregada"}</small>

          <button type="button" onClick={loadDashboard}>
            {loading ? <Loader2 className="dashpro-spin" size={16} /> : <RefreshCw size={16} />}
            Atualizar
          </button>
        </div>
      </section>

      {message && <div className="dashpro-message">{message}</div>}

      {!hasData && !loading && (
        <section className="dashpro-empty-state">
          <AlertTriangle size={28} />
          <div>
            <strong>Nenhum dado carregado no Dashboard.</strong>
            <p>Abra a página Financeiro, importe a planilha e volte para o Dashboard.</p>
          </div>
          <a href="/financeiro">Ir para Financeiro</a>
        </section>
      )}

      <section className="dashpro-kpi-grid">
        <article className="dashpro-kpi-card cyan">
          <div>
            <span>Faturado no ano</span>
            <strong>{formatMoney(totals.totalFaturado)}</strong>
            <small>{totals.quantidadeProjetos} projetos considerados</small>
          </div>
          <CircleDollarSign />
        </article>

        <article className="dashpro-kpi-card green">
          <div>
            <span>Recebido no caixa</span>
            <strong>{formatMoney(totals.totalRecebido)}</strong>
            <small>dinheiro confirmado</small>
          </div>
          <ArrowUpRight />
        </article>

        <article className="dashpro-kpi-card yellow">
          <div>
            <span>A receber</span>
            <strong>{formatMoney(totals.totalAReceber)}</strong>
            <small>{financeiroCalculado.qtdAReceber} item(ns) aguardando pagamento</small>
          </div>
          <Clock3 />
        </article>

        <article className="dashpro-kpi-card red">
          <div>
            <span>Saídas no ano</span>
            <strong>{formatMoney(totals.totalSaidas)}</strong>
            <small>custos e despesas importadas</small>
          </div>
          <ArrowDownRight />
        </article>
      </section>

      <section className="dashpro-kpi-grid secondary">
        <article className="dashpro-mini-card">
          <span>Resultado de caixa</span>
          <strong>{formatMoney(totals.resultadoCaixa)}</strong>
          <small>Recebido - Saídas</small>
        </article>

        <article className="dashpro-mini-card">
          <span>Lucro competência</span>
          <strong>{formatMoney(totals.lucroCompetencia)}</strong>
          <small>Faturado - Saídas</small>
        </article>

        <article className="dashpro-mini-card">
          <span>Margem</span>
          <strong>{formatPercent(totals.margemCompetencia)}</strong>
          <small>Lucro / Faturamento</small>
        </article>

        <article className="dashpro-mini-card warning">
          <span>Pré-faturamento</span>
          <strong>{formatMoney(totals.totalPreFaturamento)}</strong>
          <small>{financeiroCalculado.qtdPreFaturamento} item(ns) antes de virar cobrança</small>
        </article>
      </section>

      <section className="dashpro-chart-grid">
        <article className="dashpro-panel dashpro-chart-panel">
          <div className="dashpro-panel-header">
            <div>
              <p className="dashpro-overline">Faturamento</p>
              <h2>Volume por mês</h2>
            </div>
            <BarChart3 />
          </div>

          <div className="dashpro-chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthChart}>
                <defs>
                  <linearGradient id="dashRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" stroke="#8d9bd0" axisLine={false} tickLine={false} />
                <YAxis
                  stroke="#8d9bd0"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatCompactMoney(Number(value))}
                />
                <Tooltip
                  formatter={(value) => formatMoney(Number(value))}
                  contentStyle={{
                    background: "#0b1020",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "14px",
                    color: "#fff"
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Faturamento"
                  stroke="#22d3ee"
                  strokeWidth={3}
                  fill="url(#dashRevenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="dashpro-panel dashpro-chart-panel">
          <div className="dashpro-panel-header">
            <div>
              <p className="dashpro-overline">Status financeiro</p>
              <h2>Pago, a receber e pré-faturamento</h2>
            </div>
            <PieChartIcon />
          </div>

          <div className="dashpro-pie-layout">
            <div className="dashpro-pie-box">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChart}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={98}
                    paddingAngle={4}
                  >
                    {statusChart.map((_, index) => (
                      <Cell key={index} fill={statusColors[index % statusColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatMoney(Number(value))}
                    contentStyle={{
                      background: "#0b1020",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "14px",
                      color: "#fff"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="dashpro-legend">
              {statusChart.map((item, index) => (
                <div key={item.name}>
                  <i style={{ background: statusColors[index % statusColors.length] }} />
                  <span>{item.name}</span>
                  <strong>{formatMoney(item.value)}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="dashpro-chart-grid lower">
        <article className="dashpro-panel dashpro-chart-panel">
          <div className="dashpro-panel-header">
            <div>
              <p className="dashpro-overline">Clientes</p>
              <h2>Top grupos por faturamento</h2>
            </div>
            <BriefcaseBusiness />
          </div>

          <div className="dashpro-chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topGroups} layout="vertical">
                <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#8d9bd0"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatCompactMoney(Number(value))}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  stroke="#8d9bd0"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => formatMoney(Number(value))}
                  contentStyle={{
                    background: "#0b1020",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "14px",
                    color: "#fff"
                  }}
                />
                <Bar dataKey="value" name="Faturamento" fill="#8b5cf6" radius={[0, 12, 12, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="dashpro-panel">
          <div className="dashpro-panel-header">
            <div>
              <p className="dashpro-overline">Agenda financeira</p>
              <h2>Próximos recebimentos</h2>
            </div>
            <CalendarClock />
          </div>

          <div className="dashpro-receivables">
            {proximosRecebimentos.map((item) => (
              <div className="dashpro-receivable-row" key={`${item.id}-${item.projeto}`}>
                <div>
                  <strong>{item.grupo || item.marca || "Sem cliente"}</strong>
                  <span>{item.projeto || "Projeto sem nome"}</span>
                </div>

                <div>
                  <b>{formatMoney(item.valor)}</b>
                  <small>
                    {formatDate(item.previsaoRecebimento)} ·{" "}
                    {getDateLabel(item.previsaoRecebimento)}
                  </small>
                </div>
              </div>
            ))}

            {!proximosRecebimentos.length && (
              <div className="dashpro-empty">Nenhum recebimento aberto encontrado.</div>
            )}
          </div>
        </article>
      </section>

      <section className="dashpro-health-grid">
        <article>
          <WalletCards />
          <span>Caixa confirmado</span>
          <strong>{formatMoney(totals.totalRecebido)}</strong>
          <small>Baseado nos itens pagos da planilha.</small>
        </article>

        <article>
          <AlertTriangle />
          <span>Vencidos</span>
          <strong>{formatMoney(totals.totalAtrasado)}</strong>
          <small>{financeiroCalculado.qtdVencidos} cobrança(s) com data vencida.</small>
        </article>

        <article>
          <TrendingUp />
          <span>Grupos ativos</span>
          <strong>{totals.quantidadeGrupos}</strong>
          <small>Carteira comercial importada.</small>
        </article>

        <article>
          <CheckCircle2 />
          <span>Marcas mapeadas</span>
          <strong>{totals.quantidadeMarcas}</strong>
          <small>Marcas vinculadas aos projetos.</small>
        </article>
      </section>
    </div>
  );
}
