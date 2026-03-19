# Deploy Paths Overview

## Purpose

This page unifies the current release-side deploy stories and points to the default repo entrypoint first.

## Default Repo Entrypoint

Use:

- [repo-manifest.json](./repo-manifest.json)
- [repo.env.example](./repo.env.example)
- [mira-openclaw/README.md](./mira-openclaw/README.md)

Choose this when you want:

- the closest thing to "give the repo URL and deploy it"
- the release-safe Mira core plus bundled OpenClaw integration
- automatic `notification-router` sidecar startup through the default root commands
- a standard foreground entrypoint for platforms that assume `npm start`

Platform manifests now committed at the repo root:

- [../Dockerfile](../Dockerfile)
- [../compose.yaml](../compose.yaml)
- [../Procfile](../Procfile)
- [../render.yaml](../render.yaml)

Those manifests default to the `notification-router` profile because that path does not require the `openclaw` CLI inside the container image.

The committed [../Dockerfile](../Dockerfile) now also bundles the `openclaw` CLI, so direct Docker or Compose runs can override `MIRA_DEPLOY_PROFILE=mira-openclaw` when they also provide a usable provider configuration.

Default root commands:

```bash
cp deploy/repo.env.example .env.local
# edit .env.local
# set MIRA_DEPLOY_PROFILE=notification-router for router-only
# or keep mira-openclaw for the default integrated stack

npm run deploy
npm start
npm run status
npm run health
npm run self-check
npm run down
```

## Focused Paths

### 1. Mira Plus OpenClaw

Use:

- [mira-openclaw/README.md](./mira-openclaw/README.md)

Choose this when you want:

- the current full release-safe integrated stack
- a repo-local OpenClaw config and plugin install path
- sidecar-managed outbound routing

### 2. Notification Router Only

Use:

- [service-notification-router/README.md](./service-notification-router/README.md)

Choose this when you want:

- outbound DM or email delivery only
- machine-readable outbound policy
- a sidecar service you can validate separately from the main stack

### 3. Core Only

Use:

- [core/README.md](./core/README.md)

Choose this when you want:

- Mira persona and workspace only
- the release-safe Lingzhu core plugin path
- no always-on sidecar services

### 4. Core Plus Home Assistant Scaffold

Use:

- [module-home-assistant/README.md](./module-home-assistant/README.md)

Choose this when you want:

- the first-party Home Assistant scaffold
- device registry and scene planning materials
- release-side module structure, not a finished one-click deploy

## Common Operator Rules

Across all paths:

- use release-side `.example` files as starting points
- do not copy live secrets into the repository
- keep `core`, `modules`, and `services` ownership separate
- prefer release-side docs over prototype-tree docs

## Recommended Order

For first-time operators:

1. `npm run deploy` if you want the current default integrated stack
2. `notification-router` only if you need to validate outbound delivery in isolation
3. `core` or `module-home-assistant` only if you are working on individual release-safe slices

The main ordered guide remains:

- [../readme/00-overview/getting-started.md](../readme/00-overview/getting-started.md)
