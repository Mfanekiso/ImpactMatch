import React from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from "react-native";

import sponsors from "../../data/sponsors";
import SponsorCard from "../../components/SponsorCard";

export default function NGOHomeScreen({ navigation, route }) {
    const { organisationName, location, fundingRequired } =
        route.params || {};

    const recommendedSponsors = sponsors.slice(0, 2);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            <Text style={styles.greeting}>
                Welcome back 👋
            </Text>

            <Text style={styles.organisationName}>
                {organisationName || "Your Organisation"}
            </Text>

            {/* Profile Summary */}
            <View style={styles.profileCard}>
                <Text style={styles.profileTitle}>
                    Your Organisation Profile
                </Text>

                <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>
                        Location
                    </Text>

                    <Text style={styles.profileValue}>
                        {location || "Not provided"}
                    </Text>
                </View>

                <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>
                        Funding Required
                    </Text>

                    <Text style={styles.profileValue}>
                        {fundingRequired || "Not provided"}
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={() =>
                        navigation.navigate("NGOProfile", {
                            organisationName,
                            location,
                            fundingRequired,
                        })
                    }
                >
                    <Text style={styles.profileLink}>
                        View Profile →
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Recommended Sponsors */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    Recommended Sponsors
                </Text>

                <TouchableOpacity
                    onPress={() =>
                        navigation.navigate("SponsorSearch")
                    }
                >
                    <Text style={styles.viewAll}>
                        View All
                    </Text>
                </TouchableOpacity>
            </View>

            {recommendedSponsors.map((sponsor) => (
                <SponsorCard
                    key={sponsor.id}
                    sponsor={sponsor}
                    onPress={() =>
                        navigation.navigate(
                            "SponsorDetails",
                            { sponsor }
                        )
                    }
                />
            ))}

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>
                Quick Actions
            </Text>

            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                        navigation.navigate("SponsorSearch")
                    }
                >
                    <Text style={styles.actionTitle}>
                        Find Sponsors
                    </Text>

                    <Text style={styles.actionText}>
                        Discover organisations that match your needs.
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                        navigation.navigate("Opportunities")
                    }
                >
                    <Text style={styles.actionTitle}>
                        My Opportunities
                    </Text>

                    <Text style={styles.actionText}>
                        Manage projects looking for funding.
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },

    content: {
        padding: 20,
        paddingTop: 60,
        paddingBottom: 40,
    },

    greeting: {
        fontSize: 16,
        color: "#6B7280",
        marginBottom: 5,
    },

    organisationName: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 25,
    },

    profileCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 18,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },

    profileTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 18,
    },

    profileRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },

    profileLabel: {
        fontSize: 14,
        color: "#6B7280",
    },

    profileValue: {
        fontSize: 14,
        fontWeight: "600",
        maxWidth: "55%",
        textAlign: "right",
    },

    profileLink: {
        color: "#2563EB",
        fontWeight: "bold",
        marginTop: 8,
    },

    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },

    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 15,
    },

    viewAll: {
        color: "#2563EB",
        fontWeight: "600",
        marginBottom: 15,
    },

    actionsContainer: {
        gap: 12,
    },

    actionButton: {
        backgroundColor: "#FFFFFF",
        padding: 18,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },

    actionTitle: {
        fontSize: 17,
        fontWeight: "bold",
        marginBottom: 5,
    },

    actionText: {
        fontSize: 14,
        color: "#6B7280",
        lineHeight: 20,
    },
});