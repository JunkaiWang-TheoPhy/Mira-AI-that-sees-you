# Deploy

## Purpose

This directory will hold release-side deployment material.

## Owns

- deployment entrypoints
- environment notes
- minimal composition guides

## Does Not Own

- runtime implementation
- core identity documents
- service internals

## Planned Contents

- minimal deploy recipe
- release-safe environment templates
- service dependency notes

## Current Status

This directory now contains the current repo-level deploy contract, focused profile deploy docs, and machine-readable deploy metadata.

The current unified operator-facing comparison page now lives at:

- [deploy-paths-overview.md](./deploy-paths-overview.md)

The current default integrated stack docs now live at:

- [mira-openclaw/README.md](./mira-openclaw/README.md)
- [repo.env.example](./repo.env.example)
- [repo-manifest.json](./repo-manifest.json)

The current focused service and module docs also live at:

- [core/README.md](./core/README.md)
- [service-notification-router/README.md](./service-notification-router/README.md)
- [module-home-assistant/README.md](./module-home-assistant/README.md)
