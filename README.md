# My Colleague

A personal command-line companion for daily workflow. Built with Node.js and TypeScript — no compilation step, runs directly with `tsx`.

A few things it does out of the box:

- Starts each session with a greeting and nudges you to tick off your todo list
- Lets you stamp timestamped notes throughout the day and archives them quarterly
- Walks you through morning and end-of-day rituals as interactive checklists
- Helps you plan your day, set meal time reminders, and tracks what you've planned across up to three days

[Jump to Prerequisites and Getting Started →](#prerequisites)

---

## Commands

All commands are accessible from the interactive menu when you run `colleague`, or can be called directly:

```
colleague <command>
```

| Command | Description |
|---|---|
| `todo` | Interactive daily todo list — ticks persist within the day, reset the next |
| `stamp [note]` | Log a timestamped note; `--list` shows today's stamps |
| `day-plan` | Conversational day planner — add tasks, set meal times, plan up to 3 days ahead |
| `meal-times` | Set meal time reminders for today; surfaces as prompts during any CLI interaction |

> **Note on `todo`:** the todo list is the default task that runs on boot. It ships with placeholder items as a demo — swap them out in `commands/todo.ts` for your own list, or replace it entirely by changing the `defaultTask` export in `commands/index.ts`.

### Private commands

A `commands/private/` folder exists for personal commands that should never be committed. It is gitignored. Anything registered there appears in the interactive menu automatically when present, but is invisible in the public repo.

---

## Adding a new command

**Public command:**

1. Create `commands/myCommand.ts` and export an async function:
   ```ts
   export async function myCommand() { ... }
   ```
2. Register it in `commands/index.ts`:
   ```ts
   import { myCommand } from './myCommand';

   program.command('my-command').description('What it does').action(myCommand);
   handlers.set('my-command', myCommand);
   ```

**Private command:**

1. Create `commands/private/myCommand.ts` with the same exported function shape
2. Register it in `commands/private/index.ts`:
   ```ts
   import { myCommand } from './myCommand';

   program.command('my-command').description('...').action(myCommand);
   handlers.set('my-command', myCommand);
   ```

---

## Project structure

```
my-colleague/
├── index.ts                  Entry point — wires up commander, registers commands, parses
├── commands/                 User-facing commands
│   ├── index.ts              Command registry and handlers map
│   ├── todo.ts               Daily todo list with persistent tick state
│   ├── stamp.ts              Timestamped note logger
│   ├── dayPlan.ts            Day planner
│   ├── mealTimes.ts          Meal time setup
│   └── private/              Personal private commands (gitignored)
├── internal/                 Infrastructure — not user-callable
│   ├── boot.ts               Default action, greeting, and menu loop
│   └── completion.ts         Bash tab completion script generator
├── utils/                    Shared utilities
│   ├── dailyState.ts         today(), currentTime(), createDailyState() factory
│   ├── dayPlanState.ts       Day plan file I/O and meal acknowledgement helpers
│   ├── timelog.ts            Timestamp log with quarterly archiving
│   └── timeChecks.ts         Time-sensitive check runner (called before every menu)
├── scripts/
│   └── relink.sh             Re-links the CLI and refreshes shell completion
└── data/                     Runtime data files (gitignored)
    ├── timelog.json           Today's stamps
    ├── todo-state.json        Today's todo tick state
    ├── ritual-state.json      Today's start ritual progress
    ├── end-ritual-state.json  Today's end ritual progress
    ├── day-plan.json          Up to 3 days of day plans
    └── history/               Quarterly stamp archives
```

---

## Prerequisites

- **Node.js** v18 or later
- **tsx** installed globally:
  ```bash
  npm install -g tsx
  ```

---

## Getting started

```bash
git clone <your-repo-url>
cd my-colleague
npm install
npm link
```

Then run from anywhere:

```bash
colleague
```

To enable tab completion (one-time setup):

```bash
colleague completion --install
source ~/.bashrc
```

---

## Maintenance

When you add new commands or change the binary name, re-run:

```bash
npm run relink
source ~/.bashrc
```

This re-runs `npm link` to register the global command and reinstalls the shell completion script with the updated command list.
