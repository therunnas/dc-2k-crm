import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import {
  ArrowUpRight,
  BadgeDollarSign,
  BarChart3,
  Building2,
  CircleDollarSign,
  Crown,
  Layers3,
  RefreshCw,
  Search,
  Sparkles,
  Tags,
  TrendingUp,
  Users
} from "lucide-react";
import {
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

import "./Clientes.css";

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
  diasParaReceber?: number | null;
  recebido?: string | null;
  etapa: string;
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
    lucroCompetencia: number;
    resultadoCaixa: number;
    margemCompetencia: number;
    quantidadeProjetos: number;
    quantidadeGrupos: number;
    quantidadeMarcas: number;
  };
  rankings: {
    grupos: RankingItem[];
    marcas: RankingItem[];
    categoriasSaida: RankingItem[];
  };
  producoes?: Producao[];
};

type ViewMode = "grupos" | "marcas";

const chartColors = ["#22d3ee", "#8b5cf6", "#f59e0b", "#fb7185", "#4ade80", "#60a5fa"];

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

function formatPercent(value: number, total: number) {
  if (!total) return "0%";

  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / total);
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function getStatusClass(status?: string | null) {
  const value = normalize(status);

  if (value === "pago") return "client-status paid";
  if (value.includes("aguardando")) return "client-status waiting";
  if (value.includes("gerar")) return "client-status nf";
  if (value.includes("confirmar")) return "client-status info";
  if (value.includes("atrasado")) return "client-status late";

  return "client-status neutral";
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

export function Clientes() {
  const [dashboard, setDashboard] = useState<DashboardFinanceiro | null>(null);
  const [producoes, setProducoes] = useState<Producao[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grupos");
  const [search, setSearch] = useState("");
  const [selectedName, setSelectedName] = useState<string | null>(null);

  async function loadClientes() {
    try {
      setLoading(true);
      setMessage("");

      const [dashboardResponse, producoesResponse] = await Promise.all([
        api.get<DashboardFinanceiro>("/api/dashboard/financeiro"),
        api.get<Producao[]>("/api/producoes")
      ]);

      setDashboard(dashboardResponse.data);
      setProducoes(producoesResponse.data);

      const firstGroup = dashboardResponse.data.rankings.grupos?.[0]?.nome ?? null;
      setSelectedName(firstGroup);
    } catch {
      setMessage("Erro ao carregar CRM. Verifique se o backend está rodando e se a planilha foi importada.");
      setDashboard(null);
      setProducoes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClientes();
  }, []);

  const rankings = dashboard?.rankings;
  const resumo = dashboard?.resumo;

  const grupos = rankings?.grupos ?? [];
  const marcas = rankings?.marcas ?? [];

  const currentRanking = viewMode === "grupos" ? grupos : marcas;
  const currentLabel = viewMode === "grupos" ? "Grupo" : "Marca";

  const filteredRanking = useMemo(() => {
    return currentRanking.filter((item) =>
      normalize(item.nome).includes(normalize(search))
    );
  }, [currentRanking, search]);

  const selectedItem = useMemo(() => {
    if (!filteredRanking.length) return null;

    const exact = filteredRanking.find((item) => item.nome === selectedName);

    return exact ?? filteredRanking[0];
  }, [filteredRanking, selectedName]);

  const relatedProjects = useMemo(() => {
    if (!selectedItem) return [];

    return producoes
      .filter((item) => {
        if (viewMode === "grupos") return item.grupo === selectedItem.nome;
        return item.marca === selectedItem.nome;
      })
      .sort((a, b) => (b.valor || 0) - (a.valor || 0));
  }, [producoes, selectedItem, viewMode]);

  const statusData = useMemo(() => {
    const map = new Map<string, number>();

    for (const item of relatedProjects) {
      const label = getStatusLabel(item.statusFinanceiro);
      map.set(label, (map.get(label) ?? 0) + (item.valor || 0));
    }

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [relatedProjects]);

  const selectedStats = useMemo(() => {
    const total = relatedProjects.reduce((sum, item) => sum + (item.valor || 0), 0);
    const paid = relatedProjects
      .filter((item) => normalize(item.statusFinanceiro) === "pago")
      .reduce((sum, item) => sum + (item.valor || 0), 0);
    const waiting = relatedProjects
      .filter((item) => normalize(item.statusFinanceiro).includes("aguardando"))
      .reduce((sum, item) => sum + (item.valor || 0), 0);
    const nf = relatedProjects
      .filter((item) => normalize(item.statusFinanceiro).includes("gerar"))
      .reduce((sum, item) => sum + (item.valor || 0), 0);

    return {
      total,
      paid,
      waiting,
      nf,
      count: relatedProjects.length,
      averageTicket: relatedProjects.length ? total / relatedProjects.length : 0
    };
  }, [relatedProjects]);

  const topGroup = grupos[0];
  const topBrand = marcas[0];

  const portfolioRevenue = resumo?.totalFaturado ?? 0;

  const averageGroupTicket = grupos.length
    ? grupos.reduce((sum, item) => sum + item.total, 0) / grupos.length
    : 0;

  const averageBrandTicket = marcas.length
    ? marcas.reduce((sum, item) => sum + item.total, 0) / marcas.length
    : 0;

  return (
    <div className="clients-page">
      <section className="clients-header">
        <div>
          <p className="clients-overline">Clientes / CRM Comercial</p>
          <h1>Carteira de grupos, marcas e projetos faturados.</h1>
          <p>
            Analise a concentração comercial da 2K Studios por grupo, marca, volume
            financeiro, quantidade de projetos e status financeiro vinculado.
          </p>
        </div>

        <div className="clients-header-card">
          <Crown size={30} />
          <span>Maior grupo</span>
          <strong>{topGroup?.nome ?? "Sem dados"}</strong>
          <small>{topGroup ? formatMoney(topGroup.total) : "Importe a planilha"}</small>
        </div>
      </section>

      {message && <div className="clients-message">{message}</div>}

      <section className="clients-kpi-grid">
        <div className="clients-kpi-card">
          <div>
            <span>Grupos ativos</span>
            <strong>{grupos.length}</strong>
            <small>clientes consolidados</small>
          </div>
          <Users />
        </div>

        <div className="clients-kpi-card">
          <div>
            <span>Marcas mapeadas</span>
            <strong>{marcas.length}</strong>
            <small>marcas vinculadas</small>
          </div>
          <Tags />
        </div>

        <div className="clients-kpi-card">
          <div>
            <span>Ticket médio / grupo</span>
            <strong>{formatMoney(averageGroupTicket)}</strong>
            <small>média da carteira</small>
          </div>
          <CircleDollarSign />
        </div>

        <div className="clients-kpi-card">
          <div>
            <span>Ticket médio / marca</span>
            <strong>{formatMoney(averageBrandTicket)}</strong>
            <small>{topBrand?.nome ?? "sem marca líder"}</small>
          </div>
          <TrendingUp />
        </div>
      </section>

      <section className="clients-toolbar">
        <div className="clients-search">
          <Search size={18} />
          <input
            placeholder={`Buscar ${viewMode === "grupos" ? "grupo" : "marca"}...`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="clients-tabs">
          <button
            type="button"
            className={viewMode === "grupos" ? "active" : ""}
            onClick={() => {
              setViewMode("grupos");
              setSelectedName(grupos[0]?.nome ?? null);
            }}
          >
            <Building2 size={16} />
            Grupos
          </button>

          <button
            type="button"
            className={viewMode === "marcas" ? "active" : ""}
            onClick={() => {
              setViewMode("marcas");
              setSelectedName(marcas[0]?.nome ?? null);
            }}
          >
            <Sparkles size={16} />
            Marcas
          </button>
        </div>

        <button className="clients-refresh" type="button" onClick={loadClientes}>
          <RefreshCw size={16} />
          Atualizar
        </button>
      </section>

      <section className="clients-main-grid">
        <div className="clients-panel clients-ranking-panel">
          <div className="clients-panel-header">
            <div>
              <p className="clients-overline">Ranking comercial</p>
              <h2>{viewMode === "grupos" ? "Grupos por faturamento" : "Marcas por faturamento"}</h2>
            </div>
            <BadgeDollarSign />
          </div>

          <div className="clients-ranking-list">
            {loading && <div className="clients-empty">Carregando CRM...</div>}

            {!loading &&
              filteredRanking.map((item, index) => (
                <button
                  type="button"
                  className={`clients-ranking-row ${
                    selectedItem?.nome === item.nome ? "selected" : ""
                  }`}
                  key={item.nome}
                  onClick={() => setSelectedName(item.nome)}
                >
                  <span>{index + 1}</span>

                  <div>
                    <strong>{item.nome}</strong>
                    <small>
                      {item.quantidade} projeto(s) ·{" "}
                      {formatPercent(item.total, portfolioRevenue)}
                    </small>
                  </div>

                  <p>{formatMoney(item.total)}</p>
                </button>
              ))}

            {!loading && !filteredRanking.length && (
              <div className="clients-empty">Nenhum resultado encontrado.</div>
            )}
          </div>
        </div>

        <div className="clients-panel clients-profile-panel">
          <div className="clients-panel-header">
            <div>
              <p className="clients-overline">Perfil comercial</p>
              <h2>{selectedItem?.nome ?? "Selecione um item"}</h2>
            </div>
            <ArrowUpRight />
          </div>

          {selectedItem ? (
            <>
              <div className="clients-profile-value">
                <span>{currentLabel} selecionado</span>
                <strong>{formatMoney(selectedItem.total)}</strong>
                <small>{formatPercent(selectedItem.total, portfolioRevenue)} do faturamento total</small>
              </div>

              <div className="clients-profile-grid">
                <div>
                  <span>Projetos</span>
                  <strong>{selectedStats.count}</strong>
                </div>

                <div>
                  <span>Ticket médio</span>
                  <strong>{formatMoney(selectedStats.averageTicket)}</strong>
                </div>

                <div>
                  <span>Pago</span>
                  <strong>{formatMoney(selectedStats.paid)}</strong>
                </div>

                <div>
                  <span>A receber</span>
                  <strong>{formatMoney(selectedStats.waiting)}</strong>
                </div>
              </div>
            </>
          ) : (
            <div className="clients-empty">Nenhum item selecionado.</div>
          )}
        </div>
      </section>

      <section className="clients-chart-grid">
        <div className="clients-panel">
          <div className="clients-panel-header">
            <div>
              <p className="clients-overline">Análise de carteira</p>
              <h2>Top {viewMode === "grupos" ? "grupos" : "marcas"}</h2>
            </div>
            <BarChart3 />
          </div>

          <div className="clients-bar-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredRanking.slice(0, 8)} layout="vertical">
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
                  dataKey="nome"
                  width={150}
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
                <Bar dataKey="total" name="Faturamento" fill="#8b5cf6" radius={[0, 12, 12, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="clients-panel">
          <div className="clients-panel-header">
            <div>
              <p className="clients-overline">Status do selecionado</p>
              <h2>Distribuição financeira</h2>
            </div>
            <Layers3 />
          </div>

          <div className="clients-pie-box">
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

          <div className="clients-legend-list">
            {statusData.map((item, index) => (
              <div key={item.name}>
                <i style={{ background: chartColors[index % chartColors.length] }} />
                <span>{item.name}</span>
                <strong>{formatMoney(item.value)}</strong>
              </div>
            ))}

            {!statusData.length && (
              <div className="clients-empty">Sem status financeiro para exibir.</div>
            )}
          </div>
        </div>
      </section>

      <section className="clients-panel">
        <div className="clients-panel-header">
          <div>
            <p className="clients-overline">Projetos vinculados</p>
            <h2>{selectedItem?.nome ?? "Cliente ou marca selecionado"}</h2>
          </div>
          <Layers3 />
        </div>

        <div className="clients-project-table">
          <div className="clients-project-head">
            <span>Projeto</span>
            <span>Grupo</span>
            <span>Marca</span>
            <span>Valor</span>
            <span>Status</span>
            <span>Previsão</span>
            <span>NF</span>
          </div>

          {relatedProjects.map((project, index) => (
            <div className="clients-project-row" key={`${project.id}-${project.projeto}-${index}`}>
              <span>{project.projeto ?? "Sem projeto"}</span>
              <span>{project.grupo ?? "Sem grupo"}</span>
              <span>{project.marca ?? "Sem marca"}</span>
              <span>{formatMoney(project.valor)}</span>
              <span>
                <strong className={getStatusClass(project.statusFinanceiro)}>
                  {project.statusFinanceiro ?? "A classificar"}
                </strong>
              </span>
              <span>{formatDate(project.previsaoRecebimento)}</span>
              <span>{project.nf ?? "—"}</span>
            </div>
          ))}

          {!relatedProjects.length && (
            <div className="clients-empty">Nenhum projeto relacionado encontrado.</div>
          )}
        </div>
      </section>
    </div>
  );
}
