# VibeCodingSounds

Custom sounds for [Claude Code](https://docs.anthropic.com/en/docs/claude-code): play a sound when Claude finishes a task and when it asks for permission or waits for your input.

> **Status:** early version (0.1.0). Tested on macOS. Windows and Linux are implemented but not yet tested.

## Requirements

- Node.js 18 or later
- Claude Code

## Installation

```sh
npm install -g vibecodingsounds
```

This installs the `vcsounds` command.

To also get the `/vcsounds` command inside Claude Code, install the plugin from this repo:

```
/plugin marketplace add AristidesNieto/vibecodingsounds
/plugin install vibecodingsounds --marketplace AristidesNieto/vibecodingsounds
```

The plugin only adds the `/vcsounds` command. It still needs the CLI above.

## Usage

```sh
vcsounds list                    # available sounds
vcsounds status                  # which sound plays for each event
vcsounds set stop Glass          # sound when Claude finishes
vcsounds set notification Tink   # sound when Claude asks for permission or waits
vcsounds set stop none           # remove a sound
vcsounds off                     # remove all sounds
vcsounds add ~/Music/beep.wav    # add your own audio file
vcsounds preview Glass           # listen to a sound
```

To configure a single project instead of your whole machine, add `--project` from that project's folder:

```sh
cd my-project
vcsounds --project set stop Glass
```

### Events

| Event | When it plays |
|---|---|
| `stop` | Claude finishes responding |
| `notification` | Claude asks for permission or waits for your response for a while |

## Custom sounds

`vcsounds add` copies the file to `~/.claude/vibecodingsounds/`. You can then use it by its name, without the extension.

Supported formats: `.wav`, `.mp3`, `.m4a`, `.aiff`, `.caf`, `.ogg`, `.oga`.

| System | Player used | Formats |
|---|---|---|
| macOS | `afplay` (built in) | all of the above |
| Windows | PowerShell (built in) | `.wav` only for now |
| Linux | `paplay`, `pw-play` or `aplay` | depends on the installed player |

## How it works

`vcsounds set` edits `~/.claude/settings.json` (or `.claude/settings.json` with `--project`) and adds a hook that runs `vcsounds play <file>`.

- It only touches its own hooks. Hooks you wrote yourself are kept.
- If the settings file is not valid JSON, it is not modified.
- Every command ends with `#vibecodingsounds`. The shell treats it as a comment, which is how the tool recognizes its own hooks when it changes them.

## Uninstall

```sh
vcsounds off
npm uninstall -g vibecodingsounds
```

Run `vcsounds off` before uninstalling. Otherwise the hooks will keep trying to run a command that no longer exists.

## Privacy

No network access, no analytics, no accounts. Everything stays on your machine.

## Development

```sh
git clone https://github.com/AristidesNieto/vibecodingsounds
cd vibecodingsounds
npm test
```

## License

MIT
