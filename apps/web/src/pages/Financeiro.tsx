import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { api } from "../services/api";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Search,
  Upload,
  WalletCards
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

type SaidaFinanceira = Record<string, unknown>;

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

type TabMode = "entradas" | "saidas" | "conferencia";

function normalize(value?: string | number | null) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  if (typeof value === "string") {
    const cleaned = value
      .replace(/[R$\s]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");

    const parsed = Number(cleaned);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function getString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
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

function isPago(status: string | null) {
  const normalized = normalize(status);
  return normalized === "pago" || normalized.includes(" pago");
}

function isAguardandoPagamento(status: string | null) {
  const normalized = normalize(status);

  return (
    normalized.includes("aguardando pagamento") ||
    normalized.includes("atrasado") ||
    normalized.includes("vencido")
  );
}

function isGerarNf(status: string | null) {
  const normalized = normalize(status);

  return (
    normalized.includes("gerar nf") ||
    normalized.includes("nf a enviar") ||
    normalized.includes("emitir nf") ||
    normalized.includes("enviar nf")
  );
}

function isConfirmarInfo(status: string | null) {
  const normalized = normalize(status);

  return (
    normalized.includes("confirmar info") ||
    normalized.includes("confirmar") ||
    normalized.includes("validar")
  );
}

function getSaidaValor(item: SaidaFinanceira) {
  const possibleKeys = ["valor", "Valor", "total", "Total", "valorPago", "Valor Pago"];

  for (const key of possibleKeys) {
    if (key in item) return getNumber(item[key]);
  }

  return 0;
}

function getSaidaDescricao(item: SaidaFinanceira) {
  const possibleKeys = ["descricao", "Descrição", "fornecedor", "Fornecedor", "categoria", "Categoria"];

  for (const key of possibleKeys) {
    if (key in item) return getString(item[key]);
  }

  return "Saída sem descrição";
}

export function Financeiro() {
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [entradas, setEntradas] = useState<EntradaFinanceira[]>([]);
  const [saidas, setSaidas] = useState<SaidaFinanceira[]>([]);
  const [tab, setTab] = useState<TabMode>("entradas");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setMessage("");

      const [summaryResponse, entradasResponse] = await Promise.all([
        api.get<ImportSummary>("/api/import/fluxo/summary"),
        api.get<EntradaFinanceira[]>("/api/financeiro/entradas")
      ]);

      setSummary(summaryResponse.data);
      setEntradas(entradasResponse.data ?? []);

      try {
        const saidasResponse = await api.get<SaidaFinanceira[]>("/api/financeiro/saidas");
        setSaidas(saidasResponse.data ?? []);
      } catch {
        setSaidas([]);
      }
    } catch {
      setMessage("Erro ao carregar dados financeiros. Verifique se o backend está rodando.");
      setSummary(null);
      setEntradas([]);
      setSaidas([]);
    } finally {
      setLoading(false);
    }
  }

  async function importFile() {
    if (!selectedFile) {
      setMessage("Selecione uma planilha antes de importar.");
      return;
    }

    try {
      setImporting(true);
      setMessage("");

      const formData = new FormData();
      formData.append("file", selectedFile);

      await api.post("/api/import/fluxo", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setMessage("Planilha importada com sucesso.");
      setSelectedFile(null);
      await loadData();
    } catch {
      setMessage("Erro ao importar planilha. Verifique se o arquivo está correto.");
    } finally {
      setImporting(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] ?? null);
  }

  useEffect(() => {
    loadData();
  }, []);

  const resumo = summary?.dashboardFinanceiro?.resumo;

  const statusResumo = useMemo(() => {
    const pagos = entradas.filter((item) => isPago(item.status));
    const aguardando = entradas.filter((item) => isAguardandoPagamento(item.status));
    const gerarNf = entradas.filter((item) => isGerarNf(item.status));
    const confirmarInfo = entradas.filter((item) => isConfirmarInfo(item.status));

    return {
      pagos: pagos.reduce((sum, item) => sum + getNumber(item.valor), 0),
      aguardando: aguardando.reduce((sum, item) => sum + getNumber(item.valor), 0),
      gerarNf: gerarNf.reduce((sum, item) => sum + getNumber(item.valor), 0),
      confirmarInfo: confirmarInfo.reduce((sum, item) => sum + getNumber(item.valor), 0),
      qtdPagos: pagos.length,
      qtdAguardando: aguardando.length,
      qtdGerarNf: gerarNf.length,
      qtdConfirmarInfo: confirmarInfo.length
    };
  }, [entradas]);

  const totais = {
    faturado:
      resumo?.totalFaturado ??
      entradas.reduce((sum, item) => sum + getNumber(item.valor), 0),
    recebido:
      resumo?.totalRecebido ??
      statusResumo.pagos,
    aReceber:
      resumo?.totalAReceber ??
      statusResumo.aguardando,
    saidas:
      resumo?.totalSaidas ??
      saidas.reduce((sum, item) => sum + getSaidaValor(item), 0),
    entradasLidas: summary?.lastImport?.entradas ?? entradas.length,
    saidasLidas: summary?.lastImport?.saidas ?? saidas.length,
    grupos: summary?.lastImport?.grupos ?? resumo?.quantidadeGrupos ?? 0,
    marcas: summary?.lastImport?.marcas ?? resumo?.quantidadeMarcas ?? 0
  };

  const filteredEntradas = useMemo(() => {
    const searchTerm = normalize(search);

    return entradas.filter((item) => {
      const content = normalize(
        [
          item.projeto,
          item.grupo,
          item.marca,
          item.status,
          item.nf,
          item.id
        ].join(" ")
      );

      const matchesSearch = !searchTerm || content.includes(searchTerm);

      const normalizedStatus = normalize(item.status);

      const matchesStatus =
        statusFilter === "todos" ||
        normalizedStatus.includes(normalize(statusFilter));

      return matchesSearch && matchesStatus;
    });
  }, [entradas, search, statusFilter]);

  const filteredSaidas = useMemo(() => {
    const searchTerm = normalize(search);

    return saidas.filter((item) => {
      const content = normalize(JSON.stringify(item));
      return !searchTerm || content.includes(searchTerm);
    });
  }, [saidas, search]);

  const statusOptions = useMemo(() => {
    const uniqueStatuses = Array.from(
      new Set(
        entradas
          .map((item) => item.status)
          .filter(Boolean)
          .map((item) => String(item))
      )
    );

    return uniqueStatuses.sort((a, b) => a.localeCompare(b));
  }, [entradas]);

  return (
    <div className="finance-page">
      <section className="finance-hero">
        <div>
          <p className="finance-overline">Financeiro / Controle</p>
          <h1>Centro financeiro conectado à planilha Fluxo 2026.</h1>
          <p>
            Importe, confira e analise entradas, saídas, recebimentos, emissão de NF,
            valores a receber e resultado financeiro da 2K Studios.
          </p>
        </div>

        <div className="finance-import-info">
          <FileSpreadsheet size={28} />
          <span>Última importação</span>
          <strong>{formatDateTime(summary?.lastImport?.importadoEm ?? summary?.lastImport?.salvoEm)}</strong>
          <small>{summary?.lastImport?.arquivoOriginal ?? "Nenhuma planilha carregada"}</small>
        </div>
      </section>

      {message && <div className="finance-message">{message}</div>}

      <section className="finance-top-grid">
        <div className="finance-panel">
          <div className="finance-panel-header">
            <div>
              <p className="finance-overline">Upload XLSX</p>
              <h2>Importar planilha</h2>
            </div>
            <Upload />
          </div>

          <label className="finance-upload-box">
            <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
            <FileSpreadsheet />
            <strong>{selectedFile ? selectedFile.name : "Selecionar planilha"}</strong>
            <span>A importação substitui os dados atuais pelos dados da planilha.</span>
          </label>

          <button className="finance-primary-button" type="button" onClick={importFile} disabled={importing}>
            {importing ? <Loader2 className="finance-spin" size={16} /> : <Upload size={16} />}
            Importar para o Command OS
          </button>
        </div>

        <div className="finance-panel">
          <div className="finance-panel-header">
            <div>
              <p className="finance-overline">Status</p>
              <h2>Dados carregados</h2>
            </div>

            <button type="button" onClick={loadData}>
              {loading ? <Loader2 className="finance-spin" size={16} /> : <RefreshCw size={16} />}
            </button>
          </div>

          <div className="finance-loaded-grid">
            <div>
              <span>Entradas lidas</span>
              <strong>{totais.entradasLidas}</strong>
            </div>

            <div>
              <span>Saídas lidas</span>
              <strong>{totais.saidasLidas}</strong>
            </div>

            <div>
              <span>Grupos</span>
              <strong>{totais.grupos}</strong>
            </div>

            <div>
              <span>Marcas</span>
              <strong>{totais.marcas}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="finance-kpi-grid">
        <article className="finance-kpi-card">
          <div>
            <span>Faturado no ano</span>
            <strong>{formatMoney(totais.faturado)}</strong>
            <small>{entradas.length} projetos considerados</small>
          </div>
          <CircleDollarSign />
        </article>

        <article className="finance-kpi-card">
          <div>
            <span>Recebido no ano</span>
            <strong>{formatMoney(totais.recebido)}</strong>
            <small>Caixa confirmado</small>
          </div>
          <ArrowUpRight />
        </article>

        <article className="finance-kpi-card">
          <div>
            <span>A receber</span>
            <strong>{formatMoney(totais.aReceber)}</strong>
            <small>Aguardando pagamento + atrasado</small>
          </div>
          <ArrowUpRight />
        </article>

        <article className="finance-kpi-card orange">
          <div>
            <span>Saídas no ano</span>
            <strong>{formatMoney(totais.saidas)}</strong>
            <small>{saidas.length} lançamento(s)</small>
          </div>
          <ArrowDownRight />
        </article>
      </section>

      <section className="finance-status-grid">
        <article>
          <CheckCircle2 />
          <span>Pagos</span>
          <strong>{formatMoney(statusResumo.pagos)}</strong>
          <small>{statusResumo.qtdPagos} item(ns)</small>
        </article>

        <article>
          <Clock3 />
          <span>Aguardando pagamento</span>
          <strong>{formatMoney(statusResumo.aguardando)}</strong>
          <small>{statusResumo.qtdAguardando} item(ns)</small>
        </article>

        <article>
          <WalletCards />
          <span>Gerar NF</span>
          <strong>{formatMoney(statusResumo.gerarNf)}</strong>
          <small>{statusResumo.qtdGerarNf} item(ns)</small>
        </article>

        <article>
          <AlertTriangle />
          <span>Confirmar info</span>
          <strong>{formatMoney(statusResumo.confirmarInfo)}</strong>
          <small>{statusResumo.qtdConfirmarInfo} item(ns)</small>
        </article>
      </section>

      <section className="finance-tabs">
        <button type="button" className={tab === "entradas" ? "active" : ""} onClick={() => setTab("entradas")}>
          Entradas
        </button>

        <button type="button" className={tab === "saidas" ? "active" : ""} onClick={() => setTab("saidas")}>
          Saídas
        </button>

        <button type="button" className={tab === "conferencia" ? "active" : ""} onClick={() => setTab("conferencia")}>
          Conferência
        </button>
      </section>

      <section className="finance-filters">
        <label>
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar projeto, grupo, marca, NF ou status..."
          />
        </label>

        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="todos">Todos</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </section>

      {tab === "entradas" && (
        <section className="finance-table-panel">
          <div className="finance-table-header">
            <div>
              <p className="finance-overline">Entradas</p>
              <h2>Projetos faturados e pré-faturamento</h2>
            </div>

            <strong>{formatMoney(filteredEntradas.reduce((sum, item) => sum + getNumber(item.valor), 0))}</strong>
          </div>

          <div className="finance-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Mês</th>
                  <th>Grupo</th>
                  <th>Marca</th>
                  <th>Projeto</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Emissão</th>
                  <th>Previsão</th>
                  <th>NF</th>
                  <th>Recebido</th>
                </tr>
              </thead>

              <tbody>
                {filteredEntradas.map((item, index) => (
                  <tr key={`${item.id}-${index}`}>
                    <td>{item.id ?? "—"}</td>
                    <td>{item.mesRef ?? "—"}</td>
                    <td>{item.grupo ?? "—"}</td>
                    <td>{item.marca ?? "—"}</td>
                    <td>{item.projeto ?? "—"}</td>
                    <td>{formatMoney(getNumber(item.valor))}</td>
                    <td>
                      <span className="finance-status-pill">{item.status ?? "—"}</span>
                    </td>
                    <td>{item.dataEmissao ?? "—"}</td>
                    <td>{item.previsaoRecebimento ?? "—"}</td>
                    <td>{item.nf ?? "—"}</td>
                    <td>{item.recebido ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "saidas" && (
        <section className="finance-table-panel">
          <div className="finance-table-header">
            <div>
              <p className="finance-overline">Saídas</p>
              <h2>Custos e despesas importadas</h2>
            </div>

            <strong>{formatMoney(filteredSaidas.reduce((sum, item) => sum + getSaidaValor(item), 0))}</strong>
          </div>

          <div className="finance-simple-list">
            {filteredSaidas.map((item, index) => (
              <article key={index}>
                <div>
                  <strong>{getSaidaDescricao(item)}</strong>
                  <span>{JSON.stringify(item)}</span>
                </div>

                <b>{formatMoney(getSaidaValor(item))}</b>
              </article>
            ))}

            {!filteredSaidas.length && <div className="finance-empty">Nenhuma saída encontrada.</div>}
          </div>
        </section>
      )}

      {tab === "conferencia" && (
        <section className="finance-table-panel">
          <div className="finance-table-header">
            <div>
              <p className="finance-overline">Conferência</p>
              <h2>Validação dos status da planilha</h2>
            </div>
          </div>

          <div className="finance-conference-grid">
            <div>
              <span>Status encontrados</span>
              <strong>{statusOptions.length}</strong>
              <small>{statusOptions.join(", ") || "Nenhum status encontrado"}</small>
            </div>

            <div>
              <span>Pagos</span>
              <strong>{formatMoney(statusResumo.pagos)}</strong>
              <small>{statusResumo.qtdPagos} item(ns)</small>
            </div>

            <div>
              <span>Aguardando</span>
              <strong>{formatMoney(statusResumo.aguardando)}</strong>
              <small>{statusResumo.qtdAguardando} item(ns)</small>
            </div>

            <div>
              <span>NF / Info</span>
              <strong>{formatMoney(statusResumo.gerarNf + statusResumo.confirmarInfo)}</strong>
              <small>{statusResumo.qtdGerarNf + statusResumo.qtdConfirmarInfo} item(ns)</small>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

