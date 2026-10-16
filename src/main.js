
import { getApiInvestigationStatus } from "./api/fishApi.js";

const startButton = document.querySelector("#start-button");
const gameMessage = document.querySelector("#game-message");
const sceneOverlay = document.querySelector("#scene-overlay");

const apiStatus = getApiInvestigationStatus();

console.info("Fish Hunt initialisation complete.");
console.info("Fish Game API integration status:", apiStatus);

startButton.addEventListener("click", () => {
  gameMessage.textContent =
    "The interface is working. Gameplay will be implemented in Phase 2.";

  sceneOverlay.querySelector("p").textContent = "FOUNDATION READY";
  sceneOverlay.querySelector("span").textContent =
    "Core gameplay is coming in Phase 2.";

  startButton.textContent = "Foundation ready";
  startButton.disabled = true;
});
