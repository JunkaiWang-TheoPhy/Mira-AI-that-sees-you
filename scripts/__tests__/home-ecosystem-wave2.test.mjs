import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

const expectedEntries = [
  { id: "amazon-alexa", displayName: "Amazon Alexa", doc: "amazon-alexa.md" },
  { id: "apple-home", displayName: "Apple Home", doc: "apple-home.md" },
  { id: "homekit", displayName: "HomeKit", doc: "homekit.md" },
  { id: "xiaomi-mi-home", displayName: "Xiaomi / Mi Home", doc: "xiaomi-mi-home.md" },
  { id: "matter", displayName: "Matter", doc: "matter.md" },
  { id: "aqara", displayName: "Aqara", doc: "aqara.md" },
  { id: "tuya-smart-life", displayName: "Tuya / Smart Life", doc: "tuya-smart-life.md" },
  { id: "switchbot", displayName: "SwitchBot", doc: "switchbot.md" },
  { id: "philips-hue", displayName: "Philips Hue", doc: "philips-hue.md" },
  { id: "google-home-nest", displayName: "Google Home / Nest", doc: "google-home-nest.md" },
  { id: "lutron", displayName: "Lutron", doc: "lutron.md" },
  { id: "smartthings", displayName: "SmartThings", doc: "smartthings.md" },
];

const allowedSupportLevels = new Set([
  "ha_first",
  "ha_first_optional_direct_adapter",
  "readiness_onboarding_only",
]);

test("Wave 2 support artifacts cover all 12 named home ecosystem entries", () => {
  const supportMatrixPath = join(
    repoRoot,
    "modules",
    "home-assistant",
    "docs",
    "home-ecosystem-support-matrix.md",
  );
  assert.equal(existsSync(supportMatrixPath), true);

  const registryPath = join(
    repoRoot,
    "modules",
    "home-assistant",
    "registry",
    "devices.example.json",
  );
  const configPath = join(
    repoRoot,
    "modules",
    "home-assistant",
    "config",
    "home-assistant-module.example.json",
  );

  const registry = JSON.parse(readFileSync(registryPath, "utf8"));
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const supportMatrix = readFileSync(supportMatrixPath, "utf8");

  assert.equal(registry.ecosystems.length, 12);

  const registryIds = registry.ecosystems.map((ecosystem) => ecosystem.id);
  assert.deepEqual(registryIds, expectedEntries.map((entry) => entry.id));

  const configSlots = config.homeAssistant.ecosystems;
  assert.deepEqual(Object.keys(configSlots), expectedEntries.map((entry) => entry.id));

  for (const ecosystem of registry.ecosystems) {
    assert.equal(allowedSupportLevels.has(ecosystem.supportLevel), true);
  }

  for (const ecosystem of Object.values(configSlots)) {
    assert.equal(allowedSupportLevels.has(ecosystem.supportLevel), true);
  }

  for (const entry of expectedEntries) {
    const docPath = join(
      repoRoot,
      "modules",
      "home-assistant",
      "docs",
      "ecosystems",
      entry.doc,
    );

    assert.equal(existsSync(docPath), true, `${entry.doc} should exist`);

    const doc = readFileSync(docPath, "utf8");
    assert.match(doc, new RegExp(entry.displayName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(doc, new RegExp(entry.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(supportMatrix, new RegExp(entry.displayName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
