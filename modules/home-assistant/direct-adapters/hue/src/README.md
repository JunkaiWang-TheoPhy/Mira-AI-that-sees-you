# Hue Direct Adapter Source Boundary

## Purpose

This directory contains the migrated minimum runtime surface for the optional Philips Hue direct adapter.

## Runtime Files

- `client.ts`
- `index.ts`
- `hue.test.ts`

## Current Scope

- `client.ts` owns Hue bridge HTTP calls and payload shaping
- `index.ts` owns plugin status, light listing, scene listing, light control, and scene activation tools
- `hue.test.ts` covers the minimal runtime surface without reaching into root orchestration

## Why It Stops Here

Home Assistant remains the default Hue path in Mira.

This source boundary exists so the release repo can carry a real optional Hue runtime without claiming that default routing, auto-installation, or broader adapter orchestration is already finished.
