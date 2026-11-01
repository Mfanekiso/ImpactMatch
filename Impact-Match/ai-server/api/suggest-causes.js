// POST /api/suggest-causes
// Body: { organisationName, mission, targetCommunity }  ->  { causes: string[] }
const { route, HttpError, clean } = require("../lib/http");
const auth = require("../lib/auth");
const { checkQuota } = require("../lib/quota");
const { askStructured } = require("../lib/ai");
const { UNTRUSTED_NOTE } = require("../lib/prompts");
const { CAUSE_OPTIONS, DAILY_LIMITS } = require("../lib/config");

module.exports = route(async ({ body, headers }) => {
  const { uid } = await auth.verifyToken(headers);

  const organisationName = clean(body.organisationName, 200);
  const mission = clean(body.mission, 2000);
  const targetCommunity = clean(body.targetCommunity, 1000);

  if (mission.length < 10 && targetCommunity.length < 10) {
    throw new HttpError(400, "Please describe your mission first.");
  }
  checkQuota(uid, "suggestCauses", DAILY_LIMITS.suggestCauses);

  let result;
  try {
    result = await askStructured({
      system:
        "You label non-profit organisations in South Africa with cause categories. " +
        `Choose only from this list: ${CAUSE_OPTIONS.join(", ")}. ` +
        "Pick the 1 to 4 categories that best describe the organisation's real work. " +
        "Do not pick a category unless the text clearly supports it. " + UNTRUSTED_NOTE,
      user: `<profile>\nName: ${organisationName}\nMission: ${mission}\nWho they support: ${targetCommunity}\n</profile>`,
      schema: {
        type: "object",
        properties: {
          causes: { type: "array", items: { type: "string", enum: CAUSE_OPTIONS }, maxItems: 4 },
        },
        required: ["causes"],
      },
    });
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error("suggestCauses failed:", error?.message);
    throw new HttpError(500, "Could not suggest causes right now. You can pick them manually.");
  }

  // Belt and braces: only ever return known labels.
  const causes = [...new Set((Array.isArray(result.causes) ? result.causes : []).filter((c) => CAUSE_OPTIONS.includes(c)))].slice(0, 4);
  return { causes };
});