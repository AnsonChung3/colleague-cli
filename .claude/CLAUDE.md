# Project Blackboard — My Colleague CLI

> Agent entry point. Read this before exploring any files. Use the pointers below to navigate directly to relevant code — do not scan the whole project.

## What This Is

A personal command-line companion built with **Node.js + TypeScript**, run directly via `tsx` (no compile step). Provides daily rituals, task checklists, a 3-day planner, timestamped note logging with quarterly archiving, meal reminders, and Gmail IMAP integration.

**Binary:** `colleague` (npm-linked)
**Entry point:** `index.ts`
**Run:** `npm start` or `colleague [command]`

---

## Directory Map

```
index.ts                    CLI entry — wires commander, registers commands, configures help
commands/
  index.ts                  Command registry; exports handlers map + privateCommandNames
  public/                   Public command implementations
    todo.ts                 Daily checklist (resets per day)
    stamp.ts                Timestamped note logger
    config.ts               Settings menu — default task lineup, toggle, reorder
    day-plan/               Day planner module
      dayPlan.ts            Entry point; flag dispatch (--check, --edit, --add, --remove); exports formatDate
      dayPlanCheck.ts       --check flow: interactive checklist (today) or read-only note (tomorrow/day after)
      dayPlanAdd.ts         --add flow: add tasks to today's plan
      dayPlanEdit.ts        --edit flow; full edit menu (check/add/edit/remove/view)
      dayPlanRemove.ts      --remove flow: multiselect task removal for today
      dayPlanUtils.ts       Shared helpers: formatDate, parseTasks, showTaskList, runAddLoop
    mealTimes.ts            Meal time reminder setup
    listUnread.ts           Gmail unread viewer + mark-as-read
  private/                  Personal commands — gitignored, auto-registered if present
                            See .claude/private/CLAUDE.md for details (local-only)
internal/
  boot.ts                   Default action (no args): greeting, config-driven default task, menu loop
  completion.ts             Bash tab completion generator (reads live command tree)
  help.ts                   Custom help formatter — groups public vs private commands
utils/
  configState.ts            Config file reader/writer — getConfig(), setConfig(); reads config/colleague.json
  dailyState.ts             Daily state factory — today(), currentTime(), createDailyState()
  dayPlanState.ts           Day plan file I/O; 3-day window enforcement; meal acknowledgement
  timelog.ts                Timestamped log with quarterly archiving
  timeChecks.ts             Runs before every menu loop tick; prompts for unacknowledged meals
  imap.ts                   ImapFlow wrapper — Gmail auth, fetch unread, mark as read
  paths.ts                  ESM __dirname helper
  weeklyState.ts            Weekly state manager (ISO 8601)
config/
  colleague.json            Persisted CLI config (gitignored — can contain private command names, see below)
scripts/
  relink.sh                 Re-links CLI globally + refreshes bash completion
data/                       Runtime data — gitignored. DO NOT read files here; use the schemas in the Data Schemas section instead.
  timelog.json              Today's stamps
  todo-state.json           Today's todo tick state
  day-plan.json             3-day plans storage
  email-dismissed.json      Locally dismissed email UIDs (7-day TTL)
  gmail-credentials.json    Gmail app password — gitignored
  history/                  Quarterly stamp archives (YYYY-MMM-MMM.json)
```

---

## Tech Stack

| Layer               | Choice                    |
| ------------------- | ------------------------- |
| Language            | TypeScript 5, ESM modules |
| Runner              | `tsx` 4 — no compile step |
| CLI framework       | `commander` 12            |
| Interactive prompts | `@clack/prompts` 0.9      |
| Gmail IMAP          | `imapflow` 1.2            |
| Module resolution   | `bundler` (tsconfig)      |

---

## Key Data Flows

### Boot (no args)

`index.ts` → `internal/boot.ts` → greeting → reads `config.defaultTask` → runs each handler in `lineup` (if `enabled`) → menu loop
Each menu tick calls `runTimeChecks()` (`utils/timeChecks.ts`) for meal reminders before showing the select.

### Command dispatch

`index.ts` calls `registerCommands(program)` from `commands/index.ts`, which wires every command directly: each command module exports a plain handler function (e.g. `export async function todo() { ... }`), and `commands/index.ts` calls `program.command(...).action(handler)` plus `handlers.set(name, handler)` for each one. Private commands register the same way via `commands/private/index.ts`'s `registerPrivateCommands` (through an `addPrivate()` helper), merged in afterwards.

### Config menu & private commands

`makeConfigAction` (`commands/public/config.ts`) builds its "Add to lineup" options from
`[...handlers.keys()]` — the same shared map that `registerPrivateCommands` populates. Private
registration happens during `registerCommands()`, before `program.parse()`, so by the time the
config menu runs, `handlers` already contains private command names alongside public ones. The
submenu does not filter by `privateCommandNames`, so a private command can be added to
`defaultTask.lineup` like any other.

This is why `config/colleague.json` is gitignored rather than committed: once a private command
name is written into `lineup`, committing the file would leak that command's existence into the
public repo — defeating the point of `commands/private/` being gitignored in the first place.

### State persistence pattern

All stateful utils use `createDailyState(filename, defaults)` from `utils/dailyState.ts`.
The factory reads `data/<filename>.json`, resets to defaults if the stored date ≠ today, then returns `{ get, set }` helpers.

### Stamp + quarterly archive

`stamp.ts` → `utils/timelog.ts` → appends to `data/timelog.json` → on new day detection, archives previous day to `data/history/YYYY-QQQ.json`
Quarter mapping: Mar–May (Q1), Jun–Aug (Q2), Sep–Nov (Q3), Dec–Feb (Q4 spans year boundary).

### Gmail flow

`listUnread.ts` → `utils/imap.ts` → checks `data/gmail-credentials.json` (prompts setup if missing) → connects to `imap.gmail.com:993` → fetches UIDs for last 7 days → filters against `email-dismissed.json` → multiselect → mark read or dismiss locally.

### Day plan

`commands/public/day-plan/dayPlan.ts` dispatches to flag-specific flows:
- `--check` → `dayPlanCheck.ts`: interactive multiselect (today) or read-only note (tomorrow/day after)
- `--add` → `dayPlanAdd.ts`: add loop via shared `runAddLoop` from `dayPlanUtils.ts`
- `--edit` → `dayPlanEdit.ts`: full edit menu (add / edit single task / remove / view)
- `--remove` → `dayPlanRemove.ts`: multiselect removal for today
- No flag → interactive date picker → meal setup (`mealTimes.ts`, today only) → `dayPlanEditFlow`

All flows → `utils/dayPlanState.ts` → `data/day-plan.json`
3-day rolling window: entries outside today +2 are evicted on load.
`dayPlanUtils.ts` exports `formatDate` (YYYY-MM-DD → "Thu 27 Mar") and `parseTasks` (quoted or plain input → string[]).

---

## Data Schemas

### `data/timelog.json`

```ts
{
	date: string;
	entries: Array<{ time: string; label: string }>;
}
```

### `data/todo-state.json`

```ts
{ date: string; checked: string[] }  // checked = array of item labels
```

### `data/day-plan.json`

```ts
{
  [dateKey: string]: {
    tasks: Array<{ id: string; label: string; done: boolean }>;
    meals: Array<{ label: string; time: string; acknowledged: boolean }>;
  }
}
```

### `data/email-dismissed.json`

```ts
Array<{ uid: number; dismissedAt: string }>; // dismissedAt = YYYY-MM-DD; entries older than 7 days are dropped on load
```

### `data/gmail-credentials.json`

```ts
{
	user: string;
	password: string;
} // password = Gmail app password
```

### `config/colleague.json`

```ts
{
  defaultTask: {
    enabled: boolean;   // whether the lineup runs on boot
    lineup: string[];   // ordered list of command names to run on boot
  }
}
```

Default (used when file is absent): `{ defaultTask: { enabled: true, lineup: ['todo'] } }`

---

## Extension Points

- **Add a command:** Create `commands/public/<name>.ts`, export a plain async handler function, register it in `commands/index.ts` (`program.command(...).action(handler)` + `handlers.set(...)`).
- **Add a private command:** Same shape under `commands/private/`, registered via the `addPrivate()` helper in `commands/private/index.ts` — auto-gitignored.
- **Add a utility:** `utils/` for shared logic; `internal/` for boot/infrastructure only.

---

## Config Files

| File                     | Purpose                                                   |
| ------------------------ | --------------------------------------------------------- |
| `package.json`           | Bin entry (`index.ts`), deps, scripts                     |
| `tsconfig.json`          | ES2022 target, ESNext modules, bundler resolution, strict |
| `.gitignore`             | Excludes `node_modules/`, `commands/private/`, `data/`    |
| `scripts/relink.sh`      | Re-links CLI + appends completion to `~/.bashrc`          |
| `config/colleague.json`  | Persisted CLI settings — gitignored, local only            |

---

## Knowledge Base

`.claude/knowledge/` — researched findings, not derivable from reading the code.

| File                   | Contents                                                                 |
| ---------------------- | ------------------------------------------------------------------------ |
| `clack-internals.md`   | `@clack/prompts` & `@clack/core` internal mechanics; boot-menu select glitch root cause & fix |
