/**
 * Local browser event contract for Fish Hunt.
 *
 * These events coordinate modules inside this browser tab. They are not a
 * distributed message broker and should not be treated as trusted security
 * signals. Keep payloads small and avoid including secrets or puzzle answers.
 */
export const GAME_EVENTS = Object.freeze({
  ROUND_STARTED: "round-started",
  ROUND_PAUSED: "round-paused",
  ROUND_RESUMED: "round-resumed",
  ROUND_FINISHED: "round-finished",
  FOOD_COLLECTED: "food-collected",
  PLAYER_HIT: "player-hit",
  POWERUP_COLLECTED: "powerup-collected",
  TREASURE_CHEST_DISCOVERED: "treasure-chest-discovered",
  API_PUZZLE_CHALLENGE_STARTED: "api-puzzle-challenge-started",
  API_PUZZLE_LOADING: "api-puzzle-loading",
  API_PUZZLE_LOADED: "api-puzzle-loaded",
  API_PUZZLE_ERROR: "api-puzzle-error",
  API_PUZZLE_SOLVED: "api-puzzle-solved",
  API_PUZZLE_ATTEMPT: "api-puzzle-attempt",
  API_PUZZLE_REWARD_GRANTED: "api-puzzle-reward-granted",
  IDENTITY_REGISTERED: "identity-registered",
  IDENTITY_AUTHENTICATED: "identity-authenticated",
  IDENTITY_AUTHENTICATION_FAILED: "identity-authentication-failed",
  IDENTITY_LOGGED_OUT: "identity-logged-out",
});

const PREFIX = "fishhunt:";

/** Emit a documented local event with a plain-object detail payload. */
export function emitGameEvent(name, detail = {}) {
  if (typeof name !== "string" || !name.trim()) {
    throw new TypeError("A non-empty game event name is required.");
  }
  window.dispatchEvent(new CustomEvent(`${PREFIX}${name}`, {
    detail: detail && typeof detail === "object" ? detail : { value: detail },
  }));
}

/** Subscribe to one game event. Returns an unsubscribe function for cleanup. */
export function onGameEvent(name, handler, options = {}) {
  if (typeof handler !== "function") {
    throw new TypeError("A game event handler must be a function.");
  }
  const eventName = `${PREFIX}${name}`;
  window.addEventListener(eventName, handler, options);
  return () => window.removeEventListener(eventName, handler, options);
}
