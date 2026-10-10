import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { collection, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../Backend/firebaseConfig";
import { readCachedProfile } from "../../utils/profileCache";
import { writeFirestoreOrQueue } from "../../utils/offlineWrites";
import { parseAmount } from "../../utils/matchScore";

const COLORS = { bg: "#F8F6EE", card: "#FFFFFF", ink: "#433327", muted: "#8C7A6B", border: "#E8DFD5", green: "#059669", red: "#B42318" };

export default function CreateOpportunityScreen({ navigation }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [cause, setCause] = useState("");
    const [location, setLocation] = useState("");
    const [fundingGoal, setFundingGoal] = useState("");
    const [beneficiaries, setBeneficiaries] = useState("");
    const [deadline, setDeadline] = useState("");
    const [saving, setSaving] = useState(false);

    const handleCreate = async () => {
        const uid = auth.currentUser?.uid;
        const amount = parseAmount(fundingGoal);
        if (!uid) return Alert.alert("Sign in required", "Please sign in to publish a project.");
        if (!title.trim() || !description.trim() || !cause.trim() || !location.trim() || !amount || amount <= 0) {
            return Alert.alert("Complete the project details", "Add a title, description, cause, location and a valid funding target.");
        }

        setSaving(true);
        try {
            let profile = await readCachedProfile(uid);
            try {
                const snapshot = await getDoc(doc(db, "users", uid));
                if (snapshot.exists()) profile = snapshot.data();
            } catch { /* The project can still be queued using the cached organisation profile. */ }
            const projectRef = doc(collection(db, "projects"));
            const project = {
                id: projectRef.id,
                ownerId: uid,
                orgName: profile?.organisationName || "Community organisation",
                ownerVerified: !!profile?.profileCompleted,
                title: title.trim(),
                description: description.trim(),
                cause: cause.trim(),
                location: location.trim(),
                fundingGoal: amount,
                beneficiaries: beneficiaries.trim(),
                deadline: deadline.trim(),
                status: "open",
                createdAt: new Date().toISOString(),
            };
            const result = await writeFirestoreOrQueue("projects", projectRef.id, project);
            Alert.alert(
                result.queued ? "Project saved" : "Project published",
                result.queued ? "Your project will appear to sponsors when you’re back online." : "Sponsors can now find your project in Discover.",
                [{ text: "Done", onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            Alert.alert("Could not publish project", error?.message || "Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} accessibilityLabel="Go back">
                        <Ionicons name="chevron-back" size={22} color={COLORS.ink} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.heading}>Create a project</Text>
                        <Text style={styles.subheading}>Help sponsors understand the impact they can support.</Text>
                    </View>
                </View>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <View style={styles.formCard}>
                        <Field label="PROJECT TITLE" value={title} onChangeText={setTitle} placeholder="e.g. Community learning hub" />
                        <Field label="ABOUT THE PROJECT" value={description} onChangeText={setDescription} placeholder="What will this project do, and why does it matter?" multiline />
                        <Field label="CAUSE" value={cause} onChangeText={setCause} placeholder="Education, food security, environment…" />
                        <Field label="LOCATION" value={location} onChangeText={setLocation} placeholder="Town, city or region" />
                        <Field label="FUNDING TARGET (R)" value={fundingGoal} onChangeText={setFundingGoal} placeholder="250000" keyboardType="numeric" />
                        <Field label="WHO WILL BENEFIT? (OPTIONAL)" value={beneficiaries} onChangeText={setBeneficiaries} placeholder="e.g. 120 local learners" />
                        <Field label="TARGET DATE (OPTIONAL)" value={deadline} onChangeText={setDeadline} placeholder="e.g. 30 November 2026" />
                    </View>
                    <View style={styles.note}>
                        <Ionicons name="information-circle-outline" size={18} color={COLORS.green} />
                        <Text style={styles.noteText}>Your project will be listed in the sponsor Discover tab with the details you provide.</Text>
                    </View>
                    <TouchableOpacity style={[styles.submit, saving && styles.submitDisabled]} onPress={handleCreate} disabled={saving} activeOpacity={0.85}>
                        {saving ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.submitText}>Publish project</Text><Ionicons name="arrow-forward" size={18} color="#FFFFFF" /></>}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function Field({ label, multiline, ...props }) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                {...props}
                multiline={multiline}
                textAlignVertical={multiline ? "top" : "center"}
                placeholderTextColor="#AA9C8E"
                style={[styles.input, multiline && styles.multiline]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.bg },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18, gap: 12 },
    back: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
    heading: { color: COLORS.ink, fontWeight: "800", fontSize: 22 },
    subheading: { color: COLORS.muted, fontSize: 13, lineHeight: 18, marginTop: 3 },
    content: { paddingHorizontal: 20, paddingBottom: 36 },
    formCard: { backgroundColor: COLORS.card, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border, padding: 18 },
    field: { marginBottom: 17 },
    label: { color: COLORS.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.1, marginBottom: 8 },
    input: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: COLORS.border, backgroundColor: "#FFFEFC", color: COLORS.ink, paddingHorizontal: 13, fontSize: 14 },
    multiline: { minHeight: 112, paddingTop: 12 },
    note: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingHorizontal: 2, marginTop: 14, marginBottom: 18 },
    noteText: { flex: 1, color: COLORS.muted, fontSize: 12, lineHeight: 18 },
    submit: { minHeight: 54, borderRadius: 16, backgroundColor: COLORS.green, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
    submitDisabled: { opacity: 0.65 },
    submitText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
});
