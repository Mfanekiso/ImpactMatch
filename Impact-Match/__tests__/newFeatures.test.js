// Unit tests for distance matching, CSR/ESG + B-BBEE alignment, live impact figures and search.
import { computeMatch, distanceKm, distanceScore, csrEsgScore } from "../src/utils/matchScore";
import { selectPartnerProjects, beneficiariesByMonth, growthPercent, fundingByCause, topStory, compact } from "../src/utils/impactStats";
import { matchesQuery, orderByIds, algoliaEnabled } from "../src/utils/search";

const JHB = { latitude: -26.2041, longitude: 28.0473 };     // Johannesburg
const SOWETO = { latitude: -26.2485, longitude: 27.854 };    // Soweto
const CPT = { latitude: -33.9249, longitude: 18.4241 };      // Cape Town

describe("distance-based matching", () => {
  test("Haversine distance Johannesburg to Cape Town is about 1,260 km", () => {
    expect(Math.round(distanceKm(JHB, CPT) / 10) * 10).toBe(1260);
  });
  test("Johannesburg to Soweto is under 25 km and scores 100", () => {
    const km = distanceKm(JHB, SOWETO);
    expect(km).toBeLessThan(25);
    expect(distanceScore(km)).toBe(100);
  });
  test("distance bands", () => {
    expect(distanceScore(80)).toBe(85);
    expect(distanceScore(250)).toBe(60);
    expect(distanceScore(500)).toBe(40);
    expect(distanceScore(1200)).toBe(25);
    expect(distanceScore(null)).toBeNull();
  });
  test("coordinates override place names and appear in the reasons", () => {
    const r = computeMatch({ location: "Johannesburg, Gauteng", ...JHB }, { location: "Cape Town, Western Cape", ...CPT });
    expect(r.breakdown.locationAlignment).toBe(25);
    expect(r.distanceKm).toBeGreaterThan(1200);
    expect(r.whyYouMatch.some((t) => t.includes("km away"))).toBe(true);
  });
  test("without coordinates it falls back to place names (same province = 75)", () => {
    const r = computeMatch({ location: "Johannesburg, Gauteng" }, { location: "Soweto, Gauteng" });
    expect(r.breakdown.locationAlignment).toBe(75);
    expect(r.distanceKm).toBeNull();
  });
});

describe("CSR / ESG and B-BBEE alignment", () => {
  const sponsor = { reportingGoals: ["B-BBEE socio-economic development", "Section 18A tax certificate"], sdgFocus: ["Quality Education", "Decent Work"] };
  test("full marks: SDGs overlap, 90% black beneficiaries, has Section 18A", () => {
    const r = csrEsgScore(sponsor, { sdgs: ["Quality Education", "Decent Work"], blackBeneficiaryPercent: 90, section18A: true });
    expect(r.score).toBe(100);
    expect(r.reasons.length).toBe(3);
  });
  test("B-BBEE recognition is proportional below 75% (60% -> 80)", () => {
    const r = csrEsgScore({ reportingGoals: ["B-BBEE socio-economic development"] }, { blackBeneficiaryPercent: 60 });
    expect(r.score).toBe(80);
  });
  test("half the SDGs and no Section 18A average out", () => {
    const r = csrEsgScore(sponsor, { sdgs: ["Quality Education"], section18A: false });
    expect(r.score).toBe(25); // (50 + 0) / 2
  });
  test("no CSR data on either side means the factor is skipped", () => {
    expect(csrEsgScore({}, {}).score).toBeNull();
    const before = computeMatch({ preferredCauses: ["Education"] }, { mission: "school literacy" }).matchScore;
    expect(before).toBe(100);
  });
  test("the factor is included in the overall match score", () => {
    const r = computeMatch(sponsor, { sdgs: ["Quality Education", "Decent Work"], blackBeneficiaryPercent: 90, section18A: true });
    expect(r.breakdown.csrEsgAlignment).toBe(100);
  });
});

describe("live impact reporting", () => {
  const now = new Date(2026, 9, 15); // 15 Oct 2026
  const projects = [
    { ownerId: "a", cause: "Education", raisedAmount: 60000, beneficiariesCount: 100, createdAt: new Date(2026, 4, 3).toISOString(), title: "A" },
    { ownerId: "b", cause: "Healthcare", raisedAmount: 20000, beneficiariesCount: 400, createdAt: new Date(2026, 8, 20).toISOString(), title: "B" },
    { ownerId: "c", cause: "Education", raisedAmount: 20000, beneficiariesCount: 50, createdAt: new Date(2026, 9, 1).toISOString(), title: "C" },
  ];
  test("only partner projects are counted when the sponsor has partners", () => {
    const r = selectPartnerProjects(projects, [{ ngoId: "a", interested: true }, { ngoId: "c", saved: true }]);
    expect(r.scope).toBe("partners");
    expect(r.projects.map((p) => p.title)).toEqual(["A", "C"]);
  });
  test("falls back to all projects when the sponsor has no partners yet", () => {
    expect(selectPartnerProjects(projects, []).scope).toBe("platform");
  });
  test("beneficiaries are a running total over the last 6 months", () => {
    const s = beneficiariesByMonth(projects, 6, now);
    expect(s.map((x) => x.month)).toEqual(["May", "Jun", "Jul", "Aug", "Sep", "Oct"]);
    expect(s.map((x) => x.value)).toEqual([100, 100, 100, 100, 500, 550]);
    expect(growthPercent(s)).toBe(450);
  });
  test("funding by cause uses money raised, as percentages", () => {
    const f = fundingByCause(projects);
    expect(f[0]).toMatchObject({ cause: "Education", label: "Edu.", percentage: 80 });
    expect(f[1]).toMatchObject({ cause: "Healthcare", percentage: 20 });
  });
  test("impact story is the project reaching the most people", () => {
    expect(topStory(projects).title).toBe("B");
    expect(compact(1250)).toBe("1.3k");
  });
});

describe("search", () => {
  const record = ["Soweto Youth Code Lab", "Free coding and digital skills training", "Soweto, Gauteng"];
  test("every word must match the start of a word", () => {
    expect(matchesQuery("coding soweto", record)).toBe(true);
    expect(matchesQuery("cod sow", record)).toBe(true);
    expect(matchesQuery("coding durban", record)).toBe(false);
  });
  test("one typo is tolerated in longer words", () => {
    expect(matchesQuery("trainng", record)).toBe(true);
    expect(matchesQuery("gautneg", record)).toBe(false); // two letters swapped = 2 edits
  });
  test("empty search matches everything", () => {
    expect(matchesQuery("", record)).toBe(true);
  });
  test("Algolia results keep Algolia's ranking order", () => {
    const items = [{ id: "x" }, { id: "y" }, { id: "z" }];
    expect(orderByIds(items, ["z", "x"]).map((i) => i.id)).toEqual(["z", "x"]);
  });
  test("Algolia is off until keys are added", () => {
    expect(algoliaEnabled()).toBe(false);
  });
});
