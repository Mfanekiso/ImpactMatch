import React, { useState, useMemo } from "react";
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import opportunities from "../../data/opportunities";
import projects from "../../data/projects";
import { formatCurrency, formatFundingRange } from "../../utils/formatCurrency";

const COLORS = {
    background: "#F9FAFB",
    surface: "#FFFFFF",
    primary: "#10B981",
    primaryLight: "rgba(16, 185, 129, 0.10)",
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    border: "#E5E7EB",
    white: "#FFFFFF",
    danger: "#EF4444",
    tabTrack: "#F1F5F9",
};

// Tag pill color per cause category, matching the mockup's varied chip colors.
const TAG_COLORS = {
    Education: { bg: "#DBEAFE", text: "#1D4ED8" },
    "Youth Development": { bg: "#FEF3C7", text: "#B45309" },
    Environment: { bg: "#DCFCE7", text: "#15803D" },
    "Community Development": { bg: "#CCFBF1", text: "#0F766E" },
    Healthcare: { bg: "#FCE7F3", text: "#BE185D" },
};

function getTagStyle(tag) {
    return TAG_COLORS[tag] || { bg: "#F1F5F9", text: COLORS.textSecondary };
}

function OrgCard({ org, saved, onToggleSave, onPress }) {
    return (
        <View style={styles.card}>
            <View style={styles.cardTopRow}>
                <View style={[styles.orgLogo, { backgroundColor: org.color }]}>
                    <Text style={styles.orgLogoText}>{org.shortName}</Text>
                </View>

                <View style={styles.cardTitleBlock}>
                    <View style={styles.cardNameRow}>
                        <Text style={styles.orgName} numberOfLines={1}>
                            {org.name}
                        </Text>
                    </View>
                </View>

                <View style={styles.matchPill}>
                    <View style={styles.matchDot} />
                    <Text style={styles.matchPillText}>{org.matchScore}%</Text>
                </View>
            </View>

            {org.verified && (
                <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={12} color={COLORS.primary} />
                    <Text style={styles.verifiedBadgeText}>Verified</Text>
                </View>
            )}

            <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
                <Text style={styles.locationText}>{org.location}</Text>
            </View>

            <View style={styles.tagsRow}>
                {org.tags.map((tag) => {
                    const tagStyle = getTagStyle(tag);
                    return (
                        <View
                            key={tag}
                            style={[styles.tagPill, { backgroundColor: tagStyle.bg }]}
                        >
                            <Text style={[styles.tagPillText, { color: tagStyle.text }]}>
                                {tag}
                            </Text>
                        </View>
                    );
                })}
            </View>

            <Text style={styles.description} numberOfLines={2}>
                {org.description}
            </Text>

            <Text style={styles.fundingNeed}>
                Funding Need: {formatFundingRange(org.fundingNeedMin, org.fundingNeedMax)}
            </Text>

            <View style={styles.actionsRow}>
                <TouchableOpacity
                    style={styles.viewProfileButton}
                    activeOpacity={0.85}
                    onPress={onPress}
                >
                    <Text style={styles.viewProfileButtonText}>View Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.saveButton}
                    activeOpacity={0.7}
                    onPress={onToggleSave}
                >
                    <Ionicons
                        name={saved ? "heart" : "heart-outline"}
                        size={20}
                        color={saved ? COLORS.danger : COLORS.textSecondary}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

function ProjectCard({ project, onPress }) {
    const percentFunded = Math.min(100, Math.round((project.raised / project.goal) * 100));

    return (
        <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
            <View style={styles.cardTopRow}>
                <View style={[styles.orgLogo, { backgroundColor: project.color }]}>
                    <Ionicons name={project.icon} size={20} color={COLORS.white} />
                </View>

                <View style={styles.cardTitleBlock}>
                    <Text style={styles.orgName} numberOfLines={2}>
                        {project.title}
                    </Text>
                    <Text style={styles.projectOrgName} numberOfLines={1}>
                        {project.orgName}
                    </Text>
                </View>

                <View style={styles.matchPill}>
                    <View style={styles.matchDot} />
                    <Text style={styles.matchPillText}>{project.matchScore}%</Text>
                </View>
            </View>

            <View style={[styles.tagPill, styles.projectCategoryPill, { backgroundColor: getTagStyle(project.category).bg }]}>
                <Text style={[styles.tagPillText, { color: getTagStyle(project.category).text }]}>
                    {project.category}
                </Text>
            </View>

            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${percentFunded}%` }]} />
            </View>

            <View style={styles.progressLabelsRow}>
                <Text style={styles.progressRaised}>{formatCurrency(project.raised)} raised</Text>
                <Text style={styles.progressPercent}>
                    {percentFunded}% of {formatCurrency(project.goal)}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

export default function SponsorDiscoverScreen({ navigation }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("organisations"); // "organisations" | "projects"
    const [savedIds, setSavedIds] = useState([]);

    const toggleSaved = (id) => {
        setSavedIds((prev) =>
            prev.includes(id) ? prev.filter((savedId) => savedId !== id) : [...prev, id]
        );
    };

    const filteredOpportunities = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return opportunities;
        return opportunities.filter((org) => {
            const haystack = [org.name, org.location, ...org.tags].join(" ").toLowerCase();
            return haystack.includes(query);
        });
    }, [searchQuery]);

    const filteredProjects = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return projects;
        return projects.filter((project) => {
            const haystack = [project.title, project.orgName, project.category]
                .join(" ")
                .toLowerCase();
            return haystack.includes(query);
        });
    }, [searchQuery]);

    const goToOpportunity = (opportunity) => {
        navigation.navigate("SponsorOpportunityDetails", { opportunity });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Discover Impact</Text>

                <View style={styles.searchRow}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search NGOs, projects or causes"
                            placeholderTextColor={COLORS.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
                        {/* TODO: wire up a real filter modal (cause, location, funding range) */}
                        <Ionicons name="options-outline" size={18} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.tabTrack}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "organisations" && styles.tabActive]}
                        activeOpacity={0.8}
                        onPress={() => setActiveTab("organisations")}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === "organisations" && styles.tabTextActive,
                            ]}
                        >
                            Organisations
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === "projects" && styles.tabActive]}
                        activeOpacity={0.8}
                        onPress={() => setActiveTab("projects")}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === "projects" && styles.tabTextActive,
                            ]}
                        >
                            Projects
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            >
                {activeTab === "organisations" ? (
                    filteredOpportunities.length > 0 ? (
                        filteredOpportunities.map((org) => (
                            <OrgCard
                                key={org.id}
                                org={org}
                                saved={savedIds.includes(org.id)}
                                onToggleSave={() => toggleSaved(org.id)}
                                onPress={() => goToOpportunity(org)}
                            />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No organisations match your search.</Text>
                    )
                ) : filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onPress={() => {}}
                        />
                    ))
                ) : (
                    <Text style={styles.emptyText}>No projects match your search.</Text>
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

    /* Header */
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 16,
        backgroundColor: COLORS.background,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: COLORS.textPrimary,
        marginBottom: 14,
    },
    searchRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 14,
    },
    searchBar: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 48,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: COLORS.textPrimary,
        paddingVertical: 0,
    },
    filterButton: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
    },

    /* Tabs */
    tabTrack: {
        flexDirection: "row",
        backgroundColor: COLORS.tabTrack,
        borderRadius: 14,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 11,
        alignItems: "center",
    },
    tabActive: {
        backgroundColor: COLORS.surface,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 1,
    },
    tabText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textSecondary,
    },
    tabTextActive: {
        color: COLORS.textPrimary,
        fontWeight: "700",
    },

    /* List */
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 16,
    },
    emptyText: {
        textAlign: "center",
        color: COLORS.textSecondary,
        marginTop: 40,
        fontSize: 14,
    },

    /* Card (shared by org + project cards) */
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    cardTopRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    orgLogo: {
        width: 44,
        height: 44,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    orgLogoText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: "700",
    },
    cardTitleBlock: {
        flex: 1,
        paddingRight: 8,
    },
    cardNameRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    orgName: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    projectOrgName: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.primary,
        marginTop: 2,
    },
    matchPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 4,
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
    verifiedBadge: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginBottom: 8,
        gap: 4,
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
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    tagPillText: {
        fontSize: 11,
        fontWeight: "700",
    },
    projectCategoryPill: {
        alignSelf: "flex-start",
        marginBottom: 12,
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
    actionsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    viewProfileButton: {
        flex: 1,
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    viewProfileButtonText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: "700",
    },
    saveButton: {
        width: 48,
        height: 48,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
    },

    /* Project progress */
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
        fontSize: 11,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    progressPercent: {
        fontSize: 11,
        color: COLORS.textSecondary,
    },
});