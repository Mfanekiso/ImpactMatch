// POST /api/draft-outreach
// Body: { me: <my profile>, other: <their profile> }  ->  { message }
// The app reads both profiles (under your normal Firestore rules) and sends them here.
const { route, HttpError, clean } = require("../lib/http");
const auth = require("../lib/auth");
const { checkQuota } = require("../lib/quota");
const { askStructured } = require("../lib/ai");
const { UNTRUSTED_NOTE } = require("../lib/prompts");
const { DAILY_LIMITS } = require("../lib/config");

function list(value, max = 6) {
  return Array.isArray(value) ? value.slice(0, max).map((v) => clean(v, 60)) : clean(value, 200);
}

function publicProfile(data = {}) {
  return {
    name: clean(data.organisationName || data.full_name, 120),
    role: data.role,
    mission: clean(data.mission, 600),
    targetCommunity: clean(data.targetCommunity, 300),
    location: clean(data.location, 120),
    fundingRequired: clean(data.fundingRequired, 40),
    fundingBudget: clean(data.fundingBudget, 40),
    industry: clean(data.industry, 80),
    causes: list(data.causes),
    preferredCauses: list(data.preferredCauses),
  };
}

module.exports = route(async ({ body, headers }) => {
  const { uid } = await auth.verifyToken(headers);

  const me = publicProfile(body.me);
  const other = publicProfile(body.other);
  if (!["ngo", "sponsor"].includes(me.role) || !["ngo", "sponsor"].includes(other.role) || me.role === other.role) {
    throw new HttpError(400, "Drafting is only available between an NGO and a sponsor.");
  }
  checkQuota(uid, "draftOutreach", DAILY_LIMITS.draftOutreach);

  const direction =
    me.role === "sponsor"
      ? "A corporate sponsor is writing to an NGO they might fund. Show genuine interest in the NGO's work and ask about its goals or next steps. Do NOT promise any specific amount of money."
      : "An NGO is writing to a sponsor who might fund them. Introduce the organisation briefly and respectfully, say why the sponsor's priorities fit, and ask if they would like to learn more. Do NOT pressure them.";

  let result;
  try {
    result = await askStructured({
      system:
        "You draft the FIRST message in a new conversation on ImpactMatch, a platform connecting South African NGOs and sponsors. " +
        direction + " " +
        "Rules: 70 to 120 words; warm, professional, plain South African English; mention one or two real overlaps " +
        "(shared cause, location, community) using ONLY facts in the profiles; never invent facts, figures or past dealings; " +
        "no placeholders like [Name]; sign off with the sender's organisation name; end with one clear, easy next step. " +
        "Plain text only. " + UNTRUSTED_NOTE,
      user:
        `<profile role="sender">\n${JSON.stringify(me)}\n</profile>\n` +
        `<profile role="recipient">\n${JSON.stringify(other)}\n</profile>`,
      schema: { type: "object", properties: { message: { type: "string" } }, required: ["message"] },
    });
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error("draftOutreach failed:", error?.message);
    throw new HttpError(500, "Could not draft a message right now. You can write your own.");
  }

  const message = String(result.message || "").trim();
  if (!message) throw new HttpError(500, "Could not draft a message right now. You can write your own.");
  return { message };
});