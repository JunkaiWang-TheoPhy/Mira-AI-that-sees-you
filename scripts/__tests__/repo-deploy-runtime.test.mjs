import assert from "node:assert/strict";
import test from "node:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  bootstrapRepoRuntime,
  buildRepoDeployManifest,
  checkRepoHealth,
  deployRepoRuntime,
  downRepoRuntime,
  loadRepoRuntimeEnv,
  selfCheckRepoRuntime,
  startRepoRuntime,
  statusRepoRuntime,
} from "../repo-deploy-runtime.mjs";

test("buildRepoDeployManifest describes the repo default entrypoint and both deploy profiles", () => {
  const root = mkdtempSync(join(tmpdir(), "mira-repo-deploy-manifest-"));
  const manifest = buildRepoDeployManifest(root);

  assert.equal(manifest.kind, "mira-release-repo-deploy");
  assert.equal(manifest.defaultProfile, "mira-openclaw");
  assert.equal(manifest.profileSelectorEnv, "MIRA_DEPLOY_PROFILE");
  assert.equal(manifest.defaultCommands.deploy, "npm run deploy");
  assert.equal(manifest.defaultCommands.start, "npm start");
  assert.equal(manifest.repoEnvTemplatePath, "deploy/repo.env.example");
  assert.equal(manifest.repoEnvFilePath, ".env.local");
  assert.equal(
    manifest.profiles["notification-router"].commands.deploy,
    "npm run deploy:notification-router",
  );
  assert.equal(
    manifest.profiles["notification-router"].commands.start,
    "npm run start:notification-router",
  );
  assert.equal(
    manifest.profiles["mira-openclaw"].commands.deploy,
    "npm run deploy:mira-openclaw",
  );
  assert.equal(
    manifest.profiles["mira-openclaw"].commands.start,
    "npm run start:mira-openclaw",
  );
  assert.equal(
    manifest.profiles["mira-openclaw"].requiredEnv.includes("MIRA_OPENCLAW_PROVIDER_API_KEY"),
    true,
  );
});

test("bootstrapRepoRuntime copies the root repo env template into .env.local when missing", async () => {
  const root = mkdtempSync(join(tmpdir(), "mira-repo-bootstrap-"));
  mkdirSync(join(root, "deploy"), { recursive: true });
  writeFileSync(
    join(root, "deploy", "repo.env.example"),
    [
      "MIRA_DEPLOY_PROFILE=mira-openclaw",
      "MIRA_OPENCLAW_PROVIDER_API_KEY=replace-me",
      "",
    ].join("\n"),
  );

  const result = await bootstrapRepoRuntime({
    rootDir: root,
    bootstrapRuntime() {
      return {
        runtimeDir: join(root, ".mira-runtime", "mira-openclaw"),
      };
    },
  });

  assert.equal(result.profile, "mira-openclaw");
  assert.equal(
    loadRepoRuntimeEnv(root).MIRA_DEPLOY_PROFILE,
    "mira-openclaw",
  );
});

test("loadRepoRuntimeEnv merges root .env and .env.local with .env.local taking precedence", () => {
  const root = mkdtempSync(join(tmpdir(), "mira-repo-env-"));
  writeFileSync(
    join(root, ".env"),
    [
      "MIRA_OPENCLAW_PROVIDER_API_KEY=from-dot-env",
      "MIRA_OPENCLAW_GATEWAY_PORT=19999",
      "",
    ].join("\n"),
  );
  writeFileSync(
    join(root, ".env.local"),
    [
      "MIRA_OPENCLAW_PROVIDER_API_KEY=from-dot-env-local",
      "",
    ].join("\n"),
  );

  const env = loadRepoRuntimeEnv(root);
  assert.equal(env.MIRA_OPENCLAW_PROVIDER_API_KEY, "from-dot-env-local");
  assert.equal(env.MIRA_OPENCLAW_GATEWAY_PORT, "19999");
});

test("deployRepoRuntime delegates to the default mira-openclaw deploy runtime", async () => {
  const root = mkdtempSync(join(tmpdir(), "mira-repo-deploy-"));
  writeFileSync(
    join(root, ".env.local"),
    [
      "MIRA_OPENCLAW_PROVIDER_API_KEY=from-root-env-file",
      "",
    ].join("\n"),
  );
  const calls = [];
  const previousApiKey = process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;

  try {
    delete process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;
    const result = await deployRepoRuntime({
      rootDir: root,
      deployRuntime(options) {
        calls.push({
          ...options,
          providerApiKey: process.env.MIRA_OPENCLAW_PROVIDER_API_KEY,
        });
        return Promise.resolve({
          ok: true,
          pid: 12345,
        });
      },
    });

    assert.equal(result.ok, true);
    assert.equal(result.pid, 12345);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].rootDir, root);
    assert.equal(calls[0].providerApiKey, "from-root-env-file");
    assert.equal(
      process.env.MIRA_OPENCLAW_PROVIDER_API_KEY,
      undefined,
    );
  } finally {
    if (previousApiKey === undefined) {
      delete process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;
    } else {
      process.env.MIRA_OPENCLAW_PROVIDER_API_KEY = previousApiKey;
    }
  }
});

test("deployRepoRuntime respects MIRA_DEPLOY_PROFILE=notification-router from the root env file", async () => {
  const root = mkdtempSync(join(tmpdir(), "mira-repo-router-profile-"));
  writeFileSync(
    join(root, ".env.local"),
    [
      "MIRA_DEPLOY_PROFILE=notification-router",
      "",
    ].join("\n"),
  );

  const calls = [];
  const result = await deployRepoRuntime({
    rootDir: root,
    deployRuntime() {
      throw new Error("mira-openclaw deploy path should not be used");
    },
    deployNotificationRouter(options) {
      calls.push(options);
      return Promise.resolve({
        ok: true,
        pid: 24680,
      });
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.pid, 24680);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].rootDir, root);
});

test("startRepoRuntime delegates to the default mira-openclaw foreground runtime", async () => {
  const root = mkdtempSync(join(tmpdir(), "mira-repo-start-"));
  writeFileSync(
    join(root, ".env.local"),
    [
      "MIRA_OPENCLAW_PROVIDER_API_KEY=from-root-env-file",
      "",
    ].join("\n"),
  );

  const calls = [];
  const previousApiKey = process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;

  try {
    delete process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;
    const result = await startRepoRuntime({
      rootDir: root,
      startRuntime(options) {
        calls.push({
          ...options,
          providerApiKey: process.env.MIRA_OPENCLAW_PROVIDER_API_KEY,
        });
        return Promise.resolve({
          runtimeDir: join(root, ".mira-runtime", "mira-openclaw"),
        });
      },
    });

    assert.equal(result.profile, "mira-openclaw");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].rootDir, root);
    assert.equal(calls[0].providerApiKey, "from-root-env-file");
  } finally {
    if (previousApiKey === undefined) {
      delete process.env.MIRA_OPENCLAW_PROVIDER_API_KEY;
    } else {
      process.env.MIRA_OPENCLAW_PROVIDER_API_KEY = previousApiKey;
    }
  }
});

test("startRepoRuntime respects MIRA_DEPLOY_PROFILE=notification-router from the root env file", async () => {
  const root = mkdtempSync(join(tmpdir(), "mira-repo-router-start-"));
  writeFileSync(
    join(root, ".env.local"),
    [
      "MIRA_DEPLOY_PROFILE=notification-router",
      "",
    ].join("\n"),
  );

  const calls = [];
  const result = await startRepoRuntime({
    rootDir: root,
    startRuntime() {
      throw new Error("mira-openclaw start path should not be used");
    },
    startNotificationRouter(options) {
      calls.push(options);
      return {
        runtimeDir: join(root, ".mira-runtime", "notification-router"),
      };
    },
  });

  assert.equal(result.profile, "notification-router");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].rootDir, root);
});

test("statusRepoRuntime reports both the default stack and standalone router status", async () => {
  const root = mkdtempSync(join(tmpdir(), "mira-repo-status-"));

  const result = await statusRepoRuntime({
    rootDir: root,
    statusRuntime() {
      return Promise.resolve({
        running: true,
        pid: 22222,
        health: { ok: true },
      });
    },
    statusNotificationRouter() {
      return Promise.resolve({
        running: false,
        pid: null,
        health: null,
      });
    },
  });

  assert.equal(result.profile, "mira-openclaw");
  assert.equal(result.running, true);
  assert.equal(result.pid, 22222);
  assert.equal(result.health.ok, true);
  assert.equal(result.notificationRouter.running, false);
});

test("checkRepoHealth wraps the notification-router profile result into an ok-bearing payload", async () => {
  const root = mkdtempSync(join(tmpdir(), "mira-repo-router-health-"));
  writeFileSync(
    join(root, ".env.local"),
    [
      "MIRA_DEPLOY_PROFILE=notification-router",
      "",
    ].join("\n"),
  );

  const result = await checkRepoHealth({
    rootDir: root,
    checkRuntime() {
      throw new Error("mira-openclaw health should not be used");
    },
    checkNotificationRouter() {
      return Promise.resolve({
        status: 200,
        body: { ok: true, service: "notification-router" },
      });
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.profile, "notification-router");
  assert.equal(result.status, 200);
});

test("selfCheckRepoRuntime wraps the notification-router profile result into an ok-bearing payload", async () => {
  const root = mkdtempSync(join(tmpdir(), "mira-repo-router-self-check-"));
  writeFileSync(
    join(root, ".env.local"),
    [
      "MIRA_DEPLOY_PROFILE=notification-router",
      "",
    ].join("\n"),
  );

  const result = await selfCheckRepoRuntime({
    rootDir: root,
    selfCheckRuntime() {
      throw new Error("mira-openclaw self-check should not be used");
    },
    dispatchRouterSelfCheck() {
      return Promise.resolve({
        status: 200,
        body: { ok: true, delivery: { ok: true } },
      });
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.profile, "notification-router");
  assert.equal(result.status, 200);
});

test("downRepoRuntime stops the default stack and then cleans up the standalone router runtime", () => {
  const root = mkdtempSync(join(tmpdir(), "mira-repo-down-"));
  const calls = [];

  const result = downRepoRuntime({
    rootDir: root,
    downRuntime(options) {
      calls.push({ kind: "mira-openclaw", options });
      return {
        ok: true,
        stopped: true,
      };
    },
    downNotificationRouter(options) {
      calls.push({ kind: "notification-router", options });
      return {
        ok: true,
        stopped: false,
      };
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.miraOpenClaw.stopped, true);
  assert.equal(result.notificationRouter.stopped, false);
  assert.deepEqual(calls.map((call) => call.kind), [
    "mira-openclaw",
    "notification-router",
  ]);
});
