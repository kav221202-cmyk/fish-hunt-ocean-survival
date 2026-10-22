/**
 * Fish Game API adapter.
 * Keeps network/protocol details out of the game UI (low coupling).
 * Endpoint contract based on the assignment API documentation and the
 * observed JSON shape: { question: URL, fish: number, chest: number }.
 * The UI does not display solution values until the player submits.
 */
export const FISH_API_ENDPOINT = "https://marcconrad.com/uob/fish/api.php?out=json";

export class FishApiError extends Error {
  constructor(message, code = "FISH_API_ERROR") {
    super(message);
    this.name = "FishApiError";
    this.code = code;
  }
}

export async function fetchFishPuzzle({ signal, endpoint = FISH_API_ENDPOINT } = {}) {
  let response;
  try {
    response = await fetch(endpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new FishApiError("The puzzle service could not be reached. Check your connection or whether the service allows browser requests (CORS).", "NETWORK_ERROR");
  }

  if (!response.ok) {
    throw new FishApiError(`Puzzle service returned HTTP ${response.status}. Please try again later.`, "HTTP_ERROR");
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new FishApiError("The puzzle service did not return valid JSON.", "INVALID_JSON");
  }

  // Validate the documented fields instead of letting malformed responses break the UI.
  const question = typeof payload?.question === "string" ? payload.question : "";
  const fish = Number(payload?.fish);
  const chest = Number(payload?.chest);
  if (!question || !Number.isFinite(fish) || !Number.isFinite(chest)) {
    throw new FishApiError("The API response did not contain the expected question, fish and chest fields.", "INVALID_SHAPE");
  }
  let parsedUrl;
  try { parsedUrl = new URL(question); } catch {
    throw new FishApiError("The API returned an invalid puzzle image URL.", "INVALID_IMAGE_URL");
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new FishApiError("The API returned an unsupported image URL.", "INVALID_IMAGE_URL");
  }

  return { question: parsedUrl.href, fish, chest };
}
