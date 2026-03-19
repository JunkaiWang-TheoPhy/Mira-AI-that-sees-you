import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";

import {
  copyFileIfMissing,
  copyPath,
  isPlaceholderValue,
  loadEnvFile,
  runCommandSync,
  writeJsonFile,
} from "./runtime-utils.mjs";

const __filename = fileURLToPath(import.meta.url);
const DEFAULT_ROOT = resolve(__filename, "..", "..");

function buildNotificationRouterManifest(paths) {
  return {
    kind: "notification-router-runtime-pack",
    runtimeDir: paths.runtimeDir,
    envFilePath: paths.envFilePath,
    manifestPath: paths.manifestPath,
    defaultPort: 3302,
    healthUrl: "http://127.0.0.1:3302/v1/health",
    dispatchUrl: "http://127.0.0.1:3302/v1/dispatch",
  };
}

export function resolveNotificationRouterPaths(rootDir = DEFAULT_ROOT) {
  const runtimeDir = join(rootDir, ".mira-runtime", "notification-router");

  return {
    rootDir,
    sourceDir: join(rootDir, "services", "notification-router"),
    deployDir: join(rootDir, "deploy", "service-notification-router"),
    runtimeDir,
    envFilePath: join(runtimeDir, ".env.local"),
    manifestPath: join(runtimeDir, "runtime-manifest.json"),
  };
}

function syncNotificationRouterRuntime(paths) {
  copyPath(join(paths.sourceDir, "src"), join(paths.runtimeDir, "src"));
  copyPath(join(paths.sourceDir, "config"), join(paths.runtimeDir, "config"));
  copyPath(join(paths.sourceDir, "package.json"), join(paths.runtimeDir, "package.json"));
  copyPath(join(paths.sourceDir, "package-lock.json"), join(paths.runtimeDir, "package-lock.json"));
  copyPath(join(paths.sourceDir, "tsconfig.json"), join(paths.runtimeDir, "tsconfig.json"));

  copyFileIfMissing(join(paths.deployDir, "env.example"), paths.envFilePath);
  rewriteLoopbackEnvDefaults(paths);
  writeJsonFile(paths.manifestPath, buildNotificationRouterManifest(paths));
}

function rewriteLoopbackEnvDefaults(paths) {
  const envText = readFileSync(paths.envFilePath, "utf8");
  const rewritten = envText
    .replace(
      /^MIRA_NOTIFICATION_ROUTER_OPENCLAW_DM_WEBHOOK_URL=.*$/mu,
      "MIRA_NOTIFICATION_ROUTER_OPENCLAW_DM_WEBHOOK_URL=http://127.0.0.1:$PORT/__local__/dm",
    )
    .replace(
      /^MIRA_NOTIFICATION_ROUTER_OPENCLAW_DM_WEBHOOK_SECRET=.*$/mu,
      "MIRA_NOTIFICATION_ROUTER_OPENCLAW_DM_WEBHOOK_SECRET=mira-local-loopback",
    );

  if (rewritten !== envText) {
    writeFileSync(paths.envFilePath, rewritten, "utf8");
  }
}

export function bootstrapNotificationRouterRuntime({
  rootDir = DEFAULT_ROOT,
  runCommand = runCommandSync,
} = {}) {
  const paths = resolveNotificationRouterPaths(rootDir);
  syncNotificationRouterRuntime(paths);

  if (!existsSync(join(paths.runtimeDir, "node_modules"))) {
    runCommand("npm", ["install", "--no-fund", "--no-audit"], {
      cwd: paths.runtimeDir,
      stdio: "inherit",
    });
  }

  return {
    runtimeDir: paths.runtimeDir,
    envFilePath: paths.envFilePath,
    manifestPath: paths.manifestPath,
  };
}

export function inspectNotificationRouterRuntime({ rootDir = DEFAULT_ROOT } = {}) {
  const paths = resolveNotificationRouterPaths(rootDir);
  const missing = [
    paths.runtimeDir,
    join(paths.runtimeDir, "package.json"),
    join(paths.runtimeDir, "src", "server.ts"),
    join(paths.runtimeDir, "config", "outbound-policy.example.yaml"),
    paths.envFilePath,
    paths.manifestPath,
  ].filter((path) => !existsSync(path));

  const warnings = [];
  const env = loadEnvFile(paths.envFilePath);
  if (isPlaceholderValue(env.MIRA_NOTIFICATION_ROUTER_OPENCLAW_DM_WEBHOOK_SECRET)) {
    warnings.push(
      "MIRA_NOTIFICATION_ROUTER_OPENCLAW_DM_WEBHOOK_SECRET is still set to a placeholder value.",
    );
  }
  if (isPlaceholderValue(env.MIRA_NOTIFICATION_ROUTER_RESEND_API_KEY)) {
    warnings.push(
      "MIRA_NOTIFICATION_ROUTER_RESEND_API_KEY is still set to a placeholder value.",
    );
  }

  return {
    runtimeDir: paths.runtimeDir,
    manifestPath: paths.manifestPath,
    missing,
    warnings,
    ok: missing.length === 0,
  };
}

export function buildNotificationRouterRuntimeEnv(paths) {
  const fileEnv = loadEnvFile(paths.envFilePath);
  const templatePolicyPath = "../../services/notification-router/config/outbound-policy.example.yaml";
  const configuredPolicyPath =
    process.env.MIRA_NOTIFICATION_ROUTER_OUTBOUND_POLICY_PATH
    ?? fileEnv.MIRA_NOTIFICATION_ROUTER_OUTBOUND_POLICY_PATH;
  const port = process.env.PORT ?? fileEnv.PORT ?? "3302";
  const webhookUrl = process.env.MIRA_NOTIFICATION_ROUTER_OPENCLAW_DM_WEBHOOK_URL
    ?? fileEnv.MIRA_NOTIFICATION_ROUTER_OPENCLAW_DM_WEBHOOK_URL;

  return {
    ...fileEnv,
    ...process.env,
    PORT: port,
    ...(webhookUrl
      ? {
          MIRA_NOTIFICATION_ROUTER_OPENCLAW_DM_WEBHOOK_URL: webhookUrl.replaceAll("$PORT", port),
        }
      : {}),
    MIRA_NOTIFICATION_ROUTER_OUTBOUND_POLICY_PATH:
      !configuredPolicyPath || configuredPolicyPath === templatePolicyPath
        ? join(paths.runtimeDir, "config", "outbound-policy.example.yaml")
        : configuredPolicyPath,
  };
}

export function startNotificationRouterRuntime({
  rootDir = DEFAULT_ROOT,
  runCommand = runCommandSync,
} = {}) {
  const paths = resolveNotificationRouterPaths(rootDir);
  bootstrapNotificationRouterRuntime({ rootDir, runCommand });

  runCommand("npm", ["run", "start"], {
    cwd: paths.runtimeDir,
    env: {
      ...process.env,
      ...buildNotificationRouterRuntimeEnv(paths),
    },
    stdio: "inherit",
  });

  return {
    runtimeDir: paths.runtimeDir,
    manifestPath: paths.manifestPath,
  };
}

export async function checkNotificationRouterHealth({ rootDir = DEFAULT_ROOT } = {}) {
  const inspection = inspectNotificationRouterRuntime({ rootDir });
  if (!inspection.ok) {
    throw new Error(
      `notification-router runtime is incomplete:\n${inspection.missing.join("\n")}`,
    );
  }

  const paths = resolveNotificationRouterPaths(rootDir);
  const env = buildNotificationRouterRuntimeEnv(paths);
  const baseUrl = process.env.BASE_URL ?? `http://127.0.0.1:${env.PORT}`;
  const response = await fetch(`${baseUrl}/v1/health`);
  const body = await response.json();

  return {
    status: response.status,
    body,
  };
}

export async function dispatchNotificationRouterSelfCheck({
  rootDir = DEFAULT_ROOT,
} = {}) {
  const inspection = inspectNotificationRouterRuntime({ rootDir });
  if (!inspection.ok) {
    throw new Error(
      `notification-router runtime is incomplete:\n${inspection.missing.join("\n")}`,
    );
  }

  const paths = resolveNotificationRouterPaths(rootDir);
  const env = buildNotificationRouterRuntimeEnv(paths);
  const baseUrl = process.env.BASE_URL ?? `http://127.0.0.1:${env.PORT}`;

  const response = await fetch(`${baseUrl}/v1/dispatch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: {
        intent_id: "release-local-checkin-001",
        created_at: "2026-03-19T20:00:00.000Z",
        source: "manual",
        message_kind: "checkin",
        recipient_scope: "self",
        risk_tier: "low",
        privacy_level: "private",
        content: "Local release deploy-pack self check-in.",
        preferred_channels: ["openclaw_channel_dm"],
        recipient: {
          id: "user-self",
        },
        tags: ["project"],
      },
    }),
  });

  return {
    status: response.status,
    body: await response.json(),
  };
}

async function main() {
  const command = process.argv[2] ?? "bootstrap";

  if (command === "bootstrap") {
    const result = bootstrapNotificationRouterRuntime();
    console.log(
      JSON.stringify(
        {
          ok: true,
          command,
          ...result,
          next: [
            "npm run start:notification-router",
            "npm run health:notification-router",
            "npm run self-check:notification-router",
          ],
        },
        null,
        2,
      ),
    );
    return;
  }

  if (command === "doctor") {
    const result = inspectNotificationRouterRuntime();
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.ok ? 0 : 1;
    return;
  }

  if (command === "start") {
    startNotificationRouterRuntime();
    return;
  }

  if (command === "health") {
    const result = await checkNotificationRouterHealth();
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.status === 200 ? 0 : 1;
    return;
  }

  if (command === "self-check") {
    const result = await dispatchNotificationRouterSelfCheck();
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.status === 200 ? 0 : 1;
    return;
  }

  throw new Error(`Unknown notification-router command: ${command}`);
}

if (process.argv[1] && resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
