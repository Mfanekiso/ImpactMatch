import React from "react";
import { View, Text, StyleSheet } from "react-native";

// TODO: build out full Discover/search experience (filters, cause chips,
// full opportunities list) — reuse `src/data/opportunities.js`.
export default function SponsorDiscoverScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Discover Screen</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F9FAFB" },
    text: { fontSize: 20, fontWeight: "600" },
});