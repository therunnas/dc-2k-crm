import "dotenv/config";
import { ActivityType, ChannelType, Client, GatewayIntentBits } from "discord.js";

let client: Client | null = null;
let startedAt: string | null = null;
let lastError: string | null = null;

function isBotEnabled() {
  return process.env.DISCORD_BOT_ENABLED === "true";
}

function getToken() {
  return process.env.DISCORD_BOT_TOKEN;
}

function getGuildId() {
  return process.env.DISCORD_GUILD_ID;
}

function getAlertChannelId() {
  return process.env.DISCORD_ALERT_CHANNEL_ID;
}

export async function startDiscordBot() {
  if (!isBotEnabled()) {
    console.log("[Discord Bot] Desativado. Configure DISCORD_BOT_ENABLED=true no .env.");
    return null;
  }

  const token = getToken();

  if (!token) {
    lastError = "DISCORD_BOT_TOKEN não configurado.";
    console.warn("[Discord Bot] Token não configurado.");
    return null;
  }

  if (client?.isReady()) {
    return client;
  }

  client = new Client({
    intents: [GatewayIntentBits.Guilds]
  });

  client.once("ready", () => {
    startedAt = new Date().toISOString();
    lastError = null;

    console.log(`[Discord Bot] Online como ${client?.user?.tag}`);

    client?.user?.setPresence({ activities: [], status: "online" });
  });

  client.on("error", (error) => {
    lastError = error.message;
    console.error("[Discord Bot] Erro:", error.message);
  });

  try {
    await client.login(token);
    return client;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido ao iniciar o bot.";

    lastError = message;
    console.error("[Discord Bot] Falha ao conectar:", message);
    return null;
  }
}

export async function getDiscordBotStatus() {
  const guildId = getGuildId();
  const alertChannelId = getAlertChannelId();

  const botReady = Boolean(client?.isReady());

  let guildName: string | null = null;
  let memberCount: number | null = null;
  let alertChannelName: string | null = null;

  if (botReady && client && guildId) {
    try {
      const guild = await client.guilds.fetch(guildId);

      guildName = guild.name;
      memberCount = guild.approximateMemberCount ?? guild.memberCount ?? null;

      if (alertChannelId) {
        const channel = await client.channels.fetch(alertChannelId);

        if (channel && channel.isTextBased() && "name" in channel) {
          alertChannelName = String(channel.name);
        }
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Erro ao buscar servidor/canal.";
    }
  }

  return {
    enabled: isBotEnabled(),
    configured: Boolean(getToken()),
    ready: botReady,
    botUser: client?.user
      ? {
          id: client.user.id,
          tag: client.user.tag,
          username: client.user.username,
          avatarUrl: client.user.displayAvatarURL()
        }
      : null,
    guild: {
      id: guildId || null,
      name: guildName,
      memberCount
    },
    alertChannel: {
      id: alertChannelId || null,
      name: alertChannelName
    },
    startedAt,
    lastError
  };
}

export async function getDiscordTextChannels() {
  if (!isBotEnabled()) {
    throw new Error("Bot Discord desativado.");
  }

  if (!client?.isReady()) {
    throw new Error("Bot Discord não está online.");
  }

  const guildId = getGuildId();

  if (!guildId) {
    throw new Error("DISCORD_GUILD_ID não configurado.");
  }

  const guild = await client.guilds.fetch(guildId);
  const channels = await guild.channels.fetch();

  return Array.from(channels.values())
    .filter((channel) => {
      if (!channel) return false;

      return (
        channel.type === ChannelType.GuildText ||
        channel.type === ChannelType.GuildAnnouncement
      );
    })
    .map((channel) => ({
      id: channel!.id,
      name: "name" in channel! ? String(channel!.name) : channel!.id,
      type:
        channel!.type === ChannelType.GuildAnnouncement
          ? "announcement"
          : "text"
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function sendDiscordMessage(message: string, channelId?: string) {
  if (!isBotEnabled()) {
    throw new Error("Bot Discord desativado. Configure DISCORD_BOT_ENABLED=true.");
  }

  if (!client?.isReady()) {
    throw new Error("Bot Discord não está online.");
  }

  const targetChannelId = channelId || getAlertChannelId();

  if (!targetChannelId) {
    throw new Error("DISCORD_ALERT_CHANNEL_ID não configurado.");
  }

  const channel = await client.channels.fetch(targetChannelId);

  if (!channel || !channel.isTextBased() || !("send" in channel)) {
    throw new Error("Canal Discord inválido ou sem suporte a envio de mensagem.");
  }

  const textChannel = channel as {
    send: (payload: { content: string }) => Promise<unknown>;
  };

  await textChannel.send({
    content: message
  });

  return {
    success: true,
    channelId: targetChannelId
  };
}

