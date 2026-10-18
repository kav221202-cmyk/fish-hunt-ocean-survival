# Phase 3 — Game Systems Test Plan

## Purpose
Validate pause/resume, power-ups, optional sound, saved records, and event-based feedback added in Phase 3.

## Test cases

| ID | Test | Steps | Expected result |
|---|---|---|---|
| P3-01 | Pause button | Start a round and click Pause | Overlay appears; game timer and entities freeze |
| P3-02 | Resume button | While paused, click Resume dive | Overlay hides and play continues from the same state |
| P3-03 | Keyboard pause | Start a round and press P or Escape | Game pauses; pressing either again resumes |
| P3-04 | Focus loss | Start a round and switch away from the browser window | Game pauses automatically to avoid unseen damage |
| P3-05 | Shield power-up | Collect an S power-up | Shield effect is shown; shark collisions do not remove a life for the duration |
| P3-06 | Bonus power-up | Collect a + power-up | Score increases by 50 |
| P3-07 | Slow-current power-up | Collect a wave power-up | Sharks move more slowly temporarily |
| P3-08 | Power-up expiry | Wait for a temporary effect to expire | Effect indicator clears and normal rules resume |
| P3-09 | Sound preference | Toggle sound on, reload, check setting | Sound preference remains selected when browser storage is available |
| P3-10 | Sound feedback | With sound on, collect food or a power-up | A short generated sound plays where browser audio is supported |
| P3-11 | Round record | Finish a round | Completed-round, food and total-score counters update |
| P3-12 | Record persistence | Finish a round and reload the page | Best score and aggregate stats remain saved when browser storage is available |
| P3-13 | No storage | Block local storage and play | Game remains playable; saved statistics may not persist |
| P3-14 | HUD consistency | Collect food, take damage, use a bonus | HUD shows correct score, remaining hearts and active effect status |
| P3-15 | No double-save | Finish a round and check counters | Round totals update once for that finished round |
| P3-16 | Mobile controls | Use on-screen directional buttons on a touch device | Player moves while direction is held; buttons release cleanly |
| P3-17 | Event visibility | Open browser developer console and collect food / power-up / take damage | Relevant event listener logs are shown without breaking gameplay |

