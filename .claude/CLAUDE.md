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
index.ts                    CLI entry — wires commander, registers commands
commands/
  index.ts                  Command registry; exports handlers map + defaultTask
  todo.ts                   Daily checklist (resets per day)
  stamp.ts                  Timestamped note logger
  dayPlan.ts                3-day planner (today ±1)
  mealTimes.ts              Meal time reminder setup
  listUnread.ts             Gmail unread viewer + mark-as-read
  private/                  Personal commands — gitignored, auto-registered if present
                            See commands/private/CLAUDE.md for details (local-only)
internal/
  boot.ts                   Default action (no args): greeting, todo prompt, menu loop
  completion.ts             Bash tab completion generator (reads live command tree)
utils/
  dailyState.ts             Daily state factory — today(), currentTime(), createDailyState()
  dayPlanState.ts           Day plan file I/O; 3-day window enforcement; meal acknowledgement
  timelog.ts                Timestamped log with quarterly archiving
  timeChecks.ts             Runs before every menu loop tick; prompts for unacknowledged meals
  imap.ts                   ImapFlow wrapper — Gmail auth, fetch unread, mark as read
  paths.ts                  ESM __dirname helper
  weeklyState.ts            Weekly state manager (ISO 8601)
scripts/
  relink.sh                 Re-links CLI globally + refreshes bash completion
data/                       Runtime data — gitignored. DO NOT read files here; use the schemas in the Data Schemas section instead.
  timelog.json              Today's stamps
  todo-state.json           Today's todo tick state
  day-plan.json             3-day plans storage
  email-dismissed.json      Locally dismissed email UIDs (7-day TTL)
  gmail-credentials.json    Gmail app password — gitignored
  history/                  Quarterly stamp archives (YYYY-QQQ.json)
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| Language | TypeScript 5, ESM modules |
| Runner | `tsx` 4 — no compile step |
| CLI framework | `commander` 12 |
| Interactive prompts | `@clack/prompts` 0.9 |
| Gmail IMAP | `imapflow` 1.2 |
| Module resolution | `bundler` (tsconfig) |

---

## Key Data Flows

### Boot (no args)
`index.ts` → `internal/boot.ts` → greeting → optional todo prompt → menu loop
Each menu tick calls `runTimeChecks()` (`utils/timeChecks.ts`) for meal reminders before showing the select.

### Command dispatch
`index.ts` registers all commands from `commands/index.ts` (which merges public + private registries).
Each command is a named export: `(program: Command) => void`.

### State persistence pattern
All stateful utils use `createDailyState(filename, defaults)` from `utils/dailyState.ts`.
The factory reads `data/<filename>.json`, resets to defaults if the stored date ≠ today, then returns `{ get, set }` helpers.

### Stamp + quarterly archive
`stamp.ts` → `utils/timelog.ts` → appends to `data/timelog.json` → on new day detection, archives previous day to `data/history/YYYY-QQQ.json`
Quarter mapping: Mar–May (Q1), Jun–Aug (Q2), Sep–Nov (Q3), Dec–Feb (Q4 spans year boundary).

### Gmail flow
`listUnread.ts` → `utils/imap.ts` → checks `data/gmail-credentials.json` (prompts setup if missing) → connects to `imap.gmail.com:993` → fetches UIDs for last 7 days → filters against `email-dismissed.json` → multiselect → mark read or dismiss locally.

### Day plan
`dayPlan.ts` / `mealTimes.ts` → `utils/dayPlanState.ts` → `data/day-plan.json`
3-day rolling window: entries outside today ±1 are evicted on load.

---

## Data Schemas

### `data/timelog.json`
```ts
{ date: string; entries: Array<{ time: string; label: string }> }
```

### `data/todo-state.json`
```ts
{ date: string; checked: string[] }  // checked = array of item labels
```

### `data/day-plan.json`
```ts
{
  [dateKey: string]: {
    tasks: string[];
    meals?: { breakfast?: string; lunch?: string; dinner?: string };
    acknowledged?: { breakfast?: boolean; lunch?: boolean; dinner?: boolean }
  }
}
```

### `data/email-dismissed.json`
```ts
Array<{ uid: string; dismissedAt: string }>  // dismissedAt ISO string; TTL 7 days
```

### `data/gmail-credentials.json`
```ts
{ user: string; password: string }  // password = Gmail app password
```

---

## Extension Points

- **Add a command:** Create `commands/<name>.ts`, export `(program: Command) => void`, register in `commands/index.ts`.
- **Add a private command:** Same pattern under `commands/private/` — auto-gitignored.
- **Add a utility:** `utils/` for shared logic; `internal/` for boot/infrastructure only.

---

## Config Files

| File | Purpose |
|---|---|
| `package.json` | Bin entry (`index.ts`), deps, scripts |
| `tsconfig.json` | ES2022 target, ESNext modules, bundler resolution, strict |
| `.gitignore` | Excludes `node_modules/`, `commands/private/`, `data/` |
| `scripts/relink.sh` | Re-links CLI + appends completion to `~/.bashrc` |
