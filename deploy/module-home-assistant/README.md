# Home Assistant Module Deploy

## Purpose

This directory will hold deployment notes for Mira core plus the Home Assistant flagship module.

## Owns

- module-specific deploy guidance
- module dependency notes
- release-safe setup expectations

## Planned Contents

- core-plus-module setup notes
- registry/config expectations
- module wiring steps

## Current Status

This directory now marks the first concrete deploy path for Mira core plus the Home Assistant flagship module.

Unified deploy comparison:

- [../deploy-paths-overview.md](../deploy-paths-overview.md)

## Required Inputs

Use these release-side files together:

- [../../core/openclaw-config/openclaw.example.json](../../core/openclaw-config/openclaw.example.json)
- [../../modules/home-assistant/config/home-assistant-module.example.json](../../modules/home-assistant/config/home-assistant-module.example.json)
- [../../modules/home-assistant/registry/devices.example.json](../../modules/home-assistant/registry/devices.example.json)
- [env.example](./env.example)

Optional service dependency:

- [../../services/notification-router/README.md](../../services/notification-router/README.md)

Optional direct-adapter operator note:

- [hue-direct-adapter.md](./hue-direct-adapter.md)

## Module Deploy Story

This is the intended order:

1. complete the core-only path first
2. copy and adapt [home-assistant-module.example.json](../../modules/home-assistant/config/home-assistant-module.example.json)
3. copy and adapt [env.example](./env.example)
4. map real household devices using [devices.example.json](../../modules/home-assistant/registry/devices.example.json)
5. if outbound self alerts or check-ins matter, prepare the release-side `notification-router`
6. only review [hue-direct-adapter.md](./hue-direct-adapter.md) if you explicitly need to prepare a future Philips Hue direct-bridge path

The advanced example that combines this module path with the outbound service lives at:

- [../../examples/home-stack-with-notification-router/README.md](../../examples/home-stack-with-notification-router/README.md)

