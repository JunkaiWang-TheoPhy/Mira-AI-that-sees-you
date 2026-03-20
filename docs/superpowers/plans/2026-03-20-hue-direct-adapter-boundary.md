# Hue Direct-Adapter Boundary Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a release-side Philips Hue direct-adapter boundary package shell, source-boundary docs, and operator docs without migrating live Hue runtime code.

**Architecture:** Keep the Hue boundary under `modules/home-assistant/direct-adapters/hue/` so it remains module-scoped and optional. Represent the package through docs and metadata only, then update the existing Wave 2 Hue support declarations to point to this concrete boundary shell.

**Tech Stack:** Node.js ESM, built-in `node:test`, JSON package/plugin metadata, Markdown release docs.

---

## Chunk 1: Regression Coverage

### Task 1: Add a failing boundary test

**Files:**
- Create: `scripts/__tests__/home-ecosystem-hue-boundary.test.mjs`

- [ ] **Step 1: Write the failing test**

Add a test that verifies:
- `modules/home-assistant/direct-adapters/README.md` exists
- `modules/home-assistant/direct-adapters/hue/README.md` exists
- `modules/home-assistant/direct-adapters/hue/package.json` exists
- `modules/home-assistant/direct-adapters/hue/openclaw.plugin.json` exists
- `modules/home-assistant/direct-adapters/hue/src/README.md` exists
- `deploy/module-home-assistant/hue-direct-adapter.md` exists
- Hue docs and support matrix mention the new boundary shell
- live runtime files `src/index.ts` and `src/client.ts` are still absent

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/__tests__/home-ecosystem-hue-boundary.test.mjs`

Expected: FAIL because the Hue boundary files do not exist yet.

## Chunk 2: Release-Side Hue Boundary

### Task 2: Create the module-local direct-adapter subtree

**Files:**
- Create: `modules/home-assistant/direct-adapters/README.md`
- Create: `modules/home-assistant/direct-adapters/hue/README.md`
- Create: `modules/home-assistant/direct-adapters/hue/src/README.md`

- [ ] **Step 1: Create the direct-adapters entrypoint**

Document that this subtree holds module-scoped optional direct-adapter boundaries rather than core plugins.

- [ ] **Step 2: Create the Hue package README and source-boundary README**

The Hue README should describe the package shell and its non-goals.

The source README should list what the boundary owns later, and what is still intentionally excluded in this wave.

### Task 3: Create the Hue package shell metadata

**Files:**
- Create: `modules/home-assistant/direct-adapters/hue/package.json`
- Create: `modules/home-assistant/direct-adapters/hue/openclaw.plugin.json`

- [ ] **Step 1: Add package metadata**

Use an `@mira-release/` package name, AGPL licensing, and a description that clearly says this is a release-side boundary shell.

- [ ] **Step 2: Add plugin metadata**

Capture the Hue config shape:
- `baseUrl`
- `applicationKey`
- `bridgeId`
- `defaultTransitionMs`

Do not reference a migrated runtime extension yet.

### Task 4: Add operator-facing Hue docs

**Files:**
- Create: `deploy/module-home-assistant/hue-direct-adapter.md`
- Modify: `deploy/module-home-assistant/README.md`

- [ ] **Step 1: Add the Hue operator guide**

Document:
- when to keep Home Assistant as the default path
- what the Hue boundary shell contains
- what it does not contain yet
- what later waves would need before live Hue bridge control can be enabled

- [ ] **Step 2: Link it from the module deploy README**

Keep the deploy story additive and explicit that this is optional.

### Task 5: Update the existing Hue support declarations

**Files:**
- Modify: `modules/home-assistant/docs/home-ecosystem-support-matrix.md`
- Modify: `modules/home-assistant/docs/ecosystems/philips-hue.md`
- Modify: `modules/home-assistant/config/home-assistant-module.example.json`
- Modify: `modules/home-assistant/registry/devices.example.json`
- Modify: `modules/home-assistant/README.md`
- Modify: `modules/home-assistant/docs/README.md`

- [ ] **Step 1: Point the Hue support entry to the new boundary shell**

Change wording from "future optional boundary" to "boundary shell now exists, runtime not yet migrated."

- [ ] **Step 2: Keep Wave 3 scope explicit**

Do not change other ecosystems or imply that the Hue direct runtime is already active.

## Chunk 3: Verification

### Task 6: Run focused Hue boundary verification

**Files:**
- Test: `scripts/__tests__/home-ecosystem-hue-boundary.test.mjs`

- [ ] **Step 1: Run the focused test**

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

### Task 8: Confirm the boundary stayed boundary-only

**Files:**
- Verify only

- [ ] **Step 1: Inspect the final diff**

Confirm:
- no Hue runtime files were migrated
- no new workspaces or deploy/runtime entrypoints were added
- no other direct adapters changed

- [ ] **Step 2: Record future work separately**

Any future `Hue` runtime migration should be listed as follow-up only.
