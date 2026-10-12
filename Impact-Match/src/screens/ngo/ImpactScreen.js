import React, { useEffect, useState, useRef } from "react";
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
    Modal,
    TextInput,
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

import { db, auth } from "../../../Backend/firebaseConfig";
import {
    collection,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    orderBy,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const { width } = Dimensions.get("window");

const DEFAULT_IMAGE =
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=400&auto=format&fit=crop";

// ─── LUXURY COLOR PALETTE (NGO Side) ──────────────────────────────────────
const COLORS = {
    background: "#F8F6EE",       // Cream base
    surface: "#FFFFFF",          // Clean white
    primary: "#D9C982",          // Soft Luxury Gold
    primarySoft: "rgba(217, 201, 130, 0.2)",
    emerald: "#059669",          // Vibrant Emerald
    emeraldSoft: "rgba(5, 150, 105, 0.1)",
    buttonDark: "#433327",       // Warm Bronze (NGO Primary)
    buttonDarkSoft: "rgba(67, 51, 39, 0.08)",
    textPrimary: "#433327",      // Warm Bronze
    textSecondary: "#8C7A6B",    // Muted taupe
    border: "#E8DFD5",
    danger: "#DC2626",           // Elegant red
    dangerSoft: "rgba(220, 38, 38, 0.1)",
    white: "#FFFFFF",
};

const softShadow = {
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
};

export default function NgoImpactScreen() {
    const [fontsLoaded] = useFonts({
        Manrope_400Regular,
        Manrope_500Medium,
        Manrope_600SemiBold,
        Manrope_700Bold,
    });

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Edit modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Edit form fields
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [beneficiaries, setBeneficiaries] = useState("");
    const [goalAmount, setGoalAmount] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [status, setStatus] = useState("Active");

    // Options menu state
    const [selectedProject, setSelectedProject] = useState(null);
    const [optionsVisible, setOptionsVisible] = useState(false);
    const [deleteProject, setDeleteProject] = useState(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deletePhase, setDeletePhase] = useState("confirm");
    const [deleteError, setDeleteError] = useState("");

    // Animation references
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const barAnim = useRef(new Animated.Value(0)).current;
    const deletePulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (deletePhase !== "deleting") {
            deletePulse.stopAnimation();
            deletePulse.setValue(1);
            return undefined;
        }

        const pulse = Animated.loop(Animated.sequence([
            Animated.timing(deletePulse, { toValue: 1.14, duration: 500, useNativeDriver: true }),
            Animated.timing(deletePulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]));
        pulse.start();
        return () => pulse.stop();
    }, [deletePhase, deletePulse]);

    useEffect(() => {
        let unsubscribeProjects = null;
        let active = true;

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

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (unsubscribeProjects) {
                unsubscribeProjects();
                unsubscribeProjects = null;
            }

            if (!user) {
                setProjects([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            const projectsRef = collection(db, "projects");
            const projectsQuery = query(
                projectsRef,
                where("ngoOwnerId", "==", user.uid),
                orderBy("createdAt", "desc")
            );

            unsubscribeProjects = onSnapshot(
                projectsQuery,
                (snapshot) => {
                    if (!active) return;
                    const fetchedProjects = snapshot.docs.map((projectDoc) => ({
                        id: projectDoc.id,
                        ...projectDoc.data(),
                    }));
                    setProjects(fetchedProjects);
                    setLoading(false);
                },
                (error) => {
                    console.error("Could not load NGO projects:", error);
                    if (!active) return;
                    setProjects([]);
                    setLoading(false);
                    Alert.alert("Could not load projects", error.message);
                }
            );
        });

        return () => {
            active = false;
            unsubscribeAuth();
            if (unsubscribeProjects) unsubscribeProjects();
        };
    }, [fadeAnim, slideAnim, barAnim]);

    const handleOpenEditModal = (project) => {
        if (!project) return;
        const uid = auth.currentUser?.uid;

        if (!uid || (project.ngoOwnerId !== uid && project.ownerId !== uid)) {
            Alert.alert("Access denied", "You can only edit projects belonging to your organisation.");
            return;
        }

        setOptionsVisible(false);
        setSelectedProject(null);

        setEditingProjectId(project.id);
        setTitle(project.title || "");
        setCategory(project.category || project.cause || "");
        setBeneficiaries(String(project.beneficiariesCount ?? project.beneficiaries ?? ""));
        setGoalAmount(String(project.goalAmount ?? project.fundingGoal ?? ""));
        setImageUrl(project.imageUrl || "");
        setStatus(project.status === "Completed" ? "Completed" : "Active");

        setModalVisible(true);
    };

    const handleSaveProject = async () => {
        const user = auth.currentUser;
        if (!user) {
            Alert.alert("Sign in required", "Please sign in before editing a project.");
            return;
        }

        if (!editingProjectId) {
            Alert.alert("No project selected", "Open an existing project before saving changes.");
            return;
        }

        if (!title.trim() || !category.trim() || !beneficiaries.trim() || !goalAmount.trim()) {
            Alert.alert("Missing fields", "Please fill in the title, category, beneficiary count and funding goal.");
            return;
        }

        const beneficiaryCount = Number(beneficiaries);
        const amount = Number(goalAmount);

        if (!Number.isFinite(beneficiaryCount) || beneficiaryCount < 0 || !Number.isInteger(beneficiaryCount)) {
            Alert.alert("Invalid beneficiaries", "Enter a valid whole number for the beneficiary count.");
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            Alert.alert("Invalid funding goal", "Enter a funding goal greater than zero.");
            return;
        }

        const existingProject = projects.find((project) => project.id === editingProjectId);
        if (!existingProject || (existingProject.ngoOwnerId !== user.uid && existingProject.ownerId !== user.uid)) {
            Alert.alert("Access denied", "This project does not belong to your organisation, or it is no longer available.");
            return;
        }

        setSubmitting(true);
        try {
            const projectRef = doc(db, "projects", editingProjectId);
            await updateDoc(projectRef, {
                title: title.trim(),
                category: category.trim(),
                cause: category.trim(),
                beneficiariesCount: beneficiaryCount,
                beneficiaries: String(beneficiaryCount),
                goalAmount: amount,
                fundingGoal: amount,
                status: status,
                imageUrl: imageUrl.trim() || DEFAULT_IMAGE,
                updatedAt: serverTimestamp(),
            });

            setModalVisible(false);
            setEditingProjectId(null);
            Alert.alert("Project updated", "Your changes have been saved to the database.");
        } catch (error) {
            console.error("Project update failed:", error);
            Alert.alert("Could not update project", error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteProject = (project) => {
        setOptionsVisible(false);
        if (!project) return;

        const user = auth.currentUser;
        if (!user || (project.ngoOwnerId !== user.uid && project.ownerId !== user.uid)) {
            Alert.alert("Access denied", "You can only delete projects belonging to your organisation.");
            return;
        }

        setDeleteProject(project);
        setDeleteError("");
        setDeletePhase("confirm");
        setDeleteModalVisible(true);
    };

    const confirmDeleteProject = async () => {
        if (!deleteProject || deletePhase === "deleting") return;
        const currentUser = auth.currentUser;
        if (!currentUser || (deleteProject.ngoOwnerId !== currentUser.uid && deleteProject.ownerId !== currentUser.uid)) {
            setDeleteError("You are not allowed to delete this project.");
            return;
        }

        setDeleteError("");
        setDeletePhase("deleting");
        try {
            await deleteDoc(doc(db, "projects", deleteProject.id));
            setSelectedProject(null);
            setDeletePhase("success");
        } catch (error) {
            console.error("Project deletion failed:", error);
            setDeleteError(error.message || "Please try again.");
            setDeletePhase("error");
        }
    };

    const closeDeleteModal = () => {
        if (deletePhase === "deleting") return;
        setDeleteModalVisible(false);
        setDeleteProject(null);
        setDeleteError("");
        setDeletePhase("confirm");
    };

    const totalRaised = projects.reduce((total, project) => total + (Number(project.raisedAmount) || 0), 0);
    const totalBeneficiaries = projects.reduce((total, project) => total + (Number(project.beneficiariesCount ?? project.beneficiaries) || 0), 0);
    const totalActiveProjects = projects.filter(
        (project) => project.status !== "Completed" && project.status !== "completed" && project.status !== "closed"
    ).length;

    const SUMMARY_STATS = [
        { id: "1", label: "Raised", value: `R${totalRaised.toLocaleString("en-ZA")}`, bgColor: COLORS.primarySoft, color: COLORS.textPrimary },
        { id: "2", label: "Active", value: String(totalActiveProjects), bgColor: COLORS.emeraldSoft, color: COLORS.emerald },
        { id: "3", label: "Total Proj.", value: String(projects.length), bgColor: COLORS.surface, color: COLORS.textPrimary, border: COLORS.border },
        { id: "4", label: "Impacted", value: totalBeneficiaries.toLocaleString("en-ZA"), bgColor: COLORS.buttonDarkSoft, color: COLORS.buttonDark },
    ];

    if (!fontsLoaded) return null;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <View style={styles.container}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* HEADER */}
                    <Animated.View
                        style={[
                            styles.headerContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            },
                        ]}
                    >
                        <Text style={styles.headerTitle}>Impact Management</Text>
                        <Text style={styles.headerSubtitle}>
                            View, edit and manage your organisation's existing projects.
                        </Text>

                        {/* SUMMARY CARDS */}
                        <View style={styles.statsGrid}>
                            {SUMMARY_STATS.map((stat) => (
                                <View
                                    key={stat.id}
                                    style={[
                                        styles.statCard,
                                        { backgroundColor: stat.bgColor },
                                        stat.border && { borderWidth: 1, borderColor: stat.border }
                                    ]}
                                >
                                    <Text style={[styles.statValue, { color: stat.color }]} numberOfLines={1} adjustsFontSizeToFit>
                                        {stat.value}
                                    </Text>
                                    <Text style={styles.statLabel}>{stat.label}</Text>
                                </View>
                            ))}
                        </View>
                    </Animated.View>

                    {/* PROJECTS */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionHeaderTitle}>Your Projects</Text>
                        <Text style={styles.sectionHeaderCount}>{projects.length} Total</Text>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color={COLORS.buttonDark} style={{ marginVertical: 40 }} />
                    ) : projects.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="folder-open-outline" size={48} color={COLORS.textSecondary} style={{ marginBottom: 12 }} />
                            <Text style={styles.emptyTitle}>No Projects Found</Text>
                            <Text style={styles.emptySubText}>
                                Projects you publish from the Create a Project screen will appear here. You can then edit or delete them.
                            </Text>
                        </View>
                    ) : (
                        projects.map((project) => {
                            const goal = Number(project.goalAmount ?? project.fundingGoal ?? 0);
                            const raised = Number(project.raisedAmount || 0);
                            const beneficiaryCount = Number(project.beneficiariesCount ?? project.beneficiaries ?? 0);
                            const ratio = goal > 0 ? Math.min(Math.max(raised / goal, 0), 1) : 0;
                            const percentText = `${Math.round(ratio * 100)}%`;

                            const isCompleted = project.status === "Completed" || project.status === "completed" || project.status === "closed";
                            const displayStatus = isCompleted ? "Completed" : "Active";

                            return (
                                <View key={project.id} style={styles.projectCard}>
                                    <View style={styles.projectCardHeader}>
                                        <Image
                                            source={{ uri: project.imageUrl || DEFAULT_IMAGE }}
                                            style={styles.projectThumb}
                                        />

                                        <View style={styles.projectMeta}>
                                            <View style={styles.projectTitleRow}>
                                                <Text style={styles.projectTitle} numberOfLines={2}>
                                                    {project.title || "Untitled project"}
                                                </Text>

                                                <View style={styles.statusAndMenuRow}>
                                                    <View style={[styles.statusBadge, isCompleted ? styles.statusBadgeCompleted : styles.statusBadgeActive]}>
                                                        <Text style={[styles.statusBadgeText, isCompleted ? styles.statusTextCompleted : styles.statusTextActive]}>
                                                            {displayStatus}
                                                        </Text>
                                                    </View>

                                                    <TouchableOpacity
                                                        style={styles.moreButton}
                                                        accessibilityLabel={`Manage ${project.title}`}
                                                        onPress={() => {
                                                            setSelectedProject(project);
                                                            setOptionsVisible(true);
                                                        }}
                                                    >
                                                        <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textSecondary} />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>

                                            <Text style={styles.projectCategory}>
                                                {project.category || project.cause || "General"}
                                            </Text>

                                            <View style={styles.beneficiaryRow}>
                                                <Ionicons name="people" size={14} color={COLORS.emerald} />
                                                <Text style={styles.projectBeneficiaries}>
                                                    {beneficiaryCount} Targeted
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* FUNDING PROGRESS */}
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
                                        <Text style={styles.raisedText}>
                                            R{raised.toLocaleString("en-ZA")} raised
                                        </Text>
                                        <Text style={styles.goalText}>
                                            {percentText} of R{goal.toLocaleString("en-ZA")}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </ScrollView>

                {/* EDIT EXISTING PROJECT MODAL */}
                <Modal
                    visible={modalVisible}
                    animationType="slide"
                    transparent
                    onRequestClose={() => {
                        if (!submitting) setModalVisible(false);
                    }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Edit Project</Text>
                            <Text style={styles.modalSubtitle}>
                                Update the details of this existing project. Your changes will be saved to Firestore.
                            </Text>

                            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                                <Text style={styles.inputLabel}>Project Title *</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="e.g. Mobile Science Lab Kit Drive"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={title}
                                    onChangeText={setTitle}
                                />

                                <Text style={styles.inputLabel}>Category *</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="e.g. Education, Health, Environment"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={category}
                                    onChangeText={setCategory}
                                />

                                <Text style={styles.inputLabel}>Target Beneficiaries Count *</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="e.g. 150"
                                    placeholderTextColor={COLORS.textSecondary}
                                    keyboardType="numeric"
                                    value={beneficiaries}
                                    onChangeText={setBeneficiaries}
                                />

                                <Text style={styles.inputLabel}>Funding Goal (ZAR R) *</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="e.g. 250000"
                                    placeholderTextColor={COLORS.textSecondary}
                                    keyboardType="decimal-pad"
                                    value={goalAmount}
                                    onChangeText={setGoalAmount}
                                />

                                <Text style={styles.inputLabel}>Cover Image URL (Optional)</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="https://..."
                                    placeholderTextColor={COLORS.textSecondary}
                                    autoCapitalize="none"
                                    value={imageUrl}
                                    onChangeText={setImageUrl}
                                />

                                <Text style={styles.inputLabel}>Status</Text>
                                <View style={styles.statusToggleRow}>
                                    <TouchableOpacity
                                        style={[styles.statusOption, status === "Active" && styles.statusOptionActive]}
                                        onPress={() => setStatus("Active")}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.statusOptionText, status === "Active" && styles.statusOptionTextSelected]}>
                                            Active
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.statusOption, status === "Completed" && styles.statusOptionCompleted]}
                                        onPress={() => setStatus("Completed")}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.statusOptionText, status === "Completed" && styles.statusOptionTextCompleted]}>
                                            Completed
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={styles.cancelButton} disabled={submitting} onPress={() => setModalVisible(false)}>
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={[styles.submitButton, submitting && styles.submitButtonDisabled]} onPress={handleSaveProject} disabled={submitting}>
                                        {submitting ? (
                                            <ActivityIndicator color={COLORS.white} size="small" />
                                        ) : (
                                            <Text style={styles.submitButtonText}>Save Changes</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* EDIT / DELETE OPTIONS BOTTOM SHEET */}
                <Modal visible={optionsVisible} animationType="fade" transparent onRequestClose={() => setOptionsVisible(false)}>
                    <TouchableOpacity style={styles.optionsOverlay} activeOpacity={1} onPress={() => setOptionsVisible(false)}>
                        <View style={styles.optionsSheet}>
                            <Text style={styles.optionsHeader}>{selectedProject?.title || "Manage Project"}</Text>

                            <TouchableOpacity style={styles.optionItem} onPress={() => handleOpenEditModal(selectedProject)}>
                                <Ionicons name="pencil" size={20} color={COLORS.buttonDark} style={{ marginRight: 12 }} />
                                <Text style={styles.optionText}>Edit Project Details</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.optionItem, styles.optionItemDelete]} onPress={() => handleDeleteProject(selectedProject)}>
                                <Ionicons name="trash" size={20} color={COLORS.danger} style={{ marginRight: 12 }} />
                                <Text style={styles.optionTextDelete}>Delete Project</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.cancelOptionItem} onPress={() => setOptionsVisible(false)}>
                                <Text style={styles.cancelOptionText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>

                <Modal visible={deleteModalVisible} animationType="fade" transparent onRequestClose={closeDeleteModal}>
                    <View style={styles.deleteOverlay}>
                        <View style={styles.deleteDialog}>
                            {deletePhase === "confirm" && (
                                <>
                                    <View style={styles.deleteIconWrap}>
                                        <Ionicons name="trash-outline" size={28} color={COLORS.danger} />
                                    </View>
                                    <Text style={styles.deleteTitle}>Delete this project?</Text>
                                    <Text style={styles.deleteMessage}>
                                        Are you sure you want to delete “{deleteProject?.title || "this project"}”? This action cannot be undone.
                                    </Text>
                                    {deleteError ? <Text style={styles.deleteError}>{deleteError}</Text> : null}
                                    <View style={styles.deleteActions}>
                                        <TouchableOpacity style={styles.deleteNoButton} onPress={closeDeleteModal}>
                                            <Text style={styles.deleteNoText}>No, keep it</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.deleteYesButton} onPress={confirmDeleteProject}>
                                            <Text style={styles.deleteYesText}>Yes, delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                            {deletePhase === "deleting" && (
                                <>
                                    <Animated.View style={[styles.deleteIconWrap, styles.deleteProgressIcon, { transform: [{ scale: deletePulse }] }]}>
                                        <Ionicons name="trash" size={28} color={COLORS.danger} />
                                    </Animated.View>
                                    <ActivityIndicator size="small" color={COLORS.danger} style={styles.deleteSpinner} />
                                    <Text style={styles.deleteTitle}>Deleting project</Text>
                                    <Text style={styles.deleteMessage}>“{deleteProject?.title || "Your project"}” is being deleted…</Text>
                                </>
                            )}
                            {deletePhase === "success" && (
                                <>
                                    <View style={[styles.deleteIconWrap, styles.deleteSuccessIcon]}>
                                        <Ionicons name="checkmark" size={30} color={COLORS.emerald} />
                                    </View>
                                    <Text style={styles.deleteTitle}>Project deleted</Text>
                                    <Text style={styles.deleteMessage}>“{deleteProject?.title || "Your project"}” has been successfully deleted.</Text>
                                    <TouchableOpacity style={styles.deleteDoneButton} onPress={closeDeleteModal}>
                                        <Text style={styles.deleteYesText}>Done</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                            {deletePhase === "error" && (
                                <>
                                    <View style={styles.deleteIconWrap}>
                                        <Ionicons name="alert-circle-outline" size={30} color={COLORS.danger} />
                                    </View>
                                    <Text style={styles.deleteTitle}>Could not delete project</Text>
                                    <Text style={styles.deleteMessage}>{deleteError}</Text>
                                    <View style={styles.deleteActions}>
                                        <TouchableOpacity style={styles.deleteNoButton} onPress={closeDeleteModal}>
                                            <Text style={styles.deleteNoText}>Close</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.deleteYesButton} onPress={() => { setDeleteError(""); setDeletePhase("confirm"); }}>
                                            <Text style={styles.deleteYesText}>Try again</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                </Modal>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 112 },

    headerContainer: { marginBottom: 24 },
    headerTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
    headerTitle: { fontFamily: "Manrope_700Bold", fontSize: 28, color: COLORS.textPrimary, letterSpacing: -0.5 },
    headerSubtitle: { fontFamily: "Manrope_500Medium", fontSize: 14, color: COLORS.textSecondary, marginBottom: 24 },

    statsGrid: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
    statCard: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: "center", ...softShadow },
    statValue: { fontFamily: "Manrope_700Bold", fontSize: 16 },
    statLabel: { fontFamily: "Manrope_600SemiBold", fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },

    sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, marginBottom: 16 },
    sectionHeaderTitle: { fontFamily: "Manrope_700Bold", fontSize: 18, color: COLORS.textPrimary },
    sectionHeaderCount: { fontFamily: "Manrope_600SemiBold", fontSize: 13, color: COLORS.textSecondary },

    projectCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border, ...softShadow },
    projectCardHeader: { flexDirection: "row" },
    projectThumb: { width: 64, height: 64, borderRadius: 16, marginRight: 16, backgroundColor: COLORS.background },
    projectMeta: { flex: 1 },
    projectTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    projectTitle: { fontFamily: "Manrope_700Bold", fontSize: 15, color: COLORS.textPrimary, flex: 1, paddingTop: 2 },
    
    statusAndMenuRow: { flexDirection: "row", alignItems: "center" },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
    statusBadgeActive: { backgroundColor: COLORS.primarySoft },
    statusBadgeCompleted: { backgroundColor: COLORS.emeraldSoft },
    statusBadgeText: { fontFamily: "Manrope_700Bold", fontSize: 10, textTransform: "uppercase" },
    statusTextActive: { color: COLORS.buttonDark },
    statusTextCompleted: { color: COLORS.emerald },
    moreButton: { paddingHorizontal: 4, marginLeft: 4 },
    
    projectCategory: { fontFamily: "Manrope_500Medium", fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
    beneficiaryRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4 },
    projectBeneficiaries: { fontFamily: "Manrope_600SemiBold", fontSize: 12, color: COLORS.emerald },

    progressBarTrack: { height: 8, backgroundColor: COLORS.background, borderRadius: 4, marginTop: 16, overflow: "hidden" },
    progressBarFill: { height: "100%", backgroundColor: COLORS.emerald },
    progressValueRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
    raisedText: { fontFamily: "Manrope_700Bold", fontSize: 12, color: COLORS.emerald },
    goalText: { fontFamily: "Manrope_600SemiBold", fontSize: 12, color: COLORS.textSecondary },

    emptyContainer: { backgroundColor: COLORS.surface, padding: 32, borderRadius: 20, alignItems: "center", borderWidth: 1, borderColor: COLORS.border, marginTop: 12 },
    emptyTitle: { fontFamily: "Manrope_700Bold", fontSize: 18, color: COLORS.textPrimary },
    emptySubText: { fontFamily: "Manrope_500Medium", fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 22 },

    /* Edit Modal */
    modalOverlay: { flex: 1, backgroundColor: "rgba(67, 51, 39, 0.4)", justifyContent: "center", padding: 16 },
    modalContent: { backgroundColor: COLORS.surface, borderRadius: 24, padding: 24, maxHeight: "90%", ...softShadow },
    modalTitle: { fontFamily: "Manrope_700Bold", fontSize: 20, color: COLORS.textPrimary },
    modalSubtitle: { fontFamily: "Manrope_500Medium", fontSize: 13, color: COLORS.textSecondary, marginBottom: 20, marginTop: 4, lineHeight: 20 },
    inputLabel: { fontFamily: "Manrope_600SemiBold", fontSize: 13, color: COLORS.textPrimary, marginTop: 12, marginBottom: 6 },
    textInput: { fontFamily: "Manrope_500Medium", borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, backgroundColor: COLORS.background, color: COLORS.textPrimary },
    
    statusToggleRow: { flexDirection: "row", gap: 12, marginTop: 8 },
    statusOption: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" },
    statusOptionActive: { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary },
    statusOptionCompleted: { backgroundColor: COLORS.emeraldSoft, borderColor: COLORS.emerald },
    statusOptionText: { fontFamily: "Manrope_600SemiBold", fontSize: 13, color: COLORS.textSecondary },
    statusOptionTextSelected: { color: COLORS.buttonDark, fontFamily: "Manrope_700Bold" },
    statusOptionTextCompleted: { color: COLORS.emerald, fontFamily: "Manrope_700Bold" },

    modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 28, gap: 12 },
    cancelButton: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 30, backgroundColor: COLORS.background },
    cancelButtonText: { fontFamily: "Manrope_700Bold", color: COLORS.textSecondary, fontSize: 14 },
    submitButton: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 30, backgroundColor: COLORS.buttonDark, minWidth: 120, alignItems: "center", justifyContent: "center" },
    submitButtonDisabled: { opacity: 0.65 },
    submitButtonText: { fontFamily: "Manrope_700Bold", color: COLORS.white, fontSize: 14 },

    /* Options Sheet */
    optionsOverlay: { flex: 1, backgroundColor: "rgba(67, 51, 39, 0.4)", justifyContent: "flex-end" },
    optionsSheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24 },
    optionsHeader: { fontFamily: "Manrope_700Bold", fontSize: 16, color: COLORS.textPrimary, marginBottom: 20, textAlign: "center" },
    optionItem: { flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.background },
    optionText: { fontFamily: "Manrope_600SemiBold", fontSize: 15, color: COLORS.textPrimary },
    optionItemDelete: { borderBottomWidth: 0 },
    optionTextDelete: { fontFamily: "Manrope_600SemiBold", fontSize: 15, color: COLORS.danger },
    cancelOptionItem: { marginTop: 16, paddingVertical: 16, backgroundColor: COLORS.background, borderRadius: 16, alignItems: "center" },
    cancelOptionText: { fontFamily: "Manrope_700Bold", fontSize: 15, color: COLORS.textSecondary },

    /* Delete confirmation and progress modal */
    deleteOverlay: { flex: 1, backgroundColor: "rgba(67, 51, 39, 0.48)", justifyContent: "center", alignItems: "center", padding: 24 },
    deleteDialog: { width: "100%", maxWidth: 420, backgroundColor: COLORS.surface, borderRadius: 24, padding: 24, alignItems: "center", ...softShadow },
    deleteIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.dangerSoft, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    deleteProgressIcon: { backgroundColor: COLORS.dangerSoft },
    deleteSuccessIcon: { backgroundColor: COLORS.emeraldSoft },
    deleteSpinner: { marginTop: -8, marginBottom: 12 },
    deleteTitle: { fontFamily: "Manrope_700Bold", fontSize: 19, color: COLORS.textPrimary, textAlign: "center" },
    deleteMessage: { fontFamily: "Manrope_500Medium", fontSize: 14, lineHeight: 21, color: COLORS.textSecondary, textAlign: "center", marginTop: 8 },
    deleteError: { fontFamily: "Manrope_600SemiBold", fontSize: 13, color: COLORS.danger, textAlign: "center", marginTop: 12 },
    deleteActions: { flexDirection: "row", width: "100%", gap: 12, marginTop: 24 },
    deleteNoButton: { flex: 1, paddingVertical: 14, borderRadius: 24, backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center" },
    deleteNoText: { fontFamily: "Manrope_700Bold", fontSize: 14, color: COLORS.textSecondary },
    deleteYesButton: { flex: 1, paddingVertical: 14, borderRadius: 24, backgroundColor: COLORS.danger, alignItems: "center", justifyContent: "center" },
    deleteYesText: { fontFamily: "Manrope_700Bold", fontSize: 14, color: COLORS.white },
    deleteDoneButton: { width: "100%", paddingVertical: 14, borderRadius: 24, backgroundColor: COLORS.buttonDark, alignItems: "center", justifyContent: "center", marginTop: 24 },
});
