import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Bot,
  CheckCircle2,
  Clock3,
  Disc3,
  Radio,
  RefreshCw,
  Rocket,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Users,
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

type RoadmapItem = {
  title: string;
  description: string;
  status: "done" | "progress" | "planned";
  icon: LucideIcon;
};

const DISCORD_WIDGET_URL =
  "https://discord.com/api/guilds/833527993409339462/widget.json";

const roadmap: RoadmapItem[] = [
  {
    title: "Widget do servidor",
    description: "Leitura do nome do servidor, quantidade online e membros ativos.",
    status: "done",
    icon: Disc3
  },
  {
    title: "Boas-vindas visual",
    description: "Sistema de entrada e saída com imagem personalizada no bot.",
    status: "done",
    icon: BadgeCheck
  },
  {
    title: "Painel interno",
    description: "Tela dedicada dentro do 2K Command OS para acompanhar o Discord.",
    status: "done",
    icon: ServerCog
  },
  {
    title: "Comandos administrativos",
    description: "Comandos para avisos, regras, status, tickets e rotinas do servidor.",
    status: "planned",
    icon: Bot
  },
  {
    title: "Eventos e agenda",
    description: "Integração futura com a Agenda para avisar prazos e eventos.",
    status: "planned",
    icon: Clock3
  },
  {
    title: "Alertas financeiros",
    description: "Notificações privadas para itens de NF, cobrança e recebimento.",
    status: "planned",
    icon: AlertTriangle
  }
];

const automationIdeas = [
  {
    title: "Mensagem de boas-vindas premium",
    description: "Card visual com avatar, nome, cargo inicial e link de regras.",
    priority: "Alta"
  },
  {
    title: "Resumo diário da 2K",
    description: "Enviar no Discord um resumo de agenda, tarefas e pendências do dia.",
    priority: "Média"
  },
  {
    title: "Alertas de produção",
    description: "Avisar equipe quando um projeto entra em etapa de entrega ou cobrança.",
    priority: "Média"
  },
  {
    title: "Comando /status",
    description: "Mostrar status do servidor, API, planilha, importação e automações.",
    priority: "Baixa"
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

function getRoadmapClass(status: RoadmapItem["status"]) {
  if (status === "done") return "discordops-roadmap-card done";
  if (status === "progress") return "discordops-roadmap-card progress";
  return "discordops-roadmap-card planned";
}

function getRoadmapStatusLabel(status: RoadmapItem["status"]) {
  if (status === "done") return "Concluído";
  if (status === "progress") return "Em andamento";
  return "Planejado";
}

function getPriorityClass(priority: string) {
  const value = priority.toLowerCase();

  if (value === "alta") return "discordops-priority high";
  if (value === "média" || value === "media") return "discordops-priority medium";
  return "discordops-priority low";
}

export function Discord() {
  const [discord, setDiscord] = useState<DiscordWidget | null>(null);
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadDiscordData() {
    try {
      setLoading(true);
      setMessage("");

      const [widgetResponse, healthResponse] = await Promise.all([
        fetch(DISCORD_WIDGET_URL),
        api.get<ApiHealth>("/health")
      ]);

      if (!widgetResponse.ok) {
        throw new Error("Discord widget indisponível");
      }

      const widgetData = await widgetResponse.json();

      setDiscord(widgetData);
      setApiOnline(healthResponse.data?.status === "online");
    } catch {
      setMessage(
        "Erro ao carregar dados do Discord. Verifique se o Widget do servidor está ativo e se o backend está rodando."
      );
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDiscordData();
  }, []);

  const members = discord?.members ?? [];

  const memberStats = useMemo(() => {
    const online = members.filter((member) => member.status === "online").length;
    const idle = members.filter((member) => member.status === "idle").length;
    const dnd = members.filter((member) => member.status === "dnd").length;

    return {
      online,
      idle,
      dnd,
      totalVisible: members.length
    };
  }, [members]);

  const kpis = [
    {
      label: "Servidor",
      value: discord?.name ?? "Carregando",
      description: "Widget oficial do Discord",
      icon: Disc3
    },
    {
      label: "Online agora",
      value: String(discord?.presence_count ?? "--"),
      description: "presenças ativas no servidor",
      icon: Radio
    },
    {
      label: "Membros visíveis",
      value: String(memberStats.totalVisible),
      description: "lista retornada pelo widget",
      icon: Users
    },
    {
      label: "API local",
      value: apiOnline ? "Online" : "Offline",
      description: "backend localhost:3333",
      icon: ServerCog
    }
  ];

  return (
    <div className="discordops-page">
      <section className="discordops-hero">
        <div>
          <p className="discordops-overline">Discord / Comunidade</p>
          <h1>Central de presença, bot e automações do servidor.</h1>
          <p>
            Acompanhe o status do servidor, membros online, saúde da API local,
            roadmap do bot e ideias de automação para tornar a comunidade mais organizada.
          </p>

          <div className="discordops-tags">
            <span>Servidor</span>
            <span>Bot</span>
            <span>Comunidade</span>
            <span>Alertas</span>
            <span>Automações</span>
          </div>
        </div>

        <div className="discordops-hero-card">
          <Activity size={30} />
          <span>Status geral</span>
          <strong>{loading ? "Carregando" : discord ? "Online" : "Atenção"}</strong>
          <small>{discord?.name ?? "Aguardando widget do Discord"}</small>
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
                <small>{item.description}</small>
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

            <button
              type="button"
              className="discordops-icon-button"
              onClick={loadDiscordData}
            >
              <RefreshCw size={16} />
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
              members.slice(0, 14).map((member) => (
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
                Nenhum membro retornado pelo widget.
              </div>
            )}
          </div>
        </div>

        <aside className="discordops-side-stack">
          <div className="discordops-panel">
            <div className="discordops-panel-header">
              <div>
                <p className="discordops-overline">Bot</p>
                <h2>Status do bot</h2>
              </div>
              <Bot />
            </div>

            <div className="discordops-bot-card">
              <div className="discordops-bot-orb">
                <Zap size={28} />
              </div>

              <div>
                <strong>2K Command Bot</strong>
                <span>Base preparada para automações futuras</span>
              </div>
            </div>

            <div className="discordops-bot-metrics">
              <div>
                <span>Boas-vindas</span>
                <strong>Pronto</strong>
              </div>

              <div>
                <span>Comandos</span>
                <strong>Planejado</strong>
              </div>

              <div>
                <span>Alertas</span>
                <strong>Planejado</strong>
              </div>
            </div>
          </div>

          <div className="discordops-panel">
            <div className="discordops-panel-header">
              <div>
                <p className="discordops-overline">Segurança</p>
                <h2>Checklist</h2>
              </div>
              <ShieldCheck />
            </div>

            <div className="discordops-check-list">
              <div>
                <CheckCircle2 size={16} />
                <span>Widget público configurado</span>
              </div>

              <div>
                <CheckCircle2 size={16} />
                <span>Servidor identificado no painel</span>
              </div>

              <div>
                <Clock3 size={16} />
                <span>Permissões do bot pendentes</span>
              </div>

              <div>
                <Clock3 size={16} />
                <span>Comandos administrativos pendentes</span>
              </div>
            </div>
          </div>
        </aside>
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
                <span>{getRoadmapStatusLabel(item.status)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="discordops-panel">
        <div className="discordops-panel-header">
          <div>
            <p className="discordops-overline">Ideias de automação</p>
            <h2>Próximas rotinas para o bot</h2>
          </div>
          <Sparkles />
        </div>

        <div className="discordops-idea-list">
          {automationIdeas.map((idea) => (
            <div key={idea.title}>
              <div>
                <strong>{idea.title}</strong>
                <p>{idea.description}</p>
              </div>

              <span className={getPriorityClass(idea.priority)}>
                {idea.priority}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
