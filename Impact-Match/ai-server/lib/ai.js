// Free AI helper using Google's Gemini API (Google AI Studio free tier, no credit card).
const { MODEL } = require("./config");
const { HttpError } = require("./http");

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Models sometimes wrap JSON in ```json fences even when told not to.
function parseJson(text) {
  const cleaned = String(text || "")
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("The AI did not return valid JSON.");
  }
}

async function callGemini({ apiKey, system, user }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    return await fetch(`${ENDPOINT}/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 4096 },
      }),
    });
  } finally {
    clearTimeout(timer);
  }
}

// Ask the model for a structured answer. We describe the JSON shape in the prompt and
// parse the reply; each endpoint still double-checks every field it uses.
async function askStructured({ system, user, schema, apiKey = process.env.GEMINI_API_KEY }) {
  if (!apiKey) throw new HttpError(500, "The AI server is missing its Gemini key.");

  const fullSystem =
    `${system}\n\nReply with ONLY a JSON object (no markdown, no extra text) that matches this JSON schema:\n` +
    JSON.stringify(schema);

  let res;
  for (let attempt = 0; attempt < 2; attempt++) {
    res = await callGemini({ apiKey, system: fullSystem, user });
    // 429 = free-tier rate limit, 503 = busy: wait briefly and retry once.
    if ((res.status === 429 || res.status === 503) && attempt < 1) {
      await sleep(3000);
      continue;
    }
    break;
  }

  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json())?.error?.message || "";
    } catch {}
    console.error(`Gemini request failed (${res.status}) ${detail}`);
    if (res.status === 429) throw new HttpError(429, "The free AI service is busy right now. Please try again in a minute.");
    throw new HttpError(502, "The AI service had a problem. Please try again.");
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  if (!candidate) throw new Error(`No answer from the AI${data?.promptFeedback?.blockReason ? ` (blocked: ${data.promptFeedback.blockReason})` : ""}.`);
  const text = (candidate.content?.parts || []).map((p) => p.text || "").join("");
  if (!text) throw new Error(`Empty answer from the AI (${candidate.finishReason || "unknown"}).`);

  return parseJson(text);
}

module.exports = { askStructured };