import React, { useState, useEffect, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    Modal,
    StatusBar,
    ActivityIndicator,
    Alert,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";

import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../../Backend/firebaseConfig";
import { loadSponsorInterests, setSaved, setInterested } from "../../utils/interests";
import { matchesQuery, searchAlgolia, orderByIds, algoliaEnabled } from "../../utils/search";
import { ALGOLIA } from "../../config/algolia";
import { startConversationWithNgo } from "../../utils/startConversation";

// ======================================================
// LUXURY THEME CONFIG
// ======================================================

const COLORS = {
  background: "#F8F6EE",       // Cream base
  surface: "#FFFFFF",          // Clean white
  primary: "#D9C982",          // Soft Luxury Gold
  primarySoft: "rgba(217, 201, 130, 0.15)",
  emerald: "#059669",          // Vibrant Emerald
  emeraldSoft: "rgba(5, 150, 105, 0.1)",
  buttonDark: "#013e37",       // Deep luxury green
  buttonDarkSoft: "rgba(1, 62, 55, 0.08)",
  textPrimary: "#433327",      // Warm Bronze
  textSecondary: "#8C7A6B",    // Muted taupe
  border: "#E8DFD5",
  danger: "#DC2626",           // Elegant red for favorites
  white: "#FFFFFF",
};

const softShadow = {
  shadowColor: COLORS.textPrimary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 10,
  elevation: 3,
};

// Premium unified avatar colors
const AVATAR_COLORS = [
  COLORS.buttonDark, 
  COLORS.emerald, 
  COLORS.primary, 
  "#607A70", 
  "#8C7A6B"
];

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ======================================================
// MAIN SCREEN
// ======================================================

export default function SponsorDiscoverScreen({ navigation }) {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  const [activeTab, setActiveTab] = useState("Organisations");
  const [searchQuery, setSearchQuery] = useState("");
  const [algoliaHits, setAlgoliaHits] = useState({ ngos: null, projects: null }); // ids from Algolia, or null
  const [favorites, setFavorites] = useState({});
  const [interestedIds, setInterestedIds] = useState({});

  // Data state
  const [ngos, setNgos] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCause, setSelectedCause] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Detail modals
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // ====================================================
  // FETCH DATA
  // ====================================================

  useEffect(() => {
    const fetchNgos = async () => {
      try {
        setLoading(true);
        const ngoQuery = query(collection(db, "users"), where("role", "==", "ngo"));
        const snapshot = await getDocs(ngoQuery);

        const results = snapshot.docs.map((docSnap, index) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.organisationName || "Unnamed NGO",
            abbrev: getInitials(data.organisationName),
            verified: !!data.profileCompleted,
            location: data.location || "Location not provided",
            causes: data.targetCommunity ? [data.targetCommunity] : [],
            sdgs: Array.isArray(data.sdgs) ? data.sdgs : [],
            description: data.mission || "No mission statement provided yet.",
            fundingNeed: data.fundingRequired ? `R${data.fundingRequired}` : "Not specified",
            bgStyle: { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] },
            profileImageUrl: data.profileImageUrl || null,
            email: data.email || "Not provided",
            about: data.mission || "No further details provided yet.",
          };
        });

        setNgos(results);
      } catch (error) {
        console.log("Error fetching NGOs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNgos();
  }, []);

  useEffect(() => {
    const projectsQuery = query(
      collection(db, "projects"),
      where("status", "in", ["open", "active", "Active"])
    );
    return onSnapshot(projectsQuery, (snapshot) => {
      const rows = snapshot.docs.map((projectDoc) => {
        const project = projectDoc.data();
        return {
          id: projectDoc.id,
          ...project,
          title: project.title || "Untitled project",
          orgName: project.orgName || "Community organisation",
          cause: project.cause || "Community impact",
          location: project.location || "Location not specified",
          description: project.description || "",
          fundingGoal: Number(project.fundingGoal) || 0,
          beneficiaries: project.beneficiaries || "Not specified",
          deadline: project.deadline || "Not specified",
          verified: !!project.ownerVerified,
          image: project.imageUrl || null,
        };
      }).sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      setProjects(rows);
      setProjectsLoading(false);
    }, (error) => {
      console.warn("Could not load projects:", error?.message);
      setProjectsLoading(false);
    });
  }, []);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    loadSponsorInterests(uid)
      .then((map) => {
        const savedMap = {};
        const interestedMap = {};
        Object.keys(map).forEach((ngoId) => {
          if (map[ngoId].saved) savedMap[ngoId] = true;
          if (map[ngoId].interested) interestedMap[ngoId] = true;
        });
        setFavorites((previous) => ({ ...previous, ...savedMap }));
        setInterestedIds(interestedMap);
      })
      .catch((error) => console.log("Error loading interests:", error?.message));
  }, []);

  // ====================================================
  // ACTIONS
  // ====================================================

  const toggleFavorite = async (id) => {
    const next = !favorites[id];
    setFavorites((previous) => ({ ...previous, [id]: next }));

    if (!ngos.some((ngo) => ngo.id === id)) return;
    try {
      await setSaved(id, next);
    } catch (error) {
      setFavorites((previous) => ({ ...previous, [id]: !next }));
      Alert.alert("Could not save", error?.message || "Please try again.");
    }
  };

  const toggleInterest = async (id) => {
    const next = !interestedIds[id];
    setInterestedIds((previous) => ({ ...previous, [id]: next }));

    try {
      await setInterested(id, next);
    } catch (error) {
      setInterestedIds((previous) => ({ ...previous, [id]: !next }));
      Alert.alert("Could not update interest", error?.message || "Please try again.");
    }
  };

  const contactProjectOrganisation = async (project) => {
    setSelectedProject(null);
    await startConversationWithNgo(navigation, {
      id: project.ownerId,
      organisationName: project.orgName,
    });
  };

  const clearFilters = () => {
    setSelectedCause("");
    setSelectedLocation("");
    setVerifiedOnly(false);
  };

  // ====================================================
  // FILTERING LOGIC
  // ====================================================

  // Algolia full-text search (when configured): ask Algolia 250 ms after the user stops typing
  useEffect(() => {
    if (!algoliaEnabled() || !searchQuery.trim()) {
      setAlgoliaHits({ ngos: null, projects: null });
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const [ngoIds, projectIds] = await Promise.all([
        searchAlgolia(ALGOLIA.ngoIndex, searchQuery, { filters: "role:ngo" }),
        searchAlgolia(ALGOLIA.projectIndex, searchQuery),
      ]);
      if (!cancelled) setAlgoliaHits({ ngos: ngoIds, projects: projectIds });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const filteredOrganisations = useMemo(() => {
    const searched = algoliaHits.ngos
      ? orderByIds(ngos, algoliaHits.ngos)
      : ngos.filter((org) => matchesQuery(searchQuery, [org.name, org.description, org.location, org.causes, org.sdgs]));
    return searched.filter((org) => {
      const matchesCause = !selectedCause || org.causes.some((cause) => cause.toLowerCase() === selectedCause.toLowerCase());
      const matchesLocation = !selectedLocation || org.location.toLowerCase().includes(selectedLocation.toLowerCase());
      const matchesVerified = !verifiedOnly || org.verified;
      return matchesCause && matchesLocation && matchesVerified;
    });
  }, [ngos, searchQuery, algoliaHits, selectedCause, selectedLocation, verifiedOnly]);

  const filteredProjects = useMemo(() => {
    const searched = algoliaHits.projects
      ? orderByIds(projects, algoliaHits.projects)
      : projects.filter((project) =>
          matchesQuery(searchQuery, [project.title, project.description, project.cause, project.orgName, project.location])
        );
    return searched.filter((project) => {
      const matchesCause = !selectedCause || project.cause.toLowerCase() === selectedCause.toLowerCase();
      const matchesLocation = !selectedLocation || project.location.toLowerCase().includes(selectedLocation.toLowerCase());
      const matchesVerified = !verifiedOnly || project.verified;
      return matchesCause && matchesLocation && matchesVerified;
    });
  }, [projects, searchQuery, algoliaHits, selectedCause, selectedLocation, verifiedOnly]);

  if (!fontsLoaded) return null;

  // ====================================================
  // UI RENDER
  // ====================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Discover Impact</Text>

          {/* SEARCH & FILTER */}
          <View style={styles.searchRow}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search NGOs, projects or causes"
                placeholderTextColor={COLORS.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
              <Ionicons name="options-outline" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* TABS */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === "Organisations" && styles.activeTabButton]}
              onPress={() => setActiveTab("Organisations")}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === "Organisations" && styles.activeTabText]}>
                Organisations
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === "Projects" && styles.activeTabButton]}
              onPress={() => setActiveTab("Projects")}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === "Projects" && styles.activeTabText]}>
                Projects
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* LOADING STATE */}
        {activeTab === "Organisations" && loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.buttonDark} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* ORGANISATIONS LIST */}
            {activeTab === "Organisations" && (
              filteredOrganisations.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    {ngos.length === 0 ? "No NGOs have signed up yet." : "No organisations match your search or filters."}
                  </Text>
                </View>
              ) : (
                filteredOrganisations.map((org) => (
                  <View key={org.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      {org.profileImageUrl ? (
                        <Image source={{ uri: org.profileImageUrl }} style={styles.avatarImage} />
                      ) : (
                        <View style={[styles.avatar, org.bgStyle]}>
                          <Text style={styles.avatarText}>{org.abbrev}</Text>
                        </View>
                      )}

                      <View style={styles.cardHeaderContent}>
                        <View style={styles.orgNameRow}>
                          <Text style={styles.orgTitle} numberOfLines={1}>{org.name}</Text>
                          {org.verified && <Ionicons name="checkmark-circle" size={16} color={COLORS.emerald} style={styles.verifiedIcon} />}
                        </View>
                        <View style={styles.locationRow}>
                          <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                          <Text style={styles.locationText}>{org.location}</Text>
                        </View>
                      </View>
                    </View>

                    {org.causes.length > 0 && (
                      <View style={styles.chipRow}>
                        {org.causes.map((cause, index) => (
                          <View key={index} style={styles.chip}>
                            <Text style={styles.chipText}>{cause}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <Text style={styles.descriptionText} numberOfLines={2}>{org.description}</Text>

                    <Text style={styles.fundingText}>
                      Funding Need: <Text style={styles.fundingHighlight}>{org.fundingNeed}</Text>
                    </Text>

                    <View style={styles.cardActionRow}>
                      <TouchableOpacity style={styles.primaryButton} onPress={() => setSelectedOrg(org)} activeOpacity={0.85}>
                        <Text style={styles.primaryButtonText}>View Profile</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(org.id)} activeOpacity={0.7}>
                        <Ionicons 
                          name={favorites[org.id] ? "heart" : "heart-outline"} 
                          size={24} 
                          color={favorites[org.id] ? COLORS.danger : COLORS.textPrimary} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )
            )}

            {/* PROJECTS LIST */}
            {activeTab === "Projects" && (
              projectsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.buttonDark} />
                </View>
              ) : filteredProjects.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    {projects.length === 0 ? "No projects have been published yet." : "No projects match your search or filters."}
                  </Text>
                </View>
              ) : (
                filteredProjects.map((project) => (
                  <View key={project.id} style={styles.card}>
                    <View style={styles.projectImageContainer}>
                      {project.image ? (
                        <Image source={{ uri: project.image }} style={styles.projectImage} />
                      ) : (
                        <View style={[styles.projectImage, styles.projectImagePlaceholder]}>
                          <Ionicons name="leaf-outline" size={42} color={COLORS.white} />
                        </View>
                      )}
                      <View style={styles.projectImageChip}>
                        <View style={styles.chipActive}>
                          <Text style={styles.chipActiveText}>{project.cause}</Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.projectTitle}>{project.title}</Text>
                    <Text style={styles.projectSubTitle}>{project.orgName} • {project.location}</Text>
                    <Text style={styles.descriptionText} numberOfLines={2}>{project.description}</Text>
                    
                    <Text style={styles.projectFundingTarget}>
                      Target: R{Number(project.fundingGoal || 0).toLocaleString("en-ZA")}
                    </Text>

                    <View style={styles.cardActionRow}>
                      <TouchableOpacity style={styles.primaryButton} onPress={() => setSelectedProject(project)} activeOpacity={0.85}>
                        <Text style={styles.primaryButtonText}>View Project</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(project.id)} activeOpacity={0.7}>
                        <Ionicons 
                          name={favorites[project.id] ? "heart" : "heart-outline"} 
                          size={24} 
                          color={favorites[project.id] ? COLORS.danger : COLORS.textPrimary} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )
            )}
          </ScrollView>
        )}

        {/* ==============================================
            FILTER MODAL
        ============================================== */}
        <Modal visible={isFilterModalVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.filterModalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filters</Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)} activeOpacity={0.7}>
                  <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.filterSectionTitle}>Cause</Text>
                <View style={styles.filterChipContainer}>
                  {["Education", "Healthcare", "Environment", "Youth Development", "Food Security"].map((cause) => (
                    <TouchableOpacity
                      key={cause}
                      style={[styles.filterChip, selectedCause === cause && styles.activeFilterChip]}
                      onPress={() => setSelectedCause(selectedCause === cause ? "" : cause)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterChipText, selectedCause === cause && styles.activeFilterChipText]}>
                        {cause}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.filterSectionTitle}>Location</Text>
                <View style={styles.filterChipContainer}>
                  {["South Africa", "Kenya", "Nigeria", "Zambia", "Uganda"].map((location) => (
                    <TouchableOpacity
                      key={location}
                      style={[styles.filterChip, selectedLocation === location && styles.activeFilterChip]}
                      onPress={() => setSelectedLocation(selectedLocation === location ? "" : location)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterChipText, selectedLocation === location && styles.activeFilterChipText]}>
                        {location}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.filterSectionTitle}>Verification Status</Text>
                <View style={styles.filterChipContainer}>
                  <TouchableOpacity
                    style={[styles.filterChip, !verifiedOnly && styles.activeFilterChip]}
                    onPress={() => setVerifiedOnly(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, !verifiedOnly && styles.activeFilterChipText]}>All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterChip, verifiedOnly && styles.activeFilterChip]}
                    onPress={() => setVerifiedOnly(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, verifiedOnly && styles.activeFilterChipText]}>Verified Only</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.clearButton} onPress={clearFilters} activeOpacity={0.7}>
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={() => setFilterModalVisible(false)} activeOpacity={0.85}>
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ==============================================
            ORGANISATION DETAIL MODAL
        ============================================== */}
        {selectedOrg && (
          <Modal visible animationType="slide">
            <SafeAreaView style={styles.detailSafeArea}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailHeaderNav}>
                  <TouchableOpacity onPress={() => setSelectedOrg(null)} style={styles.modalBackButton}>
                    <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.detailNavTitle}>Organisation</Text>
                  <TouchableOpacity onPress={() => toggleFavorite(selectedOrg.id)} style={styles.modalHeartButton}>
                    <Ionicons 
                      name={favorites[selectedOrg.id] ? "heart" : "heart-outline"} 
                      size={24} 
                      color={favorites[selectedOrg.id] ? COLORS.danger : COLORS.textPrimary} 
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailBanner}>
                  <Image source={{ uri: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop" }} style={styles.detailBannerImage} />
                  {selectedOrg.profileImageUrl ? (
                    <Image source={{ uri: selectedOrg.profileImageUrl }} style={styles.detailAvatarImage} />
                  ) : (
                    <View style={[styles.detailAvatar, selectedOrg.bgStyle]}>
                      <Text style={styles.detailAvatarText}>{selectedOrg.abbrev}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailContent}>
                  <Text style={styles.detailTitle}>{selectedOrg.name}</Text>
                  <View style={styles.detailSubRow}>
                    <Text style={styles.detailStatus}>
                      {selectedOrg.verified ? "Verified" : "Unverified"} • {selectedOrg.location}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.expressInterestButton, interestedIds[selectedOrg.id] && { backgroundColor: COLORS.textSecondary }]}
                    onPress={() => toggleInterest(selectedOrg.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryButtonText}>
                      {interestedIds[selectedOrg.id] ? "Interest Sent ✓" : "Express Interest"}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.sectionHeader}>Contact</Text>
                  <Text style={styles.bodyText}>{selectedOrg.email}</Text>

                  <Text style={styles.sectionHeader}>Mission</Text>
                  <Text style={styles.bodyText}>{selectedOrg.about}</Text>

                  <Text style={styles.sectionHeader}>Funding Need</Text>
                  <Text style={styles.bodyText}>{selectedOrg.fundingNeed}</Text>

                  {selectedOrg.causes.length > 0 && (
                    <>
                      <Text style={styles.sectionHeader}>Community Served</Text>
                      <View style={styles.chipRow}>
                        {selectedOrg.causes.map((cause, index) => (
                          <View key={index} style={[styles.chip, styles.chipActive]}>
                            <Text style={styles.chipActiveText}>{cause}</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  )}
                </View>
              </ScrollView>
            </SafeAreaView>
          </Modal>
        )}

        {/* ==============================================
            PROJECT DETAIL MODAL
        ============================================== */}
        {selectedProject && (
          <Modal visible animationType="slide">
            <SafeAreaView style={styles.detailSafeArea}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailHeaderNav}>
                  <TouchableOpacity onPress={() => setSelectedProject(null)} style={styles.modalBackButton}>
                    <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.detailNavTitle}>Project Details</Text>
                  <View style={styles.projectTypeBadge}><Text style={styles.projectTypeBadgeText}>Project</Text></View>
                </View>

                <View style={styles.projectDetailBanner}>
                  {selectedProject.image ? (
                    <Image source={{ uri: selectedProject.image }} style={styles.projectDetailImage} />
                  ) : (
                    <View style={[styles.projectDetailImage, styles.projectImagePlaceholder]}>
                      <Ionicons name="leaf-outline" size={48} color={COLORS.white} />
                    </View>
                  )}
                  <View style={styles.projectDetailOverlay}>
                    <View style={[styles.chip, styles.chipActive]}>
                      <Text style={styles.chipActiveText}>{selectedProject.cause}</Text>
                    </View>
                    <Text style={styles.projectDetailBannerTitle}>{selectedProject.title}</Text>
                    <Text style={styles.projectDetailBannerSub}>
                      {selectedProject.orgName}{selectedProject.verified ? " • Verified" : ""}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailContent}>
                  <View style={styles.fundingCard}>
                    <Text style={styles.fundingStatGreen}>R{Number(selectedProject.fundingGoal || 0).toLocaleString("en-ZA")}</Text>
                    <Text style={styles.statLabel}>Funding target</Text>
                  </View>

                  <Text style={styles.sectionHeader}>Project Overview</Text>
                  <Text style={styles.bodyText}>{selectedProject.description}</Text>

                  <View style={styles.infoTable}>
                    <View style={styles.infoTableRow}>
                      <Text style={styles.infoTableLabel}>Location</Text>
                      <Text style={styles.infoTableValue}>{selectedProject.location}</Text>
                    </View>
                    <View style={styles.infoTableRow}>
                      <Text style={styles.infoTableLabel}>Beneficiaries</Text>
                      <Text style={styles.infoTableValue}>{selectedProject.beneficiaries}</Text>
                    </View>
                    <View style={styles.infoTableRow}>
                      <Text style={styles.infoTableLabel}>Deadline</Text>
                      <Text style={styles.infoTableValue}>{selectedProject.deadline}</Text>
                    </View>
                  </View>

                  <View style={styles.projectActionRow}>
                    <TouchableOpacity
                      style={styles.contactNgoButton}
                      onPress={() => contactProjectOrganisation(selectedProject)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.contactNgoText}>Contact Organisation</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </SafeAreaView>
          </Modal>
        )}
      </View>
    </SafeAreaView>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  detailSafeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // LOADING / EMPTY
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  // HEADER
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontFamily: "Manrope_700Bold",
    fontSize: 28,
    color: COLORS.textPrimary,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16, // Pill-ish
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...softShadow,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Manrope_500Medium",
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  filterButton: {
    marginLeft: 12,
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    ...softShadow,
  },

  // TABS
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.primarySoft,
    borderRadius: 16,
    padding: 6,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  activeTabButton: {
    backgroundColor: COLORS.surface,
    ...softShadow,
  },
  tabText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    fontFamily: "Manrope_700Bold",
    color: COLORS.buttonDark,
  },

  // LIST
  scrollContent: {
    padding: 24,
    paddingBottom: 112,
  },

  // CARD
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...softShadow,
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 14,
  },
  avatarText: {
    fontFamily: "Manrope_700Bold",
    color: COLORS.white,
    fontSize: 16,
  },
  cardHeaderContent: {
    flex: 1,
    justifyContent: "center",
  },
  orgNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  orgTitle: {
    fontFamily: "Manrope_700Bold",
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  verifiedIcon: {
    marginLeft: 6,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },

  // CHIPS
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  chip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  chipActive: {
    backgroundColor: COLORS.buttonDarkSoft,
    borderColor: "transparent",
  },
  chipActiveText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 12,
    color: COLORS.buttonDark,
  },

  // TEXT
  descriptionText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  fundingText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  fundingHighlight: {
    fontFamily: "Manrope_700Bold",
    color: COLORS.buttonDark,
  },

  // BUTTONS
  cardActionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.buttonDark,
    paddingVertical: 16,
    borderRadius: 30, // Luxury pill shape
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.buttonDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontFamily: "Manrope_700Bold",
    color: COLORS.white,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  favoriteButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    backgroundColor: COLORS.surface,
  },

  // PROJECTS
  projectImageContainer: {
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
  },
  projectImage: {
    width: "100%",
    height: "100%",
  },
  projectImagePlaceholder: { 
    backgroundColor: COLORS.buttonDark, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  projectTitle: {
    fontFamily: "Manrope_700Bold",
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  projectSubTitle: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  projectFundingTarget: { 
    fontFamily: "Manrope_700Bold",
    fontSize: 15, 
    color: COLORS.emerald, 
    marginTop: 4, 
    marginBottom: 4 
  },
  projectImageChip: {
    position: "absolute",
    top: 12,
    left: 12,
  },
  projectTypeBadge: { 
    backgroundColor: COLORS.emeraldSoft, 
    borderRadius: 14, 
    paddingHorizontal: 12, 
    paddingVertical: 6 
  },
  projectTypeBadgeText: { 
    fontFamily: "Manrope_700Bold",
    fontSize: 11, 
    color: COLORS.emerald 
  },

  // FILTER MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(67, 51, 39, 0.4)", // Warmer overlay tint
    justifyContent: "flex-end",
  },
  filterModalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "85%",
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontFamily: "Manrope_700Bold",
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  modalBody: {
    marginVertical: 16,
  },
  filterSectionTitle: {
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 12,
  },
  filterChipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20, // pill
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
    marginBottom: 10,
  },
  activeFilterChip: {
    backgroundColor: COLORS.buttonDark,
    borderColor: COLORS.buttonDark,
  },
  filterChipText: {
    fontFamily: "Manrope_600SemiBold",
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  activeFilterChipText: {
    color: COLORS.white,
  },
  modalFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  clearButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
  },
  clearButtonText: {
    fontFamily: "Manrope_700Bold",
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  applyButton: {
    flex: 2,
    backgroundColor: COLORS.buttonDark,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  applyButtonText: {
    fontFamily: "Manrope_700Bold",
    color: COLORS.white,
    fontSize: 15,
  },

  // DETAIL SCREEN
  detailHeaderNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalBackButton: {
    padding: 4,
  },
  modalHeartButton: {
    padding: 4,
  },
  detailNavTitle: {
    fontFamily: "Manrope_700Bold",
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  detailBanner: {
    position: "relative",
    height: 180,
    marginBottom: 48,
  },
  detailBannerImage: {
    width: "100%",
    height: "100%",
  },
  detailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    position: "absolute",
    bottom: -40,
    left: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: COLORS.surface,
  },
  detailAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    position: "absolute",
    bottom: -40,
    left: 24,
    borderWidth: 4,
    borderColor: COLORS.surface,
  },
  detailAvatarText: {
    fontFamily: "Manrope_700Bold",
    color: COLORS.white,
    fontSize: 24,
  },
  detailContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  detailTitle: {
    fontFamily: "Manrope_700Bold",
    fontSize: 26,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  detailSubRow: {
    flexDirection: "row",
    marginTop: 6,
    marginBottom: 20,
  },
  detailStatus: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    color: COLORS.emerald,
  },
  expressInterestButton: {
    backgroundColor: COLORS.buttonDark,
    paddingVertical: 16,
    borderRadius: 30, // pill shape
    alignItems: "center",
    marginBottom: 24,
  },
  sectionHeader: {
    fontFamily: "Manrope_700Bold",
    fontSize: 18,
    color: COLORS.textPrimary,
    marginTop: 20,
    marginBottom: 8,
  },
  bodyText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },

  // PROJECT DETAIL
  projectDetailBanner: {
    height: 240,
    position: "relative",
    marginBottom: 20,
  },
  projectDetailImage: {
    width: "100%",
    height: "100%",
  },
  projectDetailOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingTop: 60,
    backgroundColor: 'rgba(1, 62, 55, 0.6)', // Gradient-like overlay
  },
  projectDetailBannerTitle: {
    fontFamily: "Manrope_700Bold",
    fontSize: 24,
    color: COLORS.white,
    marginTop: 12,
    letterSpacing: -0.5,
  },
  projectDetailBannerSub: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },

  // FUNDING CARD
  fundingCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginVertical: 12,
  },
  fundingStatGreen: {
    fontFamily: "Manrope_700Bold",
    fontSize: 20,
    color: COLORS.buttonDark,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // INFO TABLE
  infoTable: {
    marginVertical: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  infoTableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoTableLabel: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoTableValue: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    color: COLORS.textPrimary,
    maxWidth: "60%",
    textAlign: "right",
  },

  // PROJECT ACTIONS
  projectActionRow: {
    flexDirection: "row",
    marginTop: 20,
    marginBottom: 32,
  },
  contactNgoButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 16,
    borderRadius: 30, // pill
    alignItems: "center",
  },
  contactNgoText: {
    fontFamily: "Manrope_700Bold",
    color: COLORS.textPrimary,
    fontSize: 15,
  },
});
