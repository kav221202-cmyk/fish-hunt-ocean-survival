# Fish Hunt: Ocean Survival

A browser-based 2D survival game built with HTML, CSS, and vanilla JavaScript modules for the CIS045-3 Distributed Service Architectures assignment.

## Current phase

Phase 3 adds pause/resume, temporary power-ups, optional generated sound effects, persistent local statistics, and event-based game feedback. The Fish Game API is not yet integrated; core gameplay remains independent of the external service.

## Features

- Keyboard movement with W/A/S/D or arrow keys
- On-screen touch controls on small screens
- Food collection worth 10 points
- Sharks, health, temporary hit invulnerability and increasing difficulty
- 60-second round timer and game-over/restart flow
- Pause/resume using the Pause button, `P`, or `Escape`
- Automatic pause when the browser window loses focus
- Shield power-up: prevents shark damage temporarily
- Bonus power-up: awards 50 points
- Slow-current power-up: temporarily slows sharks
- Optional short sound effects using the Web Audio API, with a saved preference
- Best score and aggregate round/food/score statistics saved locally when browser storage is available
- Custom events for round start/pause/resume/finish, food collection, player hits, and power-up collection
- Responsive layout and reduced-motion preference support

## Run locally

Serve the project over HTTP because the JavaScript uses an ES module.

```powershell
py -m http.server 5500
```

Open <http://localhost:5500>. If `py` is unavailable, try `python -m http.server 5500`. Stop the server with `Ctrl+C`.

## Controls

- `W`, `A`, `S`, `D` or arrow keys: swim
- `P` or `Escape`: pause/resume during a round
- Space: start or restart when the overlay is visible
- On-screen directional buttons: swim on supported touch devices
- Pause and Sound buttons: use the controls above the ocean canvas

## Project structure

```text
fish-hunt/
├── index.html
├── README.md
├── styles/
│   └── main.css
├── src/
│   ├── main.js
│   └── api/
│       └── fishApi.js
└── docs/
    ├── api-investigation.md
    ├── phase-1-test-results.md
    ├── phase-2-test-results.md
    ├── phase-3-test-results.md


## Architecture notes

- `index.html` contains page structure, the canvas, HUD, and controls.
- `styles/main.css` contains visual styling and responsive rules.
- `src/main.js` manages state, input, simulation, collision checks, rendering, power-ups, sound, persistence, and round transitions.
- `src/api/fishApi.js` is retained as a placeholder for later API integration.

The animation loop uses `requestAnimationFrame`. DOM events handle input. Custom `fishhunt:*` events announce game outcomes so later features can respond without being responsible for the underlying collision or scoring logic. This is a useful event-driven design seam, but it is not a message broker or distributed event bus.

Browser `localStorage` is used only for convenience statistics and preferences. It does not authenticate a player, prove identity, or securely protect scores from editing. A future virtual-identity feature must be documented separately.

## Testing

Follow `docs/phase-3-test-plan.md` and update `docs/phase-3-test-results.md` with observed results. The template intentionally starts with all tests marked `Not tested`.

## Academic integrity and attribution

If you use external code, tutorials, AI-generated code, or third-party assets while developing or modifying this project, acknowledge them in comments and/or submission documentation in line with your unit's rules. Do not claim that all code was written independently if that would be inaccurate.

## Planned future work

1. Integrate the Fish Game API as a puzzle challenge, based on its documented response contract.
2. Design and implement virtual player identity and a suitable score-history approach.
3. Expand automated/manual testing and critically document architectural alternatives and limitations.
