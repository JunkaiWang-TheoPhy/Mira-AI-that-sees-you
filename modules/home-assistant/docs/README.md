# Home Assistant Module Docs

## Purpose

This directory holds release-side architecture and behavior specs for the Home Assistant module.

## Owns

- module architecture notes
- planning and policy coordination specs
- release-facing module design references
- ecosystem support references

## Planned Contents

- scene planning specs
- policy coordination notes
- module architecture docs
- named ecosystem support docs

## Current Status

The current release-side docs now include:

- [scene-resolver-policy-coordination-spec.md](./scene-resolver-policy-coordination-spec.md)
- [module-runtime-contract.md](./module-runtime-contract.md)
- [package-assembly-checklist.md](./package-assembly-checklist.md)
- [home-ecosystem-support-matrix.md](./home-ecosystem-support-matrix.md)

The Wave 2 ecosystem entry docs now live under:

- [ecosystems/amazon-alexa.md](./ecosystems/amazon-alexa.md)
- [ecosystems/apple-home.md](./ecosystems/apple-home.md)
- [ecosystems/homekit.md](./ecosystems/homekit.md)
- [ecosystems/xiaomi-mi-home.md](./ecosystems/xiaomi-mi-home.md)
- [ecosystems/matter.md](./ecosystems/matter.md)
- [ecosystems/aqara.md](./ecosystems/aqara.md)
- [ecosystems/tuya-smart-life.md](./ecosystems/tuya-smart-life.md)
- [ecosystems/switchbot.md](./ecosystems/switchbot.md)
- [ecosystems/philips-hue.md](./ecosystems/philips-hue.md)
- [ecosystems/google-home-nest.md](./ecosystems/google-home-nest.md)
- [ecosystems/lutron.md](./ecosystems/lutron.md)
- [ecosystems/smartthings.md](./ecosystems/smartthings.md)

The first optional direct-adapter boundary referenced by these docs now lives at:

- [../direct-adapters/hue/README.md](../direct-adapters/hue/README.md)

Current deploy relationship:

- these docs define module architecture and boundaries
- the operator-facing module setup path lives at [../../../deploy/module-home-assistant/README.md](../../../deploy/module-home-assistant/README.md)
- the current repo-level runnable default stack still lives at [../../../deploy/mira-openclaw/README.md](../../../deploy/mira-openclaw/README.md) and does not automatically include this module runtime
