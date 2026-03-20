# Hue Direct-Adapter Boundary Design

## Goal

Add a release-side Philips Hue direct-adapter boundary to Mira without migrating the full runtime implementation.

## Background

The migration pack's Wave 3 guidance says to migrate one direct-adapter boundary at a time and to start with Hue. It explicitly scopes the first Hue pass to:

- package shell
- README
- source boundary
- operator docs

The current repo already declares Philips Hue in the Home Assistant module as `ha_first_optional_direct_adapter`, but that declaration still points to a future boundary rather than a concrete release-side package shell.

## Scope

This change will add:

- a module-local direct-adapters area
- a release-side Philips Hue direct-adapter package shell
- release-side source-boundary docs for Hue
- operator-facing Hue direct-adapter notes
- doc and metadata updates so the Hue support entry now points to a concrete boundary package shell
- tests that verify the boundary exists and remains boundary-only

This change will not add:

- `client.ts`
- `index.ts`
- live bridge requests
- plugin test harness migration
- workspace installation wiring
- changes for Lutron, Google Home, SmartThings, or Alexa

## Recommended Placement

Place the Hue boundary under:

- `modules/home-assistant/direct-adapters/hue/`

Do not place it under `core/plugins/`, because Hue is not a core runtime concern. In this repo it is a module-scoped optional direct-adapter boundary for the Home Assistant flagship module.

## Design

### 1. Add a module-local direct-adapter subtree

Create:

- `modules/home-assistant/direct-adapters/README.md`
- `modules/home-assistant/direct-adapters/hue/`

This keeps optional brand adapters attached to the module that owns household execution rather than to Mira core.

### 2. Ship a package shell, not a live package

The Hue package shell should include:

- `README.md`
- `package.json`
- `openclaw.plugin.json`
- `src/README.md`

It should not include:

- `src/index.ts`
- `src/client.ts`
- migrated tests

That makes the package explicit and inspectable without falsely claiming a runnable direct-adapter runtime.

### 3. Make the metadata useful but honest

`package.json` and `openclaw.plugin.json` should preserve the identity and config shape of the Hue boundary, but should not claim that a live runtime extension has already been migrated.

The metadata should therefore:

- use a release package name under `@mira-release/`
- keep AGPL licensing like other release packages
- describe the bridge URL, application key, bridge id, and default transition fields
- avoid referencing `./src/index.ts` as an active extension until the runtime is migrated in a later wave

### 4. Add operator docs in the deploy path

Create a deploy-facing Hue doc under:

- `deploy/module-home-assistant/hue-direct-adapter.md`

This operator doc should explain:

- Home Assistant remains the default execution path
- the Hue boundary is optional
- the current repo only ships the package shell and boundary docs
- later waves would be needed before enabling live direct bridge control

### 5. Update the existing Hue support entry

Update:

- `modules/home-assistant/docs/home-ecosystem-support-matrix.md`
- `modules/home-assistant/docs/ecosystems/philips-hue.md`
- `modules/home-assistant/config/home-assistant-module.example.json`
- `modules/home-assistant/registry/devices.example.json`
- `modules/home-assistant/README.md`
- `modules/home-assistant/docs/README.md`
- `deploy/module-home-assistant/README.md`

The Hue row and docs should move from "future optional boundary" to "release-side boundary shell exists, runtime not yet migrated."

## File Plan

### Create

- `modules/home-assistant/direct-adapters/README.md`
- `modules/home-assistant/direct-adapters/hue/README.md`
- `modules/home-assistant/direct-adapters/hue/package.json`
- `modules/home-assistant/direct-adapters/hue/openclaw.plugin.json`
- `modules/home-assistant/direct-adapters/hue/src/README.md`
- `deploy/module-home-assistant/hue-direct-adapter.md`
- `scripts/__tests__/home-ecosystem-hue-boundary.test.mjs`

### Modify

- `modules/home-assistant/README.md`
- `modules/home-assistant/docs/README.md`
- `modules/home-assistant/docs/home-ecosystem-support-matrix.md`
- `modules/home-assistant/docs/ecosystems/philips-hue.md`
- `modules/home-assistant/config/home-assistant-module.example.json`
- `modules/home-assistant/registry/devices.example.json`
- `deploy/module-home-assistant/README.md`

## Testing Strategy

Use one focused root test to verify:

- the Hue boundary files exist
- the package shell metadata is structurally valid
- the operator doc exists
- the Hue ecosystem docs and support matrix now refer to a real boundary shell
- no live runtime files such as `src/index.ts` or `src/client.ts` have been migrated yet

## Success Criteria

- The repo contains a release-side Hue direct-adapter boundary package shell under the Home Assistant module.
- The operator-facing deploy docs reference the Hue boundary.
- The Philips Hue ecosystem entry now points to a concrete boundary shell rather than a purely future placeholder.
- No live Hue runtime code is migrated in this wave.
