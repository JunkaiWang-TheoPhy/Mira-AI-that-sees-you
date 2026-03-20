# Home Assistant Direct Adapters

## Purpose

This directory holds optional brand-specific direct-adapter boundaries that remain owned by Mira's `Home Assistant` flagship module.

## Owns

- module-scoped direct-adapter package shells
- release-safe boundary docs for optional vendor-direct paths

## Does Not Own

- Mira core plugins
- Home Assistant-first default execution paths
- live direct-adapter runtime code unless a later wave explicitly migrates it

## Current Status

The first release-side direct-adapter boundary now exists here:

- [hue/README.md](./hue/README.md)

This subtree remains additive. Home Assistant is still the default execution path for household actions.
