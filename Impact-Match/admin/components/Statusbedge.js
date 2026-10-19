import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../theme";

const STYLES = {
    approved: { bg: COLORS.successBg, fg: COLORS.success, label: "Approved" },
    pending: { bg: COLORS.warningBg, fg: COLORS.warning, label: "Pending" },
    rejected: { bg: COLORS.dangerBg, fg: COLORS.danger, label: "Rejected" },
};

export default function StatusBadge({ status }) {
    const s = STYLES[status] ?? STYLES.pending;
    return (
        <View style={[styles.badge, { backgroundColor: s.bg }]}>
            <Text style={[styles.text, { color: s.fg }]}>{s.label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    text: { fontSize: 12, fontWeight: "600" },
});