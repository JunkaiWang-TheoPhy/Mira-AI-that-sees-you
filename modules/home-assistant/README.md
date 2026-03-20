# Home Assistant Module

## Purpose

This directory is Mira's first-party flagship module for household execution.

## Owns

- household control module boundaries
- named home-ecosystem declarations
- optional module-scoped direct-adapter boundaries
- registry examples
- plugin skeletons
- scene-planning documentation

## Planned Contents

- module overview docs
- plugin implementation skeleton
- registry samples
- deploy notes for the Home Assistant module

## Current Status

The first release-side module assets already present here are:

- [docs/scene-resolver-policy-coordination-spec.md](./docs/scene-resolver-policy-coordination-spec.md)
- [docs/module-runtime-contract.md](./docs/module-runtime-contract.md)
- [docs/package-assembly-checklist.md](./docs/package-assembly-checklist.md)
- [docs/home-ecosystem-support-matrix.md](./docs/home-ecosystem-support-matrix.md)
- [registry/devices.example.json](./registry/devices.example.json)
- [config/home-assistant-module.example.json](./config/home-assistant-module.example.json)
- [plugin/package.json](./plugin/package.json)
- [plugin/tsconfig.json](./plugin/tsconfig.json)
- [plugin/src/README.md](./plugin/src/README.md)

This README turns those files into a public module entrypoint rather than a loose implementation subtree.

Wave 2 now formally covers 12 named smart-home entries inside this single module. That declaration layer does not imply 12 live direct-runtime implementations.

The first optional direct-adapter boundary now also exists under:

- [direct-adapters/hue/README.md](./direct-adapters/hue/README.md)

The first module onboarding path now exists through:

- [../../examples/home-stack/README.md](../../examples/home-stack/README.md)
- [../../deploy/module-home-assistant/README.md](../../deploy/module-home-assistant/README.md)

The first advanced module-plus-service composition path now also exists through:

- [../../examples/home-stack-with-notification-router/README.md](../../examples/home-stack-with-notification-router/README.md)

The canonical migration record for this module now also lives at:

- [../../docs/migration/source-to-release-mapping.md](../../docs/migration/source-to-release-mapping.md)

Current deploy boundary:

- the repo-level one-command path still lives under [../../README.md](../../README.md) and [../../deploy/mira-openclaw/README.md](../../deploy/mira-openclaw/README.md)
- that default integrated stack does not yet auto-wire this Home Assistant module as part of the current runnable main path
- this module README and [../../deploy/module-home-assistant/README.md](../../deploy/module-home-assistant/README.md) describe the module contract and operator setup boundary instead
