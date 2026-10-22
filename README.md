# Fish Hunt: Ocean Survival

A browser-based 2D survival game built with HTML, CSS, and vanilla JavaScript for the CIS045-3 Distributed Service Architectures assignment.

## Current phase

**Phase 5 — Architecture and event-contract refinement.** This version retains the survival-game features and the one-treasure-per-run Fish Game API challenge, and introduces a dedicated local event module to make event names and subscriptions more consistent. The API request and response handling are implemented in `src/api/fishApi.js`; successful live operation must still be confirmed by running the project in the target browser and recording test results.

## Features

### Survival game

- Keyboard movement with W/A/S/D or arrow keys
- On-screen touch controls on small screens
- Food collection and score tracking
- Sharks, health, temporary hit invulnerability, and increasing difficulty
- 60-second round timer and game-over/restart flow
- Pause/resume using the Pause button, `P`, or `Escape`
- Automatic pause when the browser window loses focus
- Shield, bonus-score, and slow-current power-ups
- Optional generated sound effects using the Web Audio API, with a saved preference
- Best score and aggregate round/food/score statistics saved locally when browser storage is available
- Centralized `fishhunt:*` event contract in `src/events/gameEvents.js` for game and API-challenge activity
- Responsive layout

### Fish Game API challenge

- A button requests puzzle data from the external Fish Game API using HTTP `GET` and JSON.
- The API adapter validates the HTTP response, JSON, expected fields, and puzzle-image URL.
- The interface displays the returned puzzle image and provides fields for submitting the two answer values.
- Loading, success, and failure states are shown in the interface.
- The main survival game is designed to remain playable when the API challenge cannot load.

The API integration is implemented, but do not describe it as successfully tested until you have run it and recorded the observed results. The treasure encounter is intended to trigger once per run after the food milestone; ordinary food collection should not repeatedly reopen it. Browser cross-origin restrictions (CORS), network conditions, or service availability may prevent the request from succeeding.

## Run locally

Run a local HTTP server from the project root because the application uses JavaScript ES modules:

```powershell
py -m http.server 5500
```

Then open <http://localhost:5500>. If `py` is unavailable, try:

```bash
python -m http.server 5500
```

Stop the server with `Ctrl+C`. Do not open `index.html` directly through a `file://` URL; module loading and fetch behaviour may differ.

## Controls

- `W`, `A`, `S`, `D` or arrow keys: swim
- `P` or `Escape`: pause/resume during a round
- Space: start or restart when the game overlay is visible
- On-screen directional buttons: swim on supported touch devices
- Pause and Sound buttons: use the controls above the ocean canvas
- Load a puzzle: request an API puzzle in the Ocean Puzzle panel

## Project structure

```text
FishHunt_Phase4/
├── index.html
├── README.md
├── styles/
│   └── main.css
├── src/
│   ├── main.js
│   ├── api/
│   │   └── fishApi.js
│   └── events/
│       └── gameEvents.js
└── docs/
    ├── phase-1-test-results.md
    ├── phase-2-test-results.md
    ├── phase-3-test-results.md
    ├── phase-4-results.md
    └── phase-5-test-results.md


## Architecture and assignment concepts

- `index.html` contains the page structure, game canvas, HUD, controls, and API puzzle panel.
- `styles/main.css` contains the presentation and responsive styling.
- `src/main.js` manages game state, input, simulation, collision checks, rendering, power-ups, sound, local statistics, round transitions, and API-panel interactions.
- `src/api/fishApi.js` isolates the HTTP request and response validation from the main UI logic. This is a modular boundary that helps reduce coupling, although much of the game logic remains in `main.js`.
- The browser `fetch()` API makes an HTTP `GET` request to the external service and requests JSON. This is the interoperability mechanism; the browser and external API must be able to communicate successfully for the live challenge to work.
- DOM listeners and custom `fishhunt:*` events demonstrate event-driven programming within the browser. These custom events are local browser events, not a distributed message broker or event bus.
- `localStorage` is used for convenience statistics and preferences only. It is user-editable and does not establish secure virtual identity or authenticate a player. Authentication remains a separate area of future work.

Review `docs/phase-4-architecture-notes.md` and `docs/phase-5-architecture-notes.md` for the API boundary, local event contract, limitations, and alternative approaches, including a controlled backend adapter if browser CORS restrictions prevent direct access.

## Testing

Use `docs/phase-4-test-plan.md` to test the API challenge and confirm that the survival game still works. Record only observed results in `docs/phase-4-results-template.md`; do not mark tests as passed before actually running them. Earlier-phase test documents are historical records and should be updated only with results from tests you have performed.

At minimum, test the normal gameplay, loading a puzzle, displaying the returned image, correct and incorrect answer submissions, and the API failure path. Inspect the browser console for errors. If the API request fails, record the actual error and discuss the cause and possible alternatives with your tutor; do not disable browser security to bypass CORS.

## Academic integrity and attribution

The assignment brief allows the use of external examples and AI-generated code, but assistance and code that did not originate from you must be clearly acknowledged and referenced according to the unit's requirements. Review and understand the code, mark or document external/AI assistance appropriately, and ensure your explanation in the video reflects your own understanding. This README is supporting documentation, not a claim that every feature has been tested or that all code was independently authored.

## Next development steps

1. Run and document Phase 4 tests, including whether the live API request succeeds in your browser.
2. If direct browser access is blocked, discuss a backend adapter or another tutor-approved approach and document the trade-offs.
3. Develop a suitable virtual-identity/authentication mechanism as the next phase. Do not treat a display name or `localStorage` value as secure authentication.
4. Prepare to explain the architecture, event handlers, HTTP/JSON interoperability, authentication design, alternatives, and limitations in your own words for the assessment video.