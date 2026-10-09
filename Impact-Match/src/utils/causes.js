// Single list of cause options so the sponsor setup, profile and matching all use the same labels.
// (The NGO side can import this too, so both sides pick from the same list.)

export const CAUSE_OPTIONS = [
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

// Accepts an array, or an old-style string like "Education, Healthcare", and returns an array.
export function normalizeCauses(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
    return String(value)
        .split(/[,;\n]/)
        .map((v) => v.trim())
        .filter(Boolean);
}

// For display: ["Education", "Healthcare"] -> "Education, Healthcare"
export function formatCauses(value) {
    return normalizeCauses(value).join(", ");
}