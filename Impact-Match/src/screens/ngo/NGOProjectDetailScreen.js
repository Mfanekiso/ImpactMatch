import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../../../Backend/firebaseConfig";
import Ionicons from "@react-native-vector-icons/ionicons";

// ─── COLORS ─────────────────────────────────────────────────────────────
const COLORS = {
  background: "#F5F5F0",
  surface: "#FFFFFF",
  primary: "#1B4332",
  primarySoft: "rgba(27, 67, 50, 0.08)",
  emerald: "#059669",
  emeraldSoft: "rgba(5, 150, 105, 0.10)",
  gold: "#D9C982",
  goldSoft: "rgba(217, 201, 130, 0.18)",
  textPrimary: "#1A1A1A",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  borderStrong: "#D1D5DB",
  danger: "#DC2626",
  dangerSoft: "rgba(220, 38, 38, 0.08)",
  white: "#FFFFFF",
};

const softShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

const money = (val) => {
  const n = Number(val) || 0;
  return `R ${n.toLocaleString("en-ZA")}`;
};

const relativeDate = (timestamp) => {
  const d = timestamp?.toDate?.();
  if (!d) return "Just now";
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 172800000) return "Yesterday";
  const daysDiff = Math.floor(diff / 86400000);
  if (daysDiff < 7) return `${daysDiff}d ago`;
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
};

const isToday = (timestamp) => {
  const d = timestamp?.toDate?.();
  if (!d) return false;
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

export default function NGOProjectDetailScreen({ navigation, route }) {
  const projectId = route.params?.projectId;
  const [project, setProject] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [sponsorships, setSponsorships] = useState([]);
  const [sponsorNames, setSponsorNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const uid = auth.currentUser?.uid;
  const isOwner = !!uid && (project?.ngoOwnerId === uid || project?.ownerId === uid);

  // Post update modal state
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [milestone, setMilestone] = useState("");
  const [progress, setProgress] = useState("");
  const [beneficiaries, setBeneficiaries] = useState("");
  const [updateText, setUpdateText] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit update state
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [editMilestone, setEditMilestone] = useState("");
  const [editProgress, setEditProgress] = useState("");
  const [editBeneficiaries, setEditBeneficiaries] = useState("");
  const [editText, setEditText] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  // Progress bar animation
  const barAnim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (!projectId) {
      setError("No project was selected.");
      setLoading(false);
      return undefined;
    }

    const stopProject = onSnapshot(
      doc(db, "projects", projectId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setProject(null);
          setError("This project could not be found.");
        } else {
          setProject({ id: snapshot.id, ...snapshot.data() });
          setError("");
        }
        setLoading(false);
      },
      (loadError) => {
        setError(loadError?.message || "Could not load this project.");
        setLoading(false);
      }
    );

    const stopUpdates = onSnapshot(
      query(collection(db, "projects", projectId, "updates"), orderBy("createdAt", "desc")),
      (snapshot) => setUpdates(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
      (loadError) => setError(loadError?.message || "Could not load project updates.")
    );

    // Listen to sponsorships for this project
    const stopSponsorships = onSnapshot(
      query(collection(db, "sponsorships"), where("projectId", "==", projectId)),
      (snapshot) => {
        const rows = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSponsorships(rows);
      },
      () => {}
    );

    return () => {
      stopProject();
      stopUpdates();
      stopSponsorships();
    };
  }, [projectId]);

  // Animate progress bar
  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [barAnim]);

  // Load sponsor names
  useEffect(() => {
    const ids = new Set(sponsorships.map((s) => s.sponsorId).filter(Boolean));
    ids.forEach((id) => {
      if (sponsorNames[id] !== undefined) return;
      getDoc(doc(db, "users", id))
        .then((snap) => {
          const d = snap.exists() ? snap.data() : {};
          const name =
            d.organisationName || d.organizationName || d.orgName ||
            d.companyName || d.name || d.full_name || d.displayName || "Anonymous sponsor";
          setSponsorNames((prev) => ({ ...prev, [id]: name }));
        })
        .catch(() => setSponsorNames((prev) => ({ ...prev, [id]: "Anonymous sponsor" })));
    });
  }, [sponsorships]);

  // Calculate funding from sponsorships
  const totalRaisedFromSponsorships = useMemo(() => {
    return sponsorships.reduce((sum, s) => {
      const paid =
        ["paid", "complete", "completed", "active"].includes(String(s.paymentStatus || s.status || "").toLowerCase()) ||
        !!s.paidAt || !!s.transactionReference;
      return sum + (paid ? Number(s.amount) || 0 : 0);
    }, 0);
  }, [sponsorships]);

  const paidSponsorships = useMemo(() => {
    return sponsorships.filter((s) => {
      return (
        ["paid", "complete", "completed", "active"].includes(String(s.paymentStatus || s.status || "").toLowerCase()) ||
        !!s.paidAt || !!s.transactionReference
      );
    });
  }, [sponsorships]);

  const sponsorCount = useMemo(() => {
    return new Set(paidSponsorships.map((s) => s.sponsorId).filter(Boolean)).size;
  }, [paidSponsorships]);

  // Collaborators from sponsorships with a "collaborator" role
  const collaborators = useMemo(() => {
    return sponsorships.filter((s) => String(s.fundingType || "").toLowerCase() === "collaborator" || String(s.role || "").toLowerCase() === "collaborator");
  }, [sponsorships]);

  const handlePostUpdate = async () => {
    const user = auth.currentUser;
    if (!projectId || !user) {
      Alert.alert("Cannot publish update", "Sign in again and open this screen from one of your projects.");
      return;
    }
    const progressValue = progress.trim() ? Number(progress) : null;
    const beneficiaryValue = beneficiaries.trim() ? Number(beneficiaries) : null;
    if (!milestone.trim() || !updateText.trim()) {
      Alert.alert("Missing details", "Add the milestone and describe what happened.");
      return;
    }
    if (
      (progressValue != null && (!Number.isFinite(progressValue) || progressValue < 0 || progressValue > 100)) ||
      (beneficiaryValue != null && (!Number.isInteger(beneficiaryValue) || beneficiaryValue < 0))
    ) {
      Alert.alert("Check the numbers", "Progress must be 0–100 and beneficiaries must be a whole number.");
      return;
    }

    setSaving(true);
    try {
      const projectRef = doc(db, "projects", projectId);
      const projectSnapshot = await getDoc(projectRef);
      const proj = projectSnapshot.exists() ? projectSnapshot.data() : null;
      if (!proj || (proj.ngoOwnerId !== user.uid && proj.ownerId !== user.uid)) {
        Alert.alert("Access denied", "You can only post updates to projects owned by your organisation.");
        return;
      }

      await addDoc(collection(projectRef, "updates"), {
        projectId,
        projectTitle: proj.title || "",
        ownerId: user.uid,
        milestone: milestone.trim(),
        progress: progressValue,
        beneficiaries: beneficiaryValue,
        text: updateText.trim(),
        createdAt: serverTimestamp(),
      });

      setMilestone("");
      setProgress("");
      setBeneficiaries("");
      setUpdateText("");
      setPostModalVisible(false);
      Alert.alert("Update published", "Your project update is now visible.");
    } catch (err) {
      Alert.alert("Could not publish update", err?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditUpdate = (item) => {
    setEditingUpdate(item);
    setEditMilestone(item.milestone || "");
    setEditProgress(item.progress != null ? String(item.progress) : "");
    setEditBeneficiaries(item.beneficiaries != null ? String(item.beneficiaries) : "");
    setEditText(item.text || "");
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUpdate || !projectId) return;
    const progressValue = editProgress.trim() ? Number(editProgress) : null;
    const beneficiaryValue = editBeneficiaries.trim() ? Number(editBeneficiaries) : null;
    if (!editMilestone.trim() || !editText.trim()) {
      Alert.alert("Missing details", "Add the milestone and describe what happened.");
      return;
    }
    if (
      (progressValue != null && (!Number.isFinite(progressValue) || progressValue < 0 || progressValue > 100)) ||
      (beneficiaryValue != null && (!Number.isInteger(beneficiaryValue) || beneficiaryValue < 0))
    ) {
      Alert.alert("Check the numbers", "Progress must be 0–100 and beneficiaries must be a whole number.");
      return;
    }

    setEditSaving(true);
    try {
      await updateDoc(doc(db, "projects", projectId, "updates", editingUpdate.id), {
        milestone: editMilestone.trim(),
        progress: progressValue,
        beneficiaries: beneficiaryValue,
        text: editText.trim(),
        updatedAt: serverTimestamp(),
      });
      setEditModalVisible(false);
      setEditingUpdate(null);
    } catch (err) {
      Alert.alert("Could not save", err?.message || "Please try again.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleRemoveUpdate = (item) => {
    if (!uid || item.ownerId !== uid) return Alert.alert("Access denied", "You can only remove updates you posted.");
    Alert.alert("Remove update", "Remove this update from the project?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "projects", projectId, "updates", item.id));
          } catch (removeError) {
            Alert.alert("Could not remove update", removeError?.message || "Please try again.");
          }
        },
      },
    ]);
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  if (!project)
    return (
      <View style={styles.center}>
        <Text style={styles.mutedText}>{error || "Project unavailable."}</Text>
      </View>
    );

  const goal = Number(project.fundingGoal ?? project.goalAmount) || 0;
  const raised = Math.max(Number(project.raisedAmount) || 0, totalRaisedFromSponsorships);
  const remaining = Math.max(goal - raised, 0);
  const ratio = goal > 0 ? Math.min(raised / goal, 1) : 0;
  const percentText = `${Math.round(ratio * 100)}%`;
  const archived = String(project.status || "").toLowerCase() === "archived";
  const projectStatus = archived ? "Archived" : (String(project.status || "Active").charAt(0).toUpperCase() + String(project.status || "active").slice(1));

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* ─── PROJECT HEADER CARD ─── */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.projectTitle} numberOfLines={2}>{project.title || "Untitled project"}</Text>
            <View style={[styles.statusBadge, archived ? styles.statusArchived : styles.statusActive]}>
              <Text style={[styles.statusText, archived ? styles.statusArchivedText : styles.statusActiveText]}>
                {projectStatus}
              </Text>
            </View>
          </View>

          {/* Funding Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: barAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", `${ratio * 100}%`],
                    }),
                  },
                ]}
              />
            </View>
            <View style={styles.fundingRow}>
              <Text style={styles.fundingRaised}>{money(raised)} of {money(goal)}</Text>
              <Text style={styles.fundingCount}>· {sponsorCount} sponsor{sponsorCount !== 1 ? "s" : ""}</Text>
            </View>
            {remaining > 0 && (
              <Text style={styles.fundingRemaining}>{money(remaining)} remaining to reach target</Text>
            )}
          </View>

          {/* Action Buttons */}
          {isOwner && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate("PostUpdate", { projectId })}
              >
                <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSecondary]}
                onPress={() => {
                  Alert.alert("Archive project", "Archive this project?", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Archive",
                      onPress: async () => {
                        try {
                          await updateDoc(doc(db, "projects", projectId), { status: "Archived", updatedAt: serverTimestamp() });
                        } catch (e) {
                          Alert.alert("Error", e?.message || "Could not archive.");
                        }
                      },
                    },
                  ]);
                }}
              >
                <Ionicons name="archive-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.actionButtonSecondaryText}>Archive</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ─── SPONSORS AND COLLABORATORS ─── */}
        {(paidSponsorships.length > 0 || collaborators.length > 0) && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>SPONSORS AND COLLABORATORS</Text>
            {paidSponsorships.map((s) => {
              const name = s.sponsorName || sponsorNames[s.sponsorId] || "Anonymous sponsor";
              const initial = name.trim().charAt(0).toUpperCase();
              const isSponsor = String(s.fundingType || s.role || "").toLowerCase() !== "collaborator";
              return (
                <View key={s.id} style={styles.sponsorRow}>
                  <View style={[styles.sponsorAvatar, { backgroundColor: isSponsor ? COLORS.emeraldSoft : COLORS.goldSoft }]}>
                    <Text style={[styles.sponsorInitial, { color: isSponsor ? COLORS.emerald : "#B8A54B" }]}>{initial}</Text>
                  </View>
                  <Text style={styles.sponsorName} numberOfLines={1}>{name}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: isSponsor ? COLORS.emeraldSoft : COLORS.goldSoft }]}>
                    <Text style={[styles.roleText, { color: isSponsor ? COLORS.emerald : "#8B7D35" }]}>
                      {isSponsor ? "Sponsor" : "Collaborator"}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ─── LATEST UPDATE ─── */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>LATEST UPDATE</Text>
            {updates.length > 0 && (
              <Text style={styles.dateLabel}>
                {isToday(updates[0].createdAt) ? "Today" : relativeDate(updates[0].createdAt)}
              </Text>
            )}
          </View>

          {updates.length === 0 ? (
            <Text style={styles.mutedText}>No updates have been posted yet.</Text>
          ) : (
            <View>
              <Text style={styles.updateMilestone}>{updates[0].milestone || "Project update"}</Text>
              <Text style={styles.updateBody}>{updates[0].text}</Text>
              {(updates[0].progress != null || updates[0].beneficiaries != null) && (
                <View style={styles.metricRow}>
                  {updates[0].beneficiaries != null && (
                    <View style={styles.metricBadge}>
                      <Text style={styles.metricBadgeText}>
                        {Number(updates[0].beneficiaries).toLocaleString("en-ZA")} households
                      </Text>
                    </View>
                  )}
                  <View style={[styles.metricBadge, styles.metricSelfReported]}>
                    <Text style={styles.metricSelfReportedText}>Self-reported</Text>
                  </View>
                </View>
              )}
              {isOwner && (
                <View style={styles.updateActions}>
                  <TouchableOpacity onPress={() => handleEditUpdate(updates[0])}>
                    <Text style={styles.editLink}>Edit update</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRemoveUpdate(updates[0])}>
                    <Text style={styles.removeLink}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ─── OLDER UPDATES ─── */}
        {updates.length > 1 && (
          <>
            <Text style={styles.olderUpdatesTitle}>Previous Updates</Text>
            {updates.slice(1).map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.updateMilestone}>{item.milestone || "Project update"}</Text>
                  <Text style={styles.dateLabel}>{relativeDate(item.createdAt)}</Text>
                </View>
                <Text style={styles.updateBody}>{item.text}</Text>
                {(item.progress != null || item.beneficiaries != null) && (
                  <View style={styles.metricRow}>
                    {item.beneficiaries != null && (
                      <View style={styles.metricBadge}>
                        <Text style={styles.metricBadgeText}>
                          {Number(item.beneficiaries).toLocaleString("en-ZA")} beneficiaries
                        </Text>
                      </View>
                    )}
                    <View style={[styles.metricBadge, styles.metricSelfReported]}>
                      <Text style={styles.metricSelfReportedText}>Self-reported</Text>
                    </View>
                  </View>
                )}
                {isOwner && (
                  <View style={styles.updateActions}>
                    <TouchableOpacity onPress={() => handleEditUpdate(item)}>
                      <Text style={styles.editLink}>Edit update</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRemoveUpdate(item)}>
                      <Text style={styles.removeLink}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* ─── POST AN UPDATE BOTTOM BUTTON ─── */}
      {isOwner && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.postButton} onPress={() => setPostModalVisible(true)} activeOpacity={0.85}>
            <Text style={styles.postButtonText}>Post an update</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── POST UPDATE MODAL ─── */}
      <Modal visible={postModalVisible} animationType="slide" transparent onRequestClose={() => !saving && setPostModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Post an Update</Text>
            <Text style={styles.modalSubtitle}>Share progress on this project with sponsors and stakeholders.</Text>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Milestone *</Text>
              <TextInput
                style={styles.textInput}
                value={milestone}
                onChangeText={setMilestone}
                placeholder="e.g. Pump and tank installed"
                placeholderTextColor={COLORS.textSecondary}
                editable={!saving}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Progress (%)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={progress}
                    onChangeText={setProgress}
                    keyboardType="numeric"
                    placeholder="75"
                    placeholderTextColor={COLORS.textSecondary}
                    editable={!saving}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Beneficiaries</Text>
                  <TextInput
                    style={styles.textInput}
                    value={beneficiaries}
                    onChangeText={setBeneficiaries}
                    keyboardType="numeric"
                    placeholder="120"
                    placeholderTextColor={COLORS.textSecondary}
                    editable={!saving}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>What happened *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={updateText}
                onChangeText={setUpdateText}
                multiline
                placeholder="Describe the progress and any challenges"
                placeholderTextColor={COLORS.textSecondary}
                editable={!saving}
              />

              <Text style={styles.noteText}>Updates are marked as self-reported. Do not include sensitive personal information.</Text>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} disabled={saving} onPress={() => setPostModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.submitBtn, saving && styles.submitBtnDisabled]} onPress={handlePostUpdate} disabled={saving}>
                  {saving ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.submitBtnText}>Publish</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── EDIT UPDATE MODAL ─── */}
      <Modal visible={editModalVisible} animationType="slide" transparent onRequestClose={() => !editSaving && setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Update</Text>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Milestone *</Text>
              <TextInput style={styles.textInput} value={editMilestone} onChangeText={setEditMilestone} editable={!editSaving} />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Progress (%)</Text>
                  <TextInput style={styles.textInput} value={editProgress} onChangeText={setEditProgress} keyboardType="numeric" editable={!editSaving} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Beneficiaries</Text>
                  <TextInput style={styles.textInput} value={editBeneficiaries} onChangeText={setEditBeneficiaries} keyboardType="numeric" editable={!editSaving} />
                </View>
              </View>

              <Text style={styles.inputLabel}>What happened *</Text>
              <TextInput style={[styles.textInput, styles.textArea]} value={editText} onChangeText={setEditText} multiline editable={!editSaving} />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} disabled={editSaving} onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.submitBtn, editSaving && styles.submitBtnDisabled]} onPress={handleSaveEdit} disabled={editSaving}>
                  {editSaving ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.submitBtnText}>Save changes</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 100, gap: 12 },
  errorText: { fontFamily: "Manrope_500Medium", color: COLORS.danger, fontSize: 13 },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...softShadow,
  },

  // Header
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  projectTitle: { flex: 1, fontFamily: "Manrope_700Bold", fontSize: 20, color: COLORS.textPrimary, lineHeight: 26 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusActive: { backgroundColor: COLORS.emeraldSoft },
  statusArchived: { backgroundColor: COLORS.dangerSoft },
  statusText: { fontFamily: "Manrope_700Bold", fontSize: 11, textTransform: "uppercase" },
  statusActiveText: { color: COLORS.emerald },
  statusArchivedText: { color: COLORS.danger },

  // Funding
  progressSection: { marginTop: 14 },
  progressTrack: { height: 8, backgroundColor: "#E8F5E9", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: COLORS.emerald, borderRadius: 4 },
  fundingRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 4 },
  fundingRaised: { fontFamily: "Manrope_600SemiBold", fontSize: 13, color: COLORS.textPrimary },
  fundingCount: { fontFamily: "Manrope_500Medium", fontSize: 13, color: COLORS.textSecondary },
  fundingRemaining: { fontFamily: "Manrope_500Medium", fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },

  // Actions
  actionRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  actionButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  actionButtonText: { fontFamily: "Manrope_700Bold", fontSize: 13, color: COLORS.primary },
  actionButtonSecondary: {},
  actionButtonSecondaryText: { fontFamily: "Manrope_700Bold", fontSize: 13, color: COLORS.textSecondary },

  // Sponsors
  sectionLabel: { fontFamily: "Manrope_700Bold", fontSize: 11, color: COLORS.textSecondary, letterSpacing: 0.5, marginBottom: 12 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  dateLabel: { fontFamily: "Manrope_500Medium", fontSize: 12, color: COLORS.textSecondary },
  sponsorRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 10 },
  sponsorAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  sponsorInitial: { fontFamily: "Manrope_700Bold", fontSize: 15 },
  sponsorName: { flex: 1, fontFamily: "Manrope_600SemiBold", fontSize: 14, color: COLORS.textPrimary },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  roleText: { fontFamily: "Manrope_700Bold", fontSize: 11 },

  // Updates
  updateMilestone: { fontFamily: "Manrope_700Bold", fontSize: 15, color: COLORS.textPrimary },
  updateBody: { fontFamily: "Manrope_500Medium", fontSize: 14, lineHeight: 20, color: COLORS.textPrimary, marginTop: 6 },
  metricRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  metricBadge: { backgroundColor: COLORS.emeraldSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  metricBadgeText: { fontFamily: "Manrope_700Bold", fontSize: 11, color: COLORS.emerald },
  metricSelfReported: { backgroundColor: COLORS.goldSoft },
  metricSelfReportedText: { fontFamily: "Manrope_700Bold", fontSize: 11, color: "#8B7D35" },
  updateActions: { flexDirection: "row", gap: 16, marginTop: 10 },
  editLink: { fontFamily: "Manrope_700Bold", fontSize: 13, color: COLORS.primary },
  removeLink: { fontFamily: "Manrope_700Bold", fontSize: 13, color: COLORS.danger },
  olderUpdatesTitle: { fontFamily: "Manrope_700Bold", fontSize: 16, color: COLORS.textPrimary, marginTop: 4 },
  mutedText: { fontFamily: "Manrope_500Medium", fontSize: 13, color: COLORS.textSecondary },

  // Bottom
  bottomBar: { padding: 16, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  postButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  postButtonText: { fontFamily: "Manrope_700Bold", fontSize: 16, color: COLORS.white },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 16 },
  modalContent: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, maxHeight: "90%", ...softShadow },
  modalTitle: { fontFamily: "Manrope_700Bold", fontSize: 20, color: COLORS.textPrimary },
  modalSubtitle: { fontFamily: "Manrope_500Medium", fontSize: 13, color: COLORS.textSecondary, marginTop: 4, marginBottom: 16 },
  inputLabel: { fontFamily: "Manrope_600SemiBold", fontSize: 13, color: COLORS.textPrimary, marginTop: 12, marginBottom: 6 },
  textInput: {
    fontFamily: "Manrope_500Medium",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: "#FAFAFA",
    color: COLORS.textPrimary,
  },
  textArea: { height: 100, paddingTop: 12, textAlignVertical: "top" },
  formRow: { flexDirection: "row", gap: 12 },
  noteText: { fontFamily: "Manrope_500Medium", fontSize: 12, color: COLORS.textSecondary, marginTop: 10, lineHeight: 18 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 20, gap: 12 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 24, backgroundColor: "#F0F0F0" },
  cancelBtnText: { fontFamily: "Manrope_700Bold", color: COLORS.textSecondary, fontSize: 14 },
  submitBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 24, backgroundColor: COLORS.primary, minWidth: 100, alignItems: "center", justifyContent: "center" },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontFamily: "Manrope_700Bold", color: COLORS.white, fontSize: 14 },
});
