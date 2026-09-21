import React, { useState } from "react";
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

import opportunities from "../../data/opportunities";
import projects from "../../data/projects";
import {
    formatCurrency,
    formatCurrencyShort,
    formatFundingRange,
} from "../../utils/formatCurrency";

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
    // Stat card tints
    statBlueBg: "#EEF2FF",
    statBlueText: "#4338CA",
    statGreenBg: "#DCFCE7",
    statGreenText: "#15803D",
    statYellowBg: "#FEF9C3",
    statYellowText: "#B45309",
    statPurpleBg: "#F3E8FF",
    statPurpleText: "#7E22CE",
};

// Placeholder dashboard data — swap for real API data once available.
const stats = {
    partnerships: 6,
    fundingDeployed: 4200000,
    activeProjects: 9,
    peopleReached: "94k",
};

const recentActivity = [
    {
        id: "a1",
        icon: "locate-outline",
        iconBg: "#FCE7F3",
        iconColor: "#DB2777",
        text: "Education For All is a 92% match",
        time: "2 min ago",
        unread: true,
    },
    {
        id: "a2",
        icon: "heart-outline",
        iconBg: COLORS.primaryLight,
        iconColor: COLORS.primary,
        text: "GreenRoots Africa expressed interest in your organisation",
        time: "1 hour ago",
        unread: true,
    },
    {
        id: "a3",
        icon: "chatbubble-outline",
        iconBg: "#F1F5F9",
        iconColor: COLORS.textSecondary,
        text: "New message from Education For All",
        time: "3 hours ago",
        unread: false,
    },
    {
        id: "a4",
        icon: "trending-up-outline",
        iconBg: "#FFEDD5",
        iconColor: "#C2410C",
        text: "Digital Learning Centre reached 60% funding",
        time: "Yesterday",
        unread: false,
    },
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

export default function SponsorHomeScreen({ navigation, route }) {
    const { organisationName = "GreenFuture Foundation" } = route?.params || {};
    const [savedIds, setSavedIds] = useState([]);

    const topMatch = opportunities[0];
    const moreRecommended = opportunities.slice(1);

    const toggleSaved = (id) => {
        setSavedIds((prev) =>
            prev.includes(id) ? prev.filter((savedId) => savedId !== id) : [...prev, id]
        );
    };

    const goToDiscover = () => navigation.navigate("Discover");

    const goToOpportunity = (opportunity) => {
        navigation.navigate("SponsorOpportunityDetails", { opportunity });
    };

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
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationBadgeText}>3</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.avatar}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate("Profile")}
                        >
                            <Text style={styles.avatarText}>{getInitials(organisationName)}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: COLORS.statBlueBg }]}>
                        <Text style={[styles.statNumber, { color: COLORS.statBlueText }]}>
                            {stats.partnerships}
                        </Text>
                        <Text style={styles.statLabel}>Partnerships</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: COLORS.statGreenBg }]}>
                        <Text style={[styles.statNumber, { color: COLORS.statGreenText }]}>
                            {formatCurrencyShort(stats.fundingDeployed)}
                        </Text>
                        <Text style={styles.statLabel}>Funding</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: COLORS.statYellowBg }]}>
                        <Text style={[styles.statNumber, { color: COLORS.statYellowText }]}>
                            {stats.activeProjects}
                        </Text>
                        <Text style={styles.statLabel}>Projects</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: COLORS.statPurpleBg }]}>
                        <Text style={[styles.statNumber, { color: COLORS.statPurpleText }]}>
                            {stats.peopleReached}
                        </Text>
                        <Text style={styles.statLabel}>Reached</Text>
                    </View>
                </View>

                {/* Recommended For You */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recommended For You</Text>
                    <TouchableOpacity onPress={goToDiscover} activeOpacity={0.7}>
                        <Text style={styles.viewAll}>View All</Text>
                    </TouchableOpacity>
                </View>

                {topMatch && (
                    <TouchableOpacity
                        style={styles.recommendedCard}
                        activeOpacity={0.85}
                        onPress={() => goToOpportunity(topMatch)}
                    >
                        <View style={styles.recommendedTopRow}>
                            <View
                                style={[
                                    styles.orgLogo,
                                    { backgroundColor: topMatch.color },
                                ]}
                            >
                                <Text style={styles.orgLogoText}>{topMatch.shortName}</Text>
                            </View>

                            <View style={styles.matchPill}>
                                <View style={styles.matchDot} />
                                <Text style={styles.matchPillText}>{topMatch.matchScore}%</Text>
                            </View>
                        </View>

                        <View style={styles.orgNameRow}>
                            <Text style={styles.orgName}>{topMatch.name}</Text>
                            {topMatch.verified && (
                                <Ionicons
                                    name="checkmark-circle"
                                    size={16}
                                    color={COLORS.primary}
                                    style={styles.verifiedIcon}
                                />
                            )}
                        </View>

                        {topMatch.verified && (
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
                            <Text style={styles.locationText}>{topMatch.location}</Text>
                        </View>

                        <View style={styles.tagsRow}>
                            {topMatch.tags.map((tag) => (
                                <View key={tag} style={styles.tagPill}>
                                    <Text style={styles.tagPillText}>{tag}</Text>
                                </View>
                            ))}
                        </View>

                        <Text style={styles.description} numberOfLines={2}>
                            {topMatch.description}
                        </Text>

                        <Text style={styles.fundingNeed}>
                            Funding Need: {formatFundingRange(
                                topMatch.fundingNeedMin,
                                topMatch.fundingNeedMax
                            )}
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
                                    name={
                                        savedIds.includes(topMatch.id)
                                            ? "heart"
                                            : "heart-outline"
                                    }
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
                )}

                {/* Projects You May Like */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Projects You May Like</Text>
                    <TouchableOpacity onPress={goToDiscover} activeOpacity={0.7}>
                        <Text style={styles.viewAll}>See All</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.projectsRow}
                >
                    {projects.map((project) => {
                        const percentFunded = Math.min(
                            100,
                            Math.round((project.raised / project.goal) * 100)
                        );

                        return (
                            <TouchableOpacity
                                key={project.id}
                                style={styles.projectCard}
                                activeOpacity={0.85}
                                onPress={() => goToDiscover()}
                            >
                                <View
                                    style={[
                                        styles.projectImage,
                                        { backgroundColor: project.color },
                                    ]}
                                >
                                    <Ionicons
                                        name={project.icon}
                                        size={30}
                                        color="rgba(255,255,255,0.85)"
                                    />

                                    <View style={styles.projectCategoryPill}>
                                        <Text style={styles.projectCategoryText}>
                                            {project.category}
                                        </Text>
                                    </View>

                                    <View style={styles.projectMatchPill}>
                                        <View style={styles.matchDot} />
                                        <Text style={styles.projectMatchText}>
                                            {project.matchScore}%
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.projectBody}>
                                    <Text style={styles.projectTitle} numberOfLines={2}>
                                        {project.title}
                                    </Text>
                                    <Text style={styles.projectOrg} numberOfLines={1}>
                                        {project.orgName}
                                    </Text>

                                    <View style={styles.progressTrack}>
                                        <View
                                            style={[
                                                styles.progressFill,
                                                { width: `${percentFunded}%` },
                                            ]}
                                        />
                                    </View>

                                    <View style={styles.progressLabelsRow}>
                                        <Text style={styles.progressRaised}>
                                            {formatCurrency(project.raised)} raised
                                        </Text>
                                        <Text style={styles.progressPercent}>
                                            {percentFunded}% of {formatCurrency(project.goal)}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Recent Activity */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                </View>

                <View style={styles.activityList}>
                    {recentActivity.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.activityRow,
                                item.unread && styles.activityRowUnread,
                            ]}
                            activeOpacity={0.7}
                        >
                            <View
                                style={[
                                    styles.activityIcon,
                                    { backgroundColor: item.iconBg },
                                ]}
                            >
                                <Ionicons name={item.icon} size={18} color={item.iconColor} />
                            </View>

                            <View style={styles.activityContent}>
                                <Text style={styles.activityText}>{item.text}</Text>
                                <Text style={styles.activityTime}>{item.time}</Text>
                            </View>

                            {item.unread && <View style={styles.unreadDot} />}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* All Recommended NGOs */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>All Recommended NGOs</Text>
                    <TouchableOpacity onPress={goToDiscover} activeOpacity={0.7}>
                        <Text style={styles.viewAll}>View All</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.ngoList}>
                    {moreRecommended.map((org) => (
                        <TouchableOpacity
                            key={org.id}
                            style={styles.ngoRow}
                            activeOpacity={0.7}
                            onPress={() => goToOpportunity(org)}
                        >
                            <View style={[styles.ngoAvatar, { backgroundColor: org.color }]}>
                                <Text style={styles.ngoAvatarText}>{org.shortName}</Text>
                            </View>

                            <View style={styles.ngoInfo}>
                                <View style={styles.ngoNameRow}>
                                    <Text style={styles.ngoName} numberOfLines={1}>
                                        {org.name}
                                    </Text>
                                    {org.verified && (
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
                                    <Text style={styles.ngoLocation}>{org.location}</Text>
                                </View>
                            </View>

                            <View style={styles.ngoMatchPill}>
                                <View style={styles.matchDot} />
                                <Text style={styles.ngoMatchText}>{org.matchScore}%</Text>
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
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    headerText: {
        flex: 1,
        paddingRight: 12,
    },
    greetingSmall: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.primary,
        marginBottom: 4,
    },
    greetingName: {
        fontSize: 22,
        fontWeight: "800",
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
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
    notificationBadge: {
        position: "absolute",
        top: -2,
        right: -2,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        paddingHorizontal: 4,
        backgroundColor: COLORS.danger,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: COLORS.background,
    },
    notificationBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: "700",
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: "700",
    },

    /* Stats */
    statsRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 28,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    statNumber: {
        fontSize: 16,
        fontWeight: "800",
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.textSecondary,
    },

    /* Section header */
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    viewAll: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.primary,
    },

    /* Recommended card */
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
    orgLogo: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    orgLogoText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: "700",
    },
    matchPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 5,
    },
    matchDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
    },
    matchPillText: {
        fontSize: 12,
        fontWeight: "700",
        color: COLORS.primary,
    },
    orgNameRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    orgName: {
        fontSize: 17,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    verifiedIcon: {
        marginLeft: 5,
    },
    verifiedBadge: {
        alignSelf: "flex-start",
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginBottom: 8,
    },
    verifiedBadgeText: {
        fontSize: 11,
        fontWeight: "700",
        color: COLORS.primary,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
        gap: 4,
    },
    locationText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    tagsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 10,
    },
    tagPill: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    tagPillText: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.textSecondary,
    },
    description: {
        fontSize: 13,
        lineHeight: 19,
        color: COLORS.textSecondary,
        marginBottom: 12,
    },
    fundingNeed: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 16,
    },
    recommendedActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
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
    viewMatchButtonText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: "700",
    },
    saveButton: {
        width: 50,
        height: 50,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
    },

    /* Projects */
    projectsRow: {
        gap: 14,
        paddingBottom: 4,
        marginBottom: 28,
    },
    projectCard: {
        width: 220,
        backgroundColor: COLORS.surface,
        borderRadius: 18,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    projectImage: {
        height: 110,
        alignItems: "center",
        justifyContent: "center",
    },
    projectCategoryPill: {
        position: "absolute",
        top: 10,
        left: 10,
        backgroundColor: "rgba(255,255,255,0.92)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    projectCategoryText: {
        fontSize: 10,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    projectMatchPill: {
        position: "absolute",
        top: 10,
        right: 10,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.92)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    projectMatchText: {
        fontSize: 10,
        fontWeight: "700",
        color: COLORS.primary,
    },
    projectBody: {
        padding: 14,
    },
    projectTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 4,
        lineHeight: 19,
    },
    projectOrg: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.primary,
        marginBottom: 10,
    },
    progressTrack: {
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.background,
        overflow: "hidden",
        marginBottom: 8,
    },
    progressFill: {
        height: "100%",
        borderRadius: 3,
        backgroundColor: COLORS.primary,
    },
    progressLabelsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    progressRaised: {
        fontSize: 10,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    progressPercent: {
        fontSize: 10,
        color: COLORS.textSecondary,
    },

    /* Recent activity */
    activityList: {
        marginBottom: 28,
        gap: 10,
    },
    activityRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    activityRowUnread: {
        backgroundColor: COLORS.primaryLight,
        borderColor: "transparent",
    },
    activityIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
        paddingRight: 8,
    },
    activityText: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.textPrimary,
        lineHeight: 18,
        marginBottom: 3,
    },
    activityTime: {
        fontSize: 11,
        color: COLORS.textSecondary,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
    },

    /* All recommended NGOs */
    ngoList: {
        gap: 4,
    },
    ngoRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
    },
    ngoAvatar: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    ngoAvatarText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: "700",
    },
    ngoInfo: {
        flex: 1,
        paddingRight: 8,
    },
    ngoNameRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 3,
    },
    ngoName: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    ngoLocationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    ngoLocation: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    ngoMatchPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 4,
        marginRight: 6,
    },
    ngoMatchText: {
        fontSize: 12,
        fontWeight: "700",
        color: COLORS.primary,
    },
    chevron: {
        marginLeft: 2,
    },
});