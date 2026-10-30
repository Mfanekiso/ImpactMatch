// Cheap, deterministic red-flag checks. They are only HINTS passed to the AI reviewer
// (and a fallback if the AI is unavailable). They never block anyone on their own.

const SCAM_WORDS = /\b(bitcoin|crypto|usdt|western union|moneygram|gift ?cards?|wire transfer|guaranteed returns?|double your|investment opportunity|lottery|inheritance|bank details|send (me )?money|processing fee|urgent(ly)? (need|transfer))\b/i;

function textOf(content) {
  return [content.organisationName, content.mission, content.targetCommunity, content.location]
    .filter(Boolean)
    .join(" ");
}

function scanSignals(content) {
  const text = textOf(content);
  const signals = [];

  const urls = text.match(/https?:\/\/\S+|www\.\S+/gi) || [];
  if (urls.length >= 2) signals.push("Multiple links in the profile text");

  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(text)) signals.push("Email address inside the profile text");
  if (/(\+?\d[\d\s-]{8,}\d)/.test(text)) signals.push("Phone number inside the profile text");
  if (SCAM_WORDS.test(text)) signals.push("Wording often seen in scams (crypto, gift cards, wire transfers, guaranteed returns)");

  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length > 30) {
    const upper = letters.replace(/[^A-Z]/g, "").length;
    if (upper / letters.length > 0.7) signals.push("Mostly capital letters");
  }
  if (/(.)\1{5,}/.test(text)) signals.push("Repeated characters (possible test or gibberish text)");

  const mission = String(content.mission || "").trim();
  if (content.mission !== undefined && mission.length > 0 && mission.length < 15) {
    signals.push("Very short mission text");
  }

  const funding = Number(String(content.fundingRequired || "").replace(/[^\d.]/g, ""));
  if (Number.isFinite(funding) && funding >= 50_000_000) signals.push("Unusually large funding request");

  return signals;
}

module.exports = { scanSignals };