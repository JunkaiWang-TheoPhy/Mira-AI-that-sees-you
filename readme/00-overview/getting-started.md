# Getting Started

## Purpose

This page gives the recommended reading and setup order for the current release tree.

## Recommended Onboarding Sequence

### Step 1: Start With The Default Repo Deploy Story

Read:

- [../../README.md](../../README.md)
- [../../deploy/deploy-paths-overview.md](../../deploy/deploy-paths-overview.md)
- [../../deploy/mira-openclaw/README.md](../../deploy/mira-openclaw/README.md)
- [../../deploy/repo.env.example](../../deploy/repo.env.example)

Outcome:

- you know the root-level `bootstrap/start/deploy/status/health/self-check/down` contract
- you know the default integrated path is host-provider-first, repo-fallback-second
- you know the current compatibility behavior for older OpenClaw CLIs and slower gateway startups

### Step 2: Understand Mira Core

Read:

- [../../examples/minimal-core/README.md](../../examples/minimal-core/README.md)
- [../../deploy/core/README.md](../../deploy/core/README.md)
- [../../core/openclaw-config/openclaw.example.json](../../core/openclaw-config/openclaw.example.json)
- [../../core/plugins/lingzhu-bridge/README.md](../../core/plugins/lingzhu-bridge/README.md)

Outcome:

- you understand the smallest release-safe Mira setup
- you know how core config, workspace, and the release-safe Lingzhu plugin fit together

### Step 3: Choose One Expansion Path

From here, choose one of two directions:

- household execution:
  [../../examples/home-stack/README.md](../../examples/home-stack/README.md)
- outbound service:
  [../../examples/service-notification-router/README.md](../../examples/service-notification-router/README.md)

Use `home-stack` first if you care about Home Assistant and scene orchestration.

Use `service-notification-router` first if you care about outbound delivery, email, DM, and policy gating.

### Step 4: Follow The Matching Deploy Story

If you chose the Home Assistant path, continue with:

- [../../deploy/module-home-assistant/README.md](../../deploy/module-home-assistant/README.md)

If you chose the outbound service path, continue with:

- [../../deploy/service-notification-router/README.md](../../deploy/service-notification-router/README.md)

### Step 5: Use The Advanced Combined Path

After both the Home Assistant and notification-router paths are clear, use:

- [../../examples/home-stack-with-notification-router/README.md](../../examples/home-stack-with-notification-router/README.md)

Outcome:

- you understand the current release-side story for `core + module + service`

## If You Are New

The shortest safe order is:

1. default repo deploy
2. `minimal-core`
3. `home-stack` or `service-notification-router`
4. `home-stack-with-notification-router`

## If You Only Need One Goal

- For the fastest runnable path, stop after the default repo deploy story.
- For Mira identity and release structure, stop after `minimal-core`.
- For household execution, stop after `home-stack`.
- For outbound delivery, stop after `service-notification-router`.
- For the broadest current release-side composition story, end at `home-stack-with-notification-router`.
