import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";

export default function SponsorCard({ sponsor, onPress }) {
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
        >
            <View style={styles.topRow}>
                <View style={styles.info}>
                    <Text style={styles.name}>
                        {sponsor.name}
                    </Text>

                    <Text style={styles.type}>
                        {sponsor.type}
                    </Text>
                </View>

                <View style={styles.scoreContainer}>
                    <Text style={styles.score}>
                        {sponsor.matchScore}%
                    </Text>

                    <Text style={styles.matchText}>
                        Match
                    </Text>
                </View>
            </View>

            <Text style={styles.location}>
                📍 {sponsor.location}
            </Text>

            <Text style={styles.causes}>
                {sponsor.causes.join(" • ")}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        padding: 16,
        marginBottom: 15,
    },

    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    info: {
        flex: 1,
        paddingRight: 10,
    },

    name: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 4,
    },

    type: {
        fontSize: 14,
        color: "#6B7280",
    },

    scoreContainer: {
        alignItems: "center",
        justifyContent: "center",
        minWidth: 55,
    },

    score: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#2563EB",
    },

    matchText: {
        fontSize: 11,
        color: "#6B7280",
    },

    location: {
        fontSize: 14,
        color: "#4B5563",
        marginTop: 15,
        marginBottom: 8,
    },

    causes: {
        fontSize: 14,
        color: "#2563EB",
    },
});