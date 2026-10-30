import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../../Backend/firebaseConfig";
import { COLORS, NEUTRAL, ProgressBar } from "../../components/PayUI";

const STEPS = ["Proposed", "Accepted", "Active", "Completed"];

export default function SponsorProposalScreen({ route, navigation }) {
  const projectId = route.params?.projectId;

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("milestone");
  const [message, setMessage] = useState("");

  // Load the real project from Firestore
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) {
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "projects", projectId));
        if (snap.exists()) {
          setProject({ id: snap.id, ...snap.data() });
        }
      } catch (error) {
        console.warn("Could not load project:", error?.message);
      }
      setLoading(false);
    };
    loadProject();
  }, [projectId]);

  const handleSend = async () => {
    const value = Number(amount);
    if (!project?.id) {
      Alert.alert("Project unavailable", "Return to the project list and try again.");
      return;
    }
    if (!value || value <= 0) {
      Alert.alert("Enter an amount", "Add the amount you want to give.");
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Sign in needed", "Please sign in again to send a proposal.");
      return;
    }
    const ngoId = project.ngoOwnerId || project.ownerId;
    if (ngoId === user.uid) {
      Alert.alert("Choose another project", "You cannot send a sponsorship proposal to your own project.");
      return;
    }

    setSaving(true);
    try {
      const ref = await addDoc(collection(db, "sponsorships"), {
        projectId: project.id,
        projectTitle: project.title || "",
        ngoId: ngoId || null,
        sponsorId: user.uid,
        amount: value,
        fundingType: type,
        message: message.trim(),
        status: "proposed",
        createdAt: serverTimestamp(),
      });
      navigation.navigate("SponsorPayment", {
        sponsorshipId: ref.id,
        amount: value,
        title: project.title,
      });
    } catch (error) {
      Alert.alert("Could not send proposal", error?.message || "Please try again.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>This project could not be found.</Text>
      </View>
    );
  }

  const goal = Number(project.fundingGoal ?? project.goalAmount) || 0;
  const raised = Number(project.raisedAmount) || 0;
  const percent = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.projectTitle}>{project.title}</Text>
          <Text style={styles.muted}>{project.orgName || project.ngoName || "Community organisation"}</Text>
          <ProgressBar percent={percent} />
          <Text style={styles.muted}>
            R{raised.toLocaleString("en-ZA")} raised of R{goal.toLocaleString("en-ZA")}
          </Text>
        </View>

        <Text style={styles.label}>Your offer (R)</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0"
        />

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.option, type === "milestone" && styles.optionOn]}
            onPress={() => setType("milestone")}
          >
            <Text style={[styles.optionText, type === "milestone" && styles.optionTextOn]}>
              Milestone-based
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, type === "oneoff" && styles.optionOn]}
            onPress={() => setType("oneoff")}
          >
            <Text style={[styles.optionText, type === "oneoff" && styles.optionTextOn]}>One-off</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Message to the NGO</Text>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Tell them why you want to help"
          multiline
        />

        <View style={styles.card}>
          <Text style={styles.label}>What happens next</Text>
          <View style={styles.row}>
            {STEPS.map((step, i) => (
              <View key={step} style={styles.step}>
                <View style={[styles.dot, i === 0 && styles.dotOn]} />
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.button, saving && styles.buttonOff]}
          onPress={handleSend}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>Continue to payment</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: NEUTRAL.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: NEUTRAL.background, padding: 24 },
  content: { padding: 20, gap: 14 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, gap: 8, borderWidth: 1, borderColor: NEUTRAL.border },
  projectTitle: { fontFamily: "Manrope_700Bold", fontSize: 20, color: NEUTRAL.text },
  muted: { fontFamily: "Manrope_500Medium", fontSize: 13, color: NEUTRAL.muted },
  label: { fontFamily: "Manrope_700Bold", fontSize: 13, color: NEUTRAL.muted },
  amountInput: { height: 56, borderRadius: 14, borderWidth: 1, borderColor: NEUTRAL.border, backgroundColor: COLORS.white, paddingHorizontal: 16, fontFamily: "Manrope_700Bold", fontSize: 24, color: NEUTRAL.text },
  input: { minHeight: 72, borderRadius: 12, borderWidth: 1, borderColor: NEUTRAL.border, backgroundColor: COLORS.white, padding: 14, fontFamily: "Manrope_500Medium", fontSize: 15, color: NEUTRAL.text },
  row: { flexDirection: "row", gap: 8 },
  option: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: NEUTRAL.border, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center" },
  optionOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
  optionText: { fontFamily: "Manrope_500Medium", color: NEUTRAL.text },
  optionTextOn: { fontFamily: "Manrope_700Bold", color: COLORS.primary },
  step: { flex: 1, alignItems: "center", gap: 6 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: NEUTRAL.border },
  dotOn: { backgroundColor: COLORS.primary },
  stepText: { fontFamily: "Manrope_500Medium", fontSize: 12, color: NEUTRAL.muted },
  bottom: { padding: 20, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: NEUTRAL.border },
  button: { height: 52, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  buttonOff: { opacity: 0.6 },
  buttonText: { fontFamily: "Manrope_700Bold", fontSize: 16, color: COLORS.white },
});
