import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("Hue direct-adapter boundary exists as a release-side runtime package", () => {
  const directAdaptersReadme = join(
    repoRoot,
    "modules",
    "home-assistant",
    "direct-adapters",
    "README.md",
  );
  const hueReadme = join(
    repoRoot,
    "modules",
    "home-assistant",
    "direct-adapters",
    "hue",
    "README.md",
  );
  const huePackagePath = join(
    repoRoot,
    "modules",
    "home-assistant",
    "direct-adapters",
    "hue",
    "package.json",
  );
  const huePluginPath = join(
    repoRoot,
    "modules",
    "home-assistant",
    "direct-adapters",
    "hue",
    "openclaw.plugin.json",
  );
  const hueSourceReadme = join(
    repoRoot,
    "modules",
    "home-assistant",
    "direct-adapters",
    "hue",
    "src",
    "README.md",
  );
  const operatorDoc = join(
    repoRoot,
    "deploy",
    "module-home-assistant",
    "hue-direct-adapter.md",
  );
  const hueRuntimeIndex = join(
    repoRoot,
    "modules",
    "home-assistant",
    "direct-adapters",
    "hue",
    "src",
    "index.ts",
  );
  const hueRuntimeClient = join(
    repoRoot,
    "modules",
    "home-assistant",
    "direct-adapters",
    "hue",
    "src",
    "client.ts",
  );

  assert.equal(existsSync(directAdaptersReadme), true);
  assert.equal(existsSync(hueReadme), true);
  assert.equal(existsSync(huePackagePath), true);
  assert.equal(existsSync(huePluginPath), true);
  assert.equal(existsSync(hueSourceReadme), true);
  assert.equal(existsSync(operatorDoc), true);
  assert.equal(existsSync(hueRuntimeIndex), true);
  assert.equal(existsSync(hueRuntimeClient), true);

  const huePackage = JSON.parse(readFileSync(huePackagePath, "utf8"));
  assert.equal(huePackage.name, "@mira-release/hue");
  assert.equal(huePackage.license, "AGPL-3.0-only");
  assert.deepEqual(huePackage.openclaw?.extensions, ["./src/index.ts"]);

  const huePlugin = JSON.parse(readFileSync(huePluginPath, "utf8"));
  assert.equal(huePlugin.id, "hue");
  assert.equal(huePlugin.configSchema.required.includes("baseUrl"), true);
  assert.equal(huePlugin.configSchema.required.includes("applicationKey"), true);

  const hueDoc = readFileSync(
    join(repoRoot, "modules", "home-assistant", "docs", "ecosystems", "philips-hue.md"),
    "utf8",
  );
  const supportMatrix = readFileSync(
    join(repoRoot, "modules", "home-assistant", "docs", "home-ecosystem-support-matrix.md"),
    "utf8",
  );
  const deployReadme = readFileSync(
    join(repoRoot, "deploy", "module-home-assistant", "README.md"),
    "utf8",
  );

  assert.match(hueDoc, /runtime/i);
  assert.match(supportMatrix, /runtime/i);
  assert.match(deployReadme, new RegExp(escapeRegExp("hue-direct-adapter.md")));
});
