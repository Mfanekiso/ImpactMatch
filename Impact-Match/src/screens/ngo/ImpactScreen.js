import React from "react";
<<<<<<< HEAD
import { View, Text, StyleSheet } from "react-native";

export default function ImpactScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Impact Screen</Text>
    </View>
=======
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

// Light Green theme colors for ImpactMatch
const COLORS = {
  background: "#F9FAFB",
  surface: "#FFFFFF",
  primary: "#10B981", // Light green accent (Emerald)
  primaryLight: "rgba(16, 185, 129, 0.1)",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  white: "#FFFFFF",
  accentOrange: "#F59E0B",
};

export default function ImpactScreen({ navigation, route }) {
  // Extract data passed from navigation (if any)
  const { organisationName } = route?.params || {};

  // Overview impact statistics
  const impactStats = [
    {
      id: "1",
      title: "Total Raised",
      value: "R 245,000",
      icon: "cash-outline",
      color: "#10B981",
    },
    {
      id: "2",
      title: "Lives Impacted",
      value: "1,250+",
      icon: "people-outline",
      color: "#3B82F6",
    },
    {
      id: "3",
      title: "Active Projects",
      value: "4",
      icon: "folder-open-outline",
      color: "#8B5CF6",
    },
    {
      id: "4",
      title: "Matched Sponsors",
      value: "6",
      icon: "hand-left-outline",
      color: "#F59E0B",
    },
  ];

  // Key impact metrics & progress
  const impactMetrics = [
    {
      id: "1",
      title: "Youth Tech Literacy Program",
      category: "Education",
      progress: 0.8, // 80%
      target: "200 Students",
      current: "160 Students",
      sponsor: "TechCorp Foundation",
    },
    {
      id: "2",
      title: "Community Food Relief",
      category: "Social Welfare",
      progress: 0.55, // 55%
      target: "1,000 Meals",
      current: "550 Meals",
      sponsor: "GreenGrocers SA",
    },
  ];

  // Recent impact stories/updates
  const recentUpdates = [
    {
      id: "1",
      title: "20 Laptops Delivered",
      date: "14 Sep 2026",
      description: "Successfully distributed digital learning tools to Soweto Learning Hub.",
      icon: "laptop-outline",
    },
    {
      id: "2",
      title: "Sponsorship Renewed",
      date: "02 Sep 2026",
      description: "Apex Capital renewed sponsorship funding for Q4 2026.",
      icon: "ribbon-outline",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <Text style={styles.headerSubtitle}>Impact Dashboard</Text>
        <Text style={styles.headerTitle}>
          {organisationName ? `${organisationName}'s Impact` : "Your Real-World Impact"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          {impactStats.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}15` }]}>
                <Ionicons name={stat.icon} size={22} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>

        {/* Sponsor Visibility Card */}
        <View style={styles.sponsorCard}>
          <View style={styles.sponsorHeader}>
            <View style={styles.badgeRow}>
              <Ionicons name="sparkles-outline" size={16} color={COLORS.primary} />
              <Text style={styles.badgeText}>Sponsor High Score</Text>
            </View>
            <Text style={styles.scoreText}>94% Match</Text>
          </View>
          <Text style={styles.sponsorDescription}>
            Your active impact reporting makes your NGO 2.5x more visible to potential corporate sponsors!
          </Text>
        </View>

        {/* Active Impact Projects Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Impact Goals</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {impactMetrics.map((item) => (
          <View key={item.id} style={styles.goalCard}>
            <View style={styles.goalTopRow}>
              <View>
                <Text style={styles.goalTitle}>{item.title}</Text>
                <Text style={styles.goalCategory}>
                  <Ionicons name="pricetag-outline" size={12} color={COLORS.textSecondary} /> {item.category}
                </Text>
              </View>
              <View style={styles.sponsorBadge}>
                <Text style={styles.sponsorBadgeText}>Sponsor: {item.sponsor}</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressText}>
                  {item.current} / {item.target}
                </Text>
                <Text style={styles.progressPercentage}>
                  {Math.round(item.progress * 100)}%
                </Text>
              </View>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${item.progress * 100}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        ))}

        {/* Impact Evidence & Updates */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Verification Updates</Text>
        </View>

        <View style={styles.updatesContainer}>
          {recentUpdates.map((update, index) => (
            <View
              key={update.id}
              style={[
                styles.updateItem,
                index === recentUpdates.length - 1 && styles.updateItemLast,
              ]}
            >
              <View style={styles.updateIconBox}>
                <Ionicons name={update.icon} size={20} color={COLORS.primary} />
              </View>
              <View style={styles.updateContent}>
                <View style={styles.updateRow}>
                  <Text style={styles.updateTitle}>{update.title}</Text>
                  <Text style={styles.updateDate}>{update.date}</Text>
                </View>
                <Text style={styles.updateDescription}>{update.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Add Impact Report Button */}
        <TouchableOpacity style={styles.addReportButton} activeOpacity={0.85}>
          <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
          <Text style={styles.addReportButtonText}>Log New Impact Report</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
>>>>>>> 9c3cc5d81788a18ed81af4012a16d994a9d2d12d
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  text: {
    fontSize: 20,
    fontWeight: "600",
  },
});

=======
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  /* Header Banner */
  headerBanner: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
  },

  /* Grid Stats */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginTop: 16,
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: COLORS.white,
    width: "48%",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  statIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  statTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  /* Sponsor Visibility Card */
  sponsorCard: {
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  sponsorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  sponsorDescription: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },

  /* Section Header */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },

  /* Goal Cards */
  goalCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  goalTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  goalCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sponsorBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sponsorBadgeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  progressContainer: {
    marginTop: 4,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },

  /* Recent Updates */
  updatesContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  updateItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  updateItemLast: {
    borderBottomWidth: 0,
  },
  updateIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  updateContent: {
    flex: 1,
  },
  updateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  updateTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  updateDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  updateDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  /* Add Report CTA Button */
  addReportButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  addReportButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },
});
>>>>>>> 9c3cc5d81788a18ed81af4012a16d994a9d2d12d
