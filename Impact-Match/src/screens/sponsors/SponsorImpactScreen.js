import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");

// Mock Data
const SUMMARY_STATS = [
  { id: "1", label: "Funding", value: "R4.2M", bgColor: "#EFF6FF", color: "#1E40AF" },
  { id: "2", label: "Partners", value: "6", bgColor: "#ECFDF5", color: "#047857" },
  { id: "3", label: "Projects", value: "9", bgColor: "#FEF3C7", color: "#B45309" },
  { id: "4", label: "Beneficiaries", value: "94k", bgColor: "#F3E8FF", color: "#6B21A8" },
];

const BENEFICIARY_POINTS = [
  { month: "Mar", val: 40 },
  { month: "Apr", val: 52 },
  { month: "May", val: 64 },
  { month: "Jun", val: 72 },
  { month: "Jul", val: 81 },
  { month: "Aug", val: 94 },
];

const FUNDING_BY_CAUSE = [
  { cause: "Education", percentage: 36, heightPct: 0.8 },
  { cause: "Health", percentage: 22, heightPct: 0.55 },
  { cause: "Env.", percentage: 18, heightPct: 0.42 },
  { cause: "Youth", percentage: 15, heightPct: 0.35 },
  { cause: "Other", percentage: 9, heightPct: 0.22 },
];

const ACTIVE_PROJECTS = [
  {
    id: "proj-1",
    title: "Digital Learning Centre —...",
    org: "Education For All",
    beneficiaries: "3,200 beneficiaries",
    status: "Active",
    statusType: "active",
    raised: "R180,000",
    goal: "R300,000",
    ratio: 0.6,
    percent: "60%",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: "proj-2",
    title: "Fynbos Restoration ...",
    org: "GreenRoots Africa",
    beneficiaries: "1,200 beneficiaries",
    status: "Fully Funded",
    statusType: "completed",
    raised: "R220,000",
    goal: "R220,000",
    ratio: 1.0,
    percent: "100%",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: "proj-3",
    title: "Mobile Maternal Clinic...",
    org: "Umunthu Health Trust",
    beneficiaries: "4,800 beneficiaries",
    status: "Active",
    statusType: "active",
    raised: "R280,000",
    goal: "R800,000",
    ratio: 0.35,
    percent: "35%",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=200&auto=format&fit=crop",
  },
];

export default function ImpactDashboardScreen() {
  // Animation References
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(barAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Section */}
          <Animated.View style={[styles.headerContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.headerTitle}>Your Impact</Text>
            <Text style={styles.headerSubtitle}>
              See what your partnerships are achieving.
            </Text>

            {/* Top Stat Cards Grid */}
            <View style={styles.statsGrid}>
              {SUMMARY_STATS.map((stat) => (
                <View key={stat.id} style={[styles.statCard, { backgroundColor: stat.bgColor }]}>
                  <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Section 1: Beneficiaries Over Time (Line Chart View) */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Beneficiaries Over Time</Text>
            
            <View style={styles.chartContainer}>
              {/* Y-Axis scale */}
              <View style={styles.yAxisContainer}>
                <Text style={styles.axisText}>100k</Text>
                <Text style={styles.axisText}>75k</Text>
                <Text style={styles.axisText}>50k</Text>
                <Text style={styles.axisText}>25k</Text>
                <Text style={styles.axisText}>0k</Text>
              </View>

              {/* Line & Points Area */}
              <View style={styles.lineAreaContainer}>
                <View style={styles.gridLineContainer}>
                  <View style={styles.gridLine} />
                  <View style={styles.gridLine} />
                  <View style={styles.gridLine} />
                  <View style={styles.gridLine} />
                  <View style={styles.gridLine} />
                </View>

                {/* Simulated Line Graph Line */}
                <View style={styles.lineGraphOverlay}>
                  {BENEFICIARY_POINTS.map((pt, index) => {
                    if (index === BENEFICIARY_POINTS.length - 1) return null;
                    return (
                      <View
                        key={index}
                        style={[
                          styles.lineSegment,
                          {
                            left: `${(index / (BENEFICIARY_POINTS.length - 1)) * 80 + 10}%`,
                            bottom: `${pt.val * 0.7}%`,
                          },
                        ]}
                      />
                    );
                  })}
                  {BENEFICIARY_POINTS.map((pt, index) => (
                    <View
                      key={index}
                      style={[
                        styles.chartPoint,
                        {
                          left: `${(index / (BENEFICIARY_POINTS.length - 1)) * 80 + 8}%`,
                          bottom: `${pt.val * 0.7 - 2}%`,
                        },
                      ]}
                    />
                  ))}
                </View>

                {/* X-Axis Labels */}
                <View style={styles.xAxisContainer}>
                  {BENEFICIARY_POINTS.map((pt) => (
                    <Text key={pt.month} style={styles.axisText}>
                      {pt.month}
                    </Text>
                  ))}
                </View>
              </View>
            </View>

            {/* Growth Pill */}
            <View style={styles.growthBadge}>
              <Text style={styles.growthBadgeText}>
                📈 +124% beneficiary growth in 6 months
              </Text>
            </View>
          </View>

          {/* Section 2: Funding by Cause (Bar Chart) */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Funding by Cause</Text>
            
            <View style={styles.barChartContainer}>
              <View style={styles.barYAxis}>
                <Text style={styles.axisText}>36%</Text>
                <Text style={styles.axisText}>27%</Text>
                <Text style={styles.axisText}>18%</Text>
                <Text style={styles.axisText}>9%</Text>
                <Text style={styles.axisText}>0%</Text>
              </View>

              <View style={styles.barsArea}>
                {FUNDING_BY_CAUSE.map((item, idx) => {
                  const animatedHeight = barAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, item.heightPct * 110],
                  });

                  return (
                    <View key={idx} style={styles.barColumn}>
                      <View style={styles.barTrack}>
                        <Animated.View
                          style={[
                            styles.barFill,
                            { height: animatedHeight },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>{item.cause}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Section 3: Active Project Impact */}
          <Text style={styles.sectionHeaderTitle}>Active Project Impact</Text>
          {ACTIVE_PROJECTS.map((project) => (
            <TouchableOpacity key={project.id} activeOpacity={0.9} style={styles.projectCard}>
              <View style={styles.projectCardHeader}>
                <Image source={{ uri: project.image }} style={styles.projectThumb} />
                <View style={styles.projectMeta}>
                  <View style={styles.projectTitleRow}>
                    <Text style={styles.projectTitle} numberOfLines={1}>
                      {project.title}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        project.statusType === "completed"
                          ? styles.statusBadgeCompleted
                          : styles.statusBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          project.statusType === "completed"
                            ? styles.statusTextCompleted
                            : styles.statusTextActive,
                        ]}
                      >
                        {project.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.projectOrg}>{project.org}</Text>
                  <Text style={styles.projectBeneficiaries}>{project.beneficiaries}</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarTrack}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: barAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", `${project.ratio * 100}%`],
                      }),
                    },
                  ]}
                />
              </View>

              <View style={styles.progressValueRow}>
                <Text style={styles.raisedText}>{project.raised} raised</Text>
                <Text style={styles.goalText}>
                  {project.percent} of {project.goal}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Section 4: Impact Stories */}
          <Text style={styles.sectionHeaderTitle}>Impact Stories</Text>
          <View style={styles.storyCard}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop",
              }}
              style={styles.storyImage}
            />
            <View style={styles.storyOverlay}>
              <View style={styles.storyCategoryBadge}>
                <Text style={styles.storyCategoryText}>Education</Text>
              </View>
              <Text style={styles.storyTitle}>
                3,200 learners gained digital skills in 2026
              </Text>
              <Text style={styles.storySubText}>
                Education For All · Johannesburg
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* --- BOTTOM NAVIGATION BAR ---
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>🔍</Text>
            <Text style={styles.navLabel}>Discover</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>🤝</Text>
            <Text style={styles.navLabel}>Matches</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>💬</Text>
            <Text style={styles.navLabel}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <View style={styles.activeNavPill}>
              <Text style={[styles.navIcon, styles.activeNavIcon]}>📊</Text>
            </View>
            <Text style={[styles.navLabel, styles.activeNavLabel]}>Impact</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>👤</Text>
            <Text style={styles.navLabel}>Profile</Text>
          </TouchableOpacity>
        </View> */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },

  /* Header */
  headerContainer: { marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#0F172A" },
  headerSubtitle: { fontSize: 13, color: "#64748B", marginTop: 2, marginBottom: 16 },

  /* Top Metric Cards */
  statsGrid: { flexDirection: "row", justifyContent: "space-between" },
  statCard: {
    width: (width - 32 - 24) / 4,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  statValue: { fontSize: 16, fontWeight: "800" },
  statLabel: { fontSize: 11, color: "#475569", marginTop: 4 },

  /* Section Cards */
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 12 },

  /* Beneficiary Line Chart */
  chartContainer: { flexDirection: "row", height: 130, marginBottom: 12 },
  yAxisContainer: { justifyContent: "space-between", paddingRight: 8 },
  axisText: { fontSize: 10, color: "#94A3B8" },
  lineAreaContainer: { flex: 1, position: "relative" },
  gridLineContainer: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, justifyContent: "space-between" },
  gridLine: { height: 1, backgroundColor: "#F1F5F9", width: "100%" },
  lineGraphOverlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0 },
  chartPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#15803D",
    position: "absolute",
  },
  lineSegment: {
    width: 30,
    height: 2,
    backgroundColor: "#15803D",
    position: "absolute",
    transform: [{ rotate: "-15deg" }],
  },
  xAxisContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    bottom: -16,
    left: 0,
    right: 0,
  },
  growthBadge: {
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    marginTop: 8,
  },
  growthBadgeText: { fontSize: 12, color: "#166534", fontWeight: "600" },

  /* Bar Chart */
  barChartContainer: { flexDirection: "row", height: 140, alignItems: "flex-end" },
  barYAxis: { height: "100%", justifyContent: "space-between", paddingRight: 8, paddingBottom: 20 },
  barsArea: { flex: 1, flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end" },
  barColumn: { alignItems: "center" },
  barTrack: { height: 110, justifyContent: "flex-end", width: 24, borderRadius: 4 },
  barFill: { width: "100%", backgroundColor: "#0F2942", borderRadius: 4 },
  barLabel: { fontSize: 11, color: "#64748B", marginTop: 6 },

  /* Active Projects */
  sectionHeaderTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginTop: 8, marginBottom: 12 },
  projectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  projectCardHeader: { flexDirection: "row" },
  projectThumb: { width: 52, height: 52, borderRadius: 8, marginRight: 12 },
  projectMeta: { flex: 1 },
  projectTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  projectTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 6 },
  statusBadgeActive: { backgroundColor: "#EFF6FF" },
  statusBadgeCompleted: { backgroundColor: "#DCFCE7" },
  statusBadgeText: { fontSize: 10, fontWeight: "600" },
  statusTextActive: { color: "#2563EB" },
  statusTextCompleted: { color: "#166534" },
  projectOrg: { fontSize: 12, color: "#64748B", marginTop: 2 },
  projectBeneficiaries: { fontSize: 12, color: "#166534", fontWeight: "600", marginTop: 2 },

  progressBarTrack: { height: 6, backgroundColor: "#E2E8F0", borderRadius: 3, marginTop: 10, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: "#227B53" },
  progressValueRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  raisedText: { fontSize: 11, color: "#227B53", fontWeight: "600" },
  goalText: { fontSize: 11, color: "#64748B" },

  /* Impact Story Card */
  storyCard: {
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    marginBottom: 20,
  },
  storyImage: { width: "100%", height: "100%" },
  storyOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
  },
  storyCategoryBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  storyCategoryText: { color: "#FFFFFF", fontSize: 10, fontWeight: "600" },
  storyTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  storySubText: { color: "#CBD5E1", fontSize: 11, marginTop: 2 },

  /* Bottom Navigation */
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 6,
  },
  navItem: { flex: 1, alignItems: "center" },
  navIcon: { fontSize: 18, color: "#64748B" },
  navLabel: { fontSize: 10, color: "#64748B", marginTop: 2 },
  activeNavPill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activeNavIcon: { color: "#166534" },
  activeNavLabel: { color: "#166534", fontWeight: "700" },
});