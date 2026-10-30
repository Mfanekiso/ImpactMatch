// Unit tests for the ImpactMatch matching engine (src/utils/matchScore.js)
import { computeMatch, parseAmount } from "../src/utils/matchScore";

const sponsor = {
  organisationName: "Tswelopele Logistics",
  location: "Johannesburg, Gauteng",
  fundingBudget: 500000,
  preferredCauses: ["Skills & Employment", "Youth & Children", "Education"],
};

const ngo = {
  organisationName: "Soweto Youth Code Lab",
  mission: "Free coding and digital skills training that prepares unemployed youth for tech jobs.",
  location: "Soweto, Gauteng",
  fundingRequired: 320000,
  targetCommunity: "Unemployed youth aged 18 to 30",
};

describe("parseAmount", () => {
  test("reads plain numbers and rand amounts", () => {
    expect(parseAmount(250000)).toBe(250000);
    expect(parseAmount("R150 000")).toBe(150000);
    expect(parseAmount("150,000")).toBe(150000);
  });
  test("understands k and m shorthand", () => {
    expect(parseAmount("R1.5m")).toBe(1500000);
    expect(parseAmount("300k")).toBe(300000);
  });
  test("returns null for empty or invalid input", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount(null)).toBeNull();
    expect(parseAmount("not a number")).toBeNull();
  });
});

describe("computeMatch", () => {
  test("TC4: budget covers the NGO's need, so funding compatibility is 100", () => {
    const { breakdown } = computeMatch({ ...sponsor, fundingBudget: 500000 }, { ...ngo, fundingRequired: 150000 });
    expect(breakdown.fundingCompatibility).toBe(100);
  });

  test("partial budget scores proportionally (R100k of R400k = 25)", () => {
    const { breakdown } = computeMatch({ ...sponsor, fundingBudget: 100000 }, { ...ngo, fundingRequired: 400000 });
    expect(breakdown.fundingCompatibility).toBe(25);
  });

  test("TC5: same province, different city gives location alignment 75", () => {
    const { breakdown } = computeMatch(sponsor, ngo);
    expect(breakdown.locationAlignment).toBe(75);
  });

  test("same city gives location alignment 100", () => {
    const { breakdown } = computeMatch(sponsor, { ...ngo, location: "Johannesburg, Gauteng" });
    expect(breakdown.locationAlignment).toBe(100);
  });

  test("related words count towards cause alignment (coding = Skills, youth = Youth)", () => {
    const { breakdown } = computeMatch(sponsor, ngo);
    expect(breakdown.causeAlignment).toBe(100);
  });

  test("overall score for the demo pair is 85% with reasons", () => {
    const { matchScore, whyYouMatch } = computeMatch(sponsor, ngo);
    expect(matchScore).toBe(85);
    expect(whyYouMatch).toContain("Their funding need is within your sponsorship budget.");
  });

  test("missing data is skipped, not scored as zero", () => {
    const { breakdown, matchScore } = computeMatch(
      { preferredCauses: ["Education"] },
      { mission: "School libraries and literacy for primary learners" }
    );
    expect(breakdown.fundingCompatibility).toBeNull();
    expect(breakdown.locationAlignment).toBeNull();
    expect(matchScore).toBe(100);
  });

  test("empty profiles score 0 and ask the user to complete their profile", () => {
    const { matchScore, whyYouMatch } = computeMatch({}, {});
    expect(matchScore).toBe(0);
    expect(whyYouMatch[0]).toMatch(/Complete both profiles/);
  });
});
