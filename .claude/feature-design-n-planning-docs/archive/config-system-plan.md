# Work Plan — Config System

> Goal: introduce a config infrastructure so boot behaviour is driven by a config file rather than hardcoded logic. Minimal disruption to current behaviour; everything else (drive tracking default, full settings UI) builds on top.

---

## Part 1 — Plumbing

### Task 1 — Create `config/colleague.json`

Create the config file at `config/colleague.json` with the default values:

```json
{
  "defaultTask": {
    "enabled": true,
    "lineup": ["todo"]
  }
}
```

This preserves current boot behaviour out of the box.

---

### Task 2 — Create `utils/configState.ts`

Config reader/writer utility. Responsibilities:
- Read `config/colleague.json` on demand
- Return a typed config object
- Fall back to the default config if the file is absent or malformed
- Expose a `setConfig` function for future writes (the config command UI will use this)

Config type:

```ts
type ColleagueConfig = {
  defaultTask: {
    enabled: boolean;
    lineup: string[]; // command names matching the handlers map
  };
};

const DEFAULT_CONFIG: ColleagueConfig = {
  defaultTask: { enabled: true, lineup: ['todo'] },
};
```

No daily-reset logic needed — this is persistent config, not daily state.

---

### Task 3 — Update `internal/boot.ts`

Replace the current hardcoded default task block with config-driven logic:

- Load config via `utils/configState.ts`
- Remove the `confirm("Do you want to start ticking off your todo list?")` prompt
- If `defaultTask.enabled` is false or `lineup` is empty → skip straight to menu loop
- Otherwise iterate `lineup` in order; for each name, look up in `handlers` and call if found. If a name is not found in `handlers`, skip silently.
- Fall through to menu loop as before

---

### Task 4 — Update `commands/index.ts`

- Remove `export { todo as defaultTask }` — boot no longer uses this export
- Register the `config` command stub (see Task 5)

---

### Task 5 — Register `config` command stub

Add a `config` command in `commands/index.ts`:
- Description: `"View and manage CLI configuration"`
- Action: display a single `note` or `outro` message — e.g. `"Config menu coming soon."` — then return
- Add to `handlers` map so it appears in the interactive menu

---

## Part 2 — Config Menu UI

> Depends on Part 1 being complete. The config file and utility are already in place; this part is purely UI.

### Task 6 — Build the `config` command interactive menu

Replace the stub action with an interactive `select` menu. Top-level options:

- **Default task settings** → enters the default task submenu (Task 7)
- **Exit**

---

### Task 7 — Default task submenu

Interactive submenu for `defaultTask` config. Options:

- **Toggle on/off** — flips `defaultTask.enabled`; shows current state in the label
- **View lineup** — lists current lineup in order with index numbers
- **Add to lineup** — `select` of available command names not already in lineup
- **Remove from lineup** — `multiselect` of current lineup items
- **Reorder lineup** — pick an item, then pick its new position (up/down or index)
- **Back**

All changes write immediately to `config/colleague.json` via `setConfig` from `utils/configState.ts`.

---

## Out of scope for this plan

- Time-based triggers per lineup item
- The low-drive / drive-tracking command (separate plan)
- Any other config keys beyond `defaultTask`
