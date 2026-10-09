import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";

import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../../Backend/firebaseConfig";
import { loadSponsorInterests, setSaved, setInterested } from "../../utils/interests";

// ======================================================
// MOCK PROJECT DATA
// Keep this for now because the projects collection
// has not been connected to Firebase yet.
// ======================================================

const PROJECTS_DATA = [
  {
    id: "proj-1",
    title: "Digital Learning Centre — Phase 3",
    orgName: "Education For All",
    location: "Soweto, Johannesburg",
    match: "92%",
    verified: true,
    cause: "Education",
    description:
      "Opening 4 new digital learning hubs in Soweto, equipping 3,200 additional learners with devices, internet access and certified digital literacy training.",
    raised: "R180,000",
    goal: "R300,000",
    remaining: "R120,000",
    percent: "60%",
    progressRatio: 0.6,
    image:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop",
    beneficiaries: "3,200 people",
    deadline: "31 Oct 2026",
    interestedSponsors: 5,
  },
  {
    id: "proj-2",
    title: "Cape Fynbos Restoration Project",
    orgName: "GreenRoots Africa",
    location: "Cape Town, Western Cape",
    match: "87%",
    verified: true,
    cause: "Environment",
    description:
      "Restoring 50 hectares of indigenous flora while employing local youth in conservation teams.",
    raised: "R150,000",
    goal: "R250,000",
    remaining: "R100,000",
    percent: "60%",
    progressRatio: 0.6,
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop",
    beneficiaries: "1,500 people",
    deadline: "15 Dec 2026",
    interestedSponsors: 3,
  },
];

// ======================================================
// HELPERS
// ======================================================

const AVATAR_COLORS = [
  "#1D3557",
  "#2A9D8F",
  "#7C3AED",
  "#C2410C",
  "#0EA5E9",
  "#DB2777",
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

export default function SponsorDiscoverScreen() {
  const [activeTab, setActiveTab] = useState("Organisations");
  const [searchQuery, setSearchQuery] = useState("");

  const [favorites, setFavorites] = useState({});

  // Which NGOs the sponsor has pressed "Express Interest" on ({ [ngoId]: true })
  const [interestedIds, setInterestedIds] = useState({});

  // Firebase NGO data
  const [ngos, setNgos] = useState([]);
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
  // FETCH NGOs FROM FIREBASE
  // ====================================================

  useEffect(() => {
    const fetchNgos = async () => {
      try {
        setLoading(true);

        const ngoQuery = query(
          collection(db, "users"),
          where("role", "==", "ngo")
        );

        const snapshot = await getDocs(ngoQuery);

        const results = snapshot.docs.map((docSnap, index) => {
          const data = docSnap.data();

          return {
            id: docSnap.id,

            name: data.organisationName || "Unnamed NGO",

            abbrev: getInitials(data.organisationName),

            verified: !!data.profileCompleted,

            location: data.location || "Location not provided",

            causes: data.targetCommunity
              ? [data.targetCommunity]
              : [],

            description:
              data.mission || "No mission statement provided yet.",

            fundingNeed: data.fundingRequired
              ? `R${data.fundingRequired}`
              : "Not specified",

            bgStyle: {
              backgroundColor:
                AVATAR_COLORS[index % AVATAR_COLORS.length],
            },

            profileImageUrl: data.profileImageUrl || null,

            email: data.email || "Not provided",

            about:
              data.mission || "No further details provided yet.",
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

  // ====================================================
  // FAVORITES
  // ====================================================

  // Load saved / interested NGOs from Firestore
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

  const toggleFavorite = async (id) => {
    const next = !favorites[id];

    setFavorites((previous) => ({
      ...previous,
      [id]: next,
    }));

    // Only real NGOs are saved to Firestore (mock projects stay local)
    if (!ngos.some((ngo) => ngo.id === id)) return;

    try {
      await setSaved(id, next);
    } catch (error) {
      setFavorites((previous) => ({
        ...previous,
        [id]: !next,
      }));
      Alert.alert("Could not save", error?.message || "Please try again.");
    }
  };

  const toggleInterest = async (id) => {
    const next = !interestedIds[id];

    setInterestedIds((previous) => ({
      ...previous,
      [id]: next,
    }));

    try {
      await setInterested(id, next);
    } catch (error) {
      setInterestedIds((previous) => ({
        ...previous,
        [id]: !next,
      }));
      Alert.alert("Could not update interest", error?.message || "Please try again.");
    }
  };

  // ====================================================
  // FILTER ORGANISATIONS
  // ====================================================

  const filteredOrganisations = useMemo(() => {
    const search = searchQuery.toLowerCase().trim();

    return ngos.filter((org) => {
      const matchesSearch =
        org.name.toLowerCase().includes(search) ||
        org.description.toLowerCase().includes(search) ||
        org.causes.some((cause) =>
          cause.toLowerCase().includes(search)
        );

      const matchesCause =
        !selectedCause ||
        org.causes.some(
          (cause) =>
            cause.toLowerCase() === selectedCause.toLowerCase()
        );

      const matchesLocation =
        !selectedLocation ||
        org.location
          .toLowerCase()
          .includes(selectedLocation.toLowerCase());

      const matchesVerified =
        !verifiedOnly || org.verified;

      return (
        matchesSearch &&
        matchesCause &&
        matchesLocation &&
        matchesVerified
      );
    });
  }, [
    ngos,
    searchQuery,
    selectedCause,
    selectedLocation,
    verifiedOnly,
  ]);

  // ====================================================
  // FILTER PROJECTS
  // ====================================================

  const filteredProjects = useMemo(() => {
    const search = searchQuery.toLowerCase().trim();

    return PROJECTS_DATA.filter((project) => {
      const matchesSearch =
        project.title.toLowerCase().includes(search) ||
        project.description.toLowerCase().includes(search) ||
        project.cause.toLowerCase().includes(search) ||
        project.orgName.toLowerCase().includes(search);

      const matchesCause =
        !selectedCause ||
        project.cause.toLowerCase() ===
          selectedCause.toLowerCase();

      const matchesLocation =
        !selectedLocation ||
        project.location
          .toLowerCase()
          .includes(selectedLocation.toLowerCase());

      const matchesVerified =
        !verifiedOnly || project.verified;

      return (
        matchesSearch &&
        matchesCause &&
        matchesLocation &&
        matchesVerified
      );
    });
  }, [
    searchQuery,
    selectedCause,
    selectedLocation,
    verifiedOnly,
  ]);

  // ====================================================
  // CLEAR FILTERS
  // ====================================================

  const clearFilters = () => {
    setSelectedCause("");
    setSelectedLocation("");
    setVerifiedOnly(false);
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>

        {/* ==============================================
            HEADER
        ============================================== */}

        <View style={styles.headerContainer}>

          <Text style={styles.headerTitle}>
            Discover Impact
          </Text>

          {/* SEARCH */}

          <View style={styles.searchRow}>

            <View style={styles.searchInputContainer}>

              <Text style={styles.searchIcon}>
                🔍
              </Text>

              <TextInput
                style={styles.searchInput}
                placeholder="Search NGOs, projects or causes"
                placeholderTextColor="#A0AEC0"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

            </View>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={() =>
                setFilterModalVisible(true)
              }
            >
              <Text style={styles.filterIcon}>
                🎛️
              </Text>
            </TouchableOpacity>

          </View>

          {/* TABS */}

          <View style={styles.tabContainer}>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "Organisations" &&
                  styles.activeTabButton,
              ]}
              onPress={() =>
                setActiveTab("Organisations")
              }
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "Organisations" &&
                    styles.activeTabText,
                ]}
              >
                Organisations
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "Projects" &&
                  styles.activeTabButton,
              ]}
              onPress={() =>
                setActiveTab("Projects")
              }
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "Projects" &&
                    styles.activeTabText,
                ]}
              >
                Projects
              </Text>
            </TouchableOpacity>

          </View>

        </View>

        {/* ==============================================
            LOADING
        ============================================== */}

        {activeTab === "Organisations" && loading ? (

          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#227B53"
            />
          </View>

        ) : (

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >

            {/* ==========================================
                ORGANISATIONS
            ========================================== */}

            {activeTab === "Organisations" && (

              filteredOrganisations.length === 0 ? (

                <View style={styles.emptyState}>

                  <Text style={styles.emptyStateText}>
                    {ngos.length === 0
                      ? "No NGOs have signed up yet."
                      : "No organisations match your search or filters."}
                  </Text>

                </View>

              ) : (

                filteredOrganisations.map((org) => (

                  <View
                    key={org.id}
                    style={styles.card}
                  >

                    {/* CARD HEADER */}

                    <View style={styles.cardHeader}>

                      {org.profileImageUrl ? (

                        <Image
                          source={{
                            uri: org.profileImageUrl,
                          }}
                          style={styles.avatarImage}
                        />

                      ) : (

                        <View
                          style={[
                            styles.avatar,
                            org.bgStyle,
                          ]}
                        >
                          <Text style={styles.avatarText}>
                            {org.abbrev}
                          </Text>
                        </View>

                      )}

                      <View style={styles.cardHeaderContent}>

                        <Text style={styles.orgTitle}>
                          {org.name}
                        </Text>

                        {org.verified && (

                          <View style={styles.verifiedRow}>

                            <Text
                              style={styles.verifiedIcon}
                            >
                              ✓
                            </Text>

                            <Text
                              style={styles.verifiedText}
                            >
                              Verified
                            </Text>

                          </View>

                        )}

                        <Text style={styles.locationText}>
                          📍 {org.location}
                        </Text>

                      </View>

                    </View>

                    {/* CAUSES */}

                    {org.causes.length > 0 && (

                      <View style={styles.chipRow}>

                        {org.causes.map(
                          (cause, index) => (

                            <View
                              key={index}
                              style={[
                                styles.chip,
                                index % 2 === 0
                                  ? styles.chipBlue
                                  : styles.chipYellow,
                              ]}
                            >

                              <Text
                                style={[
                                  styles.chipText,
                                  index % 2 === 0
                                    ? styles.chipBlueText
                                    : styles.chipYellowText,
                                ]}
                              >
                                {cause}
                              </Text>

                            </View>

                          )
                        )}

                      </View>

                    )}

                    {/* DESCRIPTION */}

                    <Text
                      style={styles.descriptionText}
                      numberOfLines={2}
                    >
                      {org.description}
                    </Text>

                    {/* FUNDING */}

                    <Text style={styles.fundingText}>
                      Funding Need:{" "}
                      <Text style={styles.fundingHighlight}>
                        {org.fundingNeed}
                      </Text>
                    </Text>

                    {/* ACTIONS */}

                    <View style={styles.cardActionRow}>

                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() =>
                          setSelectedOrg(org)
                        }
                      >
                        <Text
                          style={styles.primaryButtonText}
                        >
                          View Profile
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={() =>
                          toggleFavorite(org.id)
                        }
                      >
                        <Text style={styles.heartIcon}>
                          {favorites[org.id]
                            ? "❤️"
                            : "🤍"}
                        </Text>
                      </TouchableOpacity>

                    </View>

                  </View>

                ))

              )

            )}

            {/* ==========================================
                PROJECTS
            ========================================== */}

            {activeTab === "Projects" && (

              filteredProjects.length === 0 ? (

                <View style={styles.emptyState}>

                  <Text style={styles.emptyStateText}>
                    No projects match your search or filters.
                  </Text>

                </View>

              ) : (

                filteredProjects.map((project) => (

                  <View
                    key={project.id}
                    style={styles.card}
                  >

                    {/* PROJECT IMAGE */}

                    <View
                      style={
                        styles.projectImageContainer
                      }
                    >

                      <Image
                        source={{
                          uri: project.image,
                        }}
                        style={styles.projectImage}
                      />

                      <View
                        style={styles.projectImageChip}
                      >
                        <View
                          style={[
                            styles.chip,
                            styles.chipBlue,
                          ]}
                        >
                          <Text
                            style={styles.chipBlueText}
                          >
                            {project.cause}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={styles.projectMatchBadge}
                      >
                        <View
                          style={[
                            styles.matchBadge,
                          ]}
                        >
                          <Text
                            style={styles.matchBadgeText}
                          >
                            • {project.match}
                          </Text>
                        </View>
                      </View>

                    </View>

                    {/* PROJECT TITLE */}

                    <Text style={styles.projectTitle}>
                      {project.title}
                    </Text>

                    <Text
                      style={styles.projectSubTitle}
                    >
                      {project.orgName} •{" "}
                      {project.location}
                    </Text>

                    {/* DESCRIPTION */}

                    <Text
                      style={styles.descriptionText}
                      numberOfLines={2}
                    >
                      {project.description}
                    </Text>

                    {/* PROGRESS */}

                    <View
                      style={
                        styles.progressBarContainer
                      }
                    >

                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${
                              project.progressRatio * 100
                            }%`,
                          },
                        ]}
                      />

                    </View>

                    <View
                      style={
                        styles.progressLabelRow
                      }
                    >

                      <Text
                        style={
                          styles.progressTextGreen
                        }
                      >
                        {project.raised} raised
                      </Text>

                      <Text
                        style={
                          styles.progressTextGray
                        }
                      >
                        {project.percent} of{" "}
                        {project.goal}
                      </Text>

                    </View>

                    {/* ACTIONS */}

                    <View
                      style={styles.cardActionRow}
                    >

                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() =>
                          setSelectedProject(project)
                        }
                      >
                        <Text
                          style={
                            styles.primaryButtonText
                          }
                        >
                          View Project
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={() =>
                          toggleFavorite(project.id)
                        }
                      >
                        <Text style={styles.heartIcon}>
                          {favorites[project.id]
                            ? "❤️"
                            : "🤍"}
                        </Text>
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

        <Modal
          visible={isFilterModalVisible}
          animationType="slide"
          transparent
        >

          <View style={styles.modalOverlay}>

            <View
              style={styles.filterModalContainer}
            >

              <View style={styles.modalHeader}>

                <Text style={styles.modalTitle}>
                  Filter
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    setFilterModalVisible(false)
                  }
                >
                  <Text style={styles.closeIcon}>
                    ✕
                  </Text>
                </TouchableOpacity>

              </View>

              <ScrollView style={styles.modalBody}>

                {/* CAUSE */}

                <Text
                  style={styles.filterSectionTitle}
                >
                  Cause
                </Text>

                <View
                  style={
                    styles.filterChipContainer
                  }
                >

                  {[
                    "Education",
                    "Healthcare",
                    "Environment",
                    "Youth Development",
                    "Food Security",
                  ].map((cause) => (

                    <TouchableOpacity
                      key={cause}
                      style={[
                        styles.filterChip,
                        selectedCause === cause &&
                          styles.activeFilterChip,
                      ]}
                      onPress={() =>
                        setSelectedCause(
                          selectedCause === cause
                            ? ""
                            : cause
                        )
                      }
                    >

                      <Text
                        style={[
                          styles.filterChipText,
                          selectedCause === cause &&
                            styles.activeFilterChipText,
                        ]}
                      >
                        {cause}
                      </Text>

                    </TouchableOpacity>

                  ))}

                </View>

                {/* LOCATION */}

                <Text
                  style={styles.filterSectionTitle}
                >
                  Location
                </Text>

                <View
                  style={
                    styles.filterChipContainer
                  }
                >

                  {[
                    "South Africa",
                    "Kenya",
                    "Nigeria",
                    "Zambia",
                    "Uganda",
                  ].map((location) => (

                    <TouchableOpacity
                      key={location}
                      style={[
                        styles.filterChip,
                        selectedLocation === location &&
                          styles.activeFilterChip,
                      ]}
                      onPress={() =>
                        setSelectedLocation(
                          selectedLocation === location
                            ? ""
                            : location
                        )
                      }
                    >

                      <Text
                        style={[
                          styles.filterChipText,
                          selectedLocation === location &&
                            styles.activeFilterChipText,
                        ]}
                      >
                        {location}
                      </Text>

                    </TouchableOpacity>

                  ))}

                </View>

                {/* VERIFICATION */}

                <Text
                  style={styles.filterSectionTitle}
                >
                  Verification Status
                </Text>

                <View
                  style={
                    styles.filterChipContainer
                  }
                >

                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      !verifiedOnly &&
                        styles.activeFilterChip,
                    ]}
                    onPress={() =>
                      setVerifiedOnly(false)
                    }
                  >

                    <Text
                      style={[
                        styles.filterChipText,
                        !verifiedOnly &&
                          styles.activeFilterChipText,
                      ]}
                    >
                      All
                    </Text>

                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      verifiedOnly &&
                        styles.activeFilterChip,
                    ]}
                    onPress={() =>
                      setVerifiedOnly(true)
                    }
                  >

                    <Text
                      style={[
                        styles.filterChipText,
                        verifiedOnly &&
                          styles.activeFilterChipText,
                      ]}
                    >
                      Verified Only
                    </Text>

                  </TouchableOpacity>

                </View>

              </ScrollView>

              {/* FOOTER */}

              <View style={styles.modalFooter}>

                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearFilters}
                >
                  <Text
                    style={styles.clearButtonText}
                  >
                    Clear All
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() =>
                    setFilterModalVisible(false)
                  }
                >
                  <Text
                    style={styles.applyButtonText}
                  >
                    Apply Filters
                  </Text>
                </TouchableOpacity>

              </View>

            </View>

          </View>

        </Modal>

        {/* ==============================================
            ORGANISATION DETAIL MODAL
        ============================================== */}

        {selectedOrg && (

          <Modal
            visible
            animationType="slide"
          >

            <SafeAreaView
              style={styles.detailSafeArea}
            >

              <ScrollView>

                {/* NAV */}

                <View
                  style={styles.detailHeaderNav}
                >

                  <TouchableOpacity
                    onPress={() =>
                      setSelectedOrg(null)
                    }
                  >
                    <Text style={styles.backButton}>
                      ‹
                    </Text>
                  </TouchableOpacity>

                  <Text
                    style={styles.detailNavTitle}
                  >
                    Organisation
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      toggleFavorite(
                        selectedOrg.id
                      )
                    }
                  >
                    <Text style={styles.heartIcon}>
                      {favorites[selectedOrg.id]
                        ? "❤️"
                        : "🤍"}
                    </Text>
                  </TouchableOpacity>

                </View>

                {/* BANNER */}

                <View
                  style={styles.detailBanner}
                >

                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop",
                    }}
                    style={
                      styles.detailBannerImage
                    }
                  />

                  {selectedOrg.profileImageUrl ? (

                    <Image
                      source={{
                        uri:
                          selectedOrg.profileImageUrl,
                      }}
                      style={
                        styles.detailAvatarImage
                      }
                    />

                  ) : (

                    <View
                      style={[
                        styles.detailAvatar,
                        selectedOrg.bgStyle,
                      ]}
                    >
                      <Text
                        style={
                          styles.detailAvatarText
                        }
                      >
                        {selectedOrg.abbrev}
                      </Text>
                    </View>

                  )}

                </View>

                {/* CONTENT */}

                <View
                  style={styles.detailContent}
                >

                  <Text
                    style={styles.detailTitle}
                  >
                    {selectedOrg.name}
                  </Text>

                  <View
                    style={styles.detailSubRow}
                  >

                    <Text
                      style={styles.detailStatus}
                    >
                      {selectedOrg.verified
                        ? "✓ Verified"
                        : "Not yet verified"}{" "}
                      • {selectedOrg.location}
                    </Text>

                  </View>

                  {/* EXPRESS INTEREST */}

                  <TouchableOpacity
                    style={[
                      styles.expressInterestButton,
                      interestedIds[selectedOrg.id] && {
                        backgroundColor: "#64748B",
                      },
                    ]}
                    onPress={() =>
                      toggleInterest(selectedOrg.id)
                    }
                  >
                    <Text
                      style={
                        styles.primaryButtonText
                      }
                    >
                      {interestedIds[selectedOrg.id]
                        ? "Interest Sent ✓ (tap to withdraw)"
                        : "Express Interest"}
                    </Text>
                  </TouchableOpacity>

                  {/* CONTACT */}

                  <Text
                    style={styles.sectionHeader}
                  >
                    Contact
                  </Text>

                  <Text
                    style={styles.bodyText}
                  >
                    {selectedOrg.email}
                  </Text>

                  {/* MISSION */}

                  <Text
                    style={styles.sectionHeader}
                  >
                    Mission
                  </Text>

                  <Text
                    style={styles.bodyText}
                  >
                    {selectedOrg.about}
                  </Text>

                  {/* FUNDING */}

                  <Text
                    style={styles.sectionHeader}
                  >
                    Funding Need
                  </Text>

                  <Text
                    style={styles.bodyText}
                  >
                    {selectedOrg.fundingNeed}
                  </Text>

                  {/* COMMUNITY */}

                  {selectedOrg.causes.length > 0 && (

                    <>

                      <Text
                        style={styles.sectionHeader}
                      >
                        Community Served
                      </Text>

                      <View
                        style={styles.chipRow}
                      >

                        {selectedOrg.causes.map(
                          (cause, index) => (

                            <View
                              key={index}
                              style={[
                                styles.chip,
                                styles.chipGreen,
                              ]}
                            >

                              <Text
                                style={
                                  styles.chipGreenText
                                }
                              >
                                {cause}
                              </Text>

                            </View>

                          )
                        )}

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

          <Modal
            visible
            animationType="slide"
          >

            <SafeAreaView
              style={styles.detailSafeArea}
            >

              <ScrollView>

                {/* NAV */}

                <View
                  style={styles.detailHeaderNav}
                >

                  <TouchableOpacity
                    onPress={() =>
                      setSelectedProject(null)
                    }
                  >
                    <Text style={styles.backButton}>
                      ‹
                    </Text>
                  </TouchableOpacity>

                  <Text
                    style={styles.detailNavTitle}
                  >
                    Project Details
                  </Text>

                  <View
                    style={styles.matchBadge}
                  >
                    <Text
                      style={styles.matchBadgeText}
                    >
                      • {selectedProject.match}
                    </Text>
                  </View>

                </View>

                {/* PROJECT IMAGE */}

                <View
                  style={
                    styles.projectDetailBanner
                  }
                >

                  <Image
                    source={{
                      uri:
                        selectedProject.image,
                    }}
                    style={
                      styles.projectDetailImage
                    }
                  />

                  <View
                    style={
                      styles.projectDetailOverlay
                    }
                  >

                    <View
                      style={[
                        styles.chip,
                        styles.chipBlue,
                      ]}
                    >
                      <Text
                        style={
                          styles.chipBlueText
                        }
                      >
                        {selectedProject.cause}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.projectDetailBannerTitle
                      }
                    >
                      {selectedProject.title}
                    </Text>

                    <Text
                      style={
                        styles.projectDetailBannerSub
                      }
                    >
                      {selectedProject.orgName} ✓
                      Verified
                    </Text>

                  </View>

                </View>

                {/* CONTENT */}

                <View
                  style={styles.detailContent}
                >

                  {/* FUNDING CARD */}

                  <View
                    style={styles.fundingCard}
                  >

                    <View
                      style={styles.fundingRow}
                    >

                      <View>
                        <Text
                          style={
                            styles.fundingStatGreen
                          }
                        >
                          {selectedProject.raised}
                        </Text>

                        <Text
                          style={styles.statLabel}
                        >
                          Raised
                        </Text>
                      </View>

                      <View>
                        <Text
                          style={
                            styles.fundingStatBold
                          }
                        >
                          {selectedProject.goal}
                        </Text>

                        <Text
                          style={styles.statLabel}
                        >
                          Goal
                        </Text>
                      </View>

                      <View>
                        <Text
                          style={
                            styles.fundingStatRed
                          }
                        >
                          {selectedProject.remaining}
                        </Text>

                        <Text
                          style={styles.statLabel}
                        >
                          Remaining
                        </Text>
                      </View>

                    </View>

                    <View
                      style={
                        styles.progressBarContainer
                      }
                    >

                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${
                              selectedProject.progressRatio *
                              100
                            }%`,
                          },
                        ]}
                      />

                    </View>

                    <View
                      style={
                        styles.progressLabelRow
                      }
                    >

                      <Text
                        style={
                          styles.progressTextGreen
                        }
                      >
                        {selectedProject.raised} raised
                      </Text>

                      <Text
                        style={
                          styles.progressTextGray
                        }
                      >
                        {selectedProject.percent} of{" "}
                        {selectedProject.goal}
                      </Text>

                    </View>

                  </View>

                  {/* OVERVIEW */}

                  <Text
                    style={styles.sectionHeader}
                  >
                    Project Overview
                  </Text>

                  <Text
                    style={styles.bodyText}
                  >
                    {selectedProject.description}
                  </Text>

                  {/* INFO */}

                  <View style={styles.infoTable}>

                    <View
                      style={styles.infoTableRow}
                    >
                      <Text
                        style={
                          styles.infoTableLabel
                        }
                      >
                        Location
                      </Text>

                      <Text
                        style={
                          styles.infoTableValue
                        }
                      >
                        {selectedProject.location}
                      </Text>
                    </View>

                    <View
                      style={styles.infoTableRow}
                    >
                      <Text
                        style={
                          styles.infoTableLabel
                        }
                      >
                        Beneficiaries
                      </Text>

                      <Text
                        style={
                          styles.infoTableValue
                        }
                      >
                        {selectedProject.beneficiaries}
                      </Text>
                    </View>

                    <View
                      style={styles.infoTableRow}
                    >
                      <Text
                        style={
                          styles.infoTableLabel
                        }
                      >
                        Deadline
                      </Text>

                      <Text
                        style={
                          styles.infoTableValue
                        }
                      >
                        {selectedProject.deadline}
                      </Text>
                    </View>

                    <View
                      style={styles.infoTableRow}
                    >
                      <Text
                        style={
                          styles.infoTableLabel
                        }
                      >
                        Interested Sponsors
                      </Text>

                      <Text
                        style={
                          styles.infoTableValue
                        }
                      >
                        {
                          selectedProject.interestedSponsors
                        }
                      </Text>
                    </View>

                  </View>

                  {/* ACTIONS */}

                  <View
                    style={styles.projectActionRow}
                  >

                    <TouchableOpacity
                      style={
                        styles.contactNgoButton
                      }
                    >
                      <Text
                        style={
                          styles.contactNgoText
                        }
                      >
                        Contact NGO
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={
                        styles.sponsorProjectButton
                      }
                    >
                      <Text
                        style={
                          styles.primaryButtonText
                        }
                      >
                        Sponsor This Project
                      </Text>
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
    backgroundColor: "#FFFFFF",
  },

  detailSafeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  // ----------------------------------------------------
  // LOADING / EMPTY
  // ----------------------------------------------------

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },

  emptyStateText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },

  // ----------------------------------------------------
  // HEADER
  // ----------------------------------------------------

  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },

  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
  },

  filterButton: {
    marginLeft: 8,
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },

  filterIcon: {
    fontSize: 18,
  },

  // ----------------------------------------------------
  // TABS
  // ----------------------------------------------------

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },

  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },

  activeTabButton: {
    backgroundColor: "#FFFFFF",
    elevation: 2,
  },

  tabText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },

  activeTabText: {
    color: "#0F172A",
  },

  // ----------------------------------------------------
  // LIST
  // ----------------------------------------------------

  scrollContent: {
    padding: 16,
  },

  // ----------------------------------------------------
  // CARD
  // ----------------------------------------------------

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  cardHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },

  avatarText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  cardHeaderContent: {
    flex: 1,
  },

  orgTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  locationText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },

  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },

  verifiedIcon: {
    fontSize: 10,
    color: "#166534",
    backgroundColor: "#DCFCE7",
    borderRadius: 8,
    paddingHorizontal: 4,
    marginRight: 4,
  },

  verifiedText: {
    fontSize: 12,
    color: "#166534",
    fontWeight: "500",
  },

  // ----------------------------------------------------
  // CHIPS
  // ----------------------------------------------------

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 8,
  },

  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },

  chipText: {
    fontSize: 12,
    fontWeight: "500",
  },

  chipBlue: {
    backgroundColor: "#E0F2FE",
  },

  chipBlueText: {
    color: "#0369A1",
    fontSize: 12,
    fontWeight: "500",
  },

  chipYellow: {
    backgroundColor: "#FEF3C7",
  },

  chipYellowText: {
    color: "#B45309",
    fontSize: 12,
    fontWeight: "500",
  },

  chipGreen: {
    backgroundColor: "#DCFCE7",
  },

  chipGreenText: {
    color: "#15803D",
    fontSize: 12,
    fontWeight: "500",
  },

  // ----------------------------------------------------
  // TEXT
  // ----------------------------------------------------

  descriptionText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 8,
  },

  fundingText: {
    fontSize: 12,
    color: "#0F172A",
    fontWeight: "600",
  },

  fundingHighlight: {
    color: "#0F172A",
  },

  // ----------------------------------------------------
  // BUTTONS
  // ----------------------------------------------------

  cardActionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  primaryButton: {
    flex: 1,
    backgroundColor: "#227B53",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },

  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  heartIcon: {
    fontSize: 18,
  },

  // ----------------------------------------------------
  // MATCH
  // ----------------------------------------------------

  matchBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  matchBadgeText: {
    color: "#15803D",
    fontSize: 12,
    fontWeight: "600",
  },

  // ----------------------------------------------------
  // PROJECTS
  // ----------------------------------------------------

  projectImageContainer: {
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    position: "relative",
  },

  projectImage: {
    width: "100%",
    height: "100%",
  },

  projectImageChip: {
    position: "absolute",
    top: 10,
    left: 10,
  },

  projectMatchBadge: {
    position: "absolute",
    top: 10,
    right: 10,
  },

  projectTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  projectSubTitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    marginBottom: 8,
  },

  progressBarContainer: {
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    marginVertical: 6,
    overflow: "hidden",
  },

  progressBarFill: {
    height: "100%",
    backgroundColor: "#227B53",
  },

  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  progressTextGreen: {
    fontSize: 12,
    color: "#227B53",
    fontWeight: "600",
  },

  progressTextGray: {
    fontSize: 12,
    color: "#64748B",
  },

  // ----------------------------------------------------
  // FILTER MODAL
  // ----------------------------------------------------

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  filterModalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    padding: 16,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  closeIcon: {
    fontSize: 18,
    color: "#64748B",
  },

  modalBody: {
    marginVertical: 12,
  },

  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginTop: 12,
    marginBottom: 8,
  },

  filterChipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 8,
    marginBottom: 8,
  },

  activeFilterChip: {
    backgroundColor: "#227B53",
    borderColor: "#227B53",
  },

  filterChipText: {
    color: "#475569",
    fontSize: 12,
  },

  activeFilterChipText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  modalFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },

  clearButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },

  clearButtonText: {
    color: "#64748B",
    fontWeight: "600",
  },

  applyButton: {
    flex: 2,
    backgroundColor: "#227B53",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  applyButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // ----------------------------------------------------
  // DETAIL SCREEN
  // ----------------------------------------------------

  detailHeaderNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  backButton: {
    fontSize: 30,
    color: "#0F172A",
  },

  detailNavTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  detailBanner: {
    position: "relative",
    height: 160,
    marginBottom: 40,
  },

  detailBannerImage: {
    width: "100%",
    height: "100%",
  },

  detailAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    position: "absolute",
    bottom: -32,
    left: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  detailAvatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    position: "absolute",
    bottom: -32,
    left: 16,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  detailAvatarText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  detailContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  detailTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },

  detailSubRow: {
    flexDirection: "row",
    marginTop: 4,
    marginBottom: 12,
  },

  detailStatus: {
    fontSize: 12,
    color: "#166534",
    fontWeight: "500",
  },

  expressInterestButton: {
    backgroundColor: "#227B53",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },

  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 12,
    marginBottom: 6,
  },

  bodyText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 20,
  },

  // ----------------------------------------------------
  // PROJECT DETAIL
  // ----------------------------------------------------

  projectDetailBanner: {
    height: 200,
    position: "relative",
  },

  projectDetailImage: {
    width: "100%",
    height: "100%",
  },

  projectDetailOverlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
  },

  projectDetailBannerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 4,
  },

  projectDetailBannerSub: {
    fontSize: 12,
    color: "#E2E8F0",
  },

  // ----------------------------------------------------
  // FUNDING CARD
  // ----------------------------------------------------

  fundingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    marginVertical: 12,
  },

  fundingRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },

  fundingStatGreen: {
    fontSize: 14,
    fontWeight: "700",
    color: "#227B53",
  },

  fundingStatBold: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },

  fundingStatRed: {
    fontSize: 14,
    fontWeight: "700",
    color: "#DC2626",
  },

  statLabel: {
    fontSize: 11,
    color: "#64748B",
  },

  // ----------------------------------------------------
  // INFO TABLE
  // ----------------------------------------------------

  infoTable: {
    marginVertical: 12,
  },

  infoTableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  infoTableLabel: {
    fontSize: 13,
    color: "#64748B",
  },

  infoTableValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
    maxWidth: "60%",
    textAlign: "right",
  },

  // ----------------------------------------------------
  // PROJECT ACTIONS
  // ----------------------------------------------------

  projectActionRow: {
    flexDirection: "row",
    marginTop: 12,
    marginBottom: 24,
  },

  contactNgoButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
  },

  contactNgoText: {
    color: "#0F172A",
    fontWeight: "600",
  },

  sponsorProjectButton: {
    flex: 2,
    backgroundColor: "#227B53",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});