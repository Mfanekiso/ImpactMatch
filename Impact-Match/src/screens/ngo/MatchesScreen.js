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

const COLORS = {
    background: "#FFFFFF",
    surface: "#F9FAFB",
    border: "#E5E7EB",
    primary: "#10B981",
    primaryLight: "rgba(16, 185, 129, 0.10)",
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    placeholder: "#94A3B8",
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
                <Ionicons name="search-outline" size={18} color={COLORS.placeholder} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search sponsors or NGOs"
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
                        name="business-outline"
                        size={38}
                        color={COLORS.primary}
                    />
                </View>

                <Text style={styles.emptyTitle}>No Sponsors Available</Text>
                <Text style={styles.emptySubtitle}>
                    There are no active or available sponsors currently. Please check again later.
                </Text>

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
        paddingTop: 12,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },

    /* Search */
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        height: 48,
        marginHorizontal: 24,
        marginBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: COLORS.surface,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: 14,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: COLORS.textPrimary,
        paddingVertical: 0,
    },

    /* Empty state */
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
        paddingBottom: 60,
    },
    emptyIconWrapper: {
        width: 88,
        height: 88,
        borderRadius: 28,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        lineHeight: 21,
        color: COLORS.textSecondary,
        textAlign: "center",
        marginBottom: 28,
    },
    refreshButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: 52,
        paddingHorizontal: 26,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
    },
    refreshButtonIcon: {
        marginRight: 8,
    },
    refreshButtonText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: "700",
        letterSpacing: 0.4,
    },
});