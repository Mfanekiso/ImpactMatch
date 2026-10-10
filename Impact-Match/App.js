import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import NetInfo from "@react-native-community/netinfo";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import AppNavigator from "./src/navigation/AppNavigator";
import { auth, db } from "./Backend/firebaseConfig";
import { cacheProfile, readCachedProfile } from "./src/utils/profileCache";
import { flushOfflineWrites } from "./src/utils/offlineWrites";

export default function App() {
    const [boot, setBoot] = useState(null);
    const [offline, setOffline] = useState(false);

    useEffect(() => {
        const unsubscribeNetwork = NetInfo.addEventListener((state) => {
            setOffline(state.isConnected === false || state.isInternetReachable === false);
            if (state.isConnected && state.isInternetReachable !== false) flushOfflineWrites();
        });
        let initialized = false;
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (initialized) return;
            initialized = true;
            if (!user) {
                setBoot({ initialRouteName: "Welcome" });
                return;
            }

            let profile = await readCachedProfile(user.uid);
            const network = await NetInfo.fetch();
            if (network.isConnected !== false && network.isInternetReachable !== false) {
                try {
                    const snapshot = await Promise.race([
                        getDoc(doc(db, "users", user.uid)),
                        new Promise((_, reject) => setTimeout(() => reject(new Error("Profile request timed out")), 4000)),
                    ]);
                    if (snapshot.exists()) {
                        profile = snapshot.data();
                        await cacheProfile(user.uid, profile);
                    }
                } catch (error) {
                    // Cached profile lets a returning user enter the app offline.
                }
            }

            let initialRouteName = "UserType";
            let initialRouteParams = { uid: user.uid };
            if (profile?.role && !profile.profileCompleted) {
                initialRouteName = profile.role === "ngo" ? "NGOSetup" : "SponsorSetup";
                initialRouteParams = { uid: user.uid, role: profile.role };
            } else if (profile?.role) {
                initialRouteName = profile.role === "ngo" ? "MainTabs" : "SponsorTabs";
                initialRouteParams = {
                    screen: "Home",
                    params: { organisationName: profile.organisationName, user: profile },
                };
            }
            setBoot({ initialRouteName, initialRouteParams });
        });
        return () => {
            unsubscribeNetwork();
            unsubscribeAuth();
        };
    }, []);

    if (!boot) {
        return <View style={styles.loading}><ActivityIndicator size="large" color="#059669" /></View>;
    }

    return (
        <SafeAreaView style={styles.app}>
            <AppNavigator {...boot} />
            {offline && <OfflineNotice />}
        </SafeAreaView>
    );
}

function OfflineNotice() {
    const entrance = useRef(new Animated.Value(0)).current;
    const hover = useRef(new Animated.Value(1)).current;
    const animateHover = (value) => Animated.spring(hover, {
        toValue: value,
        useNativeDriver: true,
        damping: 18,
        stiffness: 220,
    }).start();

    useEffect(() => {
        Animated.spring(entrance, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 180 }).start();
    }, [entrance]);

    return (
        <Animated.View
            accessibilityLiveRegion="polite"
            style={[styles.offlineBanner, {
                opacity: entrance,
                transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }, { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }],
            }]}
        >
            <Pressable
                onHoverIn={() => animateHover(1.015)}
                onHoverOut={() => animateHover(1)}
                accessibilityRole="summary"
                accessibilityLabel="No internet connection. You can keep browsing. Some actions will finish when you’re connected again."
            >
                <Animated.View style={[styles.offlineCard, { transform: [{ scale: hover }] }]}>
                    <View style={styles.offlineIcon}><Ionicons name="cloud-offline-outline" size={20} color="#9A5B12" /></View>
                    <View style={styles.offlineCopy}>
                        <Text style={styles.offlineTitle}>No internet connection</Text>
                        <Text style={styles.offlineText}>You can keep browsing. Some actions will finish when you’re connected again.</Text>
                    </View>
                </Animated.View>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    app: { flex: 1, backgroundColor: "#F8F6EE" },
    loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8F6EE" },
    offlineBanner: { position: "absolute", top: 9, left: 16, right: 16, zIndex: 20 },
    offlineCard: { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: "#FFFEFA", borderRadius: 18, borderWidth: 1, borderColor: "#E8DCC5", shadowColor: "#433327", shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 7 },
    offlineIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: "#FBF1DD", borderWidth: 1, borderColor: "#F0E1C1", alignItems: "center", justifyContent: "center", marginRight: 12 },
    offlineCopy: { flex: 1 },
    offlineTitle: { color: "#35291F", fontWeight: "700", fontSize: 14, letterSpacing: 0.1, marginBottom: 4 },
    offlineText: { color: "#756656", fontSize: 12, lineHeight: 17 },
});
