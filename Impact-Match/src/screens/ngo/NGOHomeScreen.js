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
    background: "#F9FAFB",
    surface: "#FFFFFF",
    primary: "#2563EB", // Blue accent
    darkCard: "#1E3A8A", // Dark blue for impact overview
    textPrimary: "#111827",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    white: "#FFFFFF",
};

export default function NGOHomeScreen({ navigation, route }) {
    const { organisationName } = route.params || {};

    // Slice the first 3 sponsors for the "Recommended for You" section
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
                        <Ionicons name="menu-outline" size={26} color={COLORS.textPrimary} />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Dashboard</Text>

                    <TouchableOpacity style={styles.headerIcon}>
                        <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Greeting */}
                <Text style={styles.greeting}>
                    Welcome back, {organisationName || "User"}
                </Text>

                {/* Impact Overview Card */}
                <View style={styles.impactCard}>
                    <Text style={styles.impactTitle}>Your Impact Overview</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>Organisations{"\n"}Partnered</Text>
                        </View>

                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>R0</Text>
                            <Text style={styles.statLabel}>Total{"\n"}Invested</Text>
                        </View>

                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>Active{"\n"}Partnerships</Text>
                        </View>

                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>People{"\n"}Impacted</Text>
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
                            <View style={styles.sponsorLogo}>
                                <Ionicons name="business-outline" size={22} color={COLORS.primary} />
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

                            <View style={styles.matchBadge}>
                                <Text style={styles.matchText}>
                                    {sponsor.matchPercentage || 0}%
                                </Text>
                                <Text style={styles.matchLabel}>Match</Text>
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
        padding: 20,
        paddingTop: 10,
        paddingBottom: 40,
    },

    /* Header */
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    headerIcon: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },

    /* Greeting */
    greeting: {
        fontSize: 22,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 20,
    },

    /* Impact Card */
    impactCard: {
        backgroundColor: COLORS.darkCard,
        borderRadius: 20,
        padding: 20,
        marginBottom: 28,
    },
    impactTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.white,
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    statItem: {
        alignItems: "center",
        flex: 1,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: "800",
        color: COLORS.white,
        marginBottom: 6,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: "500",
        color: "rgba(255, 255, 255, 0.7)",
        textAlign: "center",
        lineHeight: 14,
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
        fontWeight: "700",
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
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    sponsorLogo: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: "rgba(37, 99, 235, 0.08)", // Light blue tint
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    sponsorInfo: {
        flex: 1,
        marginRight: 10,
    },
    sponsorName: {
        fontSize: 15,
        fontWeight: "700",
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
    matchBadge: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(37, 99, 235, 0.08)",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    matchText: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.primary,
    },
    matchLabel: {
        fontSize: 10,
        fontWeight: "600",
        color: COLORS.primary,
        marginTop: 2,
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
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        paddingVertical: 16,
        marginTop: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
    },
    exploreButtonText: {
        fontSize: 15,
        fontWeight: "700",
        color: COLORS.white,
        marginRight: 8,
    },
});