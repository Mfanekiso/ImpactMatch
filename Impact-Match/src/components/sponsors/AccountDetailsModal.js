import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Alert, StyleSheet } from "react-native";

import SheetModal from "./SheetModal";
import { parseAmount } from "../../utils/matchScore";

const COLORS = {
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    border: "#E5E7EB",
    white: "#FFFFFF",
    muted: "#94A3B8",
};

// Edit industry + annual funding budget.
// onSave receives { industry: string, fundingBudget: number }
export default function AccountDetailsModal({ visible, onClose, onSave, initialIndustry, initialBudget }) {
    const [industry, setIndustry] = useState("");
    const [budget, setBudget] = useState("");
    const [saving, setSaving] = useState(false);

    // Reset the form to the saved values every time the modal opens
    useEffect(() => {
        if (visible) {
            setIndustry(initialIndustry || "");
            const amount = parseAmount(initialBudget);
            setBudget(amount != null ? String(amount) : "");
        }
    }, [visible, initialIndustry, initialBudget]);

    const handleSave = async () => {
        const amount = parseAmount(budget);

        if (!industry.trim()) {
            Alert.alert("Missing Information", "Please enter your industry.");
            return;
        }
        if (amount == null || amount <= 0) {
            Alert.alert("Invalid Budget", "Please enter your annual funding budget as a number, e.g. 500000.");
            return;
        }

        setSaving(true);
        try {
            await onSave({ industry: industry.trim(), fundingBudget: amount });
        } finally {
            setSaving(false);
        }
    };

    return (
        <SheetModal
            visible={visible}
            title="Account Details"
            onClose={onClose}
            onSave={handleSave}
            saving={saving}
        >
            <Text style={styles.label}>Industry</Text>
            <TextInput
                style={styles.input}
                value={industry}
                onChangeText={setIndustry}
                placeholder="e.g. Technology, Finance, Retail"
                placeholderTextColor={COLORS.muted}
            />

            <Text style={[styles.label, { marginTop: 18 }]}>Annual Funding Budget (Rand)</Text>
            <TextInput
                style={styles.input}
                value={budget}
                onChangeText={setBudget}
                keyboardType="numeric"
                placeholder="e.g. 500000"
                placeholderTextColor={COLORS.muted}
            />
            <Text style={styles.hint}>
                Used to match you with NGOs whose funding need fits your budget.
            </Text>
        </SheetModal>
    );
}

const styles = StyleSheet.create({
    label: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 8 },
    input: {
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
        paddingHorizontal: 14,
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    hint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8 },
});