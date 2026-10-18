const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  score: document.querySelector("#scoreValue"),
  time: document.querySelector("#timeValue"),
  health: document.querySelector("#healthValue"),
  best: document.querySelector("#bestValue"),
  status: document.querySelector("#statusText"),
  overlay: document.querySelector("#gameOverlay"),
  overlayIcon: document.querySelector("#overlayIcon"),
  overlayKicker: document.querySelector("#overlayKicker"),
  overlayTitle: document.querySelector("#overlayTitle"),
  overlayText: document.querySelector("#overlayText"),
  startButton: document.querySelector("#startButton"),
  pauseButton: document.querySelector("#pauseButton"),
  soundButton: document.querySelector("#soundButton"),
  activeEffects: document.querySelector("#activeEffects"),
  rounds: document.querySelector("#roundsValue"),
  food: document.querySelector("#foodValue"),
  totalScore: document.querySelector("#totalScoreValue"),
};

const CONFIG = {
  width: 960,
  height: 540,
  roundSeconds: 60,
  startingLives: 3,
  playerSpeed: 265,
  foodPoints: 10,
  hitCooldown: 1.1,
  maxFood: 7,
  startingSharks: 3,
  powerupSpawnSeconds: 8,
  maxPowerups: 2,
};

const STORAGE_KEYS = {
  best: "fishHuntBestScore",
  stats: "fishHuntStatsV1",
  sound: "fishHuntSoundEnabled",
};
const keys = new Set();
const heldDirections = new Set();
let soundEnabled = readSoundPreference();
let audioContext = null;
let toastMessage = "";
let toastTimer = 0;

const state = {
  mode: "ready", // ready | playing | paused | gameover
  score: 0,
  timeLeft: CONFIG.roundSeconds,
  lives: CONFIG.startingLives,
  elapsed: 0,
  lastFrame: 0,
  foodSpawnTimer: 0,
  sharkSpawnTimer: 0,
  powerupSpawnTimer: 0,
  foodCollectedThisRound: 0,
  roundSaved: false,
  effects: { shield: 0, slow: 0 },
  player: { x: 180, y: 270, radius: 21, invulnerable: 0, facing: 1 },
  food: [],
  sharks: [],
  powerups: [],
  bubbles: [],
};

let bestScore = readBestScore();
let stats = readStats();

function safeRead(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}
function safeWrite(key, value) {
  try { localStorage.setItem(key, value); return true; }
  catch { return false; }
}
function readBestScore() {
  const value = Number(safeRead(STORAGE_KEYS.best, "0"));
  return Number.isFinite(value) && value > 0 ? value : 0;
}
function readStats() {
  try {
    const parsed = JSON.parse(safeRead(STORAGE_KEYS.stats, "{}"));
    return {
      roundsCompleted: Math.max(0, Number(parsed.roundsCompleted) || 0),
      totalFood: Math.max(0, Number(parsed.totalFood) || 0),
      totalScore: Math.max(0, Number(parsed.totalScore) || 0),
    };
  } catch {
    return { roundsCompleted: 0, totalFood: 0, totalScore: 0 };
  }
}
function saveStats() { safeWrite(STORAGE_KEYS.stats, JSON.stringify(stats)); }
function readSoundPreference() { return safeRead(STORAGE_KEYS.sound, "false") === "true"; }
function setSoundPreference(value) {
  soundEnabled = value;
  safeWrite(STORAGE_KEYS.sound, String(value));
  ui.soundButton.textContent = value ? "♫ Sound on" : "♫ Sound off";
  ui.soundButton.setAttribute("aria-pressed", String(value));
}
function randomBetween(min, max) { return Math.random() * (max - min) + min; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function distanceBetween(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function emitGameEvent(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(`fishhunt:${name}`, { detail }));
}
function announce(message) {
  toastMessage = message;
  toastTimer = 2.1;
  ui.activeEffects.textContent = message;
}
function playTone(frequency = 520, duration = 0.08, type = "sine") {
  if (!soundEnabled) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioContext ||= new AudioContextClass();
    if (audioContext.state === "suspended") audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.045, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch {
    // Audio is optional; a browser audio restriction must not interrupt gameplay.
  }
}

function setMode(mode) {
  state.mode = mode;
  document.body.dataset.gameMode = mode;
  ui.status.textContent = mode === "playing" ? "IN THE CURRENT" :
    mode === "paused" ? "DIVE PAUSED" :
    mode === "gameover" ? "DIVE COMPLETE" : "READY TO DIVE";
  ui.pauseButton.disabled = !["playing", "paused"].includes(mode);
  ui.pauseButton.textContent = mode === "paused" ? "▶ Resume" : "Ⅱ Pause";
  ui.pauseButton.setAttribute("aria-label", mode === "paused" ? "Resume game" : "Pause game");
}

function createBubble() {
  return { x: randomBetween(10, CONFIG.width - 10), y: randomBetween(10, CONFIG.height - 10), radius: randomBetween(1.5, 4.5), speed: randomBetween(8, 24), phase: randomBetween(0, Math.PI * 2) };
}
function createFood() {
  const side = Math.floor(Math.random() * 4);
  const point = side === 0 ? { x: randomBetween(0, CONFIG.width), y: 0 } :
    side === 1 ? { x: CONFIG.width, y: randomBetween(0, CONFIG.height) } :
    side === 2 ? { x: randomBetween(0, CONFIG.width), y: CONFIG.height } :
    { x: 0, y: randomBetween(0, CONFIG.height) };
  return { ...point, radius: 12, phase: randomBetween(0, Math.PI * 2) };
}
function createShark() {
  const fromLeft = Math.random() > 0.5;
  return { x: fromLeft ? -45 : CONFIG.width + 45, y: randomBetween(55, CONFIG.height - 55), radius: 24,
    speed: randomBetween(72, 104) + Math.min(75, state.elapsed * 1.15), direction: fromLeft ? 1 : -1,
    wobble: randomBetween(0, Math.PI * 2), hitFlash: 0 };
}
function createPowerup() {
  const kinds = ["shield", "bonus", "slow"];
  return { x: randomBetween(70, CONFIG.width - 70), y: randomBetween(65, CONFIG.height - 65), radius: 15,
    kind: kinds[Math.floor(Math.random() * kinds.length)], phase: randomBetween(0, Math.PI * 2), life: 12 };
}

function resetRound() {
  state.score = 0;
  state.timeLeft = CONFIG.roundSeconds;
  state.lives = CONFIG.startingLives;
  state.elapsed = 0;
  state.foodSpawnTimer = 0;
  state.sharkSpawnTimer = 0;
  state.powerupSpawnTimer = 0;
  state.foodCollectedThisRound = 0;
  state.roundSaved = false;
  state.effects = { shield: 0, slow: 0 };
  state.player = { x: 180, y: CONFIG.height / 2, radius: 21, invulnerable: 0, facing: 1 };
  state.food = Array.from({ length: 5 }, createFood);
  state.sharks = Array.from({ length: CONFIG.startingSharks }, (_, index) => ({ ...createShark(), x: 390 + index * 210, y: randomBetween(75, CONFIG.height - 75) }));
  state.powerups = [];
  state.bubbles = Array.from({ length: 48 }, createBubble);
  updateHud();
  drawScene(0);
}

function updateHud() {
  ui.score.textContent = String(state.score).padStart(4, "0");
  ui.time.textContent = `${Math.ceil(state.timeLeft)}s`;
  ui.health.textContent = state.lives > 0 ? Array(state.lives).fill("♥").join(" ") : "—";
  ui.health.setAttribute("aria-label", `${state.lives} ${state.lives === 1 ? "life" : "lives"} remaining`);
  ui.best.textContent = String(bestScore).padStart(4, "0");
  ui.rounds.textContent = String(stats.roundsCompleted);
  ui.food.textContent = String(stats.totalFood);
  ui.totalScore.textContent = String(stats.totalScore);
  const active = [];
  if (state.effects.shield > 0) active.push(`Shield ${Math.ceil(state.effects.shield)}s`);
  if (state.effects.slow > 0) active.push(`Slow current ${Math.ceil(state.effects.slow)}s`);
  ui.activeEffects.textContent = active.length ? active.join(" · ") : (toastTimer > 0 ? toastMessage : "No active power-ups");
}
function showOverlay({ icon, kicker, title, text, button }) {
  ui.overlayIcon.textContent = icon;
  ui.overlayKicker.textContent = kicker;
  ui.overlayTitle.textContent = title;
  ui.overlayText.textContent = text;
  ui.startButton.textContent = button;
  ui.overlay.classList.remove("hidden");
}
function hideOverlay() { ui.overlay.classList.add("hidden"); }

function startGame() {
  resetRound();
  keys.clear();
  heldDirections.clear();
  setMode("playing");
  hideOverlay();
  state.lastFrame = performance.now();
  requestAnimationFrame(gameLoop);
  emitGameEvent("round-started", { roundSeconds: CONFIG.roundSeconds });
  playTone(600, 0.11);
}
function pauseGame() {
  if (state.mode === "playing") {
    setMode("paused");
    keys.clear();
    heldDirections.clear();
    showOverlay({ icon: "Ⅱ", kicker: "TAKE A BREATHER", title: "Dive paused", text: "Your timer and ocean hazards are frozen. Resume when you're ready.", button: "Resume dive →" });
    emitGameEvent("round-paused", { score: state.score, timeLeft: state.timeLeft });
  } else if (state.mode === "paused") {
    setMode("playing");
    hideOverlay();
    state.lastFrame = performance.now();
    requestAnimationFrame(gameLoop);
    emitGameEvent("round-resumed", { score: state.score, timeLeft: state.timeLeft });
  }
}
function finishRound(reason) {
  if (state.mode !== "playing") return;
  setMode("gameover");
  if (state.score > bestScore) {
    bestScore = state.score;
    safeWrite(STORAGE_KEYS.best, String(bestScore));
  }
  if (!state.roundSaved) {
    stats.roundsCompleted += 1;
    stats.totalFood += state.foodCollectedThisRound;
    stats.totalScore += state.score;
    saveStats();
    state.roundSaved = true;
  }
  updateHud();
  const survived = Math.max(0, CONFIG.roundSeconds - Math.ceil(state.timeLeft));
  const completed = reason === "time";
  showOverlay({
    icon: completed ? "🏆" : "🐚",
    kicker: completed ? "TIME SURVIVED" : "THE OCEAN WINS THIS ROUND",
    title: completed ? "You made it!" : "Dive complete",
    text: `Final score: ${state.score}. You survived ${survived} seconds and collected ${state.foodCollectedThisRound} food items. Your records are updated on this browser when storage is available.`,
    button: "Dive again →",
  });
  playTone(completed ? 760 : 220, 0.22, completed ? "sine" : "triangle");
  emitGameEvent("round-finished", { reason, score: state.score, survived, foodCollected: state.foodCollectedThisRound });
  drawScene(0);
}

function handleKeyDown(event) {
  const key = event.key.toLowerCase();
  const supported = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " ", "p", "escape"];
  if (supported.includes(key)) event.preventDefault();
  if ((key === "p" || key === "escape") && ["playing", "paused"].includes(state.mode)) {
    pauseGame();
    return;
  }
  if (key === " " && state.mode !== "playing" && state.mode !== "paused") {
    startGame();
    return;
  }
  if (state.mode === "playing") keys.add(key);
}
function handleKeyUp(event) { keys.delete(event.key.toLowerCase()); }
function directionIsDown(direction) {
  const mapping = { up: ["arrowup", "w"], down: ["arrowdown", "s"], left: ["arrowleft", "a"], right: ["arrowright", "d"] };
  return mapping[direction].some(key => keys.has(key)) || heldDirections.has(direction);
}
function movePlayer(dt) {
  const player = state.player;
  let dx = Number(directionIsDown("right")) - Number(directionIsDown("left"));
  let dy = Number(directionIsDown("down")) - Number(directionIsDown("up"));
  if (dx !== 0 && dy !== 0) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
  player.x = clamp(player.x + dx * CONFIG.playerSpeed * dt, player.radius, CONFIG.width - player.radius);
  player.y = clamp(player.y + dy * CONFIG.playerSpeed * dt, player.radius, CONFIG.height - player.radius);
  if (dx !== 0) player.facing = dx > 0 ? 1 : -1;
  player.invulnerable = Math.max(0, player.invulnerable - dt);
}
function updateFood(dt) {
  state.foodSpawnTimer += dt;
  if (state.food.length < CONFIG.maxFood && state.foodSpawnTimer >= 0.8) {
    state.food.push(createFood()); state.foodSpawnTimer = 0;
  }
  state.food.forEach(food => food.phase += dt * 2.2);
  for (let index = state.food.length - 1; index >= 0; index--) {
    if (distanceBetween(state.player, state.food[index]) < state.player.radius + state.food[index].radius) {
      state.food.splice(index, 1);
      state.score += CONFIG.foodPoints;
      state.foodCollectedThisRound += 1;
      updateHud();
      playTone(680, 0.055);
      emitGameEvent("food-collected", { score: state.score, roundFood: state.foodCollectedThisRound });
    }
  }
}
function applyPowerup(powerup) {
  if (powerup.kind === "shield") {
    state.effects.shield = 6;
    announce("Shield active · 6 seconds");
    playTone(820, 0.16);
  } else if (powerup.kind === "bonus") {
    state.score += 50;
    announce("Bonus collected · +50 points");
    playTone(980, 0.13);
  } else if (powerup.kind === "slow") {
    state.effects.slow = 6;
    announce("Slow current active · 6 seconds");
    playTone(430, 0.18, "triangle");
  }
  emitGameEvent("powerup-collected", { kind: powerup.kind, score: state.score });
  updateHud();
}
function updatePowerups(dt) {
  state.powerupSpawnTimer += dt;
  if (state.powerups.length < CONFIG.maxPowerups && state.powerupSpawnTimer >= CONFIG.powerupSpawnSeconds) {
    state.powerups.push(createPowerup());
    state.powerupSpawnTimer = 0;
  }
  for (const powerup of state.powerups) { powerup.phase += dt * 2; powerup.life -= dt; }
  state.powerups = state.powerups.filter(powerup => powerup.life > 0);
  for (let index = state.powerups.length - 1; index >= 0; index--) {
    if (distanceBetween(state.player, state.powerups[index]) < state.player.radius + state.powerups[index].radius) {
      const [powerup] = state.powerups.splice(index, 1);
      applyPowerup(powerup);
    }
  }
  state.effects.shield = Math.max(0, state.effects.shield - dt);
  state.effects.slow = Math.max(0, state.effects.slow - dt);
  toastTimer = Math.max(0, toastTimer - dt);
}
function updateSharks(dt) {
  const difficulty = 1 + Math.floor(state.elapsed / 15) * 0.12;
  const slowMultiplier = state.effects.slow > 0 ? 0.48 : 1;
  for (const shark of state.sharks) {
    shark.x += shark.speed * shark.direction * difficulty * slowMultiplier * dt;
    shark.y += Math.sin(state.elapsed * 2.1 + shark.wobble) * 16 * dt;
    shark.y = clamp(shark.y, 35, CONFIG.height - 35);
    shark.hitFlash = Math.max(0, shark.hitFlash - dt);
  }
  state.sharks = state.sharks.filter(shark => shark.x > -100 && shark.x < CONFIG.width + 100);
  state.sharkSpawnTimer += dt;
  const spawnEvery = Math.max(2.8, 5.5 - state.elapsed * 0.025);
  if (state.sharkSpawnTimer >= spawnEvery) { state.sharks.push(createShark()); state.sharkSpawnTimer = 0; }

  if (state.player.invulnerable <= 0 && state.effects.shield <= 0) {
    for (const shark of state.sharks) {
      if (distanceBetween(state.player, shark) < state.player.radius + shark.radius - 8) {
        state.lives -= 1;
        state.player.invulnerable = CONFIG.hitCooldown;
        shark.hitFlash = 0.25;
        updateHud();
        playTone(160, 0.16, "triangle");
        emitGameEvent("player-hit", { lives: state.lives });
        if (state.lives <= 0) finishRound("health");
        break;
      }
    }
  }
}
function updateBubbles(dt) {
  for (const bubble of state.bubbles) {
    bubble.y -= bubble.speed * dt; bubble.phase += dt;
    if (bubble.y < -8) { bubble.y = CONFIG.height + 8; bubble.x = randomBetween(0, CONFIG.width); }
  }
}
function updateGame(dt) {
  state.elapsed += dt;
  state.timeLeft = Math.max(0, CONFIG.roundSeconds - state.elapsed);
  movePlayer(dt);
  updateFood(dt);
  updatePowerups(dt);
  updateSharks(dt);
  updateBubbles(dt);
  updateHud();
  if (state.mode === "playing" && state.timeLeft <= 0) finishRound("time");
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.height);
  gradient.addColorStop(0, "#0b3b63"); gradient.addColorStop(0.55, "#075079"); gradient.addColorStop(1, "#052b51");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
  ctx.save(); ctx.globalAlpha = 0.07;
  for (let i = 0; i < 7; i++) {
    const x = (i * 170 + state.elapsed * 7) % (CONFIG.width + 220) - 110;
    ctx.fillStyle = "#9deeff"; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 85, 0); ctx.lineTo(x - 65, CONFIG.height); ctx.lineTo(x - 125, CONFIG.height); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  for (const bubble of state.bubbles) {
    ctx.beginPath(); ctx.arc(bubble.x, bubble.y, bubble.radius + Math.sin(bubble.phase) * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(183, 238, 255, .42)"; ctx.lineWidth = 1.2; ctx.stroke();
  }
  ctx.fillStyle = "rgba(3, 20, 44, .32)"; ctx.fillRect(0, CONFIG.height - 20, CONFIG.width, 20);
  for (let i = 0; i < 36; i++) {
    const x = i * 29 + Math.sin(i * 1.7) * 7; const height = 5 + (i % 4) * 4;
    ctx.fillStyle = i % 2 ? "rgba(63, 190, 162, .42)" : "rgba(93, 211, 190, .3)"; ctx.fillRect(x, CONFIG.height - height, 3, height);
  }
}
function drawFood(food) {
  const pulse = Math.sin(food.phase) * 2;
  ctx.save(); ctx.shadowColor = "#ffd27a"; ctx.shadowBlur = 18; ctx.fillStyle = "#ffd27a";
  ctx.beginPath(); ctx.arc(food.x, food.y, food.radius + pulse * 0.25, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.fillStyle = "#fff2c8"; ctx.beginPath(); ctx.arc(food.x - 3, food.y - 4, 3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(255, 236, 179, .6)"; ctx.beginPath(); ctx.arc(food.x, food.y, food.radius + 6 + pulse, 0, Math.PI * 2); ctx.stroke();
}
function drawPowerup(powerup) {
  const colors = { shield: "#8ce8ff", bonus: "#ffd27a", slow: "#c7a6ff" };
  const symbols = { shield: "S", bonus: "+", slow: "⌁" };
  const pulse = Math.sin(powerup.phase) * 2;
  ctx.save(); ctx.translate(powerup.x, powerup.y); ctx.rotate(Math.sin(powerup.phase * 0.4) * 0.12);
  ctx.shadowColor = colors[powerup.kind]; ctx.shadowBlur = 17; ctx.fillStyle = colors[powerup.kind];
  ctx.beginPath(); ctx.arc(0, 0, powerup.radius + pulse, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = "#09213a"; ctx.font = "bold 17px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(symbols[powerup.kind], 0, 1);
  ctx.restore();
}
function drawShark(shark) {
  ctx.save(); ctx.translate(shark.x, shark.y); ctx.scale(shark.direction, 1); ctx.globalAlpha = shark.hitFlash > 0 ? 0.58 : 1; ctx.fillStyle = "#8ba8bf";
  ctx.beginPath(); ctx.ellipse(0, 0, 29, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-2, -10); ctx.lineTo(10, -27); ctx.lineTo(17, -8); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-17, 9); ctx.lineTo(-8, 23); ctx.lineTo(1, 8); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-27, 0); ctx.lineTo(-43, -11); ctx.lineTo(-39, 7); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#d9e7f1"; ctx.beginPath(); ctx.ellipse(9, 7, 12, 5, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = "#10263d"; ctx.beginPath(); ctx.arc(16, -4, 2.7, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function drawPlayer() {
  const player = state.player;
  if (player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0) return;
  ctx.save(); ctx.translate(player.x, player.y); ctx.scale(player.facing, 1);
  if (state.effects.shield > 0) {
    ctx.strokeStyle = "rgba(140,232,255,.9)"; ctx.lineWidth = 3; ctx.shadowColor = "#8ce8ff"; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(0, 0, 33 + Math.sin(state.elapsed * 8) * 2, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
  }
  ctx.shadowColor = "#68e0e7"; ctx.shadowBlur = 15; ctx.fillStyle = "#68e0e7";
  ctx.beginPath(); ctx.ellipse(0, 0, 22, 15, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-17, 0); ctx.lineTo(-33, -12); ctx.lineTo(-32, 12); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = "#b6faff"; ctx.beginPath(); ctx.ellipse(4, 5, 10, 5, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = "#06233c"; ctx.beginPath(); ctx.arc(11, -4, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(12, -5, 1, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function drawScene() {
  drawBackground();
  for (const food of state.food) drawFood(food);
  for (const powerup of state.powerups) drawPowerup(powerup);
  for (const shark of state.sharks) drawShark(shark);
  drawPlayer();
  ctx.strokeStyle = "rgba(173, 232, 255, .16)"; ctx.lineWidth = 2; ctx.strokeRect(1, 1, CONFIG.width - 2, CONFIG.height - 2);
}
function gameLoop(timestamp) {
  if (state.mode !== "playing") return;
  const dt = Math.min((timestamp - state.lastFrame) / 1000, 0.04);
  state.lastFrame = timestamp;
  updateGame(dt);
  drawScene();
  if (state.mode === "playing") requestAnimationFrame(gameLoop);
}
function bindEvents() {
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("blur", () => { keys.clear(); heldDirections.clear(); if (state.mode === "playing") pauseGame(); });
  ui.startButton.addEventListener("click", () => state.mode === "paused" ? pauseGame() : startGame());
  ui.pauseButton.addEventListener("click", pauseGame);
  ui.soundButton.addEventListener("click", () => { setSoundPreference(!soundEnabled); if (soundEnabled) playTone(600, 0.08); });
  document.querySelectorAll("[data-direction]").forEach(button => {
    const direction = button.dataset.direction;
    const release = () => heldDirections.delete(direction);
    button.addEventListener("pointerdown", event => { event.preventDefault(); if (state.mode === "playing") heldDirections.add(direction); button.setPointerCapture?.(event.pointerId); });
    button.addEventListener("pointerup", release); button.addEventListener("pointercancel", release); button.addEventListener("lostpointercapture", release);
    button.addEventListener("contextmenu", event => event.preventDefault());
  });
  window.addEventListener("fishhunt:food-collected", event => console.info(`Food collected; score ${event.detail.score}`));
  window.addEventListener("fishhunt:player-hit", event => console.info(`Player hit; ${event.detail.lives} lives remain`));
  window.addEventListener("fishhunt:powerup-collected", event => console.info(`Power-up collected: ${event.detail.kind}`));
}
function initialise() {
  canvas.width = CONFIG.width; canvas.height = CONFIG.height;
  resetRound(); bindEvents(); setSoundPreference(soundEnabled); updateHud();
  showOverlay({ icon: "🌊", kicker: "YOUR ADVENTURE STARTS HERE", title: "Ready to dive?",
    text: "Collect glowing food, dodge sharks, and grab special power-ups. You have 60 seconds and 3 hearts. Press P to pause during a round.", button: "Start swimming →" });
}
initialise();
