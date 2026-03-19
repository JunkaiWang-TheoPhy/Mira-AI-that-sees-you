import { spawn, spawnSync } from "node:child_process";
import {
  closeSync,
  cpSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";

export function ensureParentDir(path) {
  mkdirSync(dirname(path), { recursive: true });
}

export function copyPath(sourcePath, destinationPath) {
  rmSync(destinationPath, { recursive: true, force: true });
  ensureParentDir(destinationPath);
  cpSync(sourcePath, destinationPath, { recursive: true });
}

export function copyFileIfMissing(sourcePath, destinationPath) {
  if (existsSync(destinationPath)) {
    return false;
  }

  ensureParentDir(destinationPath);
  cpSync(sourcePath, destinationPath);
  return true;
}

export function writeJsonFile(path, value) {
  ensureParentDir(path);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function readJsonFile(path, fallback = null) {
  if (!existsSync(path)) {
    return fallback;
  }

  return JSON.parse(readFileSync(path, "utf8"));
}

export function removeFile(path) {
  rmSync(path, { force: true });
}

export function parseEnvText(text) {
  const env = {};

  for (const rawLine of text.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!key) {
      continue;
    }

    env[key] = value;
  }

  return env;
}

export function loadEnvFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  return parseEnvText(readFileSync(path, "utf8"));
}

export function isPlaceholderValue(value) {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return (
    normalized.length === 0
    || normalized.includes("replace-me")
    || normalized.includes("replace_me")
    || normalized.includes("re_replace_me")
    || normalized === "replace me"
  );
}

export function toBoolean(value, fallback = false) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

export function runCommandSync(
  command,
  args,
  { cwd, env, stdio = "inherit" } = {},
) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    stdio,
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }
  if (typeof result.status === "number" && result.status !== 0) {
    throw new Error(
      `Command failed (${command} ${args.join(" ")}): exit ${result.status}`,
    );
  }

  return {
    status: result.status ?? 0,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

export function runShellCommandSync(
  command,
  { cwd, env, stdio = "inherit" } = {},
) {
  const shell = process.env.SHELL || "/bin/sh";
  return runCommandSync(shell, ["-lc", command], { cwd, env, stdio });
}

export function findExecutableSync(command) {
  const result = spawnSync("which", [command], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });

  if (result.error || result.status !== 0) {
    return null;
  }

  const resolved = (result.stdout ?? "").trim();
  return resolved || null;
}

export function startDetachedProcess(
  command,
  args,
  { cwd, env, logPath } = {},
) {
  ensureParentDir(logPath);
  const logFd = openSync(logPath, "a");

  try {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ["ignore", logFd, logFd],
      detached: true,
    });

    if (child.error) {
      throw child.error;
    }

    child.unref();
    return {
      pid: child.pid ?? null,
    };
  } finally {
    closeSync(logFd);
  }
}

export function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function stopDetachedProcess(pid, signal = "SIGTERM") {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }

  try {
    process.kill(-pid, signal);
    return true;
  } catch {
    try {
      process.kill(pid, signal);
      return true;
    } catch {
      return false;
    }
  }
}
