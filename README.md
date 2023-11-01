# ToDoQu

Life is full of small tasks that don't need to be done very often, but do need to be done. The natural solution is to batch these jobs together, and knock them out in chunks - most people would call this "chores", or "cleaning". However, sometimes it's easier to do small parts of these jobs every now and then, sacrificing the time equivalent of pocket change daily, rather than putting aside a lump sum on payday. No-one wants to sacrifice all of a Saturday cleaning a house, but a few minutes a day can eliminate the need to do it at all.

ToDoQu is a flexible queue of what needs to be done. You can atomize chores, and be reminded to do them at your own pace when you get the time. Jobs are marked as done, and after some time become "**stale**". Stale tasks need to be completed, and become **overdue** after some window. Each job has its own schedule, and a scoreboard tracks who's done how much.

Atomizing and distributing chores across both people and time makes it easier to maintain a high level of order in a home.

To see a live version of this app, please take a look at the [instance I host on my home server](https://todoqu.wildjames.com/). 


## An example

Personally, I believe the task of properly cleaning a house to be impossible. Any sane person gets bored, and inevitably half-asses the last hour or two. Even if they didn't, not everything always needs to be done. To illustrate, consider a single room.

Cleaning the living room is actually several tasks. We need to clear debris from the coffeetable and put it away, and we need to fold the throw blanket and plump the pillows. However, this is only surface level - the skirting boards need to be wiped down every now and again, the room needs to be vacuumed, and the sofa needs to be scrubbed of cat hair. Notice that some of these things need to be done only infrequently. Most people would call them "Spring cleaning", and realistically not bother. 

Using ToDoQu, we could set the vacuuming to be done at least every 5 days, and at most every 9. You would get a nudge 5 days after marking the task as done, suggesting it needs doing again. Leaving it more than 9 days will start it pulsing, and raise it to the top of the screen. Something like clearing the coffeetable can be set to be done daily, but allow a week or more since it may not always need doing, and wiping the skirting board can be set to need doing after several months, with a month or two to get done. 

ToDoQu works better the more you can break down tasks. However - I recommend not splitting a chore across two tasks! For example, "Do the laundry" is good, "Put the laundry in" and "Take the laundry out" is not.


## Brownie Points

ToDoQu is able to track the core contributions from its users. Completing tasks awards brownie points based on three factors: 
- The time it took
- How gross was it to do
- Some random jitter

The random jitter is just there to keep the numbers more interesting. Note that multiple people can be credited with doing a task, and tasks can be dismissed without crediting anyone at all.
