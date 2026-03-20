# Mira Release Docs

## Purpose

This folder is the public documentation portal for the current Mira release tree.

It is meant to help future readers understand the release structure before they read implementation files.

## Reading Path

Start here, then read in this order:

1. [00-overview](./00-overview/README.md)
2. [10-core](./10-core/README.md)
3. [20-modules](./20-modules/README.md)
4. [30-hardware](./30-hardware/README.md)
5. [40-deploy](./40-deploy/README.md)
6. [50-development](./50-development/README.md)

If you want the shortest entrypoint first, open:

- [00-overview/quick-start.md](./00-overview/quick-start.md)

If you want the ordered onboarding path, open:

- [00-overview/getting-started.md](./00-overview/getting-started.md)

## Current Status

This portal is the first release-side skeleton.

It currently focuses on:

- architecture boundaries
- ownership rules
- migration intent
- second-level public navigation for modules, deploy, examples, and docs

The first concrete release-side reading paths now already exist for:

- the default repo-level deploy path
- `minimal-core`
- `home-stack`
- `service-notification-router`

The current operator-facing deploy companions now also exist at:

- [../README.md](../README.md)
- [../deploy/deploy-paths-overview.md](../deploy/deploy-paths-overview.md)
- [../deploy/mira-openclaw/README.md](../deploy/mira-openclaw/README.md)

The first concrete development-side entrypoint now also exists for contributors:

- [50-development/contributing-and-migration.md](./50-development/contributing-and-migration.md)

It does not yet contain the full migrated documentation set.
