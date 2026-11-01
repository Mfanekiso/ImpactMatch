// Central settings for all AI functions.
//
// REGION: for the Firestore trigger (fraud review) this MUST match the location of your
// Firestore database (Firebase console -> Firestore Database -> top of the Data tab).
// If your database is in a US multi-region ("nam5"), "us-central1" is correct.
// The app (src/utils/aiApi.js) must use the same region.
const REGION = "us-central1";

// Gemini model used for extraction, drafting and moderation (free tier).
// If you ever get a "model not found" error, open Google AI Studio, check the current
// model names, and change this value.
const MODEL = "gemini-3.1-flash-lite";

// The same list as src/utils/causes.js. Keep the two in sync.
const CAUSE_OPTIONS = [
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
];

// Daily per-user limits so one account can't run up your bill.
const DAILY_LIMITS = {
  suggestCauses: 40,
  draftOutreach: 20,
  transcribeStory: 10,
};

module.exports = { REGION, MODEL, CAUSE_OPTIONS, DAILY_LIMITS };