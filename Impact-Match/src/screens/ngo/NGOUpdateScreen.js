import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "@react-native-vector-icons/ionicons";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../../../Backend/firebaseConfig";

// ============================================================================
// CLOUDINARY CONFIGURATION (Unsigned Upload - Safe for React Native)
// ============================================================================
const CLOUDINARY_CLOUD_NAME = "dtpp6ojbl";
const CLOUDINARY_UPLOAD_PRESET = "impactmatch_updates";

const C = {
  background: "#F5F8F7",
  surface: "#FFFFFF",
  primary: "#0B6B53",
  ink: "#1F2937",
  muted: "#718096",
  border: "#E2E8E5",
  soft: "#E7F4EF",
  gold: "#FBF0DA",
  white: "#FFFFFF",
  danger: "#B42318",
  dangerSoft: "#FEE4E2",
};

const isPaid = (s) =>
  ["paid", "complete", "completed", "active"].includes(
    String(s.paymentStatus || s.status || "").toLowerCase()
  ) ||
  !!s.paidAt ||
  !!s.transactionReference;

const money = (value) => `R ${Number(value || 0).toLocaleString("en-ZA")}`;

// Helper to upload an image or video asset from Expo ImagePicker to Cloudinary
const uploadToCloudinary = async (asset) => {
  const isVideo =
    asset.type === "video" || (asset.mimeType && asset.mimeType.startsWith("video/"));
  const defaultExt = isVideo ? "mp4" : "jpg";
  const fileName = asset.fileName || `update_${Date.now()}.${defaultExt}`;
  const mimeType = asset.mimeType || (isVideo ? "video/mp4" : "image/jpeg");

  const formData = new FormData();

  // Handle BOTH Web (localhost) and Mobile (Expo Go)
  if (Platform.OS === "web") {
    const fileResponse = await fetch(asset.uri);
    const blob = await fileResponse.blob();
    formData.append("file", blob, fileName);
  } else {
    formData.append("file", {
      uri: asset.uri,
      type: mimeType,
      name: fileName,
    });
  }

  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "impactmatch/project_updates");

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.secure_url) {
    throw new Error(data.error?.message || "Failed to upload media to Cloudinary.");
  }

  const optimizedUrl = data.secure_url.replace("/upload/", "/upload/f_auto,q_auto/");

  return {
    url: optimizedUrl,
    rawUrl: data.secure_url,
    publicId: data.public_id,
    type: data.resource_type || (isVideo ? "video" : "image"),
    name: fileName,
  };
};

export default function NGOUpdateScreen({ navigation, route }) {
  const projectId = route.params?.projectId;
  const [project, setProject] = useState(null);
  const [sponsorships, setSponsorships] = useState([]);
  const [sponsorNames, setSponsorNames] = useState({});
  const [description, setDescription] = useState("");
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Status Modal State (Success / Error popup)
  const [statusModal, setStatusModal] = useState({
    visible: false,
    type: "success", // "success" | "error"
    title: "",
    message: "",
  });

  const showStatusModal = (type, title, message) => {
    setStatusModal({ visible: true, type, title, message });
  };

  const closeStatusModal = () => {
    setStatusModal((prev) => ({ ...prev, visible: false }));
  };

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return undefined;
    }
    const stopProject = onSnapshot(
      doc(db, "projects", projectId),
      (snap) => {
        setProject(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        showStatusModal(
          "error",
          "Could not load project",
          error?.message || "Please try again."
        );
      }
    );
    const stopSponsorships = onSnapshot(
      query(collection(db, "sponsorships"), where("projectId", "==", projectId)),
      (snap) => {
        setSponsorships(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
      }
    );
    return () => {
      stopProject();
      stopSponsorships();
    };
  }, [projectId]);

  const paidSponsorships = useMemo(() => sponsorships.filter(isPaid), [sponsorships]);

  // Deduplicate sponsors so the same sponsor isn't listed multiple times
  const uniqueSponsors = useMemo(() => {
    const seen = new Set();
    return paidSponsorships.filter((item) => {
      const key = item.sponsorId || item.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [paidSponsorships]);

  const sponsorCount = new Set(paidSponsorships.map((item) => item.sponsorId).filter(Boolean)).size;
  const raisedFromSponsorships = paidSponsorships.reduce(
    (total, item) => total + (Number(item.amount) || 0),
    0
  );
  const raised = Math.max(Number(project?.raisedAmount) || 0, raisedFromSponsorships);
  const goal = Number(project?.fundingGoal ?? project?.goalAmount) || 0;
  const ratio = goal > 0 ? Math.min(raised / goal, 1) : 0;

  useEffect(() => {
    const sponsorIds = [...new Set(paidSponsorships.map((item) => item.sponsorId).filter(Boolean))];
    sponsorIds.forEach((sponsorId) => {
      if (sponsorNames[sponsorId] !== undefined) return;
      getDoc(doc(db, "users", sponsorId))
        .then((snap) => {
          const data = snap.exists() ? snap.data() : {};
          const name =
            data.organisationName ||
            data.organizationName ||
            data.orgName ||
            data.companyName ||
            data.name ||
            data.displayName ||
            "Anonymous sponsor";
          setSponsorNames((previous) => ({ ...previous, [sponsorId]: name }));
        })
        .catch(() =>
          setSponsorNames((previous) => ({ ...previous, [sponsorId]: "Anonymous sponsor" }))
        );
    });
  }, [paidSponsorships, sponsorNames]);

  const pickMedia = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showStatusModal(
          "error",
          "Media Access Needed",
          "Please allow access to your media library to attach photos or videos."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsMultipleSelection: true,
        selectionLimit: 3,
        quality: 0.8,
      });
      if (!result.canceled) {
        setMedia((current) => [...current, ...result.assets].slice(0, 3));
      }
    } catch (error) {
      showStatusModal(
        "error",
        "Media Library Error",
        error?.message || "Could not open your media library. Please try again."
      );
    }
  };

  const postUpdate = async () => {
    if (!project || !uid || (project.ngoOwnerId !== uid && project.ownerId !== uid)) {
      showStatusModal(
        "error",
        "Access Denied",
        "You can only post updates to your organisation's projects."
      );
      return;
    }
    if (!description.trim()) {
      showStatusModal(
        "error",
        "Description Required",
        "Please describe what you added and the progress made before posting."
      );
      return;
    }

    setSaving(true);
    try {
      const uploadedMedia = await Promise.all(
        media.map((asset) => uploadToCloudinary(asset))
      );

      const updatePayload = {
        projectId,
        projectTitle: project.title || "",
        ngoName: project.ngoName || project.orgName || "",
        ownerId: uid,
        text: description.trim(),
        media: uploadedMedia,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "projects", projectId, "updates"), updatePayload);

      await updateDoc(doc(db, "projects", projectId), {
        updatedAt: serverTimestamp(),
        latestUpdate: {
          text: description.trim(),
          mediaCount: uploadedMedia.length,
          firstMediaUrl: uploadedMedia[0]?.url || null,
          updatedAt: new Date().toISOString(),
        },
      });

      setDescription("");
      setMedia([]);
      showStatusModal(
        "success",
        "Update Posted Successfully!",
        "Your project update and media have been uploaded. Sponsors can now view your latest progress."
      );
    } catch (error) {
      showStatusModal(
        "error",
        "Update Failed",
        error?.message || "Something went wrong while posting your update. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  if (!project)
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Project unavailable.</Text>
      </View>
    );

  const isSuccess = statusModal.type === "success";

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.projectTitle}>{project.title || "Project"}</Text>
              <Text style={styles.orgName}>
                {project.orgName || project.ngoName || "Your organisation"}
              </Text>
            </View>
            <View style={styles.status}>
              <Text style={styles.statusText}>{project.status || "Active"}</Text>
            </View>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
          </View>
          <View style={styles.fundingRow}>
            <Text style={styles.funding}>
              {money(raised)} of {money(goal)}
            </Text>
            <Text style={styles.funding}>
              {sponsorCount} sponsor{sponsorCount !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {uniqueSponsors.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>SPONSORS</Text>
            {uniqueSponsors.map((sponsorship) => {
              const name =
                sponsorship.sponsorName ||
                sponsorNames[sponsorship.sponsorId] ||
                "Anonymous sponsor";
              const collaborator =
                String(sponsorship.fundingType || sponsorship.role || "").toLowerCase() ===
                "collaborator";
              return (
                <View key={sponsorship.id} style={styles.sponsorRow}>
                  <View style={[styles.avatar, collaborator && { backgroundColor: C.gold }]}>
                    <Text style={styles.avatarText}>
                      {name.trim().charAt(0).toUpperCase() || "?"}
                    </Text>
                  </View>
                  <Text style={styles.sponsorName} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={[styles.role, collaborator && { backgroundColor: C.gold }]}>
                    {collaborator ? "Collaborator" : "Sponsor"}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>PROJECT UPDATE</Text>
          <Text style={styles.fieldLabel}>What did you add, and what does it do?</Text>
          <TextInput
            style={styles.description}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what was added, how it works, and the progress made"
            placeholderTextColor="#94A3B8"
            multiline
            textAlignVertical="top"
            editable={!saving}
          />
          <TouchableOpacity
            style={styles.mediaPicker}
            onPress={pickMedia}
            disabled={saving}
            accessibilityRole="button"
          >
            <Ionicons name="images-outline" size={22} color={C.primary} />
            <Text style={styles.mediaText}>Tap to add photos or videos</Text>
            <Ionicons name="add-circle-outline" size={22} color={C.primary} />
          </TouchableOpacity>
          {media.length > 0 && (
            <View style={styles.mediaRow}>
              {media.map((asset, index) => (
                <View key={`${asset.uri}-${index}`} style={styles.previewWrap}>
                  <Image source={{ uri: asset.uri }} style={styles.preview} />
                  {asset.type === "video" && (
                    <View style={styles.videoBadge}>
                      <Ionicons name="videocam" size={14} color={C.white} />
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removeMedia}
                    onPress={() => setMedia((current) => current.filter((_, i) => i !== index))}
                    accessibilityLabel="Remove attachment"
                  >
                    <Ionicons name="close-circle" size={22} color={C.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.postButton, saving && { opacity: 0.65 }]}
          onPress={postUpdate}
          disabled={saving}
          accessibilityRole="button"
        >
          {saving ? (
            <ActivityIndicator color={C.white} />
          ) : (
            <Text style={styles.postButtonText}>Post an update</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ==================================================================== */}
      {/* SUCCESS / ERROR MODAL                                                */}
      {/* ==================================================================== */}
      <Modal
        visible={statusModal.visible}
        transparent
        animationType="fade"
        onRequestClose={closeStatusModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={[
                styles.modalIconCircle,
                { backgroundColor: isSuccess ? C.soft : C.dangerSoft },
              ]}
            >
              <Ionicons
                name={isSuccess ? "checkmark-circle" : "alert-circle"}
                size={40}
                color={isSuccess ? C.primary : C.danger}
              />
            </View>
            <Text style={styles.modalTitle}>{statusModal.title}</Text>
            <Text style={styles.modalMessage}>{statusModal.message}</Text>
            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: isSuccess ? C.primary : C.danger },
              ]}
              onPress={closeStatusModal}
              accessibilityRole="button"
            >
              <Text style={styles.modalButtonText}>
                {isSuccess ? "Done" : "Try Again"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { padding: 16, gap: 14, paddingBottom: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.background },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  projectTitle: { fontSize: 18, fontWeight: "700", color: C.ink },
  orgName: { fontSize: 13, color: C.muted, marginTop: 4 },
  status: {
    backgroundColor: C.soft,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: { color: C.primary, fontSize: 11, fontWeight: "700" },
  track: { height: 8, backgroundColor: "#E5E7EB", borderRadius: 8, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: C.primary, borderRadius: 8 },
  fundingRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  funding: { color: C.muted, fontSize: 12 },
  sectionTitle: { color: C.muted, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  sponsorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: C.primary, fontWeight: "700" },
  sponsorName: { flex: 1, color: C.ink, fontWeight: "600", fontSize: 13 },
  role: {
    color: C.primary,
    backgroundColor: C.soft,
    borderRadius: 12,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: "700",
  },
  fieldLabel: { color: C.ink, fontSize: 14, fontWeight: "600" },
  description: {
    minHeight: 125,
    padding: 13,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    color: C.ink,
    fontSize: 14,
    backgroundColor: C.white,
  },
  mediaPicker: {
    minHeight: 58,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: C.primary,
    borderRadius: 12,
    backgroundColor: "#F9FCFA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  mediaText: { color: C.primary, fontSize: 13, fontWeight: "600" },
  mediaRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  previewWrap: { position: "relative" },
  preview: { width: 82, height: 82, borderRadius: 10, backgroundColor: C.soft },
  videoBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  removeMedia: {
    position: "absolute",
    top: -7,
    right: -7,
    backgroundColor: C.white,
    borderRadius: 12,
  },
  bottom: {
    padding: 14,
    paddingBottom: 20,
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  postButton: {
    minHeight: 50,
    borderRadius: 13,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  postButtonText: { color: C.white, fontSize: 15, fontWeight: "700" },
  muted: { color: C.muted, fontSize: 14 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
    gap: 10,
  },
  modalIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.ink,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: C.muted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  modalButton: {
    width: "100%",
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    color: C.white,
    fontSize: 15,
    fontWeight: "700",
  },
});