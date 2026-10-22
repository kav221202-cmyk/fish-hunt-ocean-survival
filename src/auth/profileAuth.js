/**
 * Phase 6 — browser-only identity/authentication demonstration.
 * Password/PIN verifiers are derived with PBKDF2 + a per-account random salt.
 * This is NOT production authentication: browser storage and client code are
 * controlled by the user. A real deployment needs a trusted server.
 */
import { emitGameEvent } from "../events/gameEvents.js";

const ACCOUNTS_KEY = "fishHuntDemoAccountsV1";
const SESSION_KEY = "fishHuntDemoSessionV1";
const PBKDF2_ITERATIONS = 150000;

function readAccounts() {
  try {
    const value = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}
function writeAccounts(accounts) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    return true;
  } catch {
    throw new Error("Browser storage is unavailable. Allow site storage and try again.");
  }
}
function normaliseUsername(value) { return String(value || "").trim(); }
function accountKey(value) { return normaliseUsername(value).toLowerCase(); }
function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
function base64ToBytes(value) {
  return Uint8Array.from(atob(value), character => character.charCodeAt(0));
}
function requireCrypto() {
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
    throw new Error("Secure browser crypto is unavailable. Open the game through VS Code Live Server or localhost.");
  }
}
async function derivePinVerifier(pin, salt) {
  requireCrypto();
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS }, material, 256);
  return new Uint8Array(bits);
}
function sameBytes(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}
function validateCredentials(username, pin) {
  const cleanName = normaliseUsername(username);
  if (!/^[A-Za-z0-9_-]{3,20}$/.test(cleanName)) {
    throw new Error("Username must be 3–20 characters using letters, numbers, underscore or hyphen.");
  }
  if (!/^\d{6,12}$/.test(String(pin || ""))) {
    throw new Error("PIN must contain 6–12 digits. Do not reuse a real account PIN.");
  }
  return cleanName;
}

export function getCurrentProfile() {
  try {
    const username = sessionStorage.getItem(SESSION_KEY);
    if (!username) return null;
    const account = readAccounts()[accountKey(username)];
    return account ? { username: account.username, profileId: account.profileId } : null;
  } catch { return null; }
}

export async function registerProfile(username, pin) {
  const cleanName = validateCredentials(username, pin);
  const key = accountKey(cleanName);
  const accounts = readAccounts();
  if (accounts[key]) throw new Error("That username already exists on this browser. Sign in instead.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const verifier = await derivePinVerifier(String(pin), salt);
  const profile = {
    username: cleanName,
    profileId: crypto.randomUUID ? crypto.randomUUID() : bytesToBase64(crypto.getRandomValues(new Uint8Array(18))),
    salt: bytesToBase64(salt),
    pinVerifier: bytesToBase64(verifier),
    verifierAlgorithm: "PBKDF2-SHA-256",
    iterations: PBKDF2_ITERATIONS,
    createdAt: new Date().toISOString(),
  };
  accounts[key] = profile;
  writeAccounts(accounts);
  try { sessionStorage.setItem(SESSION_KEY, cleanName); }
  catch { throw new Error("Account was created, but session storage is unavailable. Sign in after enabling it."); }
  emitGameEvent("identity-registered", { username: cleanName, profileId: profile.profileId });
  emitGameEvent("identity-authenticated", { username: cleanName, method: "local-demo-pin" });
  return { username: cleanName, profileId: profile.profileId };
}

export async function loginProfile(username, pin) {
  const cleanName = normaliseUsername(username);
  if (!cleanName || !/^\d{6,12}$/.test(String(pin || ""))) throw new Error("Enter your username and 6–12 digit PIN.");
  const profile = readAccounts()[accountKey(cleanName)];
  if (!profile) throw new Error("Username or PIN is incorrect.");
  const verifier = await derivePinVerifier(String(pin), base64ToBytes(profile.salt));
  if (!sameBytes(verifier, base64ToBytes(profile.pinVerifier))) {
    emitGameEvent("identity-authentication-failed", { username: cleanName });
    throw new Error("Username or PIN is incorrect.");
  }
  try { sessionStorage.setItem(SESSION_KEY, profile.username); }
  catch { throw new Error("Session storage is unavailable. Enable browser storage and try again."); }
  emitGameEvent("identity-authenticated", { username: profile.username, method: "local-demo-pin" });
  return { username: profile.username, profileId: profile.profileId };
}

export function logoutProfile() {
  const current = getCurrentProfile();
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* session already unavailable */ }
  if (current) emitGameEvent("identity-logged-out", { username: current.username });
}
