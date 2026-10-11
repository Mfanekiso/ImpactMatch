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
import {
    useFonts,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
} from "@expo-google-fonts/manrope";

import EditProfileModal from "../../components/sponsors/EditProfileModal";
import AccountDetailsModal from "../../components/sponsors/AccountDetailsModal";
import PreferredCausesModal from "../../components/sponsors/PreferredCausesModal";
import DeleteAccountModal from "../../components/sponsors/DeleteAccountModal";
import { parseAmount } from "../../utils/matchScore";
import { formatCauses } from "../../utils/causes";
import { deleteSponsorAccount } from "../../utils/deleteAccount";

// Firebase imports
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";
import { auth, db } from "../../../Backend/firebaseConfig";

// ─── LUXURY COLOR PALETTE (Sponsor Twist) ──────────────────────────────
const COLORS = {
    background: "#F8F6EE",       // Cream base
    surface: "#FFFFFF",          // Clean white
    primary: "#D9C982",          // Soft Luxury Gold
    primarySoft: "rgba(217, 201, 130, 0.15)",
    emerald: "#059669",          // Vibrant Emerald 
    emeraldSoft: "rgba(5, 150, 105, 0.1)",
    buttonDark: "#013e37",       // Deep luxury green
    buttonDarkSoft: "rgba(1, 62, 55, 0.08)",
    textPrimary: "#433327",      // Warm Bronze
    textSecondary: "#8C7A6B",    // Muted taupe
    border: "#E8DFD5",
    white: "#FFFFFF",
    danger: "#DC2626",           // Elegant red
    dangerLight: "rgba(220, 38, 38, 0.1)",
    grayLight: "rgba(140, 122, 107, 0.1)", 
};

const softShadow = {
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
};

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
    const [fontsLoaded] = useFonts({
        Manrope_400Regular,
        Manrope_500Medium,
        Manrope_600SemiBold,
        Manrope_700Bold,
    });

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
    const [accountDetailsVisible, setAccountDetailsVisible] = useState(false);
    const [causesVisible, setCausesVisible] = useState(false);
    const [deleteVisible, setDeleteVisible] = useState(false);

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
                ...updatedProfile,
                organisationName: updatedProfile.orgName,
            }));
        } catch (error) {
            Alert.alert("Error Saving Profile", error.message);
        }
    };

    const handleSaveAccountDetails = async ({ industry, fundingBudget }) => {
        if (!uid) return;
        try {
            await updateDoc(doc(db, "users", uid), { industry, fundingBudget });
            setProfile((prev) => ({ ...prev, industry, fundingBudget }));
            setAccountDetailsVisible(false);
        } catch (error) {
            Alert.alert("Error Saving Details", error.message);
        }
    };

    const handleSaveCauses = async (causes) => {
        if (!uid) return;
        try {
            await updateDoc(doc(db, "users", uid), { preferredCauses: causes });
            setProfile((prev) => ({ ...prev, preferredCauses: causes }));
            setCausesVisible(false);
        } catch (error) {
            Alert.alert("Error Saving Causes", error.message);
        }
    };

    const handleDeleteAccount = async (password) => {
        await deleteSponsorAccount(password);
        setDeleteVisible(false);
        const parent = navigation.getParent?.();
        if (parent?.reset) {
            parent.reset({ index: 0, routes: [{ name: "Welcome" }] });
        } else {
            navigation.navigate("Welcome");
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

    if (!fontsLoaded) return null;

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, styles.centered]}>
                <ActivityIndicator size="large" color={COLORS.white} />
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
            <StatusBar barStyle="light-content" backgroundColor={COLORS.buttonDark} />

            <View style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    {/* Header Block */}
                    <View style={styles.headerBlock}>
                        <View style={styles.topHeader}>
                            <Text style={styles.headerTitle}>PROFILE</Text>
                        </View>

                        <View style={styles.profileHeaderContent}>
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
                                        <ActivityIndicator size="small" color={COLORS.buttonDark} />
                                    ) : (
                                        <Ionicons name="camera" size={14} color={COLORS.buttonDark} />
                                    )}
                                </TouchableOpacity>
                            </View>

                            <View style={styles.nameRow}>
                                <Text style={styles.orgName}>{displayName}</Text>
                                {profileCompleted && (
                                    <Ionicons 
                                        name="checkmark-circle" 
                                        size={22} 
                                        color={COLORS.primary} 
                                        style={styles.verifiedIcon} 
                                    />
                                )}
                            </View>

                            <Text style={styles.email}>{email || "No email on file"}</Text>

                            {industry ? (
                                <View style={styles.industryPill}>
                                    <Text style={styles.industryPillText}>{industry}</Text>
                                </View>
                            ) : null}
                        </View>
                    </View>

                    {/* Body */}
                    <View style={styles.body}>
                        {/* ACCOUNT */}
                        <SectionHeader title="ACCOUNT" />
                        <View style={styles.card}>
                            <ProfileRow
                                icon="person-outline"
                                iconBg={COLORS.buttonDarkSoft}
                                iconColor={COLORS.buttonDark}
                                title="Edit Profile"
                                subtitle="Update your organisation details and logo"
                                onPress={() => setEditProfileVisible(true)}
                            />
                            <View style={styles.divider} />
                            <ProfileRow
                                icon="business-outline"
                                iconBg={COLORS.primarySoft}
                                iconColor={COLORS.buttonDark}
                                title="Account Details"
                                subtitle={`Industry: ${industry || "Not provided"} · Budget: ${parseAmount(fundingBudget) != null ? `R${parseAmount(fundingBudget).toLocaleString("en-ZA")}` : "Not provided"}`}
                                onPress={() => setAccountDetailsVisible(true)}
                            />
                            <View style={styles.divider} />
                            <ProfileRow
                                icon="heart-outline"
                                iconBg={COLORS.emeraldSoft}
                                iconColor={COLORS.emerald}
                                title="Preferred Causes"
                                subtitle={formatCauses(preferredCauses) || "Not provided"}
                                onPress={() => setCausesVisible(true)}
                            />
                        </View>

                        {/* PREFERENCES */}
                        <SectionHeader title="PREFERENCES" />
                        <View style={styles.card}>
                            <View style={styles.notificationsBlock}>
                                <View style={styles.rowIconTitleOnly}>
                                    <View style={[styles.rowIcon, { backgroundColor: COLORS.primarySoft }]}>
                                        <Ionicons name="notifications-outline" size={20} color={COLORS.buttonDark} />
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
                                            trackColor={{ false: COLORS.border, true: COLORS.buttonDark }}
                                            thumbColor={COLORS.white}
                                        />
                                    </View>
                                    <View style={styles.toggleRow}>
                                        <Text style={styles.toggleLabel}>Messages</Text>
                                        <Switch
                                            value={notifMessages}
                                            onValueChange={setNotifMessages}
                                            trackColor={{ false: COLORS.border, true: COLORS.buttonDark }}
                                            thumbColor={COLORS.white}
                                        />
                                    </View>
                                    <View style={styles.toggleRow}>
                                        <Text style={styles.toggleLabel}>Offers</Text>
                                        <Switch
                                            value={notifOffers}
                                            onValueChange={setNotifOffers}
                                            trackColor={{ false: COLORS.border, true: COLORS.buttonDark }}
                                            thumbColor={COLORS.white}
                                        />
                                    </View>
                                    <View style={[styles.toggleRow, styles.toggleRowLast]}>
                                        <Text style={styles.toggleLabel}>Platform Updates</Text>
                                        <Switch
                                            value={notifUpdates}
                                            onValueChange={setNotifUpdates}
                                            trackColor={{ false: COLORS.border, true: COLORS.buttonDark }}
                                            thumbColor={COLORS.white}
                                        />
                                    </View>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <ProfileRow
                                icon="shield-checkmark-outline"
                                iconBg={COLORS.buttonDarkSoft}
                                iconColor={COLORS.buttonDark}
                                title="Two-Factor Authentication"
                                subtitle={twoFactorEnabled ? "Enabled" : "Disabled — tap to enable"}
                                right={
                                    <Switch
                                        value={twoFactorEnabled}
                                        onValueChange={setTwoFactorEnabled}
                                        trackColor={{ false: COLORS.border, true: COLORS.buttonDark }}
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
                                iconColor={COLORS.textSecondary}
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
                                onPress={() => setDeleteVisible(true)}
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
            </View>

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

            <AccountDetailsModal
                visible={accountDetailsVisible}
                onClose={() => setAccountDetailsVisible(false)}
                onSave={handleSaveAccountDetails}
                initialIndustry={industry}
                initialBudget={fundingBudget}
            />

            <PreferredCausesModal
                visible={causesVisible}
                onClose={() => setCausesVisible(false)}
                onSave={handleSaveCauses}
                initialCauses={preferredCauses}
            />

            <DeleteAccountModal
                visible={deleteVisible}
                onClose={() => setDeleteVisible(false)}
                onConfirm={handleDeleteAccount}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.buttonDark, // Matches the notch to the dark green header
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.background, // The rest of the screen is cream
    },
    centered: {
        justifyContent: "center",
        alignItems: "center",
    },
    scrollContent: {
        paddingBottom: 40,
    },

    /* ─── HEADER BLOCK ─── */
    headerBlock: {
        backgroundColor: COLORS.buttonDark,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        paddingBottom: 36,
        marginBottom: 24,
        ...softShadow,
    },
    topHeader: {
        alignItems: "center",
        paddingVertical: 20,
    },
    headerTitle: {
        fontFamily: "Manrope_700Bold",
        fontSize: 14,
        color: COLORS.white,
        letterSpacing: 2,
    },
    profileHeaderContent: {
        alignItems: "center",
        paddingHorizontal: 24,
    },
    avatarWrapper: {
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary, // Luxury Gold background
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: "rgba(255,255,255,0.15)",
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: "rgba(255,255,255,0.15)",
    },
    avatarText: {
        fontFamily: "Manrope_700Bold",
        color: COLORS.buttonDark,
        fontSize: 32,
    },
    editBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: COLORS.primary, // Gold edit button
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: COLORS.buttonDark,
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 6,
    },
    orgName: {
        fontFamily: "Manrope_700Bold",
        fontSize: 24,
        color: COLORS.white,
        letterSpacing: -0.5,
    },
    verifiedIcon: {
        marginLeft: 6,
    },
    email: {
        fontFamily: "Manrope_500Medium",
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.7)",
        marginBottom: 16,
    },
    industryPill: {
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.15)",
    },
    industryPillText: {
        fontFamily: "Manrope_600SemiBold",
        fontSize: 12,
        color: COLORS.primary, // Gold text
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },

    /* ─── BODY ─── */
    body: {
        paddingHorizontal: 24,
    },
    sectionHeader: {
        fontFamily: "Manrope_700Bold",
        fontSize: 13,
        color: COLORS.textSecondary,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        marginBottom: 12,
        marginTop: 8,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: "hidden",
        marginBottom: 28,
        ...softShadow,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.background, // Matches screen bg to look clean
        marginLeft: 70, // Aligns perfectly with the text
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    rowIconTitleOnly: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        paddingBottom: 8,
    },
    rowIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    rowContent: {
        flex: 1,
        marginRight: 8,
    },
    rowTitle: {
        fontFamily: "Manrope_700Bold",
        fontSize: 16,
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    rowSubtitle: {
        fontFamily: "Manrope_500Medium",
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
    notificationsBlock: {
        paddingBottom: 8,
    },
    toggleList: {
        paddingHorizontal: 16,
        paddingLeft: 76, 
    },
    toggleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.background,
    },
    toggleRowLast: {
        borderBottomWidth: 0,
    },
    toggleLabel: {
        fontFamily: "Manrope_600SemiBold",
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    footer: {
        alignItems: "center",
        paddingVertical: 16,
        paddingBottom: 16,
    },
    footerText: {
        fontFamily: "Manrope_500Medium",
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: "center",
    },
});