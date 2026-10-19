import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function StatCard({ value, label, bg, color }) {
    return (
        <View style={[styles.card, { backgroundColor: bg }]}>
            <Text style={[styles.value, { color }]}>{value}</Text>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexBasis: "48%",
        flexGrow: 1,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    value: { fontSize: 24, fontWeight: "bold" },
    label: { fontSize: 13, color: "#4B5563", marginTop: 4 },
});