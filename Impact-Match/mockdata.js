// Placeholder data so the admin UI can be built without Firebase.
// Replace with Firestore reads later.

export const MOCK_STATS = {
    totalSponsors: 24,
    pendingApprovals: 5,
    activeUsers: 132,
    fundingDeployed: 1850000,
};

export const MOCK_SPONSORS = [
    {
        id: "1",
        name: "Bright Futures Foundation",
        type: "Non-profit",
        location: "Johannesburg, GP",
        causes: ["Education", "Youth"],
        status: "approved",
    },
    {
        id: "2",
        name: "GreenLeaf Holdings",
        type: "Corporate",
        location: "Cape Town, WC",
        causes: ["Environment", "Energy"],
        status: "pending",
    },
    {
        id: "3",
        name: "Ubuntu Health Trust",
        type: "Trust",
        location: "Durban, KZN",
        causes: ["Health"],
        status: "approved",
    },
    {
        id: "4",
        name: "Skyline Ventures",
        type: "Corporate",
        location: "Pretoria, GP",
        causes: ["Technology", "Jobs"],
        status: "rejected",
    },
    {
        id: "5",
        name: "Karoo Community Fund",
        type: "Non-profit",
        location: "Kimberley, NC",
        causes: ["Housing", "Community"],
        status: "pending",
    },
];

export const MOCK_USERS = [
    { id: "u1", name: "Thandi Mokoena", email: "thandi@example.com", role: "admin" },
    { id: "u2", name: "Sipho Dlamini", email: "sipho@example.com", role: "sponsor" },
    { id: "u3", name: "Lerato Nkosi", email: "lerato@example.com", role: "sponsor" },
    { id: "u4", name: "Pieter van Wyk", email: "pieter@example.com", role: "student" },
    { id: "u5", name: "Ayesha Patel", email: "ayesha@example.com", role: "student" },
];