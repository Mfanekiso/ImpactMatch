import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { CAUSE_OPTIONS } from "../../utils/causes";

const COLORS = {
    primary: "#10B981",
    primaryLight: "rgba(16, 185, 129, 0.10)",
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    border: "#E5E7EB",
    white: "#FFFFFF",
};

// Multi-select chips. `selected` is an array of cause names, `onChange` gets the new array.
export default function CauseChips({ selected = [], onChange }) {
    const toggle = (cause) => {
        if (selected.includes(cause)) {
            onChange(selected.filter((c) => c !== cause));
        } else {
            onChange([...selected, cause]);
        }
    };

    return (
        <View style={styles.wrap}>
            {CAUSE_OPTIONS.map((cause) => {
                const active = selected.includes(cause);
                return (
                    <TouchableOpacity
                        key={cause}
                        style={[styles.chip, active && styles.chipActive]}
                        activeOpacity={0.8}
                        onPress={() => toggle(cause)}
                    >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                            {cause}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { flexDirection: "row", flexWrap: "wrap" },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
        marginRight: 8,
        marginBottom: 8,
    },
    chipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    chipText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
    chipTextActive: { color: COLORS.white },
});