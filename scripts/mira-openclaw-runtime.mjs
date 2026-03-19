import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";

import {
  bootstrapNotificationRouterRuntime,
  buildNotificationRouterRuntimeEnv,
  checkNotificationRouterHealth,
  dispatchNotificationRouterSelfCheck,
  inspectNotificationRouterRuntime,
  resolveNotificationRouterPaths,
} from "./notification-router-runtime.mjs";
import {
  copyFileIfMissing,
  copyPath,
  findExecutableSync,
  isProcessAlive,
  isPlaceholderValue,
  loadEnvFile,
  readJsonFile,
  removeFile,
  runCommandSync,
  runShellCommandSync,
  startDetachedProcess,
  stopDetachedProcess,
  toBoolean,
  writeJsonFile,
} from "./runtime-utils.mjs";

const __filename = fileURLToPath(import.meta.url);
const DEFAULT_ROOT = resolve(__filename, "..", "..");

export function resolveMiraOpenClawPaths(rootDir = DEFAULT_ROOT) {
  const runtimeDir = join(rootDir, ".mira-runtime", "mira-openclaw");

  return {
    rootDir,
    runtimeDir,
    envTemplatePath: join(rootDir, "deploy", "mira-openclaw", "env.example"),
    envFilePath: join(runtimeDir, ".env.local"),
    configTemplatePath: join(rootDir, "core", "openclaw-config", "openclaw.example.json"),
    generatedConfigPath: join(runtimeDir, "core", "openclaw-config", "openclaw.local.json"),
    promptSourcePath: join(rootDir, "core", "openclaw-config", "lingzhu-system-prompt.txt"),
    promptRuntimePath: join(runtimeDir, "core", "openclaw-config", "lingzhu-system-prompt.txt"),
    personaSourceDir: join(rootDir, "core", "persona"),
    workspaceSourceDir: join(rootDir, "core", "workspace"),
    pluginSourceDir: join(rootDir, "core", "plugins", "lingzhu-bridge"),
    pluginRuntimeDir: join(runtimeDir, "core", "plugins", "lingzhu-bridge"),
    openClawStateDir: join(runtimeDir, "openclaw-state"),
    manifestPath: join(runtimeDir, "runtime-manifest.json"),
    processStatePath: join(runtimeDir, "runtime-process.json"),
    logPath: join(runtimeDir, "runtime.log"),
  };
}

function syncMiraOpenClawRuntime(paths) {
  copyPath(paths.personaSourceDir, join(paths.runtimeDir, "core", "persona"));
  copyPath(paths.workspaceSourceDir, join(paths.runtimeDir, "core", "workspace"));
  copyPath(paths.promptSourcePath, paths.promptRuntimePath);
  copyFileIfMissing(paths.envTemplatePath, paths.envFilePath);

  copyPath(
    join(paths.pluginSourceDir, "package.json"),
    join(paths.pluginRuntimeDir, "package.json"),
  );
  copyPath(
    join(paths.pluginSourceDir, "package-lock.json"),
    join(paths.pluginRuntimeDir, "package-lock.json"),
  );
  copyPath(
    join(paths.pluginSourceDir, "openclaw.plugin.json"),
    join(paths.pluginRuntimeDir, "openclaw.plugin.json"),
  );
  copyPath(join(paths.pluginSourceDir, "src"), join(paths.pluginRuntimeDir, "src"));

  if (existsSync(join(paths.pluginSourceDir, "tests"))) {
    copyPath(join(paths.pluginSourceDir, "tests"), join(paths.pluginRuntimeDir, "tests"));
  }
  if (existsSync(join(paths.pluginSourceDir, "README.md"))) {
    copyPath(
      join(paths.pluginSourceDir, "README.md"),
      join(paths.pluginRuntimeDir, "README.md"),
    );
  }
}

function loadMiraOpenClawEnv(paths) {
  const fileEnv = loadEnvFile(paths.envFilePath);
  return {
    ...fileEnv,
    ...process.env,
  };
}

function buildBootstrapOpenClawConfig() {
  return {
    plugins: {
      allow: [],
      entries: {},
    },
  };
}

function mergeInstalledPluginMetadata(baseConfig, installedConfig) {
  const installedPlugins = installedConfig?.plugins ?? {};
  const basePlugins = baseConfig.plugins ?? {};
  const installedEntries = installedPlugins.entries ?? {};
  const baseEntries = basePlugins.entries ?? {};
  const installedLingzhuEntry = installedEntries.lingzhu ?? {};
  const baseLingzhuEntry = baseEntries.lingzhu ?? {};

  return {
    ...baseConfig,
    plugins: {
      ...basePlugins,
      ...(installedPlugins.load ? { load: installedPlugins.load } : {}),
      ...(installedPlugins.installs ? { installs: installedPlugins.installs } : {}),
      allow: Array.from(
        new Set([...(installedPlugins.allow ?? []), ...(basePlugins.allow ?? [])]),
      ),
      entries: {
        ...installedEntries,
        ...baseEntries,
        lingzhu: {
          ...installedLingzhuEntry,
          ...baseLingzhuEntry,
          config: {
            ...(installedLingzhuEntry.config ?? {}),
            ...(baseLingzhuEntry.config ?? {}),
          },
        },
      },
    },
  };
}

function buildGeneratedOpenClawConfig(paths, installedConfig = null) {
  const template = JSON.parse(readFileSync(paths.configTemplatePath, "utf8"));
  const prompt = readFileSync(paths.promptRuntimePath, "utf8").trim();
  const env = loadMiraOpenClawEnv(paths);
  const providerSelection = resolveProviderSelection(paths, template);

  const providerConfig =
    providerSelection.source === "host-default" || providerSelection.source === "repo-env"
      ? {
          [providerSelection.providerId]: providerSelection.provider,
        }
      : template.models.providers;

  const primaryModelRef =
    providerSelection.source === "host-default" || providerSelection.source === "repo-env"
      ? providerSelection.primary
      : template.agents.defaults.model?.primary;

  const generatedConfig = {
    ...template,
    models: {
      ...template.models,
      providers: providerConfig,
    },
    agents: {
      ...template.agents,
      defaults: {
        ...template.agents.defaults,
        model: {
          ...(template.agents.defaults.model ?? {}),
          primary: primaryModelRef,
        },
        workspace: join(paths.runtimeDir, "core", "workspace"),
        userTimezone: env.MIRA_OPENCLAW_USER_TIMEZONE || template.agents.defaults.userTimezone,
      },
    },
    plugins: {
      ...template.plugins,
      entries: {
        ...template.plugins.entries,
        lingzhu: {
          ...template.plugins.entries.lingzhu,
          config: {
            ...template.plugins.entries.lingzhu.config,
            systemPrompt: prompt,
            memoryContextEnabled: toBoolean(
              env.MIRA_OPENCLAW_MEMORY_CONTEXT_ENABLED,
              false,
            ),
            memoryContextUrl:
              env.MIRA_OPENCLAW_MEMORY_CONTEXT_URL
              || template.plugins.entries.lingzhu.config.memoryContextUrl,
          },
        },
      },
    },
  };

  return mergeInstalledPluginMetadata(generatedConfig, installedConfig);
}

function resolveHostOpenClawConfigPath(paths) {
  const explicitHostPath = process.env.MIRA_OPENCLAW_HOST_CONFIG_PATH?.trim();
  if (explicitHostPath) {
    return explicitHostPath;
  }

  const inheritedConfigPath = process.env.OPENCLAW_CONFIG_PATH?.trim();
  if (inheritedConfigPath && inheritedConfigPath !== paths.generatedConfigPath) {
    return inheritedConfigPath;
  }

  return join(homedir(), ".openclaw", "openclaw.json");
}

function loadHostOpenClawConfig(paths) {
  const configPath = resolveHostOpenClawConfigPath(paths);
  if (!configPath || configPath === paths.generatedConfigPath || !existsSync(configPath)) {
    return {
      configPath,
      config: null,
      error: null,
    };
  }

  try {
    return {
      configPath,
      config: JSON.parse(readFileSync(configPath, "utf8")),
      error: null,
    };
  } catch (error) {
    return {
      configPath,
      config: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function resolveHostDefaultProvider(paths) {
  const hostConfigState = loadHostOpenClawConfig(paths);
  const hostConfig = hostConfigState.config;
  const providers = hostConfig?.models?.providers;

  if (!providers || typeof providers !== "object" || Array.isArray(providers)) {
    return {
      source: "none",
      configPath: hostConfigState.configPath,
      detail: hostConfigState.error,
    };
  }

  let providerId = null;
  let modelId = null;
  const primary = hostConfig?.agents?.defaults?.model?.primary;
  if (typeof primary === "string" && primary.includes("/")) {
    const separatorIndex = primary.indexOf("/");
    providerId = primary.slice(0, separatorIndex);
    modelId = primary.slice(separatorIndex + 1);
  }

  if (!providerId) {
    const providerEntries = Object.entries(providers);
    if (providerEntries.length !== 1) {
      return {
        source: "none",
        configPath: hostConfigState.configPath,
        detail:
          hostConfigState.error
          || "host OpenClaw config does not declare a single default provider",
      };
    }
    providerId = providerEntries[0][0];
  }

  const provider = providers[providerId];
  if (!provider || typeof provider !== "object") {
    return {
      source: "none",
      configPath: hostConfigState.configPath,
      detail:
        hostConfigState.error
        || `host OpenClaw config is missing provider '${providerId}'`,
    };
  }

  const models = Array.isArray(provider.models) ? provider.models : [];
  let model = modelId
    ? models.find((candidate) => candidate?.id === modelId || candidate?.name === modelId)
    : null;

  if (!model) {
    if (models.length !== 1) {
      return {
        source: "none",
        configPath: hostConfigState.configPath,
        detail:
          hostConfigState.error
          || `host OpenClaw config does not resolve a default model for provider '${providerId}'`,
      };
    }
    [model] = models;
    modelId = model?.id || model?.name || null;
  }

  if (!modelId || isPlaceholderValue(provider.apiKey)) {
    return {
      source: "none",
      configPath: hostConfigState.configPath,
      detail:
        hostConfigState.error
        || `host OpenClaw provider '${providerId}' is missing a usable API key`,
    };
  }

  return {
    source: "host-default",
    configPath: hostConfigState.configPath,
    providerId,
    provider,
    modelId,
    modelName: model?.name || modelId,
    primary: `${providerId}/${modelId}`,
  };
}

function resolveRepoProviderFallback(template, env) {
  const [templateProviderId, templateProvider] = Object.entries(template.models.providers)[0];
  const templateModel = templateProvider.models[0];

  if (isPlaceholderValue(env.MIRA_OPENCLAW_PROVIDER_API_KEY)) {
    return {
      source: "none",
    };
  }

  const providerId = env.MIRA_OPENCLAW_PROVIDER_ID || templateProviderId;
  const modelId = env.MIRA_OPENCLAW_MODEL_ID || templateModel.id;
  const modelName = env.MIRA_OPENCLAW_MODEL_NAME || templateModel.name || modelId;

  return {
    source: "repo-env",
    providerId,
    provider: {
      ...templateProvider,
      baseUrl: env.MIRA_OPENCLAW_PROVIDER_BASE_URL || templateProvider.baseUrl,
      apiKey: env.MIRA_OPENCLAW_PROVIDER_API_KEY || templateProvider.apiKey,
      api: env.MIRA_OPENCLAW_PROVIDER_API || templateProvider.api,
      models: [
        {
          ...templateModel,
          id: modelId,
          name: modelName,
        },
      ],
    },
    modelId,
    modelName,
    primary: `${providerId}/${modelId}`,
  };
}

function buildMissingProviderGuidance(providerSelection) {
  const hostLocation = providerSelection.hostConfigPath
    ? ` (${providerSelection.hostConfigPath})`
    : "";
  const detail = providerSelection.hostDetail
    ? ` Host config detail: ${providerSelection.hostDetail}.`
    : "";

  return [
    `OpenClaw has no usable provider configuration.${detail}`,
    `Next step: configure a default provider in host OpenClaw${hostLocation} so Mira can inherit it, or set MIRA_OPENCLAW_PROVIDER_API_KEY in the repo .env.local to use the repo fallback provider.`,
  ].join(" ");
}

function resolveProviderSelection(paths, template) {
  const env = loadMiraOpenClawEnv(paths);
  const hostProvider = resolveHostDefaultProvider(paths);
  if (hostProvider.source === "host-default") {
    return hostProvider;
  }

  const repoProvider = resolveRepoProviderFallback(template, env);
  if (repoProvider.source === "repo-env") {
    return {
      ...repoProvider,
      hostConfigPath: hostProvider.configPath,
      hostDetail: hostProvider.detail || null,
    };
  }

  return {
    source: "missing",
    hostConfigPath: hostProvider.configPath,
    hostDetail: hostProvider.detail || null,
  };
}

function buildMiraOpenClawManifest(paths) {
  const notificationRouterPaths = resolveNotificationRouterPaths(paths.rootDir);
  const env = loadMiraOpenClawEnv(paths);

  return {
    kind: "mira-openclaw-runtime-pack",
    runtimeDir: paths.runtimeDir,
    envFilePath: paths.envFilePath,
    openClawConfigPath: paths.generatedConfigPath,
    openClawStateDir: paths.openClawStateDir,
    workspacePath: join(paths.runtimeDir, "core", "workspace"),
    pluginPackagePath: paths.pluginRuntimeDir,
    systemPromptPath: paths.promptRuntimePath,
    notificationRouterManifestPath: notificationRouterPaths.manifestPath,
    gatewayPort: env.MIRA_OPENCLAW_GATEWAY_PORT || "18890",
    processStatePath: paths.processStatePath,
    logPath: paths.logPath,
    startCommandEnv: "OPENCLAW_START_COMMAND",
  };
}

function resolveOpenClawBinary(explicitBinary) {
  if (explicitBinary) {
    return explicitBinary;
  }

  return process.env.OPENCLAW_BIN || findExecutableSync("openclaw");
}

function buildOpenClawBootstrapEnv(paths) {
  return {
    ...loadMiraOpenClawEnv(paths),
    OPENCLAW_CONFIG_PATH: paths.generatedConfigPath,
    OPENCLAW_STATE_DIR: paths.openClawStateDir,
    MIRA_OPENCLAW_RUNTIME_ROOT: paths.runtimeDir,
    MIRA_OPENCLAW_PLUGIN_PATH: paths.pluginRuntimeDir,
    MIRA_NOTIFICATION_ROUTER_MANIFEST_PATH: resolveNotificationRouterPaths(paths.rootDir).manifestPath,
  };
}

function buildOpenClawRuntimeEnv(paths) {
  return {
    ...buildOpenClawBootstrapEnv(paths),
    OPENCLAW_CONFIG_PATH: paths.generatedConfigPath,
  };
}

function buildNotificationRouterSidecarState(rootDir) {
  const paths = resolveNotificationRouterPaths(rootDir);
  const env = buildNotificationRouterRuntimeEnv(paths);
  const baseUrl = `http://127.0.0.1:${env.PORT}`;

  return {
    paths,
    env,
    baseUrl,
    healthUrl: `${baseUrl}/v1/health`,
  };
}

function resolveGatewayConnectionState(rootDir) {
  const paths = resolveMiraOpenClawPaths(rootDir);
  const env = loadMiraOpenClawEnv(paths);
  const port = Number.parseInt(env.MIRA_OPENCLAW_GATEWAY_PORT || "18890", 10);

  return {
    host: "127.0.0.1",
    port: Number.isFinite(port) ? port : 18890,
  };
}

async function fetchJsonWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => {
    controller.abort(new Error(`request timeout after ${timeoutMs}ms`));
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });
    return {
      status: response.status,
      body: await response.json(),
    };
  } finally {
    clearTimeout(timeoutHandle);
  }
}

export async function probeNotificationRouterHealth({
  rootDir = DEFAULT_ROOT,
  timeoutMs = 800,
} = {}) {
  const { healthUrl } = buildNotificationRouterSidecarState(rootDir);

  try {
    const result = await fetchJsonWithTimeout(healthUrl, timeoutMs);
    return result.status === 200 && result.body?.ok === true;
  } catch {
    return false;
  }
}

export async function waitForNotificationRouterHealth({
  rootDir = DEFAULT_ROOT,
  timeoutMs = 15000,
  intervalMs = 250,
} = {}) {
  const startedAt = Date.now();
  const { healthUrl } = buildNotificationRouterSidecarState(rootDir);

  while (Date.now() - startedAt < timeoutMs) {
    if (await probeNotificationRouterHealth({ rootDir, timeoutMs: Math.min(intervalMs, 1000) })) {
      return {
        ok: true,
        healthUrl,
      };
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, intervalMs));
  }

  throw new Error(`notification-router sidecar did not become healthy: ${healthUrl}`);
}

export async function probeGatewayHealth({
  rootDir = DEFAULT_ROOT,
  timeoutMs = 1000,
} = {}) {
  const target = resolveGatewayConnectionState(rootDir);

  return await new Promise((resolveProbe) => {
    const socket = net.createConnection(target);
    const timeoutHandle = setTimeout(() => {
      socket.destroy();
      resolveProbe({
        ok: false,
        ...target,
        error: `connection timeout after ${timeoutMs}ms`,
      });
    }, timeoutMs);

    socket.once("connect", () => {
      clearTimeout(timeoutHandle);
      socket.end();
      resolveProbe({
        ok: true,
        ...target,
      });
    });

    socket.once("error", (error) => {
      clearTimeout(timeoutHandle);
      resolveProbe({
        ok: false,
        ...target,
        error: error.message,
      });
    });
  });
}

function startBackgroundProcess(command, args, { cwd, env, stdio = "inherit" } = {}) {
  const child = spawn(command, args, {
    cwd,
    env,
    stdio,
  });

  return {
    child,
    stop(signal = "SIGTERM") {
      if (child.exitCode !== null || child.signalCode !== null) {
        return;
      }

      child.kill(signal);

      if (typeof child.pid === "number") {
        spawnSync("pkill", ["-TERM", "-P", String(child.pid)], {
          stdio: "ignore",
        });
      }
    },
  };
}

function resolveStartCommand(env, openclawBinary) {
  if (!isPlaceholderValue(env.OPENCLAW_START_COMMAND)) {
    return env.OPENCLAW_START_COMMAND;
  }

  if (!openclawBinary) {
    return null;
  }

  const gatewayPort = env.MIRA_OPENCLAW_GATEWAY_PORT?.trim() || "18890";
  return `${openclawBinary} gateway run --port ${gatewayPort}`;
}

function readMiraOpenClawProcessState(paths) {
  const state = readJsonFile(paths.processStatePath, null);
  if (!state || typeof state !== "object") {
    return null;
  }
  return state;
}

export function bootstrapMiraOpenClawRuntime({
  rootDir = DEFAULT_ROOT,
  runCommand = runCommandSync,
  openclawBinary,
} = {}) {
  const paths = resolveMiraOpenClawPaths(rootDir);
  syncMiraOpenClawRuntime(paths);

  const notificationRouterPaths = resolveNotificationRouterPaths(rootDir);
  if (existsSync(notificationRouterPaths.sourceDir)) {
    bootstrapNotificationRouterRuntime({ rootDir, runCommand });
  }

  if (!existsSync(join(paths.pluginRuntimeDir, "node_modules"))) {
    runCommand("npm", ["install", "--no-fund", "--no-audit"], {
      cwd: paths.pluginRuntimeDir,
      stdio: "inherit",
    });
  }

  const resolvedOpenClawBinary = resolveOpenClawBinary(openclawBinary);
  let installedPluginConfig = null;
  if (resolvedOpenClawBinary) {
    writeJsonFile(paths.generatedConfigPath, buildBootstrapOpenClawConfig());
    runCommand(
      resolvedOpenClawBinary,
      ["plugins", "install", "--link", paths.pluginRuntimeDir],
      {
        cwd: paths.runtimeDir,
        env: buildOpenClawBootstrapEnv(paths),
        stdio: "inherit",
      },
    );
    installedPluginConfig = JSON.parse(readFileSync(paths.generatedConfigPath, "utf8"));
  }
  writeJsonFile(paths.generatedConfigPath, buildGeneratedOpenClawConfig(paths, installedPluginConfig));
  writeJsonFile(paths.manifestPath, buildMiraOpenClawManifest(paths));

  return {
    runtimeDir: paths.runtimeDir,
    configPath: paths.generatedConfigPath,
    envFilePath: paths.envFilePath,
    manifestPath: paths.manifestPath,
  };
}

export function inspectMiraOpenClawRuntime({
  rootDir = DEFAULT_ROOT,
  openclawBinary,
} = {}) {
  const paths = resolveMiraOpenClawPaths(rootDir);
  const template = JSON.parse(readFileSync(paths.configTemplatePath, "utf8"));
  const missing = [
    paths.runtimeDir,
    join(paths.runtimeDir, "core", "persona", "SOUL.md"),
    join(paths.runtimeDir, "core", "workspace", "AGENTS.md"),
    join(paths.pluginRuntimeDir, "package.json"),
    paths.generatedConfigPath,
    paths.envFilePath,
    paths.manifestPath,
  ].filter((path) => !existsSync(path));

  const env = loadMiraOpenClawEnv(paths);
  const providerSelection = resolveProviderSelection(paths, template);
  const resolvedStartCommand = resolveStartCommand(
    buildOpenClawRuntimeEnv(paths),
    resolveOpenClawBinary(openclawBinary),
  );
  const issues = [];
  if (providerSelection.source === "missing") {
    issues.push(buildMissingProviderGuidance(providerSelection));
  }
  if (!resolvedStartCommand) {
    issues.push("OPENCLAW_START_COMMAND is not configured yet.");
  }

  const warnings = [];
  const notificationRouterManifestPath = resolveNotificationRouterPaths(rootDir).manifestPath;
  if (!existsSync(notificationRouterManifestPath)) {
    warnings.push("notification-router runtime pack is missing; run bootstrap again.");
  }

  return {
    runtimeDir: paths.runtimeDir,
    configPath: paths.generatedConfigPath,
    manifestPath: paths.manifestPath,
    provider: {
      source: providerSelection.source,
      hostConfigPath: providerSelection.hostConfigPath ?? providerSelection.configPath ?? null,
      primaryModel: providerSelection.primary ?? null,
    },
    resolvedStartCommand,
    missing,
    issues,
    warnings,
    ok: missing.length === 0 && issues.length === 0,
  };
}

export function doctorMiraOpenClawRuntime({
  rootDir = DEFAULT_ROOT,
  openclawBinary,
  runCommand = runCommandSync,
} = {}) {
  const paths = resolveMiraOpenClawPaths(rootDir);
  const inspection = inspectMiraOpenClawRuntime({ rootDir, openclawBinary });
  const resolvedOpenClawBinary = resolveOpenClawBinary(openclawBinary);
  let configValidation = null;
  const warnings = [...inspection.warnings];

  if (resolvedOpenClawBinary && inspection.missing.length === 0) {
    if (!inspection.ok) {
      return {
        ...inspection,
        configValidation: null,
        ok: false,
        warnings,
      };
    }

    try {
      const result = runCommand(
        resolvedOpenClawBinary,
        ["config", "validate", "--json"],
        {
          cwd: paths.runtimeDir,
          env: buildOpenClawRuntimeEnv(paths),
          stdio: "pipe",
        },
      );

      const stdout = (result.stdout ?? "").trim();
      configValidation = stdout ? JSON.parse(stdout) : { ok: true };
    } catch (error) {
      configValidation = {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
      warnings.push(
        `openclaw config validation could not be completed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return {
    ...inspection,
    configValidation,
    ok:
      inspection.ok
      && (configValidation?.ok ?? true),
    warnings,
  };
}

export async function checkMiraOpenClawHealth({
  rootDir = DEFAULT_ROOT,
  openclawBinary,
  checkNotificationRouterHealth: checkRouterHealth = checkNotificationRouterHealth,
  probeGatewayHealth: probeGateway = probeGatewayHealth,
} = {}) {
  const inspection = inspectMiraOpenClawRuntime({ rootDir, openclawBinary });
  let routerHealth;
  try {
    routerHealth = await checkRouterHealth({ rootDir });
  } catch (error) {
    routerHealth = {
      status: 0,
      body: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  let gateway;
  try {
    gateway = await probeGateway({ rootDir });
  } catch (error) {
    const target = resolveGatewayConnectionState(rootDir);
    gateway = {
      ok: false,
      ...target,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return {
    ok:
      inspection.ok
      && routerHealth.status === 200
      && routerHealth.body?.ok === true
      && gateway.ok === true,
    inspection,
    notificationRouter: routerHealth,
    gateway,
  };
}

export async function waitForMiraOpenClawHealth({
  rootDir = DEFAULT_ROOT,
  openclawBinary,
  timeoutMs = 20000,
  intervalMs = 500,
  checkStackHealth = checkMiraOpenClawHealth,
} = {}) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const result = await checkStackHealth({ rootDir, openclawBinary });
    if (result.ok) {
      return result;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, intervalMs));
  }

  throw new Error("mira-openclaw integrated stack did not become healthy in time");
}

export async function upMiraOpenClawRuntime({
  rootDir = DEFAULT_ROOT,
  bootstrapRunCommand = runCommandSync,
  openclawBinary,
  spawnDetachedProcess: spawnProcess = startDetachedProcess,
  waitForStackHealth = waitForMiraOpenClawHealth,
  isProcessAlive: processAlive = isProcessAlive,
} = {}) {
  const paths = resolveMiraOpenClawPaths(rootDir);
  bootstrapMiraOpenClawRuntime({
    rootDir,
    runCommand: bootstrapRunCommand,
    openclawBinary,
  });

  const inspection = inspectMiraOpenClawRuntime({ rootDir, openclawBinary });
  if (inspection.missing.length > 0 || inspection.issues.length > 0) {
    throw new Error(
      [
        "mira-openclaw runtime is not ready for background start.",
        ...inspection.missing,
        ...inspection.issues,
      ].join("\n"),
    );
  }

  const existingState = readMiraOpenClawProcessState(paths);
  if (existingState?.pid && processAlive(existingState.pid)) {
    const health = await waitForStackHealth({ rootDir, openclawBinary });
    return {
      ok: health.ok,
      alreadyRunning: true,
      pid: existingState.pid,
      logPath: paths.logPath,
      processStatePath: paths.processStatePath,
      health,
    };
  }

  const spawned = spawnProcess(
    process.execPath,
    [join(paths.rootDir, "scripts", "mira-openclaw-runtime.mjs"), "start"],
    {
      cwd: paths.rootDir,
      env: {
        ...process.env,
      },
      logPath: paths.logPath,
    },
  );

  if (!spawned?.pid) {
    throw new Error("mira-openclaw detached startup did not return a pid");
  }

  writeJsonFile(paths.processStatePath, {
    pid: spawned.pid,
    command: `${process.execPath} scripts/mira-openclaw-runtime.mjs start`,
    cwd: paths.rootDir,
    logPath: paths.logPath,
    startedAt: new Date().toISOString(),
  });

  try {
    const health = await waitForStackHealth({ rootDir, openclawBinary });
    return {
      ok: health.ok,
      alreadyRunning: false,
      pid: spawned.pid,
      logPath: paths.logPath,
      processStatePath: paths.processStatePath,
      health,
    };
  } catch (error) {
    stopDetachedProcess(spawned.pid);
    removeFile(paths.processStatePath);
    throw error;
  }
}

export async function deployMiraOpenClawRuntime({
  upRuntime = upMiraOpenClawRuntime,
  ...options
} = {}) {
  return await upRuntime(options);
}

export async function statusMiraOpenClawRuntime({
  rootDir = DEFAULT_ROOT,
  isProcessAlive: processAlive = isProcessAlive,
  checkStackHealth = checkMiraOpenClawHealth,
  openclawBinary,
} = {}) {
  const paths = resolveMiraOpenClawPaths(rootDir);
  const state = readMiraOpenClawProcessState(paths);
  const pid = state?.pid ?? null;
  const running = Number.isInteger(pid) && processAlive(pid);
  let health = null;

  if (running) {
    health = await checkStackHealth({ rootDir, openclawBinary });
  }

  return {
    runtimeDir: paths.runtimeDir,
    pid,
    running,
    logPath: paths.logPath,
    processStatePath: paths.processStatePath,
    health,
  };
}

export function downMiraOpenClawRuntime({
  rootDir = DEFAULT_ROOT,
  isProcessAlive: processAlive = isProcessAlive,
  stopDetachedProcess: stopProcess = stopDetachedProcess,
} = {}) {
  const paths = resolveMiraOpenClawPaths(rootDir);
  const state = readMiraOpenClawProcessState(paths);
  const pid = state?.pid ?? null;

  if (!Number.isInteger(pid)) {
    removeFile(paths.processStatePath);
    return {
      ok: true,
      pid: null,
      stopped: false,
      logPath: paths.logPath,
      processStatePath: paths.processStatePath,
    };
  }

  const stopped = processAlive(pid) ? stopProcess(pid) : false;
  removeFile(paths.processStatePath);

  return {
    ok: true,
    pid,
    stopped,
    logPath: paths.logPath,
    processStatePath: paths.processStatePath,
  };
}

export async function selfCheckMiraOpenClawRuntime({
  rootDir = DEFAULT_ROOT,
  openclawBinary,
  checkNotificationRouterHealth: checkRouterHealth = checkNotificationRouterHealth,
  probeGatewayHealth: probeGateway = probeGatewayHealth,
  dispatchNotificationRouterSelfCheck: dispatchRouterSelfCheck = dispatchNotificationRouterSelfCheck,
} = {}) {
  const stack = await checkMiraOpenClawHealth({
    rootDir,
    openclawBinary,
    checkNotificationRouterHealth: checkRouterHealth,
    probeGatewayHealth: probeGateway,
  });

  if (!stack.ok) {
    return {
      ok: false,
      stack,
      dispatch: null,
    };
  }

  const dispatch = await dispatchRouterSelfCheck({ rootDir });
  return {
    ok: dispatch.status === 200,
    stack,
    dispatch,
  };
}

export async function startMiraOpenClawRuntime({
  rootDir = DEFAULT_ROOT,
  bootstrapRunCommand = runCommandSync,
  shellRunCommand = runShellCommandSync,
  openclawBinary,
  probeNotificationRouterHealth: probeRouterHealth = probeNotificationRouterHealth,
  waitForNotificationRouterHealth: waitForRouterHealth = waitForNotificationRouterHealth,
  startBackgroundProcess: startBackgroundSidecar = startBackgroundProcess,
} = {}) {
  const paths = resolveMiraOpenClawPaths(rootDir);
  bootstrapMiraOpenClawRuntime({
    rootDir,
    runCommand: bootstrapRunCommand,
    openclawBinary,
  });

  const inspection = inspectMiraOpenClawRuntime({ rootDir, openclawBinary });
  if (inspection.missing.length > 0 || inspection.issues.length > 0) {
    throw new Error(
      [
        "mira-openclaw runtime is not ready.",
        ...inspection.missing,
        ...inspection.issues,
      ].join("\n"),
    );
  }

  const env = buildOpenClawRuntimeEnv(paths);
  let notificationRouterSidecar = null;

  if (toBoolean(env.MIRA_OPENCLAW_ENABLE_NOTIFICATION_ROUTER, true)) {
    const routerInspection = inspectNotificationRouterRuntime({ rootDir });
    if (!routerInspection.ok) {
      throw new Error(
        [
          "notification-router sidecar is not ready.",
          ...routerInspection.missing,
        ].join("\n"),
      );
    }

    const routerState = buildNotificationRouterSidecarState(rootDir);
    const routerAlreadyHealthy = await probeRouterHealth({ rootDir });

    if (!routerAlreadyHealthy) {
      notificationRouterSidecar = startBackgroundSidecar(
        "npm",
        ["run", "start"],
        {
          cwd: routerState.paths.runtimeDir,
          env: routerState.env,
          stdio: "inherit",
        },
      );

      try {
        await waitForRouterHealth({ rootDir });
      } catch (error) {
        notificationRouterSidecar.stop?.();
        throw error;
      }
    }
  }

  try {
    shellRunCommand(inspection.resolvedStartCommand, {
      cwd: paths.runtimeDir,
      env,
      stdio: "inherit",
    });
  } finally {
    notificationRouterSidecar?.stop?.();
  }

  return {
    runtimeDir: paths.runtimeDir,
    configPath: paths.generatedConfigPath,
    manifestPath: paths.manifestPath,
  };
}

async function main() {
  const command = process.argv[2] ?? "bootstrap";

  if (command === "bootstrap") {
    const result = bootstrapMiraOpenClawRuntime();
    console.log(
      JSON.stringify(
        {
          ok: true,
          command,
          ...result,
          next: [
            "npm run doctor:mira-openclaw",
            "npm run deploy:mira-openclaw",
            "npm run start:mira-openclaw",
            "npm run health:mira-openclaw",
            "npm run self-check:mira-openclaw",
          ],
        },
        null,
        2,
      ),
    );
    return;
  }

  if (command === "doctor") {
    const result = doctorMiraOpenClawRuntime();
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.ok ? 0 : 1;
    return;
  }

  if (command === "start") {
    await startMiraOpenClawRuntime();
    return;
  }

  if (command === "deploy" || command === "up") {
    const result = await deployMiraOpenClawRuntime();
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.ok ? 0 : 1;
    return;
  }

  if (command === "status") {
    const result = await statusMiraOpenClawRuntime();
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.running ? 0 : 1;
    return;
  }

  if (command === "down") {
    const result = downMiraOpenClawRuntime();
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.ok ? 0 : 1;
    return;
  }

  if (command === "health") {
    const result = await checkMiraOpenClawHealth();
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.ok ? 0 : 1;
    return;
  }

  if (command === "self-check") {
    const result = await selfCheckMiraOpenClawRuntime();
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.ok ? 0 : 1;
    return;
  }

  throw new Error(`Unknown mira-openclaw command: ${command}`);
}

if (process.argv[1] && resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
