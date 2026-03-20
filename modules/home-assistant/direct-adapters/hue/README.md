# Philips Hue Direct Adapter

## Purpose

This directory holds the release-side runtime package for an optional Philips Hue direct adapter used by Mira's `Home Assistant` module.

## Owns

- Hue-specific package metadata
- plugin metadata for the optional direct adapter
- the minimal bridge client and tool-registration runtime
- package-local docs and tests for the Hue runtime surface

## Current Files

- [package.json](./package.json)
- [openclaw.plugin.json](./openclaw.plugin.json)
- [src/README.md](./src/README.md)
- [src/client.ts](./src/client.ts)
- [src/index.ts](./src/index.ts)
- [src/hue.test.ts](./src/hue.test.ts)

## Current Status

This package now ships a minimal release-side Hue runtime.

It intentionally still does not ship:

- install or bootstrap wiring
- default-route overrides that bypass Home Assistant automatically
- broader orchestration outside the Hue package boundary

Home Assistant remains Mira's default Philips Hue path. This package is an optional direct-adapter runtime that operators can wire deliberately later.

If you need the operator-facing setup boundary for that later wiring, pair this doc with [../../../../deploy/module-home-assistant/README.md](../../../../deploy/module-home-assistant/README.md) and [../../../../deploy/module-home-assistant/hue-direct-adapter.md](../../../../deploy/module-home-assistant/hue-direct-adapter.md).
