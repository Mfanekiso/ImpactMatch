import React, { useState, useMemo } from "react";
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

import matches from "../../data/matches";

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
};

const FILTERS = [
    { label: "Recommended", value: "recommended" },
    { label: "Interested", value: "interested" },
    { label: "Mutual", value: "mutual" },
];

const STATUS_TAG_STYLES = {
    recommended: { bg: "#DBEAFE", text: "#1D4ED8", label: "Recommended" },
    interested: { bg: "#EDE9FE", text: "#6D28D9", label: "Interested" },
    mutual: { bg: "#DCFCE7", text: "#15803D", label: "Mutual" },
};

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
                            size={15}
                            color={COLORS.primary}
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
    const [activeFilter, setActiveFilter] = useState("recommended");

    const filteredMatches = useMemo(
        () => matches.filter((m) => m.status === activeFilter),
        [activeFilter]
    );

    const goToMatchDetails = (match) => {
        navigation.navigate("SponsorMatchDetails", { match });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Matches</Text>
            </View>

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

            <ScrollView
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            >
                {filteredMatches.length > 0 ? (
                    filteredMatches.map((match) => (
                        <MatchCard
                            key={match.id}
                            match={match}
                            onPress={() => goToMatchDetails(match)}
                        />
                    ))
                ) : (
                    <Text style={styles.emptyText}>
                        No {activeFilter} matches yet — check back soon.
                    </Text>
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
    header: {
        alignItems: "center",
        paddingTop: 10,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: COLORS.textPrimary,
    },
    filterRow: {
        paddingHorizontal: 20,
        gap: 10,
        paddingBottom: 16,
    },
    filterPill: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    filterPillActive: {
        backgroundColor: COLORS.navy,
        borderColor: COLORS.navy,
    },
    filterPillText: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.textPrimary,
    },
    filterPillTextActive: {
        color: COLORS.white,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 12,
    },
    emptyText: {
        textAlign: "center",
        color: COLORS.textSecondary,
        marginTop: 40,
        fontSize: 14,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    avatarText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: "700",
    },
    cardContent: {
        flex: 1,
        paddingRight: 8,
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 3,
    },
    orgName: {
        fontSize: 15,
        fontWeight: "700",
        color: COLORS.textPrimary,
        flexShrink: 1,
    },
    verifiedIcon: {
        marginLeft: 5,
    },
    subtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    badgeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    matchPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 4,
    },
    matchDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: COLORS.primary,
    },
    matchPillText: {
        fontSize: 11,
        fontWeight: "700",
        color: COLORS.primary,
    },
    statusPill: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusPillText: {
        fontSize: 11,
        fontWeight: "700",
    },
});