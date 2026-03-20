# Home Assistant Registry

## Purpose

This directory holds release-side registry examples for the Home Assistant module.

## Owns

- ecosystem declaration metadata
- device registry examples
- scene-binding examples
- release-safe device metadata samples

## Does Not Own

- live household data
- private runtime configuration
- direct Home Assistant service code

## Planned Contents

- named ecosystem support declarations
- example device registries
- capability-model references
- future registry schema notes

## Current Status

The current release-side sample is:

- [devices.example.json](./devices.example.json)

The registry now carries two layers:

- top-level `ecosystems` declarations for the 12 named Wave 2 entries
- example `devices` used by current scene and policy skeletons

This registry remains module-scoped documentation and sample data. It does not mean the current root `mira-openclaw` deploy path auto-loads these household mappings by default.
