# Mira OpenClaw One-Click Deploy

## Purpose

This directory documents the generated local runtime pack for the current release-safe Mira plus OpenClaw integration path.

## What The Bootstrap Creates

Running the root bootstrap command creates:

- `.mira-runtime/mira-openclaw/` with a generated `openclaw.local.json`
- `.mira-runtime/mira-openclaw/core/workspace/` with the release-safe workspace files
- `.mira-runtime/mira-openclaw/core/plugins/lingzhu-bridge/` with installable OpenClaw plugin metadata
- `.mira-runtime/notification-router/` as the local outbound sidecar runtime pack
- machine-readable runtime manifests for both packs

When a local `openclaw` CLI is available, the bootstrap also:

- installs the bundled `lingzhu` plugin shell into a repo-local OpenClaw state directory
- writes install metadata into the generated local config instead of touching `~/.openclaw/openclaw.json`

When you run `npm run start:mira-openclaw`, the runtime now also:

- probes the generated `notification-router` sidecar health endpoint
- auto-starts the sidecar if it is not already running
- tears the sidecar down again when the OpenClaw foreground process exits

## Root Commands

Use these commands from the repository root:

```bash
npm run bootstrap:mira-openclaw
npm run doctor:mira-openclaw
npm run start:mira-openclaw
```

## Environment File

The bootstrap copies [env.example](/Users/thomasjwang/Documents/GitHub/Mira/deploy/mira-openclaw/env.example) into:

- `.mira-runtime/mira-openclaw/.env.local`

Before starting, set at least:

- `MIRA_OPENCLAW_PROVIDER_API_KEY`

Optional overrides:

- `MIRA_OPENCLAW_GATEWAY_PORT`
- `MIRA_OPENCLAW_ENABLE_NOTIFICATION_ROUTER`
- `OPENCLAW_START_COMMAND`
- `OPENCLAW_BIN`

Default start behavior:

```bash
openclaw gateway run --allow-unconfigured --port 18890
```

If `OPENCLAW_START_COMMAND` is unset and a local `openclaw` binary is discoverable, `npm run start:mira-openclaw` falls back to that command automatically.

If your OpenClaw binary uses a different CLI shape, put the full command in `OPENCLAW_START_COMMAND`.

If you need to run against an already managed external `notification-router`, set `MIRA_OPENCLAW_ENABLE_NOTIFICATION_ROUTER=false`.

## Doctor Behavior

`npm run doctor:mira-openclaw` now does two checks:

- release-pack completeness and placeholder-secret inspection
- `openclaw config validate --json` against the generated repo-local config when a local `openclaw` CLI is available

## Current Scope

This path now boots a valid local OpenClaw runtime pack for the release-safe Mira core plus the bundled `lingzhu` plugin shell.

It does not yet restore the full live Lingzhu HTTP transport from the private runtime.
