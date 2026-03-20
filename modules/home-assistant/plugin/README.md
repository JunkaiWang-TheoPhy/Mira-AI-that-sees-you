# Home Assistant Plugin

## Purpose

This directory will hold the release-side plugin package for Mira's Home Assistant module.

## Owns

- plugin-level entrypoints
- typed tool boundaries
- scene resolver and executor implementation surfaces

## Planned Contents

- plugin package metadata
- `src/` implementation
- skills and config notes

## Current Status

The first release-side plugin source skeleton already exists under `src/`, including scene definition, scene resolver, and executor files.

The current package and source-boundary companions now also exist:

- [package.json](./package.json)
- [tsconfig.json](./tsconfig.json)
- [src/README.md](./src/README.md)

This plugin package is still documented as a module-scoped boundary. The current default repo deploy path does not yet ship it as part of the one-command runnable main stack.
