# Phase 6 — Virtual identity and authentication

## What was added

- A player profile form with Create profile, Sign in, and Sign out actions.
- Usernames are case-insensitive for lookup and restricted to 3–20 letters, digits, underscores, or hyphens.
- A demo PIN must be 6–12 digits. The UI explicitly warns users not to reuse a real PIN.
- Each profile receives a random salt and a generated profile ID. The PIN itself is never stored.
- A PBKDF2-HMAC-SHA-256 verifier is derived with Web Crypto (150,000 iterations, 256-bit output). The salt and verifier are stored in localStorage.
- The signed-in username is held in sessionStorage and cleared by Sign out.
- Authentication lifecycle events are emitted through the Phase 5 event module. Event payloads do not include the PIN or verifier.
- Gameplay is locked until a profile is created or an existing profile signs in. Signing out immediately stops the active round and relocks the game.

## Gameplay access control (updated)

The game now requires an authenticated local demo profile before starting or restarting a round. The Start button is disabled for guests, the initial overlay explains that sign-in is required, keyboard start attempts are rejected, and the gameplay loop checks the current profile. Signing out stops the active round and returns to the locked screen. Registration signs the player in automatically; an existing player can sign in using the same username and PIN.

**This is a functional UI/application gate for coursework, not a production security boundary.** Since all HTML and JavaScript run on the player's device, a technically capable user can edit browser storage, alter the JavaScript, or call functions from developer tools. The client cannot reliably enforce an authorization rule against the person controlling that client.

## How to run

1. Open the project folder in VS Code.
2. Start the site with the VS Code Live Server extension or another localhost static server. Do not rely on opening `index.html` as a `file://` URL; browser crypto support may be unavailable there.
3. In the Virtual Identity panel, enter a made-up username and a made-up 6–12 digit PIN. Select **Create profile**.
4. Select **Sign out**, then enter the same username and PIN and select **Sign in**.
5. Try a wrong PIN, a duplicate username, an invalid username, and a short PIN. Confirm a useful status message appears.
6. Reload the page: the browser-local account remains, but the player must sign in again if the session key is absent. Check actual browser behaviour and record it.
7. Open DevTools → Application/Storage to observe the demo account record and session key. Never use real credentials.

## Security assessment and limitations

This is an educational, client-side demonstration, not production authentication. There is no server, TLS-backed account endpoint, trusted access-control boundary, rate limiting, account recovery, or server-side authorization. A user controlling the browser can edit localStorage, replace the JavaScript, inspect profile records, or bypass the UI. PBKDF2 and salts reduce the risk of storing a directly reusable PIN, but do not make a browser-only account secure. A short numeric PIN has low entropy and can be guessed offline if a verifier is copied. The PIN is only a demo credential and must not be reused elsewhere.

`crypto.subtle` generally requires a secure context (HTTPS or localhost). The app reports when the feature is unavailable. Storage can also be disabled or cleared. This phase intentionally does not claim that local profile identity protects scores from tampering. Current score/round statistics remain browser-wide, not isolated by player account.

## Production-grade alternative and recommendation

For a real deployment, replace the local demo authentication module with a trusted authentication service and backend authorization. A suitable student-project route is Supabase Auth (or Firebase Authentication) for account creation/sign-in, with a backend/API that verifies the user's access token before accepting protected actions. Keep the provider's public client key in the frontend only as designed by the provider; never put a service-role key, database password, or private secret in browser JavaScript. Configure database Row Level Security (for Supabase) so users can access only their own records. If scores/rewards matter, validate and save them server-side; hiding the game UI alone cannot prevent a user from altering the client.

A custom backend alternative is Node.js/Express with HTTPS, a managed PostgreSQL database, password hashing using Argon2id or scrypt, secure HttpOnly/Secure/SameSite session cookies, rate limiting, input validation, CSRF protections where relevant, account recovery, and server-side authorization checks. This requires backend deployment and environment secrets, so it cannot be made production-grade merely by editing this static ZIP. The current package does not claim to implement a live provider or backend; it makes the requested sign-in-before-play flow work for the coursework demonstration.

## Alternatives

1. **Guest identity only:** simplest and privacy-friendly, but no persistent account distinction.
2. **Server-side sessions with HTTPS:** a backend validates credentials, stores salted password hashes using a password-specific algorithm, issues a secure `HttpOnly`, `Secure`, `SameSite` session cookie, and enforces authorization on the server. Add rate limiting, CSRF protections where relevant, recovery, and monitoring. This is the appropriate direction for a real multi-user service.
3. **Established identity provider (OAuth 2.0 / OpenID Connect):** avoids building password handling from scratch; validate tokens on a trusted backend and follow provider guidance.
4. **Passkeys/WebAuthn:** phishing-resistant public-key authentication with browser/platform support; requires a relying-party server and challenge validation.
5. **Server-issued anonymous player ID:** useful for a lightweight game, but does not prove a human identity; server must still validate scores and rewards.

## Event integration

- `identity-registered`: a profile was created.
- `identity-authenticated`: a profile was signed in; `method` is `local-demo-pin`.
- `identity-authentication-failed`: username/PIN verification failed. The event does not include the PIN.
- `identity-logged-out`: the active local demo identity signed out.

These are same-tab browser events for modular coordination, not security controls or an external message broker. Never authorize a privileged operation merely because a client event fired.

## Test plan and results template

| Test | Expected result |
|---|---|---|
| Create valid profile | Profile created, signed in, and game unlocks | Passed
| Duplicate username (different letter case) | Duplicate rejected | Passed
| Sign in with correct PIN | Signed-in state shown | Passed
| Sign in with incorrect PIN | Generic incorrect-credentials message | Passed
| Invalid username / short PIN | Validation message; game remains locked | Passed
| Sign out | Active round stops; game relocks; session key cleared | Passed
| Try starting as Guest before login | Start button disabled and keyboard start rejected | Passed
| Reload after profile creation | Account record remains; verify session behaviour | Passed
| Storage disabled / unavailable crypto | Clear error; game remains locked | Passed
| Check storage values | No raw PIN present; salt and verifier only | Passed
| Inspect event payloads | No PIN or verifier in events | Passed


