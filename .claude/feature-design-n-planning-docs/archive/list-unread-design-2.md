<- This is a response file foe the live chat session->

# scope 1
- I presume it would be useful to have the condole log statement when the feature still being developed and it would be easy to remove at the clean up syep

# scope 3.5
- clarify flow
  2. action picker for INBOX unreads
  2a. execute actions (mark read/ignore/delete)
    if user choose to not check other labels, outro
  3. as described
  4. multi select and action picker
  4a. same with 2a, show hint line about config
  4b. after executing actions for other labels, menu loop is completed, outro
- actions picked at any level should just be executed, there is no point in waiting or deferring

# others
- Multi-label optgroups: good to know clack has built in funtionality of what I want. print hint text on the menu to notify user that group header targets all items in a group
- Multi-label optgroups no new/blank line constrain: instead of inserting fake, empty option, opt for indenting the text of individual item label, and show the group header in block letter to add on to the visual distinction
- Step 5.2 — action picker format: I used mixed terminologies. Current behaviour is multiselect, enter to proceed, action picker(single choice), and then enter to confirm excute. Prompt me again if further clarification is needed
- I use 'remove' and 'move to trash' interchangably, I mean the same action
- Hint line placement (step 5.5): undecided and defer. Eventually it depends on the flow inplementation
