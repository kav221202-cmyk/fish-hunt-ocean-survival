# Phase 2 — Core Gameplay Test Plan

## Purpose
Verify that the Fish Hunt survival loop works before the external Fish Game API is integrated.

## Test cases

| ID | Test | Steps | Expected result |
|---|---|---|---|
| P2-01 | Initial state | Open the game page | Ready overlay appears; score is 0000, timer is 60 seconds, and 3 hearts are shown |
| P2-02 | Start game | Select Start swimming | Overlay hides and the game begins |
| P2-03 | Keyboard movement | Use W/A/S/D and arrow keys | Player moves in the chosen direction |
| P2-04 | Boundary handling | Move toward each edge | Player remains inside the ocean area |
| P2-05 | Diagonal movement | Hold an up key and a side key | Player moves diagonally without exceeding normal movement speed |
| P2-06 | Collect food | Swim into a glowing food item | Food disappears and score increases by 10 |
| P2-07 | Shark collision | Touch a shark | One heart is removed; temporary invulnerability prevents immediate repeated damage |
| P2-08 | Health game over | Lose all hearts | Round stops and game-over overlay appears |
| P2-09 | Timer game over | Survive until timer reaches zero | Round ends with completion overlay |
| P2-10 | Restart | Select Dive again | Score, timer, health, player position and objects reset |
| P2-11 | Difficulty progression | Continue playing past 15 seconds | Sharks become faster over time |
| P2-12 | Best score | Finish a round with a higher score, then reload | Best score is saved in browser storage when available |
| P2-13 | Storage unavailable | Block browser storage and play | Game remains playable; best-score persistence may be unavailable |
| P2-14 | Touch controls | Use on-screen directional controls on a touch device | Player moves while a direction is held |
| P2-15 | API independence | Play while offline / API endpoint unavailable | Core survival game still starts because Phase 2 does not call the API |

## Recording results
Run each test in the browser and record `Pass`, `Fail`, or `Blocked` with notes in `phase-2-test-results.md`. Do not mark a test as passed until you have actually performed it.
