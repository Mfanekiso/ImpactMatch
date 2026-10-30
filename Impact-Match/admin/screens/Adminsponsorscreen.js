import React, { useState, useMemo } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import AdminSponsorRow from "../components/Adminsponsorrow";
import { COLORS } from "../theme";
import { MOCK_SPONSORS } from "../mockData";

const FILTERS = ["all", "pending", "approved", "rejected"];

export default function AdminSponsorsScreen({ navigation }) {
    const [sponsors, setSponsors] = useState(MOCK_SPONSORS);
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("all");

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return sponsors.filter(
            (s) =>
                (filter === "all" || s.status === filter) &&
                (q === "" || s.name.toLowerCase().includes(q))
        );
    }, [sponsors, query, filter]);

    // UI-only: updates local state. Swap for updateDoc() when Firebase is wired in.
    const setStatus = (id, status) =>
        setSponsors((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.heading}>Sponsors</Text>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => navigation.navigate("SponsorForm")}
                >
                    <Text style={styles.addBtnText}>+ Add</Text>
                </TouchableOpacity>
            </View>

            <TextInput
                style={styles.search}
                placeholder="Search sponsors"
                placeholderTextColor={COLORS.textMuted}
                value={query}
                onChangeText={setQuery}
            />

            <View style={styles.filters}>
                {FILTERS.map((f) => (
                    <TouchableOpacity
                        key={f}
                        onPress={() => setFilter(f)}
                        style={[styles.chip, filter === f && styles.chipActive]}
                    >
                        <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
                            {f[0].toUpperCase() + f.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={visible}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 40 }}
                ListEmptyComponent={<Text style={styles.empty}>No sponsors found.</Text>}
                renderItem={({ item }) => (
                    <AdminSponsorRow
                        sponsor={item}
                        onEdit={() => navigation.navigate("SponsorForm", { sponsor: item })}
                        onApprove={() => setStatus(item.id, "approved")}
                        onReject={() => setStatus(item.id, "rejected")}
                    />
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    heading: { fontSize: 24, fontWeight: "bold", color: COLORS.text },
    addBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addBtnText: { color: "#FFFFFF", fontWeight: "bold" },
    search: {
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginTop: 14,
        color: COLORS.text,
    },
    filters: { flexDirection: "row", marginVertical: 12 },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: 8,
    },
    chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    chipText: { fontSize: 13, color: COLORS.textMuted, fontWeight: "600" },
    chipTextActive: { color: "#FFFFFF" },
    empty: { textAlign: "center", color: COLORS.textMuted, marginTop: 30 },
});