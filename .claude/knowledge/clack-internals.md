# @clack/prompts & @clack/core — Internal Workings

## `intro` and `outro` are purely cosmetic

```js
intro = (t="") => process.stdout.write(`┌  ${t}\n`)
outro = (t="") => process.stdout.write(`│\n└  ${t}\n\n`)
```

- Both are simple `process.stdout.write` calls.
- They set **zero internal state**.
- `intro('')` is not silent — it prints a visible empty box-border line (`┌  `).
- No clack session object, no flags, nothing is initialised or torn down by these calls.

## Per-prompt state lives in `@clack/core`'s `Prompt` class

Each interactive prompt (`select`, `text`, `confirm`, etc.) is an independent instance. Key instance field:

- `_prevFrame: string` — the last rendered string, used to calculate how many lines to erase on redraw.

### Cursor restoration logic

```js
restoreCursor() {
  const lines = wrapAnsi(this._prevFrame, process.stdout.columns, { hard: true })
    .split('\n').length - 1;
  cursor.move(-999, lines * -1);  // move to col 0, move up by line count
}
```

Uses `wrapAnsi` (with `process.stdout.columns`) to count lines in the previous frame, then moves the cursor up by that many lines. No shared state across prompts — each instance is fully independent.

### Render / diff logic

On each redraw:
1. Wraps the new frame at `process.stdout.columns`.
2. Diffs against `_prevFrame`.
3. If single-line diff: moves cursor to changed line, erases it, rewrites.
4. If multi-line diff: calls `restoreCursor()`, erases downward (`erase.down()`), rewrites from the first changed line.

---

## Known UI Glitch — Boot Menu → Sub-command Select

### Symptom

When a command with its own `select` prompt (e.g. `day-plan`, `meal-times`) is invoked **from the boot menu**, the first `select` in that command intermittently fails to clear its previous render on arrow-key navigation. Result: ghost lines appear, with duplicate option rows and two simultaneous `>` cursors:

```
*  Which day are you planning for?
|  > Today     (Sun 29 Mar)
|    Today     (Sun 29 Mar)
|  > Tomorrow  (Mon 30 Mar)
|    Day after (Tue 31 Mar)
```

### Does NOT reproduce when invoked directly

Running `colleague day-plan` or `colleague meal-times` directly (not via boot menu) consistently renders correctly. The glitch only appears when the command is called as a handler inside `boot.ts`'s `while(true)` menu loop.

### Root cause (confirmed)

The boot menu `select` lists all registered commands — enough options to push the terminal to scroll before the user selects. After selection, the cursor lands near the bottom of the visible viewport.

When the sub-command's `select` renders and the user presses an arrow key, `restoreCursor()` tries to move the cursor up by `wrapAnsi(_prevFrame, columns).split('\n').length - 1` lines. If the terminal has already scrolled, this cursor-up movement is **clipped at the top of the visible viewport**, placing the cursor in the wrong position. The subsequent `erase.down()` + redraw overlaps the previous render instead of replacing it — producing the ghost lines.

The glitch is inconsistent because it only triggers when the boot menu has scrolled the terminal (depends on how many commands are registered and terminal height). When called from line 1 with enough room, no scroll occurs and the bug doesn't appear.

### Fix (implemented)

At two points in `internal/boot.ts`, push visible content into scrollback and reset the cursor to the top of the viewport:

```ts
const rows = process.stdout.rows ?? 24;
process.stdout.write('\n'.repeat(rows) + `\x1b[${rows}A`);
```

1. Before the initial `intro('Hey! Good to see you.')` — boots from line 1.
2. At the top of the `while(true)` loop, before `runTimeChecks()` — each return from a sub-command clears to a fresh viewport before the menu redraws.

**Why not `console.clear()` or `\x1b[2J\x1b[H`:**
Both erase the visible buffer without pushing content to scrollback. In mintty (Git Bash), this destroys scroll history. The newline approach relies on normal terminal scroll behaviour — existing content is pushed into scrollback naturally, leaving a blank viewport with the cursor at the top.

Commands invoked directly (e.g. `colleague day-plan`) are not affected — no clear logic in the command handlers themselves.
