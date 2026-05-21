import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { api } from "../services/api";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileSpreadsheet,
  Filter,
  Loader2,
  Receipt,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Upload,
  XCircle
} from "lucide-react";

import "./Financeiro.css";

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

type RankingItem = {
  nome: string;
  total: number;
  quantidade: number;
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
  dashboardFinanceiro: DashboardFinanceiro | null;
};

type FinanceTab = "entradas" | "saidas" | "conferencia";

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value || 0);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value || 0);
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

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

function normalize(value?: string | null) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getEntradaStatusClass(status?: string | null) {
  const value = normalize(status);

  if (value === "pago") return "finops-status paid";
  if (value.includes("aguardando")) return "finops-status waiting";
  if (value.includes("gerar")) return "finops-status nf";
  if (value.includes("confirmar")) return "finops-status info";
  if (value.includes("atrasado")) return "finops-status late";

  return "finops-status neutral";
}

function getSaidaStatusClass(status?: string | null) {
  const value = normalize(status);

  if (value.includes("pago")) return "finops-status paid";
  if (value.includes("pendente")) return "finops-status waiting";
  if (value.includes("atrasado")) return "finops-status late";

  return "finops-status neutral";
}

export function Financeiro() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [entradas, setEntradas] = useState<EntradaFinanceira[]>([]);
  const [saidas, setSaidas] = useState<SaidaFinanceira[]>([]);
  const [activeTab, setActiveTab] = useState<FinanceTab>("entradas");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [message, setMessage] = useState("");

  const dashboard = summary?.dashboardFinanceiro;
  const resumo = dashboard?.resumo;

  async function loadFinancialData() {
    try {
      setLoadingData(true);

      const [summaryResponse, entradasResponse, saidasResponse] = await Promise.all([
        api.get<ImportSummary>("/api/import/fluxo/summary"),
        api.get<EntradaFinanceira[]>("/api/financeiro/entradas"),
        api.get<SaidaFinanceira[]>("/api/financeiro/saidas")
      ]);

      setSummary(summaryResponse.data);
      setEntradas(entradasResponse.data);
      setSaidas(saidasResponse.data);
    } catch {
      setMessage("Erro ao carregar financeiro. Verifique se o backend está rodando.");
    } finally {
      setLoadingData(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    setFile(selectedFile);
    setMessage("");
  }

  async function handleUpload(event: FormEvent) {
    event.preventDefault();

    if (!file) {
      setMessage("Selecione uma planilha .xlsx antes de importar.");
      return;
    }

    try {
      setLoading(true);
      setMessage("Importando planilha...");

      const formData = new FormData();
      formData.append("file", file);

      await api.post("/api/import/fluxo", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setMessage("Planilha importada com sucesso.");
      setFile(null);

      await loadFinancialData();
    } catch {
      setMessage("Erro ao importar planilha. Verifique o backend e o formato do arquivo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFinancialData();
  }, []);

  const entradaStatuses = useMemo(() => {
    const values = entradas
      .map((item) => item.status)
      .filter(Boolean)
      .map(String);

    return ["Todos", ...Array.from(new Set(values)).sort()];
  }, [entradas]);

  const saidaStatuses = useMemo(() => {
    const values = saidas
      .map((item) => item.statusPagamento)
      .filter(Boolean)
      .map(String);

    return ["Todos", ...Array.from(new Set(values)).sort()];
  }, [saidas]);

  const availableStatuses = activeTab === "entradas" ? entradaStatuses : saidaStatuses;

  const filteredEntradas = useMemo(() => {
    return entradas
      .filter((item) => {
        const text = normalize(
          `${item.id} ${item.grupo} ${item.marca} ${item.projeto} ${item.status} ${item.nf}`
        );

        const matchesSearch = !search || text.includes(normalize(search));
        const matchesStatus = statusFilter === "Todos" || item.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const da = new Date(a.mesRef || a.dataEmissao || a.previsaoRecebimento || "").getTime();
        const db = new Date(b.mesRef || b.dataEmissao || b.previsaoRecebimento || "").getTime();

        return (Number.isNaN(da) ? 0 : da) - (Number.isNaN(db) ? 0 : db);
      });
  }, [entradas, search, statusFilter]);

  const filteredSaidas = useMemo(() => {
    return saidas
      .filter((item) => {
        const text = normalize(
          `${item.id} ${item.fornecedor} ${item.descricao} ${item.categoriaPrincipal} ${item.subcategoria} ${item.statusPagamento}`
        );

        const matchesSearch = !search || text.includes(normalize(search));
        const matchesStatus =
          statusFilter === "Todos" || item.statusPagamento === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const da = new Date(a.mesRef || a.data || "").getTime();
        const db = new Date(b.mesRef || b.data || "").getTime();

        return (Number.isNaN(da) ? 0 : da) - (Number.isNaN(db) ? 0 : db);
      });
  }, [saidas, search, statusFilter]);

  const filteredEntradaTotal = filteredEntradas.reduce((sum, item) => sum + item.valor, 0);
  const filteredSaidaTotal = filteredSaidas.reduce((sum, item) => sum + item.valor, 0);

  const pagos = entradas.filter((item) => normalize(item.status) === "pago");
  const aguardando = entradas.filter((item) =>
    normalize(item.status).includes("aguardando")
  );
  const gerarNf = entradas.filter((item) => normalize(item.status).includes("gerar"));
  const confirmarInfo = entradas.filter((item) =>
    normalize(item.status).includes("confirmar")
  );

  const saidasPagas = saidas.filter((item) =>
    normalize(item.statusPagamento).includes("pago")
  );
  const saidasPendentes = saidas.filter(
    (item) => !normalize(item.statusPagamento).includes("pago")
  );

  return (
    <div className="finops-page">
      <section className="finops-hero">
        <div>
          <p className="finops-overline">Financeiro / Controle</p>
          <h1>Centro financeiro conectado à planilha Fluxo 2026.</h1>
          <p>
            Importe, confira e analise entradas, saídas, recebimentos, emissão de NF,
            valores a receber e resultado financeiro da 2K Studios.
          </p>
        </div>

        <div className="finops-import-card">
          <FileSpreadsheet size={28} />
          <span>Última importação</span>
          <strong>{formatDateTime(summary?.lastImport?.importadoEm)}</strong>
          <small>{summary?.lastImport?.arquivoOriginal ?? "Nenhum arquivo importado"}</small>
        </div>
      </section>

      <section className="finops-top-grid">
        <form className="finops-upload-card" onSubmit={handleUpload}>
          <div className="finops-panel-header">
            <div>
              <p className="finops-overline">Upload XLSX</p>
              <h2>Importar planilha</h2>
            </div>
            <Upload />
          </div>

          <label className="finops-file-input">
            <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
            <FileSpreadsheet size={24} />
            <strong>{file ? file.name : "Selecionar planilha"}</strong>
            <span>A importação substitui os dados atuais pelos dados da planilha.</span>
          </label>

          <button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="spin" size={18} />
                Importando...
              </>
            ) : (
              <>
                <Upload size={18} />
                Importar para o Command OS
              </>
            )}
          </button>

          {message && <div className="finops-message">{message}</div>}
        </form>

        <div className="finops-panel">
          <div className="finops-panel-header">
            <div>
              <p className="finops-overline">Status</p>
              <h2>Dados carregados</h2>
            </div>

            <button className="finops-icon-button" type="button" onClick={loadFinancialData}>
              {loadingData ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
            </button>
          </div>

          <div className="finops-data-status">
            <div>
              <span>Entradas lidas</span>
              <strong>{entradas.length}</strong>
            </div>

            <div>
              <span>Saídas lidas</span>
              <strong>{saidas.length}</strong>
            </div>

            <div>
              <span>Grupos</span>
              <strong>{resumo?.quantidadeGrupos ?? 0}</strong>
            </div>

            <div>
              <span>Marcas</span>
              <strong>{resumo?.quantidadeMarcas ?? 0}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="finops-kpi-grid">
        <div className="finops-kpi-card">
          <div>
            <span>Faturado no ano</span>
            <strong>{formatMoney(resumo?.totalFaturado ?? 0)}</strong>
            <small>{resumo?.quantidadeProjetos ?? 0} projetos considerados</small>
          </div>
          <CircleDollarSign />
        </div>

        <div className="finops-kpi-card">
          <div>
            <span>Recebido no ano</span>
            <strong>{formatMoney(resumo?.totalRecebido ?? 0)}</strong>
            <small>Caixa confirmado</small>
          </div>
          <TrendingUp />
        </div>

        <div className="finops-kpi-card">
          <div>
            <span>A receber</span>
            <strong>{formatMoney(resumo?.totalAReceber ?? 0)}</strong>
            <small>Aguardando pagamento + atrasado</small>
          </div>
          <ArrowUpRight />
        </div>

        <div className="finops-kpi-card danger">
          <div>
            <span>Saídas no ano</span>
            <strong>{formatMoney(resumo?.totalSaidas ?? 0)}</strong>
            <small>{resumo?.quantidadeSaidas ?? 0} lançamentos</small>
          </div>
          <TrendingDown />
        </div>
      </section>

      <section className="finops-kpi-grid secondary">
        <div className="finops-mini-card">
          <CheckCircle2 />
          <span>Pagos</span>
          <strong>{formatMoney(pagos.reduce((sum, item) => sum + item.valor, 0))}</strong>
        </div>

        <div className="finops-mini-card">
          <Clock3 />
          <span>Aguardando pagamento</span>
          <strong>{formatMoney(aguardando.reduce((sum, item) => sum + item.valor, 0))}</strong>
        </div>

        <div className="finops-mini-card">
          <Receipt />
          <span>Gerar NF</span>
          <strong>{formatMoney(gerarNf.reduce((sum, item) => sum + item.valor, 0))}</strong>
        </div>

        <div className="finops-mini-card">
          <AlertTriangle />
          <span>Confirmar info</span>
          <strong>{formatMoney(confirmarInfo.reduce((sum, item) => sum + item.valor, 0))}</strong>
        </div>
      </section>

      <section className="finops-toolbar">
        <div className="finops-tabs">
          <button
            type="button"
            className={activeTab === "entradas" ? "active" : ""}
            onClick={() => {
              setActiveTab("entradas");
              setStatusFilter("Todos");
            }}
          >
            <Banknote size={16} />
            Entradas
          </button>

          <button
            type="button"
            className={activeTab === "saidas" ? "active" : ""}
            onClick={() => {
              setActiveTab("saidas");
              setStatusFilter("Todos");
            }}
          >
            <TrendingDown size={16} />
            Saídas
          </button>

          <button
            type="button"
            className={activeTab === "conferencia" ? "active" : ""}
            onClick={() => {
              setActiveTab("conferencia");
              setStatusFilter("Todos");
            }}
          >
            <CheckCircle2 size={16} />
            Conferência
          </button>
        </div>

        {activeTab !== "conferencia" && (
          <div className="finops-filter-row">
            <div className="finops-search">
              <Search size={18} />
              <input
                placeholder={
                  activeTab === "entradas"
                    ? "Buscar projeto, grupo, marca, NF ou status..."
                    : "Buscar fornecedor, descrição, categoria ou status..."
                }
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="finops-select">
              <Filter size={18} />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {availableStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </section>

      {activeTab === "entradas" && (
        <section className="finops-panel finops-table-panel">
          <div className="finops-panel-header">
            <div>
              <p className="finops-overline">Entradas</p>
              <h2>Projetos faturados e pré-faturamento</h2>
            </div>
            <strong>{formatMoney(filteredEntradaTotal)}</strong>
          </div>

          <div className="finops-table entradas">
            <div className="finops-table-head">
              <span>ID</span>
              <span>Mês</span>
              <span>Grupo</span>
              <span>Marca</span>
              <span>Projeto</span>
              <span>Valor</span>
              <span>Status</span>
              <span>Emissão</span>
              <span>Previsão</span>
              <span>Dias</span>
              <span>NF</span>
              <span>Recebido</span>
            </div>

            {filteredEntradas.map((item, index) => (
              <div className="finops-table-row" key={`${item.id}-${index}`}>
                <span>{item.id ?? "—"}</span>
                <span>{formatDate(item.mesRef)}</span>
                <span>{item.grupo ?? "—"}</span>
                <span>{item.marca ?? "—"}</span>
                <span>{item.projeto ?? "—"}</span>
                <span>{formatMoney(item.valor)}</span>
                <span>
                  <strong className={getEntradaStatusClass(item.status)}>
                    {item.status ?? "—"}
                  </strong>
                </span>
                <span>{formatDate(item.dataEmissao)}</span>
                <span>{formatDate(item.previsaoRecebimento)}</span>
                <span>{item.diasParaReceber ?? "—"}</span>
                <span>{item.nf ?? "—"}</span>
                <span>{item.recebido ?? "—"}</span>
              </div>
            ))}

            {!filteredEntradas.length && (
              <div className="finops-empty">Nenhuma entrada encontrada.</div>
            )}
          </div>
        </section>
      )}

      {activeTab === "saidas" && (
        <section className="finops-panel finops-table-panel">
          <div className="finops-panel-header">
            <div>
              <p className="finops-overline">Saídas</p>
              <h2>Custos, fornecedores e despesas</h2>
            </div>
            <strong>{formatMoney(filteredSaidaTotal)}</strong>
          </div>

          <div className="finops-table saidas">
            <div className="finops-table-head">
              <span>ID</span>
              <span>Mês</span>
              <span>Data</span>
              <span>Categoria</span>
              <span>Subcategoria</span>
              <span>Fornecedor</span>
              <span>Descrição</span>
              <span>Valor</span>
              <span>Status</span>
              <span>Recorrência</span>
              <span>Natureza</span>
            </div>

            {filteredSaidas.map((item, index) => (
              <div className="finops-table-row" key={`${item.id}-${index}`}>
                <span>{item.id ?? "—"}</span>
                <span>{formatDate(item.mesRef)}</span>
                <span>{formatDate(item.data)}</span>
                <span>{item.categoriaPrincipal ?? "—"}</span>
                <span>{item.subcategoria ?? "—"}</span>
                <span>{item.fornecedor ?? "—"}</span>
                <span>{item.descricao ?? "—"}</span>
                <span>{formatMoney(item.valor)}</span>
                <span>
                  <strong className={getSaidaStatusClass(item.statusPagamento)}>
                    {item.statusPagamento ?? "—"}
                  </strong>
                </span>
                <span>{item.recorrencia ?? "—"}</span>
                <span>{item.natureza ?? "—"}</span>
              </div>
            ))}

            {!filteredSaidas.length && (
              <div className="finops-empty">Nenhuma saída encontrada.</div>
            )}
          </div>
        </section>
      )}

      {activeTab === "conferencia" && (
        <section className="finops-conference-grid">
          <div className="finops-panel">
            <div className="finops-panel-header">
              <div>
                <p className="finops-overline">Conferência</p>
                <h2>Resumo financeiro</h2>
              </div>
              <CheckCircle2 />
            </div>

            <div className="finops-check-list">
              <div>
                <span>Faturado no ano</span>
                <strong>{formatMoney(resumo?.totalFaturado ?? 0)}</strong>
              </div>

              <div>
                <span>Recebido no ano</span>
                <strong>{formatMoney(resumo?.totalRecebido ?? 0)}</strong>
              </div>

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
                <span>Saídas no ano</span>
                <strong>{formatMoney(resumo?.totalSaidas ?? 0)}</strong>
              </div>

              <div>
                <span>Lucro competência</span>
                <strong>{formatMoney(resumo?.lucroCompetencia ?? 0)}</strong>
              </div>

              <div>
                <span>Resultado de caixa</span>
                <strong>{formatMoney(resumo?.resultadoCaixa ?? 0)}</strong>
              </div>

              <div>
                <span>Margem</span>
                <strong>{formatPercent(resumo?.margemCompetencia ?? 0)}</strong>
              </div>
            </div>
          </div>

          <div className="finops-panel">
            <div className="finops-panel-header">
              <div>
                <p className="finops-overline">Status</p>
                <h2>Contadores operacionais</h2>
              </div>
              <Receipt />
            </div>

            <div className="finops-check-list">
              <div>
                <span>Entradas pagas</span>
                <strong>{pagos.length}</strong>
              </div>

              <div>
                <span>Aguardando pagamento</span>
                <strong>{aguardando.length}</strong>
              </div>

              <div>
                <span>Gerar NF</span>
                <strong>{gerarNf.length}</strong>
              </div>

              <div>
                <span>Confirmar info</span>
                <strong>{confirmarInfo.length}</strong>
              </div>

              <div>
                <span>Saídas pagas</span>
                <strong>{saidasPagas.length}</strong>
              </div>

              <div>
                <span>Saídas pendentes</span>
                <strong>{saidasPendentes.length}</strong>
              </div>
            </div>
          </div>

          <div className="finops-panel">
            <div className="finops-panel-header">
              <div>
                <p className="finops-overline">Alertas</p>
                <h2>Pontos para revisar</h2>
              </div>
              <XCircle />
            </div>

            <div className="finops-alert-list">
              <div>
                <AlertTriangle />
                <span>Conferir itens com status “Confirmar info”.</span>
              </div>

              <div>
                <Receipt />
                <span>Verificar projetos em “Gerar NF” antes de contar como recebimento.</span>
              </div>

              <div>
                <Clock3 />
                <span>A receber deve considerar “Aguardando pagamento” e “Atrasado”.</span>
              </div>

              <div>
                <CheckCircle2 />
                <span>Reimporte a planilha sempre que houver alteração no Google Sheets.</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
