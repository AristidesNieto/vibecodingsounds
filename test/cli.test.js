import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BIN = join(dirname(fileURLToPath(import.meta.url)), "..", "bin", "vcsounds.js");

function setup() {
  const home = mkdtempSync(join(tmpdir(), "vcs-home-"));
  mkdirSync(join(home, ".claude"), { recursive: true });
  return home;
}

function vcs(home, ...args) {
  const result = spawnSync(process.execPath, [BIN, ...args], {
    env: { ...process.env, HOME: home, USERPROFILE: home },
    cwd: home,
    encoding: "utf8",
  });
  return { code: result.status, out: result.stdout, err: result.stderr };
}

function settingsOf(home) {
  return JSON.parse(readFileSync(join(home, ".claude", "settings.json"), "utf8"));
}

function fakeCustomSound(home, name) {
  const dir = join(home, ".claude", "vibecodingsounds");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${name}.wav`);
  writeFileSync(file, "RIFF");
  return file;
}

test("set, status and off round-trip with a custom sound", () => {
  const home = setup();
  fakeCustomSound(home, "beep");

  assert.equal(vcs(home, "set", "stop", "beep").code, 0);
  assert.match(vcs(home, "status").out, /stop\s+beep/);
  const command = settingsOf(home).hooks.Stop[0].hooks[0].command;
  assert.equal(command, `vcsounds play "${join(home, ".claude", "vibecodingsounds", "beep.wav")}" #vibecodingsounds`);

  assert.equal(vcs(home, "off").code, 0);
  assert.equal(settingsOf(home).hooks, undefined);
});

test("set keeps a user's existing Stop hook", () => {
  const home = setup();
  fakeCustomSound(home, "beep");
  writeFileSync(
    join(home, ".claude", "settings.json"),
    JSON.stringify({ model: "opus", hooks: { Stop: [{ hooks: [{ type: "command", command: "./lint.sh" }] }] } }),
  );

  assert.equal(vcs(home, "set", "stop", "beep").code, 0);

  const json = settingsOf(home);
  assert.equal(json.model, "opus");
  assert.equal(json.hooks.Stop.length, 2);
  assert.match(JSON.stringify(json.hooks.Stop), /\.\/lint\.sh/);
});

test("set refuses to touch a settings file that is not valid JSON", () => {
  const home = setup();
  fakeCustomSound(home, "beep");
  const bad = "{ not json";
  writeFileSync(join(home, ".claude", "settings.json"), bad);

  const result = vcs(home, "set", "stop", "beep");

  assert.equal(result.code, 1);
  assert.match(result.err, /is not valid JSON/);
  assert.equal(readFileSync(join(home, ".claude", "settings.json"), "utf8"), bad);
});

test("add copies an audio file into the custom sounds folder", () => {
  const home = setup();
  const source = join(home, "my beep.wav");
  writeFileSync(source, "RIFF");

  const result = vcs(home, "add", source);

  assert.equal(result.code, 0);
  assert.ok(existsSync(join(home, ".claude", "vibecodingsounds", "my beep.wav")));
  assert.match(vcs(home, "list").out, /my beep\s+custom/);
});

test("add rejects unsupported formats", () => {
  const home = setup();
  const source = join(home, "notes.txt");
  writeFileSync(source, "hello");

  const result = vcs(home, "add", source);

  assert.equal(result.code, 1);
  assert.match(result.err, /Unsupported format/);
});

test("unknown event and unknown sound give clear errors", () => {
  const home = setup();

  const badEvent = vcs(home, "set", "greeting", "none");
  assert.equal(badEvent.code, 1);
  assert.match(badEvent.err, /Unknown event/);

  const badSound = vcs(home, "set", "stop", "does-not-exist");
  assert.equal(badSound.code, 1);
  assert.match(badSound.err, /not found/);
});

test("--project writes to .claude/settings.json in the current directory", () => {
  const home = setup();
  const project = mkdtempSync(join(tmpdir(), "vcs-project-"));
  fakeCustomSound(home, "beep");

  const result = spawnSync(process.execPath, [BIN, "--project", "set", "stop", "beep"], {
    env: { ...process.env, HOME: home, USERPROFILE: home },
    cwd: project,
    encoding: "utf8",
  });

  assert.equal(result.status, 0);
  assert.ok(existsSync(join(project, ".claude", "settings.json")));
  assert.equal(existsSync(join(home, ".claude", "settings.json")), false);
});
