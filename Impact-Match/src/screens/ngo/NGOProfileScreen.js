import React from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Image,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

const COLORS = {
    background: "#F9FAFB",
    surface: "#FFFFFF",
    primary: "#2563EB", // Blue accent
    textPrimary: "#111827",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    white: "#FFFFFF",
    warning: "#F59E0B", // Orange for progress bar
    warningLight: "rgba(245, 158, 11, 0.1)",
    danger: "#EF4444",
};

export default function ProfileScreen({ navigation, route }) {
    // Extract data passed from NGOSetupScreen
    const { 
        organisationName, 
        location, 
        fundingRequired, 
        mission, 
        targetCommunity 
    } = route.params || {};

    // Generate initials from organisation name (e.g., "Education For All" -> "EFA")
    const getInitials = (name) => {
        if (!name) return "NGO";
        return name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .substring(0, 3);
    };

    // Dynamic menu items based on available data
    const profileMenuItems = [
        {
            id: "1",
            title: "Organisation Details",
            subtitle: `NGO · Est. ${organisationName ? "Not provided" : "Not provided"}`,
            icon: "business-outline",
        },
        {
            id: "2",
            title: "Mission & Causes",
            subtitle: mission || "Not provided",
            icon: "heart-outline",
        },
        {
            id: "3",
            title: "Funding Requirements",
            subtitle: fundingRequired ? `R${fundingRequired}` : "Not provided",
            icon: "cash-outline",
        },
        {
            id: "4",
            title: "Communities Served",
            subtitle: targetCommunity || "Not provided",
            icon: "people-outline",
        },
        {
            id: "5",
            title: "Projects",
            subtitle: "0 active projects",
            icon: "folder-open-outline",
        },
        {
            id: "6",
            title: "Matching Preferences",
            subtitle: "Sponsors aligned with your causes",
            icon: "options-outline",
        },
        {
            id: "7",
            title: "Settings",
            subtitle: "Notifications, privacy, security",
            icon: "settings-outline",
        },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Cover Image */}
                <Image
                    source={{
                        uri: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=1000",
                    }}
                    style={styles.coverImage}
                    resizeMode="cover"
                />

                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {getInitials(organisationName)}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.editButton}>
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                {/* Name & Badges */}
                <View style={styles.nameSection}>
                    <View style={styles.nameRow}>
                        <Text style={styles.organisationName}>
                            {organisationName || "Your Organisation"}
                        </Text>
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
                            <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                    </View>
                    <Text style={styles.locationText}>
                        <Ionicons name="globe-outline" size={14} color={COLORS.textSecondary} />{" "}
                        {location || "Location not provided"} · NGO
                    </Text>
                </View>

                {/* Profile Completion Card */}
                <View style={styles.completionCard}>
                    <View style={styles.completionHeader}>
                        <Text style={styles.completionTitle}>Profile Completion</Text>
                        <Text style={styles.completionPercentage}>72%</Text>
                    </View>
                    <View style={styles.progressBarBackground}>
                        <View style={[styles.progressBarFill, { width: "72%" }]} />
                    </View>
                    <Text style={styles.completionSubtitle}>
                        Add impact evidence to reach 100% and improve sponsor visibility.
                    </Text>
                </View>

                {/* Menu List */}
                <View style={styles.menuContainer}>
                    {profileMenuItems.map((item, index) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.menuItem,
                                index === profileMenuItems.length - 1 && styles.menuItemLast,
                            ]}
                            activeOpacity={0.7}
                            // onPress={() => navigation.navigate(item.route)}
                        >
                            <View style={styles.menuContent}>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                            </View>
                            <Ionicons
                                name="chevron-forward"
                                size={20}
                                color={COLORS.textSecondary}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Sign Out Button */}
                <TouchableOpacity
                    style={styles.signOutButton}
                    activeOpacity={0.8}
                    onPress={() => navigation.replace("Login")}
                >
                    <Text style={styles.signOutText}>Sign Out</Text>
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
        paddingBottom: 40,
    },

    /* Cover Image */
    coverImage: {
        width: "100%",
        height: 160,
    },

    /* Profile Header */
    profileHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        paddingHorizontal: 20,
        marginTop: -40, // Pull up to overlap the cover image
    },
    avatarContainer: {
        width: 86,
        height: 86,
        borderRadius: 43,
        backgroundColor: COLORS.white,
        alignItems: "center",
        justifyContent: "center",
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    avatar: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: "#1E3A8A", // Dark blue matching the image
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        color: COLORS.white,
        fontSize: 24,
        fontWeight: "800",
    },
    editButton: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    editButtonText: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.textPrimary,
    },

    /* Name & Badges */
    nameSection: {
        paddingHorizontal: 20,
        marginTop: 16,
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 6,
    },
    organisationName: {
        fontSize: 22,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    verifiedBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(37, 99, 235, 0.08)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    verifiedText: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.primary,
    },
    locationText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },

    /* Profile Completion Card */
    completionCard: {
        backgroundColor: COLORS.white,
        marginHorizontal: 20,
        marginTop: 24,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: COLORS.warning,
    },
    completionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    completionTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    completionPercentage: {
        fontSize: 15,
        fontWeight: "700",
        color: COLORS.warning,
    },
    progressBarBackground: {
        height: 8,
        backgroundColor: "#F3F4F6",
        borderRadius: 4,
        marginBottom: 12,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: COLORS.warning,
        borderRadius: 4,
    },
    completionSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },

    /* Menu List */
    menuContainer: {
        backgroundColor: COLORS.white,
        marginHorizontal: 20,
        marginTop: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: "hidden",
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    menuItemLast: {
        borderBottomWidth: 0,
    },
    menuContent: {
        flex: 1,
        marginRight: 10,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    menuSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },

    /* Sign Out */
    signOutButton: {
        marginTop: 32,
        alignItems: "center",
        paddingVertical: 12,
    },
    signOutText: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.danger,
    },
});