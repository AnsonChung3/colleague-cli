# list-unread — Design Plan (draft)

> Status: draft — pending review and adjustments

## Scope

1. **Label picker** — before emails, show all Gmail labels that have unread, with counts. User picks one or more, then fetch emails from those.
<-label picker is good but I want to see the init/raw output of what the IMAP fetches before further implementation as part of 'I am curious'. Suggest a way that the fetch can be tested or point me towards official docs where I can see examples of output->
2. **Label display format** — `Label name (5)` style, so it reads like a folder list.
3. **Watch a label** — persist a label as "watched" for 7 days. Watched labels always appear in the picker even at 0 unread, so you can notice when something lands in a filtered label.
<-as a more refined idea, I want to have custom persistant watched labels, and the 7-days watch labels on select. I don't want the user be asked 'do you want to watch this label' every day, allow permanent ignore label, so logically, other than persistant watched label and 'inbox', user should only be asked when there are unread in labels they don't mind being notified->
4. **Delete** — add "Move to trash" as an action alongside the existing ones.
5. **UI bug fix** — truncate subject/sender strings to fit terminal width (part of this work).
<-a common thing to see in terminal UI is soft wrap, but I want tit to be smart, so for subjects that leaves enough space to show the sender (including brakcets), render as default, but for subject excceding one line, soft wrap, if the sender append to the end of subject exceeds the line, then display sender on a new line->
6. **README** — deferred.

---

## Proposed interaction flow

```
1. Connect → fetch all labels + their UNSEEN counts
   (filter out system folders: Trash, Sent, Drafts, Spam, All Mail)
2. Merge in watched labels (even if 0 unread)
3. Label picker (multiselect)
     INBOX              (3)
     Work               (1)
     Newsletters        (0)  ← watching
   [+ Watch a label…]        ← extra option at the bottom
4. If "Watch a label…" chosen → secondary picker from all labels → save to watched-labels.json (7-day TTL)
5. If labels chosen → fetch unread emails from all selected labels
6. Email multiselect (subject + sender, truncated to fit terminal)
7. Action picker: Mark as read / Ignore locally / Move to trash / Both (read + trash)
8. Execute, show summary, outro
```
<!--
1. only show labels with unread, omit the unread count. Keep the design to filter out system folders(labels)
2. clarify: does 'merge in' mean on the display, there is no distinguish between unread in 'inbox' and from labels?
2a. On select list-unread, it should show unread subject and sender from inbox regardless (include persistant watched labels), and then show the label names with unread under and ask user if they want to check those labels
3. clarify: what is the trigger scenario?
3a. multi select label picker is good, but omit unread count
The flow needs major work in refining and a more descriptive user flow run down
-->

---

## Technical notes

**Fetching label counts** — ImapFlow can `LIST` mailboxes then `STATUS` each one for `UNSEEN`. Cost is one round trip per label. Could feel slow on accounts with many labels — spinner needed; possibly cap to labels with non-zero counts or recently used.
<-this needs more think through, undecided yet->

**Gmail system folders to exclude** — `[Gmail]/Trash`, `[Gmail]/Sent Mail`, `[Gmail]/Drafts`, `[Gmail]/Spam`, `[Gmail]/All Mail`, `[Gmail]/Important`, `[Gmail]/Starred`.
<-clarify: the important and starred are marked by user, if the unread still sits in 'inbox', would it show?->

**Move to trash** — Gmail IMAP delete = copy to `[Gmail]/Trash`, then delete from source. ImapFlow supports `messageMove`. Recoverable in Gmail, 30-day auto-purge.

**Watch state** — new `data/watched-labels.json`, same TTL pattern as dismissed emails:
```ts
Array<{ label: string; watchedAt: string }> // YYYY-MM-DD, 7-day TTL
```

**UI bug fix** — truncate subject and sender to `process.stdout.columns - 10` before passing to clack multiselect.
<-I don't have enough context from my knowledge about clack, give me more context to understand this ->
---

## Files affected

| File | Change |
|---|---|
| `utils/imap.ts` | Add `getLabelCounts()`, `getUnreadFromLabels(labels[])`, `moveToTrash(uids[], sourceLabel)` |
| `commands/public/listUnread.ts` | Restructure flow; add watch logic |
| `data/watched-labels.json` | New runtime file (already gitignored via `data/`) |

---

## Open questions

- **A.** Should INBOX always appear in the label picker regardless of unread count, or only when it has unread?
<-'inbox' is the current default fetch, it shouldn't change it's current behaviour unless I explicitly state how I want to change it in future comments and plannings ->
- **B.** Should there be a way to unwatch a label early, or is 7-day expiry sufficient?
<-decide later, without thinking thouroughly, I think it should have some mechanic to allow unsubscribe early->
