import React, { useState, useEffect, useMemo } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Image,
    ActivityIndicator,
    Alert,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import {
    useFonts,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
} from "@expo-google-fonts/manrope";

// Firebase imports
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../../Backend/firebaseConfig";

import { computeMatch } from "../../utils/matchScore";
import { loadSponsorInterests, setSaved } from "../../utils/interests";
import { readLocalCache, writeLocalCache } from "../../utils/profileCache";

// ─── LUXURY COLOR PALETTE (Sponsor Twist) ──────────────────────────────
const COLORS = {
    background: "#F8F6EE",       // Cream base
    surface: "#FFFFFF",          // Clean white
    primary: "#D9C982",          // Soft Luxury Gold
    primarySoft: "rgba(217, 201, 130, 0.15)",
    emerald: "#059669",          // Vibrant Emerald 
    buttonDark: "#013e37",       // Deep luxury green (Sponsor Primary)
    buttonDarkSoft: "rgba(1, 62, 55, 0.08)",
    textPrimary: "#433327",      // Warm Bronze
    textSecondary: "#8C7A6B",    // Muted taupe
    border: "#E8DFD5",
    white: "#FFFFFF",
    danger: "#DC2626",           // Elegant red
    coral: "#DC2626",            // Notification dot
};

// Premium unified avatar colors for missing logos
const AVATAR_COLORS = [
    COLORS.buttonDark, 
    COLORS.emerald, 
    COLORS.primary, 
    "#607A70", 
    "#8C7A6B"
];

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
}

function getInitials(name) {
    if (!name) return "?";
    return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function formatCurrencyShort(value) {
    const num = Number(value);
    if (isNaN(num)) return "R0";
    if (num >= 1_000_000) return `R${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `R${(num / 1_000).toFixed(1)}K`;
    return `R${num}`;
}

function formatCurrency(value) {
    const num = Number(value);
    if (isNaN(num)) return "R0";
    return `R${num.toLocaleString("en-ZA")}`;
}

function formatFundingRange(value) {
    if (value == null || value === "") return "Not specified";
    return formatCurrency(value);
}

// Subtle luxury shadow
const softShadow = {
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
};

export default function SponsorHomeScreen({ navigation, route }) {
    const [fontsLoaded] = useFonts({
        Manrope_400Regular,
        Manrope_500Medium,
        Manrope_600SemiBold,
        Manrope_700Bold,
    });

    const [sponsorProfile, setSponsorProfile] = useState(null);
    const [ngos, setNgos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savedIds, setSavedIds] = useState([]);

    const uid = auth.currentUser?.uid;

    const fetchSponsorProfile = async () => {
        if (!uid) return;
        try {
            const { doc, getDoc } = await import("firebase/firestore");
            const snap = await getDoc(doc(db, "users", uid));
            if (snap.exists()) {
                setSponsorProfile(snap.data());
            }
        } catch (error) {
            console.log("Error fetching sponsor profile:", error.message);
        }
    };

    const fetchNgos = async () => {
        try {
            const ngoQuery = query(collection(db, "users"), where("role", "==", "ngo"));
            const snapshot = await getDocs(ngoQuery);

            const results = snapshot.docs.filter((docSnap) => docSnap.data().profileCompleted).map((docSnap, index) => ({
                id: docSnap.id,
                color: AVATAR_COLORS[index % AVATAR_COLORS.length],
                ...((({ organisationName, location, profileImageUrl, targetCommunity, mission, fundingRequired, profileCompleted, causes }) => ({ organisationName, location, profileImageUrl, targetCommunity, mission, fundingRequired, profileCompleted, causes }))(docSnap.data())),
            }));

            setNgos(results);
            if (uid) await writeLocalCache(`sponsor-home-ngos:${uid}`, results);
        } catch (error) {
            const cached = uid ? await readLocalCache(`sponsor-home-ngos:${uid}`) : null;
            setNgos(cached || []);
            if (!cached) Alert.alert("Error Loading NGOs", error.message);
        } finally {
            setLoading(false);
        }
    };

    const loadSaved = async () => {
        if (!uid) return;
        try {
            const map = await loadSponsorInterests(uid);
            setSavedIds(Object.keys(map).filter((id) => map[id].saved));
        } catch (error) {
            console.log("Error loading saved NGOs:", error?.message);
        }
    };

    useEffect(() => {
        fetchSponsorProfile();
        fetchNgos();
        loadSaved();

        const unsubscribe = navigation.addListener("focus", loadSaved);
        return unsubscribe;
    }, [uid]);

    const organisationName =
        sponsorProfile?.organisationName || route?.params?.organisationName || "Sponsor";

    const rankedNgos = useMemo(() => {
        if (!sponsorProfile) return ngos;
        return ngos
            .map((ngo) => ({ ngo, score: computeMatch(sponsorProfile, ngo).matchScore }))
            .sort((a, b) => b.score - a.score)
            .map((item) => item.ngo);
    }, [ngos, sponsorProfile]);

    const topMatch = rankedNgos[0];
    const moreNgos = rankedNgos.slice(1);

    const toggleSaved = async (id) => {
        const wasSaved = savedIds.includes(id);

        setSavedIds((prev) =>
            wasSaved ? prev.filter((savedId) => savedId !== id) : [...prev, id]
        );

        try {
            await setSaved(id, !wasSaved);
        } catch (error) {
            setSavedIds((prev) =>
                wasSaved ? [...prev, id] : prev.filter((savedId) => savedId !== id)
            );
            Alert.alert("Could not save", error?.message || "Please try again.");
        }
    };

    const goToDiscover = () => navigation.navigate("Discover");
    const goToOpportunity = (ngo) => navigation.navigate("SponsorOpportunityDetails", { opportunity: ngo });

    if (!fontsLoaded) return null;

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, styles.centered]}>
                <ActivityIndicator size="large" color={COLORS.buttonDark} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerText}>
                        <Text style={styles.greetingSmall}>{getGreeting()}</Text>
                        <Text style={styles.greetingName}>{organisationName}</Text>
                        <Text style={styles.subtitle}>Let's find your next impact partnership.</Text>
                    </View>

                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.bellButton} activeOpacity={0.7}>
                            <Ionicons name="notifications-outline" size={20} color={COLORS.textPrimary} />
                            <View style={styles.bellDot} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.avatar}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate("Profile")}
                        >
                            {sponsorProfile?.profileImageUrl ? (
                                <Image source={{ uri: sponsorProfile.profileImageUrl }} style={styles.avatarImage} />
                            ) : (
                                <Text style={styles.avatarText}>{getInitials(organisationName)}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Dashboard Stats (2x2 Grid for Premium feel) */}
                <View style={styles.statsGrid}>
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{ngos.length}</Text>
                            <Text style={styles.statLabel}>NGOs Listed</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{formatCurrencyShort(sponsorProfile?.fundingBudget)}</Text>
                            <Text style={styles.statLabel}>Your Budget</Text>
                        </View>
                    </View>
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>
                                {rankedNgos.filter((ngo) => computeMatch(sponsorProfile || {}, ngo).matchScore >= 60).length}
                            </Text>
                            <Text style={styles.statLabel}>Strong Matches</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{savedIds.length}</Text>
                            <Text style={styles.statLabel}>Saved</Text>
                        </View>
                    </View>
                </View>

                {/* Recommended For You */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recommended For You</Text>
                    <TouchableOpacity onPress={goToDiscover} activeOpacity={0.7}>
                        <Text style={styles.viewAll}>View All</Text>
                    </TouchableOpacity>
                </View>

                {topMatch ? (
                    <TouchableOpacity
                        style={styles.recommendedCard}
                        activeOpacity={0.85}
                        onPress={() => goToOpportunity(topMatch)}
                    >
                        <View style={styles.recommendedTopRow}>
                            {topMatch.profileImageUrl ? (
                                <Image source={{ uri: topMatch.profileImageUrl }} style={styles.orgLogoImage} />
                            ) : (
                                <View style={[styles.orgLogo, { backgroundColor: topMatch.color }]}>
                                    <Text style={styles.orgLogoText}>{getInitials(topMatch.organisationName)}</Text>
                                </View>
                            )}

                            <View style={styles.matchBadge}>
                                <Text style={styles.matchText}>{computeMatch(sponsorProfile || {}, topMatch).matchScore}%</Text>
                                <Text style={styles.matchLabel}>Match</Text>
                            </View>
                        </View>

                        <View style={styles.orgNameRow}>
                            <Text style={styles.orgName}>{topMatch.organisationName || "Unnamed NGO"}</Text>
                            {topMatch.profileCompleted && (
                                <Ionicons name="checkmark-circle" size={16} color={COLORS.emerald} style={styles.verifiedIcon} />
                            )}
                        </View>

                        <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                            <Text style={styles.locationText}>{topMatch.location || "Location not provided"}</Text>
                        </View>

                        {topMatch.targetCommunity ? (
                            <View style={styles.tagsRow}>
                                <View style={styles.tagPill}>
                                    <Text style={styles.tagPillText}>{topMatch.targetCommunity}</Text>
                                </View>
                            </View>
                        ) : null}

                        <Text style={styles.description} numberOfLines={2}>
                            {topMatch.mission || "No mission statement provided yet."}
                        </Text>

                        <View style={styles.fundingNeedBox}>
                            <Text style={styles.fundingNeedLabel}>Funding Need</Text>
                            <Text style={styles.fundingNeedValue}>{formatFundingRange(topMatch.fundingRequired)}</Text>
                        </View>

                        <View style={styles.recommendedActions}>
                            <TouchableOpacity
                                style={styles.viewMatchButton}
                                activeOpacity={0.85}
                                onPress={() => goToOpportunity(topMatch)}
                            >
                                <Text style={styles.viewMatchButtonText}>View Details</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.saveButton}
                                activeOpacity={0.7}
                                onPress={() => toggleSaved(topMatch.id)}
                            >
                                <Ionicons
                                    name={savedIds.includes(topMatch.id) ? "heart" : "heart-outline"}
                                    size={22}
                                    color={savedIds.includes(topMatch.id) ? COLORS.danger : COLORS.textPrimary}
                                />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="business-outline" size={28} color={COLORS.textSecondary} />
                        <Text style={styles.emptyStateText}>No NGOs have signed up yet.</Text>
                    </View>
                )}

                {/* More live NGO profiles */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>More Organisations</Text>
                    <TouchableOpacity onPress={goToDiscover} activeOpacity={0.7}>
                        <Text style={styles.viewAll}>See All</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.liveList}>
                    {moreNgos.slice(0, 3).map((ngo) => (
                        <TouchableOpacity key={ngo.id} style={styles.liveNgoCard} onPress={() => goToOpportunity(ngo)} activeOpacity={0.82}>
                            <View style={[styles.liveAvatar, { backgroundColor: ngo.color }]}>
                                <Text style={styles.liveAvatarText}>{getInitials(ngo.organisationName)}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.liveNgoName} numberOfLines={1}>{ngo.organisationName || "Organisation"}</Text>
                                <Text style={styles.liveNgoMeta} numberOfLines={1}>{ngo.targetCommunity || "Community impact"} · {ngo.location || "Location not provided"}</Text>
                            </View>
                            <Text style={styles.liveScore}>{computeMatch(sponsorProfile || {}, ngo).matchScore}%</Text>
                        </TouchableOpacity>
                    ))}
                    {!loading && moreNgos.length === 0 && <Text style={styles.liveNgoMeta}>More real NGO profiles will appear here as they join.</Text>}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    centered: { justifyContent: "center", alignItems: "center" },
    scrollContent: { padding: 24, paddingTop: 10, paddingBottom: 112 },

    /* Header */
    header: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 28,
    },
    headerText: { flex: 1, paddingRight: 12 },
    greetingSmall: { 
        fontFamily: "Manrope_700Bold",
        fontSize: 14, 
        color: COLORS.primary, 
        marginBottom: 4,
        letterSpacing: 1,
        textTransform: "uppercase"
    },
    greetingName: { 
        fontFamily: "Manrope_700Bold",
        fontSize: 28, 
        color: COLORS.textPrimary, 
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    subtitle: { 
        fontFamily: "Manrope_400Regular",
        fontSize: 14, 
        color: COLORS.textSecondary, 
        lineHeight: 20 
    },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
    bellButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
        ...softShadow
    },
    bellDot: {
        position: "absolute",
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.coral,
        borderWidth: 1.5,
        borderColor: COLORS.surface,
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: COLORS.buttonDark,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        borderWidth: 2,
        borderColor: COLORS.surface,
        ...softShadow
    },
    avatarImage: { width: "100%", height: "100%" },
    avatarText: { fontFamily: "Manrope_700Bold", color: COLORS.white, fontSize: 16 },

    /* Stats Grid */
    statsGrid: { marginBottom: 32, gap: 12 },
    statsRow: { flexDirection: "row", gap: 12 },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        paddingVertical: 18,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "flex-start",
        ...softShadow
    },
    statNumber: { 
        fontFamily: "Manrope_700Bold",
        fontSize: 24, 
        color: COLORS.buttonDark, 
        marginBottom: 4 
    },
    statLabel: { 
        fontFamily: "Manrope_600SemiBold",
        fontSize: 12, 
        color: COLORS.textSecondary 
    },

    /* Section Headers */
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    sectionTitle: { 
        fontFamily: "Manrope_700Bold",
        fontSize: 18, 
        color: COLORS.textPrimary 
    },
    viewAll: { 
        fontFamily: "Manrope_700Bold",
        fontSize: 14, 
        color: COLORS.primary 
    },

    /* Empty State */
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 32,
        gap: 12,
        ...softShadow
    },
    emptyStateText: { 
        fontFamily: "Manrope_500Medium",
        fontSize: 14, 
        color: COLORS.textSecondary 
    },

    /* Recommended Card */
    recommendedCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...softShadow
    },
    recommendedTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    orgLogo: { 
        width: 56, 
        height: 56, 
        borderRadius: 18, 
        alignItems: "center", 
        justifyContent: "center" 
    },
    orgLogoImage: { 
        width: 56, 
        height: 56, 
        borderRadius: 18 
    },
    orgLogoText: { 
        fontFamily: "Manrope_700Bold",
        color: COLORS.white, 
        fontSize: 18 
    },
    matchBadge: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.buttonDarkSoft,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
    },
    matchText: { 
        fontFamily: "Manrope_700Bold",
        fontSize: 16, 
        color: COLORS.buttonDark 
    },
    matchLabel: { 
        fontFamily: "Manrope_600SemiBold",
        fontSize: 10, 
        color: COLORS.buttonDark,
        textTransform: "uppercase" 
    },
    orgNameRow: { 
        flexDirection: "row", 
        alignItems: "center", 
        marginBottom: 6 
    },
    orgName: { 
        fontFamily: "Manrope_700Bold",
        fontSize: 20, 
        color: COLORS.textPrimary 
    },
    verifiedIcon: { marginLeft: 6 },
    locationRow: { 
        flexDirection: "row", 
        alignItems: "center", 
        marginBottom: 16, 
        gap: 4 
    },
    locationText: { 
        fontFamily: "Manrope_500Medium",
        fontSize: 14, 
        color: COLORS.textSecondary 
    },
    tagsRow: { 
        flexDirection: "row", 
        flexWrap: "wrap", 
        gap: 8, 
        marginBottom: 16 
    },
    tagPill: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    tagPillText: { 
        fontFamily: "Manrope_600SemiBold",
        fontSize: 12, 
        color: COLORS.textSecondary 
    },
    description: { 
        fontFamily: "Manrope_400Regular",
        fontSize: 15, 
        lineHeight: 22, 
        color: COLORS.textSecondary, 
        marginBottom: 16 
    },
    fundingNeedBox: {
        backgroundColor: COLORS.background,
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    fundingNeedLabel: {
        fontFamily: "Manrope_600SemiBold",
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    fundingNeedValue: {
        fontFamily: "Manrope_700Bold",
        fontSize: 18,
        color: COLORS.buttonDark,
    },
    recommendedActions: { 
        flexDirection: "row", 
        alignItems: "center", 
        gap: 12 
    },
    viewMatchButton: {
        flex: 1,
        backgroundColor: COLORS.buttonDark,
        borderRadius: 30, // Luxury pill shape
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: COLORS.buttonDark,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
    },
    viewMatchButtonText: { 
        fontFamily: "Manrope_700Bold",
        color: COLORS.white, 
        fontSize: 16,
        letterSpacing: 0.3
    },
    saveButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.surface,
    },

    /* Live List */
    liveList: { gap: 12 },
    liveNgoCard: { 
        flexDirection: "row", 
        alignItems: "center", 
        backgroundColor: COLORS.surface, 
        borderRadius: 20, 
        borderWidth: 1, 
        borderColor: COLORS.border, 
        padding: 16,
        ...softShadow
    },
    liveAvatar: { 
        width: 48, 
        height: 48, 
        borderRadius: 16, 
        alignItems: "center", 
        justifyContent: "center", 
        marginRight: 16 
    },
    liveAvatarText: { 
        fontFamily: "Manrope_700Bold",
        color: COLORS.white, 
        fontSize: 15 
    },
    liveNgoName: { 
        fontFamily: "Manrope_700Bold",
        color: COLORS.textPrimary, 
        fontSize: 16,
        marginBottom: 4
    },
    liveNgoMeta: { 
        fontFamily: "Manrope_500Medium",
        color: COLORS.textSecondary, 
        fontSize: 13 
    },
    liveScore: { 
        fontFamily: "Manrope_700Bold",
        color: COLORS.buttonDark, 
        fontSize: 16, 
        marginLeft: 12 
    },
});