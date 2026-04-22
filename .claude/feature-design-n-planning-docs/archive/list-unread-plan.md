# list-unread — Refined Plan

> Status: ready for implementation

## Scope

1. Other-label discovery and picker
2. Two-stage email flow with `groupMultiselect`
3. Watch/ignore model and persistence
4. Smart subject/sender text wrap
5. Move to trash action
6. Nested label handling
7. `colleague config` UI for managed labels — same branch, design deferred

---

## Interaction Flow

```
[existing credential check — unchanged]

Connect
  ├─ Fetch INBOX + permanent/7-day watched label emails
  └─ LIST all mailboxes → STATUS each for UNSEEN    ← spinner: "Checking labels…"

──────────────────────────────────────────────────
STAGE 1 — INBOX + watched labels
──────────────────────────────────────────────────

Step 1 — Email multiselect (groupMultiselect)
  INBOX / watched labels as group headers (BLOCK LETTERS)
  Items indented under each header
  Hint text: "Selecting a group header marks all items in that group"
  → If no emails: skip to step 3

Step 2 — Action picker (single select)
  Mark as read
  Ignore locally (7 days)
  Move to trash

Step 2a — Execute immediately

──────────────────────────────────────────────────
STAGE 2 — Other labels
──────────────────────────────────────────────────

Step 3 — Other-labels picker (multiselect)
  Labels with UNSEEN > 0, excluding: system folders, ignoredLabels, already-watched labels
  Label names only — no unread counts
  Nested labels shown as full paths (e.g. Work/Projects)
  → If none available: outro
  → If user selects none: outro

Step 4 — Email multiselect for selected labels (groupMultiselect)
  Same format as step 1

Step 5 — Action picker (same options as step 2)

Step 5a — Execute immediately
  + single-line hint: "To watch or ignore labels, use `colleague config`"
  (exact placement decided during implementation)

Outro
```

---

## Label Discovery

Run `LIST "" "*"` on connect to get all mailboxes, then `STATUS` each for `UNSEEN`.

**Exclude from results:**
- System folders: `[Gmail]/Trash`, `[Gmail]/Sent Mail`, `[Gmail]/Drafts`, `[Gmail]/Spam`, `[Gmail]/All Mail`, `[Gmail]/Important`, `[Gmail]/Starred`
- Labels in `config.ignoredLabels`
- Labels already in `config.watchedLabels` or non-expired `watched-labels.json` entries (these are fetched in stage 1)

Only labels with `UNSEEN > 0` are shown in step 3.

Spinner covers the latency of N STATUS round-trips.

---

## Nested Labels

Gmail nested labels appear as `/`-separated path strings in IMAP.

- **Display**: full path as-is (`Work/Projects`). No additional visual nesting in the step 3 picker.
- **Filtering**: UNSEEN > 0 applies per label. A container parent with 0 unread is not shown even if a child has unread. Each label stands independently.
- **Watch/ignore scope**: per label only — watching `Work` does not cascade to `Work/Projects`.
- **Email groupMultiselect**: each selected label becomes its own group, identified by its full path as the header.

---

## Watch/Ignore Persistence

### `config/colleague.json` — schema additions

```ts
{
  watchedLabels: string[];  // permanent, no expiry; always fetched in stage 1
  ignoredLabels: string[];  // permanently excluded from step 3 picker
}
```

Defaults: `{ watchedLabels: [], ignoredLabels: [] }`

### `data/watched-labels.json` — 7-day TTL (new runtime file)

```ts
Array<{ label: string; watchedAt: string }>  // watchedAt: YYYY-MM-DD
```

Same TTL pattern as `email-dismissed.json`: filter out entries older than 7 days on load.

### Effective watched set at runtime

Merge `config.watchedLabels` + non-expired `watched-labels.json` entries into one set. All labels in this set are fetched in stage 1 alongside INBOX.

---

## Email Display Format

### groupMultiselect structure

Group headers: uppercase label name (key in the `options` record)
Item labels: indented, with subject and sender on one or two lines (see wrap logic below)

```
INBOX
    Subject line (Sender Name)
    Another subject that is quite long
    (Another Sender)

WORK/PROJECTS
    Meeting notes (Boss)
```

### Smart subject/sender wrap

```
availableWidth = process.stdout.columns - 8

for each email:
  full = `${subject} (${sender})`
  if full.length ≤ availableWidth:
    label = full                              // single line
  else:
    label = `${subject}\n    (${sender})`    // sender on new line
```

Subject itself may soft-wrap if it exceeds `availableWidth` — terminal handles this naturally. Clack's cursor math accounts for wrapped lines via `wrapAnsi`.

---

## Move to Trash

Gmail IMAP: `messageMove(uids, '[Gmail]/Trash', { uid: true })` — copies to Trash then removes from source. Recoverable in Gmail; 30-day auto-purge.

`imap.ts` needs the source mailbox per UID. `EmailSummary` gains a `mailbox` field:

```ts
export interface EmailSummary {
  uid: number;
  from: string;
  subject: string;
  mailbox: string;  // e.g. 'INBOX', 'Work/Projects'
}
```

`moveToTrash(uids, mailbox)` opens the source mailbox then calls `messageMove`.

---

## Files Affected

| File | Change |
|---|---|
| `utils/imap.ts` | Add `getLabelsWithUnread()`, `getUnreadFromLabels(labels[])`, `moveToTrash(uids[], mailbox)`. Add `mailbox` field to `EmailSummary`. |
| `commands/public/listUnread.ts` | Full restructure: two-stage flow, groupMultiselect, smart wrap, watch/ignore reads, trash action |
| `utils/configState.ts` | Add `watchedLabels` and `ignoredLabels` to config type and defaults |
| `config/colleague.json` | Add `watchedLabels: []` and `ignoredLabels: []` |
| `data/watched-labels.json` | New runtime file (auto-gitignored via `data/`) |
| `commands/public/config.ts` | Watched/ignored label management UI — design deferred |

---

## Deferred / Out of Scope

- `colleague config` UI for editing watched/ignored/7-day labels — same branch, design separately before implementing
- Hint line exact placement (step 5a) — decided during implementation
- Early unwatch mechanism — part of config UI design
- 7-day label watch via config UI — part of config UI design

---

## Debug Notes

Add `console.log` dump of raw IMAP message objects during development (inside the `fetch` loop in `imap.ts`). Remove at clean-up.

Enable verbose IMAP logging during dev by temporarily setting `logger: console` in `createClient`. Remove at clean-up.
