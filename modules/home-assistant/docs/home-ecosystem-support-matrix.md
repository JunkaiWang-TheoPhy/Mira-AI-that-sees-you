# Home Ecosystem Support Matrix

This matrix defines the current Wave 2 declaration layer for Mira's single `Home Assistant` flagship module.

It formalizes 12 named smart-home entries without claiming 12 live direct-runtime implementations.

| Entry | ID | Support Level | Runtime Path | Direct Adapter | Operator Prerequisites | Current Status |
| --- | --- | --- | --- | --- | --- | --- |
| Amazon Alexa | `amazon-alexa` | `readiness_onboarding_only` | `readiness_only` | readiness-only Alexa boundary | review future account-linking requirements | onboarding-only declaration in this repo |
| Apple Home | `apple-home` | `ha_first` | `home_assistant` | none in Wave 2 | expose Apple-facing entities through Home Assistant | declared as HA-first |
| HomeKit | `homekit` | `ha_first` | `home_assistant` | none in Wave 2 | configure Home Assistant HomeKit bridge or controller path | declared as HA-first |
| Xiaomi / Mi Home | `xiaomi-mi-home` | `ha_first` | `home_assistant` | none in Wave 2 | map Xiaomi devices into Home Assistant | declared as HA-first |
| Matter | `matter` | `ha_first` | `home_assistant` | none in Wave 2 | expose Matter devices as Home Assistant entities | declared as HA-first |
| Aqara | `aqara` | `ha_first` | `home_assistant` | none in Wave 2 | expose Aqara devices through Home Assistant or a compatible bridge | declared as HA-first |
| Tuya / Smart Life | `tuya-smart-life` | `ha_first` | `home_assistant` | none in Wave 2 | confirm Tuya or Smart Life devices are visible in Home Assistant | declared as HA-first |
| SwitchBot | `switchbot` | `ha_first` | `home_assistant` | none in Wave 2 | expose SwitchBot devices through Home Assistant | declared as HA-first |
| Philips Hue | `philips-hue` | `ha_first_optional_direct_adapter` | `home_assistant` | optional runtime now exists at `modules/home-assistant/direct-adapters/hue/src/index.ts` | keep Home Assistant as the default route and wire direct bridge access deliberately | declared as HA-first plus optional release-side runtime |
| Google Home / Nest | `google-home-nest` | `ha_first` | `home_assistant` | none in Wave 2 | expose Google Home or Nest devices through Home Assistant-backed entities | declared as HA-first |
| Lutron | `lutron` | `ha_first` | `home_assistant` | none in Wave 2 | expose Lutron bridge-backed devices through Home Assistant | declared as HA-first |
| SmartThings | `smartthings` | `ha_first` | `home_assistant` | none in Wave 2 | expose SmartThings devices through Home Assistant | declared as HA-first |

## Interpretation

- `ha_first` means the current release-side module expects Home Assistant to remain the default runtime plane.
- `ha_first_optional_direct_adapter` means Home Assistant stays the default path, while a release-side optional runtime package can coexist without becoming the default route.
- `readiness_onboarding_only` means the repo only declares setup and onboarding posture for that entry in Wave 2.

## Scope Boundary

This matrix does not mean:

- 12 separate modules exist
- live direct adapters ship for all declared ecosystems
- all 12 entries already have live direct-control runtime coverage

It means the release-side `Home Assistant` module now explicitly declares support coverage for these 12 named entries.
