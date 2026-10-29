import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

// Appended to every command we write. In sh it is a comment; in cmd it is an
// extra argument that `play` ignores. It is how we find our own hooks later.
export const MARKER = "#vibecodingsounds";

export const EVENTS = { stop: "Stop", notification: "Notification" };

const COMMAND_PATTERN = /^vcsounds play "(.+)" #vibecodingsounds$/;

export function readSettings(file) {
  if (!existsSync(file)) return {};
  const text = readFileSync(file, "utf8");
  if (text.trim() === "") return {};

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${file} no es JSON válido. No lo modifiqué.`);
  }
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    throw new Error(`${file} no es un objeto JSON. No lo modifiqué.`);
  }
  return json;
}

export function writeSettings(file, json) {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.vcsounds-tmp`;
  writeFileSync(tmp, JSON.stringify(json, null, 2) + "\n");
  renameSync(tmp, file);
}

export function commandFor(soundPath) {
  if (/["$`]/.test(soundPath)) {
    throw new Error(`La ruta tiene caracteres no permitidos (" $ \`): ${soundPath}`);
  }
  return `vcsounds play "${soundPath}" ${MARKER}`;
}

export function soundPathFromCommand(command) {
  const match = COMMAND_PATTERN.exec(command ?? "");
  return match ? match[1] : null;
}

export function getEventSound(json, event) {
  for (const entry of json.hooks?.[event] ?? []) {
    for (const hook of entry?.hooks ?? []) {
      const path = soundPathFromCommand(hook?.command);
      if (path) return path;
    }
  }
  return null;
}

// Replaces only this app's hook for the event. Hooks written by the user stay untouched.
// Passing null removes the sound.
export function setEventSound(json, event, soundPath) {
  const hooks = { ...(json.hooks ?? {}) };
  const entries = withoutOwnHooks(hooks[event]);

  if (soundPath) {
    entries.push({ hooks: [{ type: "command", command: commandFor(soundPath), async: true }] });
  }

  if (entries.length) {
    hooks[event] = entries;
  } else {
    delete hooks[event];
  }

  const result = { ...json };
  if (Object.keys(hooks).length) {
    result.hooks = hooks;
  } else {
    delete result.hooks;
  }
  return result;
}

function withoutOwnHooks(entries) {
  const kept = [];
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!Array.isArray(entry?.hooks)) {
      kept.push(entry);
      continue;
    }
    const others = entry.hooks.filter((hook) => soundPathFromCommand(hook?.command) === null);
    if (others.length) kept.push({ ...entry, hooks: others });
  }
  return kept;
}
