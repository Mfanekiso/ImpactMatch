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
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import * as ImagePicker from "expo-image-picker";

// Firebase imports
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";
import { auth, db } from "../../../Backend/firebaseConfig";

const COLORS = {
    background: "#F9FAFB",
    surface: "#FFFFFF",
    primary: "#10B981", // emerald green, matches the rest of your NGO flow
    textPrimary: "#111827",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    white: "#FFFFFF",
    danger: "#EF4444",
};

export default function NGOProfileScreen({ navigation }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const uid = auth.currentUser?.uid;

    // Fetch the real profile document straight from Firestore
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

    // Pick an image and upload it to Firebase Storage
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

            // Turn the local file into a blob so it can be uploaded
            const response = await fetch(uri);
            const blob = await response.blob();

            const storage = getStorage();
            const imageRef = ref(storage, `profileImages/${uid}`);
            await uploadBytes(imageRef, blob);

            const downloadUrl = await getDownloadURL(imageRef);

            // Save the new image URL onto the same user document
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
        { id: "1", title: "Organisation Details", subtitle: organisationName || "Not provided", icon: "business-outline" },
        { id: "2", title: "Mission & Causes", subtitle: mission || "Not provided", icon: "heart-outline" },
        { id: "3", title: "Funding Requirements", subtitle: fundingRequired ? `R${fundingRequired}` : "Not provided", icon: "cash-outline" },
        { id: "4", title: "Communities Served", subtitle: targetCommunity || "Not provided", icon: "people-outline" },
        { id: "5", title: "Contact", subtitle: email || "Not provided", icon: "mail-outline" },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Image
                    source={{ uri: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=1000" }}
                    style={styles.coverImage}
                    resizeMode="cover"
                />

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
                            <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
                            <Text style={styles.verifiedText}>NGO</Text>
                        </View>
                    </View>
                    <Text style={styles.locationText}>
                        <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />{" "}
                        {location || "Location not provided"}
                    </Text>
                </View>

                <View style={styles.menuContainer}>
                    {profileMenuItems.map((item, index) => (
                        <View key={item.id} style={[styles.menuItem, index === profileMenuItems.length - 1 && styles.menuItemLast]}>
                            <View style={styles.menuIconWrapper}>
                                <Ionicons name={item.icon} size={18} color={COLORS.primary} />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <TouchableOpacity style={styles.signOutButton} activeOpacity={0.8} onPress={handleSignOut}>
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    centered: { justifyContent: "center", alignItems: "center" },
    scrollContent: { paddingBottom: 40 },
    coverImage: { width: "100%", height: 160 },
    profileHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 20, marginTop: -40 },
avatarContainer: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
},
    avatarImage: { width: 76, height: 76, borderRadius: 38 },
    avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: "#1E3A8A", alignItems: "center", justifyContent: "center" },
    avatarText: { color: COLORS.white, fontSize: 24, fontWeight: "800" },
    cameraBadge: { position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: COLORS.white },
    editButton: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
    editButtonText: { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary },
    nameSection: { paddingHorizontal: 20, marginTop: 16 },
    nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 6 },
    organisationName: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary },
    verifiedBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(16, 185, 129, 0.1)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
    verifiedText: { fontSize: 12, fontWeight: "600", color: COLORS.primary },
    locationText: { fontSize: 14, color: COLORS.textSecondary },
    menuContainer: { backgroundColor: COLORS.white, marginHorizontal: 20, marginTop: 24, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
    menuItem: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    menuItemLast: { borderBottomWidth: 0 },
    menuIconWrapper: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(16, 185, 129, 0.1)", alignItems: "center", justifyContent: "center", marginRight: 12 },
    menuContent: { flex: 1 },
    menuTitle: { fontSize: 15, fontWeight: "600", color: COLORS.textPrimary, marginBottom: 2 },
    menuSubtitle: { fontSize: 13, color: COLORS.textSecondary },
    signOutButton: { marginTop: 32, alignItems: "center", paddingVertical: 12 },
    signOutText: { fontSize: 16, fontWeight: "600", color: COLORS.danger },
});