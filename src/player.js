import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { platform } from "node:os";
import { extname } from "node:path";

export function play(file) {
  if (!existsSync(file)) {
    throw new Error(`No existe el archivo: ${file}`);
  }

  switch (platform()) {
    case "darwin":
      return run("afplay", [file]);

    case "win32": {
      if (extname(file).toLowerCase() !== ".wav") {
        throw new Error("En Windows por ahora solo se reproducen archivos .wav.");
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
      throw new Error("No encontré un reproductor de audio. Instala pulseaudio-utils, pipewire o alsa-utils.");
  }
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "ignore" });
  if (result.error) throw new Error(`No pude ejecutar ${cmd}: ${result.error.message}`);
  checkStatus(cmd, result);
}

function checkStatus(cmd, result) {
  if (result.status !== 0) {
    throw new Error(`${cmd} terminó con error (código ${result.status})`);
  }
}
