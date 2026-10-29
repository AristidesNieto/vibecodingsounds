import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { platform } from "node:os";
import { extname } from "node:path";

export function play(file) {
  if (!existsSync(file)) {
    throw new Error(`File not found: ${file}`);
  }

  switch (platform()) {
    case "darwin":
      return run("afplay", [file]);

    case "win32": {
      if (extname(file).toLowerCase() !== ".wav") {
        throw new Error("On Windows, only .wav files can be played for now.");
      }
      const escaped = file.replace(/'/g, "''");
      return run("powershell", [
        "-NoProfile",
        "-Command",
        `(New-Object System.Media.SoundPlayer '${escaped}').PlaySync()`,
      ]);
    }

    default:
      for (const cmd of ["paplay", "pw-play", "aplay"]) {
        const result = spawnSync(cmd, [file], { stdio: "ignore" });
        if (result.error?.code === "ENOENT") continue;
        checkStatus(cmd, result);
        return;
      }
      throw new Error("No audio player found. Install pulseaudio-utils, pipewire or alsa-utils.");
  }
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "ignore" });
  if (result.error) throw new Error(`Could not run ${cmd}: ${result.error.message}`);
  checkStatus(cmd, result);
}

function checkStatus(cmd, result) {
  if (result.status !== 0) {
    throw new Error(`${cmd} failed (exit code ${result.status})`);
  }
}
