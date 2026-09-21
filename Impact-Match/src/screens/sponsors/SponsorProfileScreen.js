import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Switch,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import EditProfileModal from "../../components/sponsors/EditProfileModal";

const COLORS = {
    background: "#F9FAFB",
    surface: "#FFFFFF",
    headerBg: "#0F1B3D", // dark navy
    primary: "#10B981", // emerald green — sponsor brand accent
    primaryLight: "rgba(16, 185, 129, 0.12)",
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    border: "#E5E7EB",
    white: "#FFFFFF",
    danger: "#EF4444",
    dangerLight: "rgba(239, 68, 68, 0.10)",
    muted: "#94A3B8",
    // Icon tints
    purple: "#7C3AED",
    purpleLight: "rgba(124, 58, 237, 0.12)",
    yellow: "#D97706",
    yellowLight: "rgba(217, 119, 6, 0.14)",
    blue: "#2563EB",
    blueLight: "rgba(37, 99, 235, 0.12)",
    gray: "#64748B",
    grayLight: "rgba(100, 116, 139, 0.12)",
};

const stats = {
    matches: 47,
    partnerships: 6,
    funded: "R4.2M",
};

// Derives display initials from an organisation name, e.g. "GreenFuture Foundation" -> "GF"
function getInitials(name) {
    if (!name) return "?";
    return name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function SectionHeader({ title }) {
    return <Text style={styles.sectionHeader}>{title}</Text>;
}

function ProfileRow({ icon, iconBg, iconColor, title, subtitle, titleColor, right, onPress }) {
    return (
        <TouchableOpacity
            style={styles.row}
            activeOpacity={onPress ? 0.7 : 1}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
                <Ionicons name={icon} size={20} color={iconColor} />
            </View>

            <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, titleColor && { color: titleColor }]}>
                    {title}
                </Text>
                <Text style={styles.rowSubtitle} numberOfLines={2}>
                    {subtitle}
                </Text>
            </View>

            {right ?? (
                <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
            )}
        </TouchableOpacity>
    );
}

export default function SponsorProfileScreen({ navigation }) {
    // Placeholder profile data — swap for the logged-in sponsor once auth exists.
    // Lives inside the component (as state) so EditProfileModal's onSave can
    // actually update what's displayed here.
    const [profile, setProfile] = useState({
        name: "GreenFuture Foundation",
        verified: true,
        plan: "Sponsor · Pro Plan",
        email: "info@greenfuture.org",
        phone: "+27 21 555 0148",
        website: "https://greenfuture.org",
        location: "Cape Town, South Africa",
        description:
            "GreenFuture Foundation is dedicated to environmental conservation and sustainable community development across the Western Cape.",
    });

    const [notifMatches, setNotifMatches] = useState(true);
    const [notifMessages, setNotifMessages] = useState(true);
    const [notifOffers, setNotifOffers] = useState(false);
    const [notifUpdates, setNotifUpdates] = useState(true);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [editProfileVisible, setEditProfileVisible] = useState(false);

    const handleSignOut = () => {
        navigation.getParent?.()?.reset?.({
            index: 0,
            routes: [{ name: "Welcome" }],
        }) ?? navigation.navigate("Welcome");
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{getInitials(profile.name)}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.editBadge}
                            activeOpacity={0.8}
                            onPress={() => setEditProfileVisible(true)}
                        >
                            <Ionicons name="camera" size={14} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.orgName}>{profile.name}</Text>

                    <View style={styles.badgeRow}>
                        {profile.verified && (
                            <View style={styles.verifiedPill}>
                                <Ionicons name="checkmark-circle" size={12} color={COLORS.white} />
                                <Text style={styles.verifiedPillText}>Verified</Text>
                            </View>
                        )}
                        <Text style={styles.planText}>{profile.plan}</Text>
                    </View>

                    <Text style={styles.email}>{profile.email}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.matches}</Text>
                            <Text style={styles.statLabel}>Matches</Text>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.partnerships}</Text>
                            <Text style={styles.statLabel}>Partnerships</Text>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.funded}</Text>
                            <Text style={styles.statLabel}>Funded</Text>
                        </View>
                    </View>
                </View>

                {/* Body */}
                <View style={styles.body}>
                    {/* ACCOUNT */}
                    <SectionHeader title="ACCOUNT" />
                    <View style={styles.card}>
                        <ProfileRow
                            icon="person-outline"
                            iconBg={COLORS.primaryLight}
                            iconColor={COLORS.primary}
                            title="Edit Profile"
                            subtitle="Update your organisation details and logo"
                            onPress={() => setEditProfileVisible(true)}
                        />
                        <View style={styles.divider} />
                        <ProfileRow
                            icon="business-outline"
                            iconBg={COLORS.blueLight}
                            iconColor={COLORS.blue}
                            title="Account Details"
                            subtitle="View your account information"
                            onPress={() => {}}
                        />
                        <View style={styles.divider} />
                        <ProfileRow
                            icon="lock-closed-outline"
                            iconBg={COLORS.purpleLight}
                            iconColor={COLORS.purple}
                            title="Change Password"
                            subtitle="Update your login password"
                            onPress={() => {}}
                        />
                    </View>

                    {/* PREFERENCES */}
                    <SectionHeader title="PREFERENCES" />
                    <View style={styles.card}>
                        <View style={styles.notificationsBlock}>
                            <View style={styles.rowIconTitleOnly}>
                                <View style={[styles.rowIcon, { backgroundColor: COLORS.yellowLight }]}>
                                    <Ionicons name="notifications-outline" size={20} color={COLORS.yellow} />
                                </View>
                                <View style={styles.rowContent}>
                                    <Text style={styles.rowTitle}>Notifications</Text>
                                    <Text style={styles.rowSubtitle}>
                                        Manage what you're notified about
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.toggleList}>
                                <View style={styles.toggleRow}>
                                    <Text style={styles.toggleLabel}>Matches</Text>
                                    <Switch
                                        value={notifMatches}
                                        onValueChange={setNotifMatches}
                                        trackColor={{ false: COLORS.border, true: COLORS.primary }}
                                        thumbColor={COLORS.white}
                                    />
                                </View>
                                <View style={styles.toggleRow}>
                                    <Text style={styles.toggleLabel}>Messages</Text>
                                    <Switch
                                        value={notifMessages}
                                        onValueChange={setNotifMessages}
                                        trackColor={{ false: COLORS.border, true: COLORS.primary }}
                                        thumbColor={COLORS.white}
                                    />
                                </View>
                                <View style={styles.toggleRow}>
                                    <Text style={styles.toggleLabel}>Offers</Text>
                                    <Switch
                                        value={notifOffers}
                                        onValueChange={setNotifOffers}
                                        trackColor={{ false: COLORS.border, true: COLORS.primary }}
                                        thumbColor={COLORS.white}
                                    />
                                </View>
                                <View style={[styles.toggleRow, styles.toggleRowLast]}>
                                    <Text style={styles.toggleLabel}>Platform Updates</Text>
                                    <Switch
                                        value={notifUpdates}
                                        onValueChange={setNotifUpdates}
                                        trackColor={{ false: COLORS.border, true: COLORS.primary }}
                                        thumbColor={COLORS.white}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <ProfileRow
                            icon="shield-checkmark-outline"
                            iconBg={COLORS.blueLight}
                            iconColor={COLORS.blue}
                            title="Two-Factor Authentication"
                            subtitle={twoFactorEnabled ? "Enabled" : "Disabled — tap to enable"}
                            right={
                                <Switch
                                    value={twoFactorEnabled}
                                    onValueChange={setTwoFactorEnabled}
                                    trackColor={{ false: COLORS.border, true: COLORS.primary }}
                                    thumbColor={COLORS.white}
                                />
                            }
                        />
                    </View>

                    {/* DANGER ZONE */}
                    <SectionHeader title="DANGER ZONE" />
                    <View style={styles.card}>
                        <ProfileRow
                            icon="log-out-outline"
                            iconBg={COLORS.grayLight}
                            iconColor={COLORS.gray}
                            title="Sign Out"
                            subtitle="Sign out of your ImpactMatch account"
                            onPress={handleSignOut}
                        />
                        <View style={styles.divider} />
                        <ProfileRow
                            icon="trash-outline"
                            iconBg={COLORS.dangerLight}
                            iconColor={COLORS.danger}
                            titleColor={COLORS.danger}
                            title="Delete Account"
                            subtitle="Permanently delete your account and all associated data"
                            onPress={() => {}}
                        />
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            ImpactMatch v1.0 · Privacy Policy · Terms of Service
                        </Text>
                    </View>
                </View>
            </ScrollView>

            <EditProfileModal
                visible={editProfileVisible}
                onClose={() => setEditProfileVisible(false)}
                initialProfile={{
                    orgName: profile.name,
                    email: profile.email,
                    phone: profile.phone,
                    website: profile.website,
                    location: profile.location,
                    description: profile.description,
                }}
                onSave={(updatedProfile) => {
                    setProfile((prev) => ({
                        ...prev,
                        ...updatedProfile,
                        name: updatedProfile.orgName,
                    }));
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.headerBg,
    },
    scrollContent: {
        paddingBottom: 40,
    },

    /* Header */
    header: {
        backgroundColor: COLORS.headerBg,
        alignItems: "center",
        paddingTop: 24,
        paddingBottom: 28,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    avatarWrapper: {
        marginBottom: 14,
    },
    avatar: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: "rgba(255,255,255,0.12)",
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.25)",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        color: COLORS.white,
        fontSize: 26,
        fontWeight: "800",
    },
    editBadge: {
        position: "absolute",
        bottom: -2,
        right: -2,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: COLORS.headerBg,
    },
    orgName: {
        fontSize: 20,
        fontWeight: "800",
        color: COLORS.white,
        marginBottom: 8,
        textAlign: "center",
    },
    badgeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 6,
    },
    verifiedPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        gap: 4,
    },
    verifiedPillText: {
        fontSize: 11,
        fontWeight: "700",
        color: COLORS.white,
    },
    planText: {
        fontSize: 13,
        fontWeight: "500",
        color: "rgba(255,255,255,0.7)",
    },
    email: {
        fontSize: 13,
        color: "rgba(203, 213, 225, 0.8)",
        marginBottom: 22,
    },

    /* Stats */
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
    },
    statItem: {
        flex: 1,
        alignItems: "center",
    },
    statValue: {
        fontSize: 17,
        fontWeight: "800",
        color: COLORS.white,
        marginBottom: 3,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: "500",
        color: "rgba(255,255,255,0.6)",
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: "rgba(255,255,255,0.15)",
    },

    /* Body */
    body: {
        backgroundColor: COLORS.background,
        paddingHorizontal: 20,
        paddingTop: 24,
        borderTopLeftRadius: 0,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: "700",
        color: COLORS.textSecondary,
        letterSpacing: 0.6,
        marginBottom: 10,
        marginTop: 4,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: "hidden",
        marginBottom: 24,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginLeft: 66,
    },

    /* Row */
    row: {
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
    },
    rowIconTitleOnly: {
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        paddingBottom: 4,
    },
    rowIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    rowContent: {
        flex: 1,
        marginRight: 8,
    },
    rowTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    rowSubtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
        lineHeight: 16,
    },

    /* Notifications toggle block */
    notificationsBlock: {
        paddingBottom: 6,
    },
    toggleList: {
        paddingHorizontal: 14,
        paddingLeft: 66,
    },
    toggleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.background,
    },
    toggleRowLast: {
        borderBottomWidth: 0,
    },
    toggleLabel: {
        fontSize: 14,
        color: COLORS.textPrimary,
        fontWeight: "500",
    },

    /* Footer */
    footer: {
        alignItems: "center",
        paddingVertical: 12,
        paddingBottom: 4,
    },
    footerText: {
        fontSize: 12,
        color: COLORS.muted,
        textAlign: "center",
    },
});