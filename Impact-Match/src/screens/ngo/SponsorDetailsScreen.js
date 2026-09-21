import React from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from "react-native";

export default function SponsorDetailsScreen({ route, navigation }) {
    const { sponsor } = route.params;

    const handleShortlist = () => {
        Alert.alert(
            "Sponsor Shortlisted",
            `${sponsor.name} has been added to your shortlist.`
        );
    };

    const handleInterest = () => {
        Alert.alert(
            "Interest Sent",
            `Your interest has been sent to ${sponsor.name}.`
        );
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            <Text style={styles.name}>{sponsor.name}</Text>

            <Text style={styles.type}>
                {sponsor.type}
            </Text>

            {/* Match Score */}
            <View style={styles.matchCard}>
                <Text style={styles.matchScore}>
                    {sponsor.matchScore}%
                </Text>

                <Text style={styles.matchLabel}>
                    Match Score
                </Text>
            </View>

            {/* About */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>

                <Text style={styles.description}>
                    {sponsor.description}
                </Text>
            </View>

            {/* Location */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Location</Text>

                <Text style={styles.detailText}>
                    📍 {sponsor.location}
                </Text>
            </View>

            {/* Causes */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    Preferred Causes
                </Text>

                <View style={styles.causesContainer}>
                    {sponsor.causes.map((cause) => (
                        <View
                            key={cause}
                            style={styles.causeTag}
                        >
                            <Text style={styles.causeText}>
                                {cause}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Funding */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    Funding Range
                </Text>

                <Text style={styles.detailText}>
                    {sponsor.budget}
                </Text>
            </View>

            {/* Actions */}
            <TouchableOpacity
                style={styles.shortlistButton}
                onPress={handleShortlist}
            >
                <Text style={styles.shortlistButtonText}>
                    ♡ Shortlist Sponsor
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.interestButton}
                onPress={handleInterest}
            >
                <Text style={styles.interestButtonText}>
                    Express Interest
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.backButtonText}>
                    ← Back to Sponsors
                </Text>
            </TouchableOpacity>
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

    name: {
        fontSize: 30,
        fontWeight: "bold",
        marginBottom: 5,
    },

    type: {
        fontSize: 16,
        color: "#6B7280",
        marginBottom: 25,
    },

    matchCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 15,
        padding: 25,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginBottom: 25,
    },

    matchScore: {
        fontSize: 42,
        fontWeight: "bold",
        color: "#2563EB",
    },

    matchLabel: {
        fontSize: 15,
        color: "#6B7280",
        marginTop: 5,
    },

    section: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 18,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginBottom: 15,
    },

    sectionTitle: {
        fontSize: 17,
        fontWeight: "bold",
        marginBottom: 10,
    },

    description: {
        fontSize: 15,
        lineHeight: 23,
        color: "#4B5563",
    },

    detailText: {
        fontSize: 15,
        color: "#4B5563",
    },

    causesContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },

    causeTag: {
        backgroundColor: "#DBEAFE",
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
    },

    causeText: {
        color: "#2563EB",
        fontSize: 13,
        fontWeight: "600",
    },

    shortlistButton: {
        borderWidth: 1,
        borderColor: "#2563EB",
        padding: 16,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
        marginBottom: 12,
    },

    shortlistButtonText: {
        color: "#2563EB",
        fontSize: 16,
        fontWeight: "bold",
    },

    interestButton: {
        backgroundColor: "#2563EB",
        padding: 16,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 20,
    },

    interestButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold",
    },

    backButton: {
        alignItems: "center",
        padding: 10,
    },

    backButtonText: {
        color: "#6B7280",
        fontSize: 15,
    },
});