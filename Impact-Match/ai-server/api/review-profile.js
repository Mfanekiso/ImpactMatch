// POST /api/review-profile   (admins only)
// Body: { profile: <a user profile> }
//   ->  { risk, categories, reasons, signals, source, model }
// The admin site saves the result in Firestore; a person always makes the final call.
const { route, HttpError, clean } = require("../lib/http");
const auth = require("../lib/auth");
const { checkQuota } = require("../lib/quota");
const { askStructured } = require("../lib/ai");
const { UNTRUSTED_NOTE } = require("../lib/prompts");
const { scanSignals } = require("../lib/fraudSignals");
const { MODEL, DAILY_LIMITS } = require("../lib/config");

function listOrText(value) {
  return Array.isArray(value) ? value.slice(0, 8).map((v) => clean(v, 60)) : clean(value, 300);
}

module.exports = route(async ({ body, headers }) => {
  const { uid } = await auth.requireAdmin(headers);

  const profile = body.profile || {};
  if (!["ngo", "sponsor"].includes(profile.role)) {
    throw new HttpError(400, "Only NGO and sponsor profiles can be reviewed.");
  }

  const content = {
    organisationName: clean(profile.organisationName, 200),
    mission: clean(profile.mission, 2000),
    targetCommunity: clean(profile.targetCommunity, 1000),
    location: clean(profile.location, 200),
    fundingRequired: clean(profile.fundingRequired, 60),
    fundingBudget: clean(profile.fundingBudget, 60),
    causes: listOrText(profile.causes),
    preferredCauses: listOrText(profile.preferredCauses),
  };
  if (!content.organisationName && !content.mission) {
    throw new HttpError(400, "That profile has nothing to review yet.");
  }

  checkQuota(uid, "reviewProfile", DAILY_LIMITS.reviewProfile);
  const signals = scanSignals(content);

  try {
    const result = await askStructured({
      system:
        "You help a small admin team spot suspicious NGO and sponsor profiles on ImpactMatch, a South African platform. " +
        "Your output only queues a profile for HUMAN review; you never decide anything. " +
        "Flag real concerns: scams or requests for money outside the platform, impersonating a well-known organisation, " +
        "spam or advertising, gibberish or obvious test data, offensive content, or claims that are clearly implausible. " +
        "Do NOT penalise poor grammar or spelling, English as a second language, informal writing, a small or new " +
        "organisation, or missing details. A short but sincere profile is low risk. " +
        "Risk: 'low' = nothing concerning, 'medium' = worth a look, 'high' = likely fake or harmful. " +
        "Give at most 3 short, specific reasons that quote or name the field. " + UNTRUSTED_NOTE,
      user:
        `Role: ${profile.role}\nAutomatic checks that fired: ${signals.length ? signals.join("; ") : "none"}\n` +
        `<profile>\n${JSON.stringify(content)}\n</profile>`,
      schema: {
        type: "object",
        properties: {
          risk: { type: "string", enum: ["low", "medium", "high"] },
          categories: {
            type: "array",
            items: { type: "string", enum: ["scam", "impersonation", "spam", "gibberish_or_test", "inappropriate", "implausible_claims", "other"] },
          },
          reasons: { type: "array", items: { type: "string" }, maxItems: 3 },
        },
        required: ["risk", "categories", "reasons"],
      },
    });

    const risk = ["low", "medium", "high"].includes(result.risk) ? result.risk : "medium";
    return {
      risk,
      categories: Array.isArray(result.categories) ? result.categories.slice(0, 7).map((c) => clean(c, 40)) : [],
      reasons: (Array.isArray(result.reasons) ? result.reasons : []).slice(0, 3).map((r) => clean(r, 300)),
      signals,
      source: "ai",
      model: MODEL,
    };
  } catch (error) {
    console.error("reviewProfile AI call failed:", error?.message);
    // If the AI is down but our simple checks fired twice or more, still queue it for a human.
    if (signals.length >= 2) {
      return { risk: "medium", categories: ["other"], reasons: signals.slice(0, 3), signals, source: "rules", model: null };
    }
    if (error instanceof HttpError) throw error;
    throw new HttpError(502, "The AI review is unavailable right now.");
  }
});