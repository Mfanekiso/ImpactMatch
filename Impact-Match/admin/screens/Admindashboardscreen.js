import React from "react";
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import StatCard from "../components/StatCard";
import { COLORS } from "../theme";
import { MOCK_STATS, MOCK_SPONSORS } from "../mockData";
import { formatCurrencyShort } from "../utils";

export default function AdminDashboardScreen({ navigation }) {
    const stats = MOCK_STATS;
    const pending = MOCK_SPONSORS.filter((s) => s.status === "pending");

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.heading}>Admin Dashboard</Text>
            <Text style={styles.sub}>Overview of your platform</Text>

            <View style={styles.statsRow}>
                <StatCard
                    value={stats.totalSponsors}
                    label="Sponsors"
                    bg={COLORS.primaryBg}
                    color={COLORS.primary}
                />
                <StatCard
                    value={stats.pendingApprovals}
                    label="Pending approval"
                    bg={COLORS.warningBg}
                    color={COLORS.warning}
                />
                <StatCard
                    value={stats.activeUsers}
                    label="Active users"
                    bg={COLORS.dangerBg}
                    color={COLORS.danger}
                />
                <StatCard
                    value={formatCurrencyShort(stats.fundingDeployed)}
                    label="Funding"
                    bg={COLORS.successBg}
                    color={COLORS.success}
                />
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Needs your attention</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Sponsors")}>
                    <Text style={styles.link}>View all</Text>
                </TouchableOpacity>
            </View>

            {pending.length === 0 ? (
                <Text style={styles.empty}>Nothing waiting for approval.</Text>
            ) : (
                pending.map((s) => (
                    <TouchableOpacity
                        key={s.id}
                        style={styles.pendingItem}
                        onPress={() => navigation.navigate("Sponsors")}
                    >
                        <Text style={styles.pendingName}>{s.name}</Text>
                        <Text style={styles.pendingMeta}>
                            {s.type} · {s.location}
                        </Text>
                    </TouchableOpacity>
                ))
            )}

            <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.navigate("SponsorForm")}
            >
                <Text style={styles.primaryBtnText}>+ Add sponsor</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: 16, paddingBottom: 40 },
    heading: { fontSize: 24, fontWeight: "bold", color: COLORS.text },
    sub: { fontSize: 14, color: COLORS.textMuted, marginBottom: 16, marginTop: 2 },
    statsRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 8,
        marginBottom: 10,
    },
    sectionTitle: { fontSize: 17, fontWeight: "bold", color: COLORS.text },
    link: { color: COLORS.primary, fontWeight: "600" },
    empty: { color: COLORS.textMuted, marginBottom: 12 },
    pendingItem: {
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
    },
    pendingName: { fontSize: 15, fontWeight: "600", color: COLORS.text },
    pendingMeta: { fontSize: 13, color: COLORS.textMuted, marginTop: 3 },
    primaryBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 16,
    },
    primaryBtnText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 15 },
});