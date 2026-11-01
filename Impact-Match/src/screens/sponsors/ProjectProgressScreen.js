import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../../Backend/firebaseConfig";
import { startConversationWithNgo } from "../../utils/startConversation";

// ============================================================================
// IMPACT TAB COLOR PALETTE & TYPOGRAPHY
// ============================================================================
const C = {
  background: "#FAF8F2",      // Warm cream screen background
  surface: "#FFFFFF",         // Crisp white cards
  border: "#EFECE4",          // Soft warm card border
  ink: "#261C15",             // Deep warm charcoal/brown for headings
  body: "#1F2937",            // Clean dark slate for update body text
  muted: "#7D746A",           // Warm taupe/grey for subtitles & labels
  emerald: "#059A6E",         // Vibrant emerald for progress bar & raised text
  forest: "#074736",          // Deep forest green for primary buttons & active pill
  badgeBg: "#F4F1E8",         // Soft cream pill background for ACTIVE/SPONSORED
  badgeInk: "#3C352E",        // Dark pill text
  track: "#F3F0E8",           // Progress bar background track
  white: "#FFFFFF",
};

const FONT = Platform.select({
  ios: "System",
  android: "sans-serif",
  default: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
});

const isPaid = (s) =>
  ["paid", "complete", "completed", "active"].includes(
    String(s.paymentStatus || s.status || "").toLowerCase()
  ) ||
  !!s.paidAt ||
  !!s.transactionReference;

const money = (value) => `R ${Number(value || 0).toLocaleString("en-ZA")}`;

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return "Just now";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return "Just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function SponsorProjectUpdatesScreen({ navigation, route }) {
  const projectId = route?.params?.projectId;
  const [project, setProject] = useState(null);
  const [sponsorships, setSponsorships] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return undefined;
    }

    // 1. Listen to Project Document
    const stopProject = onSnapshot(doc(db, "projects", projectId), (snap) => {
      setProject(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    }, () => setLoading(false));

    // 2. Listen to Sponsorships for accurate raised amount & sponsor count
    const stopSponsorships = onSnapshot(
      query(collection(db, "sponsorships"), where("projectId", "==", projectId)),
      (snap) => {
        setSponsorships(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
      }
    );

    // 3. Listen to Project Updates Subcollection
    const stopUpdates = onSnapshot(
      query(
        collection(db, "projects", projectId, "updates"),
        orderBy("createdAt", "desc")
      ),
      (snap) => {
        setUpdates(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => {
      stopProject();
      stopSponsorships();
      stopUpdates();
    };
  }, [projectId]);

  const paidSponsorships = useMemo(() => sponsorships.filter(isPaid), [sponsorships]);
  const sponsorCount = new Set(
    paidSponsorships.map((item) => item.sponsorId).filter(Boolean)
  ).size;
  const raisedFromSponsorships = paidSponsorships.reduce(
    (total, item) => total + (Number(item.amount) || 0),
    0
  );
  const raised = Math.max(Number(project?.raisedAmount) || 0, raisedFromSponsorships);
  const goal = Number(project?.fundingGoal ?? project?.goalAmount) || 0;
  const ratio = goal > 0 ? Math.min(raised / goal, 1) : 0;

  const handleNavigate = (screenName, params = {}) => {
    if (navigation?.navigate) {
      navigation.navigate(screenName, params);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.forest} />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>{projectId ? "Project unavailable." : "No project was selected. Return to Impact and open a project to view its progress."}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* ================================================================== */}
      {/* TOP BAR                                                            */}
      {/* ================================================================== */}

      
     {/* <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation?.goBack && navigation.goBack()}
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color={C.forest} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Project Updates</Text>
        <TouchableOpacity style={styles.iconBtn} accessibilityRole="button">
          <Ionicons name="search-outline" size={22} color={C.forest} />
        </TouchableOpacity>
      </View>
      */}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================================ */}
        {/* PROJECT SUMMARY CARD (Matches Impact Tab Card Style)             */}
        {/* ================================================================ */}
        <View style={styles.projectCard}>
          <View style={styles.projectTopRow}>
            {project.imageUrl ? (
              <Image source={{ uri: project.imageUrl }} style={styles.projectThumb} />
            ) : (
              <View style={styles.projectIconWrap}>
                <Ionicons name="book-outline" size={22} color={C.emerald} />
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.projectTitle}>{project.title || "Project"}</Text>
              <Text style={styles.orgName}>
                {project.orgName || project.ngoName || "BrightPath Youth Initiative"}
              </Text>
              {project.beneficiariesCount !== undefined && (
                <Text style={styles.beneficiariesText}>
                  {Number(project.beneficiariesCount || 0).toLocaleString("en-ZA")}{" "}
                  beneficiaries
                </Text>
              )}
            </View>

            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>
                {(project.status || "SPONSORED").toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
          </View>

          <View style={styles.fundingRow}>
            <Text style={styles.fundingRaised}>
              {money(raised)} <Text style={styles.fundingTotal}>of {money(goal)}</Text>
            </Text>
            <Text style={styles.sponsorCountText}>
              {sponsorCount} sponsor{sponsorCount !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* ================================================================ */}
        {/* UPDATES LIST                                                     */}
        {/* ================================================================ */}
        <Text style={styles.sectionLabel}>LATEST UPDATES FROM NGO</Text>

        {updates.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="newspaper-outline" size={32} color={C.muted} />
            <Text style={styles.emptyTitle}>No updates posted yet</Text>
            <Text style={styles.emptyText}>
              When {project.orgName || project.ngoName || "the NGO"} posts photos,
              videos, or progress notes, they will appear right here.
            </Text>
          </View>
        ) : (
          updates.map((update) => {
            const mediaList = Array.isArray(update.media) ? update.media : [];
            const photos = mediaList.filter((m) => m.type !== "video");
            const videos = mediaList.filter((m) => m.type === "video");

            // If an update only has images (3 images), show 2 in top row and 1 full-width below
            const topRowPhotos = videos.length > 0 ? photos : photos.slice(0, 2);
            const fullWidthItems =
              videos.length > 0 ? videos : photos.slice(2);

            return (
              <View key={update.id} style={styles.updateBlock}>
                {/* 1. SEPARATED DESCRIPTION CARD */}
                <View style={styles.descriptionCard}>
                  <View style={styles.authorRow}>
                    <View style={styles.authorBadge}>
                      <Ionicons name="book" size={14} color={C.forest} />
                    </View>
                    <Text style={styles.authorName} numberOfLines={1}>
                      {update.ngoName ||
                        project.orgName ||
                        project.ngoName ||
                        "BrightPath Youth Initiative"}
                    </Text>
                    <Text style={styles.timeText}>
                      • {formatTimeAgo(update.createdAt)}
                    </Text>
                  </View>

                  <Text style={styles.updateBodyText}>{update.text}</Text>
                  {(update.milestone || update.progress != null || update.beneficiaries != null) && (
                    <View style={styles.progressCheck}>
                      {update.milestone ? <Text style={styles.progressMilestone}>{update.milestone}</Text> : null}
                      <View style={styles.progressCheckRow}>
                        {update.progress != null ? <Text style={styles.progressCheckValue}>Reported progress: {Number(update.progress)}%</Text> : null}
                        {update.beneficiaries != null ? <Text style={styles.progressCheckValue}>Beneficiaries: {Number(update.beneficiaries).toLocaleString("en-ZA")}</Text> : null}
                      </View>
                    </View>
                  )}
                </View>

                {/* 2. SEPARATED ATTACHED MEDIA SECTION (Outside Description Box) */}
                {mediaList.length > 0 && (
                  <View style={styles.mediaSection}>
                    <Text style={styles.mediaSectionLabel}>ATTACHED MEDIA</Text>

                    {/* 2-Column Large Photo Grid */}
                    {topRowPhotos.length > 0 && (
                      <View style={styles.photoGridRow}>
                        {topRowPhotos.map((item, idx) => (
                          <TouchableOpacity
                            key={`${item.url}-${idx}`}
                            style={styles.photoCard}
                            activeOpacity={0.88}
                            onPress={() => setSelectedMedia(item)}
                          >
                            <Image
                              source={{ uri: item.url }}
                              style={styles.photoImage}
                              resizeMode="cover"
                            />
                            <View style={styles.mediaCornerBadge}>
                              <Ionicons
                                name={
                                  item.type === "video" ? "videocam" : "image-outline"
                                }
                                size={14}
                                color={C.white}
                              />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Full-Width Cinema Card for Videos (or 3rd media item) */}
                    {fullWidthItems.map((item, idx) => {
                      const isVideo = item.type === "video";
                      // Generate a thumbnail poster from Cloudinary video URL by swapping extension to .jpg
                      const posterUri = isVideo
                        ? item.url.replace(/\.(mp4|mov|webm|mkv)$/i, ".jpg")
                        : item.url;

                      return (
                        <TouchableOpacity
                          key={`fw-${item.url}-${idx}`}
                          style={styles.fullWidthMediaCard}
                          activeOpacity={0.9}
                          onPress={() => setSelectedMedia(item)}
                        >
                          <Image
                            source={{ uri: posterUri }}
                            style={styles.fullWidthImage}
                            resizeMode="cover"
                          />
                          {isVideo && (
                            <View style={styles.videoCenterOverlay}>
                              <View style={styles.playButtonCircle}>
                                <Ionicons
                                  name="play"
                                  size={26}
                                  color={C.forest}
                                  style={{ marginLeft: 3 }}
                                />
                              </View>
                            </View>
                          )}
                          <View style={styles.mediaCornerBadge}>
                            <Ionicons
                              name={isVideo ? "videocam" : "expand-outline"}
                              size={14}
                              color={C.white}
                            />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ================================================================== */}
      {/* BOTTOM ACTION BUTTONS & FLOATING IMPACT TAB BAR                    */}
      {/* ================================================================== */}
      <View style={styles.bottomContainer}>
        {/* Sponsor Action Buttons Row (Matches Impact Tab Outline + Solid Forest Buttons) */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={() => startConversationWithNgo(navigation, {
              id: project.ngoOwnerId || project.ownerId || project.ngoId,
              organisationName: project.orgName || project.ngoName,
            })}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryActionText}>Message NGO</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() =>
              handleNavigate("SponsorProposal", { projectId: project.id })
            }
            accessibilityRole="button"
          >
            <Text style={styles.primaryActionText}>Propose support</Text>
          </TouchableOpacity>
        </View>

        {/* Floating Pill Bottom Navigation Bar (Matches screenshot) */}
        <View style={styles.bottomNavPill}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigate("Home")}
          >
            <Ionicons name="home-outline" size={20} color={C.muted} />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigate("Discover")}
          >
            <Ionicons name="compass-outline" size={20} color={C.muted} />
            <Text style={styles.navText}>Discover</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigate("Matches")}
          >
            <Ionicons name="people-outline" size={20} color={C.muted} />
            <Text style={styles.navText}>Matches</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigate("Messages")}
          >
            <Ionicons name="chatbubble-outline" size={20} color={C.muted} />
            <Text style={styles.navText}>Messages</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigate("Impact")}
          >
            <View style={styles.activeImpactPill}>
              <Ionicons name="trending-up" size={18} color={C.white} />
            </View>
            <Text style={styles.navTextActive}>Impact</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ================================================================== */}
      {/* FULL-SCREEN LIGHTBOX / VIDEO PLAYER MODAL                          */}
      {/* ================================================================== */}
      <Modal
        visible={!!selectedMedia}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMedia(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setSelectedMedia(null)}
          >
            <Ionicons name="close-circle" size={38} color={C.white} />
          </TouchableOpacity>

          {selectedMedia && (
            <View style={styles.modalContent}>
              {selectedMedia.type === "video" && Platform.OS === "web" ? (
                <video
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  style={{
                    width: "100%",
                    maxHeight: 420,
                    borderRadius: 16,
                    backgroundColor: "#000",
                  }}
                />
              ) : (
                <>
                  <Image
                    source={{
                      uri:
                        selectedMedia.type === "video"
                          ? selectedMedia.url.replace(/\.(mp4|mov|webm|mkv)$/i, ".jpg")
                          : selectedMedia.url,
                    }}
                    style={styles.modalFullImage}
                    resizeMode="contain"
                  />
                  {selectedMedia.type === "video" && (
                    <TouchableOpacity
                      style={styles.openVideoExternalBtn}
                      onPress={() => Linking.openURL(selectedMedia.url)}
                    >
                      <Ionicons name="play-circle" size={22} color={C.white} />
                      <Text style={styles.openVideoExternalText}>
                        Play Full Video
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: C.background,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: C.forest,
    fontFamily: FONT,
    marginLeft: 6,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 180,
    gap: 16,
  },

  // Project Top Summary Card
  projectCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
    shadowColor: "#261C15",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  projectTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  projectThumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: C.badgeBg,
  },
  projectIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.ink,
    fontFamily: FONT,
  },
  orgName: {
    fontSize: 13,
    color: C.muted,
    marginTop: 2,
    fontFamily: FONT,
  },
  beneficiariesText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.emerald,
    marginTop: 2,
    fontFamily: FONT,
  },
  statusPill: {
    backgroundColor: C.badgeBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: C.badgeInk,
    letterSpacing: 0.4,
    fontFamily: FONT,
  },
  progressTrack: {
    height: 8,
    backgroundColor: C.track,
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: C.emerald,
    borderRadius: 6,
  },
  fundingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fundingRaised: {
    fontSize: 13,
    fontWeight: "700",
    color: C.ink,
    fontFamily: FONT,
  },
  fundingTotal: {
    fontWeight: "500",
    color: C.ink,
  },
  sponsorCountText: {
    fontSize: 13,
    fontWeight: "500",
    color: C.ink,
    fontFamily: FONT,
  },

  // Section Header
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.muted,
    letterSpacing: 0.7,
    marginTop: 4,
    fontFamily: FONT,
  },

  // Update Block (Description Card + Separated Media Section)
  updateBlock: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    gap: 14,
    shadowColor: "#261C15",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  descriptionCard: {
    gap: 10,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  authorBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#E6F4EE",
    alignItems: "center",
    justifyContent: "center",
  },
  authorName: {
    fontSize: 14,
    fontWeight: "700",
    color: C.forest,
    fontFamily: FONT,
    flexShrink: 1,
  },
  timeText: {
    fontSize: 13,
    color: C.muted,
    fontFamily: FONT,
  },
  updateBodyText: {
    fontSize: 14,
    lineHeight: 21,
    color: C.body,
    fontFamily: FONT,
  },
  progressCheck: { marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: "#F1F8F5", gap: 6 },
  progressMilestone: { color: C.forest, fontSize: 14, fontWeight: "700" },
  progressCheckRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  progressCheckValue: { color: C.body, fontSize: 12, fontWeight: "600" },

  // Separated Attached Media Section
  mediaSection: {
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: C.border,
    gap: 10,
  },
  mediaSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.muted,
    letterSpacing: 0.6,
    fontFamily: FONT,
  },
  photoGridRow: {
    flexDirection: "row",
    gap: 10,
  },
  photoCard: {
    flex: 1,
    height: 148,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: C.badgeBg,
    position: "relative",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  fullWidthMediaCard: {
    width: "100%",
    height: 175,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: C.badgeBg,
    position: "relative",
  },
  fullWidthImage: {
    width: "100%",
    height: "100%",
  },
  videoCenterOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  playButtonCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaCornerBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(38, 28, 21, 0.6)",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  // Empty State
  emptyCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.ink,
    fontFamily: FONT,
  },
  emptyText: {
    fontSize: 13,
    color: C.muted,
    textAlign: "center",
    lineHeight: 19,
    fontFamily: FONT,
  },

  // Bottom Fixed Container (Buttons + Floating Nav Bar)
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: "rgba(250, 248, 242, 0.96)",
    borderTopWidth: 1,
    borderTopColor: C.border,
    gap: 10,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryActionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E3DEC9",
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: C.forest,
    fontFamily: FONT,
  },
  primaryActionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: C.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: C.white,
    fontFamily: FONT,
  },

  // Floating Pill Navigation Bar (Matches Impact Tab Screenshot)
  bottomNavPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: C.surface,
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#261C15",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    minWidth: 54,
  },
  activeImpactPill: {
    backgroundColor: C.forest,
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  navText: {
    fontSize: 10,
    fontWeight: "500",
    color: C.muted,
    fontFamily: FONT,
  },
  navTextActive: {
    fontSize: 10,
    fontWeight: "700",
    color: C.forest,
    fontFamily: FONT,
  },

  // Lightbox Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(18, 14, 10, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCloseBtn: {
    position: "absolute",
    top: 42,
    right: 20,
    zIndex: 10,
  },
  modalContent: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  modalFullImage: {
    width: "100%",
    height: 420,
    borderRadius: 14,
  },
  openVideoExternalBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.forest,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  openVideoExternalText: {
    color: C.white,
    fontWeight: "700",
    fontSize: 14,
    fontFamily: FONT,
  },
});
