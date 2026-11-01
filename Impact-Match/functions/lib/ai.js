// Free AI helper using Google's Gemini API (Google AI Studio free tier, no credit card).
// It keeps the same askStructured() shape the rest of the backend already uses, so
// functions/index.js does not need to change how it calls the AI.
const { MODEL } = require("../config");

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
    // Last resort: grab the first {...} block.
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("The AI did not return valid JSON.");
  }
}

async function callGemini({ apiKey, system, user }) {
  const res = await fetch(`${ENDPOINT}/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 4096,
      },
    }),
  });
  return res;
}

// Ask the model for a structured answer. We describe the exact JSON shape in the prompt,
// parse the reply, and index.js still double-checks every field it uses.
async function askStructured({ apiKey, system, user, schema }) {
  const fullSystem =
    `${system}\n\nReply with ONLY a JSON object (no markdown, no extra text) that matches this JSON schema:\n` +
    JSON.stringify(schema);

  let res;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await callGemini({ apiKey, system: fullSystem, user });
    // 429 = free-tier rate limit, 503 = busy. Wait a little and retry.
    if ((res.status === 429 || res.status === 503) && attempt < 2) {
      await sleep(4000 * (attempt + 1));
      continue;
    }
    break;
  }

  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json())?.error?.message || "";
    } catch {}
    throw new Error(`Gemini request failed (${res.status}) ${detail}`.trim());
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  if (!candidate) {
    throw new Error(`The AI returned no answer${data?.promptFeedback?.blockReason ? ` (blocked: ${data.promptFeedback.blockReason})` : ""}.`);
  }
  const text = (candidate.content?.parts || []).map((p) => p.text || "").join("");
  if (!text) throw new Error(`The AI returned an empty answer (${candidate.finishReason || "unknown"}).`);

  return parseJson(text);
}

module.exports = { askStructured };