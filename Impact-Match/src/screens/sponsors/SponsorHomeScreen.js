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

// Firebase imports
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../../Backend/firebaseConfig";

import { computeMatch } from "../../utils/matchScore";
import { loadSponsorInterests, setSaved } from "../../utils/interests";
import { readLocalCache, writeLocalCache } from "../../utils/profileCache";

const COLORS = {
    background: "#F9FAFB",
    surface: "#FFFFFF",
    primary: "#10B981", // emerald green — sponsor brand accent
    primaryLight: "rgba(16, 185, 129, 0.10)",
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    border: "#E5E7EB",
    white: "#FFFFFF",
    danger: "#EF4444",
    statBlueBg: "#EEF2FF",
    statBlueText: "#4338CA",
    statGreenBg: "#DCFCE7",
    statGreenText: "#15803D",
    statYellowBg: "#FEF9C3",
    statYellowText: "#B45309",
    statPurpleBg: "#F3E8FF",
    statPurpleText: "#7E22CE",
};

// A fixed palette to cycle through for NGO avatar backgrounds, since Firestore doesn't store one
const AVATAR_COLORS = ["#10B981", "#2563EB", "#DB2777", "#7C3AED", "#C2410C", "#0EA5E9"];

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

// Turns a raw number into a short display string, e.g. 4200000 -> "R4.2M"
function formatCurrencyShort(value) {
    const num = Number(value);
    if (isNaN(num)) return "R0";
    if (num >= 1_000_000) return `R${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `R${(num / 1_000).toFixed(1)}K`;
    return `R${num}`;
}

// Formats a full number with thousands separators, e.g. 45000 -> "R45,000"
function formatCurrency(value) {
    const num = Number(value);
    if (isNaN(num)) return "R0";
    return `R${num.toLocaleString("en-ZA")}`;
}

// Formats a funding need value pulled from Firestore's fundingRequired field
function formatFundingRange(value) {
    if (value == null || value === "") return "Not specified";
    return formatCurrency(value);
}

export default function SponsorHomeScreen({ navigation, route }) {
    const [sponsorProfile, setSponsorProfile] = useState(null);
    const [ngos, setNgos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savedIds, setSavedIds] = useState([]);

    const uid = auth.currentUser?.uid;

    // Fetch the signed-in sponsor's own profile (for the greeting name)
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

    // Fetch every user document where role == "ngo"
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

    // Load which NGOs this sponsor has saved (stored in Firestore `interests`)
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

        // Refresh saved hearts when coming back from Discover / details screens
        const unsubscribe = navigation.addListener("focus", loadSaved);
        return unsubscribe;
    }, [uid]);

    const organisationName =
        sponsorProfile?.organisationName || route?.params?.organisationName || "Sponsor";

    // Rank NGOs by how well they match this sponsor's profile (best first)
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

        // Update the heart straight away, then save in the background
        setSavedIds((prev) =>
            wasSaved ? prev.filter((savedId) => savedId !== id) : [...prev, id]
        );

        try {
            await setSaved(id, !wasSaved);
        } catch (error) {
            // Undo if saving failed
            setSavedIds((prev) =>
                wasSaved ? [...prev, id] : prev.filter((savedId) => savedId !== id)
            );
            Alert.alert("Could not save", error?.message || "Please try again.");
        }
    };

    const goToDiscover = () => navigation.navigate("Discover");

    const goToOpportunity = (ngo) => {
        navigation.navigate("SponsorOpportunityDetails", { opportunity: ngo });
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, styles.centered]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
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
                    <View style={styles.headerText}>
                        <Text style={styles.greetingSmall}>{getGreeting()} 👋</Text>
                        <Text style={styles.greetingName}>{organisationName}</Text>
                        <Text style={styles.subtitle}>
                            Let's find your next impact partnership.
                        </Text>
                    </View>

                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.notificationButton} activeOpacity={0.7}>
                            <Ionicons
                                name="notifications-outline"
                                size={22}
                                color={COLORS.textPrimary}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.avatar}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate("Profile")}
                        >
                            {sponsorProfile?.profileImageUrl ? (
                                <Image
                                    source={{ uri: sponsorProfile.profileImageUrl }}
                                    style={styles.avatarImage}
                                />
                            ) : (
                                <Text style={styles.avatarText}>{getInitials(organisationName)}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: COLORS.statBlueBg }]}>
                        <Text style={[styles.statNumber, { color: COLORS.statBlueText }]}>
                            {ngos.length}
                        </Text>
                        <Text style={styles.statLabel}>NGOs Listed</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: COLORS.statGreenBg }]}>
                        <Text style={[styles.statNumber, { color: COLORS.statGreenText }]}>
                            {formatCurrencyShort(sponsorProfile?.fundingBudget)}
                        </Text>
                        <Text style={styles.statLabel}>Your Budget</Text>
                    </View>

                <View style={[styles.statCard, { backgroundColor: COLORS.statYellowBg }]}>
                        <Text style={[styles.statNumber, { color: COLORS.statYellowText }]}>
                            {rankedNgos.filter((ngo) => computeMatch(sponsorProfile || {}, ngo).matchScore >= 60).length}
                        </Text>
                        <Text style={styles.statLabel}>Strong matches</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: COLORS.statPurpleBg }]}>
                        <Text style={[styles.statNumber, { color: COLORS.statPurpleText }]}>
                            {savedIds.length}
                        </Text>
                        <Text style={styles.statLabel}>Saved</Text>
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
                                <Image
                                    source={{ uri: topMatch.profileImageUrl }}
                                    style={styles.orgLogoImage}
                                />
                            ) : (
                                <View style={[styles.orgLogo, { backgroundColor: topMatch.color }]}>
                                    <Text style={styles.orgLogoText}>
                                        {getInitials(topMatch.organisationName)}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.orgNameRow}>
                            <Text style={styles.orgName}>
                                {topMatch.organisationName || "Unnamed NGO"}
                            </Text>
                            {topMatch.profileCompleted && (
                                <Ionicons
                                    name="checkmark-circle"
                                    size={16}
                                    color={COLORS.primary}
                                    style={styles.verifiedIcon}
                                />
                            )}
                        </View>

                        {topMatch.profileCompleted && (
                            <View style={styles.verifiedBadge}>
                                <Text style={styles.verifiedBadgeText}>Verified</Text>
                            </View>
                        )}

                        <View style={styles.locationRow}>
                            <Ionicons
                                name="location-outline"
                                size={14}
                                color={COLORS.textSecondary}
                            />
                            <Text style={styles.locationText}>
                                {topMatch.location || "Location not provided"}
                            </Text>
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

                        <Text style={styles.fundingNeed}>
                            Funding Need: {formatFundingRange(topMatch.fundingRequired)}
                        </Text>

                        <View style={styles.recommendedActions}>
                            <TouchableOpacity
                                style={styles.viewMatchButton}
                                activeOpacity={0.85}
                                onPress={() => goToOpportunity(topMatch)}
                            >
                                <Text style={styles.viewMatchButtonText}>View Match</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.saveButton}
                                activeOpacity={0.7}
                                onPress={() => toggleSaved(topMatch.id)}
                            >
                                <Ionicons
                                    name={savedIds.includes(topMatch.id) ? "heart" : "heart-outline"}
                                    size={20}
                                    color={
                                        savedIds.includes(topMatch.id)
                                            ? COLORS.danger
                                            : COLORS.textSecondary
                                    }
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
                    <Text style={styles.sectionTitle}>More organisations</Text>
                    <TouchableOpacity onPress={goToDiscover} activeOpacity={0.7}>
                        <Text style={styles.viewAll}>See All</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.liveList}>
                    {moreNgos.slice(0, 3).map((ngo) => (
                        <TouchableOpacity key={ngo.id} style={styles.liveNgoCard} onPress={() => goToOpportunity(ngo)} activeOpacity={0.82}>
                            <View style={[styles.liveAvatar, { backgroundColor: ngo.color }]}><Text style={styles.liveAvatarText}>{getInitials(ngo.organisationName)}</Text></View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.liveNgoName} numberOfLines={1}>{ngo.organisationName || "Organisation"}</Text>
                                <Text style={styles.liveNgoMeta} numberOfLines={1}>{ngo.targetCommunity || "Community impact"} · {ngo.location || "Location not provided"}</Text>
                            </View>
                            <Text style={styles.liveScore}>{computeMatch(sponsorProfile || {}, ngo).matchScore}%</Text>
                        </TouchableOpacity>
                    ))}
                    {!loading && moreNgos.length === 0 && <Text style={styles.liveNgoMeta}>More real NGO profiles will appear here as they join.</Text>}
                </View>

                {/* All NGOs */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>All NGOs</Text>
                    <TouchableOpacity onPress={goToDiscover} activeOpacity={0.7}>
                        <Text style={styles.viewAll}>View All</Text>
                    </TouchableOpacity>
                </View>

                {moreNgos.length === 0 && !topMatch ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No NGOs found in the database yet.</Text>
                    </View>
                ) : (
                    <View style={styles.ngoList}>
                        {moreNgos.map((ngo) => (
                            <TouchableOpacity
                                key={ngo.id}
                                style={styles.ngoRow}
                                activeOpacity={0.7}
                                onPress={() => goToOpportunity(ngo)}
                            >
                                {ngo.profileImageUrl ? (
                                    <Image
                                        source={{ uri: ngo.profileImageUrl }}
                                        style={styles.ngoAvatarImage}
                                    />
                                ) : (
                                    <View style={[styles.ngoAvatar, { backgroundColor: ngo.color }]}>
                                        <Text style={styles.ngoAvatarText}>
                                            {getInitials(ngo.organisationName)}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.ngoInfo}>
                                    <View style={styles.ngoNameRow}>
                                        <Text style={styles.ngoName} numberOfLines={1}>
                                            {ngo.organisationName || "Unnamed NGO"}
                                        </Text>
                                        {ngo.profileCompleted && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={14}
                                                color={COLORS.primary}
                                                style={styles.verifiedIcon}
                                            />
                                        )}
                                    </View>
                                    <View style={styles.ngoLocationRow}>
                                        <Ionicons
                                            name="location-outline"
                                            size={12}
                                            color={COLORS.textSecondary}
                                        />
                                        <Text style={styles.ngoLocation}>
                                            {ngo.location || "Not provided"}
                                        </Text>
                                    </View>
                                </View>

                                <Ionicons
                                    name="chevron-forward"
                                    size={18}
                                    color={COLORS.textSecondary}
                                    style={styles.chevron}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    centered: { justifyContent: "center", alignItems: "center" },
    scrollContent: { padding: 20, paddingTop: 10, paddingBottom: 40 },

    header: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    headerText: { flex: 1, paddingRight: 12 },
    greetingSmall: { fontSize: 13, fontWeight: "600", color: COLORS.primary, marginBottom: 4 },
    greetingName: { fontSize: 22, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 4 },
    subtitle: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
    notificationButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    avatarImage: { width: 42, height: 42 },
    avatarText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },

    statsRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
    statCard: {
        flex: 1,
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    statNumber: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
    statLabel: { fontSize: 11, fontWeight: "600", color: COLORS.textSecondary },

    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
    },
    sectionTitle: { fontSize: 17, fontWeight: "700", color: COLORS.textPrimary },
    viewAll: { fontSize: 13, fontWeight: "600", color: COLORS.primary },

    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 30,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 28,
        gap: 8,
    },
    emptyStateText: { fontSize: 13, color: COLORS.textSecondary },

    recommendedCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 18,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    recommendedTopRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    orgLogo: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    orgLogoImage: { width: 48, height: 48, borderRadius: 14 },
    orgLogoText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
    orgNameRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
    orgName: { fontSize: 17, fontWeight: "700", color: COLORS.textPrimary },
    verifiedIcon: { marginLeft: 5 },
    verifiedBadge: {
        alignSelf: "flex-start",
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginBottom: 8,
    },
    verifiedBadgeText: { fontSize: 11, fontWeight: "700", color: COLORS.primary },
    locationRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 4 },
    locationText: { fontSize: 13, color: COLORS.textSecondary },
    tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
    tagPill: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    tagPillText: { fontSize: 11, fontWeight: "600", color: COLORS.textSecondary },
    description: { fontSize: 13, lineHeight: 19, color: COLORS.textSecondary, marginBottom: 12 },
    fundingNeed: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 16 },
    recommendedActions: { flexDirection: "row", alignItems: "center", gap: 10 },
    viewMatchButton: {
        flex: 1,
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 3,
    },
    viewMatchButtonText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
    saveButton: {
        width: 50,
        height: 50,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
    },

    projectsRow: { gap: 14, paddingBottom: 4, marginBottom: 28 },
    projectCard: {
        width: 220,
        backgroundColor: COLORS.surface,
        borderRadius: 18,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    projectImage: { height: 110, alignItems: "center", justifyContent: "center" },
    projectCategoryPill: {
        position: "absolute",
        top: 10,
        left: 10,
        backgroundColor: "rgba(255,255,255,0.92)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    projectCategoryText: { fontSize: 10, fontWeight: "700", color: COLORS.textPrimary },
    projectBody: { padding: 14 },
    projectTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 4, lineHeight: 19 },
    projectOrg: { fontSize: 12, fontWeight: "600", color: COLORS.primary, marginBottom: 10 },
    progressTrack: {
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.background,
        overflow: "hidden",
        marginBottom: 8,
    },
    progressFill: { height: "100%", borderRadius: 3, backgroundColor: COLORS.primary },
    progressLabelsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    progressRaised: { fontSize: 10, fontWeight: "700", color: COLORS.textPrimary },
    progressPercent: { fontSize: 10, color: COLORS.textSecondary },

    activityList: { marginBottom: 28, gap: 10 },
    activityRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    activityRowUnread: { backgroundColor: COLORS.primaryLight, borderColor: "transparent" },
    activityIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    activityContent: { flex: 1, paddingRight: 8 },
    activityText: { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary, lineHeight: 18, marginBottom: 3 },
    activityTime: { fontSize: 11, color: COLORS.textSecondary },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },

    liveList: { marginBottom: 28 },
    liveNgoCard: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 13, marginBottom: 9 },
    liveAvatar: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 12 },
    liveAvatarText: { color: COLORS.white, fontWeight: "800", fontSize: 13 },
    liveNgoName: { color: COLORS.textPrimary, fontWeight: "700", fontSize: 14 },
    liveNgoMeta: { color: COLORS.textSecondary, fontSize: 11, marginTop: 4 },
    liveScore: { color: COLORS.primary, fontWeight: "800", fontSize: 13, marginLeft: 8 },

    ngoList: { gap: 4 },
    ngoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
    ngoAvatar: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    ngoAvatarImage: { width: 44, height: 44, borderRadius: 14, marginRight: 12 },
    ngoAvatarText: { color: COLORS.white, fontSize: 13, fontWeight: "700" },
    ngoInfo: { flex: 1, paddingRight: 8 },
    ngoNameRow: { flexDirection: "row", alignItems: "center", marginBottom: 3 },
    ngoName: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
    ngoLocationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    ngoLocation: { fontSize: 12, color: COLORS.textSecondary },
    chevron: { marginLeft: 2 },
});
