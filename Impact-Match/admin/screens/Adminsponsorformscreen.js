import React, { useState } from "react";
import {
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    StyleSheet,
} from "react-native";
import { COLORS } from "../theme";

const TYPES = ["Corporate", "Non-profit", "Trust", "Individual"];

export default function AdminSponsorFormScreen({ route, navigation }) {
    const existing = route?.params?.sponsor;
    const isEdit = !!existing;

    const [name, setName] = useState(existing?.name ?? "");
    const [type, setType] = useState(existing?.type ?? "Corporate");
    const [location, setLocation] = useState(existing?.location ?? "");
    const [causes, setCauses] = useState((existing?.causes ?? []).join(", "));

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert("Missing name", "Please enter a sponsor name.");
            return;
        }
        // UI-only: replace with addDoc()/updateDoc() when Firebase is wired in.
        const data = {
            name: name.trim(),
            type,
            location: location.trim(),
            causes: causes.split(",").map((c) => c.trim()).filter(Boolean),
        };
        console.log(isEdit ? "UPDATE" : "CREATE", data);
        navigation.goBack();
    };

    const handleDelete = () => {
        Alert.alert("Delete sponsor", `Delete ${existing.name}? This can't be undone.`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                    console.log("DELETE", existing.id);
                    navigation.goBack();
                },
            },
        ]);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.heading}>{isEdit ? "Edit sponsor" : "Add sponsor"}</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Bright Futures Foundation"
                placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.label}>Type</Text>
            <View style={styles.chips}>
                {TYPES.map((t) => (
                    <TouchableOpacity
                        key={t}
                        onPress={() => setType(t)}
                        style={[styles.chip, type === t && styles.chipActive]}
                    >
                        <Text style={[styles.chipText, type === t && styles.chipTextActive]}>
                            {t}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Location</Text>
            <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="City, Province"
                placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.label}>Causes (comma separated)</Text>
            <TextInput
                style={styles.input}
                value={causes}
                onChangeText={setCauses}
                placeholder="Education, Health, Environment"
                placeholderTextColor={COLORS.textMuted}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>{isEdit ? "Save changes" : "Create sponsor"}</Text>
            </TouchableOpacity>

            {isEdit && (
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                    <Text style={styles.deleteText}>Delete sponsor</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: 16, paddingBottom: 40 },
    heading: { fontSize: 24, fontWeight: "bold", color: COLORS.text, marginBottom: 8 },
    label: { fontSize: 13, fontWeight: "600", color: COLORS.textMuted, marginTop: 16, marginBottom: 6 },
    input: {
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: COLORS.text,
    },
    chips: { flexDirection: "row", flexWrap: "wrap" },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: 8,
        marginBottom: 8,
    },
    chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    chipText: { fontSize: 13, fontWeight: "600", color: COLORS.textMuted },
    chipTextActive: { color: "#FFFFFF" },
    saveBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 28,
    },
    saveText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 15 },
    deleteBtn: {
        backgroundColor: COLORS.dangerBg,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 12,
    },
    deleteText: { color: COLORS.danger, fontWeight: "bold", fontSize: 15 },
});