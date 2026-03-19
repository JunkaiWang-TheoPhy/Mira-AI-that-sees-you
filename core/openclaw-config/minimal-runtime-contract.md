# Minimal Runtime Contract

## Purpose

This document defines the smallest honest runtime contract for Mira core inside the release tree.

It describes what an external OpenClaw runtime must provide in order to load the current release-safe core package.

## Required Inputs

The current minimal contract depends on:

- [openclaw.example.json](./openclaw.example.json)
- [agent-defaults-snippet.json5](./agent-defaults-snippet.json5)
- [lingzhu-system-prompt.txt](./lingzhu-system-prompt.txt)
- [../workspace/AGENTS.md](../workspace/AGENTS.md)
- [../workspace/MEMORY.md](../workspace/MEMORY.md)
- [../workspace/OUTBOUND_POLICY.md](../workspace/OUTBOUND_POLICY.md)
- [../plugins/lingzhu-bridge/README.md](../plugins/lingzhu-bridge/README.md)

## External Runtime Assumptions

The release tree still assumes an external OpenClaw runtime provides:

- agent loading
- workspace mounting
- model provider wiring
- plugin discovery or plugin path registration
- session storage and runtime process management

The release tree does not currently bundle OpenClaw itself.

## Minimal Core Outcome

When the current contract is satisfied, the release-side minimal core should provide:

- Mira persona files
- release-safe workspace rules
- release-safe outbound policy guidance
- release-safe Lingzhu bridge helpers
- a documented OpenClaw config example

## Current Non-Goals

This contract does not yet guarantee:

- packaged runtime installation
- bundled module loading
- production secrets management
- service orchestration

## Local Bootstrap Companion

The release tree now also provides a generated local runtime pack path through:

- [../../deploy/mira-openclaw/README.md](/Users/thomasjwang/Documents/GitHub/Mira/deploy/mira-openclaw/README.md)

## Matching Paths

Operator-facing path:

- [../../deploy/core/README.md](../../deploy/core/README.md)

Example path:

- [../../examples/minimal-core/README.md](../../examples/minimal-core/README.md)
