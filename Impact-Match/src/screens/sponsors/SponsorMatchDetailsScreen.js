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

const COLORS = {
    background: "#F9FAFB",
    surface: "#FFFFFF",
    navy: "#0F1B3D",
    primary: "#10B981",
    primaryLight: "rgba(16, 185, 129, 0.10)",
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    border: "#E5E7EB",
    white: "#FFFFFF",
    aiBg: "#EFF6FF",
    aiBorder: "#BFDBFE",
    aiText: "#1D4ED8",
};

const BREAKDOWN_LABELS = [
    { key: "causeAlignment", label: "Cause Alignment" },
    { key: "locationAlignment", label: "Location Alignment" },
    { key: "fundingCompatibility", label: "Funding Compatibility" },
    { key: "beneficiaryAlignment", label: "Beneficiary Alignment" },
    { key: "csrEsgAlignment", label: "CSR / ESG Alignment" },
];

const SPONSOR = {
    name: "GreenFuture Foundation",
    shortName: "GF",
    color: COLORS.primary,
};

export default function SponsorMatchDetailsScreen({ navigation, route }) {
    const { match } = route.params || {};

    if (!match) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <Text style={styles.emptyText}>No match data was provided.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <View style={styles.topBar}>
                <TouchableOpacity
                    style={styles.backButton}
                    activeOpacity={0.7}
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>Match Details</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.comparisonCard}>
                    <View style={styles.comparisonSide}>
                        <View style={[styles.compareAvatar, { backgroundColor: SPONSOR.color }]}>
                            <Text style={styles.compareAvatarText}>{SPONSOR.shortName}</Text>
                        </View>
                        <Text style={styles.compareName} numberOfLines={2}>
                            {SPONSOR.name}
                        </Text>
                        <Text style={styles.compareLabel}>Sponsor</Text>
                    </View>

                    <View style={styles.matchCircleWrapper}>
                        <View style={styles.matchCircle}>
                            <Text style={styles.matchCirclePercent}>{match.matchScore}%</Text>
                            <Text style={styles.matchCircleLabel}>MATCH</Text>
                        </View>
                    </View>

                    <View style={styles.comparisonSide}>
                        <View style={[styles.compareAvatar, { backgroundColor: match.color }]}>
                            <Text style={styles.compareAvatarText}>{match.shortName}</Text>
                        </View>
                        <Text style={styles.compareName} numberOfLines={2}>
                            {match.name}
                        </Text>
                        <Text style={styles.compareLabel}>NGO</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Match Breakdown</Text>
                <View style={styles.breakdownCard}>
                    {BREAKDOWN_LABELS.map(({ key, label }) => {
                        const value = match.breakdown?.[key] ?? 0;
                        return (
                            <View key={key} style={styles.breakdownRow}>
                                <View style={styles.breakdownLabelRow}>
                                    <Text style={styles.breakdownLabel}>{label}</Text>
                                    <Text style={styles.breakdownValue}>{value}%</Text>
                                </View>
                                <View style={styles.progressTrack}>
                                    <View
                                        style={[styles.progressFill, { width: `${value}%` }]}
                                    />
                                </View>
                            </View>
                        );
                    })}

                    {match.verified && (
                        <View style={styles.verificationBanner}>
                            <Ionicons
                                name="checkmark-circle"
                                size={18}
                                color={COLORS.primary}
                            />
                            <Text style={styles.verificationBannerText}>
                                Organisation Verification: Confirmed
                            </Text>
                        </View>
                    )}
                </View>

                <Text style={styles.sectionTitle}>Why You Match</Text>
                <View style={styles.whyCard}>
                    {(match.whyYouMatch || []).map((reason, index) => (
                        <View key={index} style={styles.whyRow}>
                            <Ionicons
                                name="checkmark-circle"
                                size={18}
                                color={COLORS.primary}
                                style={styles.whyIcon}
                            />
                            <Text style={styles.whyText}>{reason}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.aiCard}>
                    <View style={styles.aiTitleRow}>
                        <Ionicons name="hardware-chip-outline" size={18} color={COLORS.aiText} />
                        <Text style={styles.aiTitle}>AI Recommendation Insight</Text>
                    </View>
                    <Text style={styles.aiText}>
                        ImpactMatch recommends this partnership based on your profile
                        information and selected matching preferences. AI assists with
                        recommendations — final partnership decisions are made by your
                        organisation.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.primaryButton}
                    activeOpacity={0.85}
                    onPress={() => {
                        // TODO: navigate into the Messages tab with this org pre-selected
                    }}
                >
                    <Text style={styles.primaryButtonText}>Start Conversation</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    activeOpacity={0.85}
                    onPress={() => {
                        // TODO: navigate to the full org profile (SponsorOpportunityDetails)
                    }}
                >
                    <Text style={styles.secondaryButtonText}>View Organisation</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    emptyText: {
        textAlign: "center",
        marginTop: 40,
        color: COLORS.textSecondary,
    },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 8,
    },
    backButton: {
        width: 28,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
    },
    topBarTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    comparisonCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 20,
        marginBottom: 24,
    },
    comparisonSide: {
        flex: 1,
        alignItems: "center",
    },
    compareAvatar: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    compareAvatarText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "700",
    },
    compareName: {
        fontSize: 12,
        fontWeight: "700",
        color: COLORS.textPrimary,
        textAlign: "center",
        marginBottom: 2,
    },
    compareLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
    },
    matchCircleWrapper: {
        paddingHorizontal: 8,
    },
    matchCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.primaryLight,
        borderWidth: 2.5,
        borderColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    matchCirclePercent: {
        color: COLORS.primary,
        fontSize: 17,
        fontWeight: "800",
    },
    matchCircleLabel: {
        color: COLORS.primary,
        fontSize: 8,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    breakdownCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 18,
        marginBottom: 24,
    },
    breakdownRow: {
        marginBottom: 16,
    },
    breakdownLabelRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    breakdownLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.textPrimary,
    },
    breakdownValue: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.primary,
    },
    progressTrack: {
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.background,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 4,
        backgroundColor: COLORS.primary,
    },
    verificationBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.primaryLight,
        borderRadius: 12,
        padding: 12,
        gap: 8,
        marginTop: 4,
    },
    verificationBannerText: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.primary,
    },
    whyCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 18,
        marginBottom: 24,
        gap: 14,
    },
    whyRow: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    whyIcon: {
        marginRight: 10,
        marginTop: 1,
    },
    whyText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 19,
        color: COLORS.textPrimary,
    },
    aiCard: {
        backgroundColor: COLORS.aiBg,
        borderWidth: 1,
        borderColor: COLORS.aiBorder,
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
    },
    aiTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    aiTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.aiText,
    },
    aiText: {
        fontSize: 12,
        lineHeight: 18,
        color: COLORS.aiText,
    },
    footer: {
        padding: 20,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.surface,
        gap: 10,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: "center",
    },
    primaryButtonText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: "700",
    },
    secondaryButton: {
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: "center",
    },
    secondaryButtonText: {
        color: COLORS.textPrimary,
        fontSize: 15,
        fontWeight: "700",
    },
});