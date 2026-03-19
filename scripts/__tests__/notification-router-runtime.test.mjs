import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  bootstrapNotificationRouterRuntime,
  dispatchNotificationRouterSelfCheck,
  inspectNotificationRouterRuntime,
  startNotificationRouterRuntime,
} from "../notification-router-runtime.mjs";

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
      "MIRA_NOTIFICATION_ROUTER_OUTBOUND_POLICY_PATH=../../services/notification-router/config/outbound-policy.example.yaml",
      "",
    ].join("\n"),
  );
}

test("bootstrapNotificationRouterRuntime creates a runtime pack, env file, and manifest", () => {
  const root = mkdtempSync(join(tmpdir(), "mira-router-runtime-"));
  writeNotificationRouterFixture(root);

  const calls = [];
  const result = bootstrapNotificationRouterRuntime({
    rootDir: root,
    runCommand(command, args, options) {
      calls.push({ command, args, options });
      return { status: 0, stdout: "", stderr: "" };
    },
  });

  assert.equal(existsSync(join(result.runtimeDir, "src", "server.ts")), true);
  assert.equal(existsSync(join(result.runtimeDir, ".env.local")), true);
  assert.equal(existsSync(result.manifestPath), true);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    command: "npm",
    args: ["install", "--no-fund", "--no-audit"],
    options: {
      cwd: result.runtimeDir,
      stdio: "inherit",
    },
  });

  const manifest = JSON.parse(readFileSync(result.manifestPath, "utf8"));
  assert.equal(manifest.kind, "notification-router-runtime-pack");
  assert.equal(manifest.runtimeDir, result.runtimeDir);
  assert.equal(manifest.envFilePath, join(result.runtimeDir, ".env.local"));
  assert.equal(manifest.defaultPort, 3302);
});

test("inspectNotificationRouterRuntime reports placeholder channel configuration as warnings", () => {
  const root = mkdtempSync(join(tmpdir(), "mira-router-inspect-"));
  writeNotificationRouterFixture(root);

  const result = bootstrapNotificationRouterRuntime({
    rootDir: root,
    runCommand() {
      return { status: 0, stdout: "", stderr: "" };
    },
  });

  const inspection = inspectNotificationRouterRuntime({ rootDir: root });
  assert.equal(inspection.runtimeDir, result.runtimeDir);
  assert.equal(inspection.ok, true);
  assert.equal(inspection.warnings.length, 0);
  assert.equal(inspection.missing.length, 0);
});

test("startNotificationRouterRuntime prefers the runtime-pack outbound policy path over the template default", () => {
  const root = mkdtempSync(join(tmpdir(), "mira-router-start-"));
  writeNotificationRouterFixture(root);

  const calls = [];
  startNotificationRouterRuntime({
    rootDir: root,
    runCommand(command, args, options) {
      calls.push({ command, args, options });
      return { status: 0, stdout: "", stderr: "" };
    },
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[1].command, "npm");
  assert.deepEqual(calls[1].args, ["run", "start"]);
  assert.equal(
    calls[1].options.env.MIRA_NOTIFICATION_ROUTER_OUTBOUND_POLICY_PATH,
    join(root, ".mira-runtime", "notification-router", "config", "outbound-policy.example.yaml"),
  );
});

test("bootstrapNotificationRouterRuntime rewrites placeholder DM env values to a local loopback default", () => {
  const root = mkdtempSync(join(tmpdir(), "mira-router-loopback-env-"));
  writeNotificationRouterFixture(root);

  const result = bootstrapNotificationRouterRuntime({
    rootDir: root,
    runCommand() {
      return { status: 0, stdout: "", stderr: "" };
    },
  });

  const envText = readFileSync(join(result.runtimeDir, ".env.local"), "utf8");
  assert.match(envText, /MIRA_NOTIFICATION_ROUTER_OPENCLAW_DM_WEBHOOK_URL=http:\/\/127\.0\.0\.1:\$PORT\/__local__\/dm/u);
  assert.match(envText, /MIRA_NOTIFICATION_ROUTER_OPENCLAW_DM_WEBHOOK_SECRET=mira-local-loopback/u);
});
