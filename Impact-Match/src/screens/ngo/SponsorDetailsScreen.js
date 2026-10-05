import React from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    SafeAreaView,
    StatusBar,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

// ─── LUXURY COLOR PALETTE ───────────────────────────────────────────────
const COLORS = {
    background: "#F8F6EE",       // Cream base
    surface: "#FFFFFF",          // Clean white
    primary: "#D9C982",          // Soft Luxury Gold
    primarySoft: "rgba(217, 201, 130, 0.15)",
    emerald: "#059669",          // Vibrant Emerald
    emeraldSoft: "rgba(5, 150, 105, 0.08)",
    textPrimary: "#433327",      // Warm Bronze
    textSecondary: "#8C7A6B",    // Muted taupe
    border: "#E8DFD5",
    white: "#FFFFFF",
};

// Subtle luxury shadow
const softShadow = {
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
};

export default function SponsorDetailsScreen({ route, navigation }) {
    const { sponsor } = route.params || {};

    const handleShortlist = () => {
        Alert.alert(
            "Sponsor Shortlisted",
            `${sponsor?.name} has been added to your shortlist.`
        );
    };

    const handleInterest = () => {
        Alert.alert(
            "Interest Sent",
            `Your interest has been sent to ${sponsor?.name}.`
        );
    };

    // Safely fallback if data is missing
    if (!sponsor) return null;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Details</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* ─── Hero Section ─── */}
                <View style={styles.heroSection}>
                    <View style={styles.heroHeader}>
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="business" size={32} color={COLORS.primary} />
                        </View>
                        <View style={styles.typeBadge}>
                            <Text style={styles.typeText}>{sponsor.type || "General"}</Text>
                        </View>
                    </View>
                    <Text style={styles.name}>{sponsor.name}</Text>
                </View>

                {/* ─── Match Score Card ─── */}
                <View style={styles.matchCard}>
                    <View style={styles.matchBadge}>
                        <Text style={styles.matchScore}>{sponsor.matchScore || 0}%</Text>
                    </View>
                    <View style={styles.matchInfo}>
                        <Text style={styles.matchTitle}>Match Score</Text>
                        <Text style={styles.matchSubtitle}>
                            Based on your organization's needs and their preferred causes.
                        </Text>
                    </View>
                </View>

                {/* ─── Overview Details ─── */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Overview</Text>
                    
                    <View style={styles.detailRow}>
                        <View style={styles.detailIconWrap}>
                            <Ionicons name="location" size={18} color={COLORS.primary} />
                        </View>
                        <Text style={styles.detailText}>{sponsor.location || "Not specified"}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <View style={styles.detailIconWrap}>
                            <Ionicons name="wallet" size={18} color={COLORS.primary} />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>Funding Range</Text>
                            <Text style={styles.detailText}>{sponsor.budget || "Not disclosed"}</Text>
                        </View>
                    </View>
                </View>

                {/* ─── About Section ─── */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>About {sponsor.name}</Text>
                    <Text style={styles.description}>
                        {sponsor.description || "No description provided."}
                    </Text>
                </View>

                {/* ─── Preferred Causes ─── */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Preferred Causes</Text>
                    <View style={styles.causesContainer}>
                        {sponsor.causes?.map((cause, index) => (
                            <View key={index} style={styles.causeTag}>
                                <Text style={styles.causeText}>{cause}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ─── Action Buttons ─── */}
                <View style={styles.actionContainer}>
                    <TouchableOpacity
                        style={styles.interestButton}
                        activeOpacity={0.85}
                        onPress={handleInterest}
                    >
                        <Text style={styles.interestButtonText}>Express Interest</Text>
                        <Ionicons name="send" size={18} color={COLORS.white} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.shortlistButton}
                        activeOpacity={0.85}
                        onPress={handleShortlist}
                    >
                        <Ionicons name="heart-outline" size={20} color={COLORS.textPrimary} style={styles.shortlistIcon} />
                        <Text style={styles.shortlistButtonText}>Save to Shortlist</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
    },
    backButton: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 22,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.textPrimary,
        letterSpacing: 0.5,
    },
    headerSpacer: {
        width: 44, // Matches back button to center the title perfectly
    },
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 60,
    },

    /* Hero Section */
    heroSection: {
        marginTop: 10,
        marginBottom: 24,
    },
    heroHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    avatarPlaceholder: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: COLORS.primarySoft,
        alignItems: "center",
        justifyContent: "center",
    },
    typeBadge: {
        backgroundColor: COLORS.emeraldSoft,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    typeText: {
        color: COLORS.emerald,
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    name: {
        fontSize: 32,
        fontWeight: "700",
        color: COLORS.textPrimary,
        letterSpacing: -0.5,
        lineHeight: 38,
    },

    /* Match Card */
    matchCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...softShadow,
    },
    matchBadge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: COLORS.emerald,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.emeraldSoft,
        marginRight: 16,
    },
    matchScore: {
        fontSize: 18,
        fontWeight: "800",
        color: COLORS.textPrimary,
    },
    matchInfo: {
        flex: 1,
    },
    matchTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    matchSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },

    /* General Cards */
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...softShadow,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 16,
    },
    description: {
        fontSize: 15,
        lineHeight: 24,
        color: COLORS.textSecondary,
    },
    
    /* Overview Details */
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    detailIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.primarySoft,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    detailLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    detailText: {
        fontSize: 15,
        fontWeight: "500",
        color: COLORS.textPrimary,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 16,
        marginLeft: 56, // aligns with text
    },

    /* Causes Tags */
    causesContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    causeTag: {
        backgroundColor: COLORS.emeraldSoft,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    causeText: {
        color: COLORS.emerald,
        fontSize: 13,
        fontWeight: "700",
        letterSpacing: 0.3,
    },

    /* Buttons */
    actionContainer: {
        marginTop: 10,
        gap: 12,
    },
    interestButton: {
        flexDirection: "row",
        backgroundColor: COLORS.emerald,
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: COLORS.emerald,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    interestButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "700",
        marginRight: 8,
        letterSpacing: 0.5,
    },
    shortlistButton: {
        flexDirection: "row",
        backgroundColor: COLORS.surface,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    shortlistIcon: {
        marginRight: 8,
    },
    shortlistButtonText: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: "600",
    },
});