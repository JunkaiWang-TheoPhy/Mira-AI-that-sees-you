# Notification Router Deploy

## Purpose

This directory will hold release-side deployment guidance for the outbound routing service.

## Owns

- service deploy notes
- channel environment expectations
- release-safe service composition steps

## Planned Contents

- service startup notes
- channel provider environment templates
- example routing topology

## Current Status

This directory now documents the minimal release-side startup path for the first-pass `notification-router` package.

Unified deploy comparison:

- [../deploy-paths-overview.md](../deploy-paths-overview.md)

If you want the repo-default integrated stack instead of the service in isolation, use:

- [../repo-manifest.json](../repo-manifest.json)
- [../repo.env.example](../repo.env.example)
- `npm run deploy`

To drive the same root-level commands into this service-only profile, set:

- `MIRA_DEPLOY_PROFILE=notification-router` in the repo root `.env.local`
- then use `npm start` for a foreground service or `npm run deploy` for detached mode

Platform manifests for this router-first path now live at:

- [../../Dockerfile](../../Dockerfile)
- [../../compose.yaml](../../compose.yaml)
- [../../Procfile](../../Procfile)
- [../../render.yaml](../../render.yaml)
- [../../.dockerignore](../../.dockerignore)

## Minimal Local Run

Fastest root-level path:

```bash
npm run bootstrap:notification-router
npm run deploy:notification-router
npm run status:notification-router
npm run down:notification-router
npm run start:notification-router
npm run health:notification-router
npm run self-check:notification-router
```

Container-first path:

```bash
docker build -t mira-notification-router .
docker run --rm -p 3302:3302 mira-notification-router
```

Compose path:

```bash
docker compose up --build
```

Procfile-aware path:

- platforms that honor [../../Procfile](../../Procfile) will start `npm start`
- the procfile forces `MIRA_DEPLOY_PROFILE=notification-router` and `HOST=0.0.0.0`

Render blueprint path:

- commit [../../render.yaml](../../render.yaml)
- the generated service defaults to `MIRA_DEPLOY_PROFILE=notification-router`
- `HOST=0.0.0.0` is set so the web service is reachable from the platform edge

Expected source package:

- [package.json](../../services/notification-router/package.json)
- [src/server.ts](../../services/notification-router/src/server.ts)

Expected configuration references:

- [config/env.example](../../services/notification-router/config/env.example)
- [config/outbound-policy.example.yaml](../../services/notification-router/config/outbound-policy.example.yaml)
- [env.example](./env.example)
- [start-local.sh](./start-local.sh)
- [check-health.sh](./check-health.sh)
- [dispatch-self-checkin.sh](./dispatch-self-checkin.sh)

Current root-level runtime-pack model:

1. run `npm run bootstrap:notification-router`
2. let the bootstrap generate `.mira-runtime/notification-router/.env.local`
3. optionally edit that env file for real DM or email providers
4. run `npm run deploy:notification-router` for detached one-command startup, or `npm run start:notification-router` for a foreground process
5. use `npm run status:notification-router` to confirm the detached runtime is still alive
6. verify `GET /v1/health`
7. dispatch a low-risk self check-in through `POST /v1/dispatch`

Example install:

```bash
cd services/notification-router
npm install
```

Example deploy-pack environment:

```bash
cd deploy/service-notification-router
cp env.example .env.local
```

Example startup:

```bash
npm run start:notification-router
```

Detached one-command deploy:

```bash
npm run deploy:notification-router
npm run status:notification-router
```

Detached shutdown:

```bash
npm run down:notification-router
```

Health check:

```bash
npm run health:notification-router
```

Sample self check-in dispatch:

```bash
npm run self-check:notification-router
```

Local self-check default:

- the generated `.env.local` rewrites the DM webhook to `http://127.0.0.1:$PORT/__local__/dm`
- `npm run self-check:notification-router` therefore works out of the box for local verification without an external OpenClaw DM webhook
- detached mode persists runtime state in `.mira-runtime/notification-router/runtime-process.json`
- detached mode writes stdout and stderr into `.mira-runtime/notification-router/runtime.log`

Current limitations:

- this is still a source-first development path, even though router-first container and Render manifests now exist
- the generated runtime pack still expects operator review of `.mira-runtime/notification-router/.env.local`
- real outbound delivery still requires replacing the loopback DM default with a reachable provider endpoint
- the bundled container/runtime manifests target `notification-router`, not the full `mira-openclaw` stack

The release-side composition example that connects this deploy path back to Mira core lives at:

- [examples/service-notification-router/README.md](../../examples/service-notification-router/README.md)
