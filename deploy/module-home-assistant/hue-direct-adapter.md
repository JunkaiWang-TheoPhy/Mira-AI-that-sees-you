# Philips Hue Direct Adapter Notes

## Purpose

This document explains the release-side Philips Hue direct-adapter runtime package for Mira's `Home Assistant` module.

## What Exists Now

The current repo now ships a release-side runtime package at:

- [../../modules/home-assistant/direct-adapters/hue/README.md](../../modules/home-assistant/direct-adapters/hue/README.md)

That package includes:

- package metadata
- plugin metadata
- a bridge client at `src/client.ts`
- a runtime entrypoint at `src/index.ts`
- package-local tests

## What Does Not Exist Yet

This wave still does not ship:

- runtime install wiring
- automatic preference over the Home Assistant route
- broader deploy automation outside this operator note

## Operator Guidance

Use Home Assistant as the default Philips Hue execution path.

Treat the direct-adapter runtime as optional unless you are explicitly planning local bridge wiring with a Hue bridge URL and application key.

## Future Enablement Direction

Before a live Hue direct runtime should become a first-class operational path, a later wave would still need:

1. explicit install and startup wiring
2. operator setup steps for bridge URL, application key, and bridge identity
3. a decision on when direct Hue control should override the default Home Assistant route
4. any wider orchestration needed outside the package-local runtime surface
