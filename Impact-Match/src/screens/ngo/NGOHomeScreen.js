import React from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import sponsors from "../../data/sponsors";

const COLORS = {
    background: "#F8F6EE", 
    surface: "#FFFFFF",
    primary: "#D9C982", // Soft Luxury Gold
    emerald: "#059669", 
    textPrimary: "#433327", 
    textSecondary: "#8C7A6B", 
    border: "#E8DFD5",
    white: "#FFFFFF",
    
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
    // Added 'user' here to prevent ReferenceError from the new hero block
    const { organisationName, user } = route.params || {};
    const recommendedSponsors = sponsors ? sponsors.slice(0, 3) : [];

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
{/* 
                    <TouchableOpacity style={styles.headerIcon}>
                        <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity> */}

                    <TouchableOpacity style={styles.bellButton} activeOpacity={0.7}>
                        <Ionicons
                            name="notifications-outline"
                            size={20}
                            color={COLORS.ivory}
                        />
                        <View style={styles.bellDot} />
                    </TouchableOpacity>
                </View>

                {/* ─── Hero Greeting ─── */}
                <View style={styles.heroBlock}>
                    <Text style={styles.heroEyebrow}>Hello</Text>
                    <Text style={styles.heroTitle}>
                        {organisationName || user?.organisationName || "Partner"}
                    </Text>
                    <Text style={styles.heroSubtitle}>
                        Here's a snapshot of your giving journey.
                    </Text>
                </View>

                {/* ─── Impact Overview (Gold Card) ─── */}
                <View style={styles.impactCard}>
                    {/* Decorative corner glow */}
                    <View style={styles.impactGlow} />

                    <View style={styles.impactHeader}>
                        <Text style={styles.impactLabel}>IMPACT OVERVIEW</Text>
                        <View style={styles.impactPill}>
                            <Ionicons
                                name="trending-up-outline"
                                size={12}
                                color={COLORS.goldCardText}
                            />
                            <Text style={styles.impactPillText}>All time</Text>
                        </View>
                    </View>

                    {/* Featured stat */}
                    <View style={styles.featuredStat}>
                        <Text style={styles.featuredValue}>R0</Text>
                        <Text style={styles.featuredLabel}>
                            Total invested across all partnerships
                        </Text>
                    </View>

                    {/* Divider */}
                    <View style={styles.horizontalDivider} />

                    {/* Secondary stats */}
                    <View style={styles.secondaryStats}>
                        <View style={styles.secondaryStat}>
                            <Text style={styles.secondaryValue}>0</Text>
                            <Text style={styles.secondaryLabel}>
                                Org.{"\n"}Partnered
                            </Text>
                        </View>

                        <View style={styles.verticalDivider} />

                        <View style={styles.secondaryStat}>
                            <Text style={styles.secondaryValue}>0</Text>
                            <Text style={styles.secondaryLabel}>
                                Active{"\n"}Partnerships
                            </Text>
                        </View>

                        <View style={styles.verticalDivider} />

                        <View style={styles.secondaryStat}>
                            <Text style={styles.secondaryValue}>0</Text>
                            <Text style={styles.secondaryLabel}>
                                People{"\n"}Impacted
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Recommended Section Header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recommended for You</Text>
                    <TouchableOpacity onPress={() => navigation.navigate("SponsorSearch")}>
                        <Text style={styles.seeAll}>See all</Text>
                    </TouchableOpacity>
                </View>

                {/* Recommendations List */}
                {recommendedSponsors.length > 0 ? (
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
        paddingBottom: 40,
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
    headerTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    logoIcon: {
        marginRight: 6,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: "800",
        letterSpacing: 1.2,
        color: COLORS.primary,
    },

    /* ─── Hero Greeting ─── */
    heroBlock: {
        marginBottom: 28,
        paddingHorizontal: 4,
    },
    heroEyebrow: {
        fontSize: 21,
        fontWeight: "700",
        color: COLORS.primary,
        letterSpacing: 2,
        marginBottom: 2,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: "400",
        color: COLORS.textPrimary,
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    heroSubtitle: {
        fontSize: 14,
        fontWeight: "400",
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
        fontSize: 10,
        fontWeight: "700",
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
        color: COLORS.goldCardText,
        fontSize: 10,
        fontWeight: "600",
        marginLeft: 4,
        letterSpacing: 0.4,
    },

    /* ─── Featured stat ─── */
    featuredStat: {
        marginBottom: 22,
    },
    featuredValue: {
        fontSize: 40,
        fontWeight: "300",
        color: COLORS.goldCardText,
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    featuredLabel: {
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
        fontSize: 20,
        fontWeight: "500",
        color: COLORS.goldCardText,
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    secondaryLabel: {
        fontSize: 9,
        fontWeight: "600",
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
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.textPrimary,
    },
    seeAll: {
        fontSize: 14,
        fontWeight: "600",
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
        fontSize: 14,
        fontWeight: "800",
        color: COLORS.textPrimary,
    },
    matchLabel: {
        fontSize: 9,
        fontWeight: "600",
        color: COLORS.textSecondary,
        textTransform: "uppercase",
    },
    sponsorInfo: {
        flex: 1,
        marginRight: 10,
    },
    sponsorName: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    sponsorTags: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    sponsorLocation: {
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
        fontSize: 15,
        fontWeight: "600",
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
    bellDot: {
        position: "absolute",
        top: 10,
        right: 11,
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: COLORS.coral,
        borderWidth: 1.5,
        borderColor: COLORS.surface,
    },
    
});