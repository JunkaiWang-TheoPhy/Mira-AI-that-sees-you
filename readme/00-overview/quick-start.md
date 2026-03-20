# Quick Start

## Purpose

This page helps new readers choose the right first path inside the current Mira release tree.

If you already know you want the recommended order instead of a comparison view, use:

- [getting-started.md](./getting-started.md)

## The Four Current Paths

### 1. Default Repo Deploy

Start here if you want the closest thing to "clone the repo and run it".

Use:

- [../../README.md](../../README.md)
- [../../deploy/deploy-paths-overview.md](../../deploy/deploy-paths-overview.md)
- [../../deploy/mira-openclaw/README.md](../../deploy/mira-openclaw/README.md)

This path proves:

- the repo has a root-level deploy contract through `npm run bootstrap`, `npm start`, and `npm run deploy`
- Mira uses host-first OpenClaw provider discovery and falls back to repo env only when needed
- the generated local OpenClaw config is normalized for compatibility, including `gateway.mode=local`
- older OpenClaw CLIs can skip config validation without blocking `doctor`

### 2. Minimal Core

Start here if you want to understand Mira itself before adding modules or services.

Use:

- [../../examples/minimal-core/README.md](../../examples/minimal-core/README.md)
- [../../deploy/core/README.md](../../deploy/core/README.md)

This path proves:

- Mira core can stand on its own
- persona, workspace, config, and the release-safe `lingzhu` core plugin can be explained without Home Assistant

### 3. Home Stack

Go here next if you want to see Mira extended by the first-party flagship module.

Use:

- [../../examples/home-stack/README.md](../../examples/home-stack/README.md)
- [../../deploy/module-home-assistant/README.md](../../deploy/module-home-assistant/README.md)

This path proves:

- `core/` and `modules/home-assistant/` stay separate
- Home Assistant is a first-party module, not part of core identity

### 4. Core Plus Notification Router

Choose this when you want to see Mira core composed with an outbound service.

Use:

- [../../examples/service-notification-router/README.md](../../examples/service-notification-router/README.md)
- [../../deploy/service-notification-router/README.md](../../deploy/service-notification-router/README.md)

This path proves:

- Mira can have a release-side outbound story without Home Assistant
- outbound behavior stays policy-gated through `notification-router`

## Recommended Order

If you are reading this release tree for the first time, use this order:

1. default repo deploy
2. `minimal-core`
3. `home-stack`
4. `service-notification-router`

That order matches the architecture:

1. see the runnable repo contract first
2. understand core
3. add the first-party flagship module
4. add the first outbound service path

## If You Only Want One Path

- Choose the default repo deploy path if you care most about "can this repo run now?".
- Choose `minimal-core` if you care most about Mira identity and release structure.
- Choose `home-stack` if you care most about household execution.
- Choose `service-notification-router` if you care most about outbound delivery and policy.
