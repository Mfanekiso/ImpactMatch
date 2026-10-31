import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../../../Backend/firebaseConfig";
import Ionicons from "@react-native-vector-icons/ionicons";

// ─── COLORS (sponsor palette) ────────────────────────────────────────────
const COLORS = {
  background: "#F8F6EE",
  surface: "#FFFFFF",
  primary: "#013e37",
  primarySoft: "rgba(1, 62, 55, 0.08)",
  emerald: "#059669",
  emeraldSoft: "rgba(5, 150, 105, 0.10)",
  gold: "#D9C982",
  goldSoft: "rgba(217, 201, 130, 0.18)",
  textPrimary: "#433327",
  textSecondary: "#8C7A6B",
  border: "#E8DFD5",
  white: "#FFFFFF",
};

const softShadow = {
  shadowColor: "#433327",
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
  if (!d) return "";
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

export default function ProjectProgressScreen({ navigation, route }) {
  const projectId = route.params?.projectId;
  const [project, setProject] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [sponsorships, setSponsorships] = useState([]);
  const [ngoProfile, setNgoProfile] = useState(null);
  const [sponsorNames, setSponsorNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        if (snapshot.exists()) {
          const data = { id: snapshot.id, ...snapshot.data() };
          setProject(data);
          // Load NGO profile
          const ngoId = data.ngoOwnerId || data.ownerId;
          if (ngoId) {
            getDoc(doc(db, "users", ngoId))
              .then((snap) => {
                if (snap.exists()) setNgoProfile(snap.data());
              })
              .catch(() => {});
          }
        } else {
          setProject(null);
          setError("This project could not be found.");
        }
        setLoading(false);
      },
      (loadError) => {
        setError(loadError?.message || "Could not load project progress.");
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

  // Load sponsor names for avatars
  useEffect(() => {
    const ids = new Set(sponsorships.map((s) => s.sponsorId).filter(Boolean));
    ids.forEach((id) => {
      if (sponsorNames[id] !== undefined) return;
      getDoc(doc(db, "users", id))
        .then((snap) => {
          const d = snap.exists() ? snap.data() : {};
          const name =
            d.organisationName || d.organizationName || d.orgName ||
            d.companyName || d.name || d.full_name || d.displayName || "Anonymous";
          setSponsorNames((prev) => ({ ...prev, [id]: name }));
        })
        .catch(() => setSponsorNames((prev) => ({ ...prev, [id]: "Anonymous" })));
    });
  }, [sponsorships]);

  // Calculate funding from real sponsorship data
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

  const collaboratorCount = useMemo(() => {
    return sponsorships.filter(
      (s) => String(s.fundingType || s.role || "").toLowerCase() === "collaborator"
    ).length;
  }, [sponsorships]);

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
  const projectStatus = String(project.status || "Active");
  const ngoName = ngoProfile?.organisationName || ngoProfile?.organizationName || ngoProfile?.orgName || project.orgName || project.ngoName || "Community organisation";
  const isVerified = !!ngoProfile?.verified || !!ngoProfile?.isVerified;
  const deadline = project.deadline || project.endDate || null;

  // Build sponsor avatars (unique, first 4)
  const avatarColors = ["#059669", "#D9C982", "#8C7A6B", "#6366F1"];
  const uniqueSponsors = [];
  const seenIds = new Set();
  paidSponsorships.forEach((s) => {
    if (s.sponsorId && !seenIds.has(s.sponsorId)) {
      seenIds.add(s.sponsorId);
      const name = s.sponsorName || sponsorNames[s.sponsorId] || "?";
      uniqueSponsors.push({ id: s.sponsorId, name, initial: name.trim().charAt(0).toUpperCase() });
    }
  });

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* ─── PROJECT HEADER CARD ─── */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.projectTitle} numberOfLines={2}>{project.title || "Untitled project"}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{projectStatus}</Text>
            </View>
          </View>

          {/* NGO info */}
          <View style={styles.ngoRow}>
            <Text style={styles.ngoName}>{ngoName}</Text>
            {isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color={COLORS.emerald} />
                <Text style={styles.verifiedText}>Verified NGO</Text>
              </View>
            )}
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
            <View style={styles.fundingDetailsRow}>
              <Text style={styles.fundingRaised}>{money(raised)} of {money(goal)}</Text>
              {deadline && (
                <Text style={styles.deadline}>Deadline: {typeof deadline === "string" ? deadline : deadline?.toDate?.()?.toLocaleDateString("en-ZA") || "TBD"}</Text>
              )}
            </View>
            {remaining > 0 && (
              <Text style={styles.fundingRemaining}>{money(remaining)} remaining to reach target</Text>
            )}
          </View>
        </View>

        {/* ─── SPONSORS & COLLABORATORS SUMMARY ─── */}
        {uniqueSponsors.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sponsorSummaryRow}>
              <View style={styles.avatarStack}>
                {uniqueSponsors.slice(0, 4).map((s, i) => (
                  <View
                    key={s.id}
                    style={[
                      styles.stackedAvatar,
                      { backgroundColor: avatarColors[i % avatarColors.length], marginLeft: i > 0 ? -10 : 0, zIndex: 10 - i },
                    ]}
                  >
                    <Text style={styles.stackedAvatarText}>{s.initial}</Text>
                  </View>
                ))}
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.sponsorSummaryTitle}>
                  {sponsorCount} sponsor{sponsorCount !== 1 ? "s" : ""}
                  {collaboratorCount > 0 ? `, ${collaboratorCount} collaborator${collaboratorCount !== 1 ? "s" : ""}` : ""}
                </Text>
                <Text style={styles.sponsorSummarySubtitle} numberOfLines={1}>
                  {uniqueSponsors[0]?.name || ""}
                  {uniqueSponsors.length > 1 ? " and others" : ""}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── PROGRESS UPDATES ─── */}
        <Text style={styles.sectionLabel}>PROGRESS UPDATES</Text>

        {updates.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.mutedText}>The organisation has not posted an update yet.</Text>
          </View>
        ) : (
          updates.map((item, index) => {
            const isLatest = index === 0;
            const timeLabel = isToday(item.createdAt) ? "Today" : relativeDate(item.createdAt);
            const attachments = Array.isArray(item.media) ? item.media : (Array.isArray(item.mediaUrls) ? item.mediaUrls : []);
            return (
              <View
                key={item.id}
                style={[styles.updateCard, isLatest && styles.updateCardLatest]}
              >
                <View style={styles.updateHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.updateMilestone}>
                      {item.milestone ? `Milestone ${updates.length - index}: ${item.milestone}` : "Project update"}
                    </Text>
                    {!isLatest && <Text style={styles.updateSubLabel}>Earlier update</Text>}
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    {timeLabel ? <Text style={styles.dateLabel}>{timeLabel}</Text> : null}
                  </View>
                </View>

                <Text style={styles.updateBody}>{item.text || ""}</Text>

                {attachments.length > 0 && (
                  <View style={styles.updateMediaRow}>
                    {attachments.map((attachment, mediaIndex) => {
                      const uri = typeof attachment === "string" ? attachment : attachment.url;
                      if (!uri) return null;
                      return <Image key={`${item.id}-media-${mediaIndex}`} source={{ uri }} style={styles.updateMedia} />;
                    })}
                  </View>
                )}

                {(item.progress != null || item.beneficiaries != null) && (
                  <View style={styles.metricRow}>
                    {item.beneficiaries != null && (
                      <View style={styles.metricBadge}>
                        <Text style={styles.metricBadgeText}>
                          {Number(item.beneficiaries).toLocaleString("en-ZA")} households
                        </Text>
                      </View>
                    )}
                    <View style={[styles.metricBadge, styles.metricSelfReported]}>
                      <Text style={styles.metricSelfReportedText}>Self-reported</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* ─── ACTION BUTTONS ─── */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.sponsorButton}
            onPress={() => navigation.navigate("SponsorProposal", { projectId: project.id })}
            activeOpacity={0.85}
          >
            <Text style={styles.sponsorButtonText}>Sponsor this project</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => {
              const ngoId = project.ngoOwnerId || project.ownerId;
              if (ngoId) {
                navigation.navigate("Chat", { recipientId: ngoId, recipientName: ngoName });
              }
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.messageButtonText}>Message the NGO</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  errorText: { fontFamily: "Manrope_500Medium", color: "#9B1C1C", fontSize: 13 },

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
  statusBadge: { backgroundColor: COLORS.emeraldSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontFamily: "Manrope_700Bold", fontSize: 11, color: COLORS.emerald, textTransform: "uppercase" },

  // NGO
  ngoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  ngoName: { fontFamily: "Manrope_500Medium", fontSize: 13, color: COLORS.textSecondary },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: COLORS.emeraldSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  verifiedText: { fontFamily: "Manrope_700Bold", fontSize: 10, color: COLORS.emerald },

  // Funding
  progressSection: { marginTop: 14 },
  progressTrack: { height: 8, backgroundColor: "#E8F5E9", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: COLORS.emerald, borderRadius: 4 },
  fundingDetailsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  fundingRaised: { fontFamily: "Manrope_600SemiBold", fontSize: 13, color: COLORS.textPrimary },
  deadline: { fontFamily: "Manrope_500Medium", fontSize: 12, color: COLORS.textSecondary },
  fundingRemaining: { fontFamily: "Manrope_500Medium", fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },

  // Sponsor summary
  sponsorSummaryRow: { flexDirection: "row", alignItems: "center" },
  avatarStack: { flexDirection: "row" },
  stackedAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: COLORS.white },
  stackedAvatarText: { fontFamily: "Manrope_700Bold", fontSize: 13, color: COLORS.white },
  sponsorSummaryTitle: { fontFamily: "Manrope_700Bold", fontSize: 14, color: COLORS.textPrimary },
  sponsorSummarySubtitle: { fontFamily: "Manrope_500Medium", fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  // Section label
  sectionLabel: { fontFamily: "Manrope_700Bold", fontSize: 11, color: COLORS.textSecondary, letterSpacing: 0.5, marginTop: 4 },

  // Updates
  updateCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...softShadow,
  },
  updateCardLatest: {
    borderColor: COLORS.emerald,
    borderWidth: 1.5,
  },
  updateHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  updateMilestone: { fontFamily: "Manrope_700Bold", fontSize: 15, color: COLORS.textPrimary },
  updateSubLabel: { fontFamily: "Manrope_500Medium", fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  dateLabel: { fontFamily: "Manrope_500Medium", fontSize: 12, color: COLORS.textSecondary },
  updateBody: { fontFamily: "Manrope_500Medium", fontSize: 14, lineHeight: 20, color: COLORS.textPrimary, marginTop: 8 },
  updateMediaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  updateMedia: { width: 88, height: 72, borderRadius: 10, backgroundColor: COLORS.primarySoft },
  metricRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  metricBadge: { backgroundColor: COLORS.emeraldSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  metricBadgeText: { fontFamily: "Manrope_700Bold", fontSize: 11, color: COLORS.emerald },
  metricSelfReported: { backgroundColor: COLORS.goldSoft },
  metricSelfReportedText: { fontFamily: "Manrope_700Bold", fontSize: 11, color: "#8B7D35" },
  mutedText: { fontFamily: "Manrope_500Medium", fontSize: 13, color: COLORS.textSecondary },

  // Bottom actions
  bottomActions: { gap: 10, marginTop: 8 },
  sponsorButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sponsorButtonText: { fontFamily: "Manrope_700Bold", fontSize: 16, color: COLORS.white },
  messageButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  messageButtonText: { fontFamily: "Manrope_700Bold", fontSize: 16, color: COLORS.textPrimary },
});
