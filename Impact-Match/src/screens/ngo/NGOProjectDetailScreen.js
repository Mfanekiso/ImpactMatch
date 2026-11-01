import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../Backend/firebaseConfig";
import { COLORS, NEUTRAL, StatusBadge, ProgressBar } from "../../components/PayUI";

export default function NGOProjectDetailScreen({ navigation, route }) {
  const projectId = route.params?.projectId;
  const [project, setProject] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const uid = auth.currentUser?.uid;
  const isOwner = !!uid && (project?.ngoOwnerId === uid || project?.ownerId === uid);

  useEffect(() => {
    if (!projectId) {
      setError("No project was selected.");
      setLoading(false);
      return undefined;
    }
    const stopProject = onSnapshot(doc(db, "projects", projectId), (snapshot) => {
      if (!snapshot.exists()) {
        setProject(null);
        setError("This project could not be found.");
      } else {
        setProject({ id: snapshot.id, ...snapshot.data() });
        setError("");
      }
      setLoading(false);
    }, (loadError) => {
      setError(loadError?.message || "Could not load this project.");
      setLoading(false);
    });
    const stopUpdates = onSnapshot(
      query(collection(db, "projects", projectId, "updates"), orderBy("createdAt", "desc")),
      (snapshot) => setUpdates(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
      (loadError) => setError(loadError?.message || "Could not load project updates.")
    );
    return () => { stopProject(); stopUpdates(); };
  }, [projectId]);

  const percent = useMemo(() => {
    const latestProgress = updates.find((item) => Number.isFinite(item.progress))?.progress;
    if (latestProgress != null) return Math.max(0, Math.min(latestProgress, 100));
    const goal = Number(project?.fundingGoal ?? project?.goalAmount) || 0;
    const raised = Number(project?.raisedAmount) || 0;
    return goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;
  }, [project, updates]);

  const handleRemoveUpdate = (item) => {
    if (!uid || item.ownerId !== uid) return Alert.alert("Access denied", "You can only remove updates you posted.");
    Alert.alert("Remove update", "Remove this update from the project?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
        try { await deleteDoc(doc(db, "projects", projectId, "updates", item.id)); }
        catch (removeError) { Alert.alert("Could not remove update", removeError?.message || "Please try again."); }
      } },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!project) return <View style={styles.center}><Text style={styles.muted}>{error || "Project unavailable."}</Text></View>;

  const goal = Number(project.fundingGoal ?? project.goalAmount) || 0;
  const raised = Number(project.raisedAmount) || 0;
  const archived = String(project.status || "").toLowerCase() === "archived";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{project.title || "Untitled project"}</Text>
          <StatusBadge label={project.status || "Open"} tone={archived ? "off" : "good"} />
        </View>
        <Text style={styles.muted}>{project.cause || project.category || "Community project"} · {project.location || "Location not provided"}</Text>
        <ProgressBar percent={percent} />
        <Text style={styles.muted}>R {raised.toLocaleString("en-ZA")} raised of R {goal.toLocaleString("en-ZA")} · {Math.round(percent)}% reported progress</Text>
        {isOwner ? (
          <View style={styles.row}>
            <TouchableOpacity style={styles.outlineButton} onPress={() => navigation.navigate("PostUpdate", { projectId })}>
              <Text style={styles.outlineText}>Post an update</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>Project updates</Text>
      {updates.length === 0 ? (
        <View style={styles.card}><Text style={styles.muted}>No updates have been posted yet.</Text></View>
      ) : updates.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.bold}>{item.milestone || "Project update"}</Text>
          <Text style={styles.text}>{item.text}</Text>
          {(item.progress != null || item.beneficiaries != null) ? (
            <Text style={styles.muted}>
              {item.progress != null ? `${item.progress}% progress` : ""}
              {item.progress != null && item.beneficiaries != null ? " · " : ""}
              {item.beneficiaries != null ? `${Number(item.beneficiaries).toLocaleString("en-ZA")} beneficiaries reported` : ""}
            </Text>
          ) : null}
          <Text style={styles.disclaimer}>Self-reported update</Text>
          {item.ownerId === uid && <TouchableOpacity onPress={() => handleRemoveUpdate(item)}><Text style={styles.dangerText}>Remove update</Text></TouchableOpacity>}
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
  row: { flexDirection: "row", gap: 10, marginTop: 4 },
  title: { flex: 1, fontFamily: "Manrope_700Bold", fontSize: 19, color: NEUTRAL.text },
  sectionTitle: { fontFamily: "Manrope_700Bold", fontSize: 17, color: NEUTRAL.text, marginTop: 6 },
  bold: { fontFamily: "Manrope_700Bold", fontSize: 15, color: NEUTRAL.text },
  text: { fontFamily: "Manrope_500Medium", fontSize: 14, lineHeight: 20, color: NEUTRAL.text },
  muted: { fontFamily: "Manrope_500Medium", fontSize: 13, lineHeight: 19, color: NEUTRAL.muted },
  disclaimer: { fontFamily: "Manrope_500Medium", fontSize: 12, color: NEUTRAL.muted },
  outlineButton: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: NEUTRAL.border, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  outlineText: { fontFamily: "Manrope_700Bold", color: NEUTRAL.text },
  dangerText: { fontFamily: "Manrope_700Bold", color: "#9B1C1C", paddingVertical: 4 },
  error: { fontFamily: "Manrope_500Medium", color: "#9B1C1C" },
});
