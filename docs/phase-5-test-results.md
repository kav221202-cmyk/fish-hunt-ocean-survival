# Phase 5 — Architecture and event integration test plan


| ID | Test | Expected result | Result |
|---|---|---|---|
| P5-01 | Parse/check `src/main.js` as an ES module | No syntax errors | Passed |
| P5-02 | Parse/check `src/api/fishApi.js` as an ES module | No syntax errors | Passed |
| P5-03 | Parse/check `src/events/gameEvents.js` as an ES module | No syntax errors | Passed  |
| P5-04 | Start a new dive | Game starts; round-started event can be observed in DevTools | Passed  |
| P5-05 | Collect food before milestone | Score and food count update; no treasure opens | Passed  |
| P5-06 | Collect the tenth food item | One treasure challenge opens and the game pauses | Passed |
| P5-08 | Submit an incorrect puzzle answer | Feedback shown; no reward granted; challenge stays active | Passed  |
| P5-09 | Submit a correct puzzle answer | +50 points, 8-second shield, challenge closes and game resumes | Passed  |
| P5-10 | Simulate API/network failure | Error feedback shown; game remains recoverable and retry is possible |Passed |
| P5-11 | Start another dive after game over | Treasure milestone flag resets for the new run | Passed  |
| P5-12 | Check browser console | No unexpected errors; expected event diagnostics may appear | Passed  |
