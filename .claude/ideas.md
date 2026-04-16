# Ideas for future implementation

## Urgent
- update README

## UX/UI Bugs
- list-unread has major UI glitch related to the either force sroll issue or subject/sendder being too long and force new wline issue, it renders the command not usable, urgently needs fixing
- when in stamp sub menu (via main), if user press escape instead of enter, it moves cursor to next line
- pressing enter twice will trigger default behaviour, showing full list of stamps and return to main
- `colleague` on auto complete doesn't add a trailing space
- looks like there is still terminal UI glitch, but it's inconsistant and low priority

## Other designs
- gamify the whole programme, maybe a game mode setting toggle
- on game mode, user assign points to tasks, and completing them gets the score
- use the daily login bonus design from mobile games
- probably also means need some milestone style badges or vanity things that can be used with the cli and is visible

## Internal
- allow disable default task
- allow an array of task to be a default task 'line up', select trigger based on time
- on checking check lists, such as todo list and day-plan list, on confirm, show how many tasks done (number) and a list of un-done tasks
- add hint text to bottom of every screen since escape and enter are not interchangable when exiting vairous levels of menus
- add help as the an option in the main menu
- add quotes that I like here and there
- change window title/name when entering colleague cli

## day-plan
- a mini note, it can be a reminder or extra context for the task, undecided if it is a single note for one day, or affiliated to individual tasks
- either way, default to tasks is still a short phrase only

## stamp
- allow multi select remove stamps
- allow edit one stamp at a time
- hint text when adding new label needs to be mre explicit about pressing enter on blank lable will show the entire list
- allow mutli section on today's stamp history, compute the time difference
- when enter via menu, after adding one stamp, prompt to ask another, return to main requires explicit exit, show hint text
- allow adding 2 separate stamp in the same add action on the same time, this does not affect stamps added individully
- allow read historical text, time range: day, week, month, quarter
- maybe anyalytics, but that possibly relies on LLM

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
- keep a persistant list of on going projects or misc tasks that doesn't need handling immediately
- when the 'I don't know what I am doing next' mood hits, take a look
