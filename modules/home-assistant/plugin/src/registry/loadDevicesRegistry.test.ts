import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { loadDevicesRegistry } from "./loadDevicesRegistry.ts";

const REGISTRY_URL = new URL("../../../registry/devices.example.json", import.meta.url);

test("loadDevicesRegistry keeps current device examples and exposes 12 ecosystem declarations", async () => {
  const registry = await loadDevicesRegistry(REGISTRY_URL);

  assert.equal(registry.devices.length, 5);
  assert.equal(registry.ecosystems.length, 12);

  const ecosystemIds = registry.ecosystems.map((ecosystem) => ecosystem.id);
  assert.deepEqual(ecosystemIds, [
    "amazon-alexa",
    "apple-home",
    "homekit",
    "xiaomi-mi-home",
    "matter",
    "aqara",
    "tuya-smart-life",
    "switchbot",
    "philips-hue",
    "google-home-nest",
    "lutron",
    "smartthings",
  ]);

  const hue = registry.ecosystems.find((ecosystem) => ecosystem.id === "philips-hue");
  assert.equal(hue?.supportLevel, "ha_first_optional_direct_adapter");
  assert.equal(hue?.runtimePath, "home_assistant");

  const alexa = registry.ecosystems.find((ecosystem) => ecosystem.id === "amazon-alexa");
  assert.equal(alexa?.supportLevel, "readiness_onboarding_only");
  assert.equal(alexa?.runtimePath, "readiness_only");

  const matter = registry.ecosystems.find((ecosystem) => ecosystem.id === "matter");
  assert.equal(matter?.supportLevel, "ha_first");
  assert.equal(matter?.runtimePath, "home_assistant");
});

test("loadDevicesRegistry stays backward-compatible when ecosystem declarations are omitted", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mira-home-registry-"));
  const path = join(dir, "devices.json");

  await writeFile(path, JSON.stringify({
    schemaVersion: "1.0.0",
    registryName: "compat_test",
    devices: [
      {
        id: "compat-device",
        ecosystemId: "compat-home",
        kind: "switch",
      },
    ],
  }, null, 2));

  const registry = await loadDevicesRegistry(path);

  assert.equal(registry.devices.length, 1);
  assert.deepEqual(registry.ecosystems, []);
});
