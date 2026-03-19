import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";

import {
  bootstrapMiraOpenClawRuntime,
  checkMiraOpenClawHealth,
  deployMiraOpenClawRuntime,
  doctorMiraOpenClawRuntime,
  downMiraOpenClawRuntime,
  startMiraOpenClawRuntime,
  statusMiraOpenClawRuntime,
  selfCheckMiraOpenClawRuntime,
} from "./mira-openclaw-runtime.mjs";
import {
  bootstrapNotificationRouterRuntime,
  checkNotificationRouterHealth,
  deployNotificationRouterRuntime,
  downNotificationRouterRuntime,
  dispatchNotificationRouterSelfCheck,
  inspectNotificationRouterRuntime,
  startNotificationRouterRuntime,
  statusNotificationRouterRuntime,
} from "./notification-router-runtime.mjs";
import { copyFileIfMissing, loadEnvFile } from "./runtime-utils.mjs";

const __filename = fileURLToPath(import.meta.url);
const DEFAULT_ROOT = resolve(__filename, "..", "..");
const DEFAULT_PROFILE = "mira-openclaw";
const PROFILE_ENV = "MIRA_DEPLOY_PROFILE";
const KNOWN_PROFILES = new Set(["mira-openclaw", "notification-router"]);

export function resolveRepoEnvPaths(rootDir = DEFAULT_ROOT) {
  return {
    rootDir,
    envPath: join(rootDir, ".env"),
    envLocalPath: join(rootDir, ".env.local"),
    envTemplatePath: join(rootDir, "deploy", "repo.env.example"),
  };
}

export function loadRepoRuntimeEnv(rootDir = DEFAULT_ROOT) {
  const paths = resolveRepoEnvPaths(rootDir);
  return {
    ...loadEnvFile(paths.envPath),
    ...loadEnvFile(paths.envLocalPath),
  };
}

export function ensureRepoEnvFile(rootDir = DEFAULT_ROOT) {
  const paths = resolveRepoEnvPaths(rootDir);
  copyFileIfMissing(paths.envTemplatePath, paths.envLocalPath);
  return paths.envLocalPath;
}

export function resolveRepoProfile(rootDir = DEFAULT_ROOT) {
  const selected =
    process.env[PROFILE_ENV]
    ?? loadRepoRuntimeEnv(rootDir)[PROFILE_ENV]
    ?? DEFAULT_PROFILE;

  if (!KNOWN_PROFILES.has(selected)) {
    throw new Error(
      `Unknown repo deploy profile '${selected}'. Expected one of: ${Array.from(KNOWN_PROFILES).join(", ")}`,
    );
  }

  return selected;
}

async function withRepoRuntimeEnv(rootDir, work) {
  const repoEnv = loadRepoRuntimeEnv(rootDir);
  const previousValues = new Map();

  for (const [key, value] of Object.entries(repoEnv)) {
    if (!previousValues.has(key)) {
      previousValues.set(key, process.env[key]);
    }
    process.env[key] = value;
  }

  try {
    return await work();
  } finally {
    for (const [key, previousValue] of previousValues.entries()) {
      if (previousValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previousValue;
      }
    }
  }
}

export function buildRepoDeployManifest(rootDir = DEFAULT_ROOT) {
  return {
    schemaVersion: 1,
    kind: "mira-release-repo-deploy",
    repoRoot: ".",
    manifestPath: "deploy/repo-manifest.json",
    repoEnvTemplatePath: "deploy/repo.env.example",
    repoEnvFilePath: ".env.local",
    profileSelectorEnv: PROFILE_ENV,
    defaultProfile: "mira-openclaw",
    defaultCommands: {
      bootstrap: "npm run bootstrap",
      doctor: "npm run doctor",
      deploy: "npm run deploy",
      deployAll: "npm run deploy:all",
      start: "npm start",
      status: "npm run status",
      statusAll: "npm run status:all",
      health: "npm run health",
      healthAll: "npm run health:all",
      selfCheck: "npm run self-check",
      selfCheckAll: "npm run self-check:all",
      down: "npm run down",
      downAll: "npm run down:all",
    },
    profiles: {
      "notification-router": {
        runtimeDir: ".mira-runtime/notification-router",
        envTemplatePath: "deploy/service-notification-router/env.example",
        runtimeManifestPath: ".mira-runtime/notification-router/runtime-manifest.json",
        commands: {
          bootstrap: "npm run bootstrap:notification-router",
          deploy: "npm run deploy:notification-router",
          start: "npm run start:notification-router",
          status: "npm run status:notification-router",
          health: "npm run health:notification-router",
          selfCheck: "npm run self-check:notification-router",
          down: "npm run down:notification-router",
        },
        health: {
          kind: "http-json",
          url: "http://127.0.0.1:3302/v1/health",
          expected: {
            ok: true,
            service: "notification-router",
          },
        },
      },
      "mira-openclaw": {
        runtimeDir: ".mira-runtime/mira-openclaw",
        envTemplatePath: "deploy/mira-openclaw/env.example",
        runtimeManifestPath: ".mira-runtime/mira-openclaw/runtime-manifest.json",
        requiredEnv: ["MIRA_OPENCLAW_PROVIDER_API_KEY"],
        commands: {
          bootstrap: "npm run bootstrap:mira-openclaw",
          doctor: "npm run doctor:mira-openclaw",
          deploy: "npm run deploy:mira-openclaw",
          start: "npm run start:mira-openclaw",
          status: "npm run status:mira-openclaw",
          health: "npm run health:mira-openclaw",
          selfCheck: "npm run self-check:mira-openclaw",
          down: "npm run down:mira-openclaw",
        },
        health: {
          kind: "composite",
          gatewayHost: "127.0.0.1",
          gatewayPort: 18890,
          sidecarHealthUrl: "http://127.0.0.1:3302/v1/health",
        },
      },
    },
  };
}

export async function bootstrapRepoRuntime({
  rootDir = DEFAULT_ROOT,
  bootstrapRuntime = bootstrapMiraOpenClawRuntime,
  bootstrapNotificationRouter = bootstrapNotificationRouterRuntime,
} = {}) {
  const repoEnvFilePath = ensureRepoEnvFile(rootDir);
  const manifest = buildRepoDeployManifest(rootDir);
  return await withRepoRuntimeEnv(rootDir, async () => ({
    profile: resolveRepoProfile(rootDir),
    manifest,
    repoEnvFilePath,
    runtime:
      resolveRepoProfile(rootDir) === "notification-router"
        ? bootstrapNotificationRouter({ rootDir })
        : bootstrapRuntime({ rootDir }),
  }));
}

export async function doctorRepoRuntime({
  rootDir = DEFAULT_ROOT,
  doctorRuntime = doctorMiraOpenClawRuntime,
  inspectNotificationRouter = inspectNotificationRouterRuntime,
} = {}) {
  const repoEnvFilePath = ensureRepoEnvFile(rootDir);
  const manifest = buildRepoDeployManifest(rootDir);
  return await withRepoRuntimeEnv(rootDir, async () => ({
    profile: resolveRepoProfile(rootDir),
    manifest,
    repoEnvFilePath,
    runtime:
      resolveRepoProfile(rootDir) === "notification-router"
        ? inspectNotificationRouter({ rootDir })
        : doctorRuntime({ rootDir }),
  }));
}

export async function deployRepoRuntime({
  rootDir = DEFAULT_ROOT,
  deployRuntime = deployMiraOpenClawRuntime,
  deployNotificationRouter = deployNotificationRouterRuntime,
} = {}) {
  return await withRepoRuntimeEnv(rootDir, async () => (
    resolveRepoProfile(rootDir) === "notification-router"
      ? await deployNotificationRouter({ rootDir })
      : await deployRuntime({ rootDir })
  ));
}

export async function startRepoRuntime({
  rootDir = DEFAULT_ROOT,
  startRuntime = startMiraOpenClawRuntime,
  startNotificationRouter = startNotificationRouterRuntime,
} = {}) {
  return await withRepoRuntimeEnv(rootDir, async () => ({
    profile: resolveRepoProfile(rootDir),
    runtime:
      resolveRepoProfile(rootDir) === "notification-router"
        ? await startNotificationRouter({ rootDir })
        : await startRuntime({ rootDir }),
  }));
}

export async function statusRepoRuntime({
  rootDir = DEFAULT_ROOT,
  statusRuntime = statusMiraOpenClawRuntime,
  statusNotificationRouter = statusNotificationRouterRuntime,
} = {}) {
  return await withRepoRuntimeEnv(rootDir, async () => {
    const profile = resolveRepoProfile(rootDir);
    if (profile === "notification-router") {
      return {
        profile,
        ...(await statusNotificationRouter({ rootDir })),
      };
    }

    const runtime = await statusRuntime({ rootDir });
    const notificationRouter = await statusNotificationRouter({ rootDir });

    return {
      profile,
      ...runtime,
      notificationRouter,
    };
  });
}

export async function checkRepoHealth({
  rootDir = DEFAULT_ROOT,
  checkRuntime = checkMiraOpenClawHealth,
  checkNotificationRouter = checkNotificationRouterHealth,
} = {}) {
  return await withRepoRuntimeEnv(rootDir, async () => {
    if (resolveRepoProfile(rootDir) === "notification-router") {
      const result = await checkNotificationRouter({ rootDir });
      return {
        ok: result.status === 200 && result.body?.ok === true,
        profile: "notification-router",
        ...result,
      };
    }

    return await checkRuntime({ rootDir });
  });
}

export async function selfCheckRepoRuntime({
  rootDir = DEFAULT_ROOT,
  selfCheckRuntime = selfCheckMiraOpenClawRuntime,
  dispatchRouterSelfCheck = dispatchNotificationRouterSelfCheck,
} = {}) {
  return await withRepoRuntimeEnv(rootDir, async () => {
    if (resolveRepoProfile(rootDir) === "notification-router") {
      const result = await dispatchRouterSelfCheck({ rootDir });
      return {
        ok: result.status === 200 && result.body?.ok === true,
        profile: "notification-router",
        ...result,
      };
    }

    return await selfCheckRuntime({ rootDir });
  });
}

export function downRepoRuntime({
  rootDir = DEFAULT_ROOT,
  downRuntime = downMiraOpenClawRuntime,
  downNotificationRouter = downNotificationRouterRuntime,
} = {}) {
  const repoEnv = loadRepoRuntimeEnv(rootDir);
  const previousValues = new Map();

  for (const [key, value] of Object.entries(repoEnv)) {
    if (!previousValues.has(key)) {
      previousValues.set(key, process.env[key]);
    }
    process.env[key] = value;
  }

  try {
    const profile = resolveRepoProfile(rootDir);
    if (profile === "notification-router") {
      return {
        ok: true,
        profile,
        notificationRouter: downNotificationRouter({ rootDir }),
      };
    }

    const miraOpenClaw = downRuntime({ rootDir });
    const notificationRouter = downNotificationRouter({ rootDir });

    return {
      ok: miraOpenClaw.ok && notificationRouter.ok,
      profile,
      miraOpenClaw,
      notificationRouter,
    };
  } finally {
    for (const [key, previousValue] of previousValues.entries()) {
      if (previousValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previousValue;
      }
    }
  }
}

async function main() {
  const command = process.argv[2] ?? "doctor";

  if (command === "manifest") {
    console.log(JSON.stringify(buildRepoDeployManifest(), null, 2));
    return;
  }

  if (command === "bootstrap") {
    const result = await bootstrapRepoRuntime();
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.runtime ? 0 : 1;
    return;
  }

  if (command === "doctor") {
    const result = await doctorRepoRuntime();
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.runtime.ok ? 0 : 1;
    return;
  }

  if (command === "deploy" || command === "up") {
    const result = await deployRepoRuntime();
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.ok ? 0 : 1;
    return;
  }

  if (command === "start") {
    const result = await startRepoRuntime();
    if (result?.runtime) {
      console.log(JSON.stringify(result, null, 2));
    }
    return;
  }

  if (command === "status") {
    const result = await statusRepoRuntime();
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.running ? 0 : 1;
    return;
  }

  if (command === "health") {
    const result = await checkRepoHealth();
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.ok ? 0 : 1;
    return;
  }

  if (command === "self-check") {
    const result = await selfCheckRepoRuntime();
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.ok ? 0 : 1;
    return;
  }

  if (command === "down") {
    const result = downRepoRuntime();
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.ok ? 0 : 1;
    return;
  }

  throw new Error(`Unknown repo deploy command: ${command}`);
}

if (process.argv[1] && resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
