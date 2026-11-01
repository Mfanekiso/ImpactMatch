// Settings for the AI server. Secrets (API keys) are NOT here: they live in Vercel's
// Environment Variables (GEMINI_API_KEY and LELAPA_API_TOKEN).

module.exports = {
  // Your Firebase project. Only people signed in to THIS project can use the server.
  PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "semester-2-project-c6235",

  // Gemini model (free tier). If you ever get a "model not found" error, check the current
  // model names in Google AI Studio and change this (or set GEMINI_MODEL in Vercel).
  MODEL: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",

  // Same list as src/utils/causes.js in the app. Keep the two in sync.
  CAUSE_OPTIONS: [
    "Education",
    "Healthcare",
    "Environment",
    "Youth & Children",
    "Women Empowerment",
    "Poverty Relief",
    "Community Development",
    "Skills & Employment",
    "Technology & Innovation",
    "Disability Support",
    "Animal Welfare",
    "Sports",
    "Arts & Culture",
  ],

  // Daily limits per user (best effort) so nobody drains your free AI quota.
  DAILY_LIMITS: {
    suggestCauses: 40,
    draftOutreach: 20,
    transcribeStory: 10,
    reviewProfile: 300,
  },
};