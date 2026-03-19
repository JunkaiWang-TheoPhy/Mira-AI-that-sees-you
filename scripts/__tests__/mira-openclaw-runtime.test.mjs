import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  bootstrapMiraOpenClawRuntime,
  checkMiraOpenClawHealth,
  deployMiraOpenClawRuntime,
  downMiraOpenClawRuntime,
  doctorMiraOpenClawRuntime,
  inspectMiraOpenClawRuntime,
  selfCheckMiraOpenClawRuntime,
  startMiraOpenClawRuntime,
  statusMiraOpenClawRuntime,
  upMiraOpenClawRuntime,
} from "../mira-openclaw-runtime.mjs";

const TEST_MISSING_HOST_CONFIG_PATH = join(
  tmpdir(),
  "mira-openclaw-test-missing-host-config.json",
);

process.env.OPENCLAW_CONFIG_PATH = TEST_MISSING_HOST_CONFIG_PATH;

function writeNotificationRouterFixture(root) {
  mkdirSync(join(root, "services", "notification-router", "src"), { recursive: true });
  mkdirSync(join(root, "services", "notification-router", "config"), { recursive: true });
  mkdirSync(join(root, "deploy", "service-notification-router"), { recursive: true });

  writeFileSync(
    join(root, "services", "notification-router", "package.json"),
    JSON.stringify({
      name: "@mira-release/notification-router",
      private: true,
      type: "module",
      scripts: {
        start: "tsx src/server.ts",
      },
      devDependencies: {
        tsx: "^4.20.6",
      },
    }, null, 2),
  );
  writeFileSync(
    join(root, "services", "notification-router", "package-lock.json"),
    JSON.stringify({ name: "@mira-release/notification-router", lockfileVersion: 3, packages: { "": { name: "@mira-release/notification-router" } } }, null, 2),
  );
  writeFileSync(join(root, "services", "notification-router", "tsconfig.json"), "{}\n");
  writeFileSync(join(root, "services", "notification-router", "src", "server.ts"), "console.log('router');\n");
  writeFileSync(join(root, "services", "notification-router", "config", "outbound-policy.example.yaml"), "version: 1\n");
  writeFileSync(
    join(root, "deploy", "service-notification-router", "env.example"),
    [
      "PORT=3302",
      "MIRA_NOTIFICATION_ROUTER_OPENCLAW_DM_WEBHOOK_URL=http://127.0.0.1:3400/hook",
      "MIRA_NOTIFICATION_ROUTER_OPENCLAW_DM_WEBHOOK_SECRET=replace-me",
      "",
    ].join("\n"),
  );
}

function writeMiraFixture(root) {
  mkdirSync(join(root, "core", "persona"), { recursive: true });
  mkdirSync(join(root, "core", "workspace"), { recursive: true });
  mkdirSync(join(root, "core", "openclaw-config"), { recursive: true });
  mkdirSync(join(root, "core", "plugins", "lingzhu-bridge", "src"), { recursive: true });
  mkdirSync(join(root, "deploy", "mira-openclaw"), { recursive: true });

  writeFileSync(join(root, "core", "persona", "SOUL.md"), "# soul\n");
  writeFileSync(join(root, "core", "persona", "IDENTITY.md"), "# identity\n");
  writeFileSync(join(root, "core", "workspace", "AGENTS.md"), "# agents\n");
  writeFileSync(join(root, "core", "workspace", "MEMORY.md"), "# memory\n");
  writeFileSync(join(root, "core", "workspace", "OUTBOUND_POLICY.md"), "# outbound\n");
  writeFileSync(join(root, "core", "workspace", "TOOLS.md"), "# tools\n");
  writeFileSync(join(root, "core", "openclaw-config", "lingzhu-system-prompt.txt"), "You are Mira.\n");
  writeFileSync(
    join(root, "core", "openclaw-config", "openclaw.example.json"),
    JSON.stringify({
      models: {
        mode: "merge",
        providers: {
          "replace-me-provider": {
            baseUrl: "https://api.example.com/v1",
            apiKey: "REPLACE_ME_API_KEY",
            api: "openai-responses",
            models: [{ id: "gpt-5.4", name: "gpt-5.4", reasoning: true, input: ["text"], contextWindow: 200000, maxTokens: 8192 }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "replace-me-provider/gpt-5.4",
          },
          workspace: "./core/workspace",
          userTimezone: "Asia/Shanghai",
          compaction: {
            mode: "safeguard",
          },
        },
      },
      plugins: {
        allow: ["lingzhu"],
        entries: {
          lingzhu: {
            enabled: true,
            config: {
              agentId: "main",
              systemPrompt: "<load release-safe prompt from ./core/openclaw-config/lingzhu-system-prompt.txt>",
              memoryContextEnabled: true,
              memoryContextUrl: "http://127.0.0.1:3301/v1/memory/context",
            },
          },
        },
      },
    }, null, 2),
  );
  writeFileSync(
    join(root, "core", "plugins", "lingzhu-bridge", "package.json"),
    JSON.stringify({
      name: "@mira-release/lingzhu",
      private: true,
      type: "module",
      openclaw: {
        extensions: ["./src/index.ts"],
      },
      scripts: {
        test: "tsx --test tests/*.test.mts",
      },
      devDependencies: {
        tsx: "^4.20.5",
      },
    }, null, 2),
  );
  writeFileSync(
    join(root, "core", "plugins", "lingzhu-bridge", "package-lock.json"),
    JSON.stringify({ name: "@mira-release/lingzhu", lockfileVersion: 3, packages: { "": { name: "@mira-release/lingzhu" } } }, null, 2),
  );
  writeFileSync(
    join(root, "core", "plugins", "lingzhu-bridge", "openclaw.plugin.json"),
    JSON.stringify({
      id: "lingzhu",
      configSchema: {
        type: "object",
        additionalProperties: false,
        properties: {},
      },
    }, null, 2),
  );
  writeFileSync(
    join(root, "core", "plugins", "lingzhu-bridge", "src", "index.ts"),
    "export default { id: 'lingzhu', register() {} };\n",
  );
  writeFileSync(join(root, "core", "plugins", "lingzhu-bridge", "src", "types.ts"), "export type X = string;\n");
  writeFileSync(
    join(root, "deploy", "mira-openclaw", "env.example"),
    [
      "MIRA_OPENCLAW_PROVIDER_ID=replace-me-provider",
      "MIRA_OPENCLAW_PROVIDER_BASE_URL=https://api.example.com/v1",
      "MIRA_OPENCLAW_PROVIDER_API=openai-responses",
      "MIRA_OPENCLAW_PROVIDER_API_KEY=replace-me",
      "MIRA_OPENCLAW_MODEL_ID=gpt-5.4",
      "MIRA_OPENCLAW_MODEL_NAME=gpt-5.4",
      "MIRA_OPENCLAW_USER_TIMEZONE=Asia/Shanghai",
      "MIRA_OPENCLAW_MEMORY_CONTEXT_ENABLED=false",
      "MIRA_OPENCLAW_GATEWAY_PORT=18890",
      "OPENCLAW_START_COMMAND=replace-me",
      "",
    ].join("\n"),
  );
}

function writeHostOpenClawConfig(root, {
  providerId = "host-provider",
  baseUrl = "https://host.example.com/v1",
  apiKey = "host-key",
  api = "openai-responses",
  modelId = "host-model",
  modelName = "host-model",
} = {}) {
  const hostConfigPath = join(root, "host-openclaw.json");
  writeFileSync(
    hostConfigPath,
    JSON.stringify({
      models: {
        mode: "merge",
        providers: {
          [providerId]: {
            baseUrl,
            apiKey,
            api,
            models: [
              {
                id: modelId,
                name: modelName,
                reasoning: true,
                input: ["text"],
                contextWindow: 200000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: `${providerId}/${modelId}`,
          },
        },
      },
    }, null, 2),
  );

  return hostConfigPath;
}

test("bootstrapMiraOpenClawRuntime generates a local runtime pack and config manifest", () => {
  const root = mkdtempSync(join(tmpdir(), "mira-openclaw-runtime-"));
  writeNotificationRouterFixture(root);
  writeMiraFixture(root);

  const calls = [];
  const result = bootstrapMiraOpenClawRuntime({
    rootDir: root,
    runCommand(command, args, options) {
      if (args[0] === "plugins" && args[1] === "install") {
        writeFileSync(
          options.env.OPENCLAW_CONFIG_PATH,
          JSON.stringify({
            plugins: {
              allow: ["lingzhu"],
              load: {
                paths: [join(root, ".mira-runtime", "mira-openclaw", "core", "plugins", "lingzhu-bridge")],
              },
              entries: {
                lingzhu: {
                  enabled: true,
                },
              },
              installs: {
                lingzhu: {
                  source: "path",
                },
              },
            },
          }, null, 2),
        );
      }
      calls.push({ command, args, options });
      return { status: 0, stdout: "", stderr: "" };
    },
  });

  assert.equal(existsSync(join(result.runtimeDir, "core", "workspace", "AGENTS.md")), true);
  assert.equal(existsSync(result.configPath), true);
  assert.equal(existsSync(result.manifestPath), true);
  assert.equal(
    existsSync(join(result.runtimeDir, "core", "plugins", "lingzhu-bridge", "openclaw.plugin.json")),
    true,
  );
  assert.equal(
    existsSync(join(result.runtimeDir, "core", "plugins", "lingzhu-bridge", "src", "index.ts")),
    true,
  );
  assert.equal(calls.length, 3);

  const config = JSON.parse(readFileSync(result.configPath, "utf8"));
  assert.equal(config.agents.defaults.workspace, join(result.runtimeDir, "core", "workspace"));
  assert.equal(config.plugins.entries.lingzhu.config.systemPrompt, "You are Mira.");
  assert.equal(config.plugins.entries.lingzhu.config.memoryContextEnabled, false);
  assert.deepEqual(config.plugins.load.paths, [join(result.runtimeDir, "core", "plugins", "lingzhu-bridge")]);
  assert.deepEqual(config.plugins.installs.lingzhu, { source: "path" });

  const manifest = JSON.parse(readFileSync(result.manifestPath, "utf8"));
  assert.equal(manifest.kind, "mira-openclaw-runtime-pack");
  assert.equal(manifest.openClawConfigPath, result.configPath);
  assert.equal(manifest.pluginPackagePath, join(result.runtimeDir, "core", "plugins", "lingzhu-bridge"));
  assert.equal(manifest.notificationRouterManifestPath, join(root, ".mira-runtime", "notification-router", "runtime-manifest.json"));
  assert.equal(manifest.openClawStateDir, join(result.runtimeDir, "openclaw-state"));
});

test("inspectMiraOpenClawRuntime reports placeholder secrets and start command gaps", () => {
  const root = mkdtempSync(join(tmpdir(), "mira-openclaw-inspect-"));
  writeNotificationRouterFixture(root);
  writeMiraFixture(root);

  const result = bootstrapMiraOpenClawRuntime({
    rootDir: root,
    runCommand() {
      return { status: 0, stdout: "", stderr: "" };
    },
  });

  const inspection = inspectMiraOpenClawRuntime({ rootDir: root });
  assert.equal(inspection.runtimeDir, result.runtimeDir);
  assert.equal(inspection.ok, false);
  assert.match(inspection.issues.join("\n"), /no usable provider|MIRA_OPENCLAW_PROVIDER_API_KEY/);
  assert.equal(
    inspection.resolvedStartCommand,
    "/opt/homebrew/bin/openclaw gateway run --port 18890",
  );
});

test("bootstrapMiraOpenClawRuntime preserves installed plugin dependencies across re-syncs", () => {
  const root = mkdtempSync(join(tmpdir(), "mira-openclaw-rebootstrap-"));
  writeNotificationRouterFixture(root);
  writeMiraFixture(root);

  bootstrapMiraOpenClawRuntime({
    rootDir: root,
    runCommand() {
      return { status: 0, stdout: "", stderr: "" };
    },
  });

  mkdirSync(
    join(root, ".mira-runtime", "notification-router", "node_modules"),
    { recursive: true },
  );
  mkdirSync(
    join(root, ".mira-runtime", "mira-openclaw", "core", "plugins", "lingzhu-bridge", "node_modules"),
    { recursive: true },
  );

  const calls = [];
  bootstrapMiraOpenClawRuntime({
    rootDir: root,
    runCommand(command, args, options) {
      calls.push({ command, args, options });
      return { status: 0, stdout: "", stderr: "" };
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].args[0], "plugins");
});

test("bootstrapMiraOpenClawRuntime provisions repo-local OpenClaw env and installs the plugin through the CLI", () => {
  const root = mkdtempSync(join(tmpdir(), "mira-openclaw-cli-"));
  writeNotificationRouterFixture(root);
  writeMiraFixture(root);

  const calls = [];
  bootstrapMiraOpenClawRuntime({
    rootDir: root,
    runCommand(command, args, options) {
      calls.push({ command, args, options });
      return { status: 0, stdout: "", stderr: "" };
    },
  });

  const pluginInstallCall = calls.find(
    (call) =>
      call.command.endsWith("openclaw")
      && call.args[0] === "plugins"
      && call.args[1] === "install",
  );

  assert.ok(pluginInstallCall);
  assert.deepEqual(pluginInstallCall.args.slice(0, 4), ["plugins", "install", "--link", join(root, ".mira-runtime", "mira-openclaw", "core", "plugins", "lingzhu-bridge")]);
  assert.equal(
    pluginInstallCall.options.env.OPENCLAW_STATE_DIR,
    join(root, ".mira-runtime", "mira-openclaw", "openclaw-state"),
  );
  assert.equal(
    pluginInstallCall.options.env.OPENCLAW_CONFIG_PATH,
    join(root, ".mira-runtime", "mira-openclaw", "core", "openclaw-config", "openclaw.local.json"),
  );
});

test("inspectMiraOpenClawRuntime uses the detected openclaw gateway command when no explicit start command is configured", () => {
  const root = mkdtempSync(join(tmpdir(), "mira-openclaw-default-start-"));
  writeNotificationRouterFixture(root);
  writeMiraFixture(root);

  bootstrapMiraOpenClawRuntime({
    rootDir: root,
    runCommand() {
      return { status: 0, stdout: "", stderr: "" };
    },
  });

  const inspection = inspectMiraOpenClawRuntime({
    rootDir: root,
    openclawBinary: "/opt/homebrew/bin/openclaw",
  });
  assert.equal(inspection.ok, false);
  assert.equal(
    inspection.resolvedStartCommand,
    "/opt/homebrew/bin/openclaw gateway run --port 18890",
  );
  assert.ok(!inspection.issues.some((issue) => issue.includes("OPENCLAW_START_COMMAND")));
});

test("bootstrapMiraOpenClawRuntime inherits the host default provider when repo provider env is still placeholder", () => {
  const root = mkdtempSync(join(tmpdir(), "mira-openclaw-host-provider-"));
  writeNotificationRouterFixture(root);
  writeMiraFixture(root);

  const hostConfigPath = writeHostOpenClawConfig(root, {
    providerId: "host-provider",
    apiKey: "host-key",
    modelId: "host-model",
    modelName: "host-model",
  });

  const previousHostConfigPath = process.env.OPENCLAW_CONFIG_PATH;

  try {
    process.env.OPENCLAW_CONFIG_PATH = hostConfigPath;

    const result = bootstrapMiraOpenClawRuntime({
      rootDir: root,
      openclawBinary: "/opt/homebrew/bin/openclaw",
      runCommand() {
        return { status: 0, stdout: "", stderr: "" };
      },
    });

    const generatedConfig = JSON.parse(readFileSync(result.configPath, "utf8"));
    assert.deepEqual(Object.keys(generatedConfig.models.providers), ["host-provider"]);
    assert.equal(generatedConfig.models.providers["host-provider"].apiKey, "host-key");
    assert.equal(generatedConfig.agents.defaults.model.primary, "host-provider/host-model");

    const inspection = inspectMiraOpenClawRuntime({
      rootDir: root,
      openclawBinary: "/opt/homebrew/bin/openclaw",
    });
    assert.equal(inspection.ok, true);
    assert.ok(!inspection.issues.some((issue) => issue.includes("provider")));
    assert.ok(!inspection.issues.some((issue) => issue.includes("API key")));
  } finally {
    if (previousHostConfigPath === undefined) {
      delete process.env.OPENCLAW_CONFIG_PATH;
    } else {
      process.env.OPENCLAW_CONFIG_PATH = previousHostConfigPath;
    }
  }
});

test("bootstrapMiraOpenClawRuntime inherits the host provider from the active OpenClaw profile directory", () => {
  const fakeHome = mkdtempSync(join(tmpdir(), "mira-openclaw-profile-home-"));
  const root = join(
    fakeHome,
    ".openclaw",
    "workspace-openclaw-agents",
    "main",
    "Mira-AI-that-sees-you",
  );
  mkdirSync(root, { recursive: true });
  writeNotificationRouterFixture(root);
  writeMiraFixture(root);

  const profiledConfigPath = join(fakeHome, ".openclaw-main", "openclaw.json");
  mkdirSync(join(profiledConfigPath, ".."), { recursive: true });
  writeFileSync(
    profiledConfigPath,
    JSON.stringify({
      models: {
        mode: "merge",
        providers: {
          "profile-provider": {
            baseUrl: "https://profile.example.com/v1",
            apiKey: "profile-key",
            api: "openai-responses",
            models: [
              {
                id: "profile-model",
                name: "profile-model",
                reasoning: true,
                input: ["text"],
                contextWindow: 200000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "profile-provider/profile-model",
          },
        },
      },
    }, null, 2),
  );

  const previousHome = process.env.HOME;
  const previousHostConfigPath = process.env.OPENCLAW_CONFIG_PATH;
  const previousHostProfile = process.env.MIRA_OPENCLAW_HOST_PROFILE;
  const previousRepoApiKey = process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;

  try {
    process.env.HOME = fakeHome;
    delete process.env.OPENCLAW_CONFIG_PATH;
    delete process.env.MIRA_OPENCLAW_HOST_PROFILE;
    delete process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;

    const result = bootstrapMiraOpenClawRuntime({
      rootDir: root,
      openclawBinary: "/opt/homebrew/bin/openclaw",
      runCommand() {
        return { status: 0, stdout: "", stderr: "" };
      },
    });

    const generatedConfig = JSON.parse(readFileSync(result.configPath, "utf8"));
    assert.deepEqual(Object.keys(generatedConfig.models.providers), ["profile-provider"]);
    assert.equal(generatedConfig.models.providers["profile-provider"].apiKey, "profile-key");
    assert.equal(
      generatedConfig.agents.defaults.model.primary,
      "profile-provider/profile-model",
    );

    const inspection = inspectMiraOpenClawRuntime({
      rootDir: root,
      openclawBinary: "/opt/homebrew/bin/openclaw",
    });
    assert.equal(inspection.ok, true);
    assert.equal(inspection.provider.hostConfigPath, profiledConfigPath);
    assert.equal(inspection.provider.source, "host-default");
  } finally {
    if (previousHome === undefined) {
      delete process.env.HOME;
    } else {
      process.env.HOME = previousHome;
    }
    if (previousHostConfigPath === undefined) {
      delete process.env.OPENCLAW_CONFIG_PATH;
    } else {
      process.env.OPENCLAW_CONFIG_PATH = previousHostConfigPath;
    }
    if (previousHostProfile === undefined) {
      delete process.env.MIRA_OPENCLAW_HOST_PROFILE;
    } else {
      process.env.MIRA_OPENCLAW_HOST_PROFILE = previousHostProfile;
    }
    if (previousRepoApiKey === undefined) {
      delete process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;
    } else {
      process.env.MIRA_OPENCLAW_PROVIDER_API_KEY = previousRepoApiKey;
    }
  }
});

test("bootstrapMiraOpenClawRuntime accepts OPENAI_API_KEY as the repo fallback provider when host OpenClaw has no usable provider", () => {
  const root = mkdtempSync(join(tmpdir(), "mira-openclaw-openai-fallback-"));
  writeNotificationRouterFixture(root);
  writeMiraFixture(root);

  const previousHostConfigPath = process.env.OPENCLAW_CONFIG_PATH;
  const previousRepoApiKey = process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;
  const previousProviderId = process.env.MIRA_OPENCLAW_PROVIDER_ID;
  const previousProviderBaseUrl = process.env.MIRA_OPENCLAW_PROVIDER_BASE_URL;
  const previousProviderApi = process.env.MIRA_OPENCLAW_PROVIDER_API;
  const previousOpenAiApiKey = process.env.OPENAI_API_KEY;
  const previousOpenAiBaseUrl = process.env.OPENAI_BASE_URL;

  try {
    process.env.OPENCLAW_CONFIG_PATH = TEST_MISSING_HOST_CONFIG_PATH;
    delete process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;
    delete process.env.MIRA_OPENCLAW_PROVIDER_ID;
    delete process.env.MIRA_OPENCLAW_PROVIDER_BASE_URL;
    delete process.env.MIRA_OPENCLAW_PROVIDER_API;
    process.env.OPENAI_API_KEY = "ambient-openai-key";
    process.env.OPENAI_BASE_URL = "https://openai-proxy.example.com/v1";

    const result = bootstrapMiraOpenClawRuntime({
      rootDir: root,
      runCommand() {
        return { status: 0, stdout: "", stderr: "" };
      },
    });

    const generatedConfig = JSON.parse(readFileSync(result.configPath, "utf8"));
    assert.deepEqual(Object.keys(generatedConfig.models.providers), ["openai"]);
    assert.equal(generatedConfig.models.providers.openai.apiKey, "ambient-openai-key");
    assert.equal(
      generatedConfig.models.providers.openai.baseUrl,
      "https://openai-proxy.example.com/v1",
    );
    assert.equal(generatedConfig.models.providers.openai.api, "openai-responses");
    assert.equal(generatedConfig.agents.defaults.model.primary, "openai/gpt-5.4");

    const inspection = inspectMiraOpenClawRuntime({ rootDir: root });
    assert.equal(inspection.ok, true);
    assert.equal(inspection.provider.source, "repo-env");
    assert.ok(!inspection.issues.some((issue) => issue.includes("provider")));
    assert.ok(!inspection.issues.some((issue) => issue.includes("API key")));
  } finally {
    if (previousHostConfigPath === undefined) {
      delete process.env.OPENCLAW_CONFIG_PATH;
    } else {
      process.env.OPENCLAW_CONFIG_PATH = previousHostConfigPath;
    }
    if (previousRepoApiKey === undefined) {
      delete process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;
    } else {
      process.env.MIRA_OPENCLAW_PROVIDER_API_KEY = previousRepoApiKey;
    }
    if (previousProviderId === undefined) {
      delete process.env.MIRA_OPENCLAW_PROVIDER_ID;
    } else {
      process.env.MIRA_OPENCLAW_PROVIDER_ID = previousProviderId;
    }
    if (previousProviderBaseUrl === undefined) {
      delete process.env.MIRA_OPENCLAW_PROVIDER_BASE_URL;
    } else {
      process.env.MIRA_OPENCLAW_PROVIDER_BASE_URL = previousProviderBaseUrl;
    }
    if (previousProviderApi === undefined) {
      delete process.env.MIRA_OPENCLAW_PROVIDER_API;
    } else {
      process.env.MIRA_OPENCLAW_PROVIDER_API = previousProviderApi;
    }
    if (previousOpenAiApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = previousOpenAiApiKey;
    }
    if (previousOpenAiBaseUrl === undefined) {
      delete process.env.OPENAI_BASE_URL;
    } else {
      process.env.OPENAI_BASE_URL = previousOpenAiBaseUrl;
    }
  }
});

test("doctorMiraOpenClawRuntime validates the generated config through openclaw", () => {
  const root = mkdtempSync(join(tmpdir(), "mira-openclaw-doctor-"));
  writeNotificationRouterFixture(root);
  writeMiraFixture(root);

  const previousApiKey = process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;

  try {
    process.env.MIRA_OPENCLAW_PROVIDER_API_KEY = "test-key";

    bootstrapMiraOpenClawRuntime({
      rootDir: root,
      runCommand() {
        return { status: 0, stdout: "", stderr: "" };
      },
    });

    const calls = [];
    const result = doctorMiraOpenClawRuntime({
      rootDir: root,
      openclawBinary: "/opt/homebrew/bin/openclaw",
      runCommand(command, args, options) {
        calls.push({ command, args, options });
        return {
          status: 0,
          stdout: JSON.stringify({ ok: true }),
          stderr: "",
        };
      },
    });

    assert.equal(result.ok, true);
    assert.deepEqual(result.configValidation, { ok: true });
    const validateCall = calls.find(
      (call) =>
        call.command === "/opt/homebrew/bin/openclaw"
        && call.args[0] === "config"
        && call.args[1] === "validate",
    );
    assert.ok(validateCall);
    assert.equal(
      validateCall.options.env.OPENCLAW_CONFIG_PATH,
      join(root, ".mira-runtime", "mira-openclaw", "core", "openclaw-config", "openclaw.local.json"),
    );
    assert.equal(
      validateCall.options.env.OPENCLAW_STATE_DIR,
      join(root, ".mira-runtime", "mira-openclaw", "openclaw-state"),
    );
  } finally {
    if (previousApiKey === undefined) {
      delete process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;
    } else {
      process.env.MIRA_OPENCLAW_PROVIDER_API_KEY = previousApiKey;
    }
  }
});

test("startMiraOpenClawRuntime auto-starts the notification-router sidecar before launching OpenClaw", async () => {
  const root = mkdtempSync(join(tmpdir(), "mira-openclaw-start-stack-"));
  writeNotificationRouterFixture(root);
  writeMiraFixture(root);

  const previousStartCommand = process.env.OPENCLAW_START_COMMAND;
  const previousApiKey = process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;
  process.env.OPENCLAW_START_COMMAND = "echo openclaw";
  process.env.MIRA_OPENCLAW_PROVIDER_API_KEY = "test-key";

  const calls = [];
  try {
    await startMiraOpenClawRuntime({
      rootDir: root,
      bootstrapRunCommand(command, args, options) {
        calls.push({ type: "bootstrap", command, args, options });
        return { status: 0, stdout: "", stderr: "" };
      },
      probeNotificationRouterHealth() {
        calls.push({ type: "probe-router" });
        return Promise.resolve(false);
      },
      startBackgroundProcess(command, args, options) {
        calls.push({ type: "start-router", command, args, options });
        return {
          stop() {
            calls.push({ type: "stop-router" });
          },
        };
      },
      waitForNotificationRouterHealth() {
        calls.push({ type: "wait-router" });
        return Promise.resolve({ status: 200 });
      },
      shellRunCommand(command, options) {
        calls.push({ type: "start-openclaw", command, options });
        return { status: 0, stdout: "", stderr: "" };
      },
    });
  } finally {
    if (previousStartCommand === undefined) {
      delete process.env.OPENCLAW_START_COMMAND;
    } else {
      process.env.OPENCLAW_START_COMMAND = previousStartCommand;
    }
    if (previousApiKey === undefined) {
      delete process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;
    } else {
      process.env.MIRA_OPENCLAW_PROVIDER_API_KEY = previousApiKey;
    }
  }

  const startRouterCall = calls.find((call) => call.type === "start-router");
  assert.ok(startRouterCall);
  assert.equal(startRouterCall.command, "npm");
  assert.deepEqual(startRouterCall.args, ["run", "start"]);
  assert.equal(
    startRouterCall.options.cwd,
    join(root, ".mira-runtime", "notification-router"),
  );
  assert.equal(startRouterCall.options.env.PORT, "3302");

  const startOpenClawCall = calls.find((call) => call.type === "start-openclaw");
  assert.ok(startOpenClawCall);
  assert.equal(startOpenClawCall.command, "echo openclaw");
  assert.equal(
    calls.findIndex((call) => call.type === "wait-router")
      < calls.findIndex((call) => call.type === "start-openclaw"),
    true,
  );
  assert.equal(calls.some((call) => call.type === "stop-router"), true);
});

test("startMiraOpenClawRuntime fails fast with guidance when neither the host nor repo provide a usable provider", async () => {
  const root = mkdtempSync(join(tmpdir(), "mira-openclaw-missing-provider-"));
  writeNotificationRouterFixture(root);
  writeMiraFixture(root);

  const previousStartCommand = process.env.OPENCLAW_START_COMMAND;
  const previousApiKey = process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;
  const previousHostConfigPath = process.env.OPENCLAW_CONFIG_PATH;

  try {
    process.env.OPENCLAW_START_COMMAND = "echo openclaw";
    delete process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;
    process.env.OPENCLAW_CONFIG_PATH = TEST_MISSING_HOST_CONFIG_PATH;

    await assert.rejects(
      () => startMiraOpenClawRuntime({
        rootDir: root,
        openclawBinary: "/opt/homebrew/bin/openclaw",
        bootstrapRunCommand() {
          return { status: 0, stdout: "", stderr: "" };
        },
      }),
      /configure a default provider in host OpenClaw|OPENAI_API_KEY|MIRA_OPENCLAW_PROVIDER_API_KEY/i,
    );
  } finally {
    if (previousStartCommand === undefined) {
      delete process.env.OPENCLAW_START_COMMAND;
    } else {
      process.env.OPENCLAW_START_COMMAND = previousStartCommand;
    }
    if (previousApiKey === undefined) {
      delete process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;
    } else {
      process.env.MIRA_OPENCLAW_PROVIDER_API_KEY = previousApiKey;
    }
    if (previousHostConfigPath === undefined) {
      process.env.OPENCLAW_CONFIG_PATH = TEST_MISSING_HOST_CONFIG_PATH;
    } else {
      process.env.OPENCLAW_CONFIG_PATH = previousHostConfigPath;
    }
  }
});

test("checkMiraOpenClawHealth reports a healthy integrated stack when gateway and router are both reachable", async () => {
  const root = mkdtempSync(join(tmpdir(), "mira-openclaw-health-"));
  writeNotificationRouterFixture(root);
  writeMiraFixture(root);

  const previousApiKey = process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;
  try {
    process.env.MIRA_OPENCLAW_PROVIDER_API_KEY = "test-key";

    bootstrapMiraOpenClawRuntime({
      rootDir: root,
      runCommand() {
        return { status: 0, stdout: "", stderr: "" };
      },
    });

    const result = await checkMiraOpenClawHealth({
      rootDir: root,
      openclawBinary: "/opt/homebrew/bin/openclaw",
      checkNotificationRouterHealth() {
        return Promise.resolve({
          status: 200,
          body: { ok: true, service: "notification-router" },
        });
      },
      probeGatewayHealth() {
        return Promise.resolve({
          ok: true,
          host: "127.0.0.1",
          port: 18890,
        });
      },
    });

    assert.equal(result.ok, true);
    assert.equal(result.gateway.ok, true);
    assert.equal(result.notificationRouter.status, 200);
    assert.equal(result.gateway.port, 18890);
  } finally {
    if (previousApiKey === undefined) {
      delete process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;
    } else {
      process.env.MIRA_OPENCLAW_PROVIDER_API_KEY = previousApiKey;
    }
  }
});

test("selfCheckMiraOpenClawRuntime reuses integrated health checks and dispatches the notification-router self check", async () => {
  const root = mkdtempSync(join(tmpdir(), "mira-openclaw-self-check-"));
  writeNotificationRouterFixture(root);
  writeMiraFixture(root);

  const previousApiKey = process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;
  try {
    process.env.MIRA_OPENCLAW_PROVIDER_API_KEY = "test-key";

    bootstrapMiraOpenClawRuntime({
      rootDir: root,
      runCommand() {
        return { status: 0, stdout: "", stderr: "" };
      },
    });

    const calls = [];
    const result = await selfCheckMiraOpenClawRuntime({
      rootDir: root,
      openclawBinary: "/opt/homebrew/bin/openclaw",
      checkNotificationRouterHealth() {
        calls.push("router-health");
        return Promise.resolve({
          status: 200,
          body: { ok: true, service: "notification-router" },
        });
      },
      probeGatewayHealth() {
        calls.push("gateway-health");
        return Promise.resolve({
          ok: true,
          host: "127.0.0.1",
          port: 18890,
        });
      },
      dispatchNotificationRouterSelfCheck() {
        calls.push("router-self-check");
        return Promise.resolve({
          status: 200,
          body: { ok: true, delivery: { ok: true } },
        });
      },
    });

    assert.equal(result.ok, true);
    assert.equal(result.stack.ok, true);
    assert.equal(result.dispatch.status, 200);
    assert.deepEqual(calls, [
      "router-health",
      "gateway-health",
      "router-self-check",
    ]);
  } finally {
    if (previousApiKey === undefined) {
      delete process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;
    } else {
      process.env.MIRA_OPENCLAW_PROVIDER_API_KEY = previousApiKey;
    }
  }
});

test("checkMiraOpenClawHealth reports structured failures when the sidecar is unreachable", async () => {
  const root = mkdtempSync(join(tmpdir(), "mira-openclaw-health-fail-"));
  writeNotificationRouterFixture(root);
  writeMiraFixture(root);

  const previousApiKey = process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;
  try {
    process.env.MIRA_OPENCLAW_PROVIDER_API_KEY = "test-key";

    bootstrapMiraOpenClawRuntime({
      rootDir: root,
      runCommand() {
        return { status: 0, stdout: "", stderr: "" };
      },
    });

    const result = await checkMiraOpenClawHealth({
      rootDir: root,
      openclawBinary: "/opt/homebrew/bin/openclaw",
      checkNotificationRouterHealth() {
        return Promise.reject(new Error("connect ECONNREFUSED 127.0.0.1:3302"));
      },
      probeGatewayHealth() {
        return Promise.resolve({
          ok: false,
          host: "127.0.0.1",
          port: 18890,
          error: "connect ECONNREFUSED 127.0.0.1:18890",
        });
      },
    });

    assert.equal(result.ok, false);
    assert.equal(result.notificationRouter.status, 0);
    assert.match(result.notificationRouter.error, /ECONNREFUSED/);
    assert.equal(result.gateway.ok, false);
  } finally {
    if (previousApiKey === undefined) {
      delete process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;
    } else {
      process.env.MIRA_OPENCLAW_PROVIDER_API_KEY = previousApiKey;
    }
  }
});

test("checkMiraOpenClawHealth is not healthy when the stack has no usable provider even if the gateway process is reachable", async () => {
  const root = mkdtempSync(join(tmpdir(), "mira-openclaw-live-health-"));
  writeNotificationRouterFixture(root);
  writeMiraFixture(root);

  bootstrapMiraOpenClawRuntime({
    rootDir: root,
    runCommand() {
      return { status: 0, stdout: "", stderr: "" };
    },
  });

  const result = await checkMiraOpenClawHealth({
    rootDir: root,
    openclawBinary: "/opt/homebrew/bin/openclaw",
    checkNotificationRouterHealth() {
      return Promise.resolve({
        status: 200,
        body: { ok: true, service: "notification-router" },
      });
    },
    probeGatewayHealth() {
      return Promise.resolve({
        ok: true,
        host: "127.0.0.1",
        port: 18890,
      });
    },
  });

  assert.equal(result.inspection.issues.some((issue) => issue.includes("provider")), true);
  assert.equal(result.ok, false);
});

test("up/status/down mira-openclaw manage a detached integrated-stack supervisor", async () => {
  const root = mkdtempSync(join(tmpdir(), "mira-openclaw-background-"));
  writeNotificationRouterFixture(root);
  writeMiraFixture(root);

  const previousApiKey = process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;
  process.env.MIRA_OPENCLAW_PROVIDER_API_KEY = "test-key";

  const spawned = [];
  const killed = [];

  try {
    const upResult = await upMiraOpenClawRuntime({
      rootDir: root,
      bootstrapRunCommand() {
        return { status: 0, stdout: "", stderr: "" };
      },
      spawnDetachedProcess(command, args, options) {
        spawned.push({ command, args, options });
        return { pid: 54321 };
      },
      waitForStackHealth() {
        return Promise.resolve({
          ok: true,
          gateway: { ok: true, host: "127.0.0.1", port: 18890 },
          notificationRouter: { status: 200, body: { ok: true } },
        });
      },
    });

    assert.equal(upResult.ok, true);
    assert.equal(upResult.pid, 54321);
    assert.equal(spawned.length, 1);
    assert.equal(spawned[0].command, process.execPath);
    assert.equal(spawned[0].args.at(-1), "start");
    assert.equal(
      spawned[0].options.logPath,
      join(root, ".mira-runtime", "mira-openclaw", "runtime.log"),
    );

    const status = await statusMiraOpenClawRuntime({
      rootDir: root,
      isProcessAlive(pid) {
        return pid === 54321;
      },
      checkStackHealth() {
        return Promise.resolve({
          ok: true,
          gateway: { ok: true, host: "127.0.0.1", port: 18890 },
          notificationRouter: { status: 200, body: { ok: true } },
          inspection: { missing: [], issues: [] },
        });
      },
    });

    assert.equal(status.running, true);
    assert.equal(status.pid, 54321);
    assert.equal(status.health.ok, true);

    const downResult = downMiraOpenClawRuntime({
      rootDir: root,
      isProcessAlive(pid) {
        return pid === 54321;
      },
      stopDetachedProcess(pid) {
        killed.push(pid);
        return true;
      },
    });

    assert.equal(downResult.ok, true);
    assert.deepEqual(killed, [54321]);
  } finally {
    if (previousApiKey === undefined) {
      delete process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;
    } else {
      process.env.MIRA_OPENCLAW_PROVIDER_API_KEY = previousApiKey;
    }
  }
});

test("deployMiraOpenClawRuntime reuses the detached stack supervisor for one-command deploys", async () => {
  const root = mkdtempSync(join(tmpdir(), "mira-openclaw-deploy-"));
  writeNotificationRouterFixture(root);
  writeMiraFixture(root);

  const calls = [];
  const result = await deployMiraOpenClawRuntime({
    rootDir: root,
    openclawBinary: "/opt/homebrew/bin/openclaw",
    upRuntime(options) {
      calls.push(options);
      return Promise.resolve({
        ok: true,
        alreadyRunning: false,
        pid: 6543,
      });
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.pid, 6543);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].rootDir, root);
  assert.equal(calls[0].openclawBinary, "/opt/homebrew/bin/openclaw");
});
