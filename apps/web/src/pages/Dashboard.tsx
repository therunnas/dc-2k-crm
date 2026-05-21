import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  FileSpreadsheet,
  Layers3,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet
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

type RankingItem = {
  nome: string;
  total: number;
  quantidade: number;
};

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
  recebido?: string | null;
  etapa: string;
};

type SaidaFinanceira = {
  mesRef: string | null;
  data: string | null;
  categoriaPrincipal: string | null;
  fornecedor: string | null;
  descricao: string | null;
  valor: number;
  statusPagamento: string | null;
  recorrencia: string | null;
  observacao: string | null;
  id: string | null;
  subcategoria: string | null;
  natureza: string | null;
};

type DashboardFinanceiro = {
  atualizadoEm: string;
  resumo: {
    totalFaturado: number;
    totalRecebido: number;
    totalAReceber: number;
    totalAtrasado?: number;
    totalPreFaturamento?: number;
    totalSaidas: number;
    totalSaidasPagas: number;
    lucroCompetencia: number;
    resultadoCaixa: number;
    margemCompetencia: number;
    quantidadeProjetos: number;
    quantidadeSaidas: number;
    quantidadeGrupos: number;
    quantidadeMarcas: number;
  };
  rankings: {
    grupos: RankingItem[];
    marcas: RankingItem[];
    categoriasSaida: RankingItem[];
  };
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
};

const chartColors = [
  "#22d3ee",
  "#8b5cf6",
  "#f59e0b",
  "#fb7185",
  "#4ade80",
  "#60a5fa"
];

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

function formatCompactMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value || 0);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
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

function getSortableMonth(value?: string | null) {
  const date = parseDate(value);

  if (!date) return "9999-99";

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(value?: string | null) {
  const date = parseDate(value);

  if (!date) return "Sem data";

  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit"
  })
    .format(date)
    .replace(".", "");
}

function getDaysFromToday(value?: string | null) {
  const date = parseDate(value);

  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatusLabel(status?: string | null) {
  const value = normalize(status);

  if (value === "pago") return "Pago";
  if (value.includes("aguardando")) return "A receber";
  if (value.includes("gerar")) return "Gerar NF";
  if (value.includes("confirmar")) return "Confirmar info";
  if (value.includes("atrasado")) return "Atrasado";

  return status || "Outros";
}

function getStatusClass(status?: string | null) {
  const value = normalize(status);

  if (value === "pago") return "dash-status paid";
  if (value.includes("aguardando")) return "dash-status waiting";
  if (value.includes("gerar")) return "dash-status nf";
  if (value.includes("confirmar")) return "dash-status info";
  if (value.includes("atrasado")) return "dash-status late";

  return "dash-status neutral";
}

export function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardFinanceiro | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [producoes, setProducoes] = useState<Producao[]>([]);
  const [saidas, setSaidas] = useState<SaidaFinanceira[]>([]);
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setMessage("");

      const [healthResponse, dashboardResponse, summaryResponse, producoesResponse, saidasResponse] =
        await Promise.all([
          api.get("/health"),
          api.get<DashboardFinanceiro>("/api/dashboard/financeiro"),
          api.get<ImportSummary>("/api/import/fluxo/summary"),
          api.get<Producao[]>("/api/producoes"),
          api.get<SaidaFinanceira[]>("/api/financeiro/saidas")
        ]);

      setApiOnline(healthResponse.data?.status === "online");
      setDashboard(dashboardResponse.data);
      setSummary(summaryResponse.data);
      setProducoes(producoesResponse.data);
      setSaidas(saidasResponse.data);
    } catch {
      setApiOnline(false);
      setMessage("Erro ao carregar o Dashboard. Verifique se o backend está rodando e se a planilha foi importada.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const resumo = dashboard?.resumo;
  const rankings = dashboard?.rankings;

  const fluxoMensal = useMemo(() => {
    const map = new Map<
      string,
      {
        ordem: string;
        mes: string;
        faturado: number;
        recebido: number;
        aReceber: number;
        saidas: number;
        resultado: number;
      }
    >();

    function ensureMonth(date: string | null | undefined) {
      const ordem = getSortableMonth(date);
      const mes = getMonthLabel(date);

      const current =
        map.get(ordem) ??
        {
          ordem,
          mes,
          faturado: 0,
          recebido: 0,
          aReceber: 0,
          saidas: 0,
          resultado: 0
        };

      map.set(ordem, current);
      return current;
    }

    for (const producao of producoes) {
      const month = ensureMonth(
        producao.mesRef || producao.dataEmissao || producao.previsaoRecebimento
      );

      const status = normalize(producao.statusFinanceiro);

      month.faturado += producao.valor || 0;

      if (status === "pago") {
        month.recebido += producao.valor || 0;
      }

      if (status.includes("aguardando") || status.includes("atrasado")) {
        month.aReceber += producao.valor || 0;
      }
    }

    for (const saida of saidas) {
      const month = ensureMonth(saida.mesRef || saida.data);
      month.saidas += saida.valor || 0;
    }

    return Array.from(map.values())
      .filter((item) => item.ordem !== "9999-99")
      .sort((a, b) => a.ordem.localeCompare(b.ordem))
      .map((item) => ({
        ...item,
        resultado: item.recebido - item.saidas
      }));
  }, [producoes, saidas]);

  const statusData = useMemo(() => {
    const map = new Map<string, number>();

    for (const item of producoes) {
      const label = getStatusLabel(item.statusFinanceiro);
      map.set(label, (map.get(label) ?? 0) + (item.valor || 0));
    }

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [producoes]);

  const proximosRecebimentos = useMemo(() => {
    return producoes
      .filter((item) => {
        const status = normalize(item.statusFinanceiro);
        const days = getDaysFromToday(item.previsaoRecebimento);

        return status.includes("aguardando") && days !== null && days >= 0;
      })
      .sort((a, b) => {
        const da = parseDate(a.previsaoRecebimento)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const db = parseDate(b.previsaoRecebimento)?.getTime() ?? Number.MAX_SAFE_INTEGER;

        return da - db;
      })
      .slice(0, 6);
  }, [producoes]);

  const riscos = useMemo(() => {
    const atrasados = producoes.filter((item) => {
      const status = normalize(item.statusFinanceiro);
      const days = getDaysFromToday(item.previsaoRecebimento);

      if (status === "pago") return false;
      if (status.includes("atrasado")) return true;

      return status.includes("aguardando") && days !== null && days < 0;
    });

    const gerarNf = producoes.filter((item) =>
      normalize(item.statusFinanceiro).includes("gerar")
    );

    const confirmarInfo = producoes.filter((item) =>
      normalize(item.statusFinanceiro).includes("confirmar")
    );

    return {
      atrasados,
      gerarNf,
      confirmarInfo,
      totalAtrasado: atrasados.reduce((sum, item) => sum + item.valor, 0),
      totalGerarNf: gerarNf.reduce((sum, item) => sum + item.valor, 0),
      totalConfirmarInfo: confirmarInfo.reduce((sum, item) => sum + item.valor, 0)
    };
  }, [producoes]);

  const resultadoOperacional = (resumo?.totalRecebido ?? 0) - (resumo?.totalSaidas ?? 0);

  const kpis = [
    {
      label: "Faturado",
      value: formatMoney(resumo?.totalFaturado ?? 0),
      detail: `${resumo?.quantidadeProjetos ?? 0} projetos`,
      icon: CircleDollarSign,
      tone: "cyan"
    },
    {
      label: "Recebido",
      value: formatMoney(resumo?.totalRecebido ?? 0),
      detail: "caixa confirmado",
      icon: Wallet,
      tone: "green"
    },
    {
      label: "A receber",
      value: formatMoney(resumo?.totalAReceber ?? 0),
      detail: "aguardando pagamento",
      icon: Clock3,
      tone: "orange"
    },
    {
      label: "Saídas",
      value: formatMoney(resumo?.totalSaidas ?? 0),
      detail: `${resumo?.quantidadeSaidas ?? 0} lançamentos`,
      icon: TrendingDown,
      tone: "red"
    },
    {
      label: "Lucro competência",
      value: formatMoney(resumo?.lucroCompetencia ?? 0),
      detail: "faturado - saídas",
      icon: TrendingUp,
      tone: "purple"
    },
    {
      label: "Resultado caixa",
      value: formatMoney(resultadoOperacional),
      detail: "recebido - saídas",
      icon: Banknote,
      tone: "blue"
    }
  ];

  return (
    <div className="dash-page">
      <section className="dash-header">
        <div>
          <p className="dash-overline">2K Studios · Dashboard Executivo</p>
          <h1>Fluxo da empresa em uma visão central.</h1>
          <p>
            Resumo financeiro e operacional do Fluxo 2026: faturamento, caixa,
            recebimentos, custos, riscos, clientes e categorias de saída.
          </p>
        </div>

        <div className="dash-header-actions">
          <div className="dash-import-card">
            <FileSpreadsheet size={18} />
            <div>
              <span>Última importação</span>
              <strong>{formatDateTime(summary?.lastImport?.importadoEm)}</strong>
            </div>
          </div>

          <button type="button" onClick={loadDashboard}>
            {loading ? <Loader2 className="dash-spin" size={16} /> : <RefreshCw size={16} />}
            Atualizar
          </button>
        </div>
      </section>

      {message && <div className="dash-message">{message}</div>}

      <section className="dash-executive-grid">
        <div className="dash-executive-card main">
          <span>Resultado de caixa</span>
          <strong>{formatMoney(resultadoOperacional)}</strong>
          <small>Recebido menos saídas totais</small>

          <div className="dash-executive-meta">
            <div>
              <span>Margem</span>
              <strong>{formatPercent(resumo?.margemCompetencia ?? 0)}</strong>
            </div>

            <div>
              <span>Backend</span>
              <strong>{apiOnline ? "Online" : "Offline"}</strong>
            </div>
          </div>
        </div>

        <div className="dash-executive-card">
          <span>Projetos</span>
          <strong>{resumo?.quantidadeProjetos ?? 0}</strong>
          <small>linhas consideradas</small>
        </div>

        <div className="dash-executive-card">
          <span>Grupos</span>
          <strong>{resumo?.quantidadeGrupos ?? 0}</strong>
          <small>clientes consolidados</small>
        </div>

        <div className="dash-executive-card">
          <span>Marcas</span>
          <strong>{resumo?.quantidadeMarcas ?? 0}</strong>
          <small>marcas no fluxo</small>
        </div>
      </section>

      <section className="dash-kpi-grid">
        {kpis.map((item) => {
          const Icon = item.icon;

          return (
            <div className={`dash-kpi-card ${item.tone}`} key={item.label}>
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.detail}</small>
              </div>
              <Icon />
            </div>
          );
        })}
      </section>

      <section className="dash-main-grid">
        <div className="dash-panel dash-panel-flow">
          <div className="dash-panel-header">
            <div>
              <p className="dash-overline">Fluxo mensal</p>
              <h2>Faturado, recebido, a receber e saídas</h2>
            </div>
            <span>{fluxoMensal.length} mês(es)</span>
          </div>

          <div className="dash-chart-box large">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fluxoMensal}>
                <defs>
                  <linearGradient id="dashFaturado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
                  </linearGradient>

                  <linearGradient id="dashRecebido" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0.02} />
                  </linearGradient>

                  <linearGradient id="dashSaidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="mes" stroke="#8d9bd0" tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#8d9bd0"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCompactMoney(Number(value))}
                />
                <Tooltip
                  formatter={(value) => formatMoney(Number(value))}
                  contentStyle={{
                    background: "#0b1020",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "14px",
                    color: "#fff"
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="faturado"
                  name="Faturado"
                  stroke="#22d3ee"
                  fill="url(#dashFaturado)"
                  strokeWidth={3}
                />

                <Area
                  type="monotone"
                  dataKey="recebido"
                  name="Recebido"
                  stroke="#4ade80"
                  fill="url(#dashRecebido)"
                  strokeWidth={3}
                />

                <Area
                  type="monotone"
                  dataKey="saidas"
                  name="Saídas"
                  stroke="#fb7185"
                  fill="url(#dashSaidas)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <aside className="dash-side-column">
          <div className="dash-panel">
            <div className="dash-panel-header compact">
              <div>
                <p className="dash-overline">Composição</p>
                <h2>Status financeiro</h2>
              </div>
              <Layers3 />
            </div>

            <div className="dash-donut-box">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={92}
                    paddingAngle={4}
                  >
                    {statusData.map((_, index) => (
                      <Cell key={index} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatMoney(Number(value))}
                    contentStyle={{
                      background: "#0b1020",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "14px",
                      color: "#fff"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="dash-legend-list">
              {statusData.map((item, index) => (
                <div key={item.name}>
                  <i style={{ background: chartColors[index % chartColors.length] }} />
                  <span>{item.name}</span>
                  <strong>{formatMoney(item.value)}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="dash-panel dash-risk-panel">
            <div className="dash-panel-header compact">
              <div>
                <p className="dash-overline">Riscos</p>
                <h2>Pontos de atenção</h2>
              </div>
              <AlertTriangle />
            </div>

            <div className="dash-risk-list">
              <div>
                <span>Atrasado</span>
                <strong>{formatMoney(riscos.totalAtrasado)}</strong>
                <small>{riscos.atrasados.length} item(ns)</small>
              </div>

              <div>
                <span>Gerar NF</span>
                <strong>{formatMoney(riscos.totalGerarNf)}</strong>
                <small>{riscos.gerarNf.length} item(ns)</small>
              </div>

              <div>
                <span>Confirmar info</span>
                <strong>{formatMoney(riscos.totalConfirmarInfo)}</strong>
                <small>{riscos.confirmarInfo.length} item(ns)</small>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="dash-secondary-grid">
        <div className="dash-panel">
          <div className="dash-panel-header">
            <div>
              <p className="dash-overline">Clientes</p>
              <h2>Top grupos por faturamento</h2>
            </div>
            <ArrowUpRight />
          </div>

          <div className="dash-bar-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(rankings?.grupos ?? []).slice(0, 6)} layout="vertical">
                <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#8d9bd0"
                  tickFormatter={(value) => formatCompactMoney(Number(value))}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="nome"
                  width={135}
                  stroke="#8d9bd0"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => formatMoney(Number(value))}
                  contentStyle={{
                    background: "#0b1020",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "14px",
                    color: "#fff"
                  }}
                />
                <Bar dataKey="total" name="Faturamento" radius={[0, 12, 12, 0]} fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dash-panel">
          <div className="dash-panel-header">
            <div>
              <p className="dash-overline">Custos</p>
              <h2>Categorias de saída</h2>
            </div>
            <TrendingDown />
          </div>

          <div className="dash-ranking-list">
            {(rankings?.categoriasSaida ?? []).slice(0, 7).map((item, index) => (
              <div key={item.nome}>
                <span>{index + 1}</span>
                <div>
                  <strong>{item.nome}</strong>
                  <small>{item.quantidade} lançamento(s)</small>
                </div>
                <p>{formatMoney(item.total)}</p>
              </div>
            ))}

            {!(rankings?.categoriasSaida ?? []).length && (
              <div className="dash-empty">Nenhuma categoria de saída encontrada.</div>
            )}
          </div>
        </div>
      </section>

      <section className="dash-panel">
        <div className="dash-panel-header">
          <div>
            <p className="dash-overline">Recebimentos</p>
            <h2>Próximos recebimentos programados</h2>
          </div>
          <CalendarDays />
        </div>

        <div className="dash-receivable-list">
          {proximosRecebimentos.map((item) => (
            <div key={`${item.id}-${item.projeto}`}>
              <div>
                <strong>{item.projeto ?? "Projeto sem nome"}</strong>
                <span>{item.grupo ?? "Sem grupo"} · {item.marca ?? "Sem marca"}</span>
              </div>

              <div>
                <strong>{formatMoney(item.valor)}</strong>
                <span>{formatDate(item.previsaoRecebimento)}</span>
              </div>

              <span className={getStatusClass(item.statusFinanceiro)}>
                {item.statusFinanceiro ?? "Sem status"}
              </span>
            </div>
          ))}

          {!proximosRecebimentos.length && (
            <div className="dash-empty">Nenhum recebimento futuro encontrado.</div>
          )}
        </div>
      </section>
    </div>
  );
}
