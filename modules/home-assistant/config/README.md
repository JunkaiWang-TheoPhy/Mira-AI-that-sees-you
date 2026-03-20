# Home Assistant Module Config

## Purpose

This directory holds release-safe configuration examples for Mira's Home Assistant flagship module.

## Owns

- module config examples
- release-safe placeholder values
- references to registry and scene-planning assets
- Wave 2 ecosystem declaration slots

## Does Not Own

- live Home Assistant secrets
- plugin implementation code
- generic core runtime config

## Current Files

- [home-assistant-module.example.json](./home-assistant-module.example.json)

## Relationship

This config example is intended to be read together with:

- [../registry/devices.example.json](../registry/devices.example.json)
- [../docs/scene-resolver-policy-coordination-spec.md](../docs/scene-resolver-policy-coordination-spec.md)
- [../docs/home-ecosystem-support-matrix.md](../docs/home-ecosystem-support-matrix.md)
- [../plugin/README.md](../plugin/README.md)

It is a release-side illustrative example, not a claim that the current runtime has already consumed this exact JSON shape.

The `homeAssistant.ecosystems` section now mirrors the 12 named Wave 2 support entries without claiming that all of them already have live direct-runtime support.
