# Hue Direct Runtime Design

## Goal

Promote the release-side Philips Hue direct-adapter package from a boundary shell into a minimal runnable module-local direct adapter.

## Background

The previous Hue wave created:

- a module-local package shell
- release-side boundary docs
- operator-facing notes

The next incremental step is to migrate only the minimum live runtime needed for Hue itself:

- bridge client
- plugin entrypoint
- package-local tests

This still keeps Hue optional and module-scoped. It does not make Hue the default execution path and does not pull other direct adapters forward.

## Scope

This change will add:

- `src/client.ts`
- `src/index.ts`
- package-local Hue runtime tests
- plugin metadata that now points to a live runtime extension
- doc updates so Hue is described as a migrated optional runtime, not only a shell

This change will not add:

- workspace wiring
- bootstrap or deploy automation changes
- Home Assistant scene-routing changes
- automatic preference for direct Hue control over Home Assistant
- changes for any other direct adapter

## Design

### 1. Keep Hue module-local and optional

Hue remains under:

- `modules/home-assistant/direct-adapters/hue/`

The package continues to belong to the Home Assistant module rather than Mira core.

### 2. Migrate the minimum runtime surface

Migrate:

- `client.ts` for Hue bridge HTTP calls and payload shaping
- `index.ts` for status, listing, light-control, and scene-activation tools

Do not broaden the runtime beyond the prototype's minimum useful surface.

### 3. Add package-local tests

Add package-local tests for:

- URL normalization
- resource filtering
- list, light-control, and scene-activation request shaping
- tool registration

These tests should stay focused on Hue and should not pull in root runtime orchestration.

### 4. Update the release narrative

The repo should now describe Hue as:

- still optional
- still not the default path
- now carrying a release-side runtime package

The docs should remain clear that operator wiring and default-routing decisions are still future work.

## File Plan

### Modify

- `modules/home-assistant/direct-adapters/hue/package.json`
- `modules/home-assistant/direct-adapters/hue/openclaw.plugin.json`
- `modules/home-assistant/direct-adapters/hue/README.md`
- `modules/home-assistant/direct-adapters/hue/src/README.md`
- `modules/home-assistant/docs/ecosystems/philips-hue.md`
- `modules/home-assistant/docs/home-ecosystem-support-matrix.md`
- `modules/home-assistant/config/home-assistant-module.example.json`
- `modules/home-assistant/registry/devices.example.json`
- `deploy/module-home-assistant/hue-direct-adapter.md`
- `scripts/__tests__/home-ecosystem-hue-boundary.test.mjs`

### Create

- `modules/home-assistant/direct-adapters/hue/src/client.ts`
- `modules/home-assistant/direct-adapters/hue/src/index.ts`
- `modules/home-assistant/direct-adapters/hue/src/hue.test.ts`

## Testing Strategy

Use TDD in two layers:

1. Update the root Hue boundary test so it now expects the runtime files and active package extension metadata.
2. Add package-local runtime tests for the Hue client and plugin registration behavior.

## Success Criteria

- Hue has live `src/client.ts` and `src/index.ts` in the release repo.
- Hue package metadata points to `./src/index.ts` as its extension entrypoint.
- Package-local Hue tests pass.
- Root release tests stay green.
- The docs make clear that Hue runtime exists but is still optional and not yet the default household route.
