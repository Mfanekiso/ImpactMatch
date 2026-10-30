import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../../Backend/firebaseConfig";
import { COLORS, NEUTRAL } from "../../components/PayUI";

export default function PostUpdateScreen({ navigation, route }) {
  const projectId = route.params?.projectId;
  const [milestone, setMilestone] = useState("");
  const [progress, setProgress] = useState("");
  const [beneficiaries, setBeneficiaries] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const handlePublish = async () => {
    const user = auth.currentUser;
    if (!projectId || !user) {
      Alert.alert("Cannot publish update", "Sign in again and open this screen from one of your projects.");
      return;
    }
    const progressValue = progress.trim() ? Number(progress) : null;
    const beneficiaryValue = beneficiaries.trim() ? Number(beneficiaries) : null;
    if (!milestone.trim() || !text.trim()) {
      Alert.alert("Missing details", "Add the milestone and describe what happened.");
      return;
    }
    if ((progressValue != null && (!Number.isFinite(progressValue) || progressValue < 0 || progressValue > 100)) ||
        (beneficiaryValue != null && (!Number.isInteger(beneficiaryValue) || beneficiaryValue < 0))) {
      Alert.alert("Check the numbers", "Progress must be 0–100 and beneficiaries must be a whole number.");
      return;
    }

    setSaving(true);
    try {
      const projectRef = doc(db, "projects", projectId);
      const projectSnapshot = await getDoc(projectRef);
      const project = projectSnapshot.exists() ? projectSnapshot.data() : null;
      if (!project || (project.ngoOwnerId !== user.uid && project.ownerId !== user.uid)) {
        Alert.alert("Access denied", "You can only post updates to projects owned by your organisation.");
        return;
      }

      await addDoc(collection(projectRef, "updates"), {
        projectId,
        projectTitle: project.title || "",
        ownerId: user.uid,
        milestone: milestone.trim(),
        progress: progressValue,
        beneficiaries: beneficiaryValue,
        text: text.trim(),
        createdAt: serverTimestamp(),
      });
      Alert.alert("Update published", "The project update is now visible to people who can view this project.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Could not publish update", error?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Milestone</Text>
        <TextInput style={styles.input} value={milestone} onChangeText={setMilestone} placeholder="Pump and tank installed" editable={!saving} />
        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>Progress (%)</Text>
            <TextInput style={styles.input} value={progress} onChangeText={setProgress} keyboardType="numeric" placeholder="75" editable={!saving} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Beneficiaries</Text>
            <TextInput style={styles.input} value={beneficiaries} onChangeText={setBeneficiaries} keyboardType="numeric" placeholder="120" editable={!saving} />
          </View>
        </View>
        <Text style={styles.label}>What happened</Text>
        <TextInput style={[styles.input, styles.textArea]} value={text} onChangeText={setText} multiline placeholder="Describe the progress and any challenges" editable={!saving} />
        <Text style={styles.note}>Updates are marked as self-reported. Do not include sensitive personal information about beneficiaries.</Text>
      </ScrollView>
      <View style={styles.bottom}>
        <TouchableOpacity style={[styles.button, saving && styles.buttonDisabled]} onPress={handlePublish} disabled={saving}>
          {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Publish update</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: NEUTRAL.background },
  content: { padding: 20, gap: 12 },
  row: { flexDirection: "row", gap: 12 },
  field: { flex: 1, gap: 6 },
  label: { fontFamily: "Manrope_700Bold", fontSize: 13, color: NEUTRAL.muted },
  input: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: NEUTRAL.border, backgroundColor: COLORS.white, paddingHorizontal: 14, fontFamily: "Manrope_500Medium", fontSize: 15, color: NEUTRAL.text },
  textArea: { height: 120, paddingTop: 12, textAlignVertical: "top" },
  note: { fontFamily: "Manrope_500Medium", fontSize: 13, lineHeight: 19, color: NEUTRAL.muted },
  bottom: { padding: 20, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: NEUTRAL.border },
  button: { height: 52, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontFamily: "Manrope_700Bold", fontSize: 16, color: COLORS.white },
});
