# Ideas for future implementation

## UX/UI Bugs
- UI glitch persist across a few commands which no new lines happened, i.e. entering a submenu via main will bring the text display to the top of the window which is the correct and expected beavhiour, but the the UI glitch persists. Read details in .claude/knowledge/clack-internals.md for more context and details from previous time when I was fixing a similar, if not identical, UI bug.
- UI behaviour when pressing enter, or escape, on empty stamp label input is inconsistant. Sometimes it behaves correctly, i.e. press enter to show existing entries form current day, escape to exit. When it behaves buggy, it appears similar to the UI new line glitch, it will show no visual response, an require a second press to show the correct behaviour. Needs investigation
- `colleague` on auto complete doesn't add a trailing space
- reorder or allow reorder of list of submenus, allow custom categories, or default to the same categories as the help flag menu
- look for built in options(from the npm packages that I use to build this cli) for cli visual. Can do with a bit of customisation/beautification

## Misc tasks
- scan and see if help flag on all levels (e.g. colleage -h, and colleague stamp -h) needs updating to match with current project state
- update screenshots in README
- put in real URL for the repo in README
- update the maintenance guide, the relink npm script includes source ~/.bashrc


## Other designs
- gamify the whole programme, allow toggle via config
- on game mode, user assign points to tasks, and completing them gets the score
- use the daily login bonus design from mobile games
- probably also means need some milestone style badges or vanity visual items as reward
- IMPORTANT: boot git bash and colleague cli on machine start up as a bridge action

## Internal
- on checking check lists, such as todo list and day-plan list, on confirm, show how many tasks done (number) and a list of un-done tasks. Update: it has been implemented to day-plan. This potentially is a refactor task
- add hint text to bottom of every screen since escape and enter are not interchangable when exiting vairous levels of menus. Low priority
- add help as the an option in the main menu, categorise it together with config
- add quotes that I like here and there, need to design trigger points
- change window title/name when entering colleague cli, high priority because I want it

## day-plan
- a mini note, it can be a reminder or extra context for the task, undecided if it is a single note for one day, or affiliated to individual tasks
- either way, default to tasks is still a short phrase only

## stamp
- allow multi select remove stamps
- allow edit one stamp at a time
- hint text when adding new label needs to be more explicit about pressing enter on blank lable will show the entire list. As part of the UI/UX improvement, press enter on empty label shouldn't say undefined any more
- allow mutli selection on today's stamp history, compute the time difference
- when enter via menu, after adding one stamp, prompt to ask another, return to main requires explicit exit, show hint text
- allow adding 2 separate stamp in the same add action on the same time, this does not affect stamps added individully
- allow read historical text, time range: day, week, month, quarter
- maybe anyalytics, but that possibly relies on LLM, low priority

## list-unread
- allow delete email in Gamil via IMAP
- show label name with unread and number of
- on choose, show unread subject and sender the same was as default inbox
- allow choosing label and keep watch for 7 days

## new command: count
- allow create new named counters
- allow remembering historic/frequently used counters

## new command: schedule shut down
- allow set schedule force shut down machine, and auto time stamp
- special note: I usually run Colleague from git bash, and git bash can't excute this directly, so in src, may have to do something similar to make sure it runs
```
import { exec } from 'child_process';
exec('shutdown /s /t 7200 /f');
```
## new command: remind me
- keep a persistant interactive checklist of on going projects or misc tasks that doesn't need handling immediately
- for the sake of organising information display, allow category title/header above individual tasks, e.g. category title: colleague cli, tasks: do up the list-read; bug fix; update docs
- when the 'I don't know what I am doing next' mood hits, take a look
