# OpenClaw Compatibility Adapter Design

## Goal

Make Mira treat OpenClaw as a variable host runtime instead of a fixed CLI/config shape, so `doctor`, `start`, and `deploy` keep working across host profiles and OpenClaw versions.

## Problem

The current `mira-openclaw` runtime mixes together:

- host runtime discovery
- provider selection
- config generation
- config validation
- start/deploy orchestration

That works when the host behaves like the repo expects, but breaks when:

- the active host config is not the profile inferred from the repo path
- the installed OpenClaw CLI does not support a newer command such as `config validate --json`
- the generated local config omits a gateway default required by the host CLI

## Design

Mira should behave like an adapter layer with this order of truth:

1. Explicit overrides
2. OpenClaw runtime truth from `openclaw models status --json`
3. Filesystem candidate scan
4. Repo fallback provider env

The adapter should also distinguish between:

- fatal conditions that make Mira unusable
- compatibility gaps that should only produce warnings

## Compatibility Rules

### Host Discovery

Host runtime discovery should continue to prefer:

1. `MIRA_OPENCLAW_HOST_CONFIG_PATH`
2. `OPENCLAW_CONFIG_PATH`
3. `openclaw models status --json`
4. filesystem candidates such as `~/.openclaw/openclaw.json` and `~/.openclaw-<profile>/openclaw.json`

Workspace-based profile inference remains a last-resort hint only.

### CLI Capability Handling

Mira should not assume every OpenClaw install supports the same subcommands.

The first compatibility pass should treat:

- `openclaw models status --json` as required when available for host discovery
- `openclaw config validate --json` as optional
- `openclaw config validate` as optional
- missing validation support as `skipped`, not fatal

### Generated Config Normalization

The generated repo-local config should be normalized into a minimum runnable shape for current OpenClaw hosts.

That minimum shape includes:

- `gateway.mode = "local"`
- preserving existing template/plugin/provider behavior
- keeping host-provider inheritance and repo fallback semantics unchanged

`gateway.bind` can stay implicit for now unless a host-specific bind issue appears.

## Runtime Contract Changes

`doctor` should report:

- provider mode and source
- discovery source and candidate traces
- selected host config path and resolved default model
- config validation status as `ok`, `failed`, or `skipped`
- compatibility warnings separately from fatal issues

`start` and `deploy` should only fail on real blockers such as:

- no usable provider
- missing runtime assets
- gateway startup failure

Unsupported optional validation commands should not block startup.

## Scope For This Change

This change focuses on the minimum compatibility lift:

- normalize generated config with `gateway.mode=local`
- make config validation best-effort
- preserve existing host-first provider selection
- add regression tests for older CLI behavior

It does not yet fully split `mira-openclaw-runtime.mjs` into separate adapter modules. That remains a follow-up refactor once the contract is proven by tests.

## Success Criteria

- A host with a usable default provider can pass `doctor` without repo fallback keys.
- A host whose OpenClaw CLI lacks `config validate --json` does not fail `doctor` solely for that reason.
- The generated local config contains `gateway.mode=local`.
- `npm run start:mira-openclaw` no longer relies on `--allow-unconfigured`.
