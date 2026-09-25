import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Switch,
    Image,
    ActivityIndicator,
    Alert,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import * as ImagePicker from "expo-image-picker";

import EditProfileModal from "../../components/sponsors/EditProfileModal";

// Firebase imports
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";
import { auth, db } from "../../../Backend/firebaseConfig";

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
    purple: "#7C3AED",
    purpleLight: "rgba(124, 58, 237, 0.12)",
    yellow: "#D97706",
    yellowLight: "rgba(217, 119, 6, 0.14)",
    blue: "#2563EB",
    blueLight: "rgba(37, 99, 235, 0.12)",
    gray: "#64748B",
    grayLight: "rgba(100, 116, 139, 0.12)",
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
    const uid = auth.currentUser?.uid;

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const [notifMatches, setNotifMatches] = useState(true);
    const [notifMessages, setNotifMessages] = useState(true);
    const [notifOffers, setNotifOffers] = useState(false);
    const [notifUpdates, setNotifUpdates] = useState(true);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [editProfileVisible, setEditProfileVisible] = useState(false);

    // Pull the real sponsor document from Firestore
    const fetchProfile = async () => {
        if (!uid) return;
        try {
            const snap = await getDoc(doc(db, "users", uid));
            if (snap.exists()) {
                setProfile(snap.data());
            }
        } catch (error) {
            Alert.alert("Error Loading Profile", error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [uid]);

    // Avatar photo upload -> Firebase Storage -> save URL on the same doc
    const handlePickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Permission Needed", "Allow photo access to upload a profile image.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (result.canceled) return;

        try {
            setUploading(true);
            const uri = result.assets[0].uri;
            const response = await fetch(uri);
            const blob = await response.blob();

            const storage = getStorage();
            const imageRef = ref(storage, `profileImages/${uid}`);
            await uploadBytes(imageRef, blob);
            const downloadUrl = await getDownloadURL(imageRef);

            await updateDoc(doc(db, "users", uid), {
                profileImageUrl: downloadUrl,
            });

            setProfile((prev) => ({ ...prev, profileImageUrl: downloadUrl }));
        } catch (error) {
            Alert.alert("Upload Failed", error.message);
        } finally {
            setUploading(false);
        }
    };

    // Save edits from the modal straight back to the same Firestore doc
    const handleSaveProfile = async (updatedProfile) => {
        if (!uid) return;
        try {
            await updateDoc(doc(db, "users", uid), {
                organisationName: updatedProfile.orgName,
                email: updatedProfile.email,
                phone: updatedProfile.phone,
                website: updatedProfile.website,
                location: updatedProfile.location,
                description: updatedProfile.description,
            });

            setProfile((prev) => ({
                ...prev,
                organisationName: updatedProfile.orgName,
                email: updatedProfile.email,
                phone: updatedProfile.phone,
                website: updatedProfile.website,
                location: updatedProfile.location,
                description: updatedProfile.description,
            }));
        } catch (error) {
            Alert.alert("Error Saving Profile", error.message);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigation.getParent?.()?.reset?.({
                index: 0,
                routes: [{ name: "Welcome" }],
            }) ?? navigation.navigate("Welcome");
        } catch (error) {
            Alert.alert("Sign Out Failed", error.message);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, styles.centered]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    const {
        organisationName,
        full_name,
        email,
        phone,
        website,
        location,
        description,
        industry,
        fundingBudget,
        preferredCauses,
        profileImageUrl,
        profileCompleted,
    } = profile || {};

    const displayName = organisationName || full_name || "Your Organisation";

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
                        <TouchableOpacity activeOpacity={0.85} onPress={handlePickImage} disabled={uploading}>
                            {profileImageUrl ? (
                                <Image source={{ uri: profileImageUrl }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.editBadge}
                            activeOpacity={0.8}
                            onPress={handlePickImage}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                                <Ionicons name="camera" size={14} color={COLORS.white} />
                            )}
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.orgName}>{displayName}</Text>

                    <View style={styles.badgeRow}>
                        {profileCompleted && (
                            <View style={styles.verifiedPill}>
                                <Ionicons name="checkmark-circle" size={12} color={COLORS.white} />
                                <Text style={styles.verifiedPillText}>Profile Complete</Text>
                            </View>
                        )}
                        {industry ? <Text style={styles.planText}>{industry}</Text> : null}
                    </View>

                    <Text style={styles.email}>{email || "No email on file"}</Text>
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
                            subtitle={`Industry: ${industry || "Not provided"} · Budget: ${fundingBudget ? `R${fundingBudget}` : "Not provided"}`}
                            onPress={() => {}}
                        />
                        <View style={styles.divider} />
                        <ProfileRow
                            icon="heart-outline"
                            iconBg={COLORS.purpleLight}
                            iconColor={COLORS.purple}
                            title="Preferred Causes"
                            subtitle={preferredCauses || "Not provided"}
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
                    orgName: displayName,
                    email: email || "",
                    phone: phone || "",
                    website: website || "",
                    location: location || "",
                    description: description || "",
                }}
                onSave={(updatedProfile) => {
                    handleSaveProfile(updatedProfile);
                    setEditProfileVisible(false);
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
    centered: {
        justifyContent: "center",
        alignItems: "center",
    },
    scrollContent: {
        paddingBottom: 40,
    },
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
    avatarImage: {
        width: 84,
        height: 84,
        borderRadius: 42,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.25)",
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
        marginBottom: 4,
    },
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