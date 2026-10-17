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
};

const keys = new Set();
const heldDirections = new Set();
const state = {
  mode: "ready", // ready | playing | gameover
  score: 0,
  timeLeft: CONFIG.roundSeconds,
  lives: CONFIG.startingLives,
  elapsed: 0,
  lastFrame: 0,
  foodSpawnTimer: 0,
  sharkSpawnTimer: 0,
  player: { x: 180, y: 270, radius: 21, invulnerable: 0, facing: 1 },
  food: [],
  sharks: [],
  bubbles: [],
};

const BEST_KEY = "fishHuntBestScore";
let bestScore = readBestScore();

function readBestScore() {
  try {
    const value = Number(localStorage.getItem(BEST_KEY) || 0);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function saveBestScore(value) {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // The game remains playable when browser storage is unavailable.
  }
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function setMode(mode) {
  state.mode = mode;
  document.body.dataset.gameMode = mode;
  ui.status.textContent = mode === "playing" ? "IN THE CURRENT" :
    mode === "gameover" ? "DIVE COMPLETE" : "READY TO DIVE";
}

function createBubble() {
  return {
    x: randomBetween(10, CONFIG.width - 10),
    y: randomBetween(10, CONFIG.height - 10),
    radius: randomBetween(1.5, 4.5),
    speed: randomBetween(8, 24),
    phase: randomBetween(0, Math.PI * 2),
  };
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
  return {
    x: fromLeft ? -45 : CONFIG.width + 45,
    y: randomBetween(55, CONFIG.height - 55),
    radius: 24,
    speed: randomBetween(72, 104) + Math.min(75, state.elapsed * 1.15),
    direction: fromLeft ? 1 : -1,
    wobble: randomBetween(0, Math.PI * 2),
    hitFlash: 0,
  };
}

function resetRound() {
  state.score = 0;
  state.timeLeft = CONFIG.roundSeconds;
  state.lives = CONFIG.startingLives;
  state.elapsed = 0;
  state.foodSpawnTimer = 0;
  state.sharkSpawnTimer = 0;
  state.player = { x: 180, y: CONFIG.height / 2, radius: 21, invulnerable: 0, facing: 1 };
  state.food = Array.from({ length: 5 }, createFood);
  state.sharks = Array.from({ length: CONFIG.startingSharks }, (_, index) => ({
    ...createShark(),
    x: 390 + index * 210,
    y: randomBetween(75, CONFIG.height - 75),
  }));
  state.bubbles = Array.from({ length: 48 }, createBubble);
  updateHud();
  drawScene(0);
}

function updateHud() {
  ui.score.textContent = String(state.score).padStart(4, "0");
  ui.time.innerHTML = `${Math.ceil(state.timeLeft)}<span class="hud-unit">s</span>`;
  ui.health.textContent = `${"♥ ".repeat(state.lives).trim()}${state.lives < 1 ? "—" : ""}`;
  ui.health.setAttribute("aria-label", `${state.lives} ${state.lives === 1 ? "life" : "lives"} remaining`);
  ui.best.textContent = String(bestScore).padStart(4, "0");
}

function showOverlay({ icon, kicker, title, text, button }) {
  ui.overlayIcon.textContent = icon;
  ui.overlayKicker.textContent = kicker;
  ui.overlayTitle.textContent = title;
  ui.overlayText.textContent = text;
  ui.startButton.textContent = button;
  ui.overlay.classList.remove("hidden");
  ui.startButton.focus({ preventScroll: true });
}

function hideOverlay() {
  ui.overlay.classList.add("hidden");
}

function startGame() {
  resetRound();
  keys.clear();
  heldDirections.clear();
  setMode("playing");
  hideOverlay();
  state.lastFrame = performance.now();
  requestAnimationFrame(gameLoop);
}

function endGame(reason) {
  if (state.mode !== "playing") return;
  setMode("gameover");
  if (state.score > bestScore) {
    bestScore = state.score;
    saveBestScore(bestScore);
  }
  updateHud();
  const survived = CONFIG.roundSeconds - Math.ceil(state.timeLeft);
  showOverlay({
    icon: reason === "time" ? "🏆" : "🐚",
    kicker: reason === "time" ? "TIME SURVIVED" : "THE OCEAN WINS THIS ROUND",
    title: reason === "time" ? "You made it!" : "Dive complete",
    text: `Final score: ${state.score}. You survived ${survived} seconds. ${state.score >= bestScore ? "Your best score is saved on this device." : "Take a breath and try again."}`,
    button: "Dive again →",
  });
  drawScene(0);
}

function handleKeyDown(event) {
  const key = event.key.toLowerCase();
  const supported = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " "];
  if (supported.includes(key)) event.preventDefault();
  if (key === " " && state.mode !== "playing") {
    startGame();
    return;
  }
  keys.add(key);
}

function handleKeyUp(event) {
  keys.delete(event.key.toLowerCase());
}

function directionIsDown(direction) {
  const mapping = {
    up: ["arrowup", "w"],
    down: ["arrowdown", "s"],
    left: ["arrowleft", "a"],
    right: ["arrowright", "d"],
  };
  return mapping[direction].some(key => keys.has(key)) || heldDirections.has(direction);
}

function movePlayer(dt) {
  const player = state.player;
  let dx = Number(directionIsDown("right")) - Number(directionIsDown("left"));
  let dy = Number(directionIsDown("down")) - Number(directionIsDown("up"));
  if (dx !== 0 && dy !== 0) {
    const normalizer = Math.SQRT1_2;
    dx *= normalizer;
    dy *= normalizer;
  }
  player.x = clamp(player.x + dx * CONFIG.playerSpeed * dt, player.radius, CONFIG.width - player.radius);
  player.y = clamp(player.y + dy * CONFIG.playerSpeed * dt, player.radius, CONFIG.height - player.radius);
  if (dx !== 0) player.facing = dx > 0 ? 1 : -1;
  player.invulnerable = Math.max(0, player.invulnerable - dt);
}

function updateFood(dt) {
  state.foodSpawnTimer += dt;
  if (state.food.length < CONFIG.maxFood && state.foodSpawnTimer >= 0.8) {
    state.food.push(createFood());
    state.foodSpawnTimer = 0;
  }
  state.food.forEach(food => food.phase += dt * 2.2);

  for (let index = state.food.length - 1; index >= 0; index--) {
    if (distanceBetween(state.player, state.food[index]) < state.player.radius + state.food[index].radius) {
      state.food.splice(index, 1);
      state.score += CONFIG.foodPoints;
      updateHud();
      window.dispatchEvent(new CustomEvent("fishhunt:food-collected", { detail: { score: state.score } }));
    }
  }
}

function updateSharks(dt) {
  const difficulty = 1 + Math.floor(state.elapsed / 15) * 0.12;
  for (const shark of state.sharks) {
    shark.x += shark.speed * shark.direction * difficulty * dt;
    shark.y += Math.sin(state.elapsed * 2.1 + shark.wobble) * 16 * dt;
    shark.y = clamp(shark.y, 35, CONFIG.height - 35);
    shark.hitFlash = Math.max(0, shark.hitFlash - dt);
  }
  state.sharks = state.sharks.filter(shark => shark.x > -100 && shark.x < CONFIG.width + 100);

  state.sharkSpawnTimer += dt;
  const spawnEvery = Math.max(2.8, 5.5 - state.elapsed * 0.025);
  if (state.sharkSpawnTimer >= spawnEvery) {
    state.sharks.push(createShark());
    state.sharkSpawnTimer = 0;
  }

  if (state.player.invulnerable <= 0) {
    for (const shark of state.sharks) {
      if (distanceBetween(state.player, shark) < state.player.radius + shark.radius - 8) {
        state.lives -= 1;
        state.player.invulnerable = CONFIG.hitCooldown;
        shark.hitFlash = 0.25;
        updateHud();
        window.dispatchEvent(new CustomEvent("fishhunt:player-hit", { detail: { lives: state.lives } }));
        if (state.lives <= 0) endGame("health");
        break;
      }
    }
  }
}

function updateBubbles(dt) {
  for (const bubble of state.bubbles) {
    bubble.y -= bubble.speed * dt;
    bubble.phase += dt;
    if (bubble.y < -8) {
      bubble.y = CONFIG.height + 8;
      bubble.x = randomBetween(0, CONFIG.width);
    }
  }
}

function updateGame(dt) {
  state.elapsed += dt;
  state.timeLeft = Math.max(0, CONFIG.roundSeconds - state.elapsed);
  movePlayer(dt);
  updateFood(dt);
  updateSharks(dt);
  updateBubbles(dt);
  updateHud();

  if (state.mode === "playing" && state.timeLeft <= 0) endGame("time");
}

function drawBackground(dt) {
  const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.height);
  gradient.addColorStop(0, "#0b3b63");
  gradient.addColorStop(0.55, "#075079");
  gradient.addColorStop(1, "#052b51");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  // Soft light rays create depth without external image assets.
  ctx.save();
  ctx.globalAlpha = 0.07;
  for (let i = 0; i < 7; i++) {
    const x = (i * 170 + state.elapsed * 7) % (CONFIG.width + 220) - 110;
    ctx.fillStyle = "#9deeff";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 85, 0);
    ctx.lineTo(x - 65, CONFIG.height);
    ctx.lineTo(x - 125, CONFIG.height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  for (const bubble of state.bubbles) {
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.radius + Math.sin(bubble.phase) * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(183, 238, 255, .42)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(3, 20, 44, .32)";
  ctx.fillRect(0, CONFIG.height - 20, CONFIG.width, 20);
  for (let i = 0; i < 36; i++) {
    const x = i * 29 + Math.sin(i * 1.7) * 7;
    const height = 5 + (i % 4) * 4;
    ctx.fillStyle = i % 2 ? "rgba(63, 190, 162, .42)" : "rgba(93, 211, 190, .3)";
    ctx.fillRect(x, CONFIG.height - height, 3, height);
  }
}

function drawFood(food) {
  const pulse = Math.sin(food.phase) * 2;
  ctx.save();
  ctx.shadowColor = "#ffd27a";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#ffd27a";
  ctx.beginPath();
  ctx.arc(food.x, food.y, food.radius + pulse * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#fff2c8";
  ctx.beginPath();
  ctx.arc(food.x - 3, food.y - 4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 236, 179, .6)";
  ctx.beginPath();
  ctx.arc(food.x, food.y, food.radius + 6 + pulse, 0, Math.PI * 2);
  ctx.stroke();
}

function drawShark(shark) {
  ctx.save();
  ctx.translate(shark.x, shark.y);
  ctx.scale(shark.direction, 1);
  ctx.globalAlpha = shark.hitFlash > 0 ? 0.58 : 1;
  ctx.fillStyle = "#8ba8bf";
  ctx.beginPath();
  ctx.ellipse(0, 0, 29, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-2, -10);
  ctx.lineTo(10, -27);
  ctx.lineTo(17, -8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-17, 9);
  ctx.lineTo(-8, 23);
  ctx.lineTo(1, 8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-27, 0);
  ctx.lineTo(-43, -11);
  ctx.lineTo(-39, 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#d9e7f1";
  ctx.beginPath();
  ctx.ellipse(9, 7, 12, 5, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = "#10263d";
  ctx.beginPath();
  ctx.arc(16, -4, 2.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlayer() {
  const player = state.player;
  if (player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0) return;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.scale(player.facing, 1);
  ctx.shadowColor = "#68e0e7";
  ctx.shadowBlur = 15;
  ctx.fillStyle = "#68e0e7";
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-17, 0);
  ctx.lineTo(-33, -12);
  ctx.lineTo(-32, 12);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#b6faff";
  ctx.beginPath();
  ctx.ellipse(4, 5, 10, 5, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = "#06233c";
  ctx.beginPath();
  ctx.arc(11, -4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(12, -5, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawScene(dt) {
  drawBackground(dt);
  for (const food of state.food) drawFood(food);
  for (const shark of state.sharks) drawShark(shark);
  drawPlayer();

  // A subtle border makes the playable area easy to read.
  ctx.strokeStyle = "rgba(173, 232, 255, .16)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, CONFIG.width - 2, CONFIG.height - 2);
}

function gameLoop(timestamp) {
  if (state.mode !== "playing") return;
  const dt = Math.min((timestamp - state.lastFrame) / 1000, 0.04);
  state.lastFrame = timestamp;
  updateGame(dt);
  drawScene(dt);
  if (state.mode === "playing") requestAnimationFrame(gameLoop);
}

function bindEvents() {
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("blur", () => keys.clear());
  ui.startButton.addEventListener("click", startGame);

  document.querySelectorAll("[data-direction]").forEach(button => {
    const direction = button.dataset.direction;
    const release = () => heldDirections.delete(direction);
    button.addEventListener("pointerdown", event => {
      event.preventDefault();
      heldDirections.add(direction);
      button.setPointerCapture?.(event.pointerId);
    });
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
    button.addEventListener("contextmenu", event => event.preventDefault());
  });

  // Custom events make game outcomes observable and support later feature additions.
  window.addEventListener("fishhunt:food-collected", event => {
    console.info(`Food collected. Current score: ${event.detail.score}`);
  });
  window.addEventListener("fishhunt:player-hit", event => {
    console.info(`Player hit. Lives remaining: ${event.detail.lives}`);
  });
}

function initialise() {
  canvas.width = CONFIG.width;
  canvas.height = CONFIG.height;
  resetRound();
  bindEvents();
  updateHud();
  showOverlay({
    icon: "🌊",
    kicker: "YOUR ADVENTURE STARTS HERE",
    title: "Ready to dive?",
    text: "Collect the glowing food and dodge the hungry sharks. You have 60 seconds and 3 hearts.",
    button: "Start swimming →",
  });
}

initialise();
