import { mkdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";

const VALID_SESSION_MODES = new Set(["per_user", "shared_agent", "per_message"]);

function resolveMaybeRelative(baseDir, value) {
  if (!value) {
    return value;
  }
  return isAbsolute(value) ? value : resolve(baseDir, value);
}

export function loadAdapterConfig() {
  const configPath = process.env.MIRA_LINGZHU_ADAPTER_CONFIG_PATH;
  if (!configPath) {
    throw new Error("MIRA_LINGZHU_ADAPTER_CONFIG_PATH is not set");
  }

  const parsed = JSON.parse(readFileSync(configPath, "utf8"));
  const baseDir = dirname(configPath);
  const normalized = {
    ...parsed,
    listenHost: parsed.listenHost || "0.0.0.0",
    listenPort: Number(parsed.listenPort || 18789),
    authAk: parsed.authAk || "replace-me",
    openclawBaseUrl: parsed.openclawBaseUrl || "http://127.0.0.1:18790",
    agentId: parsed.agentId || "main",
    sessionMode: parsed.sessionMode || "per_user",
    sessionNamespace: parsed.sessionNamespace || "mira-lingzhu-prod",
    systemPromptPath: resolveMaybeRelative(baseDir, parsed.systemPromptPath),
    memoryStorePath: resolveMaybeRelative(baseDir, parsed.memoryStorePath),
    memoryMaxItems: Number(parsed.memoryMaxItems || 8),
  };

  if (!Number.isFinite(normalized.listenPort) || normalized.listenPort <= 0) {
    throw new Error("adapter listenPort must be a positive integer");
  }
  if (!VALID_SESSION_MODES.has(normalized.sessionMode)) {
    throw new Error(`adapter sessionMode must be one of: ${Array.from(VALID_SESSION_MODES).join(", ")}`);
  }
  if (!normalized.systemPromptPath) {
    throw new Error("adapter systemPromptPath is required");
  }
  if (!normalized.memoryStorePath) {
    throw new Error("adapter memoryStorePath is required");
  }
  if (!normalized.authAk || normalized.authAk === "replace-me") {
    throw new Error("adapter authAk must be configured");
  }

  mkdirSync(dirname(normalized.memoryStorePath), { recursive: true });
  return normalized;
}
