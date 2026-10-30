// Thin wrapper around Lelapa AI's Vulavula API (speech-to-text + translation for African languages).
// Docs: https://docs.lelapa.ai
const { HttpError } = require("./http");

const BASE = "https://api.lelapa.ai/v1";

// App language code -> Vulavula codes
const LANGUAGES = {
  en: { stt: "eng", translate: null },
  zu: { stt: "zul", translate: "zul_Latn" },
  st: { stt: "sot", translate: "sot_Latn" },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url, options, { timeoutMs = 25000, retries = 1 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      // 503/504 are documented as temporary: wait and retry once.
      if ((res.status === 503 || res.status === 504) && attempt < retries) {
        await sleep(2000);
        continue;
      }
      return res;
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(2000);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

async function transcribe({ token, audio, mimeType, fileName, langKey }) {
  const lang = LANGUAGES[langKey];
  const form = new FormData();
  form.append("file", new Blob([audio], { type: mimeType }), fileName);

  let res;
  try {
    res = await fetchWithRetry(`${BASE}/transcribe/sync?lang_code=${lang.stt}`, {
      method: "POST",
      headers: { "X-CLIENT-TOKEN": token },
      body: form,
    });
  } catch {
    throw new HttpError(503, "The transcription service is busy. Please try again in a moment.");
  }

  if (res.status === 401) throw new HttpError(502, "The transcription service key is invalid or has expired.");
  if (res.status === 415) throw new HttpError(400, "That audio format isn't supported.");
  if (res.status === 413) throw new HttpError(400, "That recording is too large. Try a shorter one.");
  if (!res.ok) throw new HttpError(503, "The transcription service is busy. Please try again in a moment.");

  const json = await res.json();
  return String(json.transcription_text || "").trim();
}

// Vulavula recommends < 100 words per request, so we split long transcripts.
function chunkWords(text, size = 80) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  for (let i = 0; i < words.length; i += size) chunks.push(words.slice(i, i + size).join(" "));
  return chunks;
}

async function translateToEnglish({ token, text, langKey }) {
  const lang = LANGUAGES[langKey];
  if (!lang?.translate) return text;

  // Translate the chunks at the same time to stay inside the server's time limit.
  const parts = await Promise.all(
    chunkWords(text).map(async (chunk) => {
      const res = await fetchWithRetry(
        `${BASE}/translate/process`,
        {
          method: "POST",
          headers: { "X-CLIENT-TOKEN": token, "Content-Type": "application/json" },
          body: JSON.stringify({ input_text: chunk, source_lang: lang.translate, target_lang: "eng_Latn" }),
        },
        { timeoutMs: 20000 }
      );
      if (!res.ok) throw new Error(`Translation failed (${res.status})`);
      const json = await res.json();
      return json?.translation?.[0]?.translated_text || "";
    })
  );
  return parts.join(" ").trim();
}

module.exports = { LANGUAGES, transcribe, translateToEnglish };