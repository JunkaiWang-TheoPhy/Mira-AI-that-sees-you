# OpenClaw Compatibility Adapter Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Mira tolerate older or differently shaped OpenClaw runtimes by normalizing generated config and treating optional CLI validation as best-effort.

**Architecture:** Keep `scripts/mira-openclaw-runtime.mjs` as the entrypoint, but tighten it around an adapter contract: discovery chooses the host truth, config generation emits a minimum runnable config, and doctor separates fatal readiness failures from optional CLI capability warnings.

**Tech Stack:** Node.js ESM, built-in `node:test`, JSON runtime manifests, OpenClaw CLI integration.

---

## Chunk 1: Regression Coverage

### Task 1: Add a failing test for generated gateway defaults

**Files:**
- Modify: `scripts/__tests__/mira-openclaw-runtime.test.mjs`

- [ ] **Step 1: Write the failing test**

Add a test that bootstraps a fixture runtime and asserts the generated `openclaw.local.json` includes `gateway.mode === "local"`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/__tests__/mira-openclaw-runtime.test.mjs --test-name-pattern "gateway.mode"`

Expected: FAIL because the generated config currently omits `gateway.mode`.

- [ ] **Step 3: Commit after green later**

Commit together with the implementation once this chunk is green.

### Task 2: Add a failing test for optional config validation

**Files:**
- Modify: `scripts/__tests__/mira-openclaw-runtime.test.mjs`

- [ ] **Step 1: Write the failing test**

Add a test that stubs `runCommand` so:
- `openclaw config validate --json` throws an unsupported-command error
- inspection is otherwise healthy

Assert `doctorMiraOpenClawRuntime()` returns:
- `ok === true`
- `configValidation.ok === true`
- `configValidation.skipped === true`
- warning text mentioning skipped/unsupported validation

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/__tests__/mira-openclaw-runtime.test.mjs --test-name-pattern "unsupported validate"`

Expected: FAIL because current behavior marks validation failure as fatal.

## Chunk 2: Runtime Fixes

### Task 3: Normalize generated config for gateway compatibility

**Files:**
- Modify: `scripts/mira-openclaw-runtime.mjs`
- Optional reference: `core/openclaw-config/openclaw.example.json`

- [ ] **Step 1: Implement minimal config normalization**

Update `buildGeneratedOpenClawConfig()` so the generated config always includes:

```js
gateway: {
  ...(template.gateway ?? {}),
  mode: "local",
}
```

Preserve any template-provided gateway keys.

- [ ] **Step 2: Run targeted test**

Run: `node --test scripts/__tests__/mira-openclaw-runtime.test.mjs --test-name-pattern "gateway.mode"`

Expected: PASS

### Task 4: Make config validation best-effort

**Files:**
- Modify: `scripts/mira-openclaw-runtime.mjs`

- [ ] **Step 1: Add validation compatibility helper**

Add a helper that attempts:
1. `openclaw config validate --json`
2. if unsupported, returns a structured skipped result instead of fatal failure

Suggested result shape:

```js
{
  ok: true,
  skipped: true,
  reason: "unsupported-command",
  detail: "..."
}
```

- [ ] **Step 2: Use helper in `doctorMiraOpenClawRuntime()`**

`doctor` should:
- keep fatal inspection failures fatal
- treat unsupported validation as warning + skipped
- only fail when validation actually reports invalid config or inspection itself is not ready

- [ ] **Step 3: Run targeted test**

Run: `node --test scripts/__tests__/mira-openclaw-runtime.test.mjs --test-name-pattern "unsupported validate"`

Expected: PASS

## Chunk 3: Verification

### Task 5: Run focused test suite

**Files:**
- Test: `scripts/__tests__/mira-openclaw-runtime.test.mjs`

- [ ] **Step 1: Run focused tests**

Run: `node --test scripts/__tests__/mira-openclaw-runtime.test.mjs`

Expected: PASS

### Task 6: Run repo verification

**Files:**
- Verify only

- [ ] **Step 1: Run release checks**

Run: `npm run verify:release`

Expected: PASS

- [ ] **Step 2: Run release tests**

Run: `npm run test:release`

Expected: PASS

### Task 7: Update operator docs if runtime behavior changed

**Files:**
- Modify: `deploy/mira-openclaw/README.md`
- Modify: `README.md`

- [ ] **Step 1: Document the new compatibility behavior**

Clarify that:
- generated runtime config sets `gateway.mode=local`
- config validation may be skipped on older OpenClaw CLIs

- [ ] **Step 2: Re-run the relevant tests if docs reference command output**

No additional code tests required unless docs require command adjustments.
