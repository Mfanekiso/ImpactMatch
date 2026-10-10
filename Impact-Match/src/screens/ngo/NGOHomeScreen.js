import React from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import {
    useFonts,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
} from "@expo-google-fonts/manrope";

import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../../../Backend/firebaseConfig";
import { computeMatch } from "../../utils/matchScore";
import { readLocalCache, writeLocalCache } from "../../utils/profileCache";

const COLORS = {
    background: "#F8F6EE", 
    surface: "#FFFFFF",
    primary: "#D9C982", // Soft Luxury Gold
    emerald: "#059669", 
    textPrimary: "#433327", 
    textSecondary: "#8C7A6B", 
    border: "#E8DFD5",
    white: "#FFFFFF",
    ivory: "#433327", 
    
    // Luxury Gold Card specific colors
    goldCardBg: "#D9C982",
    goldCardText: "#FFFFFF",
    goldCardTextMuted: "rgba(255, 255, 255, 0.85)",
    goldCardDivider: "rgba(255, 255, 255, 0.3)",
    goldCardGlow: "rgba(255, 255, 255, 0.15)",
    goldCardPillBg: "rgba(255, 255, 255, 0.25)",
};

const softShadow = (opacity, radius, elevation) => ({
    shadowColor: "#D9C982",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: elevation,
});

export default function NGOHomeScreen({ navigation, route }) {
    const [recommendedSponsors, setRecommendedSponsors] = React.useState([]);
    const [loadingSponsors, setLoadingSponsors] = React.useState(true);
    const [interestStats, setInterestStats] = React.useState({ interested: 0, mutual: 0 });
    const [fontsLoaded] = useFonts({
        Manrope_400Regular,
        Manrope_500Medium,
        Manrope_600SemiBold,
        Manrope_700Bold,
    });

    const { organisationName, user } = route.params || {};

    React.useEffect(() => {
        let active = true;
        const loadHome = async () => {
            const uid = auth.currentUser?.uid;
            try {
                if (!uid) return;
                const [profileSnap, sponsorsSnap, interestsSnap] = await Promise.all([
                    getDoc(doc(db, "users", uid)),
                    getDocs(query(collection(db, "users"), where("role", "==", "sponsor"))),
                    getDocs(query(collection(db, "interests"), where("ngoId", "==", uid))),
                ]);
                const ngoProfile = profileSnap.exists() ? profileSnap.data() : {};
                const list = sponsorsSnap.docs
                    .filter((item) => item.id !== uid && item.data().profileCompleted)
                    .map((item, index) => {
                        const data = item.data();
                        const { matchScore } = computeMatch(data, ngoProfile);
                        return {
                            id: item.id,
                            name: data.organisationName || "Sponsor",
                            type: data.industry || "Sponsor",
                            description: data.mission || data.description || "",
                            location: data.location || "Location not specified",
                            budget: data.fundingBudget ? `R${Number(data.fundingBudget).toLocaleString("en-ZA")}` : "Not disclosed",
                            tags: Array.isArray(data.preferredCauses) ? data.preferredCauses : [],
                            causes: Array.isArray(data.preferredCauses) ? data.preferredCauses : [],
                            matchScore,
                            matchPercentage: matchScore,
                            colorIndex: index,
                        };
                    })
                    .sort((a, b) => b.matchScore - a.matchScore)
                    .slice(0, 3);
                if (active) setRecommendedSponsors(list);
                if (active) {
                    const interests = interestsSnap.docs.map((entry) => entry.data());
                    const stats = {
                        interested: interests.filter((entry) => entry.interested).length,
                        mutual: interests.filter((entry) => entry.interested && entry.ngoInterested).length,
                    };
                    setInterestStats(stats);
                    await writeLocalCache(`ngo-home:${uid}`, { sponsors: list, stats });
                }
            } catch (error) {
                console.warn("Could not load live sponsor recommendations:", error?.message);
                const cached = uid ? await readLocalCache(`ngo-home:${uid}`) : null;
                if (active) {
                    setRecommendedSponsors(cached?.sponsors || []);
                    setInterestStats(cached?.stats || { interested: 0, mutual: 0 });
                }
            } finally {
                if (active) setLoadingSponsors(false);
            }
        };
        loadHome();
        const unsubscribe = navigation.addListener("focus", loadHome);
        return () => { active = false; unsubscribe(); };
    }, [navigation]);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerIcon}>
                        {/* <Ionicons name="menu-outline" size={26} color={COLORS.textPrimary} /> */}
                    </TouchableOpacity>

                    <View style={styles.headerTitleContainer}>
                        {/* <Ionicons name="leaf" size={20} color={COLORS.primary} style={styles.logoIcon} /> */}
                        <Text style={styles.headerTitle}>IMPACTMATCH</Text>
                    </View>

                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.bellButton} activeOpacity={0.7}>
                            <Ionicons name="notifications-outline" size={20} color={COLORS.ivory} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.profileButton} activeOpacity={0.7} accessibilityLabel="Open profile" onPress={() => navigation.navigate("NGOProfile")}>
                            <Ionicons name="person-circle-outline" size={23} color={COLORS.ivory} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ─── Hero Greeting ─── */}
                <View style={styles.heroBlock}>
                    <Text style={styles.heroEyebrow}>Hello</Text>
                    <Text style={styles.heroTitle}>
                        {organisationName || user?.organisationName || "Partner"}
                    </Text>
                    <Text style={styles.heroSubtitle}>
                        A live view of your organisation’s sponsor activity.
                    </Text>
                </View>

                {/* ─── Impact Overview (Gold Card) ─── */}
                <View style={styles.impactCard}>
                    {/* Decorative corner glow */}
                    <View style={styles.impactGlow} />

                    <View style={styles.impactHeader}>
                        <Text style={styles.impactLabel}>SPONSOR INTEREST</Text>
                        <View style={styles.impactPill}>
                            <Ionicons
                                name="trending-up-outline"
                                size={12}
                                color={COLORS.goldCardText}
                            />
                            <Text style={styles.impactPillText}>Live</Text>
                        </View>
                    </View>

                    {/* Featured stat */}
                    <View style={styles.featuredStat}>
                        <Text style={styles.featuredValue}>{interestStats.interested}</Text>
                        <Text style={styles.featuredLabel}>
                            Sponsors who have shown interest
                        </Text>
                    </View>

                    {/* Divider */}
                    <View style={styles.horizontalDivider} />

                    {/* Secondary stats */}
                    <View style={styles.secondaryStats}>
                        <View style={styles.secondaryStat}>
                            <Text style={styles.secondaryValue}>{recommendedSponsors.length}</Text>
                            <Text style={styles.secondaryLabel}>
                                Top{"\n"}matches
                            </Text>
                        </View>

                        <View style={styles.verticalDivider} />

                        <View style={styles.secondaryStat}>
                            <Text style={styles.secondaryValue}>{interestStats.mutual}</Text>
                            <Text style={styles.secondaryLabel}>
                                Mutual{"\n"}matches
                            </Text>
                        </View>

                        <View style={styles.verticalDivider} />

                        <View style={styles.secondaryStat}>
                            <Text style={styles.secondaryValue}>{interestStats.interested}</Text>
                            <Text style={styles.secondaryLabel}>
                                Sponsor{"\n"}interests
                            </Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.createProjectButton}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate("CreateOpportunity")}
                >
                    <View style={styles.createProjectIcon}>
                        <Ionicons name="add" size={22} color={COLORS.emerald} />
                    </View>
                    <View style={styles.createProjectCopy}>
                        <Text style={styles.createProjectTitle}>Create a project</Text>
                        <Text style={styles.createProjectSubtitle}>Share a funding need with sponsors</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.emerald} />
                </TouchableOpacity>

                {/* Recommended Section Header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recommended for You</Text>
                    <TouchableOpacity onPress={() => navigation.navigate("SponsorSearch")}>
                        <Text style={styles.seeAll}>See all</Text>
                    </TouchableOpacity>
                </View>

                {/* Recommendations List */}
                {loadingSponsors ? (
                    <ActivityIndicator color={COLORS.emerald} style={{ marginVertical: 20 }} />
                ) : recommendedSponsors.length > 0 ? (
                    recommendedSponsors.map((sponsor) => (
                        <TouchableOpacity
                            key={sponsor.id}
                            style={styles.sponsorCard}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate("SponsorDetails", { sponsor })}
                        >
                            <View style={styles.matchBadge}>
                                <Text style={styles.matchText}>
                                    {sponsor.matchPercentage || 0}%
                                </Text>
                                <Text style={styles.matchLabel}>Match</Text>
                            </View>

                            <View style={styles.sponsorInfo}>
                                <Text style={styles.sponsorName} numberOfLines={1}>
                                    {sponsor.name}
                                </Text>
                                <Text style={styles.sponsorTags} numberOfLines={1}>
                                    {sponsor.tags?.join(" • ") || "General"}
                                </Text>
                                <Text style={styles.sponsorLocation} numberOfLines={1}>
                                    {sponsor.location || "Location not specified"}
                                </Text>
                            </View>

                            <View style={styles.sponsorActionIcon}>
                                <Ionicons name="business-outline" size={22} color={COLORS.primary} />
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text style={styles.emptyText}>No recommendations available yet.</Text>
                )}

                {/* Explore More Button */}
                <TouchableOpacity
                    style={styles.exploreButton}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate("SponsorSearch")}
                >
                    <Text style={styles.exploreButtonText}>Explore More Organizations</Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 10,
        paddingBottom: 150,
    },

    /* Header */
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    headerIcon: {
        padding: 4,
    },
    headerActions: { flexDirection: "row", alignItems: "center" },
    headerTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    logoIcon: {
        marginRight: 6,
    },
    headerTitle: {
        fontFamily: "Manrope_700Bold",
        fontSize: 20,
        letterSpacing: 1.2,
        color: COLORS.primary,

    },

    /* ─── Hero Greeting ─── */
    heroBlock: {
        marginBottom: 28,
        paddingHorizontal: 4,
    },
    heroEyebrow: {
        fontFamily: "Manrope_700Bold",
        fontSize: 21,
        color: COLORS.primary,
        letterSpacing: 2,
        marginBottom: 2,
    },
    heroTitle: {
        fontFamily: "Manrope_700Bold",
        fontSize: 28,
        color: COLORS.textPrimary,
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    heroSubtitle: {
        fontFamily: "Manrope_400Regular",
        fontSize: 14,
        color: COLORS.textSecondary,
        letterSpacing: 0.2,
    },

    /* ─── Impact Overview Card ─── */
    impactCard: {
        backgroundColor: COLORS.goldCardBg,
        borderRadius: 26,
        padding: 24,
        marginBottom: 32,
        overflow: "hidden",
        ...softShadow(0.3, 12, 6),
    },
    createProjectButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 18,
        padding: 15,
        marginBottom: 28,
    },
    createProjectIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(5,150,105,0.1)", alignItems: "center", justifyContent: "center" },
    createProjectCopy: { flex: 1, marginLeft: 12 },
    createProjectTitle: { fontFamily: "Manrope_700Bold", fontSize: 14, color: COLORS.textPrimary },
    createProjectSubtitle: { fontFamily: "Manrope_400Regular", fontSize: 12, color: COLORS.textSecondary, marginTop: 3 },
    impactGlow: {
        position: "absolute",
        top: -60,
        right: -60,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: COLORS.goldCardGlow,
    },
    impactHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    impactLabel: {
        fontFamily: "Manrope_700Bold",
        fontSize: 10,
        letterSpacing: 2,
        color: COLORS.goldCardTextMuted,
    },
    impactPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.goldCardPillBg,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    impactPillText: {
        fontFamily: "Manrope_600SemiBold",
        color: COLORS.goldCardText,
        fontSize: 10,
        marginLeft: 4,
        letterSpacing: 0.4,
    },

    /* ─── Featured stat ─── */
    featuredStat: {
        marginBottom: 22,
    },
    featuredValue: {
        fontFamily: "Manrope_700Bold",
        fontSize: 40,
        color: COLORS.goldCardText,
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    featuredLabel: {
        fontFamily: "Manrope_400Regular",
        fontSize: 12,
        color: COLORS.goldCardTextMuted,
        letterSpacing: 0.3,
    },

    /* ─── Dividers ─── */
    horizontalDivider: {
        height: 1,
        backgroundColor: COLORS.goldCardDivider,
        marginBottom: 20,
    },
    verticalDivider: {
        width: 1,
        height: 28,
        backgroundColor: COLORS.goldCardDivider,
    },

    /* ─── Secondary stats ─── */
    secondaryStats: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    secondaryStat: {
        flex: 1,
        alignItems: "center",
    },
    secondaryValue: {
        fontFamily: "Manrope_600SemiBold",
        fontSize: 20,
        color: COLORS.goldCardText,
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    secondaryLabel: {
        fontFamily: "Manrope_600SemiBold",
        fontSize: 9,
        color: COLORS.goldCardTextMuted,
        textAlign: "center",
        lineHeight: 13,
        letterSpacing: 0.6,
    },

    /* Section Header */
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    sectionTitle: {
        fontFamily: "Manrope_700Bold",
        fontSize: 18,
        color: COLORS.textPrimary,
    },
    seeAll: {
        fontFamily: "Manrope_700Bold",
        fontSize: 14,
        color: COLORS.primary,
    },

    /* Sponsor Cards */
    sponsorCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: COLORS.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    matchBadge: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 2,
        borderColor: COLORS.emerald,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
        backgroundColor: "rgba(5, 150, 105, 0.05)",
    },
    matchText: {
        fontFamily: "Manrope_700Bold",
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    matchLabel: {
        fontFamily: "Manrope_600SemiBold",
        fontSize: 9,
        color: COLORS.textSecondary,
        textTransform: "uppercase",
    },
    sponsorInfo: {
        flex: 1,
        marginRight: 10,
    },
    sponsorName: {
        fontFamily: "Manrope_700Bold",
        fontSize: 16,
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    sponsorTags: {
        fontFamily: "Manrope_500Medium",
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    sponsorLocation: {
        fontFamily: "Manrope_500Medium",
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    sponsorActionIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "rgba(217, 201, 130, 0.15)",
        alignItems: "center",
        justifyContent: "center",
    },

    /* Empty State */
    emptyText: {
        fontFamily: "Manrope_500Medium",
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: "center",
        marginVertical: 20,
    },

    /* Explore Button */
    exploreButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#a18f3e",
        borderRadius: 16,
        paddingVertical: 18,
        marginTop: 16,
        shadowColor: COLORS.emerald,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
    },
    exploreButtonText: {
        fontFamily: "Manrope_700Bold",
        fontSize: 15,
        color: COLORS.white,
        marginRight: 8,
        letterSpacing: 0.5,
    },
    bellButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
    },
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginLeft: 8,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
    },
});
