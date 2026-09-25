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
} from "react-native";

// Firebase imports
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../Backend/firebaseConfig";

// --- MOCK DATA (Projects tab only — no real "projects" collection exists yet) ---
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

const AVATAR_COLORS = ["#1D3557", "#2A9D8F", "#7C3AED", "#C2410C", "#0EA5E9", "#DB2777"];

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function SponsorDiscoverScreen() {
  const [activeTab, setActiveTab] = useState("Organisations"); // 'Organisations' | 'Projects'
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState({});
  const [sponsorshipProject, setSponsorshipProject] = useState(null);

  // Real NGO data from Firestore
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCause, setSelectedCause] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Detail Modal state
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // Fetch every user document where role == "ngo"
  useEffect(() => {
    const fetchNgos = async () => {
      try {
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
            // targetCommunity is a free-text field, not a list — treat it as a single "cause" tag
            causes: data.targetCommunity ? [data.targetCommunity] : [],
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
        console.log("Error fetching NGOs:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNgos();
  }, []);

  // Toggle favorite helper
  const toggleFavorite = (id) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered lists
  const filteredOrganisations = useMemo(() => {
    return ngos.filter((org) => {
      const matchesSearch =
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.causes.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCause = !selectedCause || org.causes.includes(selectedCause);
      const matchesLocation =
        !selectedLocation || org.location.includes(selectedLocation);
      const matchesVerified = !verifiedOnly || org.verified;

      return matchesSearch && matchesCause && matchesLocation && matchesVerified;
    });
  }, [ngos, searchQuery, selectedCause, selectedLocation, verifiedOnly]);

  const filteredProjects = useMemo(() => {
    return PROJECTS_DATA.filter((proj) => {
      const matchesSearch =
        proj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proj.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proj.cause.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCause = !selectedCause || proj.cause === selectedCause;
      const matchesLocation =
        !selectedLocation || proj.location.includes(selectedLocation);
      const matchesVerified = !verifiedOnly || proj.verified;

      return matchesSearch && matchesCause && matchesLocation && matchesVerified;
    });
  }, [searchQuery, selectedCause, selectedLocation, verifiedOnly]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* --- HEADER --- */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Discover Impact</Text>

          {/* Search Bar & Filter Button */}
          <View style={styles.searchRow}>
            <View style={styles.searchInputContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
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
              onPress={() => setFilterModalVisible(true)}
            >
              <Text style={styles.filterIcon}>🎛️</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "Organisations" && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab("Organisations")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "Organisations" && styles.activeTabText,
                ]}
              >
                Organisations
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "Projects" && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab("Projects")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "Projects" && styles.activeTabText,
                ]}
              >
                Projects
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- LIST VIEW --- */}
        {activeTab === "Organisations" && loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#227B53" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {activeTab === "Organisations" ? (
              filteredOrganisations.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    {ngos.length === 0
                      ? "No NGOs have signed up yet."
                      : "No organisations match your search or filters."}
                  </Text>
                </View>
              ) : (
                /* ORGANISATIONS CARDS */
                filteredOrganisations.map((org) => (
                  <View key={org.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      {org.profileImageUrl ? (
                        <Image
                          source={{ uri: org.profileImageUrl }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <View style={[styles.avatar, org.bgStyle]}>
                          <Text style={styles.avatarText}>{org.abbrev}</Text>
                        </View>
                      )}
                      <View style={styles.cardHeaderContent}>
                        <View style={styles.titleRow}>
                          <Text style={styles.orgTitle}>{org.name}</Text>
                        </View>

                        {org.verified && (
                          <View style={styles.verifiedRow}>
                            <Text style={styles.verifiedIcon}>✓</Text>
                            <Text style={styles.verifiedText}>Verified</Text>
                          </View>
                        )}

                        <Text style={styles.locationText}>📍 {org.location}</Text>
                      </View>
                    </View>

                    {/* Causes Chips */}
                    {org.causes.length > 0 && (
                      <View style={styles.chipRow}>
                        {org.causes.map((cause, idx) => (
                          <View
                            key={idx}
                            style={[
                              styles.chip,
                              idx % 2 === 1 ? styles.chipYellow : styles.chipBlue,
                            ]}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                idx % 2 === 1
                                  ? styles.chipYellowText
                                  : styles.chipBlueText,
                              ]}
                            >
                              {cause}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <Text style={styles.descriptionText} numberOfLines={2}>
                      {org.description}
                    </Text>

                    <Text style={styles.fundingText}>
                      Funding Need:{" "}
                      <Text style={styles.fundingHighlight}>{org.fundingNeed}</Text>
                    </Text>

                    <View style={styles.cardActionRow}>
                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => setSelectedOrg(org)}
                      >
                        <Text style={styles.primaryButtonText}>View Profile</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={() => toggleFavorite(org.id)}
                      >
                        <Text style={styles.heartIcon}>
                          {favorites[org.id] ? "❤️" : "🤍"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )
            ) : (
              /* PROJECTS CARDS (still mock — no real projects collection yet) */
              filteredProjects.map((proj) => (
                <View key={proj.id} style={styles.card}>
                  <View style={styles.projectImageContainer}>
                    <Image
                      source={{ uri: proj.image }}
                      style={styles.projectImage}
                    />
                    <View style={styles.projectImageChip}>
                      <Text style={styles.chipBlueText}>{proj.cause}</Text>
                    </View>
                    <View style={styles.projectMatchBadge}>
                      <Text style={styles.matchBadgeText}>• {proj.match}</Text>
                    </View>
                  </View>

                  <Text style={styles.projectTitle}>{proj.title}</Text>
                  <Text style={styles.projectSubTitle}>
                    {proj.orgName} • {proj.location}
                  </Text>

                  <Text style={styles.descriptionText} numberOfLines={2}>
                    {proj.description}
                  </Text>

                  {/* Progress Bar */}
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${proj.progressRatio * 100}%` },
                      ]}
                    />
                  </View>

                  <View style={styles.progressLabelRow}>
                    <Text style={styles.progressTextGreen}>
                      {proj.raised} raised
                    </Text>
                    <Text style={styles.progressTextGray}>
                      {proj.percent} of {proj.goal}
                    </Text>
                  </View>

                  <View style={styles.cardActionRow}>
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => setSelectedProject(proj)}
                    >
                      <Text style={styles.primaryButtonText}>View Project</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.favoriteButton}
                      onPress={() => toggleFavorite(proj.id)}
                    >
                      <Text style={styles.heartIcon}>
                        {favorites[proj.id] ? "❤️" : "🤍"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* --- FILTER MODAL --- */}
        <Modal
          visible={isFilterModalVisible}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.filterModalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter Organisations</Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* Cause Filter */}
                <Text style={styles.filterSectionTitle}>Cause</Text>
                <View style={styles.filterChipContainer}>
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
                        selectedCause === cause && styles.activeFilterChip,
                      ]}
                      onPress={() =>
                        setSelectedCause(selectedCause === cause ? "" : cause)
                      }
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedCause === cause && styles.activeFilterChipText,
                        ]}
                      >
                        {cause}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Location Filter */}
                <Text style={styles.filterSectionTitle}>Location</Text>
                <View style={styles.filterChipContainer}>
                  {["South Africa", "Kenya", "Nigeria", "Zambia", "Uganda"].map(
                    (loc) => (
                      <TouchableOpacity
                        key={loc}
                        style={[
                          styles.filterChip,
                          selectedLocation === loc && styles.activeFilterChip,
                        ]}
                        onPress={() =>
                          setSelectedLocation(selectedLocation === loc ? "" : loc)
                        }
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            selectedLocation === loc &&
                              styles.activeFilterChipText,
                          ]}
                        >
                          {loc}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>

                {/* Verification Status */}
                <Text style={styles.filterSectionTitle}>Verification Status</Text>
                <View style={styles.filterChipContainer}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      !verifiedOnly && styles.activeFilterChip,
                    ]}
                    onPress={() => setVerifiedOnly(false)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        !verifiedOnly && styles.activeFilterChipText,
                      ]}
                    >
                      All
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      verifiedOnly && styles.activeFilterChip,
                    ]}
                    onPress={() => setVerifiedOnly(true)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        verifiedOnly && styles.activeFilterChipText,
                      ]}
                    >
                      Verified Only
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    setSelectedCause("");
                    setSelectedLocation("");
                    setVerifiedOnly(false);
                  }}
                >
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => setFilterModalVisible(false)}
                >
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* --- ORGANISATION DETAIL MODAL --- */}
        {selectedOrg && (
          <Modal visible={true} animationType="slide">
            <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
              <ScrollView>
                <View style={styles.detailHeaderNav}>
                  <TouchableOpacity onPress={() => setSelectedOrg(null)}>
                    <Text style={styles.backButton}>‹</Text>
                  </TouchableOpacity>
                  <Text style={styles.detailNavTitle}>Organisation</Text>
                  <TouchableOpacity
                    onPress={() => toggleFavorite(selectedOrg.id)}
                  >
                    <Text style={styles.heartIcon}>
                      {favorites[selectedOrg.id] ? "❤️" : "🤍"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.detailBanner}>
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop",
                    }}
                    style={styles.detailBannerImage}
                  />
                  {selectedOrg.profileImageUrl ? (
                    <Image
                      source={{ uri: selectedOrg.profileImageUrl }}
                      style={styles.detailAvatarImage}
                    />
                  ) : (
                    <View style={[styles.detailAvatar, selectedOrg.bgStyle]}>
                      <Text style={styles.detailAvatarText}>
                        {selectedOrg.abbrev}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailContent}>
                  <Text style={styles.detailTitle}>{selectedOrg.name}</Text>
                  <View style={styles.detailSubRow}>
                    <Text style={styles.verifiedText}>
                      {selectedOrg.verified ? "✓ Verified" : "Not yet verified"} • {selectedOrg.location}
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.expressInterestButton}>
                    <Text style={styles.primaryButtonText}>
                      Express Interest
                    </Text>
                  </TouchableOpacity>

                  {/* Contact */}
                  <Text style={styles.sectionHeader}>Contact</Text>
                  <Text style={styles.bodyText}>{selectedOrg.email}</Text>

                  {/* About */}
                  <Text style={styles.sectionHeader}>Mission</Text>
                  <Text style={styles.bodyText}>{selectedOrg.about}</Text>

                  {/* Funding Need */}
                  <Text style={styles.sectionHeader}>Funding Need</Text>
                  <Text style={styles.bodyText}>{selectedOrg.fundingNeed}</Text>

                  {/* Causes */}
                  {selectedOrg.causes.length > 0 && (
                    <>
                      <Text style={styles.sectionHeader}>Community Served</Text>
                      <View style={styles.chipRow}>
                        {selectedOrg.causes.map((c, i) => (
                          <View key={i} style={[styles.chip, styles.chipGreen]}>
                            <Text style={styles.chipGreenText}>{c}</Text>
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

        {/* --- PROJECT DETAIL MODAL --- */}
        {selectedProject && (
          <Modal visible={true} animationType="slide">
            <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
              <ScrollView>
                <View style={styles.detailHeaderNav}>
                  <TouchableOpacity onPress={() => setSelectedProject(null)}>
                    <Text style={styles.backButton}>‹</Text>
                  </TouchableOpacity>
                  <Text style={styles.detailNavTitle}>Project Details</Text>
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchBadgeText}>
                      • {selectedProject.match}
                    </Text>
                  </View>
                </View>

                <View style={styles.projectDetailBanner}>
                  <Image
                    source={{ uri: selectedProject.image }}
                    style={styles.projectDetailImage}
                  />
                  <View style={styles.projectDetailOverlay}>
                    <View style={styles.chipBlue}>
                      <Text style={styles.chipBlueText}>
                        {selectedProject.cause}
                      </Text>
                    </View>
                    <Text style={styles.projectDetailBannerTitle}>
                      {selectedProject.title}
                    </Text>
                    <Text style={styles.projectDetailBannerSub}>
                      {selectedProject.orgName} ✓ Verified
                    </Text>
                  </View>
                </View>

                <View style={styles.detailContent}>
                  {/* Funding Box */}
                  <View style={styles.fundingCard}>
                    <View style={styles.fundingRow}>
                      <View>
                        <Text style={styles.fundingStatGreen}>
                          {selectedProject.raised}
                        </Text>
                        <Text style={styles.statLabel}>Raised</Text>
                      </View>
                      <View>
                        <Text style={styles.fundingStatBold}>
                          {selectedProject.goal}
                        </Text>
                        <Text style={styles.statLabel}>Goal</Text>
                      </View>
                      <View>
                        <Text style={styles.fundingStatRed}>
                          {selectedProject.remaining}
                        </Text>
                        <Text style={styles.statLabel}>Remaining</Text>
                      </View>
                    </View>

                    <View style={styles.progressBarContainer}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${selectedProject.progressRatio * 100}%`,
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.progressLabelRow}>
                      <Text style={styles.progressTextGreen}>
                        {selectedProject.raised} raised
                      </Text>
                      <Text style={styles.progressTextGray}>
                        {selectedProject.percent} of {selectedProject.goal}
                      </Text>
                    </View>
                  </View>

                  {/* Project Overview */}
                  <Text style={styles.sectionHeader}>Project Overview</Text>
                  <Text style={styles.bodyText}>
                    {selectedProject.description}
                  </Text>

                  <View style={styles.infoTable}>
                    <View style={styles.infoTableRow}>
                      <Text style={styles.infoTableLabel}>Location</Text>
                      <Text style={styles.infoTableValue}>
                        {selectedProject.location}
                      </Text>
                    </View>
                    <View style={styles.infoTableRow}>
                      <Text style={styles.infoTableLabel}>Beneficiaries</Text>
                      <Text style={styles.infoTableValue}>
                        {selectedProject.beneficiaries}
                      </Text>
                    </View>
                    <View style={styles.infoTableRow}>
                      <Text style={styles.infoTableLabel}>Deadline</Text>
                      <Text style={styles.infoTableValue}>
                        {selectedProject.deadline}
                      </Text>
                    </View>
                    <View style={styles.infoTableRow}>
                      <Text style={styles.infoTableLabel}>
                        Interested Sponsors
                      </Text>
                      <Text style={styles.infoTableValue}>
                        {selectedProject.interestedSponsors}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.projectActionRow}>
                    <TouchableOpacity style={styles.contactNgoButton}>
                      <Text style={styles.contactNgoText}>Contact NGO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.sponsorProjectButton}
                      onPress={() => setSponsorshipProject(selectedProject)}
                    >
                      <Text style={styles.primaryButtonText}>
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

function ProjectCard({ project, onPress }) {
    const percentFunded = Math.min(100, Math.round((project.raised / project.goal) * 100));

    return (
        <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
            <View style={styles.cardTopRow}>
                <View style={[styles.orgLogo, { backgroundColor: project.color }]}>
                    <Ionicons name={project.icon} size={20} color={COLORS.white} />
                </View>

                <View style={styles.cardTitleBlock}>
                    <Text style={styles.orgName} numberOfLines={2}>
                        {project.title}
                    </Text>
                    <Text style={styles.projectOrgName} numberOfLines={1}>
                        {project.orgName}
                    </Text>
                </View>

                <View style={styles.matchPill}>
                    <View style={styles.matchDot} />
                    <Text style={styles.matchPillText}>{project.matchScore}%</Text>
                </View>
            </View>

            <View style={[styles.tagPill, styles.projectCategoryPill, { backgroundColor: getTagStyle(project.category).bg }]}>
                <Text style={[styles.tagPillText, { color: getTagStyle(project.category).text }]}>
                    {project.category}
                </Text>
            </View>

            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${percentFunded}%` }]} />
            </View>

            <View style={styles.progressLabelsRow}>
                <Text style={styles.progressRaised}>{formatCurrency(project.raised)} raised</Text>
                <Text style={styles.progressPercent}>
                    {percentFunded}% of {formatCurrency(project.goal)}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

export default function SponsorDiscoverScreen({ navigation }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("organisations"); // "organisations" | "projects"
    const [savedIds, setSavedIds] = useState([]);

    const toggleSaved = (id) => {
        setSavedIds((prev) =>
            prev.includes(id) ? prev.filter((savedId) => savedId !== id) : [...prev, id]
        );
    };

    const filteredOpportunities = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return opportunities;
        return opportunities.filter((org) => {
            const haystack = [org.name, org.location, ...org.tags].join(" ").toLowerCase();
            return haystack.includes(query);
        });
    }, [searchQuery]);

    const filteredProjects = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return projects;
        return projects.filter((project) => {
            const haystack = [project.title, project.orgName, project.category]
                .join(" ")
                .toLowerCase();
            return haystack.includes(query);
        });
    }, [searchQuery]);

    const goToOpportunity = (opportunity) => {
        navigation.navigate("SponsorOpportunityDetails", { opportunity });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Discover Impact</Text>

                <View style={styles.searchRow}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search NGOs, projects or causes"
                            placeholderTextColor={COLORS.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
                        {/* TODO: wire up a real filter modal (cause, location, funding range) */}
                        <Ionicons name="options-outline" size={18} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.tabTrack}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "organisations" && styles.tabActive]}
                        activeOpacity={0.8}
                        onPress={() => setActiveTab("organisations")}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === "organisations" && styles.tabTextActive,
                            ]}
                        >
                            Organisations
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === "projects" && styles.tabActive]}
                        activeOpacity={0.8}
                        onPress={() => setActiveTab("projects")}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === "projects" && styles.tabTextActive,
                            ]}
                        >
                            Projects
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            >
                {activeTab === "organisations" ? (
                    filteredOpportunities.length > 0 ? (
                        filteredOpportunities.map((org) => (
                            <OrgCard
                                key={org.id}
                                org={org}
                                saved={savedIds.includes(org.id)}
                                onToggleSave={() => toggleSaved(org.id)}
                                onPress={() => goToOpportunity(org)}
                            />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No organisations match your search.</Text>
                    )
                ) : filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onPress={() => {}}
                        />
                    ))
                ) : (
                    <Text style={styles.emptyText}>No projects match your search.</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF" },
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  emptyStateText: { fontSize: 14, color: "#64748B", textAlign: "center" },

  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: "#FFF",
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
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#0F172A" },
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
  filterIcon: { fontSize: 18 },

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
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: { fontSize: 14, color: "#64748B", fontWeight: "600" },
  activeTabText: { color: "#0F172A" },

  scrollContent: { padding: 16 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeader: { flexDirection: "row", marginBottom: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarImage: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  avatarText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  cardHeaderContent: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orgTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  matchBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  matchBadgeText: { color: "#15803D", fontSize: 12, fontWeight: "600" },
  verifiedRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  verifiedIcon: {
    fontSize: 10,
    color: "#166534",
    backgroundColor: "#DCFCE7",
    borderRadius: 8,
    paddingHorizontal: 4,
    marginRight: 4,
  },
  verifiedText: { fontSize: 12, color: "#166534", fontWeight: "500" },
  locationText: { fontSize: 12, color: "#64748B", marginTop: 2 },

  chipRow: { flexDirection: "row", flexWrap: "wrap", marginVertical: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  chipBlue: { backgroundColor: "#E0F2FE" },
  chipBlueText: { color: "#0369A1", fontSize: 12, fontWeight: "500" },
  chipYellow: { backgroundColor: "#FEF3C7" },
  chipYellowText: { color: "#B45309", fontSize: 12, fontWeight: "500" },
  chipGreen: { backgroundColor: "#DCFCE7" },
  chipGreenText: { color: "#15803D", fontSize: 12, fontWeight: "500" },

  descriptionText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 8,
  },
  fundingText: { fontSize: 12, color: "#0F172A", fontWeight: "600" },
  fundingHighlight: { color: "#0F172A" },

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
  primaryButtonText: { color: "#FFF", fontWeight: "600", fontSize: 14 },
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
  heartIcon: { fontSize: 18 },

  projectImageContainer: {
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    position: "relative",
  },
  projectImage: { width: "100%", height: "100%" },
  projectImageChip: { position: "absolute", top: 10, left: 10 },
  projectMatchBadge: { position: "absolute", top: 10, right: 10 },
  projectTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
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
  progressBarFill: { height: "100%", backgroundColor: "#227B53" },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressTextGreen: { fontSize: 12, color: "#227B53", fontWeight: "600" },
  progressTextGray: { fontSize: 12, color: "#64748B" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  filterModalContainer: {
    backgroundColor: "#FFF",
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
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  closeIcon: { fontSize: 18, color: "#64748B" },
  modalBody: { marginVertical: 12 },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginTop: 12,
    marginBottom: 8,
  },
  filterChipContainer: { flexDirection: "row", flexWrap: "wrap" },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 8,
    marginBottom: 8,
  },
  activeFilterChip: { backgroundColor: "#227B53", borderColor: "#227B53" },
  filterChipText: { color: "#475569", fontSize: 12 },
  activeFilterChipText: { color: "#FFF", fontWeight: "600" },

  modalFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  clearButton: { flex: 1, alignItems: "center", paddingVertical: 12 },
  clearButtonText: { color: "#64748B", fontWeight: "600" },
  applyButton: {
    flex: 2,
    backgroundColor: "#227B53",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  applyButtonText: { color: "#FFF", fontWeight: "600" },

  detailHeaderNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { fontSize: 24, color: "#0F172A" },
  detailNavTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },

  detailBanner: { position: "relative", height: 160, marginBottom: 40 },
  detailBannerImage: { width: "100%", height: "100%" },
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
    borderColor: "#FFF",
  },
  detailAvatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    position: "absolute",
    bottom: -32,
    left: 16,
    borderWidth: 3,
    borderColor: "#FFF",
  },
  detailAvatarText: { color: "#FFF", fontWeight: "700" },
  detailContent: { paddingHorizontal: 16 },
  detailTitle: { fontSize: 20, fontWeight: "700", color: "#0F172A" },
  detailSubRow: { flexDirection: "row", marginTop: 4, marginBottom: 12 },

  expressInterestButton: {
    backgroundColor: "#227B53",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  statItem: { alignItems: "center" },
  statNumber: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  statLabel: { fontSize: 11, color: "#64748B" },

  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 12,
    marginBottom: 6,
  },
  bodyText: { fontSize: 13, color: "#475569", lineHeight: 20 },

  projectDetailBanner: { height: 200, position: "relative" },
  projectDetailImage: { width: "100%", height: "100%" },
  projectDetailOverlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
  },
  projectDetailBannerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    marginTop: 4,
  },
  projectDetailBannerSub: { fontSize: 12, color: "#E2E8F0" },

  fundingCard: {
    backgroundColor: "#FFF",
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
  fundingStatGreen: { fontSize: 14, fontWeight: "700", color: "#227B53" },
  fundingStatBold: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  fundingStatRed: { fontSize: 14, fontWeight: "700", color: "#DC2626" },

  infoTable: { marginVertical: 12 },
  infoTableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  infoTableLabel: { fontSize: 13, color: "#64748B" },
  infoTableValue: { fontSize: 13, fontWeight: "600", color: "#0F172A" },

  projectActionRow: { flexDirection: "row", marginTop: 12, marginBottom: 24 },
  contactNgoButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
  },
  contactNgoText: { color: "#0F172A", fontWeight: "600" },
  sponsorProjectButton: {
    flex: 2,
    backgroundColor: "#227B53",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});