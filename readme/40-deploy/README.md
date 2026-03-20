# Deploy

## Purpose

This section will hold deployment stories for the release version.

## Owns

- deployment model
- environment expectations
- minimal setup paths
- service composition notes

## Does Not Own

- low-level code contracts
- device registry semantics
- private runtime backup procedures

## Planned Contents

- minimal local deployment
- service dependency notes
- release-side configuration templates

## Current Status

The release-side deploy shell is no longer just a placeholder.

The current root-level deploy story now starts with:

- [../../README.md](../../README.md)
- [../../deploy/deploy-paths-overview.md](../../deploy/deploy-paths-overview.md)
- [../../deploy/mira-openclaw/README.md](../../deploy/mira-openclaw/README.md)

The release-side deploy shell now also includes:

- [../../deploy/core/README.md](../../deploy/core/README.md)
- [../../deploy/module-home-assistant/README.md](../../deploy/module-home-assistant/README.md)
- [../../deploy/service-notification-router/README.md](../../deploy/service-notification-router/README.md)
- [../../deploy/mira-openclaw/README.md](../../deploy/mira-openclaw/README.md)

The first deploy story that combines release-side core with a service path now exists through:

- [../../examples/service-notification-router/README.md](../../examples/service-notification-router/README.md)

The current integrated Mira plus OpenClaw deploy path now also documents:

- host-first provider discovery via `openclaw models status --json`
- repo-local config normalization including `gateway.mode=local`
- best-effort validation on older OpenClaw CLIs
- a configurable startup health window through `MIRA_OPENCLAW_HEALTH_TIMEOUT_MS`

So the current deploy reading order is:

1. [../../deploy/deploy-paths-overview.md](../../deploy/deploy-paths-overview.md)
2. [../../deploy/mira-openclaw/README.md](../../deploy/mira-openclaw/README.md)
3. [../../deploy/service-notification-router/README.md](../../deploy/service-notification-router/README.md)
4. [../../deploy/core/README.md](../../deploy/core/README.md)
5. [../../deploy/module-home-assistant/README.md](../../deploy/module-home-assistant/README.md)

The page that turns those deploy notes into a single onboarding sequence now lives at:

- [../00-overview/getting-started.md](../00-overview/getting-started.md)

The operator-facing comparison page now also lives at:

- [../../deploy/deploy-paths-overview.md](../../deploy/deploy-paths-overview.md)
