import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader2,
  RefreshCw,
  Send
} from "lucide-react";

import "./DiscordFinanceAlerts.css";

type DiscordTextChannel = {
  id: string;
  name: string;
  type: string;
};

type DiscordChannelsResponse = {
  success: boolean;
  channels: DiscordTextChannel[];
  error?: string;
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

type AlertPriority = "Alta" | "Média" | "Baixa";

type FinancialAlert = {
  id: string;
  type: string;
  project: string;
  client: string;
  value: number;
  status: string;
  date: string | null;
  priority: AlertPriority;
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
  if (days < 0) return `${Math.abs(days)} dias atrasado`;

  return `Em ${days} dias`;
}

function getPriorityClass(priority: AlertPriority) {
  if (priority === "Alta") return "discord-finance-priority high";
  if (priority === "Média") return "discord-finance-priority medium";

  return "discord-finance-priority low";
}

export function DiscordFinanceAlerts() {
  const [channels, setChannels] = useState<DiscordTextChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [entries, setEntries] = useState<EntradaFinanceira[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMode, setSendingMode] = useState<"summary" | "critical" | null>(null);
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setMessage("");

      const [channelsResponse, entriesResponse] = await Promise.all([
        api.get<DiscordChannelsResponse>("/api/discord/bot/channels"),
        api.get<EntradaFinanceira[]>("/api/financeiro/entradas")
      ]);

      const availableChannels = channelsResponse.data.channels ?? [];

      setChannels(availableChannels);
      setEntries(entriesResponse.data ?? []);

      if (!selectedChannelId && availableChannels.length) {
        setSelectedChannelId(availableChannels[0].id);
      }
    } catch {
      setMessage("Erro ao carregar canais ou dados financeiros. Verifique backend, bot e planilha importada.");
      setChannels([]);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const financialAlerts = useMemo(() => {
    const alerts: FinancialAlert[] = [];

    entries.forEach((item, index) => {
      const status = normalize(item.status);
      const days = getDaysFromToday(item.previsaoRecebimento);
      const project = item.projeto || "Projeto sem nome";
      const client = item.grupo || item.marca || "Cliente sem nome";
      const value = item.valor || 0;

      if (status.includes("atrasado")) {
        alerts.push({
          id: `late-${item.id ?? index}`,
          type: "Cobrança vencida",
          project,
          client,
          value,
          status: item.status || "Atrasado",
          date: item.previsaoRecebimento,
          priority: "Alta"
        });

        return;
      }

      if (status.includes("aguardando") && days !== null && days < 0) {
        alerts.push({
          id: `overdue-${item.id ?? index}`,
          type: "Cobrança vencida",
          project,
          client,
          value,
          status: item.status || "Aguardando pagamento",
          date: item.previsaoRecebimento,
          priority: "Alta"
        });

        return;
      }

      if (status.includes("aguardando") && days !== null && days >= 0 && days <= 7) {
        alerts.push({
          id: `followup-${item.id ?? index}`,
          type: "Follow-up de recebimento",
          project,
          client,
          value,
          status: item.status || "Aguardando pagamento",
          date: item.previsaoRecebimento,
          priority: "Média"
        });
      }

      if (status.includes("gerar") || status.includes("nf a enviar")) {
        alerts.push({
          id: `nf-${item.id ?? index}`,
          type: "Gerar ou enviar NF",
          project,
          client,
          value,
          status: item.status || "Gerar NF",
          date: item.dataEmissao,
          priority: "Média"
        });
      }

      if (status.includes("confirmar")) {
        alerts.push({
          id: `confirm-${item.id ?? index}`,
          type: "Confirmar informação",
          project,
          client,
          value,
          status: item.status || "Confirmar info",
          date: item.dataEmissao,
          priority: "Baixa"
        });
      }
    });

    const priorityWeight = {
      Alta: 0,
      Média: 1,
      Baixa: 2
    };

    return alerts.sort((a, b) => {
      const priorityDiff = priorityWeight[a.priority] - priorityWeight[b.priority];

      if (priorityDiff !== 0) return priorityDiff;

      const da = parseDate(a.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const db = parseDate(b.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;

      return da - db;
    });
  }, [entries]);

  const criticalAlerts = financialAlerts.filter((alert) => alert.priority === "Alta");
  const mediumAlerts = financialAlerts.filter((alert) => alert.priority === "Média");
  const lowAlerts = financialAlerts.filter((alert) => alert.priority === "Baixa");

  const criticalTotal = criticalAlerts.reduce((sum, alert) => sum + alert.value, 0);
  const alertTotal = financialAlerts.reduce((sum, alert) => sum + alert.value, 0);

  const selectedChannelName =
    channels.find((channel) => channel.id === selectedChannelId)?.name ?? "nenhum canal";

  function buildDiscordMessage(mode: "summary" | "critical") {
    const targetAlerts = mode === "critical" ? criticalAlerts : financialAlerts;
    const title =
      mode === "critical"
        ? "🚨 **2K Command OS — Alertas críticos financeiros**"
        : "📊 **2K Command OS — Resumo financeiro operacional**";

    const stats = [
      `Canal: #${selectedChannelName}`,
      `Críticos: ${criticalAlerts.length} (${formatMoney(criticalTotal)})`,
      `Médios: ${mediumAlerts.length}`,
      `Baixos: ${lowAlerts.length}`,
      `Total monitorado: ${formatMoney(alertTotal)}`
    ];

    const lines = targetAlerts.slice(0, 10).map((alert, index) => {
      return `${index + 1}. **${alert.type}** | ${alert.client} | ${alert.project} | ${formatMoney(alert.value)} | ${formatDate(alert.date)} (${getDateLabel(alert.date)})`;
    });

    const body = lines.length
      ? lines.join("\n")
      : "Nenhum alerta encontrado no momento.";

    const finalMessage = [
      title,
      "",
      stats.join("\n"),
      "",
      "**Itens principais:**",
      body,
      "",
      "_Enviado automaticamente pelo painel 2K Command OS._"
    ].join("\n");

    return finalMessage.slice(0, 1900);
  }

  async function sendFinancialAlert(mode: "summary" | "critical") {
    if (!selectedChannelId) {
      setMessage("Selecione uma sala antes de enviar.");
      return;
    }

    try {
      setSendingMode(mode);
      setMessage("");

      await api.post("/api/discord/bot/test-message", {
        channelId: selectedChannelId,
        message: buildDiscordMessage(mode)
      });

      setMessage(
        mode === "critical"
          ? `Alertas críticos enviados para #${selectedChannelName}.`
          : `Resumo financeiro enviado para #${selectedChannelName}.`
      );
    } catch {
      setMessage("Erro ao enviar alerta financeiro. Verifique permissões do bot no canal selecionado.");
    } finally {
      setSendingMode(null);
    }
  }

  return (
    <section className="discordops-panel discord-finance-alerts">
      <div className="discordops-panel-header">
        <div>
          <p className="discordops-overline">Financeiro → Discord</p>
          <h2>Enviar alertas financeiros para uma sala</h2>
        </div>

        <BellRing />
      </div>

      {message && <div className="discord-finance-message">{message}</div>}

      <div className="discord-finance-top">
        <div>
          <AlertTriangle />
          <span>Críticos</span>
          <strong>{criticalAlerts.length}</strong>
          <small>{formatMoney(criticalTotal)}</small>
        </div>

        <div>
          <Clock3 />
          <span>Médios</span>
          <strong>{mediumAlerts.length}</strong>
          <small>follow-up / NF</small>
        </div>

        <div>
          <CheckCircle2 />
          <span>Baixos</span>
          <strong>{lowAlerts.length}</strong>
          <small>conferência</small>
        </div>

        <div>
          <CircleDollarSign />
          <span>Total</span>
          <strong>{formatMoney(alertTotal)}</strong>
          <small>{financialAlerts.length} alerta(s)</small>
        </div>
      </div>

      <div className="discord-finance-controls">
        <label>
          <span>Escolher sala</span>
          <select
            value={selectedChannelId}
            onChange={(event) => setSelectedChannelId(event.target.value)}
          >
            {!channels.length && <option value="">Nenhum canal carregado</option>}

            {channels.map((channel) => (
              <option value={channel.id} key={channel.id}>
                #{channel.name}
              </option>
            ))}
          </select>
        </label>

        <button type="button" onClick={loadData} disabled={loading}>
          {loading ? <Loader2 className="discord-finance-spin" size={16} /> : <RefreshCw size={16} />}
          Atualizar dados
        </button>
      </div>

      <div className="discord-finance-preview">
        {loading && <div className="discordops-empty">Carregando alertas financeiros...</div>}

        {!loading &&
          financialAlerts.slice(0, 8).map((alert) => (
            <article key={alert.id}>
              <div>
                <span className={getPriorityClass(alert.priority)}>{alert.priority}</span>
                <strong>{alert.type}</strong>
              </div>

              <p>
                {alert.client} · {alert.project}
              </p>

              <footer>
                <span>{formatMoney(alert.value)}</span>
                <span>{formatDate(alert.date)} · {getDateLabel(alert.date)}</span>
                <span>{alert.status}</span>
              </footer>
            </article>
          ))}

        {!loading && !financialAlerts.length && (
          <div className="discordops-empty">
            Nenhum alerta financeiro detectado para envio.
          </div>
        )}
      </div>

      <div className="discord-finance-actions">
        <button
          type="button"
          onClick={() => sendFinancialAlert("critical")}
          disabled={sendingMode !== null || !selectedChannelId || !criticalAlerts.length}
        >
          {sendingMode === "critical" ? (
            <Loader2 className="discord-finance-spin" size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          Enviar críticos
        </button>

        <button
          type="button"
          onClick={() => sendFinancialAlert("summary")}
          disabled={sendingMode !== null || !selectedChannelId || !financialAlerts.length}
        >
          {sendingMode === "summary" ? (
            <Loader2 className="discord-finance-spin" size={16} />
          ) : (
            <Send size={16} />
          )}
          Enviar resumo financeiro
        </button>
      </div>
    </section>
  );
}
