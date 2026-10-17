# Fish Hunt: Ocean Survival

A browser-based 2D survival game built with HTML, CSS, and vanilla JavaScript modules for the CIS045-3 Distributed Service Architectures assignment.

## Current phase

Phase 2 implements the core survival gameplay. The external Fish Game API is documented but not integrated yet; core gameplay deliberately works independently of it.

## Features

- Keyboard movement using W/A/S/D or arrow keys
- On-screen touch directional controls on narrow screens
- Collectible food items worth 10 points
- Sharks that remove one heart on collision
- Three starting lives and temporary post-hit invulnerability
- 60-second round timer
- Increasing shark speed and spawn pressure over time
- Game-over and restart flow
- Best score saved in local browser storage when available
- Custom browser events for food collection and player hits
- Responsive layout and reduced-motion preference support

## Run locally

Because `src/main.js` uses an ES module, serve the project over HTTP instead of opening `index.html` directly.

### Python
From the project root:

```powershell
py -m http.server 5500
```

Then open <http://localhost:5500>.

If `py` is not available, try:

```powershell
python -m http.server 5500
```

Stop the server with `Ctrl+C`.

## Controls

- `W`, `A`, `S`, `D` or arrow keys: swim
- Space: start or restart when the overlay is visible
- Touch buttons: swim on supported small-screen devices

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
    ├── phase-2-test-plan.md
    └── phase-2-test-results.md
```

## Architecture notes

- `index.html` defines the page structure and accessible controls.
- `styles/main.css` contains visual styling and responsive rules.
- `src/main.js` owns game state, input, update logic, collision detection, drawing, HUD updates, and round transitions.
- `src/api/fishApi.js` remains a placeholder for a later phase.

The main game logic uses a `requestAnimationFrame` loop. Player input is handled through DOM events, while game outcomes are also announced using custom events (`fishhunt:food-collected` and `fishhunt:player-hit`). These events create extension points for later UI feedback, telemetry, or integration without requiring those listeners to own the core collision logic.

## Testing

Follow `docs/phase-2-test-plan.md` and record only observed outcomes in `docs/phase-2-test-results.md`.

## Academic integrity and attribution

This project uses standard browser APIs and original project-specific game logic. If you use external code, tutorials, AI-generated code, or third-party assets while developing or modifying the project, acknowledge them in comments and/or your submission documentation in line with your unit's rules. Do not claim that all code was written independently if that would be inaccurate.

## Planned future work

1. Integrate the Fish Game API as a puzzle challenge.
2. Add virtual player identity and score history.
3. Expand automated/manual testing and document architecture decisions.
