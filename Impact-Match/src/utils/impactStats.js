// Live impact figures for the sponsor Impact screen, calculated from real projects.
// Pure functions (no Firebase) so they can be unit tested.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const num = (v) => {
    const n = Number(String(v ?? "").replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
};

export const projectGoal = (p) => num(p.fundingGoal ?? p.goalAmount);
export const projectRaised = (p) => num(p.raisedAmount);
export const projectBeneficiaries = (p) => num(p.beneficiariesCount ?? p.beneficiaries);

// Firestore Timestamp, Date, ISO string or millis -> Date (or null)
export function toDate(value) {
    if (!value) return null;
    if (typeof value.toDate === "function") return value.toDate();
    const d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? null : d;
}

// Projects run by NGOs the sponsor has saved or shown interest in.
// If the sponsor has no partners yet, show every project on the platform instead.
export function selectPartnerProjects(projects = [], interests = []) {
    const partnerIds = new Set(
        interests.filter((i) => i && (i.saved || i.interested || i.ngoInterested)).map((i) => i.ngoId)
    );
    const mine = projects.filter((p) =>
        partnerIds.has(p.ownerId) || partnerIds.has(p.ngoOwnerId) || partnerIds.has(p.ngoId)
    );
    return mine.length > 0
        ? { projects: mine, scope: "partners", partnerCount: partnerIds.size }
        : { projects, scope: "platform", partnerCount: 0 };
}

// Running total of beneficiaries targeted, for each of the last `months` months.
export function beneficiariesByMonth(projects = [], months = 6, now = new Date()) {
    const buckets = [];
    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets.push({ key: d.getFullYear() * 12 + d.getMonth(), month: MONTHS[d.getMonth()], value: 0 });
    }
    const firstKey = buckets[0].key;
    let before = 0;
    projects.forEach((p) => {
        const d = toDate(p.createdAt) || now;
        const key = d.getFullYear() * 12 + d.getMonth();
        const count = projectBeneficiaries(p);
        if (key < firstKey) before += count;
        else {
            const b = buckets.find((x) => x.key === key);
            if (b) b.value += count;
        }
    });
    let running = before;
    return buckets.map(({ month, value }) => {
        running += value;
        return { month, value: running };
    });
}

// Percentage change between the first and last month of a series (null if not measurable).
export function growthPercent(series = []) {
    if (series.length < 2) return null;
    const first = series[0].value, last = series[series.length - 1].value;
    if (first <= 0) return last > 0 ? null : 0;
    return Math.round(((last - first) / first) * 100);
}

const SHORT = {
    "Education": "Edu.", "Healthcare": "Health", "Environment": "Env.", "Youth & Children": "Youth",
    "Women Empowerment": "Women", "Poverty Relief": "Poverty", "Skills & Employment": "Skills",
    "Community Development": "Comm.", "Technology & Innovation": "Tech", "Disability Support": "Disab.",
    "Animal Welfare": "Animals", "Sports": "Sport", "Arts & Culture": "Arts",
};

// Money raised per cause, as shares of the total. Top `max - 1` causes, the rest grouped as "Other".
export function fundingByCause(projects = [], max = 5) {
    const totals = {};
    projects.forEach((p) => {
        const cause = String(p.cause || p.category || "Other").trim() || "Other";
        totals[cause] = (totals[cause] || 0) + projectRaised(p);
    });
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    if (total <= 0) return [];
    let rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    if (rows.length > max) {
        const rest = rows.slice(max - 1).reduce((s, [, v]) => s + v, 0);
        rows = [...rows.slice(0, max - 1), ["Other", rest]];
    }
    return rows.map(([cause, amount]) => ({
        cause,
        label: SHORT[cause] || cause.slice(0, 7),
        amount,
        percentage: Math.round((amount / total) * 100),
    }));
}

// The project reaching the most people, used for the Impact Story card.
export function topStory(projects = []) {
    return projects.reduce((best, p) => (!best || projectBeneficiaries(p) > projectBeneficiaries(best) ? p : best), null);
}

// 1200 -> "1.2k", 950 -> "950"
export function compact(n) {
    if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}m`;
    if (n >= 1_000) return `${+(n / 1_000).toFixed(1)}k`;
    return String(Math.round(n));
}
