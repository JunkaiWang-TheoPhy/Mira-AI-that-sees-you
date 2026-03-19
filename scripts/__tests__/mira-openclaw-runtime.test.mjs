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
  assert.match(inspection.issues.join("\n"), /API key/);
  assert.equal(
    inspection.resolvedStartCommand,
    "/opt/homebrew/bin/openclaw gateway run --allow-unconfigured --port 18890",
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
    "/opt/homebrew/bin/openclaw gateway run --allow-unconfigured --port 18890",
  );
  assert.ok(!inspection.issues.some((issue) => issue.includes("OPENCLAW_START_COMMAND")));
});

test("doctorMiraOpenClawRuntime validates the generated config through openclaw", () => {
  const root = mkdtempSync(join(tmpdir(), "mira-openclaw-doctor-"));
  writeNotificationRouterFixture(root);
  writeMiraFixture(root);

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

  assert.equal(result.ok, false);
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

test("checkMiraOpenClawHealth treats a live stack as healthy even if the current shell lacks the startup API key", async () => {
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

  assert.equal(result.inspection.issues.some((issue) => issue.includes("API key")), true);
  assert.equal(result.ok, true);
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
