# Home Ecosystem Wave 2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Mira's release-side `Home Assistant` module so it formally covers 12 named smart-home entries through support docs, registry/config metadata, and declaration-layer tests only.

**Architecture:** Keep one `Home Assistant` flagship module. Add a typed ecosystem declaration layer alongside the existing example devices, then wire the same 12-entry shape through release docs and the example config. Do not add direct-runtime packages or new deploy/runtime entrypoints.

**Tech Stack:** Node.js ESM, built-in `node:test`, JSON example manifests, TypeScript source with Node type stripping.

---

## Chunk 1: Regression Coverage

### Task 1: Add a failing loader test for ecosystem metadata

**Files:**
- Create: `modules/home-assistant/plugin/src/registry/loadDevicesRegistry.test.ts`
- Modify: `modules/home-assistant/plugin/package.json`

- [ ] **Step 1: Write the failing test**

Add a TypeScript node test that:
- loads `modules/home-assistant/registry/devices.example.json`
- asserts `registry.devices.length` still reflects the current example devices
- asserts a new `registry.ecosystems` collection exists and contains 12 named entries
- asserts support-level and runtime-path values for at least one HA-first entry, one optional-direct entry, and the Alexa readiness-only entry

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --experimental-strip-types --test modules/home-assistant/plugin/src/registry/loadDevicesRegistry.test.ts`

Expected: FAIL because `loadDevicesRegistry.ts` does not yet expose ecosystem metadata.

- [ ] **Step 3: Update the module test script for repeatability**

Replace the placeholder `test` script in `modules/home-assistant/plugin/package.json` with:

```json
"test": "node --experimental-strip-types --test src/**/*.test.ts"
```

Do not run it green yet; keep the chunk red until implementation lands.

### Task 2: Add a failing repo-consistency test for 12-entry coverage

**Files:**
- Create: `scripts/__tests__/home-ecosystem-wave2.test.mjs`

- [ ] **Step 1: Write the failing test**

Add a root test that verifies:
- the support matrix file exists
- the ecosystem docs directory contains one doc for each of the 12 entries
- the registry example contains 12 top-level ecosystem declarations
- the config example contains 12 corresponding ecosystem slots
- the support levels used in registry/config stay within the three allowed Wave 2 levels

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/__tests__/home-ecosystem-wave2.test.mjs`

Expected: FAIL because the support matrix, ecosystem docs, and matching 12-entry registry/config metadata do not exist yet.

## Chunk 2: Wave 2 Declaration Layer

### Task 3: Extend the registry schema and loader

**Files:**
- Modify: `modules/home-assistant/registry/devices.example.json`
- Modify: `modules/home-assistant/plugin/src/registry/loadDevicesRegistry.ts`

- [ ] **Step 1: Add 12 top-level ecosystem declarations to the registry example**

Add an `ecosystems` array to `devices.example.json` with these ids:
- `amazon-alexa`
- `apple-home`
- `homekit`
- `xiaomi-mi-home`
- `matter`
- `aqara`
- `tuya-smart-life`
- `switchbot`
- `philips-hue`
- `google-home-nest`
- `lutron`
- `smartthings`

Each entry should include:
- `id`
- `displayName`
- `supportLevel`
- `runtimePath`
- `directAdapter`
- `operatorPrerequisites`
- `currentStatus`
- optional `notes`

Keep the existing `devices` array and current device examples intact.

- [ ] **Step 2: Extend the loader types**

Update `loadDevicesRegistry.ts` so `DevicesRegistry` includes an `ecosystems` array with a dedicated type, for example `LoadedEcosystem`.

Support:
- missing `ecosystems` by defaulting to `[]`
- unchanged `devices` loading behavior

- [ ] **Step 3: Run the focused loader test**

Run: `node --experimental-strip-types --test modules/home-assistant/plugin/src/registry/loadDevicesRegistry.test.ts`

Expected: PASS

### Task 4: Add matching config slots for the 12 entries

**Files:**
- Modify: `modules/home-assistant/config/home-assistant-module.example.json`

- [ ] **Step 1: Add a release-side `ecosystems` section**

Add one config slot per ecosystem id under the Home Assistant module example.

Each slot should mirror the declaration layer with:
- `supportLevel`
- `runtimePath`
- `directAdapter`
- `operatorPrerequisites`
- `notes`

Keep all values release-safe and example-only. Do not add live secrets or runtime promises.

- [ ] **Step 2: Re-run the repo-consistency test**

Run: `node --test scripts/__tests__/home-ecosystem-wave2.test.mjs`

Expected: still FAIL because the support matrix and ecosystem docs are not complete yet.

### Task 5: Add the support matrix and 12 ecosystem docs

**Files:**
- Create: `modules/home-assistant/docs/home-ecosystem-support-matrix.md`
- Create: `modules/home-assistant/docs/ecosystems/amazon-alexa.md`
- Create: `modules/home-assistant/docs/ecosystems/apple-home.md`
- Create: `modules/home-assistant/docs/ecosystems/homekit.md`
- Create: `modules/home-assistant/docs/ecosystems/xiaomi-mi-home.md`
- Create: `modules/home-assistant/docs/ecosystems/matter.md`
- Create: `modules/home-assistant/docs/ecosystems/aqara.md`
- Create: `modules/home-assistant/docs/ecosystems/tuya-smart-life.md`
- Create: `modules/home-assistant/docs/ecosystems/switchbot.md`
- Create: `modules/home-assistant/docs/ecosystems/philips-hue.md`
- Create: `modules/home-assistant/docs/ecosystems/google-home-nest.md`
- Create: `modules/home-assistant/docs/ecosystems/lutron.md`
- Create: `modules/home-assistant/docs/ecosystems/smartthings.md`

- [ ] **Step 1: Write the support matrix**

Add a matrix that covers all 12 entries and includes:
- support level
- runtime path
- whether a direct adapter is needed, optional, or absent in Wave 2
- operator prerequisites
- current implementation status

- [ ] **Step 2: Write one ecosystem doc per entry**

Each ecosystem doc should state:
- the entry name and id
- support level
- default runtime path
- direct-adapter status in this repo
- operator prerequisites
- current status in Wave 2

Keep the wording explicit that this wave is declaration-only for most entries.

- [ ] **Step 3: Re-run the repo-consistency test**

Run: `node --test scripts/__tests__/home-ecosystem-wave2.test.mjs`

Expected: PASS

### Task 6: Update release-side module discovery docs

**Files:**
- Modify: `modules/home-assistant/README.md`
- Modify: `modules/home-assistant/docs/README.md`
- Modify: `modules/home-assistant/config/README.md`
- Modify: `modules/home-assistant/registry/README.md`

- [ ] **Step 1: Add links to the new support material**

Update the existing release-side READMEs so the new support matrix, ecosystem docs, registry metadata, and config slots are discoverable from current entrypoints.

- [ ] **Step 2: Keep scope language explicit**

State that:
- this is still one formal Home Assistant module
- 12 named entries are now formally declared
- Wave 2 does not mean 12 live direct-runtime implementations

## Chunk 3: Verification

### Task 7: Run focused declaration-layer tests

**Files:**
- Test: `modules/home-assistant/plugin/src/registry/loadDevicesRegistry.test.ts`
- Test: `scripts/__tests__/home-ecosystem-wave2.test.mjs`

- [ ] **Step 1: Run the plugin loader test**

Run: `node --experimental-strip-types --test modules/home-assistant/plugin/src/registry/loadDevicesRegistry.test.ts`

Expected: PASS

- [ ] **Step 2: Run the repo consistency test**

Run: `node --test scripts/__tests__/home-ecosystem-wave2.test.mjs`

Expected: PASS

### Task 8: Run release verification

**Files:**
- Verify only

- [ ] **Step 1: Run release checks**

Run: `npm run verify:release`

Expected: PASS

- [ ] **Step 2: Run release tests**

Run: `npm run test:release`

Expected: PASS

### Task 9: Confirm Wave 2 boundaries held

**Files:**
- Verify only

- [ ] **Step 1: Re-read the spec and check the final diff**

Confirm the final changes:
- keep one formal Home Assistant module
- add 12 named entries at the declaration layer
- add no new direct-runtime packages
- change no deploy/runtime entrypoints

- [ ] **Step 2: Summarize any remaining Wave 3 follow-up work separately**

If future direct-adapter work is obvious, list it as follow-up only. Do not include it in this implementation.
