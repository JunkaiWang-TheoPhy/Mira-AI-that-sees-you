# Philips Hue

## Entry

- display name: `Philips Hue`
- id: `philips-hue`

## Wave 2 Position

- support level: `ha_first_optional_direct_adapter`
- default runtime path: `home_assistant`
- direct-adapter status: optional release-side runtime now exists at `modules/home-assistant/direct-adapters/hue/src/index.ts`

## Operator Prerequisites

- keep Home Assistant as the default Hue path in Wave 2
- treat local Hue bridge access as an optional operator-enabled runtime path
- review [modules/home-assistant/direct-adapters/hue/README.md](../../direct-adapters/hue/README.md) before widening direct-bridge scope

## Current Status

Philips Hue is still Home Assistant-first.

This repo now also carries a concrete optional direct bridge runtime package at `modules/home-assistant/direct-adapters/hue/`, including `src/client.ts` and `src/index.ts`.

That runtime is still not the default route, is not auto-installed by the main module flow, and does not replace the Home Assistant path unless an operator chooses to wire it in later.
