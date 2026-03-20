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

The generated `openclaw.local.json` is normalized for compatibility with current OpenClaw gateway CLIs and now includes `gateway.mode=local` by default.

When a local `openclaw` CLI is available, the bootstrap also:

- installs the bundled `lingzhu` plugin shell into a repo-local OpenClaw state directory
- writes install metadata into the generated local config instead of touching `~/.openclaw/openclaw.json`

When you run `npm run start:mira-openclaw`, the runtime now also:

- probes the generated `notification-router` sidecar health endpoint
- auto-starts the sidecar if it is not already running
- tears the sidecar down again when the OpenClaw foreground process exits

When you run `npm run deploy:mira-openclaw`, the runtime instead:

- bootstraps the release-safe Mira runtime pack if needed
- starts a detached integrated-stack supervisor and waits for the sidecar plus gateway health checks to pass
- records the supervisor pid in `.mira-runtime/mira-openclaw/runtime-process.json`
- writes runtime logs into `.mira-runtime/mira-openclaw/runtime.log`

## Root Commands

Use these commands from the repository root:

```bash
npm start
npm run deploy
npm run status
npm run health
npm run self-check
npm run down

npm run bootstrap:mira-openclaw
npm run deploy:mira-openclaw
npm run status:mira-openclaw
npm run down:mira-openclaw
npm run doctor:mira-openclaw
npm run start:mira-openclaw
npm run health:mira-openclaw
npm run self-check:mira-openclaw
```

## Environment File

Fastest repo-level path:

```bash
cp deploy/repo.env.example .env.local
# edit .env.local
# keep MIRA_DEPLOY_PROFILE=mira-openclaw
# leave MIRA_OPENCLAW_PROVIDER_API_KEY=replace-me if the host OpenClaw already
# has a usable default provider; otherwise set OPENAI_API_KEY or the
# MIRA_OPENCLAW_PROVIDER_* repo fallback values
npm start
```

Detached mode stays available too:

```bash
npm run deploy
```

The foreground `npm start` path is the platform-friendly default when the host expects the main process to stay attached.

Direct profile commands such as `npm run doctor:mira-openclaw` and `npm run start:mira-openclaw`
now also load the repo root `.env` and `.env.local` before the generated runtime-pack env file,
so a single root `.env.local` can drive both the repo-level and profile-level entrypoints.

Container path:

- [../../Dockerfile](../../Dockerfile) now bundles the `openclaw` CLI
- override `MIRA_DEPLOY_PROFILE=mira-openclaw` to switch the same image from router-first startup into the integrated stack
- provide either a host OpenClaw default provider or repo fallback `OPENAI_API_KEY` / `MIRA_OPENCLAW_PROVIDER_*` env values
- [../../compose.yaml](../../compose.yaml) exposes an optional `mira-openclaw` compose profile for this path

The bootstrap copies [env.example](./env.example) into:

- `.mira-runtime/mira-openclaw/.env.local`

Provider resolution order is now:

- use `MIRA_OPENCLAW_HOST_CONFIG_PATH` or `OPENCLAW_CONFIG_PATH` first when you explicitly point Mira at a host config
- otherwise run `openclaw models status --json` and treat its `configPath`, `agentDir`, and `resolvedDefault` as the active host runtime truth
- only if that CLI result is unusable does Mira scan filesystem candidates such as `~/.openclaw/openclaw.json` and named-profile paths like `~/.openclaw-main/openclaw.json`
- accept host defaults that OpenClaw resolves from built-in providers or `agents/<id>/agent/models.json`, even when `openclaw.json` itself does not spell out a custom `models.providers` block
- keep workspace-driven profile inference as a last-resort candidate, not the primary discovery path
- fall back to `OPENAI_API_KEY` or the repo `MIRA_OPENCLAW_PROVIDER_*` env values only if the host has no usable default provider
- support `MIRA_OPENCLAW_PROVIDER_MODE=auto|host-only|repo-only` when you want to force host inheritance or repo fallback behavior
- fail fast with next-step guidance if neither source is usable

`npm run doctor:mira-openclaw` surfaces the discovery source, attempted `hostCandidates[]`, repo fallback status, and the selected host `configPath`, `agentDir`, `stateDir`, and `resolvedDefault` so operators can see whether Mira trusted `openclaw-cli` or a filesystem fallback.

Optional host-provider overrides:

- `MIRA_OPENCLAW_HOST_PROFILE`
- `MIRA_OPENCLAW_HOST_CONFIG_PATH`

Only set this when you need the repo fallback provider path:

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MIRA_OPENCLAW_PROVIDER_API_KEY`

Optional overrides:

- `MIRA_OPENCLAW_GATEWAY_PORT`
- `MIRA_OPENCLAW_HEALTH_TIMEOUT_MS`
- `MIRA_OPENCLAW_ENABLE_NOTIFICATION_ROUTER`
- `OPENCLAW_START_COMMAND`
- `OPENCLAW_BIN`

Default start behavior:

```bash
openclaw gateway run --port 18890
```

If `OPENCLAW_START_COMMAND` is unset and a local `openclaw` binary is discoverable, `npm run start:mira-openclaw` falls back to that command automatically.

If your OpenClaw binary uses a different CLI shape, put the full command in `OPENCLAW_START_COMMAND`.

If you need to run against an already managed external `notification-router`, set `MIRA_OPENCLAW_ENABLE_NOTIFICATION_ROUTER=false`.

## Doctor Behavior

`npm run doctor:mira-openclaw` now does two checks:

- release-pack completeness and placeholder-secret inspection
- best-effort `openclaw config validate` against the generated repo-local config when a local `openclaw` CLI is available

If the installed OpenClaw CLI does not support `config validate --json` or `config validate`, Mira records that validation as `skipped` and keeps it as a warning instead of a fatal failure.

`npm run deploy:mira-openclaw` now waits up to `45000ms` for the integrated stack to become healthy by default. Override that startup budget with `MIRA_OPENCLAW_HEALTH_TIMEOUT_MS` when the host is faster or slower than the default.

`npm run health:mira-openclaw` checks the integrated stack shape:

- the generated runtime pack still passes local inspection
- `notification-router` answers `GET /v1/health`
- the OpenClaw gateway port is listening on `127.0.0.1`

`npm run self-check:mira-openclaw` runs that same integrated health gate first, then dispatches the local `notification-router` self-check path.

`npm run status:mira-openclaw` reports whether the detached supervisor pid is still alive and includes the current integrated health payload when it is.

`npm run down:mira-openclaw` stops that detached supervisor and clears the generated process-state file.

The repo-level defaults in [../repo-manifest.json](../repo-manifest.json) delegate to this integrated profile.

Those repo-level defaults load root `.env` and `.env.local` automatically before delegating to the integrated stack.

## Current Scope

This path now boots a valid local OpenClaw runtime pack for the release-safe Mira core plus the bundled `lingzhu` plugin shell.

It does not yet restore the full live Lingzhu HTTP transport from the private runtime.
