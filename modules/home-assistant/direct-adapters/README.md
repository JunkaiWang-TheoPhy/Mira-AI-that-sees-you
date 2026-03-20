# Home Assistant Direct Adapters

## Purpose

This directory holds optional brand-specific direct-adapter boundaries that remain owned by Mira's `Home Assistant` flagship module.

## Owns

- module-scoped direct-adapter package shells
- release-safe boundary docs for optional vendor-direct paths

## Current Status

The first release-side direct-adapter boundary now exists here:

- [hue/README.md](./hue/README.md)

This subtree remains additive. Home Assistant is still the default execution path for household actions.

Operator-facing module wiring for these optional adapters should still be read together with [../../../deploy/module-home-assistant/README.md](../../../deploy/module-home-assistant/README.md).
