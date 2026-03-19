# Package And License Decisions

## Purpose

This document records the current release-side policy for package naming, lockfiles, and repository license metadata.

## Package Namespace Policy

Current release-side package naming should prefer:

- `@mira-release/*`

That policy is already reflected in:

- [core/plugins/lingzhu-bridge/package.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/plugins/lingzhu-bridge/package.json)
- [modules/home-assistant/plugin/package.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/plugin/package.json)
- [services/notification-router/package.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/package.json)

The release-root workspace entrypoint now lives at:

- [package.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/package.json)

## Lockfile Policy

Current release-side state:

- `services/notification-router/package-lock.json` exists
- `core/plugins/lingzhu-bridge/package-lock.json` exists

Current recommendation:

- keep lockfiles for runnable release-side packages
- do not add lockfiles for directories that are still documentation shells

## License Status

The release tree now carries a final top-level `LICENSE`:

- [../../LICENSE](/Users/thomasjwang/Documents/GitHub/Mira/LICENSE)

The selected repository license is GNU Affero General Public License v3.0.

For machine-readable package metadata, the release tree uses the SPDX identifier `AGPL-3.0-only`.

## Short Recommendation

Before public launch, keep these aligned:

1. keep the top-level `LICENSE` and package metadata on AGPL-3.0
2. keep `@mira-release/*` as the public package namespace unless a new repo name makes a different namespace more appropriate
3. keep lockfiles only for packages that are actually runnable inside the release tree
