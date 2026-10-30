import React, { useEffect, useState, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
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
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const { width } = Dimensions.get("window");

const DEFAULT_IMAGE =
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=400&auto=format&fit=crop";

// ─── BLUE THEMED PALETTE (NGO Impact Screen) ─────────────────────────────
const COLORS = {
    background: "#E8F1FC",       // Distinct, elegant blue base
    surface: "#FFFFFF",          // Crisp white
    primary: "#2563EB",          // Vibrant Blue
    primarySoft: "rgba(37, 99, 235, 0.12)",
    emerald: "#059669",          // Vibrant Emerald
    emeraldSoft: "rgba(5, 150, 105, 0.1)",
    buttonDark: "#1E40AF",       // Dark Blue (NGO Primary)
    buttonDarkSoft: "rgba(30, 64, 175, 0.08)",
    textPrimary: "#1E293B",      // Slate navy
    textSecondary: "#64748B",    // Slate taupe
    border: "#BFDBFE",           // Sky blue border
    danger: "#DC2626",           // Elegant red
    dangerSoft: "rgba(220, 38, 38, 0.1)",
    white: "#FFFFFF",
};

const softShadow = {
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
};

export default function NgoImpactScreen({ navigation }) {
    const [fontsLoaded] = useFonts({
        Manrope_400Regular,
        Manrope_500Medium,
        Manrope_600SemiBold,
        Manrope_700Bold,
    });

    const [projects, setProjects] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentsLoading, setPaymentsLoading] = useState(true);

    // Update modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Update form fields
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
        let unsubscribeProjects = [];
        let unsubscribePayments = () => {};
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
            unsubscribeProjects.forEach((unsubscribe) => unsubscribe());
            unsubscribeProjects = [];
            unsubscribePayments();

            if (!user) {
                setProjects([]);
                setPayments([]);
                setLoading(false);
                setPaymentsLoading(false);
                return;
            }

            setLoading(true);
            setPaymentsLoading(true);
            setProjects([]);
            const projectResults = new Map([
                ["ngoOwnerId", new Map()],
                ["ownerId", new Map()],
            ]);
            let receivedFirstSnapshot = false;
            const publishProjects = () => {
                if (!active) return;
                const mergedProjects = new Map();
                projectResults.forEach((fieldProjects) => {
                    fieldProjects.forEach((project, projectId) => mergedProjects.set(projectId, project));
                });
                const fetchedProjects = [...mergedProjects.values()].sort((left, right) => {
                    const leftCreated = left.createdAt?.toMillis?.() ?? 0;
                    const rightCreated = right.createdAt?.toMillis?.() ?? 0;
                    return rightCreated - leftCreated;
                });
                setProjects(fetchedProjects);
                setLoading(false);
            };

            // Listen to projects belonging to this NGO
            ["ngoOwnerId", "ownerId"].forEach((ownerField) => {
                const projectsQuery = query(
                    collection(db, "projects"),
                    where(ownerField, "==", user.uid)
                );
                const unsubscribe = onSnapshot(
                    projectsQuery,
                    (snapshot) => {
                        if (!active) return;
                        const fieldProjects = projectResults.get(ownerField);
                        fieldProjects.clear();
                        snapshot.docs.forEach((projectDoc) => {
                            fieldProjects.set(projectDoc.id, {
                                id: projectDoc.id,
                                ...projectDoc.data(),
                            });
                        });
                        receivedFirstSnapshot = true;
                        publishProjects();
                    },
                    (error) => {
                        console.error(`Could not load NGO projects by ${ownerField}:`, error);
                        if (!active) return;
                        if (receivedFirstSnapshot) publishProjects();
                        else setLoading(false);
                    }
                );
                unsubscribeProjects.push(unsubscribe);
            });

            // Listen to real-time payments received from sponsors for this NGO
            const paymentsQuery = query(
                collection(db, "payments"),
                where("ngoId", "==", user.uid)
            );
            unsubscribePayments = onSnapshot(
                paymentsQuery,
                (snapshot) => {
                    if (!active) return;
                    const list = snapshot.docs.map((docSnap) => ({
                        id: docSnap.id,
                        ...docSnap.data(),
                    }));
                    list.sort((a, b) => (b.paidAt?.toMillis?.() || 0) - (a.paidAt?.toMillis?.() || 0));
                    setPayments(list);
                    setPaymentsLoading(false);
                },
                (error) => {
                    console.warn("Could not load NGO payments:", error?.message);
                    if (active) setPaymentsLoading(false);
                }
            );
        });

        return () => {
            active = false;
            unsubscribeAuth();
            unsubscribeProjects.forEach((unsubscribe) => unsubscribe());
            unsubscribePayments();
        };
    }, [fadeAnim, slideAnim, barAnim]);

    const handleOpenEditModal = (project) => {
        if (!project) return;
        const uid = auth.currentUser?.uid;

        if (!uid || (project.ngoOwnerId !== uid && project.ownerId !== uid)) {
            Alert.alert("Access denied", "You can only update projects belonging to your organisation.");
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
            Alert.alert("Sign in required", "Please sign in before updating a project.");
            return;
        }

        if (!editingProjectId) {
            Alert.alert("No project selected", "Open an existing project before updating changes.");
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
            Alert.alert("Project updated", "Your updates have been saved to the database.");
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
    const totalPaymentsReceived = payments
        .filter((p) => p.status === "complete")
        .reduce((sum, p) => sum + (Number(p.sponsorshipAmount) || 0), 0);
    const displayTotalRaised = Math.max(totalRaised, totalPaymentsReceived);

    const totalBeneficiaries = projects.reduce((total, project) => total + (Number(project.beneficiariesCount ?? project.beneficiaries) || 0), 0);
    const totalActiveProjects = projects.filter((project) =>
        !["completed", "closed"].includes(String(project.status || "").toLowerCase())
    ).length;

    const SUMMARY_STATS = [
        { id: "1", label: "Raised", value: `R${displayTotalRaised.toLocaleString("en-ZA")}`, bgColor: COLORS.primarySoft, color: COLORS.primary },
        { id: "2", label: "Active", value: String(totalActiveProjects), bgColor: COLORS.emeraldSoft, color: COLORS.emerald },
        { id: "3", label: "Total Proj.", value: String(projects.length), bgColor: COLORS.surface, color: COLORS.textPrimary, border: COLORS.border },
        { id: "4", label: "Payments", value: String(payments.length), bgColor: COLORS.buttonDarkSoft, color: COLORS.buttonDark },
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
                            View, update and manage your organisation's projects and sponsor funding.
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

                    {/* PROJECTS SECTION */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionHeaderTitle}>Your Projects</Text>
                        <Text style={styles.sectionHeaderCount}>{projects.length} Total</Text>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 40 }} />
                    ) : projects.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="folder-open-outline" size={48} color={COLORS.textSecondary} style={{ marginBottom: 12 }} />
                            <Text style={styles.emptyTitle}>No Projects Found</Text>
                            <Text style={styles.emptySubText}>
                                Projects you publish from the Create a Project screen will appear here. You can then update or manage them.
                            </Text>
                        </View>
                    ) : (
                        projects.map((project) => {
                            const goal = Number(project.goalAmount ?? project.fundingGoal ?? 0);
                            const raised = Number(project.raisedAmount || 0);
                            const beneficiaryCount = Number(project.beneficiariesCount ?? project.beneficiaries ?? 0);
                            const ratio = goal > 0 ? Math.min(Math.max(raised / goal, 0), 1) : 0;
                            const percentText = `${Math.round(ratio * 100)}%`;

                            const projectStatus = String(project.status || "active").toLowerCase();
                            const isCompleted = ["completed", "closed"].includes(projectStatus);
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

                                    <TouchableOpacity
                                        accessibilityRole="button"
                                        onPress={() => navigation.navigate("NGOProjectDetail", { projectId: project.id })}
                                        style={{ alignSelf: "flex-start", paddingTop: 12 }}
                                    >
                                        <Text style={styles.projectBeneficiaries}>View project updates</Text>
                                    </TouchableOpacity>

                                    {/* ACTION BUTTONS: ARCHIVE REMOVED, EDIT REPLACED WITH UPDATE */}
                                    <View style={styles.projectActions}>
                                        <TouchableOpacity
                                            style={styles.projectActionButton}
                                            onPress={() => handleOpenEditModal(project)}
                                            accessibilityRole="button"
                                            accessibilityLabel={`Update ${project.title || "project"}`}
                                        >
                                            <Text style={styles.projectActionText}>Update</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.projectActionButton, styles.deleteActionButton]}
                                            onPress={() => handleDeleteProject(project)}
                                            accessibilityRole="button"
                                            accessibilityLabel={`Delete ${project.title || "project"}`}
                                        >
                                            <Text style={styles.deleteActionText}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })
                    )}

                    {/* SPONSORSHIP PAYMENTS RECEIVED SECTION */}
                    <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
                        <Text style={styles.sectionHeaderTitle}>Sponsorship Payments</Text>
                        <Text style={styles.sectionHeaderCount}>{payments.length} Received</Text>
                    </View>

                    {paymentsLoading ? (
                        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 18 }} />
                    ) : payments.length === 0 ? (
                        <View style={styles.paymentEmptyCard}>
                            <Ionicons name="card-outline" size={32} color={COLORS.textSecondary} style={{ marginBottom: 6 }} />
                            <Text style={styles.paymentEmptyTitle}>No Payments Received Yet</Text>
                            <Text style={styles.paymentEmptySub}>
                                When sponsors contribute through the payment API, confirmed sponsorships will appear here in real time.
                            </Text>
                        </View>
                    ) : (
                        payments.map((pmt) => {
                            const paidDate = pmt.paidAt?.toDate?.()
                                ? pmt.paidAt.toDate().toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
                                : "Recently confirmed";
                            return (
                                <View key={pmt.id} style={styles.paymentCard}>
                                    <View style={styles.paymentCardHeader}>
                                        <View style={styles.paymentIconWrap}>
                                            <Ionicons name="cash" size={20} color={COLORS.emerald} />
                                        </View>
                                        <View style={styles.paymentMeta}>
                                            <Text style={styles.paymentProjectTitle} numberOfLines={1}>
                                                {pmt.projectTitle || "Project sponsorship"}
                                            </Text>
                                            <Text style={styles.paymentSponsorName}>
                                                From {pmt.sponsorName || "Sponsor"}
                                            </Text>
                                        </View>
                                        <View style={styles.paymentAmountCol}>
                                            <Text style={styles.paymentAmount}>
                                                +R{Number(pmt.sponsorshipAmount || 0).toLocaleString("en-ZA")}
                                            </Text>
                                            <View style={styles.paymentVerifiedBadge}>
                                                <Text style={styles.paymentVerifiedText}>PayFast API</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.paymentCardFooter}>
                                        <Text style={styles.paymentDate}>{paidDate}</Text>
                                        <Text style={styles.paymentRef}>
                                            Ref: {pmt.transactionReference || pmt.paymentId || pmt.id}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </ScrollView>

                {/* UPDATE EXISTING PROJECT MODAL (REPLACED EDIT WITH UPDATE) */}
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
                            <Text style={styles.modalTitle}>Update Project</Text>
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
                                            <Text style={styles.submitButtonText}>Update Project</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* UPDATE / DELETE OPTIONS BOTTOM SHEET */}
                <Modal visible={optionsVisible} animationType="fade" transparent onRequestClose={() => setOptionsVisible(false)}>
                    <TouchableOpacity style={styles.optionsOverlay} activeOpacity={1} onPress={() => setOptionsVisible(false)}>
                        <View style={styles.optionsSheet}>
                            <Text style={styles.optionsHeader}>{selectedProject?.title || "Manage Project"}</Text>

                            <TouchableOpacity style={styles.optionItem} onPress={() => handleOpenEditModal(selectedProject)}>
                                <Ionicons name="pencil" size={20} color={COLORS.buttonDark} style={{ marginRight: 12 }} />
                                <Text style={styles.optionText}>Update Project Details</Text>
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
    scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 112 },

    headerContainer: { marginBottom: 20 },
    headerTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
    headerTitle: { fontFamily: "Manrope_700Bold", fontSize: 28, color: COLORS.textPrimary, letterSpacing: -0.5 },
    headerSubtitle: { fontFamily: "Manrope_500Medium", fontSize: 14, color: COLORS.textSecondary, marginBottom: 20 },

    statsGrid: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
    statCard: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: "center", ...softShadow },
    statValue: { fontFamily: "Manrope_700Bold", fontSize: 16 },
    statLabel: { fontFamily: "Manrope_600SemiBold", fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },

    sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, marginBottom: 14 },
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
    statusTextActive: { color: COLORS.primary },
    statusTextCompleted: { color: COLORS.emerald },
    
    projectCategory: { fontFamily: "Manrope_500Medium", fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
    beneficiaryRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4 },
    projectBeneficiaries: { fontFamily: "Manrope_600SemiBold", fontSize: 12, color: COLORS.primary },

    progressBarTrack: { height: 8, backgroundColor: "#DBEAFE", borderRadius: 4, marginTop: 16, overflow: "hidden" },
    progressBarFill: { height: "100%", backgroundColor: COLORS.primary },
    progressValueRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
    raisedText: { fontFamily: "Manrope_700Bold", fontSize: 12, color: COLORS.primary },
    goalText: { fontFamily: "Manrope_600SemiBold", fontSize: 12, color: COLORS.textSecondary },
    
    projectActions: { flexDirection: "row", gap: 10, marginTop: 14 },
    projectActionButton: { flex: 1, height: 42, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
    projectActionText: { fontFamily: "Manrope_700Bold", fontSize: 12, color: COLORS.buttonDark },
    deleteActionButton: { borderColor: COLORS.dangerSoft, backgroundColor: COLORS.dangerSoft },
    deleteActionText: { fontFamily: "Manrope_700Bold", fontSize: 12, color: COLORS.danger },

    emptyContainer: { backgroundColor: COLORS.surface, padding: 32, borderRadius: 20, alignItems: "center", borderWidth: 1, borderColor: COLORS.border, marginTop: 12 },
    emptyTitle: { fontFamily: "Manrope_700Bold", fontSize: 18, color: COLORS.textPrimary },
    emptySubText: { fontFamily: "Manrope_500Medium", fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 22 },

    /* Received Payments Card & Section */
    paymentCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, ...softShadow },
    paymentCardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
    paymentIconWrap: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.emeraldSoft, alignItems: "center", justifyContent: "center" },
    paymentMeta: { flex: 1 },
    paymentProjectTitle: { fontFamily: "Manrope_700Bold", fontSize: 14, color: COLORS.textPrimary },
    paymentSponsorName: { fontFamily: "Manrope_500Medium", fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    paymentAmountCol: { alignItems: "flex-end" },
    paymentAmount: { fontFamily: "Manrope_700Bold", fontSize: 15, color: COLORS.emerald },
    paymentVerifiedBadge: { backgroundColor: COLORS.primarySoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 3 },
    paymentVerifiedText: { fontFamily: "Manrope_700Bold", fontSize: 9, color: COLORS.primary },
    paymentCardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#EFF6FF" },
    paymentDate: { fontFamily: "Manrope_500Medium", fontSize: 11, color: COLORS.textSecondary },
    paymentRef: { fontFamily: "Manrope_500Medium", fontSize: 11, color: COLORS.textSecondary, opacity: 0.8 },
    paymentEmptyCard: { backgroundColor: COLORS.surface, padding: 24, borderRadius: 16, alignItems: "center", borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
    paymentEmptyTitle: { fontFamily: "Manrope_700Bold", fontSize: 15, color: COLORS.textPrimary },
    paymentEmptySub: { fontFamily: "Manrope_500Medium", fontSize: 12, color: COLORS.textSecondary, textAlign: "center", marginTop: 4, lineHeight: 18 },

    /* Update Modal */
    modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.45)", justifyContent: "center", padding: 16 },
    modalContent: { backgroundColor: COLORS.surface, borderRadius: 24, padding: 24, maxHeight: "90%", ...softShadow },
    modalTitle: { fontFamily: "Manrope_700Bold", fontSize: 20, color: COLORS.textPrimary },
    modalSubtitle: { fontFamily: "Manrope_500Medium", fontSize: 13, color: COLORS.textSecondary, marginBottom: 20, marginTop: 4, lineHeight: 20 },
    inputLabel: { fontFamily: "Manrope_600SemiBold", fontSize: 13, color: COLORS.textPrimary, marginTop: 12, marginBottom: 6 },
    textInput: { fontFamily: "Manrope_500Medium", borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, backgroundColor: "#F8FAFC", color: COLORS.textPrimary },
    
    statusToggleRow: { flexDirection: "row", gap: 12, marginTop: 8 },
    statusOption: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" },
    statusOptionActive: { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary },
    statusOptionCompleted: { backgroundColor: COLORS.emeraldSoft, borderColor: COLORS.emerald },
    statusOptionText: { fontFamily: "Manrope_600SemiBold", fontSize: 13, color: COLORS.textSecondary },
    statusOptionTextSelected: { color: COLORS.primary, fontFamily: "Manrope_700Bold" },
    statusOptionTextCompleted: { color: COLORS.emerald, fontFamily: "Manrope_700Bold" },

    modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 28, gap: 12 },
    cancelButton: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 30, backgroundColor: "#EFF6FF" },
    cancelButtonText: { fontFamily: "Manrope_700Bold", color: COLORS.textSecondary, fontSize: 14 },
    submitButton: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 30, backgroundColor: COLORS.buttonDark, minWidth: 120, alignItems: "center", justifyContent: "center" },
    submitButtonDisabled: { opacity: 0.65 },
    submitButtonText: { fontFamily: "Manrope_700Bold", color: COLORS.white, fontSize: 14 },

    /* Options Sheet */
    optionsOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.45)", justifyContent: "flex-end" },
    optionsSheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24 },
    optionsHeader: { fontFamily: "Manrope_700Bold", fontSize: 16, color: COLORS.textPrimary, marginBottom: 20, textAlign: "center" },
    optionItem: { flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#EFF6FF" },
    optionText: { fontFamily: "Manrope_600SemiBold", fontSize: 15, color: COLORS.textPrimary },
    optionItemDelete: { borderBottomWidth: 0 },
    optionTextDelete: { fontFamily: "Manrope_600SemiBold", fontSize: 15, color: COLORS.danger },
    cancelOptionItem: { marginTop: 16, paddingVertical: 16, backgroundColor: "#EFF6FF", borderRadius: 16, alignItems: "center" },
    cancelOptionText: { fontFamily: "Manrope_700Bold", fontSize: 15, color: COLORS.textSecondary },

    /* Delete confirmation and progress modal */
    deleteOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.48)", justifyContent: "center", alignItems: "center", padding: 24 },
    deleteDialog: { width: "100%", maxWidth: 420, backgroundColor: COLORS.surface, borderRadius: 24, padding: 24, alignItems: "center", ...softShadow },
    deleteIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.dangerSoft, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    deleteProgressIcon: { backgroundColor: COLORS.dangerSoft },
    deleteSuccessIcon: { backgroundColor: COLORS.emeraldSoft },
    deleteSpinner: { marginTop: -8, marginBottom: 12 },
    deleteTitle: { fontFamily: "Manrope_700Bold", fontSize: 19, color: COLORS.textPrimary, textAlign: "center" },
    deleteMessage: { fontFamily: "Manrope_500Medium", fontSize: 14, lineHeight: 21, color: COLORS.textSecondary, textAlign: "center", marginTop: 8 },
    deleteError: { fontFamily: "Manrope_600SemiBold", fontSize: 13, color: COLORS.danger, textAlign: "center", marginTop: 12 },
    deleteActions: { flexDirection: "row", width: "100%", gap: 12, marginTop: 24 },
    deleteNoButton: { flex: 1, paddingVertical: 14, borderRadius: 24, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
    deleteNoText: { fontFamily: "Manrope_700Bold", fontSize: 14, color: COLORS.textSecondary },
    deleteYesButton: { flex: 1, paddingVertical: 14, borderRadius: 24, backgroundColor: COLORS.danger, alignItems: "center", justifyContent: "center" },
    deleteYesText: { fontFamily: "Manrope_700Bold", fontSize: 14, color: COLORS.white },
    deleteDoneButton: { width: "100%", paddingVertical: 14, borderRadius: 24, backgroundColor: COLORS.buttonDark, alignItems: "center", justifyContent: "center", marginTop: 24 },
});
