import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../../Backend/firebaseConfig";
import { COLORS, NEUTRAL, StatusBadge, ProgressBar } from "../../components/PayUI";

export default function ProjectProgressScreen({ route }) {
  const projectId = route.params?.projectId;
  const [project, setProject] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!projectId) {
      setError("No project was selected.");
      setLoading(false);
      return undefined;
    }
    const stopProject = onSnapshot(doc(db, "projects", projectId), (snapshot) => {
      if (snapshot.exists()) setProject({ id: snapshot.id, ...snapshot.data() });
      else { setProject(null); setError("This project could not be found."); }
      setLoading(false);
    }, (loadError) => { setError(loadError?.message || "Could not load project progress."); setLoading(false); });
    const stopUpdates = onSnapshot(
      query(collection(db, "projects", projectId, "updates"), orderBy("createdAt", "desc")),
      (snapshot) => setUpdates(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
      (loadError) => setError(loadError?.message || "Could not load project updates.")
    );
    return () => { stopProject(); stopUpdates(); };
  }, [projectId]);

  const percent = useMemo(() => {
    const latest = updates.find((item) => Number.isFinite(item.progress))?.progress;
    if (latest != null) return Math.max(0, Math.min(latest, 100));
    const goal = Number(project?.fundingGoal ?? project?.goalAmount) || 0;
    const raised = Number(project?.raisedAmount) || 0;
    return goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;
  }, [project, updates]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!project) return <View style={styles.center}><Text style={styles.muted}>{error || "Project unavailable."}</Text></View>;

  const goal = Number(project.fundingGoal ?? project.goalAmount) || 0;
  const raised = Number(project.raisedAmount) || 0;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{project.title || "Untitled project"}</Text>
          <StatusBadge label={project.status || "Open"} tone="good" />
        </View>
        <Text style={styles.muted}>{project.orgName || project.ngoName || "Community organisation"}</Text>
        <ProgressBar percent={percent} />
        <Text style={styles.muted}>R {raised.toLocaleString("en-ZA")} raised of R {goal.toLocaleString("en-ZA")} · {Math.round(percent)}% reported progress</Text>
      </View>
      <Text style={styles.sectionTitle}>Updates</Text>
      {updates.length === 0 ? (
        <View style={styles.card}><Text style={styles.muted}>The organisation has not posted an update yet.</Text></View>
      ) : updates.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.bold}>{item.milestone || "Project update"}</Text>
          <Text style={styles.body}>{item.text || ""}</Text>
          {(item.progress != null || item.beneficiaries != null) && (
            <Text style={styles.muted}>
              {item.progress != null ? `${item.progress}% progress` : ""}
              {item.progress != null && item.beneficiaries != null ? " · " : ""}
              {item.beneficiaries != null ? `${Number(item.beneficiaries).toLocaleString("en-ZA")} beneficiaries reported` : ""}
            </Text>
          )}
          <Text style={styles.disclaimer}>Self-reported by the organisation</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: NEUTRAL.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: NEUTRAL.background },
  content: { padding: 20, gap: 14 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: NEUTRAL.border },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  title: { flex: 1, fontFamily: "Manrope_700Bold", fontSize: 19, color: NEUTRAL.text },
  sectionTitle: { fontFamily: "Manrope_700Bold", fontSize: 17, color: NEUTRAL.text, marginTop: 6 },
  bold: { fontFamily: "Manrope_700Bold", fontSize: 15, color: NEUTRAL.text },
  body: { fontFamily: "Manrope_500Medium", fontSize: 14, lineHeight: 20, color: NEUTRAL.text },
  muted: { fontFamily: "Manrope_500Medium", fontSize: 13, lineHeight: 19, color: NEUTRAL.muted },
  disclaimer: { fontFamily: "Manrope_500Medium", fontSize: 12, color: NEUTRAL.muted },
  error: { fontFamily: "Manrope_500Medium", color: "#9B1C1C" },
});
