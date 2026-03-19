import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");
const DEFAULT_ROOT = resolve(__dirname, "..");

const REQUIRED_FILES = [
  "README.md",
  "CONTRIBUTING.md",
  "CHANGELOG.md",
  "LICENSE",
  ".gitignore",
  "docs/migration/source-to-release-mapping.md",
  "docs/migration/release-baseline.md",
  "docs/migration/open-source-readiness-checklist.md",
  "docs/migration/repository-split-readiness.md",
  "docs/migration/package-and-license-decisions.md",
  "deploy/deploy-paths-overview.md",
  "core/openclaw-config/openclaw.example.json",
  "core/openclaw-config/minimal-runtime-contract.md",
  "core/plugins/lingzhu-bridge/openclaw.plugin.json",
  "modules/home-assistant/config/home-assistant-module.example.json",
  "modules/home-assistant/docs/module-runtime-contract.md",
  "services/notification-router/package.json",
  "services/notification-router/docs/runtime-contract.md"
];

const JSON_FILES = [
  "package.json",
  "core/openclaw-config/openclaw.example.json",
  "core/plugins/lingzhu-bridge/openclaw.plugin.json",
  "modules/home-assistant/config/home-assistant-module.example.json",
  "modules/home-assistant/registry/devices.example.json",
  "core/plugins/lingzhu-bridge/package.json",
  "modules/home-assistant/plugin/package.json",
  "modules/home-assistant/plugin/tsconfig.json",
  "services/notification-router/package.json",
  "services/notification-router/package-lock.json",
  "services/notification-router/tsconfig.json"
];

const RELEASE_PACKAGES = [
  "core/plugins/lingzhu-bridge/package.json",
  "modules/home-assistant/plugin/package.json",
  "services/notification-router/package.json"
];

const SKIPPED_WALK_DIRECTORIES = new Set([
  ".git",
  ".mira-runtime"
]);

const EXPECTED_LICENSE = "AGPL-3.0-only";

const LICENSED_PACKAGES = [
  "package.json",
  "core/plugins/lingzhu-bridge/package.json",
  "modules/home-assistant/plugin/package.json",
  "services/notification-router/package.json"
];

function walk(rootDir, predicate, results = [], currentDir = rootDir) {
  for (const entry of readdirSync(currentDir)) {
    if (SKIPPED_WALK_DIRECTORIES.has(entry)) {
      continue;
    }
    const fullPath = join(currentDir, entry);
    const relPath = relative(rootDir, fullPath);
    const stats = statSync(fullPath);
    if (predicate(relPath, stats)) {
      results.push(relPath);
    }
    if (stats.isDirectory()) {
      walk(rootDir, predicate, results, fullPath);
    }
  }
  return results;
}

function loadJson(rootDir, relPath) {
  return JSON.parse(readFileSync(join(rootDir, relPath), "utf8"));
}

export function collectReleaseVerification(rootDir = DEFAULT_ROOT) {
  const missingFiles = REQUIRED_FILES.filter((file) => !existsSync(join(rootDir, file)));

  const invalidJson = [];
  for (const file of JSON_FILES) {
    try {
      loadJson(rootDir, file);
    } catch (error) {
      invalidJson.push({
        file,
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  const badPackageNames = [];
  for (const file of RELEASE_PACKAGES) {
    const pkg = loadJson(rootDir, file);
    if (typeof pkg.name !== "string" || !pkg.name.startsWith("@mira-release/")) {
      badPackageNames.push({ file, name: pkg.name ?? null });
    }
  }

  const badLicenseMetadata = [];
  for (const file of LICENSED_PACKAGES) {
    const pkg = loadJson(rootDir, file);
    if (pkg.license !== EXPECTED_LICENSE) {
      badLicenseMetadata.push({
        file,
        license: pkg.license ?? null
      });
    }
  }

  const lingzhuPluginPackage = loadJson(rootDir, "core/plugins/lingzhu-bridge/package.json");
  const lingzhuOpenClawExtensions = lingzhuPluginPackage.openclaw?.extensions;
  const badOpenClawPluginMetadata = [];
  if (
    !Array.isArray(lingzhuOpenClawExtensions)
    || !lingzhuOpenClawExtensions.includes("./src/index.ts")
  ) {
    badOpenClawPluginMetadata.push({
      file: "core/plugins/lingzhu-bridge/package.json",
      message: "missing openclaw.extensions entry for ./src/index.ts"
    });
  }

  const lingzhuPluginManifestPath = join(rootDir, "core/plugins/lingzhu-bridge/openclaw.plugin.json");
  if (existsSync(lingzhuPluginManifestPath)) {
    try {
      const lingzhuPluginManifest = loadJson(rootDir, "core/plugins/lingzhu-bridge/openclaw.plugin.json");
      const lingzhuPackageLeafName =
        typeof lingzhuPluginPackage.name === "string"
          ? lingzhuPluginPackage.name.split("/").at(-1)
          : null;
      if (lingzhuPackageLeafName !== lingzhuPluginManifest.id) {
        badOpenClawPluginMetadata.push({
          file: "core/plugins/lingzhu-bridge/package.json",
          message: `package name leaf must align with plugin id '${lingzhuPluginManifest.id}'`
        });
      }
    } catch {
      // invalid-json-files already records malformed plugin manifests
    }
  }

  const forbiddenArtifacts = walk(
    rootDir,
    (relPath, stats) =>
      stats.isDirectory() && relPath.endsWith("node_modules")
  );

  return {
    rootDir,
    missingFiles,
    invalidJson,
    badPackageNames,
    badLicenseMetadata,
    badOpenClawPluginMetadata,
    forbiddenArtifacts,
    ok:
      missingFiles.length === 0 &&
      invalidJson.length === 0 &&
      badPackageNames.length === 0 &&
      badLicenseMetadata.length === 0 &&
      badOpenClawPluginMetadata.length === 0 &&
      forbiddenArtifacts.length === 0
  };
}

export function formatReleaseVerification(result) {
  const lines = [];
  lines.push(`# Mira Release Verification`);
  lines.push(`root: ${result.rootDir}`);
  lines.push(`status: ${result.ok ? "ok" : "fail"}`);
  lines.push(`required-files-missing: ${result.missingFiles.length}`);
  lines.push(`invalid-json-files: ${result.invalidJson.length}`);
  lines.push(`bad-package-names: ${result.badPackageNames.length}`);
  lines.push(`bad-license-metadata: ${result.badLicenseMetadata.length}`);
  lines.push(`bad-openclaw-plugin-metadata: ${result.badOpenClawPluginMetadata.length}`);
  lines.push(`forbidden-artifacts: ${result.forbiddenArtifacts.length}`);

  if (result.missingFiles.length > 0) {
    lines.push(`missing:`);
    for (const file of result.missingFiles) lines.push(`- ${file}`);
  }

  if (result.invalidJson.length > 0) {
    lines.push(`invalid-json:`);
    for (const item of result.invalidJson) lines.push(`- ${item.file}: ${item.message}`);
  }

  if (result.badPackageNames.length > 0) {
    lines.push(`bad-package-names:`);
    for (const item of result.badPackageNames) lines.push(`- ${item.file}: ${item.name}`);
  }

  if (result.badLicenseMetadata.length > 0) {
    lines.push(`bad-license-metadata:`);
    for (const item of result.badLicenseMetadata) lines.push(`- ${item.file}: ${item.license}`);
  }

  if (result.badOpenClawPluginMetadata.length > 0) {
    lines.push(`bad-openclaw-plugin-metadata:`);
    for (const item of result.badOpenClawPluginMetadata) {
      lines.push(`- ${item.file}: ${item.message}`);
    }
  }

  if (result.forbiddenArtifacts.length > 0) {
    lines.push(`forbidden-artifacts:`);
    for (const item of result.forbiddenArtifacts) lines.push(`- ${item}`);
  }

  return lines.join("\n");
}

if (process.argv[1] && resolve(process.argv[1]) === __filename) {
  const result = collectReleaseVerification();
  console.log(formatReleaseVerification(result));
  process.exitCode = result.ok ? 0 : 1;
}
