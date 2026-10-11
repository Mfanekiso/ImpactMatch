
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

export default function NgoImpactScreen() {
    // Existing projects loaded from Firestore
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

    // Animation references
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const barAnim = useRef(new Animated.Value(0)).current;

    // --------------------------------------------------
    // FIRESTORE: LOAD ONLY THE SIGNED-IN NGO'S PROJECTS
    // --------------------------------------------------
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

                    const fetchedProjects = snapshot.docs.map(
                        (projectDoc) => ({
                            id: projectDoc.id,
                            ...projectDoc.data(),
                        })
                    );

                    setProjects(fetchedProjects);
                    setLoading(false);
                },
                (error) => {
                    console.error(
                        "Could not load NGO projects:",
                        error
                    );

                    if (!active) return;

                    setProjects([]);
                    setLoading(false);

                    Alert.alert(
                        "Could not load projects",
                        error.message ||
                            "Please check your connection and Firestore permissions."
                    );
                }
            );
        });

        return () => {
            active = false;
            unsubscribeAuth();

            if (unsubscribeProjects) {
                unsubscribeProjects();
            }
        };
    }, [fadeAnim, slideAnim, barAnim]);

    // --------------------------------------------------
    // OPEN EDIT MODAL FOR AN EXISTING PROJECT
    // --------------------------------------------------
    const handleOpenEditModal = (project) => {
        if (!project) return;

        const uid = auth.currentUser?.uid;

        if (
            !uid ||
            (project.ngoOwnerId !== uid && project.ownerId !== uid)
        ) {
            Alert.alert(
                "Access denied",
                "You can only edit projects belonging to your organisation."
            );
            return;
        }

        setOptionsVisible(false);
        setSelectedProject(null);

        setEditingProjectId(project.id);
        setTitle(project.title || "");
        setCategory(project.category || project.cause || "");
        setBeneficiaries(
            String(
                project.beneficiariesCount ??
                    project.beneficiaries ??
                    ""
            )
        );
        setGoalAmount(
            String(project.goalAmount ?? project.fundingGoal ?? "")
        );
        setImageUrl(project.imageUrl || "");
        setStatus(
            project.status === "Completed" ? "Completed" : "Active"
        );

        setModalVisible(true);
    };

    // --------------------------------------------------
    // SAVE CHANGES TO AN EXISTING FIRESTORE DOCUMENT
    // This screen does not create new projects.
    // --------------------------------------------------
    const handleSaveProject = async () => {
        const user = auth.currentUser;

        if (!user) {
            Alert.alert(
                "Sign in required",
                "Please sign in before editing a project."
            );
            return;
        }

        if (!editingProjectId) {
            Alert.alert(
                "No project selected",
                "Open an existing project before saving changes."
            );
            return;
        }

        if (
            !title.trim() ||
            !category.trim() ||
            !beneficiaries.trim() ||
            !goalAmount.trim()
        ) {
            Alert.alert(
                "Missing fields",
                "Please fill in the title, category, beneficiary count and funding goal."
            );
            return;
        }

        const beneficiaryCount = Number(beneficiaries);
        const amount = Number(goalAmount);

        if (
            !Number.isFinite(beneficiaryCount) ||
            beneficiaryCount < 0 ||
            !Number.isInteger(beneficiaryCount)
        ) {
            Alert.alert(
                "Invalid beneficiaries",
                "Enter a valid whole number for the beneficiary count."
            );
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            Alert.alert(
                "Invalid funding goal",
                "Enter a funding goal greater than zero."
            );
            return;
        }

        // Confirm the selected project belongs to this NGO.
        const existingProject = projects.find(
            (project) => project.id === editingProjectId
        );

        if (
            !existingProject ||
            (existingProject.ngoOwnerId !== user.uid &&
                existingProject.ownerId !== user.uid)
        ) {
            Alert.alert(
                "Access denied",
                "This project does not belong to your organisation, or it is no longer available."
            );
            return;
        }

        setSubmitting(true);

        try {
            const projectRef = doc(
                db,
                "projects",
                editingProjectId
            );

            // updateDoc changes an existing document only.
            // It does not create a new project if the document is missing.
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

            Alert.alert(
                "Project updated",
                "Your changes have been saved to the database."
            );
        } catch (error) {
            console.error("Project update failed:", error);

            Alert.alert(
                "Could not update project",
                error.message ||
                    "Please check your Firestore permissions and try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // --------------------------------------------------
    // DELETE AN EXISTING FIRESTORE DOCUMENT
    // --------------------------------------------------
    const handleDeleteProject = (project) => {
        setOptionsVisible(false);

        if (!project) return;

        const user = auth.currentUser;

        if (
            !user ||
            (project.ngoOwnerId !== user.uid &&
                project.ownerId !== user.uid)
        ) {
            Alert.alert(
                "Access denied",
                "You can only delete projects belonging to your organisation."
            );
            return;
        }

        Alert.alert(
            "Delete Project",
            `Are you sure you want to delete "${project.title}"? This action cannot be undone.`,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Verify ownership again before deleting.
                            const currentUser = auth.currentUser;

                            if (
                                !currentUser ||
                                (project.ngoOwnerId !== currentUser.uid &&
                                    project.ownerId !== currentUser.uid)
                            ) {
                                Alert.alert(
                                    "Access denied",
                                    "You are not allowed to delete this project."
                                );
                                return;
                            }

                            await deleteDoc(
                                doc(db, "projects", project.id)
                            );

                            setSelectedProject(null);

                            Alert.alert(
                                "Project deleted",
                                "The project has been removed from the database."
                            );
                        } catch (error) {
                            console.error(
                                "Project deletion failed:",
                                error
                            );

                            Alert.alert(
                                "Could not delete project",
                                error.message ||
                                    "Please check your Firestore permissions and try again."
                            );
                        }
                    },
                },
            ]
        );
    };

    // --------------------------------------------------
    // STATISTICS
    // --------------------------------------------------
    const totalRaised = projects.reduce(
        (total, project) =>
            total + (Number(project.raisedAmount) || 0),
        0
    );

    const totalBeneficiaries = projects.reduce(
        (total, project) =>
            total +
            (Number(
                project.beneficiariesCount ??
                    project.beneficiaries
            ) || 0),
        0
    );

    const totalActiveProjects = projects.filter(
        (project) =>
            project.status !== "Completed" &&
            project.status !== "completed" &&
            project.status !== "closed"
    ).length;

    const SUMMARY_STATS = [
        {
            id: "1",
            label: "Raised",
            value: `R${totalRaised.toLocaleString("en-ZA")}`,
            bgColor: "#EFF6FF",
            color: "#1E40AF",
        },
        {
            id: "2",
            label: "Active",
            value: String(totalActiveProjects),
            bgColor: "#ECFDF5",
            color: "#047857",
        },
        {
            id: "3",
            label: "Total Proj.",
            value: String(projects.length),
            bgColor: "#FEF3C7",
            color: "#B45309",
        },
        {
            id: "4",
            label: "Impacted",
            value: totalBeneficiaries.toLocaleString("en-ZA"),
            bgColor: "#F3E8FF",
            color: "#6B21A8",
        },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />

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
                        <View style={styles.headerTitleRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.headerTitle}>
                                    Impact Management
                                </Text>

                                <Text style={styles.headerSubtitle}>
                                    View, edit and manage your organisation's
                                    existing projects.
                                </Text>
                            </View>
                        </View>

                        {/* SUMMARY CARDS */}
                        <View style={styles.statsGrid}>
                            {SUMMARY_STATS.map((stat) => (
                                <View
                                    key={stat.id}
                                    style={[
                                        styles.statCard,
                                        { backgroundColor: stat.bgColor },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.statValue,
                                            { color: stat.color },
                                        ]}
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                    >
                                        {stat.value}
                                    </Text>

                                    <Text style={styles.statLabel}>
                                        {stat.label}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </Animated.View>

                    {/* PROJECTS */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionHeaderTitle}>
                            Your Projects
                        </Text>

                        <Text style={styles.sectionHeaderCount}>
                            {projects.length} Total
                        </Text>
                    </View>

                    {loading ? (
                        <ActivityIndicator
                            size="large"
                            color="#166534"
                            style={{ marginVertical: 30 }}
                        />
                    ) : projects.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyTitle}>
                                No Projects Found
                            </Text>

                            <Text style={styles.emptySubText}>
                                Projects you publish from the Create a
                                Project screen will appear here. You can
                                then edit or delete them.
                            </Text>
                        </View>
                    ) : (
                        projects.map((project) => {
                            const goal = Number(
                                project.goalAmount ??
                                    project.fundingGoal ??
                                    0
                            );

                            const raised = Number(
                                project.raisedAmount || 0
                            );

                            const beneficiaryCount = Number(
                                project.beneficiariesCount ??
                                    project.beneficiaries ??
                                    0
                            );

                            const ratio =
                                goal > 0
                                    ? Math.min(Math.max(raised / goal, 0), 1)
                                    : 0;

                            const percentText =
                                `${Math.round(ratio * 100)}%`;

                            const isCompleted =
                                project.status === "Completed" ||
                                project.status === "completed" ||
                                project.status === "closed";

                            const displayStatus = isCompleted
                                ? "Completed"
                                : "Active";

                            return (
                                <View
                                    key={project.id}
                                    style={styles.projectCard}
                                >
                                    <View style={styles.projectCardHeader}>
                                        <Image
                                            source={{
                                                uri:
                                                    project.imageUrl ||
                                                    DEFAULT_IMAGE,
                                            }}
                                            style={styles.projectThumb}
                                        />

                                        <View style={styles.projectMeta}>
                                            <View
                                                style={styles.projectTitleRow}
                                            >
                                                <Text
                                                    style={styles.projectTitle}
                                                    numberOfLines={2}
                                                >
                                                    {project.title ||
                                                        "Untitled project"}
                                                </Text>

                                                <View
                                                    style={
                                                        styles.statusAndMenuRow
                                                    }
                                                >
                                                    <View
                                                        style={[
                                                            styles.statusBadge,
                                                            isCompleted
                                                                ? styles.statusBadgeCompleted
                                                                : styles.statusBadgeActive,
                                                        ]}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.statusBadgeText,
                                                                isCompleted
                                                                    ? styles.statusTextCompleted
                                                                    : styles.statusTextActive,
                                                            ]}
                                                        >
                                                            {displayStatus}
                                                        </Text>
                                                    </View>

                                                    <TouchableOpacity
                                                        style={styles.moreButton}
                                                        accessibilityLabel={`Manage ${project.title}`}
                                                        onPress={() => {
                                                            setSelectedProject(
                                                                project
                                                            );
                                                            setOptionsVisible(
                                                                true
                                                            );
                                                        }}
                                                    >
                                                        <Text
                                                            style={
                                                                styles.moreButtonText
                                                            }
                                                        >
                                                            ⋮
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>

                                            <Text
                                                style={styles.projectCategory}
                                            >
                                                Category:{" "}
                                                {project.category ||
                                                    project.cause ||
                                                    "General"}
                                            </Text>

                                            <Text
                                                style={
                                                    styles.projectBeneficiaries
                                                }
                                            >
                                                👥 {beneficiaryCount}{" "}
                                                Beneficiaries Targeted
                                            </Text>
                                        </View>
                                    </View>

                                    {/* FUNDING PROGRESS */}
                                    <View style={styles.progressBarTrack}>
                                        <Animated.View
                                            style={[
                                                styles.progressBarFill,
                                                {
                                                    width:
                                                        barAnim.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [
                                                                "0%",
                                                                `${ratio * 100}%`,
                                                            ],
                                                        }),
                                                },
                                            ]}
                                        />
                                    </View>

                                    <View style={styles.progressValueRow}>
                                        <Text style={styles.raisedText}>
                                            R{raised.toLocaleString("en-ZA")}{" "}
                                            raised
                                        </Text>

                                        <Text style={styles.goalText}>
                                            {percentText} of R
                                            {goal.toLocaleString("en-ZA")}
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
                            <Text style={styles.modalTitle}>
                                Edit Project
                            </Text>

                            <Text style={styles.modalSubtitle}>
                                Update the details of this existing project.
                                Your changes will be saved to Firestore.
                            </Text>

                            <ScrollView
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                <Text style={styles.inputLabel}>
                                    Project Title *
                                </Text>

                                <TextInput
                                    style={styles.textInput}
                                    placeholder="e.g. Mobile Science Lab Kit Drive"
                                    value={title}
                                    onChangeText={setTitle}
                                />

                                <Text style={styles.inputLabel}>
                                    Category *
                                </Text>

                                <TextInput
                                    style={styles.textInput}
                                    placeholder="e.g. Education, Health, Environment"
                                    value={category}
                                    onChangeText={setCategory}
                                />

                                <Text style={styles.inputLabel}>
                                    Target Beneficiaries Count *
                                </Text>

                                <TextInput
                                    style={styles.textInput}
                                    placeholder="e.g. 150"
                                    keyboardType="numeric"
                                    value={beneficiaries}
                                    onChangeText={setBeneficiaries}
                                />

                                <Text style={styles.inputLabel}>
                                    Funding Goal (ZAR R) *
                                </Text>

                                <TextInput
                                    style={styles.textInput}
                                    placeholder="e.g. 250000"
                                    keyboardType="decimal-pad"
                                    value={goalAmount}
                                    onChangeText={setGoalAmount}
                                />

                                <Text style={styles.inputLabel}>
                                    Cover Image URL (Optional)
                                </Text>

                                <TextInput
                                    style={styles.textInput}
                                    placeholder="https://..."
                                    autoCapitalize="none"
                                    value={imageUrl}
                                    onChangeText={setImageUrl}
                                />

                                <Text style={styles.inputLabel}>
                                    Status
                                </Text>

                                <View style={styles.statusToggleRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.statusOption,
                                            status === "Active" &&
                                                styles.statusOptionActive,
                                        ]}
                                        onPress={() => setStatus("Active")}
                                    >
                                        <Text
                                            style={[
                                                styles.statusOptionText,
                                                status === "Active" &&
                                                    styles.statusOptionTextSelected,
                                            ]}
                                        >
                                            Active
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.statusOption,
                                            status === "Completed" &&
                                                styles.statusOptionCompleted,
                                        ]}
                                        onPress={() =>
                                            setStatus("Completed")
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.statusOptionText,
                                                status === "Completed" &&
                                                    styles.statusOptionTextSelected,
                                            ]}
                                        >
                                            Completed
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        disabled={submitting}
                                        onPress={() =>
                                            setModalVisible(false)
                                        }
                                    >
                                        <Text style={styles.cancelButtonText}>
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.submitButton,
                                            submitting &&
                                                styles.submitButtonDisabled,
                                        ]}
                                        onPress={handleSaveProject}
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <ActivityIndicator
                                                color="#FFFFFF"
                                                size="small"
                                            />
                                        ) : (
                                            <Text
                                                style={
                                                    styles.submitButtonText
                                                }
                                            >
                                                Save Changes
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* EDIT / DELETE OPTIONS */}
                <Modal
                    visible={optionsVisible}
                    animationType="fade"
                    transparent
                    onRequestClose={() => setOptionsVisible(false)}
                >
                    <TouchableOpacity
                        style={styles.optionsOverlay}
                        activeOpacity={1}
                        onPress={() => setOptionsVisible(false)}
                    >
                        <View style={styles.optionsSheet}>
                            <Text style={styles.optionsHeader}>
                                {selectedProject?.title || "Manage Project"}
                            </Text>

                            <TouchableOpacity
                                style={styles.optionItem}
                                onPress={() =>
                                    handleOpenEditModal(selectedProject)
                                }
                            >
                                <Text style={styles.optionText}>
                                    ✏️ Edit Project Details
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.optionItem,
                                    styles.optionItemDelete,
                                ]}
                                onPress={() =>
                                    handleDeleteProject(selectedProject)
                                }
                            >
                                <Text style={styles.optionTextDelete}>
                                    🗑️ Delete Project
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.cancelOptionItem}
                                onPress={() => setOptionsVisible(false)}
                            >
                                <Text style={styles.cancelOptionText}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },

    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },

    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 112,
    },

    headerContainer: {
        marginBottom: 16,
    },

    headerTitleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },

    headerTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#0F172A",
    },

    headerSubtitle: {
        fontSize: 13,
        color: "#64748B",
        marginTop: 4,
        lineHeight: 19,
    },

    statsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    statCard: {
        width: (width - 32 - 24) / 4,
        paddingVertical: 12,
        paddingHorizontal: 3,
        borderRadius: 12,
        alignItems: "center",
    },

    statValue: {
        fontSize: 15,
        fontWeight: "800",
    },

    statLabel: {
        fontSize: 10,
        color: "#475569",
        marginTop: 4,
    },

    sectionHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 12,
        marginBottom: 12,
    },

    sectionHeaderTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F172A",
    },

    sectionHeaderCount: {
        fontSize: 12,
        color: "#64748B",
        fontWeight: "600",
    },

    projectCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },

    projectCardHeader: {
        flexDirection: "row",
    },

    projectThumb: {
        width: 56,
        height: 56,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: "#E2E8F0",
    },

    projectMeta: {
        flex: 1,
    },

    projectTitleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },

    projectTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0F172A",
        flex: 1,
        paddingTop: 3,
    },

    statusAndMenuRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        marginLeft: 6,
    },

    statusBadgeActive: {
        backgroundColor: "#EFF6FF",
    },

    statusBadgeCompleted: {
        backgroundColor: "#DCFCE7",
    },

    statusBadgeText: {
        fontSize: 10,
        fontWeight: "600",
    },

    statusTextActive: {
        color: "#2563EB",
    },

    statusTextCompleted: {
        color: "#166534",
    },

    moreButton: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 4,
    },

    moreButtonText: {
        fontSize: 18,
        color: "#64748B",
        fontWeight: "700",
    },

    projectCategory: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 5,
    },

    projectBeneficiaries: {
        fontSize: 12,
        color: "#166534",
        fontWeight: "600",
        marginTop: 4,
    },

    progressBarTrack: {
        height: 6,
        backgroundColor: "#E2E8F0",
        borderRadius: 3,
        marginTop: 12,
        overflow: "hidden",
    },

    progressBarFill: {
        height: "100%",
        backgroundColor: "#166534",
    },

    progressValueRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 6,
    },

    raisedText: {
        fontSize: 11,
        color: "#166534",
        fontWeight: "600",
    },

    goalText: {
        fontSize: 11,
        color: "#64748B",
    },

    emptyContainer: {
        backgroundColor: "#FFFFFF",
        padding: 24,
        borderRadius: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },

    emptyTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0F172A",
    },

    emptySubText: {
        fontSize: 12,
        color: "#64748B",
        textAlign: "center",
        marginTop: 6,
        lineHeight: 18,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        justifyContent: "center",
        padding: 16,
    },

    modalContent: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        maxHeight: "85%",
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0F172A",
    },

    modalSubtitle: {
        fontSize: 12,
        color: "#64748B",
        marginBottom: 12,
        marginTop: 4,
        lineHeight: 18,
    },

    inputLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#334155",
        marginTop: 10,
        marginBottom: 4,
    },

    textInput: {
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        backgroundColor: "#F8FAFC",
        color: "#0F172A",
    },

    statusToggleRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 6,
    },

    statusOption: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#CBD5E1",
        alignItems: "center",
    },

    statusOptionActive: {
        backgroundColor: "#EFF6FF",
        borderColor: "#2563EB",
    },

    statusOptionCompleted: {
        backgroundColor: "#DCFCE7",
        borderColor: "#166534",
    },

    statusOptionText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#475569",
    },

    statusOptionTextSelected: {
        color: "#0F172A",
        fontWeight: "700",
    },

    modalActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 20,
        marginBottom: 4,
        gap: 12,
    },

    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: "#F1F5F9",
    },

    cancelButtonText: {
        color: "#475569",
        fontWeight: "600",
        fontSize: 13,
    },

    submitButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: "#166534",
        minWidth: 112,
        alignItems: "center",
        justifyContent: "center",
    },

    submitButtonDisabled: {
        opacity: 0.65,
    },

    submitButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 13,
    },

    optionsOverlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.4)",
        justifyContent: "flex-end",
    },

    optionsSheet: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },

    optionsHeader: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 16,
        textAlign: "center",
    },

    optionItem: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },

    optionText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#0F172A",
    },

    optionItemDelete: {
        borderBottomWidth: 0,
    },

    optionTextDelete: {
        fontSize: 14,
        fontWeight: "600",
        color: "#DC2626",
    },

    cancelOptionItem: {
        marginTop: 12,
        paddingVertical: 12,
        backgroundColor: "#F8FAFC",
        borderRadius: 8,
        alignItems: "center",
    },

    cancelOptionText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#64748B",
    },
});
