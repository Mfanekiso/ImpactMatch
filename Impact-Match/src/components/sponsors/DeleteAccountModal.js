import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

import SheetModal from "./SheetModal";

const COLORS = {
    danger: "#EF4444",
    dangerLight: "rgba(239, 68, 68, 0.10)",
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    border: "#E5E7EB",
    white: "#FFFFFF",
    muted: "#94A3B8",
};

// onConfirm(password) should throw if deletion fails; the message is shown in the modal.
export default function DeleteAccountModal({ visible, onClose, onConfirm }) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [working, setWorking] = useState(false);

    useEffect(() => {
        if (visible) {
            setPassword("");
            setError("");
        }
    }, [visible]);

    const handleDelete = async () => {
        if (!password) {
            setError("Enter your password to confirm.");
            return;
        }
        setError("");
        setWorking(true);
        try {
            await onConfirm(password);
        } catch (err) {
            const code = err?.code || "";
            if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
                setError("That password is incorrect.");
            } else if (code === "auth/too-many-requests") {
                setError("Too many attempts. Please wait a moment and try again.");
            } else {
                setError(err?.message || "Could not delete your account. Please try again.");
            }
        } finally {
            setWorking(false);
        }
    };

    return (
        <SheetModal
            visible={visible}
            title="Delete Account"
            onClose={onClose}
            onSave={handleDelete}
            saveLabel="Delete My Account"
            saving={working}
            danger
        >
            <View style={styles.warning}>
                <Text style={styles.warningTitle}>This cannot be undone</Text>
                <Text style={styles.warningText}>
                    Your profile, saved NGOs and interests will be permanently deleted and you will be
                    signed out.
                </Text>
            </View>

            <Text style={styles.label}>Confirm your password</Text>
            <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholder="Password"
                placeholderTextColor={COLORS.muted}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </SheetModal>
    );
}

const styles = StyleSheet.create({
    warning: {
        backgroundColor: COLORS.dangerLight,
        borderRadius: 12,
        padding: 14,
        marginBottom: 22,
    },
    warningTitle: { fontSize: 15, fontWeight: "800", color: COLORS.danger, marginBottom: 4 },
    warningText: { fontSize: 13, lineHeight: 19, color: COLORS.textPrimary },
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
    error: { marginTop: 10, fontSize: 13, color: COLORS.danger },
});