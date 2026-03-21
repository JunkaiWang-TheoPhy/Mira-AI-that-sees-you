import { createServer } from "node:http";

import { assertAuthorized } from "./auth.js";
import { loadAdapterConfig } from "./config.js";
import { createMemoryStore } from "./memory-store.js";
import { callOpenClaw } from "./openclaw-client.js";
import { buildSystemPrompt, loadBasePrompt } from "./prompt.js";
import { buildSessionKey } from "./session-key.js";

const config = loadAdapterConfig();
const memoryStore = createMemoryStore(config.memoryStorePath);
const basePrompt = loadBasePrompt(config.systemPromptPath);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function sendSse(response, assistantText, sessionKey) {
  response.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache",
    connection: "keep-alive",
  });
  response.write(": connected\n\n");
  response.write(`event: message\ndata: ${JSON.stringify({ text: assistantText, session_key: sessionKey })}\n\n`);
  response.write(`event: done\ndata: ${JSON.stringify({ ok: true })}\n\n`);
  response.end();
}

function readRequestBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        resolveBody(text ? JSON.parse(text) : {});
      } catch (error) {
        rejectBody(error);
      }
    });
    request.on("error", rejectBody);
  });
}

function normalizeBody(body) {
  const message = Array.isArray(body?.message) ? body.message : [];
  if (message.length === 0) {
    const error = new Error("request body must include a non-empty message array");
    error.statusCode = 400;
    throw error;
  }

  const normalizedMessage = message
    .filter((item) => typeof item?.text === "string" && item.text.trim())
    .map((item) => ({
      role: item.role || "user",
      type: item.type || "text",
      text: item.text.trim(),
    }));

  if (normalizedMessage.length === 0) {
    const error = new Error("request body message array must include text items");
    error.statusCode = 400;
    throw error;
  }

  return {
    message_id: body?.message_id || `msg-${Date.now()}`,
    agent_id: body?.agent_id || config.agentId,
    user_id: body?.user_id || body?.agent_id || "anonymous",
    message: normalizedMessage,
  };
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/metis/agent/api/health") {
      sendJson(response, 200, {
        ok: true,
        service: "mira-lingzhu-live-adapter",
        port: config.listenPort,
      });
      return;
    }

    if (request.method !== "POST" || request.url !== "/metis/agent/api/sse") {
      sendJson(response, 404, { ok: false, error: "not found" });
      return;
    }

    assertAuthorized(request, config.authAk);
    const body = normalizeBody(await readRequestBody(request));
    const sessionKey = buildSessionKey(config, body);
    const userId = body.user_id;
    const memoryItems = memoryStore.read(
      config.sessionNamespace,
      config.agentId,
      userId,
      config.memoryMaxItems,
    );
    const systemPrompt = buildSystemPrompt(basePrompt, memoryItems);
    const upstream = await callOpenClaw({
      baseUrl: config.openclawBaseUrl,
      agentId: config.agentId,
      sessionKey,
      systemPrompt,
      bodyMessages: body.message,
    });

    memoryStore.writeExplicitMemories({
      namespace: config.sessionNamespace,
      agentId: config.agentId,
      userId,
      messageId: body.message_id || null,
      messages: Array.isArray(body.message) ? body.message : [],
    });

    sendSse(response, upstream.text, sessionKey);
  } catch (error) {
    const statusCode = Number(error?.statusCode) || 500;
    sendJson(response, statusCode, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(config.listenPort, config.listenHost, () => {
  console.log(
    JSON.stringify(
      {
        ok: true,
        service: "mira-lingzhu-live-adapter",
        listenHost: config.listenHost,
        listenPort: config.listenPort,
        openclawBaseUrl: config.openclawBaseUrl,
      },
      null,
      2,
    ),
  );
});
