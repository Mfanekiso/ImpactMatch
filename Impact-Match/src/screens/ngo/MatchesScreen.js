import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Image,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

const COLORS = {
  background: "#FFFFFF",
  surface: "#F9FAFB",
  border: "#E5E7EB",
  primary: "#10B981",
  primaryLight: "rgba(16, 185, 129, 0.10)",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  placeholder: "#94A3B8",
  white: "#FFFFFF",
  accentOrange: "#F59E0B",
  chipBackground: "#F1F5F9",
};

// Dummy Sponsor Data
const INITIAL_SPONSORS = [
  {
    id: "1",
    name: "TechCorp Foundation",
    category: "Education & Tech",
    matchPercentage: "96%",
    budgetRange: "R50k - R200k",
    location: "Johannesburg, GP",
    logo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=200&q=80",
    focus: ["Digital Literacy", "STEM Education", "Youth Upliftment"],
  },
  {
    id: "2",
    name: "GreenGrocers SA",
    category: "Food & Agriculture",
    matchPercentage: "88%",
    budgetRange: "R20k - R100k",
    location: "Cape Town, WC",
    logo: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80",
    focus: ["Food Security", "Sustainable Farming", "Zero Hunger"],
  },
  {
    id: "3",
    name: "Apex Capital Impact",
    category: "Community Development",
    matchPercentage: "82%",
    budgetRange: "R100k - R500k",
    location: "Durban, KZN",
    logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=200&q=80",
    focus: ["Job Creation", "SMME Support", "Infrastructure"],
  },
  {
    id: "4",
    name: "HealthCare South Africa",
    category: "Healthcare & Wellness",
    matchPercentage: "75%",
    budgetRange: "R30k - R150k",
    location: "Pretoria, GP",
    logo: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=200&q=80",
    focus: ["Maternal Health", "Medical Supplies", "Community Clinics"],
  },
];

const CATEGORIES = ["All", "Education", "Food", "Healthcare", "Community"];

export default function MatchesScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Filter sponsors based on search query and active category chip
  const filteredSponsors = INITIAL_SPONSORS.filter((sponsor) => {
    const matchesSearch =
      sponsor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sponsor.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sponsor.focus.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "All" ||
      sponsor.category.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const renderSponsorCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => {
        // Navigate to Sponsor Details screen if available
      }}
    >
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.logo }} style={styles.sponsorLogo} />
        <View style={styles.headerInfo}>
          <Text style={styles.sponsorName}>{item.name}</Text>
          <Text style={styles.sponsorCategory}>
            <Ionicons name="business-outline" size={13} color={COLORS.textSecondary} />{" "}
            {item.category}
          </Text>
        </View>
        <View style={styles.matchBadge}>
          <Text style={styles.matchBadgeText}>{item.matchPercentage} Match</Text>
        </View>
      </View>

      {/* Focus Area Tags */}
      <View style={styles.tagsContainer}>
        {item.focus.map((tag, index) => (
          <View key={index} style={styles.tagChip}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      {/* Footer Info */}
      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Ionicons name="cash-outline" size={15} color={COLORS.primary} />
          <Text style={styles.footerText}>{item.budgetRange}</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="location-outline" size={15} color={COLORS.textSecondary} />
          <Text style={styles.footerText}>{item.location}</Text>
        </View>
        <TouchableOpacity style={styles.connectButton}>
          <Text style={styles.connectButtonText}>Connect</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sponsor Matches</Text>
        <Text style={styles.headerSubtitle}>
          Sponsors aligned with your NGO mission
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={COLORS.placeholder} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search sponsors, causes, or locations"
          placeholderTextColor={COLORS.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={COLORS.placeholder} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Category Chips */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => {
            const isActive = selectedCategory === item;
            return (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  isActive && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isActive && styles.categoryTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Sponsor List / Empty State */}
      {filteredSponsors.length > 0 ? (
        <FlatList
          data={filteredSponsors}
          keyExtractor={(item) => item.id}
          renderItem={renderSponsorCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrapper}>
            <Ionicons
              name="business-outline"
              size={38}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.emptyTitle}>No Matches Found</Text>
          <Text style={styles.emptySubtitle}>
            We couldn't find any sponsors matching "{searchQuery}". Try clearing filters or searching for different keywords.
          </Text>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              setSearchQuery("");
              setSelectedCategory("All");
            }}
          >
            <Ionicons
              name="refresh-outline"
              size={18}
              color={COLORS.white}
              style={styles.refreshButtonIcon}
            />
            <Text style={styles.refreshButtonText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /* Header */
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  /* Search */
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    marginHorizontal: 24,
    marginBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },

  /* Categories */
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesList: {
    paddingHorizontal: 24,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.chipBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  categoryTextActive: {
    color: COLORS.white,
  },

  /* List Content */
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },

  /* Sponsor Card */
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  sponsorLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sponsorName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  sponsorCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  matchBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  matchBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },

  /* Focus Tags */
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  tagChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  /* Card Footer */
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  connectButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
  },
  connectButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },

  /* Empty state */
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyIconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 28,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    elevation: 3,
  },
  refreshButtonIcon: {
    marginRight: 8,
  },
  refreshButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
});