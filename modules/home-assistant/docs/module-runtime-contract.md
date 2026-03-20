# Home Assistant Module Runtime Contract

## Purpose

This document defines the current release-side runtime contract for Mira's first-party Home Assistant module.

## Required Inputs

The current module contract depends on:

- [../config/home-assistant-module.example.json](../config/home-assistant-module.example.json)
- [../registry/devices.example.json](../registry/devices.example.json)
- [../plugin/package.json](../plugin/package.json)
- [../plugin/src/README.md](../plugin/src/README.md)
- [scene-resolver-policy-coordination-spec.md](./scene-resolver-policy-coordination-spec.md)

## External Dependencies

The current release-side module assumes:

- Mira core is already wired into an OpenClaw runtime
- a reachable Home Assistant base URL exists
- a long-lived Home Assistant token exists
- a device registry has been mapped to household roles
- outbound notifications, if used, can be delegated to `notification-router`

## What The Module Adds

When the current contract is satisfied, this module adds:

- household device registry interpretation
- scene planning
- scene execution boundaries
- policy-gated outbound alerts tied to household actions

## What It Does Not Add Yet

This contract does not yet include:

- bundled module installation workflow
- live Home Assistant dispatch packaging
- automatic registry discovery
- release-side parity tests for the full module package

## Matching Paths

Example path:

- [../../../examples/home-stack/README.md](../../../examples/home-stack/README.md)

Deploy path:

- [../../../deploy/module-home-assistant/README.md](../../../deploy/module-home-assistant/README.md)

Default repo runtime note:

- the current repo-level `mira-openclaw` one-command path remains a core-plus-sidecar runnable stack
- this module contract is a release-side module boundary and operator setup contract, not yet the default integrated runtime payload
