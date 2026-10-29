---
description: Change Claude Code sounds (when it finishes and when it asks for permission)
argument-hint: [list | status | set <stop|notification> <sound> | off | add <file> | preview <sound>]
---

Run the `vcsounds` CLI with the user's arguments: `vcsounds $ARGUMENTS`

If the user passed no arguments, run `vcsounds help` and show them the options.

If the command fails because `vcsounds` is not found, tell the user to install it with `npm install -g vibecodingsounds` (requires Node.js 18 or later), then try again.

Summarize the result in one or two sentences.
