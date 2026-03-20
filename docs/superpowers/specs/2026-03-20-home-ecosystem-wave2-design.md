# Mira Home Ecosystem Wave 2 Design

## Goal

Extend the current release-side `Home Assistant` module so Mira formally covers 12 named smart-home entries in a Wave 2, HA-first way without adding new direct-runtime packages or changing existing deploy/runtime entrypoints.

## Background

The migration pack defines Wave 2 as a declaration-layer expansion:

- add a support matrix
- add ecosystem docs
- add registry/config slots
- mark support level for each named entry

The pack also explicitly says not to turn this into 12 separate modules and not to promise full direct runtime for all 12 entries in the first pass.

The current repository already has the release-side Home Assistant module shell, scene-planning skeletons, example registry, and example config. What it does not yet have is a formal 12-entry ecosystem layer.

## Scope

This Wave 2 change will add:

- one release-side support matrix for 12 named entries
- one release-side ecosystem doc per named entry
- registry metadata that formally declares the 12 entries
- config slots that mirror those 12 entries
- tests that verify the declaration layer is complete and consistent

This Wave 2 change will not add:

- new direct-adapter packages
- live device-control runtime for Alexa, Google Home, Lutron, SmartThings, or other brands
- deploy/runtime entrypoint changes
- notification-router changes
- module splitting beyond the existing single `Home Assistant` module

## The 12 Named Entries

The 12 named entries to cover are:

1. Amazon Alexa
2. Apple Home
3. HomeKit
4. Xiaomi / Mi Home
5. Matter
6. Aqara
7. Tuya / Smart Life
8. SwitchBot
9. Philips Hue
10. Google Home / Nest
11. Lutron
12. SmartThings

## Support Levels

Wave 2 should formalize three support levels:

### HA-first

- Apple Home
- HomeKit
- Xiaomi / Mi Home
- Matter
- Aqara
- Tuya / Smart Life
- SwitchBot
- Google Home / Nest
- Lutron
- SmartThings

### HA-first + optional direct adapter

- Philips Hue

### Readiness / onboarding only

- Amazon Alexa

## Design

### 1. Keep device examples and ecosystem declarations separate

Do not force 12 fake or low-value example devices into the `devices` array just to represent support coverage.

Instead:

- keep `devices` focused on concrete release-side device examples used by scenes and policy skeletons
- add a top-level `ecosystems` metadata array to the release-side registry example

That keeps current scene and registry consumers stable while making the 12-entry support surface explicit.

### 2. Extend the registry loader to understand ecosystem metadata

`modules/home-assistant/plugin/src/registry/loadDevicesRegistry.ts` should grow a typed ecosystem metadata layer in addition to the existing device-loading behavior.

The loader should:

- continue loading `devices` exactly as it does now
- additionally load top-level `ecosystems`
- normalize support metadata into a stable in-memory shape
- stay backward-compatible if a registry file omits `ecosystems`

The new metadata is declaration-only in Wave 2. It does not change scene selection or execution behavior.

### 3. Add matching config slots

`modules/home-assistant/config/home-assistant-module.example.json` should gain a release-side `ecosystems` section that mirrors the 12 named entries.

Each config slot should capture declaration-layer details only, for example:

- support level
- primary runtime path
- whether a direct adapter is optional or absent
- operator-facing prerequisites
- readiness notes where applicable

This config layer is not a claim that the current runtime consumes every field yet. It is a release-safe template surface for future waves.

### 4. Add release-side docs for formal coverage

Add:

- one support matrix document covering all 12 entries
- one ecosystem doc per entry under a dedicated `ecosystems/` docs subtree

These docs should state:

- support level
- default runtime path
- whether a direct adapter is needed or optional
- operator prerequisites
- current status in this repo

Update the existing module/doc/config/registry README files so the new material is discoverable from the current release-side entrypoints.

## File Plan

### Modify

- `modules/home-assistant/README.md`
- `modules/home-assistant/docs/README.md`
- `modules/home-assistant/config/README.md`
- `modules/home-assistant/registry/README.md`
- `modules/home-assistant/config/home-assistant-module.example.json`
- `modules/home-assistant/registry/devices.example.json`
- `modules/home-assistant/plugin/src/registry/loadDevicesRegistry.ts`

### Create

- `modules/home-assistant/docs/home-ecosystem-support-matrix.md`
- `modules/home-assistant/docs/ecosystems/amazon-alexa.md`
- `modules/home-assistant/docs/ecosystems/apple-home.md`
- `modules/home-assistant/docs/ecosystems/homekit.md`
- `modules/home-assistant/docs/ecosystems/xiaomi-mi-home.md`
- `modules/home-assistant/docs/ecosystems/matter.md`
- `modules/home-assistant/docs/ecosystems/aqara.md`
- `modules/home-assistant/docs/ecosystems/tuya-smart-life.md`
- `modules/home-assistant/docs/ecosystems/switchbot.md`
- `modules/home-assistant/docs/ecosystems/philips-hue.md`
- `modules/home-assistant/docs/ecosystems/google-home-nest.md`
- `modules/home-assistant/docs/ecosystems/lutron.md`
- `modules/home-assistant/docs/ecosystems/smartthings.md`
- `modules/home-assistant/plugin/src/registry/loadDevicesRegistry.test.ts`

## Data Model

### Registry ecosystem entry

Each top-level registry ecosystem entry should minimally carry:

- stable id
- display name
- support level
- default runtime path
- whether a direct adapter is optional, required later, or absent in Wave 2
- operator prerequisites
- current status
- optional notes

### Config ecosystem slot

Each config slot should minimally carry:

- enabled or declared status
- support level
- runtime path
- direct-adapter note
- operator prerequisite placeholders
- readiness notes

The config should remain example-safe and contain placeholders rather than live secrets.

## Error Handling And Compatibility

- Missing `ecosystems` in older registry files should not break loading; treat it as an empty list.
- Unknown support levels should fail validation in tests rather than silently drift.
- Existing `devices` behavior must remain unchanged.
- No current scene/planning logic should depend on the new ecosystem metadata in this wave.

## Testing Strategy

Use TDD and verify the declaration layer in two directions:

### Loader test

Add a TypeScript node test for `loadDevicesRegistry.ts` using Node's type-stripping support.

The test should prove:

- the loader still reads existing device examples
- the loader now reads all 12 ecosystem metadata entries
- omitted ecosystem metadata remains backward-compatible

### Repository consistency test

Add or extend a root verification-style test so the repo fails if:

- the support matrix does not cover all 12 entries
- ecosystem docs are missing for any entry
- registry metadata and config slots drift apart

## Success Criteria

- The repository still has one formal Home Assistant module.
- The release-side module formally covers 12 named entries.
- Each entry has a support-level declaration, ecosystem doc, registry slot, and config slot.
- Existing device examples and scene logic remain intact.
- No direct-runtime packages are added in this wave.
- Fresh tests verify the new declaration layer and show no regression in current registry loading.
