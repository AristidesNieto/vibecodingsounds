import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { EVENTS, getEventSound, readSettings, setEventSound, writeSettings } from "./settings.js";
import { customSoundsDir, importSound, listSounds, nameOf, resolveSound } from "./sounds.js";
import { play } from "./player.js";

const USAGE = `vcsounds — sonidos para Claude Code

Uso:
  vcsounds list                    Muestra los sonidos disponibles
  vcsounds status                  Muestra qué suena en cada evento
  vcsounds set <evento> <sonido>   Asigna un sonido a un evento (o "none")
  vcsounds off                     Quita los sonidos de todos los eventos
  vcsounds add <archivo>           Copia tu audio a la lista de sonidos
  vcsounds preview <sonido>        Reproduce un sonido

Eventos:
  stop           al terminar Claude
  notification   cuando Claude pide permiso o espera tu respuesta

Opciones:
  --project      Usa .claude/settings.json del directorio actual en vez del global
`;

export function main(argv, { home = homedir(), cwd = process.cwd() } = {}) {
  const project = argv.includes("--project");
  const [command, ...args] = argv.filter((arg) => arg !== "--project");
  const settingsFile = project
    ? join(cwd, ".claude", "settings.json")
    : join(home, ".claude", "settings.json");

  switch (command) {
    case undefined:
    case "help":
    case "--help":
    case "-h":
      return console.log(USAGE);

    case "list":
      for (const sound of listSounds(home)) {
        console.log(`${sound.name.padEnd(20)} ${sound.source}`);
      }
      return;

    case "status": {
      const json = readSettings(settingsFile);
      console.log(`Archivo: ${settingsFile}`);
      for (const [key, event] of Object.entries(EVENTS)) {
        const path = getEventSound(json, event);
        console.log(`  ${key.padEnd(13)} ${path ? nameOf(path) : "(sin sonido)"}`);
      }
      return;
    }

    case "set": {
      const [key, soundName] = args;
      const event = EVENTS[key];
      if (!event) {
        throw new Error(`Evento desconocido "${key}". Usa: ${Object.keys(EVENTS).join(", ")}`);
      }
      if (!soundName) {
        throw new Error('Falta el sonido. Usa un nombre de "vcsounds list" o "none".');
      }

      const path = soundName === "none" ? null : resolveSound(soundName, home);
      writeSettings(settingsFile, setEventSound(readSettings(settingsFile), event, path));
      console.log(path ? `${key} → ${nameOf(path)}` : `${key}: sin sonido`);
      return;
    }

    case "off": {
      if (!existsSync(settingsFile)) return console.log("No hay nada que quitar.");
      let json = readSettings(settingsFile);
      for (const event of Object.values(EVENTS)) {
        json = setEventSound(json, event, null);
      }
      writeSettings(settingsFile, json);
      return console.log("Sonidos desactivados.");
    }

    case "add": {
      const [file] = args;
      if (!file) throw new Error("Indica el archivo de audio. Ejemplo: vcsounds add ~/Music/bip.wav");
      const dest = importSound(resolve(file), customSoundsDir(home));
      return console.log(`Agregado: ${nameOf(dest)} (${dest})`);
    }

    case "preview": {
      const [soundName] = args;
      if (!soundName) throw new Error("Indica un sonido. Revisa con: vcsounds list");
      return play(resolveSound(soundName, home));
    }

    // Used by the hooks that this tool writes into settings.json.
    case "play": {
      const [file] = args;
      if (!file) throw new Error("Falta el archivo a reproducir.");
      return play(resolve(file));
    }

    default:
      throw new Error(`Comando desconocido "${command}". Revisa: vcsounds help`);
  }
}
