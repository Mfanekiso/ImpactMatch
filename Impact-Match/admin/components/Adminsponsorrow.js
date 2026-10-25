import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import StatusBadge from "./StatusBadge";
import { COLORS } from "../theme";

export default function AdminSponsorRow({ sponsor, onEdit, onApprove, onReject }) {
    const isPending = sponsor.status === "pending";

    return (
        <View style={styles.card}>
            <View style={styles.topRow}>
                <View style={styles.info}>
                    <Text style={styles.name}>{sponsor.name}</Text>
                    <Text style={styles.meta}>
                        {sponsor.type} · {sponsor.location}
                    </Text>
                </View>
                <StatusBadge status={sponsor.status} />
            </View>

            <Text style={styles.causes}>{(sponsor.causes ?? []).join(" • ")}</Text>

            <View style={styles.actions}>
                {isPending && (
                    <>
                        <TouchableOpacity
                            style={[styles.btn, styles.approve]}
                            onPress={onApprove}
                        >
                            <Text style={[styles.btnText, { color: COLORS.success }]}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.btn, styles.reject]}
                            onPress={onReject}
                        >
                            <Text style={[styles.btnText, { color: COLORS.danger }]}>Reject</Text>
                        </TouchableOpacity>
                    </>
                )}
                <TouchableOpacity style={[styles.btn, styles.edit]} onPress={onEdit}>
                    <Text style={[styles.btnText, { color: COLORS.primary }]}>Edit</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    topRow: { flexDirection: "row", justifyContent: "space-between" },
    info: { flex: 1, paddingRight: 10 },
    name: { fontSize: 17, fontWeight: "bold", color: COLORS.text },
    meta: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
    causes: { fontSize: 13, color: COLORS.primary, marginTop: 10 },
    actions: { flexDirection: "row", marginTop: 14 },
    btn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 8,
    },
    btnText: { fontSize: 13, fontWeight: "600" },
    approve: { backgroundColor: COLORS.successBg },
    reject: { backgroundColor: COLORS.dangerBg },
    edit: { backgroundColor: COLORS.primaryBg },
});