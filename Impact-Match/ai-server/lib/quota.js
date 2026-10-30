const { HttpError } = require("./http");

// Best-effort daily limit per user. It lives in memory, so it resets when the server
// instance restarts. It's a safety net; Google's free-tier limits are the hard cap.
const counts = new Map();

function checkQuota(uid, feature, limit) {
  const day = new Date().toISOString().slice(0, 10);
  const key = `${uid}|${feature}|${day}`;
  const used = counts.get(key) || 0;
  if (used >= limit) {
    throw new HttpError(429, "You've reached today's limit for this feature. Please try again tomorrow.");
  }
  counts.set(key, used + 1);
  if (counts.size > 5000) counts.clear(); // keep memory bounded
}

module.exports = { checkQuota };