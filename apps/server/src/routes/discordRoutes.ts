import { Router } from "express";
import {
  getDiscordBotStatus,
  getDiscordTextChannels,
  sendDiscordMessage,
  startDiscordBot
} from "../services/discordBot.js";

export const discordRoutes = Router();

discordRoutes.get("/bot/status", async (_request, response) => {
  const status = await getDiscordBotStatus();
  response.json(status);
});

discordRoutes.get("/bot/channels", async (_request, response) => {
  try {
    const channels = await getDiscordTextChannels();

    response.json({
      success: true,
      channels
    });
  } catch (error) {
    response.status(400).json({
      success: false,
      channels: [],
      error: error instanceof Error ? error.message : "Erro ao buscar canais."
    });
  }
});

discordRoutes.post("/bot/start", async (_request, response) => {
  await startDiscordBot();
  const status = await getDiscordBotStatus();
  response.json(status);
});

discordRoutes.post("/bot/test-message", async (request, response) => {
  try {
    const message =
      request.body?.message ||
      "Teste enviado pelo 2K Command OS. Integração Discord funcionando.";

    const result = await sendDiscordMessage(message, request.body?.channelId);

    response.json({
      success: true,
      result
    });
  } catch (error) {
    response.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Erro ao enviar mensagem."
    });
  }
});
