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
  ActivityIndicator,
} from "react-native";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../../Backend/firebaseConfig";
import Ionicons from "@react-native-vector-icons/ionicons";
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";

const { width } = Dimensions.get("window");

// ─── LUXURY COLOR PALETTE (Sponsor Twist) ──────────────────────────────
const COLORS = {
  background: "#F8F6EE",       // Cream base
  surface: "#FFFFFF",          // Clean white
  primary: "#D9C982",          // Soft Luxury Gold
  primarySoft: "rgba(217, 201, 130, 0.2)",
  emerald: "#059669",          // Vibrant Emerald
  emeraldSoft: "rgba(5, 150, 105, 0.1)",
  buttonDark: "#013e37",       // Deep luxury green
  buttonDarkSoft: "rgba(1, 62, 55, 0.08)",
  textPrimary: "#433327",      // Warm Bronze
  textSecondary: "#8C7A6B",    // Muted taupe
  border: "#E8DFD5",
  white: "#FFFFFF",
};

const softShadow = {
  shadowColor: COLORS.textPrimary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.04,
  shadowRadius: 10,
  elevation: 2,
};

// ─── MOCK DATA ────────────────────────────────────────────────────────
const BENEFICIARY_POINTS = [
  { month: "Mar", val: 40 },
  { month: "Apr", val: 52 },
  { month: "May", val: 64 },
  { month: "Jun", val: 72 },
  { month: "Jul", val: 81 },
  { month: "Aug", val: 94 },
];

const FUNDING_BY_CAUSE = [
  { cause: "Edu.", percentage: 36, heightPct: 0.8 },
  { cause: "Health", percentage: 22, heightPct: 0.55 },
  { cause: "Env.", percentage: 18, heightPct: 0.42 },
  { cause: "Youth", percentage: 15, heightPct: 0.35 },
  { cause: "Other", percentage: 9, heightPct: 0.22 },
];

export default function ImpactDashboardScreen() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  const [projects, setProjects] = React.useState([]);
  const [projectsLoading, setProjectsLoading] = React.useState(true);
  const [projectsError, setProjectsError] = React.useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(
        collection(db, "projects"),
        where("status", "in", ["open", "active", "Active", "completed", "Completed"])
      ),
      (snapshot) => {
        const rows = snapshot.docs.map((projectDoc) => ({ id: projectDoc.id, ...projectDoc.data() }));
        rows.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setProjects(rows);
        setProjectsLoading(false);
        setProjectsError(false);
      },
      (error) => {
        console.warn("Could not load sponsor impact projects:", error?.message);
        setProjectsLoading(false);
        setProjectsError(true);
      }
    );
    return unsubscribe;
  }, []);

  const totalFundingGoal = projects.reduce((sum, project) => sum + (Number(project.fundingGoal ?? project.goalAmount) || 0), 0);
  const totalPartners = new Set(projects.map((project) => project.orgName || project.ngoName).filter(Boolean)).size;
  const totalPeople = projects.reduce((sum, project) => sum + (Number(project.beneficiariesCount ?? project.beneficiaries) || 0), 0);
  const summaryStats = [
    { id: "1", label: "Funding", value: `R${totalFundingGoal.toLocaleString("en-ZA")}`, bgColor: COLORS.primarySoft, color: COLORS.buttonDark },
    { id: "2", label: "Partners", value: String(totalPartners), bgColor: COLORS.emeraldSoft, color: COLORS.emerald },
    { id: "3", label: "Projects", value: String(projects.length), bgColor: COLORS.surface, color: COLORS.textPrimary, border: COLORS.border },
    { id: "4", label: "People", value: totalPeople.toLocaleString("en-ZA"), bgColor: COLORS.buttonDarkSoft, color: COLORS.buttonDark },
  ];

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
  }, [fadeAnim, slideAnim, barAnim]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
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
              {summaryStats.map((stat) => (
                <View 
                  key={stat.id} 
                  style={[
                    styles.statCard, 
                    { backgroundColor: stat.bgColor },
                    stat.border && { borderWidth: 1, borderColor: stat.border }
                  ]}
                >
                  <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Section 1: Beneficiaries Over Time */}
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

                {/* Simulated Line Graph Overlay */}
                <View style={styles.lineGraphOverlay}>
                  {BENEFICIARY_POINTS.map((pt, index) => {
                    if (index === BENEFICIARY_POINTS.length - 1) return null;
                    return (
                      <View
                        key={`segment-${index}`}
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
                      key={`point-${index}`}
                      style={[
                        styles.chartPoint,
                        {
                          left: `${(index / (BENEFICIARY_POINTS.length - 1)) * 80 + 8}%`,
                          bottom: `${(pt.val * 0.7) - 2}%`,
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
              <Ionicons name="trending-up" size={16} color={COLORS.emerald} style={styles.growthIcon} />
              <Text style={styles.growthBadgeText}>
                +124% beneficiary growth in 6 months
              </Text>
            </View>
          </View>

          {/* Section 2: Funding by Cause */}
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
          {projectsLoading ? (
            <ActivityIndicator size="large" color={COLORS.buttonDark} style={{ marginVertical: 24 }} />
          ) : projectsError ? (
            <View style={styles.projectsEmpty}>
              <Text style={styles.emptyProjectText}>Projects could not be loaded. Check your connection and try again.</Text>
            </View>
          ) : projects.length === 0 ? (
            <View style={styles.projectsEmpty}>
              <Text style={styles.emptyProjectText}>No projects have been published yet.</Text>
            </View>
          ) : projects.map((project) => {
            const goal = Number(project.fundingGoal ?? project.goalAmount) || 0;
            const raised = Number(project.raisedAmount) || 0;
            const ratio = goal > 0 ? Math.min(raised / goal, 1) : 0;
            const beneficiaryCount = Number(project.beneficiariesCount ?? project.beneficiaries) || 0;
            const status = project.status || "Active";
            const completed = ["completed", "closed", "fully funded"].includes(String(status).toLowerCase());
            return (
            <TouchableOpacity key={project.id} activeOpacity={0.8} style={styles.projectCard}>
              <View style={styles.projectCardHeader}>
                {project.imageUrl ? (
                  <Image source={{ uri: project.imageUrl }} style={styles.projectThumb} />
                ) : (
                  <View style={[styles.projectThumb, styles.projectImageFallback]} />
                )}
                <View style={styles.projectMeta}>
                  <View style={styles.projectTitleRow}>
                    <Text style={styles.projectTitle} numberOfLines={1}>
                      {project.title}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        completed
                          ? styles.statusBadgeCompleted
                          : styles.statusBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          completed
                            ? styles.statusTextCompleted
                            : styles.statusTextActive,
                        ]}
                      >
                        {status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.projectOrg}>{project.orgName || project.ngoName || "Community organisation"}</Text>
                  <Text style={styles.projectBeneficiaries}>{beneficiaryCount.toLocaleString("en-ZA")} beneficiaries</Text>
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
                        outputRange: ["0%", `${ratio * 100}%`],
                      }),
                    },
                  ]}
                />
              </View>

              <View style={styles.progressValueRow}>
                <Text style={styles.raisedText}>R{raised.toLocaleString("en-ZA")} raised</Text>
                <Text style={styles.goalText}>
                  {Math.round(ratio * 100)}% of R{goal.toLocaleString("en-ZA")}
                </Text>
              </View>
            </TouchableOpacity>
          );
          })}

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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  scrollContent: { 
    paddingHorizontal: 24, 
    paddingTop: 16, 
    paddingBottom: 112 
  },

  /* Header */
  headerContainer: { 
    marginBottom: 24 
  },
  headerTitle: { 
    fontFamily: "Manrope_700Bold",
    fontSize: 28, 
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: { 
    fontFamily: "Manrope_500Medium",
    fontSize: 14, 
    color: COLORS.textSecondary, 
    marginTop: 4, 
    marginBottom: 24 
  },

  /* Top Metric Cards */
  statsGrid: { 
    flexDirection: "row", 
    justifyContent: "space-between",
    gap: 8,
  },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    ...softShadow,
  },
  statValue: { 
    fontFamily: "Manrope_700Bold",
    fontSize: 18, 
  },
  statLabel: { 
    fontFamily: "Manrope_600SemiBold",
    fontSize: 11, 
    color: COLORS.textSecondary, 
    marginTop: 4 
  },

  /* Section Cards */
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...softShadow,
  },
  cardTitle: { 
    fontFamily: "Manrope_700Bold",
    fontSize: 18, 
    color: COLORS.textPrimary, 
    marginBottom: 20 
  },

  /* Beneficiary Line Chart */
  chartContainer: { flexDirection: "row", height: 130, marginBottom: 16 },
  yAxisContainer: { justifyContent: "space-between", paddingRight: 12 },
  axisText: { 
    fontFamily: "Manrope_500Medium",
    fontSize: 11, 
    color: COLORS.textSecondary 
  },
  lineAreaContainer: { flex: 1, position: "relative" },
  gridLineContainer: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, justifyContent: "space-between" },
  gridLine: { height: 1, backgroundColor: COLORS.background, width: "100%" },
  lineGraphOverlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0 },
  chartPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.buttonDark,
    position: "absolute",
    zIndex: 2,
  },
  lineSegment: {
    width: 35,
    height: 2,
    backgroundColor: COLORS.emerald,
    position: "absolute",
    transform: [{ rotate: "-15deg" }],
    zIndex: 1,
  },
  xAxisContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    bottom: -20,
    left: 0,
    right: 0,
  },
  growthBadge: {
    flexDirection: "row",
    backgroundColor: COLORS.emeraldSoft,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  growthIcon: { marginRight: 6 },
  growthBadgeText: { 
    fontFamily: "Manrope_700Bold",
    fontSize: 12, 
    color: COLORS.emerald, 
  },

  /* Bar Chart */
  barChartContainer: { flexDirection: "row", height: 140, alignItems: "flex-end" },
  barYAxis: { height: "100%", justifyContent: "space-between", paddingRight: 12, paddingBottom: 20 },
  barsArea: { flex: 1, flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end" },
  barColumn: { alignItems: "center" },
  barTrack: { height: 110, justifyContent: "flex-end", width: 28, borderRadius: 6, backgroundColor: COLORS.background },
  barFill: { width: "100%", backgroundColor: COLORS.buttonDark, borderRadius: 6 },
  barLabel: { 
    fontFamily: "Manrope_600SemiBold",
    fontSize: 11, 
    color: COLORS.textSecondary, 
    marginTop: 8 
  },

  /* Active Projects */
  sectionHeaderTitle: { 
    fontFamily: "Manrope_700Bold",
    fontSize: 18, 
    color: COLORS.textPrimary, 
    marginTop: 8, 
    marginBottom: 16 
  },
  projectCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...softShadow,
  },
  projectCardHeader: { flexDirection: "row" },
  projectThumb: { width: 56, height: 56, borderRadius: 12, marginRight: 16 },
  projectImageFallback: { backgroundColor: COLORS.primarySoft },
  projectsEmpty: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 20, marginBottom: 16 },
  emptyProjectText: { fontFamily: "Manrope_500Medium", fontSize: 14, color: COLORS.textSecondary, textAlign: "center", lineHeight: 21 },
  projectMeta: { flex: 1, justifyContent: "center" },
  projectTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  projectTitle: { 
    fontFamily: "Manrope_700Bold",
    fontSize: 15, 
    color: COLORS.textPrimary, 
    flex: 1 
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
  statusBadgeActive: { backgroundColor: COLORS.primarySoft },
  statusBadgeCompleted: { backgroundColor: COLORS.emeraldSoft },
  statusBadgeText: { 
    fontFamily: "Manrope_700Bold",
    fontSize: 10, 
    textTransform: "uppercase" 
  },
  statusTextActive: { color: COLORS.textPrimary },
  statusTextCompleted: { color: COLORS.emerald },
  projectOrg: { 
    fontFamily: "Manrope_500Medium",
    fontSize: 12, 
    color: COLORS.textSecondary, 
    marginTop: 4 
  },
  projectBeneficiaries: { 
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12, 
    color: COLORS.emerald, 
    marginTop: 4 
  },

  progressBarTrack: { 
    height: 8, 
    backgroundColor: COLORS.background, 
    borderRadius: 4, 
    marginTop: 16, 
    overflow: "hidden" 
  },
  progressBarFill: { height: "100%", backgroundColor: COLORS.emerald },
  progressValueRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  raisedText: { 
    fontFamily: "Manrope_700Bold",
    fontSize: 12, 
    color: COLORS.emerald, 
  },
  goalText: { 
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12, 
    color: COLORS.textSecondary 
  },

  /* Impact Story Card */
  storyCard: {
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    marginBottom: 24,
    ...softShadow,
  },
  storyImage: { width: "100%", height: "100%" },
  storyOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(1, 62, 55, 0.7)", // Deep luxury green transparent overlay
  },
  storyCategoryBadge: {
    backgroundColor: COLORS.primarySoft,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
  },
  storyCategoryText: { 
    fontFamily: "Manrope_700Bold",
    color: COLORS.primary, 
    fontSize: 10, 
    textTransform: "uppercase" 
  },
  storyTitle: { 
    fontFamily: "Manrope_700Bold",
    color: COLORS.white, 
    fontSize: 16,
    lineHeight: 22,
  },
  storySubText: { 
    fontFamily: "Manrope_500Medium",
    color: COLORS.border, 
    fontSize: 12, 
    marginTop: 6 
  },
});
