import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";

import {
  bootstrapNotificationRouterRuntime,
  buildNotificationRouterRuntimeEnv,
  inspectNotificationRouterRuntime,
  resolveNotificationRouterPaths,
} from "./notification-router-runtime.mjs";
import {
  copyFileIfMissing,
  copyPath,
  findExecutableSync,
  isPlaceholderValue,
  loadEnvFile,
  runCommandSync,
  runShellCommandSync,
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
  const env = loadMiraOpenClawEnv(paths);
  const template = JSON.parse(readFileSync(paths.configTemplatePath, "utf8"));
  const [templateProviderId, templateProvider] = Object.entries(template.models.providers)[0];
  const templateModel = templateProvider.models[0];

  const providerId = env.MIRA_OPENCLAW_PROVIDER_ID || templateProviderId;
  const modelId = env.MIRA_OPENCLAW_MODEL_ID || templateModel.id;
  const modelName = env.MIRA_OPENCLAW_MODEL_NAME || templateModel.name || modelId;
  const prompt = readFileSync(paths.promptRuntimePath, "utf8").trim();

  const generatedConfig = {
    ...template,
    models: {
      ...template.models,
      providers: {
        [providerId]: {
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
      },
    },
    agents: {
      ...template.agents,
      defaults: {
        ...template.agents.defaults,
        model: {
          ...(template.agents.defaults.model ?? {}),
          primary: `${providerId}/${modelId}`,
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
  return `${openclawBinary} gateway run --allow-unconfigured --port ${gatewayPort}`;
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
  const resolvedStartCommand = resolveStartCommand(
    buildOpenClawRuntimeEnv(paths),
    resolveOpenClawBinary(openclawBinary),
  );
  const issues = [];
  if (isPlaceholderValue(env.MIRA_OPENCLAW_PROVIDER_API_KEY)) {
    issues.push("MIRA_OPENCLAW_PROVIDER_API_KEY is still using a placeholder API key.");
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
            "npm run start:mira-openclaw",
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
    startMiraOpenClawRuntime();
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
