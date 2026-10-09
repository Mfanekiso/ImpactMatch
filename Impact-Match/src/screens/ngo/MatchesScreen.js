import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

// ─── LUXURY COLOR PALETTE ───────────────────────────────────────────────
const COLORS = {
    background: "#F8F6EE",       // Cream base
    surface: "#FFFFFF",          // Clean white
    primary: "#D9C982",          // Soft Luxury Gold
    primarySoft: "rgba(217, 201, 130, 0.2)",
    emerald: "#059669",          // Vibrant Emerald for actions
    textPrimary: "#433327",      // Warm Bronze instead of harsh black
    textSecondary: "#8C7A6B",    // Muted taupe for secondary text
    placeholder: "#B8A99A",
    border: "#E8DFD5",
    white: "#FFFFFF",
};

export default function MatchesScreen({ navigation }) {
    const [searchQuery, setSearchQuery] = useState("");

    const handleCheckAgain = () => {
        // Trigger a refresh of sponsor matches
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Matches</Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color={COLORS.placeholder} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search sponsors or NGOs..."
                    placeholderTextColor={COLORS.placeholder}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            {/* Empty State */}
            <View style={styles.emptyState}>
                <View style={styles.emptyIconWrapper}>
                    <Ionicons
                        name="people-outline" // Swapped to people to match the tab icon theme
                        size={42}
                        color={COLORS.primary}
                    />
                </View>

                <Text style={styles.emptyTitle}>No Matches Available</Text>
                <Text style={styles.emptySubtitle}>
                    There are no active or available sponsors currently. Please check again later.
                </Text>

                {/* Added the missing refresh button from your styles to complete the UI */}
                <TouchableOpacity
                    style={styles.refreshButton}
                    activeOpacity={0.85}
                    onPress={handleCheckAgain}
                >
                    <Ionicons 
                        name="refresh" 
                        size={18} 
                        color={COLORS.white} 
                        style={styles.refreshButtonIcon} 
                    />
                    <Text style={styles.refreshButtonText}>Check Again</Text>
                </TouchableOpacity>
            </View>
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
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: "700",
        color: COLORS.textPrimary,
        letterSpacing: -0.5,
    },

    /* Search */
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        height: 52,
        marginHorizontal: 24,
        marginBottom: 16,
        paddingHorizontal: 18,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 26, // fully rounded for a softer look
        shadowColor: COLORS.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        color: COLORS.textPrimary,
        paddingVertical: 0,
    },

    /* Empty state */
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
        paddingBottom: 80, // give space for the larger bottom nav
    },
    emptyIconWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50, // perfect circle
        backgroundColor: COLORS.primarySoft,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 10,
    },
    emptySubtitle: {
        fontSize: 15,
        lineHeight: 24,
        color: COLORS.textSecondary,
        textAlign: "center",
        marginBottom: 32,
    },
    refreshButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: 56,
        paddingHorizontal: 32,
        borderRadius: 28, // luxury pill shape
        backgroundColor: COLORS.emerald, // pops beautifully against cream
        shadowColor: COLORS.emerald,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    refreshButtonIcon: {
        marginRight: 10,
    },
    refreshButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
});