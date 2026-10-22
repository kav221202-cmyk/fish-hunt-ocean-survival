# Fish Hunt: Ocean Survival

A browser-based 2D survival game built with HTML, CSS, and vanilla JavaScript for the CIS045-3 Distributed Service Architectures assignment.

## Current phase

**Phase 6 — Virtual Identity and Authentication (browser-only coursework demonstration).** Players must create a local demo profile or sign in to an existing profile before they can start or restart a round. Signing out stops an active round and returns the game to its locked state. This phase adds an authentication gate to the Phase 5 event architecture; it does **not** provide production-grade authentication because there is no trusted server enforcing identity or authorization.

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
- One treasure-chest encounter per run after the food milestone, integrated with the external Fish Game API
- Centralized `fishhunt:*` custom-event contract in `src/events/gameEvents.js`
- Responsive layout

### Virtual identity and authentication

- Create a local demo profile with a username and a made-up 6–12 digit PIN
- Sign in to an existing profile and sign out
- Usernames are case-insensitive for lookup and restricted to 3–20 letters, digits, underscores, or hyphens
- Each profile receives a random salt and profile ID
- The PIN itself is not stored; a PBKDF2-HMAC-SHA-256 verifier is derived with the browser Web Crypto API (150,000 iterations, 256-bit output)
- Profile records are stored in `localStorage`; the current signed-in username is held in `sessionStorage`
- The game Start button is disabled for guests, keyboard start attempts are rejected, and the gameplay loop checks authentication
- Signing out stops the active round and relocks the game
- Authentication lifecycle events are emitted without including the PIN or verifier in their payloads

**Use only made-up demo credentials. Never reuse a real password or PIN.** Browser storage is controlled by the user, and the client code can be changed by the user; therefore, this is an educational demonstration, not production-grade security.

### Fish Game API challenge

- The game requests puzzle data from the external Fish Game API using HTTP `GET` and JSON
- The API adapter in `src/api/fishApi.js` validates the HTTP response, JSON, expected fields, and puzzle-image URL
- The returned puzzle image is displayed with fields for submitting the answer values
- Loading, success, and failure states are shown
- The treasure-chest challenge is designed to trigger once per run after the food milestone, rather than repeatedly interrupting normal play
- API availability depends on network conditions, the external service, and browser cross-origin (CORS) policy

The live API has not been confirmed by this README. Test it in your browser and record the actual outcome before claiming that it works successfully.

## Run locally

JavaScript ES modules and Web Crypto features work most reliably on `localhost` or HTTPS. From the project root, run:

```powershell
py -m http.server 5500
```

Then open <http://localhost:5500>. If `py` is unavailable, try:

```bash
python -m http.server 5500
```

Alternatively, use the VS Code Live Server extension. Stop the Python server with `Ctrl+C`. Do not open `index.html` directly through a `file://` URL; browser module loading and secure-context features may be unavailable there.

## Controls

- `W`, `A`, `S`, `D` or arrow keys: swim
- `P` or `Escape`: pause/resume during a round
- Space: start or restart when allowed by the game state
- On-screen directional buttons: swim on supported touch devices
- Pause and Sound buttons: use the controls above the ocean canvas
- Virtual Identity panel: create a demo profile, sign in, or sign out
- Ocean Puzzle panel: request or practise a Fish Game API puzzle when available

A player must be signed in before starting or restarting a round. If authentication is unavailable because browser storage or Web Crypto is unavailable, the game should remain locked and show an error message.

## Project structure

```text
fish-hunt/
├── index.html
├── README.md
├── styles/
│   └── main.css
├── src/
│   ├── main.js
│   ├── api/
│   │   └── fishApi.js
│   ├── auth/
│   │   └── profileAuth.js
│   └── events/
│       └── gameEvents.js
└── docs/
    ├── phase-1-test-results.md
    ├── phase-2-test-results.md
    ├── phase-3-test-results.md
    ├── phase-4-test-results.md
    ├── phase-5-test-results.md
    └── phase-6-test-results.md
```

The exact set of documentation files may differ if you have kept or added files from earlier phases in your own repository. Do not delete your existing test evidence or proposal documents when merging updates.

## Architecture and assignment concepts

- `index.html` contains the page structure, game canvas, HUD, controls, virtual-identity form, and API puzzle panel.
- `styles/main.css` contains presentation and responsive styling.
- `src/main.js` manages game state, input, simulation, collision checks, rendering, power-ups, sound, local statistics, round transitions, the API panel, and gameplay access gating. This file still has several responsibilities and could be split into smaller modules in a future refactor.
- `src/api/fishApi.js` isolates the external HTTP request and response validation from the main UI logic. The browser `fetch()` API makes an HTTP `GET` request and requests JSON.
- `src/auth/profileAuth.js` implements the local demo-profile workflow, PIN verifier derivation, session marker, and authentication lifecycle events.
- `src/events/gameEvents.js` centralizes custom event names and helpers. These are same-browser events for modular coordination, not a distributed message broker. A client event must never be treated as proof of identity or permission.
- `localStorage` stores game preferences/statistics and local demo account records. `sessionStorage` stores the current demo sign-in marker. These stores can be edited or cleared by the user.

## Security assessment and production alternative

Phase 6 implements a functional sign-in-before-play UI/application gate, but it is **not production-grade authentication**. All HTML and JavaScript run on the player's device. A technically capable user can edit client code, modify browser storage, or use developer tools to bypass the gate. There is no trusted server, server-side authorization, rate limiting, account recovery, or server-validated score/reward handling. PBKDF2 and per-profile salts avoid storing a raw PIN, but they do not make client-side identity secure. Numeric PINs have limited entropy and can be guessed offline if a verifier is copied.

For a real deployment, use a managed identity provider such as Supabase Auth or Firebase Authentication, or implement authentication on a trusted backend. A backend must verify identity and authorize protected operations. If using Supabase, configure Row Level Security for user-owned records. Never put service-role keys, database passwords, or other private secrets in browser JavaScript. Validate scores and rewards on the server if they must resist tampering. A custom backend would also need secure transport (HTTPS), suitable password hashing such as Argon2id or scrypt, secure session handling, rate limiting, input validation, account recovery, and CSRF protections where relevant. This package does not configure or deploy such a backend/provider.

Alternatives include a server-issued anonymous player ID for lightweight play, an OAuth 2.0 / OpenID Connect identity provider, or WebAuthn/passkeys. Each real option still requires server-side validation and authorization. Confirm with the lecturer which level is required before implementing a production backend.

## Testing

Use the Phase 6 identity documentation and test-results template in `docs/`. Record only results observed in your browser; do not mark a test as passed merely because the code is present.

At minimum, test:

1. Guest attempts to start with the Start button and keyboard; the game remains locked.
2. Create a valid demo profile; the profile is created and the game unlocks.
3. Duplicate username, invalid username, and invalid PIN inputs are rejected.
4. Sign in with correct credentials succeeds; incorrect credentials fail and keep gameplay locked.
5. Sign out stops an active round and relocks the game.
6. Reload behaviour matches the documented session handling.
7. Storage-disabled or unavailable Web Crypto paths show an error and do not unlock the game.
8. Stored account data contains no raw PIN; authentication event payloads contain no PIN or verifier.
9. Existing gameplay still works after sign-in, including pause/resume, collisions, scoring, power-ups, timer, and restart.
10. The treasure-chest challenge and live Fish Game API request work, or their observed failure is documented.

Inspect the browser developer console for errors and capture screenshots of actual results for the assignment evidence. If a test fails, record the observed behaviour and fix it before reporting the test as passed.

## Acknowledgements and references

- Fish Game API: <https://marcconrad.com/uob/fish/doc.php>
- MDN Web Docs — Fetch API: <https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API>
- MDN Web Docs — Web Crypto API: <https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API>
- MDN Web Docs — `localStorage`: <https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage>
- MDN Web Docs — `sessionStorage`: <https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage>
- OWASP Authentication Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html>
- OWASP Password Storage Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>


