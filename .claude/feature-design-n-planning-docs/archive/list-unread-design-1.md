<- This is a response file to the live chat session ->

# scope 1
1. where will the logger log to? I run the cli in the terminal and does not have a tradition wb app set up: run local server in a terminal, console.log will print in web browser console or dev server terminal

# scope 2
1. Omit count

# scope 3
1. what is TTL?
2. permanent watch/ignore in config is good
3. clarify: "when a user selects ... 'other labels'". Actively choosing a label for 7 days watch should be its own action. Allow one-off checking
5. clarify/extra context for reference of user flow
  1. as described
  2. multiselect for mark read/ignore locally/remove
  3. as described, default it to one off-check
  3a. if choose to not check oter labels, excute and outro
  4. show subjects and senders in the same manner as INBOX, follow by the same multiselect for action picker
  5. mostly as described, but no auto add to 7 day watch. Show single line hint at the end to remind the user change to permanant watch/permanent ignore/7-day watch should be done via config
  6. excute and outro
5a. Review this user flow I described, offer suggestions and ask for clarifications if any


# scopr 5
at a glance, it looks fine

# Others
- early unwatch: this should be part of the list unread config design, defer
- multi-label email results: the tricky question is the email result check list for action picker is a checklist. Can it contain unselectable headers similat to html option groups? If it can, then format it similar to html action group, start each group by an unselectable/does nothing group header, follow by options of the same group, for visual clarity, insert blank line between groups
- gmail important/starred: as those are not canoonical label, disregard them in the cli design
