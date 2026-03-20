# Mira Released Version

> 有些关心 不需要开口


Mira is a companion-style agent release built on OpenClaw.

This directory is the staging root for a standalone public repository that will package Mira as:

- a clean core
- official first-party modules
- hardware-facing bridges
- deployable examples
- release-grade documentation

It is not intended to be a raw mirror of the current devbox runtime or a dump of the full prototype workspace.

Current public-repo hygiene companions:

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [package.json](./package.json)
- [LICENSE](./LICENSE)

## Quick Start

The current fastest way into this release tree is:

- [readme/00-overview/quick-start.md](./readme/00-overview/quick-start.md)

The current repo-level one-command path is:

```bash
npm run bootstrap
cp deploy/repo.env.example .env.local
# edit .env.local
# keep MIRA_DEPLOY_PROFILE=mira-openclaw for the default integrated stack
# leave MIRA_OPENCLAW_PROVIDER_API_KEY=replace-me if the host OpenClaw already
# has a usable default provider; otherwise set OPENAI_API_KEY or the
# MIRA_OPENCLAW_PROVIDER_* repo fallback values
# or set MIRA_DEPLOY_PROFILE=notification-router for router-only

npm start
```

The current ordered onboarding path is:

- [readme/00-overview/getting-started.md](./readme/00-overview/getting-started.md)
- [deploy/deploy-paths-overview.md](./deploy/deploy-paths-overview.md)

That page compares the current real paths, including the repo-level default stack entrypoint.

Current root-level one-command local deploy entrypoints:

```bash
npm run bootstrap
npm run deploy
npm start
npm run status
npm run health
npm run self-check
npm run down

npm run deploy:notification-router
npm run status:notification-router
npm run self-check:notification-router

npm run deploy:mira-openclaw
npm run status:mira-openclaw
npm run health:mira-openclaw
```

Both deploy paths write runtime state under `.mira-runtime/`, including per-stack `runtime-process.json` and `runtime.log` files.

Use `npm start` when the host expects a standard foreground process. Use `npm run deploy` when you want the repo to detach and manage its own background supervisor.
The direct `mira-openclaw` profile commands also load the repo root `.env` and `.env.local`, so one root env file can drive both `npm start` and `npm run doctor:mira-openclaw`.

The repo-level machine-readable deploy contract now lives at:

- [deploy/repo-manifest.json](./deploy/repo-manifest.json)
- [deploy/repo.env.example](./deploy/repo.env.example)
- [Dockerfile](./Dockerfile)
- [compose.yaml](./compose.yaml)
- [Procfile](./Procfile)
- [render.yaml](./render.yaml)

For the integrated `mira-openclaw` profile, provider resolution is now host-first:

- explicit host config overrides such as `MIRA_OPENCLAW_HOST_CONFIG_PATH` or `OPENCLAW_CONFIG_PATH` win first
- otherwise ask OpenClaw itself through `openclaw models status --json` and treat its `configPath`, `agentDir`, and `resolvedDefault` as the primary runtime truth
- only if that CLI discovery is unusable does Mira scan filesystem candidates such as `~/.openclaw/openclaw.json` and named-profile paths like `~/.openclaw-main/openclaw.json`
- accept host defaults resolved by OpenClaw itself, including built-in providers declared only by the default model ref and custom providers stored under `agents/<id>/agent/models.json`
- fall back to repo `MIRA_OPENCLAW_PROVIDER_*` env values only when the host has no usable default provider
- support `MIRA_OPENCLAW_PROVIDER_MODE=auto|host-only|repo-only` when you need to force host inheritance or repo fallback behavior
- keep workspace profile inference as a last-resort filesystem hint rather than the primary source of truth
- allow explicit overrides through `MIRA_OPENCLAW_HOST_PROFILE` or `MIRA_OPENCLAW_HOST_CONFIG_PATH`
- fail fast with guidance when neither source is configured

`npm run doctor:mira-openclaw` now reports the selected discovery source, attempted `hostCandidates[]`, repo fallback status, and the active host `configPath`, `agentDir`, `stateDir`, and `resolvedDefault`, so it is obvious when Mira followed `openclaw-cli` truth versus a filesystem fallback.

The generated local OpenClaw runtime config is also normalized for compatibility now: Mira writes `gateway.mode=local` into the repo-local `openclaw.local.json`, and `doctor` treats unsupported `openclaw config validate` subcommands as warnings rather than fatal startup blockers on older OpenClaw CLIs.

The repo-level integrated deploy path now also uses a wider default health window of `45000ms`, configurable through `MIRA_OPENCLAW_HEALTH_TIMEOUT_MS` in the root `.env.local`, so slower host OpenClaw boots do not fail one-command deploys prematurely.

## Current Status

`Mira_Released_Version/` is under active assembly.

What already exists in this release tree:

- a repo-level one-command deploy contract through `npm run bootstrap`, `npm start`, and `npm run deploy`
- two root-selectable deploy profiles: `mira-openclaw` and `notification-router`
- a committed machine-readable deploy manifest and root env template
- a router-first `Dockerfile`, `compose.yaml`, `Procfile`, and `render.yaml` for common URL deployers and container platforms
- the first-party `Home Assistant` flagship module scaffold
- a release-oriented device registry example
- the first `sceneResolver` planning skeleton
- module-level architecture specs
- the first release-side `readme/`, `core/`, `services/`, and `deploy/` skeleton
- the first migrated `core/` files for persona, workspace, and config
- the first minimal-core onboarding path
- the first home-stack onboarding path
- a first Git-ready release baseline document
- an open-source readiness checklist

What is not fully migrated yet:

- the remaining non-template `core/` runtime materials outside the current release-safe set
- additional modules such as wearable, Apple, printer, and channel integrations
- most release-side `docs/` and `examples/` contents

Current container/platform scope:

- [Dockerfile](./Dockerfile), [compose.yaml](./compose.yaml), [Procfile](./Procfile), and [render.yaml](./render.yaml) default to the `notification-router` profile
- the root [Dockerfile](./Dockerfile) now also bundles the `openclaw` CLI, so direct Docker/Compose users can override `MIRA_DEPLOY_PROFILE=mira-openclaw`
- [render.yaml](./render.yaml) remains router-first because its health check is HTTP `/v1/health`

So this directory should be read as:

- a release architecture in progress
- a repo with local one-command deploy support for the current release-safe paths
- not yet a full migration of every private-runtime capability

## What Mira Is

Mira is designed as:

- OpenClaw-native
- channel-agnostic
- policy-driven
- companion-oriented
- memory-aware

That means:

- OpenClaw provides runtime, sessions, skills, plugins, and channel surfaces
- Mira provides persona, memory behavior, interaction policy, and proactive logic
- modules extend Mira into concrete domains such as household control

## What This Release Is Not

This release should not become:

- a single-vendor bot
- a raw Home Assistant wrapper
- a direct hardware protocol stack
- a devbox backup in public form

The release goal is a clean public structure, not a private-runtime snapshot.

## Release Model

The target release shape is:

```text
Mira_Released_Version/
├─ README.md
├─ LICENSE
├─ readme/
├─ core/
├─ modules/
├─ hardware/
├─ apps/
├─ services/
├─ examples/
├─ deploy/
└─ docs/
```

The release shell now includes a second public-facing navigation layer for:

- modules
- apps
- examples
- deploy subpaths
- internal release docs

### Documentation Portal

The first release-side documentation portal now exists under:

- [readme/README.md](./readme/README.md)

Its current sections are:

- [00-overview](./readme/00-overview/README.md)
- [10-core](./readme/10-core/README.md)
- [20-modules](./readme/20-modules/README.md)
- [30-hardware](./readme/30-hardware/README.md)
- [40-deploy](./readme/40-deploy/README.md)
- [50-development](./readme/50-development/README.md)

The first concrete contributor-facing development guide now exists at:

- [readme/50-development/contributing-and-migration.md](./readme/50-development/contributing-and-migration.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)

The current release-baseline companions now also exist at:

- [docs/migration/release-baseline.md](./docs/migration/release-baseline.md)
- [docs/migration/open-source-readiness-checklist.md](./docs/migration/open-source-readiness-checklist.md)
- [docs/migration/repository-split-readiness.md](./docs/migration/repository-split-readiness.md)
- [docs/migration/package-and-license-decisions.md](./docs/migration/package-and-license-decisions.md)
- [docs/migration/repository-split-checklist.md](./docs/migration/repository-split-checklist.md)

The release root now also provides a shared verification entrypoint:

- `npm run bootstrap`
- `npm start`
- `npm run deploy`
- `npm run status`
- `npm run health`
- `npm run self-check`
- `npm run down`
- `npm run verify:release`
- `npm run export:repo`

### Core

The smallest independently deployable Mira package:

- persona workspace
- runtime config
- baseline skills and plugins
- memory and interaction foundations

The release-side skeleton now exists under:

- [core/README.md](./core/README.md)

The first real migrated core files now include:

- [core/persona/SOUL.md](./core/persona/SOUL.md)
- [core/persona/IDENTITY.md](./core/persona/IDENTITY.md)
- [core/workspace/AGENTS.md](./core/workspace/AGENTS.md)
- [core/workspace/MEMORY.md](./core/workspace/MEMORY.md)
- [core/workspace/OUTBOUND_POLICY.md](./core/workspace/OUTBOUND_POLICY.md)
- [core/workspace/TOOLS.md](./core/workspace/TOOLS.md)
- [core/openclaw-config/agent-defaults-snippet.json5](./core/openclaw-config/agent-defaults-snippet.json5)
- [core/openclaw-config/custom-right-codes-vision-snippet.example.json5](./core/openclaw-config/custom-right-codes-vision-snippet.example.json5)
- [core/openclaw-config/lingzhu-config-snippet.example.json5](./core/openclaw-config/lingzhu-config-snippet.example.json5)
- [core/openclaw-config/lingzhu-system-prompt.txt](./core/openclaw-config/lingzhu-system-prompt.txt)
- [core/openclaw-config/openclaw.example.json](./core/openclaw-config/openclaw.example.json)
- [core/openclaw-config/minimal-runtime-contract.md](./core/openclaw-config/minimal-runtime-contract.md)

The first release-safe core plugin package now also exists:

- [core/plugins/lingzhu-bridge/README.md](./core/plugins/lingzhu-bridge/README.md)

The minimal-core path now explicitly includes both the release-safe config and the release-safe core plugin path:

- [core/openclaw-config/openclaw.example.json](./core/openclaw-config/openclaw.example.json)
- [examples/minimal-core/README.md](./examples/minimal-core/README.md)

The first core-plus-service composition path now exists through:

- [examples/service-notification-router/README.md](./examples/service-notification-router/README.md)
- [deploy/service-notification-router/README.md](./deploy/service-notification-router/README.md)

The current repo-default integrated entrypoint now also exists through:

- [deploy/mira-openclaw/README.md](./deploy/mira-openclaw/README.md)

### Modules

Official optional capability layers such as:

- Home Assistant
- wearable integrations
- Apple-facing integrations
- local device bridges

The module shell now includes:

- [modules/README.md](./modules/README.md)
- [modules/home-assistant/README.md](./modules/home-assistant/README.md)
- [modules/home-assistant/config/README.md](./modules/home-assistant/config/README.md)

### Hardware

Concrete device-side adapters, sidecars, and setup notes.

### Apps

The future release-side application area now has an explicit entrypoint:

- [apps/README.md](./apps/README.md)

### Services

Longer-running backend components such as:

- notification routing
- auth gateways
- future memory or sync helpers

The first reserved release-side service entry is:

- [services/notification-router/README.md](./services/notification-router/README.md)

The first release-safe notification-router package files now include:

- [services/notification-router/config/outbound-policy.example.yaml](./services/notification-router/config/outbound-policy.example.yaml)
- [services/notification-router/config/env.example](./services/notification-router/config/env.example)
- [services/notification-router/src/README.md](./services/notification-router/src/README.md)
- [services/notification-router/src/server.ts](./services/notification-router/src/server.ts)
- [services/notification-router/src/types.ts](./services/notification-router/src/types.ts)
- [services/notification-router/docs/runtime-contract.md](./services/notification-router/docs/runtime-contract.md)

The current deploy stories are now intentionally unified through:

- [deploy/deploy-paths-overview.md](./deploy/deploy-paths-overview.md)

## First Public Module

The first module intentionally being shaped inside this release tree is:

- `modules/home-assistant/`

This is Mira's first-party flagship home-control module.

Its architectural center is:

- typed tools
- scene orchestration
- wearable and presence policy mapping
- ecosystem registry

It exists outside `core/` because Mira's identity is not Home Assistant.
Home Assistant is the current strongest execution surface for the home environment.

The first module onboarding path now exists through:

- [examples/home-stack/README.md](./examples/home-stack/README.md)
- [deploy/module-home-assistant/README.md](./deploy/module-home-assistant/README.md)
- [modules/home-assistant/config/home-assistant-module.example.json](./modules/home-assistant/config/home-assistant-module.example.json)

The first advanced path that combines the flagship module with the outbound service now exists through:

- [examples/home-stack-with-notification-router/README.md](./examples/home-stack-with-notification-router/README.md)

## Available Now

The following files are already present and usable as release-facing references:

### Home Assistant Module Spec

- [scene-resolver-policy-coordination-spec.md](./modules/home-assistant/docs/scene-resolver-policy-coordination-spec.md)

This defines how the future scene resolver should coordinate with:

- the device registry
- risk policy
- confirmation policy
- outbound policy

### Registry Example

- [devices.example.json](./modules/home-assistant/registry/devices.example.json)

This is the current example registry for release-facing home devices and scene bindings.

### Plugin Skeleton

- [loadDevicesRegistry.ts](./modules/home-assistant/plugin/src/registry/loadDevicesRegistry.ts)
- [sceneDefinitions.ts](./modules/home-assistant/plugin/src/scenes/sceneDefinitions.ts)
- [sceneResolver.ts](./modules/home-assistant/plugin/src/scenes/sceneResolver.ts)

These files establish the first TypeScript skeleton for:

- loading normalized release-side device metadata
- declaring scenes
- resolving a scene into a plan instead of executing side effects directly

### Release Skeleton

The release-side public scaffold now includes:

- [readme/README.md](./readme/README.md)
- [core/README.md](./core/README.md)
- [modules/README.md](./modules/README.md)
- [services/README.md](./services/README.md)
- [deploy/README.md](./deploy/README.md)
- [examples/README.md](./examples/README.md)
- [docs/README.md](./docs/README.md)
- [apps/README.md](./apps/README.md)

The first migrated core content is now present inside `core/`, so this release tree is no longer just a pure directory shell.

### Minimal Core Path

The first core-only onboarding path now exists through:

- [examples/minimal-core/README.md](./examples/minimal-core/README.md)
- [deploy/core/README.md](./deploy/core/README.md)
- [core/openclaw-config/openclaw.example.json](./core/openclaw-config/openclaw.example.json)

## Public Design Principles

The release should follow these rules:

1. `core` must stand on its own.
2. Modules must be explicit, not hidden inside runtime snapshots.
3. Hardware-specific logic should stay outside the Mira identity layer.
4. Memory, policy, and safe action boundaries are first-class architecture concerns.
5. Communication channels should stay OpenClaw-native and channel-agnostic.
6. Public release docs should explain the system clearly without exposing private runtime state.

## Recommended Reading Path

If you are new to this release tree, read in this order:

1. this `README.md`
2. `readme/README.md`
3. `core/README.md`
4. `modules/home-assistant/docs/scene-resolver-policy-coordination-spec.md`
5. `modules/home-assistant/registry/devices.example.json`
6. `modules/home-assistant/plugin/src/scenes/sceneDefinitions.ts`
7. `modules/home-assistant/plugin/src/scenes/sceneResolver.ts`

That gives you:

- release intent
- module boundaries
- data model
- planning skeleton

## Roadmap

Near-term release work is expected to add:

1. `core/` persona and runtime skeleton
2. additional module skeletons
3. `services/notification-router/`
4. release-side deploy examples
5. public `readme/` and `docs/` trees

The current scaffold pass has started turning `modules/`, `apps/`, `examples/`, `deploy/`, and `docs/` into explicit release entrypoints rather than placeholders only.

## Contribution Direction

While this release tree is still being assembled, contributions should favor:

- small, explicit module boundaries
- typed interfaces
- safe defaults
- release-facing docs
- configuration templates instead of private live data

Avoid contributing:

- private credentials
- raw session history
- live memory databases
- environment-specific absolute assumptions

## One-Line Summary

`Mira_Released_Version/` is the future public home of Mira: a clean, modular, OpenClaw-native companion agent release with explicit module, hardware, memory, and policy boundaries.
