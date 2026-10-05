import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Image,
    ActivityIndicator,
    Alert,
    Platform,
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

// Firebase imports
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";
import { auth, db } from "../../../Backend/firebaseConfig";

// ─── LUXURY COLOR PALETTE ───────────────────────────────────────────────
const COLORS = {
    background: "#F8F6EE",       // Cream base
    surface: "#FFFFFF",          // Clean white
    primary: "#D9C982",          // Soft Luxury Gold
    primarySoft: "rgba(217, 201, 130, 0.2)",
    emerald: "#059669",          // Vibrant Emerald for accents/success
    emeraldSoft: "rgba(5, 150, 105, 0.08)",
    textPrimary: "#433327",      // Warm Bronze
    textSecondary: "#8C7A6B",    // Muted taupe
    border: "#E8DFD5",
    white: "#FFFFFF",
    danger: "#DC2626",           // Richer red for sign out
    dangerSoft: "rgba(220, 38, 38, 0.1)",
};

const softShadow = {
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
};

export default function NGOProfileScreen({ navigation }) {
    const [fontsLoaded] = useFonts({
        Manrope_400Regular,
        Manrope_500Medium,
        Manrope_600SemiBold,
        Manrope_700Bold,
    });

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const uid = auth.currentUser?.uid;

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

    const getInitials = (name) => {
        if (!name) return "NGO";
        return name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .substring(0, 3);
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigation.replace("Login");
        } catch (error) {
            Alert.alert("Sign Out Failed", error.message);
        }
    };

    if (!fontsLoaded) {
        return null;
    }

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, styles.centered]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    const {
        full_name,
        email,
        organisationName,
        location,
        mission,
        fundingRequired,
        targetCommunity,
        profileImageUrl,
    } = profile || {};

    const profileMenuItems = [
        { id: "1", title: "Organisation Details", subtitle: organisationName || "Not provided", icon: "business" },
        { id: "2", title: "Mission & Causes", subtitle: mission || "Not provided", icon: "heart" },
        { id: "3", title: "Funding Requirements", subtitle: fundingRequired ? `R${fundingRequired}` : "Not provided", icon: "wallet" },
        { id: "4", title: "Communities Served", subtitle: targetCommunity || "Not provided", icon: "people" },
        { id: "5", title: "Contact", subtitle: email || "Not provided", icon: "mail" },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=1000" }}
                        style={styles.coverImage}
                        resizeMode="cover"
                    />
                    <View style={styles.coverOverlay} />
                </View>

                <View style={styles.profileHeader}>
                    <TouchableOpacity
                        style={styles.avatarContainer}
                        activeOpacity={0.8}
                        onPress={handlePickImage}
                        disabled={uploading}
                    >
                        {profileImageUrl ? (
                            <Image source={{ uri: profileImageUrl }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{getInitials(organisationName)}</Text>
                            </View>
                        )}

                        <View style={styles.cameraBadge}>
                            {uploading ? (
                                <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                                <Ionicons name="camera" size={14} color={COLORS.white} />
                            )}
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.editButton} onPress={handlePickImage}>
                        <Text style={styles.editButtonText}>{profileImageUrl ? "Change Photo" : "Add Photo"}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.nameSection}>
                    <View style={styles.nameRow}>
                        <Text style={styles.organisationName}>{organisationName || full_name || "Your Organisation"}</Text>
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={14} color={COLORS.emerald} />
                            <Text style={styles.verifiedText}>NGO</Text>
                        </View>
                    </View>
                    <Text style={styles.locationText}>
                        <Ionicons name="location-outline" size={14} color={COLORS.primary} />{" "}
                        {location || "Location not provided"}
                    </Text>
                </View>

                <View style={styles.menuContainer}>
                    {profileMenuItems.map((item, index) => (
                        <View key={item.id} style={[styles.menuItem, index === profileMenuItems.length - 1 && styles.menuItemLast]}>
                            <View style={styles.menuIconWrapper}>
                                <Ionicons name={item.icon} size={20} color={COLORS.primary} />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={COLORS.border} />
                        </View>
                    ))}
                </View>

                <TouchableOpacity style={styles.signOutButton} activeOpacity={0.85} onPress={handleSignOut}>
                    <View style={styles.signOutIconWrapper}>
                        <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
                    </View>
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: COLORS.background 
    },
    centered: { 
        justifyContent: "center", 
        alignItems: "center" 
    },
    scrollContent: { 
        paddingBottom: 120 
    },
    imageContainer: {
        position: 'relative',
    },
    coverImage: { 
        width: "100%", 
        height: 180,
    },
    coverOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(67, 51, 39, 0.1)', 
    },
    profileHeader: { 
        flexDirection: "row", 
        justifyContent: "space-between", 
        alignItems: "flex-end", 
        paddingHorizontal: 24, 
        marginTop: -45 
    },
    avatarContainer: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: COLORS.surface,
        alignItems: "center",
        justifyContent: "center",
        padding: 4,
        ...softShadow,
    },
    avatarImage: { 
        width: 82, 
        height: 82, 
        borderRadius: 41 
    },
    avatar: { 
        width: 82, 
        height: 82, 
        borderRadius: 41, 
        backgroundColor: COLORS.primarySoft, 
        alignItems: "center", 
        justifyContent: "center" 
    },
    avatarText: { 
        fontFamily: "Manrope_700Bold",
        color: COLORS.textPrimary, 
        fontSize: 24, 
    },
    cameraBadge: { 
        position: "absolute", 
        bottom: 0, 
        right: 0, 
        width: 28, 
        height: 28, 
        borderRadius: 14, 
        backgroundColor: COLORS.emerald, 
        alignItems: "center", 
        justifyContent: "center", 
        borderWidth: 2, 
        borderColor: COLORS.surface 
    },
    editButton: { 
        backgroundColor: COLORS.surface, 
        paddingHorizontal: 20, 
        paddingVertical: 10, 
        borderRadius: 24, 
        borderWidth: 1, 
        borderColor: COLORS.border,
        ...softShadow,
        marginBottom: 4,
    },
    editButtonText: { 
        fontFamily: "Manrope_700Bold",
        fontSize: 13, 
        color: COLORS.textPrimary,
        letterSpacing: 0.3,
    },
    nameSection: { 
        paddingHorizontal: 24, 
        marginTop: 20,
        marginBottom: 8,
    },
    nameRow: { 
        flexDirection: "row", 
        alignItems: "center", 
        flexWrap: "wrap", 
        gap: 10, 
        marginBottom: 6 
    },
    organisationName: { 
        fontFamily: "Manrope_700Bold",
        fontSize: 26, 
        color: COLORS.textPrimary,
        letterSpacing: -0.5,
    },
    verifiedBadge: { 
        flexDirection: "row", 
        alignItems: "center", 
        backgroundColor: COLORS.emeraldSoft, 
        paddingHorizontal: 10, 
        paddingVertical: 4, 
        borderRadius: 12, 
        gap: 4 
    },
    verifiedText: { 
        fontFamily: "Manrope_700Bold",
        fontSize: 12, 
        color: COLORS.emerald,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    locationText: { 
        fontFamily: "Manrope_500Medium",
        fontSize: 15, 
        color: COLORS.textSecondary,
    },
    menuContainer: { 
        backgroundColor: COLORS.surface, 
        marginHorizontal: 24, 
        marginTop: 24, 
        borderRadius: 24, 
        borderWidth: 1, 
        borderColor: COLORS.border, 
        overflow: "hidden",
        ...softShadow,
    },
    menuItem: { 
        flexDirection: "row", 
        alignItems: "center", 
        padding: 20, 
        borderBottomWidth: 1, 
        borderBottomColor: COLORS.border 
    },
    menuItemLast: { 
        borderBottomWidth: 0 
    },
    menuIconWrapper: { 
        width: 44, 
        height: 44, 
        borderRadius: 14, 
        backgroundColor: COLORS.primarySoft, 
        alignItems: "center", 
        justifyContent: "center", 
        marginRight: 16 
    },
    menuContent: { 
        flex: 1 
    },
    menuTitle: { 
        fontFamily: "Manrope_700Bold",
        fontSize: 15, 
        color: COLORS.textPrimary, 
        marginBottom: 4 
    },
    menuSubtitle: { 
        fontFamily: "Manrope_400Regular",
        fontSize: 14, 
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    signOutButton: { 
        flexDirection: "row",
        alignItems: "center", 
        justifyContent: "center",
        backgroundColor: COLORS.dangerSoft,
        marginHorizontal: 24,
        marginTop: 32, 
        paddingVertical: 16,
        borderRadius: 20,
    },
    signOutIconWrapper: {
        marginRight: 8,
    },
    signOutText: { 
        fontFamily: "Manrope_700Bold",
        fontSize: 16, 
        color: COLORS.danger,
        letterSpacing: 0.3,
    },
});