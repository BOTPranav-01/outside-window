import { parseMicroQuest, type MicroQuest } from "./contracts.js";

const fallback: MicroQuest = {
  title: "Ten-minute reset",
  steps: ["Put on shoes", "Walk to the nearest safe, green spot", "Return before ten minutes"],
  minutes: 10,
  safetyNote: "Skip the quest if weather, air quality, or your body says it is unsafe."
};

export async function generateQuest(context: string): Promise<MicroQuest> {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL ?? "gemma3:4b";
  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        format: "json",
        prompt: `Return only JSON matching this schema: {"title":string,"steps":string[],"minutes":10,"safetyNote":string}. Create a safe outdoor micro-quest. Context: ${context}`
      }),
      signal: AbortSignal.timeout(3500)
    });
    if (!response.ok) throw new Error(`Gemma returned ${response.status}`);
    const body = await response.json() as { response?: string };
    return parseMicroQuest(JSON.parse(body.response ?? ""));
  } catch {
    return fallback;
  }
}
