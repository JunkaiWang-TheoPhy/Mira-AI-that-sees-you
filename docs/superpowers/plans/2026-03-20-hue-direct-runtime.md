# Hue Direct Runtime Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the minimum live Philips Hue runtime into the release-side direct-adapter package while keeping Hue optional and module-scoped.

**Architecture:** Reuse the proven prototype split between a bridge client and a plugin entrypoint, but keep it contained under `modules/home-assistant/direct-adapters/hue/`. Update the existing shell and docs so the package now describes a real runtime extension without changing the repo's default Home Assistant-first behavior.

**Tech Stack:** Node.js ESM, built-in `node:test`, TypeScript with Node type stripping, JSON plugin metadata, Markdown operator docs.

---

## Chunk 1: Regression Coverage

### Task 1: Turn the Hue boundary test red for runtime expectations

**Files:**
- Modify: `scripts/__tests__/home-ecosystem-hue-boundary.test.mjs`

- [ ] **Step 1: Update the boundary test**

Change the test so it now expects:
- `src/index.ts` exists
- `src/client.ts` exists
- `package.json` includes `openclaw.extensions = ["./src/index.ts"]`
- Hue docs and operator docs describe a migrated optional runtime rather than a shell-only boundary

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/__tests__/home-ecosystem-hue-boundary.test.mjs`

Expected: FAIL because the runtime files and active extension metadata do not exist yet.

### Task 2: Add package-local runtime tests

**Files:**
- Modify: `modules/home-assistant/direct-adapters/hue/package.json`
- Create: `modules/home-assistant/direct-adapters/hue/src/hue.test.ts`

- [ ] **Step 1: Add the package test script**

Replace the placeholder script with:

```json
"test": "node --experimental-strip-types --test src/**/*.test.ts"
```

- [ ] **Step 2: Add the failing runtime test file**

Cover:
- `normalizeHueBaseUrl`
- `extractHueResources`
- `HueBridgeClient` request shaping
- `register()` tool exposure

- [ ] **Step 3: Run the test to verify it fails**

Run: `node --experimental-strip-types --test modules/home-assistant/direct-adapters/hue/src/hue.test.ts`

Expected: FAIL because `src/client.ts` and `src/index.ts` do not exist yet.

## Chunk 2: Hue Runtime Migration

### Task 3: Migrate the Hue bridge client

**Files:**
- Create: `modules/home-assistant/direct-adapters/hue/src/client.ts`

- [ ] **Step 1: Add the minimum client surface**

Implement:
- `HueConfig`
- `normalizeHueBaseUrl`
- `extractHueResources`
- `HueLightControl`
- `HueBridgeClient`

- [ ] **Step 2: Run the package-local test**

Run: `node --experimental-strip-types --test modules/home-assistant/direct-adapters/hue/src/hue.test.ts`

Expected: still FAIL because `index.ts` is not present yet.

### Task 4: Migrate the Hue plugin entrypoint

**Files:**
- Create: `modules/home-assistant/direct-adapters/hue/src/index.ts`
- Modify: `modules/home-assistant/direct-adapters/hue/package.json`
- Modify: `modules/home-assistant/direct-adapters/hue/openclaw.plugin.json`

- [ ] **Step 1: Add the runtime entrypoint**

Implement the Hue tool-registration layer with:
- `hue_status`
- `hue_list_lights`
- `hue_list_scenes`
- `hue_control_light`
- `hue_activate_scene`

- [ ] **Step 2: Activate package extension metadata**

Add:

```json
"openclaw": {
  "extensions": ["./src/index.ts"]
}
```

to `package.json`.

- [ ] **Step 3: Run the package-local test**

Run: `node --experimental-strip-types --test modules/home-assistant/direct-adapters/hue/src/hue.test.ts`

Expected: PASS

### Task 5: Update release docs and metadata

**Files:**
- Modify: `modules/home-assistant/direct-adapters/hue/README.md`
- Modify: `modules/home-assistant/direct-adapters/hue/src/README.md`
- Modify: `modules/home-assistant/docs/ecosystems/philips-hue.md`
- Modify: `modules/home-assistant/docs/home-ecosystem-support-matrix.md`
- Modify: `modules/home-assistant/config/home-assistant-module.example.json`
- Modify: `modules/home-assistant/registry/devices.example.json`
- Modify: `deploy/module-home-assistant/hue-direct-adapter.md`

- [ ] **Step 1: Update the Hue package docs**

Describe the current state as:
- release-side runtime migrated
- optional direct-adapter path
- not yet default-routed or auto-installed

- [ ] **Step 2: Update ecosystem/config/registry notes**

Remove stale wording that says live runtime is absent.

- [ ] **Step 3: Run the root Hue boundary test**

Run: `node --test scripts/__tests__/home-ecosystem-hue-boundary.test.mjs`

Expected: PASS

## Chunk 3: Verification

### Task 6: Run focused Hue checks

**Files:**
- Test: `modules/home-assistant/direct-adapters/hue/src/hue.test.ts`
- Test: `scripts/__tests__/home-ecosystem-hue-boundary.test.mjs`

- [ ] **Step 1: Run package-local Hue tests**

Run: `node --experimental-strip-types --test modules/home-assistant/direct-adapters/hue/src/hue.test.ts`

Expected: PASS

- [ ] **Step 2: Run root Hue boundary verification**

Run: `node --test scripts/__tests__/home-ecosystem-hue-boundary.test.mjs`

Expected: PASS

### Task 7: Re-run release verification

**Files:**
- Verify only

- [ ] **Step 1: Run release checks**

Run: `npm run verify:release`

Expected: PASS

- [ ] **Step 2: Run release tests**

Run: `npm run test:release`

Expected: PASS

### Task 8: Confirm routing scope stayed constrained

**Files:**
- Verify only

- [ ] **Step 1: Inspect the final diff**

Confirm:
- only Hue changed
- no bootstrap or deploy runtime wiring changed
- Home Assistant remains the default execution path

- [ ] **Step 2: Record follow-up work separately**

Any future routing or install wiring should be listed as later work, not included in this implementation.
