import { test } from "node:test";
import assert from "node:assert/strict";
import { commandFor, getEventSound, setEventSound, soundPathFromCommand } from "../src/settings.js";
import { safeName } from "../src/sounds.js";

const USER_STOP_HOOK = { hooks: [{ type: "command", command: "./lint.sh" }] };

test("setEventSound keeps the user's hooks and unrelated keys", () => {
  const before = {
    model: "opus",
    hooks: {
      Stop: [USER_STOP_HOOK],
      PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "echo hi" }] }],
    },
  };

  const after = setEventSound(before, "Stop", "/tmp/beep.wav");

  assert.equal(after.model, "opus");
  assert.deepEqual(after.hooks.PreToolUse, before.hooks.PreToolUse);
  assert.equal(after.hooks.Stop.length, 2);
  assert.deepEqual(after.hooks.Stop[0], USER_STOP_HOOK);
  assert.equal(getEventSound(after, "Stop"), "/tmp/beep.wav");
});

test("setting the same sound twice does not duplicate the hook", () => {
  let json = setEventSound({}, "Stop", "/tmp/beep.wav");
  json = setEventSound(json, "Stop", "/tmp/beep.wav");
  assert.equal(json.hooks.Stop.length, 1);
});

test("passing null removes only this app's hook", () => {
  let json = setEventSound({ hooks: { Stop: [USER_STOP_HOOK] } }, "Stop", "/tmp/beep.wav");
  json = setEventSound(json, "Stop", null);
  assert.deepEqual(json, { hooks: { Stop: [USER_STOP_HOOK] } });
});

test("removing the last hook removes the empty hooks object", () => {
  let json = setEventSound({ model: "opus" }, "Notification", "/tmp/alert.wav");
  json = setEventSound(json, "Notification", null);
  assert.deepEqual(json, { model: "opus" });
});

test("getEventSound returns null when no sound is set", () => {
  assert.equal(getEventSound({ hooks: { Stop: [USER_STOP_HOOK] } }, "Stop"), null);
  assert.equal(getEventSound({}, "Notification"), null);
});

test("commandFor rejects paths with shell-special characters", () => {
  assert.throws(() => commandFor('/tmp/a"b.wav'));
  assert.throws(() => commandFor("/tmp/$HOME.wav"));
  assert.throws(() => commandFor("/tmp/`x`.wav"));
});

test("soundPathFromCommand reads back what commandFor wrote", () => {
  const path = "C:\\Windows\\Media\\chimes.wav";
  assert.equal(soundPathFromCommand(commandFor(path)), path);
});

test("soundPathFromCommand ignores hooks that are not ours", () => {
  assert.equal(soundPathFromCommand("afplay /System/Library/Sounds/Glass.aiff"), null);
  assert.equal(soundPathFromCommand("./lint.sh"), null);
  assert.equal(soundPathFromCommand(undefined), null);
});

test("safeName drops quotes and shell characters", () => {
  assert.equal(safeName('my "sound" $1!'), "my sound 1");
  assert.equal(safeName("!!!"), "sound");
  assert.equal(safeName("Chime_2-final"), "Chime_2-final");
});
