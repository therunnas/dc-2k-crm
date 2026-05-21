import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Bot,
  CalendarDays,
  CheckCircle2,
  Disc3,
  Loader2,
  Megaphone,
  MessageCircle,
  RefreshCw,
  Rocket,
  Send,
  ServerCog,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Zap,
  type LucideIcon
} from "lucide-react";

import "./Discord.css";

type DiscordMember = {
  id: string;
  username: string;
  status: string;
  avatar_url: string;
};

type DiscordWidget = {
  id: string;
  name: string;
  instant_invite?: string;
  presence_count: number;
  members: DiscordMember[];
};

type ApiHealth = {
  status: string;
};

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

type DiscordBotStatus = {
  enabled: boolean;
  configured: boolean;
  ready: boolean;
  botUser: {
    id: string;
    tag: string;
    username: string;
    avatarUrl: string;
  } | null;
  guild: {
    id: string | null;
    name: string | null;
    memberCount: number | null;
  };
  alertChannel: {
    id: string | null;
    name: string | null;
  };
  startedAt: string | null;
  lastError: string | null;
};

type RoadmapStatus = "done" | "progress" | "planned";

type RoadmapItem = {
  title: string;
  description: string;
  status: RoadmapStatus;
  icon: LucideIcon;
};

const DISCORD_WIDGET_URL =
  "https://discord.com/api/guilds/833527993409339462/widget.json";

const roadmap: RoadmapItem[] = [
  {
    title: "Widget do servidor",
    description: "Leitura de presenças online e membros visíveis pelo widget público.",
    status: "done",
    icon: Disc3
  },
  {
    title: "Status real do bot",
    description: "Painel conectado ao backend para verificar se o bot está online.",
    status: "done",
    icon: Bot
  },
  {
    title: "Envio por canal",
    description: "Escolha a sala do Discord e envie mensagem pelo painel.",
    status: "done",
    icon: Send
  },
  {
    title: "Boas-vindas visual",
    description: "Base preparada para card de entrada com avatar e identidade visual.",
    status: "progress",
    icon: BadgeCheck
  },
  {
    title: "Alertas financeiros",
    description: "Futuro: enviar alertas de cobrança, NF e agenda para canais privados.",
    status: "planned",
    icon: AlertTriangle
  },
  {
    title: "Rotina diária automática",
    description: "Futuro: resumo diário com pendências, tarefas e eventos da 2K Studios.",
    status: "planned",
    icon: CalendarDays
  }
];

const botModules = [
  {
    title: "Status do bot",
    description: "Verifica token, conexão, servidor e canal de alerta.",
    status: "Pronto"
  },
  {
    title: "Mensagem por canal",
    description: "Escolha uma sala e envie mensagem diretamente pelo painel.",
    status: "Pronto"
  },
  {
    title: "Boas-vindas",
    description: "Mensagem visual para novos membros com identidade da comunidade.",
    status: "Planejado"
  },
  {
    title: "Avisos",
    description: "Publicação de comunicados e lembretes em canais específicos.",
    status: "Planejado"
  },
  {
    title: "Tickets",
    description: "Solicitações, suporte e atendimento da comunidade.",
    status: "Planejado"
  },
  {
    title: "Agenda",
    description: "Integração futura com prazos e eventos do Command OS.",
    status: "Planejado"
  }
];

const channelSuggestions = [
  {
    title: "📢 avisos",
    description: "Comunicados oficiais, regras, atualizações e mudanças importantes."
  },
  {
    title: "🎬 produções",
    description: "Discussões sobre gravações, jobs, entregas, materiais e bastidores."
  },
  {
    title: "🤖 automações",
    description: "Logs do bot, ideias de IA, comandos internos e testes controlados."
  },
  {
    title: "📅 agenda",
    description: "Eventos, reuniões, prazos e lembretes importantes do servidor."
  }
];

function getStatusLabel(status: string) {
  if (status === "online") return "Online";
  if (status === "idle") return "Ausente";
  if (status === "dnd") return "Ocupado";
  return status || "Indefinido";
}

function getMemberStatusClass(status: string) {
  if (status === "online") return "discordops-member-status online";
  if (status === "idle") return "discordops-member-status idle";
  if (status === "dnd") return "discordops-member-status dnd";
  return "discordops-member-status offline";
}

function getRoadmapClass(status: RoadmapStatus) {
  if (status === "done") return "discordops-roadmap-card done";
  if (status === "progress") return "discordops-roadmap-card progress";
  return "discordops-roadmap-card planned";
}

function getRoadmapLabel(status: RoadmapStatus) {
  if (status === "done") return "Concluído";
  if (status === "progress") return "Em andamento";
  return "Planejado";
}

function getBotModuleClass(status: string) {
  return status === "Pronto"
    ? "discordops-module-status ready"
    : "discordops-module-status planned";
}

function formatDateTime(value?: string | null) {
  if (!value) return "Ainda não iniciado";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

function getBotStatusText(status: DiscordBotStatus | null) {
  if (!status) return "Indisponível";
  if (!status.enabled) return "Desativado";
  if (!status.configured) return "Sem token";
  if (!status.ready) return "Offline";
  return "Online";
}

function getBotStatusClass(status: DiscordBotStatus | null) {
  if (!status) return "discordops-bot-state danger";
  if (!status.enabled || !status.configured || !status.ready) {
    return "discordops-bot-state warning";
  }

  return "discordops-bot-state success";
}

export function Discord() {
  const [discord, setDiscord] = useState<DiscordWidget | null>(null);
  const [apiOnline, setApiOnline] = useState(false);
  const [botStatus, setBotStatus] = useState<DiscordBotStatus | null>(null);
  const [channels, setChannels] = useState<DiscordTextChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [loading, setLoading] = useState(true);
  const [botLoading, setBotLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [testMessage, setTestMessage] = useState(
    "✅ Teste enviado pelo painel do 2K Command OS. Integração Discord funcionando."
  );

  async function loadDiscordData() {
    try {
      setLoading(true);
      setMessage("");

      const healthResponse = await api.get<ApiHealth>("/health");
      setApiOnline(healthResponse.data?.status === "online");

      const botResponse = await api.get<DiscordBotStatus>("/api/discord/bot/status");
      setBotStatus(botResponse.data);

      try {
        const channelsResponse = await api.get<DiscordChannelsResponse>("/api/discord/bot/channels");
        const availableChannels = channelsResponse.data.channels ?? [];

        setChannels(availableChannels);

        if (!selectedChannelId && availableChannels.length) {
          const alertChannelId = botResponse.data.alertChannel.id;
          const defaultChannel =
            availableChannels.find((channel) => channel.id === alertChannelId) ??
            availableChannels[0];

          setSelectedChannelId(defaultChannel.id);
        }
      } catch {
        setChannels([]);
      }

      try {
        const widgetResponse = await fetch(DISCORD_WIDGET_URL);

        if (widgetResponse.ok) {
          const widgetData = (await widgetResponse.json()) as DiscordWidget;
          setDiscord(widgetData);
        } else {
          setDiscord(null);
        }
      } catch {
        setDiscord(null);
      }
    } catch {
      setApiOnline(false);
      setBotStatus(null);
      setMessage("Não foi possível carregar o Discord. Verifique se o backend está rodando.");
    } finally {
      setLoading(false);
    }
  }

  async function startBot() {
    try {
      setBotLoading(true);
      setMessage("");

      const response = await api.post<DiscordBotStatus>("/api/discord/bot/start");

      setBotStatus(response.data);
      setMessage("Comando de inicialização enviado para o bot.");
    } catch {
      setMessage("Erro ao iniciar bot pelo painel. Verifique o backend e o arquivo .env.");
    } finally {
      setBotLoading(false);
    }
  }

  async function sendTestMessage() {
    try {
      setTestLoading(true);
      setMessage("");

      await api.post("/api/discord/bot/test-message", {
        message: testMessage,
        channelId: selectedChannelId || undefined
      });

      const channelName =
        channels.find((channel) => channel.id === selectedChannelId)?.name ?? "canal configurado";

      setMessage(`Mensagem enviada com sucesso para #${channelName}.`);
    } catch {
      setMessage("Erro ao enviar mensagem. Verifique o canal, permissões e DISCORD_ALERT_CHANNEL_ID.");
    } finally {
      setTestLoading(false);
    }
  }

  useEffect(() => {
    loadDiscordData();
  }, []);

  const members = discord?.members ?? [];

  const memberStats = useMemo(() => {
    return {
      online: members.filter((member) => member.status === "online").length,
      idle: members.filter((member) => member.status === "idle").length,
      dnd: members.filter((member) => member.status === "dnd").length,
      visible: members.length
    };
  }, [members]);

  const selectedChannelName =
    channels.find((channel) => channel.id === selectedChannelId)?.name ?? "nenhum canal";

  const kpis = [
    {
      label: "Servidor",
      value: botStatus?.guild.name ?? discord?.name ?? "Indisponível",
      detail: botStatus?.guild.id ? "Conectado pelo bot" : "Widget / config",
      icon: Disc3
    },
    {
      label: "Bot",
      value: getBotStatusText(botStatus),
      detail: botStatus?.botUser?.tag ?? "2K Command Bot",
      icon: Bot
    },
    {
      label: "Canal selecionado",
      value: selectedChannelName,
      detail: "envio manual pelo painel",
      icon: Send
    },
    {
      label: "API local",
      value: apiOnline ? "Online" : "Offline",
      detail: "localhost:3333",
      icon: ServerCog
    }
  ];

  return (
    <div className="discordops-page">
      <section className="discordops-header">
        <div>
          <p className="discordops-overline">Discord / Comunidade & Bot</p>
          <h1>Central operacional do servidor Discord.</h1>
          <p>
            Monitore presença, status real do bot, saúde da API local, canal de alerta
            e envie mensagens para salas específicas diretamente pelo painel.
          </p>
        </div>

        <div className="discordops-header-card">
          <Activity size={30} />
          <span>Status geral</span>
          <strong>{loading ? "Carregando" : getBotStatusText(botStatus)}</strong>
          <small>{botStatus?.botUser?.tag ?? botStatus?.lastError ?? "Bot ainda não validado"}</small>
        </div>
      </section>

      {message && <div className="discordops-message">{message}</div>}

      <section className="discordops-kpi-grid">
        {kpis.map((item) => {
          const Icon = item.icon;

          return (
            <div className="discordops-kpi-card" key={item.label}>
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

      <section className="discordops-main-grid">
        <div className="discordops-panel discordops-members-panel">
          <div className="discordops-panel-header">
            <div>
              <p className="discordops-overline">Presença</p>
              <h2>Membros online</h2>
            </div>

            <button type="button" onClick={loadDiscordData}>
              {loading ? <Loader2 className="discordops-spin" size={16} /> : <RefreshCw size={16} />}
              Atualizar
            </button>
          </div>

          <div className="discordops-presence-grid">
            <div>
              <span>Online</span>
              <strong>{memberStats.online}</strong>
            </div>

            <div>
              <span>Ausente</span>
              <strong>{memberStats.idle}</strong>
            </div>

            <div>
              <span>Ocupado</span>
              <strong>{memberStats.dnd}</strong>
            </div>
          </div>

          <div className="discordops-member-list">
            {loading && <div className="discordops-empty">Carregando membros...</div>}

            {!loading &&
              members.slice(0, 18).map((member) => (
                <div className="discordops-member-row" key={member.id}>
                  <img src={member.avatar_url} alt={member.username} />

                  <div>
                    <strong>{member.username}</strong>
                    <span>{getStatusLabel(member.status)}</span>
                  </div>

                  <i className={getMemberStatusClass(member.status)} />
                </div>
              ))}

            {!loading && !members.length && (
              <div className="discordops-empty">
                Nenhum membro retornado pelo widget público do Discord.
              </div>
            )}
          </div>
        </div>

        <aside className="discordops-side-stack">
          <div className="discordops-panel">
            <div className="discordops-panel-header">
              <div>
                <p className="discordops-overline">Bot real</p>
                <h2>2K Command Bot</h2>
              </div>
              <Bot />
            </div>

            <div className="discordops-bot-card">
              <div className="discordops-bot-orb">
                {botStatus?.botUser?.avatarUrl ? (
                  <img src={botStatus.botUser.avatarUrl} alt={botStatus.botUser.username} />
                ) : (
                  <Zap size={28} />
                )}
              </div>

              <div>
                <strong>{botStatus?.botUser?.tag ?? "Bot não conectado"}</strong>
                <span>{botStatus?.guild.name ?? "Servidor ainda não validado"}</span>
              </div>
            </div>

            <div className="discordops-bot-status-grid">
              <div>
                <span>Ativado</span>
                <strong>{botStatus?.enabled ? "Sim" : "Não"}</strong>
              </div>

              <div>
                <span>Token</span>
                <strong>{botStatus?.configured ? "Configurado" : "Pendente"}</strong>
              </div>

              <div>
                <span>Conexão</span>
                <strong className={getBotStatusClass(botStatus)}>
                  {getBotStatusText(botStatus)}
                </strong>
              </div>

              <div>
                <span>Iniciado em</span>
                <strong>{formatDateTime(botStatus?.startedAt)}</strong>
              </div>
            </div>

            <div className="discordops-bot-config">
              <div>
                <span>Servidor</span>
                <strong>{botStatus?.guild.name ?? "Não identificado"}</strong>
              </div>

              <div>
                <span>Membros</span>
                <strong>{botStatus?.guild.memberCount ?? "--"}</strong>
              </div>

              <div>
                <span>Canal padrão</span>
                <strong>{botStatus?.alertChannel.name ?? botStatus?.alertChannel.id ?? "Não configurado"}</strong>
              </div>

              <div>
                <span>Último erro</span>
                <strong>{botStatus?.lastError ?? "Sem erro registrado"}</strong>
              </div>
            </div>

            <div className="discordops-button-row">
              <button type="button" onClick={startBot} disabled={botLoading}>
                {botLoading ? <Loader2 className="discordops-spin" size={16} /> : <Bot size={16} />}
                Iniciar bot
              </button>

              <button type="button" onClick={loadDiscordData} disabled={loading}>
                {loading ? <Loader2 className="discordops-spin" size={16} /> : <RefreshCw size={16} />}
                Atualizar
              </button>
            </div>
          </div>

          <div className="discordops-panel">
            <div className="discordops-panel-header">
              <div>
                <p className="discordops-overline">Mensagem manual</p>
                <h2>Enviar para uma sala</h2>
              </div>
              <Send />
            </div>

            <div className="discordops-test-box">
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

              <label>
                <span>Mensagem</span>
                <textarea
                  value={testMessage}
                  onChange={(event) => setTestMessage(event.target.value)}
                  rows={5}
                />
              </label>

              <button
                type="button"
                onClick={sendTestMessage}
                disabled={testLoading || !testMessage.trim() || !selectedChannelId}
              >
                {testLoading ? <Loader2 className="discordops-spin" size={16} /> : <Send size={16} />}
                Enviar para sala selecionada
              </button>

              <small>
                {selectedChannelId
                  ? `Mensagem será enviada para #${selectedChannelName}.`
                  : "Carregue os canais ou configure o bot para selecionar uma sala."}
              </small>
            </div>
          </div>
        </aside>
      </section>

      <section className="discordops-panel">
        <div className="discordops-panel-header">
          <div>
            <p className="discordops-overline">Módulos do bot</p>
            <h2>Funções previstas para o servidor</h2>
          </div>
          <Sparkles />
        </div>

        <div className="discordops-module-grid">
          {botModules.map((module) => (
            <div className="discordops-module-card" key={module.title}>
              <div>
                <MessageCircle size={18} />
              </div>

              <strong>{module.title}</strong>
              <p>{module.description}</p>
              <span className={getBotModuleClass(module.status)}>{module.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="discordops-grid-two">
        <div className="discordops-panel">
          <div className="discordops-panel-header">
            <div>
              <p className="discordops-overline">Canais sugeridos</p>
              <h2>Organização da comunidade</h2>
            </div>
            <Megaphone />
          </div>

          <div className="discordops-channel-list">
            {channelSuggestions.map((channel) => (
              <div key={channel.title}>
                <strong>{channel.title}</strong>
                <p>{channel.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="discordops-panel">
          <div className="discordops-panel-header">
            <div>
              <p className="discordops-overline">Próximos alertas</p>
              <h2>Integrações futuras</h2>
            </div>
            <Rocket />
          </div>

          <div className="discordops-alert-list">
            <div>
              <AlertTriangle size={16} />
              <span>Cobranças vencidas vindas do Financeiro.</span>
            </div>

            <div>
              <TerminalSquare size={16} />
              <span>Notas fiscais para gerar ou enviar.</span>
            </div>

            <div>
              <CalendarDays size={16} />
              <span>Prazos e eventos da Agenda.</span>
            </div>

            <div>
              <Bot size={16} />
              <span>Status diário do Command OS.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="discordops-panel">
        <div className="discordops-panel-header">
          <div>
            <p className="discordops-overline">Segurança</p>
            <h2>Checklist de configuração</h2>
          </div>
          <ShieldCheck />
        </div>

        <div className="discordops-check-list">
          <div>
            <CheckCircle2 size={16} />
            <span>Token salvo apenas no .env local.</span>
          </div>

          <div>
            <CheckCircle2 size={16} />
            <span>Bot instalado no servidor Discord.</span>
          </div>

          <div>
            <CheckCircle2 size={16} />
            <span>Canal de alerta configurado.</span>
          </div>

          <div>
            <CheckCircle2 size={16} />
            <span>Envio de mensagem por canal validado.</span>
          </div>
        </div>
      </section>

      <section className="discordops-panel">
        <div className="discordops-panel-header">
          <div>
            <p className="discordops-overline">Roadmap</p>
            <h2>Construção do Discord dentro do Command OS</h2>
          </div>
          <Rocket />
        </div>

        <div className="discordops-roadmap-grid">
          {roadmap.map((item) => {
            const Icon = item.icon;

            return (
              <div className={getRoadmapClass(item.status)} key={item.title}>
                <div className="discordops-roadmap-icon">
                  <Icon size={18} />
                </div>

                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <span>{getRoadmapLabel(item.status)}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}



