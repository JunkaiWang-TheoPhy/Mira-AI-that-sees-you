# Home Assistant Module Package Assembly Checklist

## Purpose

This checklist defines what must be present before the release-side Home Assistant module can be treated as a stable module package.

## Required Package Elements

- [../README.md](../README.md)
- [../config/home-assistant-module.example.json](../config/home-assistant-module.example.json)
- [../registry/devices.example.json](../registry/devices.example.json)
- [../plugin/package.json](../plugin/package.json)
- [../plugin/tsconfig.json](../plugin/tsconfig.json)
- [../plugin/src/README.md](../plugin/src/README.md)
- [module-runtime-contract.md](./module-runtime-contract.md)
- [scene-resolver-policy-coordination-spec.md](./scene-resolver-policy-coordination-spec.md)

## What Still Counts As Incomplete

The release-side module should still be considered in-progress if any of these are missing:

- clear package metadata
- source-boundary doc for the plugin
- runtime contract doc
- registry example
- scene coordination spec
- operator-facing deploy path

## Matching Deploy Path

- [../../../deploy/module-home-assistant/README.md](../../../deploy/module-home-assistant/README.md)

This checklist is about release-side module completeness. It is not a statement that the current root one-command deploy already bundles the module by default.
