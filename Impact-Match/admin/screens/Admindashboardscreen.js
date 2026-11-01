import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import StatCard from "../components/StatCard";
import { COLORS } from "../theme";
import { formatCurrencyShort } from "../utils";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../Backend/firebaseConfig";

export default function AdminDashboardScreen({ navigation }) {
    const [payments, setPayments] = useState([]);
    const [sponsors, setSponsors] = useState([]);
    const [userCount, setUserCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        // 1. Listen to real payments collection
        const unsubPayments = onSnapshot(collection(db, "payments"), (snapshot) => {
            if (!mounted) return;
            const rows = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            rows.sort((a, b) => (b.paidAt?.toMillis?.() || 0) - (a.paidAt?.toMillis?.() || 0));
            setPayments(rows);
            setLoading(false);
        }, (err) => {
            console.warn("Could not listen to payments:", err?.message);
            if (mounted) setLoading(false);
        });

        // 2. Listen to sponsors collection
        const unsubSponsors = onSnapshot(collection(db, "sponsors"), (snapshot) => {
            if (!mounted) return;
            const rows = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            setSponsors(rows);
        }, (err) => {
            console.warn("Could not listen to sponsors:", err?.message);
        });

        // 3. Listen to users collection
        const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
            if (!mounted) return;
            setUserCount(snapshot.size);
        }, (err) => {
            console.warn("Could not listen to users:", err?.message);
        });

        return () => {
            mounted = false;
            unsubPayments();
            unsubSponsors();
            unsubUsers();
        };
    }, []);

    const pending = sponsors.filter((s) => s.status === "pending");
    const totalFundingDeployed = payments
        .filter((p) => p.status === "complete")
        .reduce((sum, p) => sum + (Number(p.sponsorshipAmount) || 0), 0);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.heading}>Admin Dashboard</Text>
            <Text style={styles.sub}>Overview of your platform & live payments</Text>

            <View style={styles.statsRow}>
                <StatCard
                    value={sponsors.length || 0}
                    label="Sponsors"
                    bg={COLORS.primaryBg}
                    color={COLORS.primary}
                />
                <StatCard
                    value={pending.length || 0}
                    label="Pending approval"
                    bg={COLORS.warningBg}
                    color={COLORS.warning}
                />
                <StatCard
                    value={userCount || 0}
                    label="Active users"
                    bg={COLORS.dangerBg}
                    color={COLORS.danger}
                />
                <StatCard
                    value={formatCurrencyShort(totalFundingDeployed, "R")}
                    label="Funding Deployed"
                    bg={COLORS.successBg}
                    color={COLORS.success}
                />
            </View>

            {/* LIVE PAYMENTS SECTION */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Payments (Sponsor API)</Text>
                <Text style={styles.link}>{payments.length} Payments</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 12 }} />
            ) : payments.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.empty}>No payments have been recorded yet.</Text>
                </View>
            ) : (
                payments.slice(0, 5).map((pmt) => {
                    const paidDate = pmt.paidAt?.toDate?.()
                        ? pmt.paidAt.toDate().toLocaleDateString("en-ZA", { day: "numeric", month: "short" })
                        : "Recent";
                    return (
                        <View key={pmt.id} style={styles.paymentRow}>
                            <View style={styles.paymentInfo}>
                                <Text style={styles.paymentTitle} numberOfLines={1}>
                                    {pmt.projectTitle || "Project sponsorship"}
                                </Text>
                                <Text style={styles.paymentMeta}>
                                    By {pmt.sponsorName || "Sponsor"} · {paidDate}
                                </Text>
                            </View>
                            <View style={styles.paymentAmountCol}>
                                <Text style={styles.paymentAmount}>
                                    +R{Number(pmt.sponsorshipAmount || 0).toLocaleString("en-ZA")}
                                </Text>
                                <Text style={styles.paymentStatus}>PayFast API ✓</Text>
                            </View>
                        </View>
                    );
                })
            )}

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
        marginTop: 18,
        marginBottom: 10,
    },
    sectionTitle: { fontSize: 17, fontWeight: "bold", color: COLORS.text },
    link: { color: COLORS.primary, fontWeight: "600" },
    empty: { color: COLORS.textMuted, marginVertical: 8 },
    emptyCard: { backgroundColor: COLORS.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10 },
    paymentRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    paymentInfo: { flex: 1, paddingRight: 8 },
    paymentTitle: { fontSize: 14, fontWeight: "bold", color: COLORS.text },
    paymentMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    paymentAmountCol: { alignItems: "flex-end" },
    paymentAmount: { fontSize: 14, fontWeight: "bold", color: COLORS.success },
    paymentStatus: { fontSize: 11, color: COLORS.primary, marginTop: 2, fontWeight: "600" },
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
