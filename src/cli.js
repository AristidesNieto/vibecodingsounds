import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { EVENTS, getEventSound, readSettings, setEventSound, writeSettings } from "./settings.js";
import { customSoundsDir, importSound, listSounds, nameOf, resolveSound } from "./sounds.js";
import { play } from "./player.js";

const USAGE = `vcsounds — sounds for Claude Code

Usage:
  vcsounds list                    Show available sounds
  vcsounds status                  Show which sound plays for each event
  vcsounds set <event> <sound>     Assign a sound to an event (or "none")
  vcsounds off                     Remove sounds from all events
  vcsounds add <file>              Copy your own audio file into the sounds list
  vcsounds preview <sound>         Play a sound

Events:
  stop           when Claude finishes responding
  notification   when Claude asks for permission or waits for your input

Options:
  --project      Use .claude/settings.json in the current directory instead of the global one
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
      console.log(`File: ${settingsFile}`);
      for (const [key, event] of Object.entries(EVENTS)) {
        const path = getEventSound(json, event);
        console.log(`  ${key.padEnd(13)} ${path ? nameOf(path) : "(no sound)"}`);
      }
      return;
    }

    case "set": {
      const [key, soundName] = args;
      const event = EVENTS[key];
      if (!event) {
        throw new Error(`Unknown event "${key}". Use: ${Object.keys(EVENTS).join(", ")}`);
      }
      if (!soundName) {
        throw new Error('Missing sound. Use a name from "vcsounds list" or "none".');
      }

      const path = soundName === "none" ? null : resolveSound(soundName, home);
      writeSettings(settingsFile, setEventSound(readSettings(settingsFile), event, path));
      console.log(path ? `${key} → ${nameOf(path)}` : `${key}: no sound`);
      return;
    }

    case "off": {
      if (!existsSync(settingsFile)) return console.log("Nothing to remove.");
      let json = readSettings(settingsFile);
      for (const event of Object.values(EVENTS)) {
        json = setEventSound(json, event, null);
      }
      writeSettings(settingsFile, json);
      return console.log("Sounds turned off.");
    }

    case "add": {
      const [file] = args;
      if (!file) throw new Error("Specify the audio file. Example: vcsounds add ~/Music/beep.wav");
      const dest = importSound(resolve(file), customSoundsDir(home));
      return console.log(`Added: ${nameOf(dest)} (${dest})`);
    }

    case "preview": {
      const [soundName] = args;
      if (!soundName) throw new Error("Specify a sound. Check with: vcsounds list");
      return play(resolveSound(soundName, home));
    }

    // Used by the hooks that this tool writes into settings.json.
    case "play": {
      const [file] = args;
      if (!file) throw new Error("Missing file to play.");
      return play(resolve(file));
    }

    default:
      throw new Error(`Unknown command "${command}". See: vcsounds help`);
  }
}
