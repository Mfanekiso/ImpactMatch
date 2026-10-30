// POST /api/transcribe-story
// Body: { audioBase64, mimeType, fileName, language: "en" | "zu" | "st" }
//   ->  { transcript, english, translationFailed, fields }
const { route, HttpError, clean } = require("../lib/http");
const auth = require("../lib/auth");
const { checkQuota } = require("../lib/quota");
const { askStructured } = require("../lib/ai");
const { UNTRUSTED_NOTE } = require("../lib/prompts");
const { LANGUAGES, transcribe, translateToEnglish } = require("../lib/vulavula");
const { CAUSE_OPTIONS, DAILY_LIMITS } = require("../lib/config");

// Vercel accepts request bodies up to about 4.5 MB; a 90-second recording is far smaller.
const MAX_AUDIO_BASE64 = 4_000_000;

module.exports = route(async ({ body, headers }) => {
  const { uid } = await auth.verifyToken(headers);

  const { audioBase64, mimeType = "audio/mp4", fileName = "story.m4a", language: langKey } = body;

  if (!LANGUAGES[langKey]) throw new HttpError(400, "Unsupported language.");
  if (typeof audioBase64 !== "string" || audioBase64.length < 1000) {
    throw new HttpError(400, "The recording was empty. Please try again.");
  }
  if (audioBase64.length > MAX_AUDIO_BASE64) {
    throw new HttpError(400, "That recording is too long. Please keep it under about 90 seconds.");
  }
  if (!process.env.LELAPA_API_TOKEN) throw new HttpError(500, "The AI server is missing its transcription key.");
  checkQuota(uid, "transcribeStory", DAILY_LIMITS.transcribeStory);

  const token = process.env.LELAPA_API_TOKEN;

  // 1) Speech -> text (never logged or stored: it is personal information).
  const transcript = await transcribe({
    token,
    audio: Buffer.from(audioBase64, "base64"),
    mimeType: clean(mimeType, 60),
    fileName: clean(fileName, 80),
    langKey,
  });
  if (!transcript) {
    throw new HttpError(422, "We couldn't hear anything in that recording. Please try again in a quieter place.");
  }

  // 2) Translate to English when needed. If it fails we still let the AI try the original.
  let english = transcript;
  let translationFailed = false;
  if (langKey !== "en") {
    try {
      english = await translateToEnglish({ token, text: transcript, langKey });
    } catch (error) {
      console.warn("translation failed, continuing with original transcript:", error?.message);
      translationFailed = true;
      english = "";
    }
  }

  // 3) Pull the profile fields out of what the person said.
  let fields;
  try {
    fields = await askStructured({
      system:
        "You turn a spoken description of a South African non-profit into profile fields. " +
        "Write in clear, simple English. Stay faithful to what the speaker said: never invent facts, numbers or places. " +
        "If something was not mentioned, return an empty string for it. " +
        "'mission' is 1 to 3 sentences. 'targetCommunity' says who the organisation helps. " +
        "'location' is town/city and province if given. " +
        "'fundingRequired' is digits only in South African rand (e.g. 150000); convert words like 'R150k' or " +
        "'one hundred and fifty thousand'. " +
        `'causes' uses only these labels: ${CAUSE_OPTIONS.join(", ")} (1 to 4). ` + UNTRUSTED_NOTE,
      user:
        `Language spoken: ${langKey}\n` +
        `<story>\nOriginal transcript:\n${clean(transcript, 6000)}\n\n` +
        (english ? `English translation:\n${clean(english, 6000)}\n` : "") +
        `</story>`,
      schema: {
        type: "object",
        properties: {
          organisationName: { type: "string" },
          mission: { type: "string" },
          targetCommunity: { type: "string" },
          location: { type: "string" },
          fundingRequired: { type: "string" },
          causes: { type: "array", items: { type: "string", enum: CAUSE_OPTIONS }, maxItems: 4 },
        },
        required: ["organisationName", "mission", "targetCommunity", "location", "fundingRequired", "causes"],
      },
    });
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error("fill_profile failed:", error?.message);
    throw new HttpError(500, "We heard you, but couldn't fill in the form. Please try again or type it in.");
  }

  const safe = {
    organisationName: clean(fields.organisationName, 200),
    mission: clean(fields.mission, 2000),
    targetCommunity: clean(fields.targetCommunity, 1000),
    location: clean(fields.location, 200),
    fundingRequired: String(fields.fundingRequired || "").replace(/[^\d]/g, ""),
    causes: [...new Set((Array.isArray(fields.causes) ? fields.causes : []).filter((c) => CAUSE_OPTIONS.includes(c)))].slice(0, 4),
  };

  return { transcript, english: english || null, translationFailed, fields: safe };
});