# Core

## Purpose

This section explains the independently deployable Mira core.

## Owns

- persona boundaries
- workspace skeleton
- OpenClaw config intent
- core skill and plugin boundaries

## Does Not Own

- Home Assistant logic
- hardware adapters
- channel-specific runtime services

## Planned Contents

- core architecture
- core directory map
- minimum viable runtime story

## Current Status

The release-side core implementation has started.

The first migrated core files now live under [../../core](../../core), with direct persona files, sanitized workspace templates, and a broader release-safe OpenClaw config set that now includes:

- agent defaults
- a custom vision-provider example
- a sanitized Lingzhu plugin config example
- a sanitized Lingzhu runtime system prompt
- a compatibility-safe local gateway default through `gateway.mode=local` in generated runtime configs

The first minimal-core onboarding path is now present through:

- [../../examples/minimal-core/README.md](../../examples/minimal-core/README.md)
- [../../deploy/core/README.md](../../deploy/core/README.md)
- [../../core/openclaw-config/openclaw.example.json](../../core/openclaw-config/openclaw.example.json)
- [../../core/openclaw-config/minimal-runtime-contract.md](../../core/openclaw-config/minimal-runtime-contract.md)

The first release-safe core plugin path is now present through:

- [../../core/plugins/lingzhu-bridge/README.md](../../core/plugins/lingzhu-bridge/README.md)

The minimal-core story now explicitly combines:

- [../../core/openclaw-config/openclaw.example.json](../../core/openclaw-config/openclaw.example.json)
- [../../core/plugins/lingzhu-bridge/README.md](../../core/plugins/lingzhu-bridge/README.md)
- [../../examples/minimal-core/README.md](../../examples/minimal-core/README.md)

The ordered onboarding path that starts from core now lives at:

- [../00-overview/getting-started.md](../00-overview/getting-started.md)
