//Tshepo
// NGOs / causes that sponsors can browse and fund.
// Consumed by: SponsorHomeScreen, (future) SponsorDiscoverScreen, SponsorOpportunityDetailsScreen.

const opportunities = [
    {
        id: "1",
        name: "Education For All",
        shortName: "EFA",
        verified: true,
        location: "Johannesburg, SA",
        tags: ["Education", "Youth Development"],
        description:
            "Providing quality education and digital literacy programmes to underserved youth across Gauteng.",
        fundingNeedMin: 150000,
        fundingNeedMax: 300000,
        matchScore: 92,
        color: "#1E3A5F",
    },
    {
        id: "2",
        name: "GreenRoots Africa",
        shortName: "GRA",
        verified: true,
        location: "Cape Town, SA",
        tags: ["Environment", "Community Development"],
        description:
            "Restoring local ecosystems and building climate resilience in vulnerable communities.",
        fundingNeedMin: 100000,
        fundingNeedMax: 250000,
        matchScore: 87,
        color: "#166534",
    },
    {
        id: "3",
        name: "Umuntu Health Trust",
        shortName: "UHT",
        verified: true,
        location: "Johannesburg, SA",
        tags: ["Healthcare", "Community Development"],
        description:
            "Bringing mobile healthcare and maternal support services to underserved communities.",
        fundingNeedMin: 120000,
        fundingNeedMax: 280000,
        matchScore: 81,
        color: "#5B21B6",
    },
    {
        id: "4",
        name: "Simu Girls Initiative",
        shortName: "SGI",
        verified: true,
        location: "Lagos, Nigeria",
        tags: ["Youth Development", "Education"],
        description:
            "Empowering young women through mentorship, STEM education and leadership training.",
        fundingNeedMin: 90000,
        fundingNeedMax: 200000,
        matchScore: 76,
        color: "#9D174D",
    },
];

export default opportunities;