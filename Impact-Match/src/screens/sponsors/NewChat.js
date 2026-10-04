import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
} from "react-native";

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../../../Backend/firebaseConfig";

const COLORS = {
    background: "#FFFFFF",
    surface: "#F9FAFB",
    border: "#E5E7EB",
    primary: "#10B981",
    primaryLight: "rgba(16, 185, 129, 0.10)",
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    white: "#FFFFFF",
};

export default function NewChat({ navigation }) {
    const [organisations, setOrganisations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrganisations();
    }, []);

    const loadOrganisations = async () => {
        try {
            const ngoQuery = query(
                collection(db, "users"),
                where("role", "==", "ngo")
            );

            const snapshot = await getDocs(ngoQuery);

            const ngoList = snapshot.docs.map((document) => ({
                id: document.id,
                ...document.data(),
            }));

            setOrganisations(ngoList);
        } catch (error) {
            console.log("Error loading organisations:", error);
        } finally {
            setLoading(false);
        }
    };

    const startConversation = async (organisation) => {
        try {
            const currentUser = auth.currentUser;

            if (!currentUser) {
                return;
            }

            const sponsorId = currentUser.uid;
            const ngoId = organisation.id;

            // Always create the same conversation ID
            // for the same sponsor + NGO combination.
            const conversationId = [sponsorId, ngoId]
                .sort()
                .join("_");

            const sponsorName =
                currentUser.displayName || "Sponsor";

            const ngoName =
                organisation.organisationName ||
                organisation.name ||
                "Organisation";

            const conversationRef = doc(
                db,
                "conversations",
                conversationId
            );

            await setDoc(
                conversationRef,
                {
                    participants: [sponsorId, ngoId],

                    participantDetails: {
                        [sponsorId]: {
                            name: sponsorName,
                            role: "sponsor",
                        },

                        [ngoId]: {
                            name: ngoName,
                            role: "ngo",
                        },
                    },

                    lastMessage: "",
                    lastMessageAt: null,

                    unreadCount: {
                        [sponsorId]: 0,
                        [ngoId]: 0,
                    },

                    createdAt: serverTimestamp(),
                },
                { merge: true }
            );

            navigation.navigate("Chat", {
                conversationId,
                otherUserName: ngoName,
            });
        } catch (error) {
            console.log("Error starting conversation:", error);
        }
    };

    const renderOrganisation = ({ item }) => {
        const name =
            item.organisationName ||
            item.name ||
            "Organisation";

        return (
            <TouchableOpacity
                style={styles.organisationRow}
                activeOpacity={0.7}
                onPress={() => startConversation(item)}
            >
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {name.charAt(0).toUpperCase()}
                    </Text>
                </View>

                <View style={styles.info}>
                    <Text style={styles.name}>
                        {name}
                    </Text>

                    <Text style={styles.role}>
                        NGO / NPO
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator
                        size="large"
                        color={COLORS.primary}
                    />

                    <Text style={styles.loadingText}>
                        Loading organisations...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Text style={styles.backText}>‹</Text>
                </TouchableOpacity>

                <Text style={styles.title}>
                    New Conversation
                </Text>
            </View>

            {organisations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>
                        No organisations found
                    </Text>

                    <Text style={styles.emptyText}>
                        There are currently no NGOs available to contact.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={organisations}
                    keyExtractor={(item) => item.id}
                    renderItem={renderOrganisation}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    header: {
        height: 64,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },

    backButton: {
        marginRight: 15,
    },

    backText: {
        fontSize: 36,
        color: COLORS.textPrimary,
        lineHeight: 36,
    },

    title: {
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },

    organisationRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },

    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },

    avatarText: {
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.primary,
    },

    info: {
        flex: 1,
    },

    name: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textPrimary,
    },

    role: {
        marginTop: 4,
        fontSize: 13,
        color: COLORS.textSecondary,
    },

    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.textSecondary,
    },

    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
    },

    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 8,
    },

    emptyText: {
        textAlign: "center",
        fontSize: 14,
        color: COLORS.textSecondary,
    },
});