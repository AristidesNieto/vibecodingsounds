import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { platform } from "node:os";

export const AUDIO_EXTENSIONS = [".wav", ".mp3", ".m4a", ".aiff", ".caf", ".ogg", ".oga"];

export function systemSoundsDir() {
  switch (platform()) {
    case "darwin":
      return "/System/Library/Sounds";
    case "win32":
      return join(process.env.WINDIR ?? "C:\\Windows", "Media");
    default:
      return "/usr/share/sounds/freedesktop/stereo";
  }
}

export function customSoundsDir(home) {
  return join(home, ".claude", "vibecodingsounds");
}

export function nameOf(path) {
  return basename(path, extname(path));
}

function audioFilesIn(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => AUDIO_EXTENSIONS.includes(extname(file).toLowerCase()))
    .sort()
    .map((file) => join(dir, file));
}

export function listSounds(home) {
  return [
    ...audioFilesIn(systemSoundsDir()).map((path) => ({ name: nameOf(path), path, source: "sistema" })),
    ...audioFilesIn(customSoundsDir(home)).map((path) => ({ name: nameOf(path), path, source: "tuyo" })),
  ];
}

// Accepts a file path or a name from `listSounds`. The first match wins, so system sounds take precedence.
export function resolveSound(input, home) {
  const absolute = resolve(input);
  if (existsSync(absolute) && AUDIO_EXTENSIONS.includes(extname(absolute).toLowerCase())) {
    return absolute;
  }

  const wanted = input.toLowerCase();
  const match = listSounds(home).find((sound) => sound.name.toLowerCase() === wanted);
  if (match) return match.path;

  throw new Error(`No encontré el sonido "${input}". Revisa con: vcsounds list`);
}

export function importSound(file, dir) {
  const ext = extname(file).toLowerCase();
  if (!AUDIO_EXTENSIONS.includes(ext)) {
    throw new Error(`Formato no soportado (${ext || "sin extensión"}). Usa: ${AUDIO_EXTENSIONS.join(", ")}`);
  }
  if (!existsSync(file)) {
    throw new Error(`No existe el archivo: ${file}`);
  }

  mkdirSync(dir, { recursive: true });
  const dest = join(dir, `${safeName(nameOf(file))}${ext}`);
  copyFileSync(file, dest);
  return dest;
}

// Keeps letters, digits, spaces, "-" and "_". Quotes and shell characters are dropped.
export function safeName(name) {
  return name.replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "sonido";
}
