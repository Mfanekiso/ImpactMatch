import React, { useState, useMemo, useEffect, useCallback } from "react";
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

import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

import { auth, db } from "../../../Backend/firebaseConfig";
import { computeMatch } from "../../utils/matchScore";
import { loadSponsorInterests, getMatchStatus } from "../../utils/interests";
import { readLocalCache, writeLocalCache } from "../../utils/profileCache";

// ─── LUXURY COLOR PALETTE (Sponsor Twist) ──────────────────────────────
const COLORS = {
    background: "#F8F6EE",       // Cream base
    surface: "#FFFFFF",          // Clean white
    primary: "#D9C982",          // Soft Luxury Gold
    primarySoft: "rgba(217, 201, 130, 0.2)",
    emerald: "#059669",          // Vibrant Emerald
    emeraldSoft: "rgba(5, 150, 105, 0.1)",
    buttonDark: "#013e37",       // Deep luxury green
    buttonDarkSoft: "rgba(1, 62, 55, 0.08)",
    textPrimary: "#433327",      // Warm Bronze
    textSecondary: "#8C7A6B",    // Muted taupe
    border: "#E8DFD5",
    danger: "#DC2626",           // Elegant red
    white: "#FFFFFF",
};

// Premium unified avatar colors
const AVATAR_COLORS = [
    COLORS.buttonDark, 
    COLORS.emerald, 
    "#607A70", 
    "#8C7A6B",
    "#9A8738"
];

const softShadow = {
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
};

const FILTERS = [
    { label: "Recommended", value: "recommended" },
    { label: "Saved", value: "saved" },
    { label: "Interested", value: "interested" },
    { label: "Mutual", value: "mutual" },
];

const STATUS_TAG_STYLES = {
    // Matching the new luxury palette
    recommended: { bg: COLORS.primarySoft, text: "#9A8738", label: "Recommended" },
    interested: { bg: COLORS.emeraldSoft, text: COLORS.emerald, label: "Interested" },
    mutual: { bg: COLORS.buttonDarkSoft, text: COLORS.buttonDark, label: "Mutual" },
};

function getInitials(name) {
    if (!name) return "?";
    return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function MatchCard({ match, onPress }) {
    const statusStyle = STATUS_TAG_STYLES[match.status] || STATUS_TAG_STYLES.recommended;

    return (
        <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
            <View style={[styles.avatar, { backgroundColor: match.color }]}>
                <Text style={styles.avatarText}>{match.shortName}</Text>
            </View>

            <View style={styles.cardContent}>
                <View style={styles.nameRow}>
                    <Text style={styles.orgName} numberOfLines={1}>
                        {match.name}
                    </Text>
                    {match.verified && (
                        <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={COLORS.emerald}
                            style={styles.verifiedIcon}
                        />
                    )}
                </View>

                <Text style={styles.subtitle} numberOfLines={1}>
                    {match.sector} · {match.location}
                </Text>

                <View style={styles.badgeRow}>
                    <View style={styles.matchPill}>
                        <View style={styles.matchDot} />
                        <Text style={styles.matchPillText}>{match.matchScore}%</Text>
                    </View>

                    {match.saved && (
                        <Ionicons name="heart" size={16} color={COLORS.danger} />
                    )}

                    <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusPillText, { color: statusStyle.text }]}>
                            {statusStyle.label}
                        </Text>
                    </View>
                </View>
            </View>

            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
    );
}

export default function SponsorMatchesScreen({ navigation }) {
    const [fontsLoaded] = useFonts({
        Manrope_400Regular,
        Manrope_500Medium,
        Manrope_600SemiBold,
        Manrope_700Bold,
    });

    const [activeFilter, setActiveFilter] = useState("recommended");
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadMatches = useCallback(async () => {
        const uid = auth.currentUser?.uid;
        try {
            let sponsorProfile = {};
            if (uid) {
                const sponsorSnap = await getDoc(doc(db, "users", uid));
                if (sponsorSnap.exists()) sponsorProfile = sponsorSnap.data();
            }

            let interests = {};
            try {
                interests = await loadSponsorInterests(uid);
            } catch (error) {
                console.log("Could not load interests:", error?.message);
            }

            const snapshot = await getDocs(
                query(collection(db, "users"), where("role", "==", "ngo"))
            );

            const results = snapshot.docs
                .filter((docSnap) => docSnap.data().profileCompleted)
                .map((docSnap, index) => {
                    const data = docSnap.data();
                    const { matchScore, breakdown, whyYouMatch } = computeMatch(
                        sponsorProfile,
                        data
                    );

                    return {
                        id: docSnap.id,
                        name: data.organisationName || "Unnamed NGO",
                        shortName: getInitials(data.organisationName),
                        color: AVATAR_COLORS[index % AVATAR_COLORS.length],
                        verified: !!data.profileCompleted,
                        sector: data.targetCommunity || "NGO",
                        location: data.location || "Location not provided",
                        matchScore,
                        status: getMatchStatus(interests[docSnap.id]),
                        saved: !!interests[docSnap.id]?.saved,
                        breakdown,
                        whyYouMatch,
                    };
                })
                .sort((a, b) => b.matchScore - a.matchScore);

            setMatches(results);
            if (uid) await writeLocalCache(`sponsor-matches:${uid}`, results);
        } catch (error) {
            console.log("Error loading matches:", error?.message);
            const cached = uid ? await readLocalCache(`sponsor-matches:${uid}`) : null;
            if (cached) setMatches(cached);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMatches();
        const unsubscribe = navigation.addListener("focus", loadMatches);
        return unsubscribe;
    }, [navigation, loadMatches]);

    const filteredMatches = useMemo(
        () =>
            matches.filter((m) =>
                activeFilter === "saved" ? m.saved : m.status === activeFilter
            ),
        [matches, activeFilter]
    );

    const goToMatchDetails = (match) => {
        navigation.navigate("SponsorMatchDetails", { match });
    };

    if (!fontsLoaded) return null;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>My Matches</Text>
            </View>

            <View style={styles.filterWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterRow}
                >
                    {FILTERS.map((filter) => {
                        const isActive = activeFilter === filter.value;
                        return (
                            <TouchableOpacity
                                key={filter.value}
                                style={[styles.filterPill, isActive && styles.filterPillActive]}
                                activeOpacity={0.8}
                                onPress={() => setActiveFilter(filter.value)}
                            >
                                <Text
                                    style={[
                                        styles.filterPillText,
                                        isActive && styles.filterPillTextActive,
                                    ]}
                                >
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <ScrollView
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <ActivityIndicator
                        size="large"
                        color={COLORS.buttonDark}
                        style={{ marginTop: 40 }}
                    />
                ) : filteredMatches.length > 0 ? (
                    filteredMatches.map((match) => (
                        <MatchCard
                            key={match.id}
                            match={match}
                            onPress={() => goToMatchDetails(match)}
                        />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="search-outline" size={32} color={COLORS.textSecondary} />
                        <Text style={styles.emptyText}>
                            No {activeFilter} matches yet — check back soon.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    headerContainer: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 10,
        backgroundColor: COLORS.background,
    },
    headerTitle: {
        fontFamily: "Manrope_700Bold",
        fontSize: 28,
        color: COLORS.textPrimary,
        letterSpacing: -0.5,
    },
    filterWrapper: {
        marginBottom: 16,
    },
    filterRow: {
        paddingHorizontal: 24,
        gap: 10,
        paddingBottom: 4,
    },
    filterPill: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24, // Pill shape
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        ...softShadow,
    },
    filterPillActive: {
        backgroundColor: COLORS.buttonDark,
        borderColor: COLORS.buttonDark,
    },
    filterPillText: {
        fontFamily: "Manrope_600SemiBold",
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    filterPillTextActive: {
        fontFamily: "Manrope_700Bold",
        color: COLORS.white,
    },
    listContent: {
        paddingHorizontal: 24,
        paddingBottom: 112,
        gap: 16,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: {
        fontFamily: "Manrope_500Medium",
        textAlign: "center",
        color: COLORS.textSecondary,
        fontSize: 15,
    },
    
    /* Card Styles */
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...softShadow,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    avatarText: {
        fontFamily: "Manrope_700Bold",
        color: COLORS.white,
        fontSize: 16,
    },
    cardContent: {
        flex: 1,
        paddingRight: 8,
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    orgName: {
        fontFamily: "Manrope_700Bold",
        fontSize: 17,
        color: COLORS.textPrimary,
        flexShrink: 1,
    },
    verifiedIcon: {
        marginLeft: 6,
    },
    subtitle: {
        fontFamily: "Manrope_500Medium",
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 10,
    },
    badgeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    matchPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.buttonDarkSoft,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14,
        gap: 6,
    },
    matchDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.buttonDark,
    },
    matchPillText: {
        fontFamily: "Manrope_700Bold",
        fontSize: 12,
        color: COLORS.buttonDark,
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14,
    },
    statusPillText: {
        fontFamily: "Manrope_700Bold",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
});