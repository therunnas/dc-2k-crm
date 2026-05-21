import { discordRoutes } from "./routes/discordRoutes.js";
import { startDiscordBot } from "./services/discordBot.js";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import * as XLSX from "xlsx";

dotenv.config();

const app = express();
const PORT = 3333;

app.use(cors());
app.use(express.json());

const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, "data");
const IMPORTS_DIR = path.join(DATA_DIR, "imports");

const OBSIDIAN_ROOT = path.join(ROOT_DIR, "..", "..", "obsidian-vault");
const TASKS_FILE = path.join(DATA_DIR, "tasks.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(IMPORTS_DIR)) {
  fs.mkdirSync(IMPORTS_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage()
});

type Task = {
  id: string;
  title: string;
  area: string;
  priority: "Baixa" | "MÃ©dia" | "Alta";
  status: "Pendente" | "Em andamento" | "ConcluÃ­da";
  createdAt: string;
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
  diasParaReceber: number | null;
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

function readTasks(): Task[] {
  if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, "[]", "utf-8");
  }

  const data = fs.readFileSync(TASKS_FILE, "utf-8");
  return JSON.parse(data);
}

function writeTasks(tasks: Task[]) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), "utf-8");
}

function writeJsonFile(fileName: string, data: unknown) {
  const filePath = path.join(DATA_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function readJsonFile<T>(fileName: string, fallback: T): T {
  const filePath = path.join(DATA_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const cleaned = value
      .replace("R$", "")
      .replace(/\./g, "")
      .replace(",", ".")
      .trim();

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function toText(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value).trim();
}

function excelDateToISO(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);

    if (Number.isNaN(date.getTime())) return null;

    return date.toISOString().slice(0, 10);
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).trim();
}


function getSheetRows(workbook: XLSX.WorkBook, sheetName: string) {
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    raw: true
  });
}

function parseEntradas(workbook: XLSX.WorkBook): EntradaFinanceira[] {
  const rows = getSheetRows(workbook, "ðŸ’° ENTRADAS");

  return rows
    .slice(4)
    .map((row): EntradaFinanceira => {
      return {
        mesRef: excelDateToISO(row[0]),
        grupo: toText(row[1]),
        marca: toText(row[2]),
        projeto: toText(row[3]),
        valor: toNumber(row[4]),
        nf: row[5] as string | number | null,
        status: toText(row[6]),
        dataEmissao: excelDateToISO(row[7]),
        previsaoRecebimento: excelDateToISO(row[8]),
        diasParaReceber: toNumber(row[9]) || null,
        recebido: toText(row[10]),
        observacao: toText(row[11]),
        id: toText(row[12])
      };
    })
    .filter((item) => item.projeto && item.valor > 0);
}

function parseSaidas(workbook: XLSX.WorkBook): SaidaFinanceira[] {
  const rows = getSheetRows(workbook, "ðŸ’¸ SAÃDAS");

  return rows
    .slice(5)
    .map((row): SaidaFinanceira => {
      return {
        mesRef: excelDateToISO(row[0]),
        data: excelDateToISO(row[1]),
        categoriaPrincipal: toText(row[2]),
        fornecedor: toText(row[3]),
        descricao: toText(row[4]),
        valor: toNumber(row[5]),
        statusPagamento: toText(row[6]),
        recorrencia: toText(row[7]),
        observacao: toText(row[8]),
        id: toText(row[9]),
        subcategoria: toText(row[10]),
        natureza: toText(row[11])
      };
    })
    .filter((item) => item.fornecedor && item.valor > 0);
}

function parseGenericRanking(workbook: XLSX.WorkBook, sheetName: string, headerRowIndex: number) {
  const rows = getSheetRows(workbook, sheetName).filter(Array.isArray) as unknown[][];

  const header = rows[headerRowIndex] ?? [];

  return rows
    .slice(headerRowIndex + 1)
    .filter((row) => Array.isArray(row) && row.some((cell) => cell !== null && cell !== ""))
    .map((row) => {
      const record: Record<string, unknown> = {};

      header.forEach((columnName, index) => {
        if (columnName) {
          record[String(columnName)] = row[index];
        }
      });

      return record;
    });
}


function aggregateBy<T>(
  items: T[],
  getKey: (item: T) => string | null,
  getValue: (item: T) => number
) {
  const map = new Map<string, { nome: string; total: number; quantidade: number }>();

  for (const item of items) {
    const key = getKey(item);

    if (!key) continue;

    const current = map.get(key) ?? {
      nome: key,
      total: 0,
      quantidade: 0
    };

    current.total += getValue(item);
    current.quantidade += 1;

    map.set(key, current);
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

function normalizeStatus(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function statusIs(item: EntradaFinanceira, expectedStatus: string) {
  return normalizeStatus(item.status) === normalizeStatus(expectedStatus);
}

function isExcludedFromFaturamento(item: EntradaFinanceira) {
  const status = normalizeStatus(item.status);

  return (
    status === "LEAD" ||
    status === "CANCELADO" ||
    status === "CONFIRMAR INFO"
  );
}

function isFaturadoPlanilha(item: EntradaFinanceira) {
  return !isExcludedFromFaturamento(item);
}

function isRecebidoPlanilha(item: EntradaFinanceira) {
  return statusIs(item, "PAGO");
}

function isAReceberPlanilha(item: EntradaFinanceira) {
  return statusIs(item, "AGUARDANDO PAGAMENTO") || statusIs(item, "ATRASADO");
}

function isPreFaturamento(item: EntradaFinanceira) {
  return statusIs(item, "GERAR NF") || statusIs(item, "NF Ã€ ENVIAR") || statusIs(item, "NF A ENVIAR");
}

function dateOnly(value: string | null) {
  if (!value) return null;

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return null;

  parsed.setHours(0, 0, 0, 0);

  return parsed;
}

function isAtrasadoPlanilha(item: EntradaFinanceira) {
  if (statusIs(item, "ATRASADO")) return true;

  if (!statusIs(item, "AGUARDANDO PAGAMENTO")) return false;

  const previsao = dateOnly(item.previsaoRecebimento);

  if (!previsao) return false;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return previsao < hoje;
}

function buildDashboardFinanceiro(
  entradas: EntradaFinanceira[],
  saidas: SaidaFinanceira[]
) {
  const entradasFaturadas = entradas.filter(isFaturadoPlanilha);
  const entradasRecebidas = entradas.filter(isRecebidoPlanilha);
  const entradasAReceber = entradas.filter(isAReceberPlanilha);
  const entradasAtrasadas = entradas.filter(isAtrasadoPlanilha);
  const entradasPreFaturamento = entradas.filter(isPreFaturamento);

  const totalFaturado = entradasFaturadas.reduce((sum, item) => sum + item.valor, 0);
  const totalRecebido = entradasRecebidas.reduce((sum, item) => sum + item.valor, 0);
  const totalAReceber = entradasAReceber.reduce((sum, item) => sum + item.valor, 0);
  const totalAtrasado = entradasAtrasadas.reduce((sum, item) => sum + item.valor, 0);
  const totalPreFaturamento = entradasPreFaturamento.reduce((sum, item) => sum + item.valor, 0);

  const totalSaidas = saidas.reduce((sum, item) => sum + item.valor, 0);

  const totalSaidasPagas = saidas
    .filter((item) => normalizeStatus(item.statusPagamento).includes("PAGO"))
    .reduce((sum, item) => sum + item.valor, 0);

  const lucroCompetencia = totalFaturado - totalSaidas;
  const resultadoCaixa = totalRecebido - totalSaidas;
  const margemCompetencia = totalFaturado > 0 ? lucroCompetencia / totalFaturado : 0;

  const grupos = aggregateBy(
    entradasFaturadas,
    (item) => item.grupo,
    (item) => item.valor
  );

  const marcas = aggregateBy(
    entradasFaturadas,
    (item) => item.marca,
    (item) => item.valor
  );

  const categoriasSaida = aggregateBy(
    saidas,
    (item) => item.categoriaPrincipal,
    (item) => item.valor
  );

  const producoes = entradasFaturadas.map((item) => ({
    id: item.id,
    mesRef: item.mesRef,
    projeto: item.projeto,
    grupo: item.grupo,
    marca: item.marca,
    valor: item.valor,
    nf: item.nf,
    statusFinanceiro: item.status,
    dataEmissao: item.dataEmissao,
    previsaoRecebimento: item.previsaoRecebimento,
    diasParaReceber: item.diasParaReceber,
    recebido: item.recebido,
    etapa: isRecebidoPlanilha(item)
      ? "Finalizado financeiro"
      : isAtrasadoPlanilha(item)
        ? "CobranÃ§a"
        : isAReceberPlanilha(item)
          ? "Aguardando recebimento"
          : isPreFaturamento(item)
            ? "Emitir NF"
            : "A classificar"
  }));

  return {
    atualizadoEm: new Date().toISOString(),
    resumo: {
      totalFaturado,
      totalRecebido,
      totalAReceber,
      totalAtrasado,
      totalPreFaturamento,
      totalSaidas,
      totalSaidasPagas,
      lucroCompetencia,
      resultadoCaixa,
      margemCompetencia,
      quantidadeProjetos: entradasFaturadas.length,
      quantidadeSaidas: saidas.length,
      quantidadeGrupos: grupos.length,
      quantidadeMarcas: marcas.length
    },
    rankings: {
      grupos,
      marcas,
      categoriasSaida
    },
    producoes
  };
}


app.get("/", (_req, res) => {
  res.json({
    app: "2K Command OS API",
    status: "online"
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "online"
  });
});

app.get("/api/tasks", (_req, res) => {
  const tasks = readTasks();
  res.json(tasks);
});

app.post("/api/tasks", (req, res) => {
  const { title, area, priority } = req.body;

  if (!title || !area || !priority) {
    return res.status(400).json({
      error: "Campos obrigatÃ³rios: title, area e priority."
    });
  }

  const tasks = readTasks();

  const newTask: Task = {
    id: crypto.randomUUID(),
    title,
    area,
    priority,
    status: "Pendente",
    createdAt: new Date().toISOString()
  };

  tasks.unshift(newTask);
  writeTasks(tasks);

  return res.status(201).json(newTask);
});

app.patch("/api/tasks/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const tasks = readTasks();
  const task = tasks.find((item) => item.id === id);

  if (!task) {
    return res.status(404).json({
      error: "Tarefa nÃ£o encontrada."
    });
  }

  task.status = status;
  writeTasks(tasks);

  return res.json(task);
});

app.delete("/api/tasks/:id", (req, res) => {
  const { id } = req.params;

  const tasks = readTasks();
  const filteredTasks = tasks.filter((item) => item.id !== id);

  if (tasks.length === filteredTasks.length) {
    return res.status(404).json({
      error: "Tarefa nÃ£o encontrada."
    });
  }

  writeTasks(filteredTasks);

  return res.json({
    success: true
  });
});

app.post("/api/import/fluxo", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Nenhum arquivo enviado. Envie um arquivo no campo 'file'."
      });
    }

    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer",
      cellDates: false
    });

    const entradas = parseEntradas(workbook);
    const saidas = parseSaidas(workbook);
    const grupos = parseGenericRanking(workbook, "ðŸ‘¥ GRUPOS", 3);
    const marcas = parseGenericRanking(workbook, "ðŸŽ¨ MARCAS", 3);
    const dashboardFinanceiro = buildDashboardFinanceiro(entradas, saidas);

    const importFilePath = path.join(
      IMPORTS_DIR,
      `fluxo-2026-${Date.now()}.xlsx`
    );

    fs.writeFileSync(importFilePath, req.file.buffer);

    writeJsonFile("financeiro-entradas.json", entradas);
    writeJsonFile("financeiro-saidas.json", saidas);
    writeJsonFile("clientes-grupos.json", grupos);
    writeJsonFile("clientes-marcas.json", marcas);
    writeJsonFile("dashboard-financeiro.json", dashboardFinanceiro);
    writeJsonFile("producoes.json", dashboardFinanceiro.producoes);
    writeJsonFile("last-import.json", {
      arquivoOriginal: req.file.originalname,
      salvoEm: importFilePath,
      importadoEm: new Date().toISOString(),
      entradas: entradas.length,
      saidas: saidas.length,
      grupos: grupos.length,
      marcas: marcas.length
    });

    return res.json({
      success: true,
      message: "Planilha importada com sucesso.",
      arquivo: req.file.originalname,
      resumo: dashboardFinanceiro.resumo
    });
  } catch (error) {
    console.error(error);

    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : null;

    return res.status(500).json({
      error: "Erro ao importar planilha.",
      detail: message,
      stack
    });
  }
});

app.get("/api/import/fluxo/summary", (_req, res) => {
  const lastImport = readJsonFile("last-import.json", null);
  const dashboardFinanceiro = readJsonFile("dashboard-financeiro.json", null);

  return res.json({
    lastImport,
    dashboardFinanceiro
  });
});

app.get("/api/dashboard/financeiro", (_req, res) => {
  const dashboardFinanceiro = readJsonFile("dashboard-financeiro.json", null);

  if (!dashboardFinanceiro) {
    return res.status(404).json({
      error: "Nenhuma planilha importada ainda."
    });
  }

  return res.json(dashboardFinanceiro);
});

app.get("/api/financeiro/entradas", (_req, res) => {
  return res.json(readJsonFile("financeiro-entradas.json", []));
});

app.get("/api/financeiro/saidas", (_req, res) => {
  return res.json(readJsonFile("financeiro-saidas.json", []));
});

app.get("/api/clientes/grupos", (_req, res) => {
  return res.json(readJsonFile("clientes-grupos.json", []));
});

app.get("/api/clientes/marcas", (_req, res) => {
  return res.json(readJsonFile("clientes-marcas.json", []));
});

app.get("/api/producoes", (_req, res) => {
  return res.json(readJsonFile("producoes.json", []));
});

app.post("/api/obsidian/note", async (req, res) => {
  try {
    const { title, content, folder } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        error: "TÃ­tulo e conteÃºdo obrigatÃ³rios"
      });
    }

    const safeFolder = folder || "00 - Inbox";
    const folderPath = path.join(OBSIDIAN_ROOT, safeFolder);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const safeTitle = String(title).replace(/[<>:"/\\|?*]/g, "");
    const filePath = path.join(folderPath, `${safeTitle}.md`);

    const markdown = `# ${title}

${content}

---
Criado pelo 2K Command OS
`;

    fs.writeFileSync(filePath, markdown, "utf-8");

    return res.json({
      success: true,
      file: filePath
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro interno ao criar nota"
    });
  }
});



app.use("/api/discord", discordRoutes);

startDiscordBot();

app.listen(PORT, () => {
  console.log(`Server online em http://localhost:${PORT}`);
});


