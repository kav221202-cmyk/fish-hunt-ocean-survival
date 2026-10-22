# Phase 4 test plan — Fish Game API


| ID | Test | Expected result |
|---|---|---|---|
| P4-01 | Open the game through a local HTTP server | Main game and challenge panel render; no startup JS error | Passed |
| P4-02 | Click Load a puzzle with network access | Loading state appears, then API puzzle image and answer form appear | Passed |
| P4-03 | Inspect DevTools Network | GET request targets the documented API endpoint and requests JSON | Passed |
| P4-04 | Submit both correct values from a puzzle | Success feedback and `fishhunt:api-puzzle-solved` event | Passed |
| P4-05 | Submit one or both incorrect values | Helpful retry feedback; answers remain hidden | Passed |
| P4-06 | Load another puzzle while one is visible | Previous answer state resets and new puzzle is shown | Passed |
| P4-07 | Disconnect network or block endpoint | Clear error message; survival game still starts/plays | Passed |
| P4-08 | Simulate/encounter HTTP error or invalid JSON | Error shown, page remains usable | Passed |
| P4-09 | Browser blocks request due to CORS | Error explains network/API access problem; no security workaround | Passed |
| P4-10 | Use keyboard and narrow viewport | Form fields and buttons remain usable on small screens | Passed |
| P4-11 | Play a normal survival round without loading a puzzle | Phase 3 gameplay still works | Passed |
| P4-12 | Check console for runtime errors | No uncaught errors during tested paths | Passed |
