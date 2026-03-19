import type { LingzhuConfig } from "./types.js";

const lingzhuConfigSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    authAk: { type: "string" },
    agentId: { type: "string" },
    includeMetadata: { type: "boolean" },
    requestTimeoutMs: { type: "number", minimum: 1 },
    systemPrompt: { type: "string" },
    defaultNavigationMode: { type: "string", enum: ["0", "1", "2"] },
    enableFollowUp: { type: "boolean" },
    followUpMaxCount: { type: "integer", minimum: 0 },
    maxImageBytes: { type: "integer", minimum: 0 },
    sessionMode: { type: "string", enum: ["per_user", "shared_agent", "per_message"] },
    sessionNamespace: { type: "string" },
    debugLogging: { type: "boolean" },
    debugLogPayloads: { type: "boolean" },
    debugLogDir: { type: "string" },
    enableExperimentalNativeActions: { type: "boolean" },
    memoryContextEnabled: { type: "boolean" },
    memoryContextUrl: { type: "string" },
    memoryContextAudience: { type: "string", enum: ["auto", "direct", "shared"] },
    memoryContextTimeoutMs: { type: "integer", minimum: 1 },
    memoryContextWorkingLimit: { type: "integer", minimum: 1 },
    memoryContextFactLimit: { type: "integer", minimum: 1 },
  },
} as const;

type OpenClawPluginApi = {
  logger?: {
    info?: (message: string) => void;
  };
};

function registerReleaseShell(api: OpenClawPluginApi, _config?: LingzhuConfig) {
  api.logger?.info?.(
    "[lingzhu] Loaded release-safe plugin shell. Live Lingzhu transport remains intentionally out of scope for this package.",
  );
}

export default {
  id: "lingzhu",
  name: "Mira Lingzhu Bridge",
  configSchema: lingzhuConfigSchema,
  register(api: OpenClawPluginApi, config?: LingzhuConfig) {
    registerReleaseShell(api, config);
  },
};
