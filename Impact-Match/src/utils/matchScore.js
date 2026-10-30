// Matching engine for the sponsor side.
//
// computeMatch(sponsorProfile, ngoProfile) returns:
//   { matchScore, breakdown, whyYouMatch }
// which is the same shape SponsorMatchDetailsScreen already renders (data/matches.js).
//
// It works with the fields that exist TODAY in Firestore `users` docs:
//   Sponsor: preferredCauses (string "Education, Healthcare" or array), location, fundingBudget
//   NGO:     organisationName, mission, targetCommunity, location, fundingRequired
// If your NGO teammate later adds `causes: string[]`, it is picked up automatically.
//
// A breakdown value of `null` means "no data to score this" and is skipped
// (SponsorMatchDetailsScreen hides those rows).

// ---------- helpers ----------

const STOP_WORDS = new Set([
    "the", "and", "for", "with", "that", "this", "from", "into", "our", "your",
    "are", "all", "who", "their", "them", "have", "has", "can", "will", "per",
    "south", "africa", "african", "sa", "of", "in", "to", "a", "an", "on", "at",
]);

// Light normalisation: lowercase, strip punctuation, drop plural "s".
function stem(word) {
    let w = word.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (w.length > 4 && w.endsWith("ies")) w = w.slice(0, -3) + "y";
    else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
    return w;
}

function tokenize(text) {
    if (!text) return [];
    return String(text)
        .split(/[^A-Za-z0-9]+/)
        .map(stem)
        .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

// Accepts "Education, Healthcare", ["Education"], or nothing.
function toList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
    return String(value)
        .split(/[,;/&\n]|\band\b/i)
        .map((v) => v.trim())
        .filter(Boolean);
}

// Groups of words that mean the same cause area.
const CAUSE_GROUPS = [
    ["education", "school", "learning", "literacy", "student", "teacher", "tutor", "curriculum", "bursary", "stem", "digital"],
    ["youth", "young", "child", "children", "teen", "teenager", "adolescent", "learner", "kid"],
    ["health", "healthcare", "medical", "clinic", "hospital", "wellness", "nutrition", "disease", "hiv", "aids", "maternal", "mental"],
    ["environment", "environmental", "climate", "conservation", "sustainability", "sustainable", "ecosystem", "recycling", "renewable", "green", "wildlife", "biodiversity", "water"],
    ["community", "development", "township", "rural", "underserved", "village"],
    ["women", "woman", "gender", "girl", "female", "empowerment"],
    ["poverty", "hunger", "food", "feeding", "shelter", "homeless", "relief"],
    ["technology", "tech", "innovation", "coding", "computer", "ict", "digital"],
    ["sport", "sports", "athletic", "recreation"],
    ["arts", "art", "culture", "creative", "music", "heritage"],
    ["employment", "job", "skills", "entrepreneurship", "entrepreneur", "livelihood", "enterprise", "training"],
    ["disability", "disabled", "inclusion", "accessible", "accessibility"],
    ["animal", "animals", "welfare", "shelter"],
];

// Expand one cause term into the set of words that count as a hit.
function expandCause(term) {
    const tokens = tokenize(term);
    const expanded = new Set(tokens);
    tokens.forEach((t) => {
        CAUSE_GROUPS.forEach((group) => {
            if (group.map(stem).includes(t)) {
                group.forEach((g) => expanded.add(stem(g)));
            }
        });
    });
    return expanded;
}

// How many of the sponsor's causes are mentioned in the NGO text (0-100, or null if no data).
function causeOverlap(sponsorCauses, ngoText) {
    const causes = toList(sponsorCauses);
    const ngoTokens = new Set(tokenize(ngoText));
    if (causes.length === 0 || ngoTokens.size === 0) return { score: null, hits: [] };

    const hits = [];
    causes.forEach((cause) => {
        const words = expandCause(cause);
        for (const w of words) {
            if (ngoTokens.has(w)) {
                hits.push(cause);
                break;
            }
        }
    });
    return { score: Math.round((hits.length / causes.length) * 100), hits };
}

// "R500 000", "R1.5m", "150,000", 250000  ->  number (or null)
export function parseAmount(value) {
    if (value == null || value === "") return null;
    if (typeof value === "number") return isNaN(value) ? null : value;

    let text = String(value).toLowerCase().replace(/\s/g, "").replace(/,/g, "");
    const match = text.match(/(\d+(\.\d+)?)(k|m)?/);
    if (!match) return null;

    let num = parseFloat(match[1]);
    if (match[3] === "k") num *= 1_000;
    if (match[3] === "m") num *= 1_000_000;
    return isNaN(num) ? null : num;
}

// Straight-line distance in km between two { latitude, longitude } points (Haversine formula).
export function distanceKm(a, b) {
    if (!a || !b) return null;
    const lat1 = Number(a.latitude), lng1 = Number(a.longitude);
    const lat2 = Number(b.latitude), lng2 = Number(b.longitude);
    if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return null;
    const R = 6371;
    const rad = (d) => (d * Math.PI) / 180;
    const dLat = rad(lat2 - lat1), dLng = rad(lng2 - lng1);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

// Distance bands used for the location score.
export function distanceScore(km) {
    if (km == null) return null;
    if (km <= 25) return 100;
    if (km <= 100) return 85;
    if (km <= 300) return 60;
    if (km <= 600) return 40;
    return 25;
}

// Location: real distance when both profiles have coordinates (saved with the
// Nominatim API), otherwise compare the place names, e.g.
// "Johannesburg, Gauteng" vs "Soweto, Gauteng" -> shares province = partial match.
function locationScore(a, b, sponsorProfile = {}, ngoProfile = {}) {
    const km = distanceKm(sponsorProfile, ngoProfile);
    if (km != null) {
        const rounded = Math.max(1, Math.round(km));
        return { score: distanceScore(km), label: km <= 25 ? "nearby" : "distance", km: rounded };
    }

    const partsA = toList(a).map((p) => p.toLowerCase());
    const partsB = toList(b).map((p) => p.toLowerCase());
    if (partsA.length === 0 || partsB.length === 0) return { score: null, label: "" };

    const sameCity = partsA[0] === partsB[0];
    const sharedPart = partsA.find((p) => partsB.includes(p));

    if (sameCity) return { score: 100, label: "same city" };
    if (sharedPart) return { score: 75, label: "same region" };

    // Fall back to any shared word (e.g. "Gauteng" written inside a longer string)
    const tokensA = new Set(tokenize(a));
    const shared = tokenize(b).some((t) => tokensA.has(t));
    if (shared) return { score: 60, label: "nearby" };

    return { score: 25, label: "different region" };
}

// Funding: budget covers the need = 100, otherwise proportional.
function fundingScore(budget, need) {
    const b = parseAmount(budget);
    const n = parseAmount(need);
    if (b == null || n == null || n <= 0) return { score: null, covers: false };
    if (b >= n) return { score: 100, covers: true };
    return { score: Math.max(10, Math.round((b / n) * 100)), covers: false };
}

// ---------- CSR / ESG and B-BBEE alignment ----------
//
// Sponsor fields: reportingGoals (array from REPORTING_GOALS), sdgFocus (array of SDG names)
// NGO fields:     sdgs (array of SDG names), blackBeneficiaryPercent (0-100), section18A (boolean)
//
// Each part that both sides have data for scores 0-100; the factor is their average.
// Under the B-BBEE Codes of Good Practice, socio-economic development spend is fully
// recognised when at least 75% of beneficiaries are black people, so 75% = full marks.

export const REPORTING_GOALS = [
    "B-BBEE socio-economic development",
    "Section 18A tax certificate",
    "UN SDG reporting",
    "ESG / sustainability report",
];

export const SDG_OPTIONS = [
    "No Poverty", "Zero Hunger", "Good Health", "Quality Education", "Gender Equality",
    "Clean Water", "Clean Energy", "Decent Work", "Innovation", "Reduced Inequalities",
    "Sustainable Cities", "Responsible Consumption", "Climate Action", "Life Below Water",
    "Life on Land", "Peace and Justice", "Partnerships",
];

export function csrEsgScore(sponsor = {}, ngo = {}) {
    const goals = toList(sponsor.reportingGoals);
    const wantsSdg = toList(sponsor.sdgFocus);
    const ngoSdgs = toList(ngo.sdgs).map((x) => x.toLowerCase());
    const parts = [];
    const reasons = [];

    if (wantsSdg.length > 0 && ngoSdgs.length > 0) {
        const hits = wantsSdg.filter((g) => ngoSdgs.includes(g.toLowerCase()));
        parts.push(Math.round((hits.length / wantsSdg.length) * 100));
        if (hits.length > 0) reasons.push(`They contribute to your SDG focus: ${hits.join(", ")}.`);
    }

    const pct = ngo.blackBeneficiaryPercent;
    if (goals.includes("B-BBEE socio-economic development") && pct !== undefined && pct !== null && pct !== "") {
        const p = Math.max(0, Math.min(100, Number(pct) || 0));
        parts.push(Math.min(100, Math.round((p / 75) * 100)));
        if (p >= 75) reasons.push("Your funding can count fully towards B-BBEE socio-economic development points.");
    }

    if (goals.includes("Section 18A tax certificate") && typeof ngo.section18A === "boolean") {
        parts.push(ngo.section18A ? 100 : 0);
        if (ngo.section18A) reasons.push("They can issue a Section 18A tax certificate for donations.");
    }

    if (parts.length === 0) return { score: null, reasons: [] };
    return { score: Math.round(parts.reduce((a, b) => a + b, 0) / parts.length), reasons };
}

// ---------- main ----------

export function computeMatch(sponsor = {}, ngo = {}) {
    const ngoText = [
        ngo.organisationName,
        ngo.mission,
        ngo.targetCommunity,
        ...toList(ngo.causes),
    ].join(" ");

    const cause = causeOverlap(sponsor.preferredCauses, ngoText);
    const beneficiary = causeOverlap(
        sponsor.preferredCauses,
        [ngo.targetCommunity, ...toList(ngo.causes)].join(" ")
    );
    const location = locationScore(sponsor.location, ngo.location, sponsor, ngo);
    const csr = csrEsgScore(sponsor, ngo);
    const funding = fundingScore(sponsor.fundingBudget, ngo.fundingRequired);

    const breakdown = {
        causeAlignment: cause.score,
        locationAlignment: location.score,
        fundingCompatibility: funding.score,
        beneficiaryAlignment: beneficiary.score,
        csrEsgAlignment: csr.score,
    };

    // Weighted average over the factors that actually have data.
    const WEIGHTS = {
        causeAlignment: 0.4,
        locationAlignment: 0.2,
        fundingCompatibility: 0.25,
        beneficiaryAlignment: 0.15,
        csrEsgAlignment: 0.2, // only counted when both profiles have CSR/ESG data
    };
    let total = 0;
    let weightUsed = 0;
    Object.keys(WEIGHTS).forEach((key) => {
        if (breakdown[key] != null) {
            total += breakdown[key] * WEIGHTS[key];
            weightUsed += WEIGHTS[key];
        }
    });
    const matchScore = weightUsed > 0 ? Math.round(total / weightUsed) : 0;

    const whyYouMatch = [];
    if (cause.hits.length > 0) {
        whyYouMatch.push(
            `Their work lines up with your preferred cause${cause.hits.length > 1 ? "s" : ""}: ${cause.hits.join(", ")}.`
        );
    }
    if (location.km != null) {
        whyYouMatch.push(
            location.km <= 25
                ? `They are only about ${location.km} km away from you.`
                : `They are about ${location.km} km away from you.`
        );
    } else if (location.label === "same city") {
        whyYouMatch.push("Both organisations are based in the same city.");
    } else if (location.label === "same region") {
        whyYouMatch.push("Both organisations operate in the same region.");
    }
    if (funding.covers) {
        whyYouMatch.push("Their funding need is within your sponsorship budget.");
    } else if (funding.score != null && funding.score >= 50) {
        whyYouMatch.push("Your budget covers a large part of their funding need.");
    }
    if (beneficiary.hits.length > 0 && ngo.targetCommunity) {
        whyYouMatch.push(`They support ${ngo.targetCommunity}, which fits your focus.`);
    }
    csr.reasons.forEach((r) => whyYouMatch.push(r));
    if (whyYouMatch.length === 0) {
        whyYouMatch.push("Limited overlap found yet. Complete both profiles for a better match.");
    }

    return { matchScore, breakdown, whyYouMatch, distanceKm: location.km ?? null };
}

export default computeMatch;