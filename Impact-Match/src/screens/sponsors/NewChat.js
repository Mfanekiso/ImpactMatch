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
    getDoc,
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
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUserData, setCurrentUserData] = useState(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const currentUser = auth.currentUser;

            if (!currentUser) {
                setLoading(false);
                return;
            }

            // Get the logged-in user's Firestore profile
            const currentUserRef = doc(
                db,
                "users",
                currentUser.uid
            );

            const currentUserSnapshot =
                await getDoc(currentUserRef);

            if (!currentUserSnapshot.exists()) {
                console.log("Current user profile not found.");
                setLoading(false);
                return;
            }

            const currentUserProfile =
                currentUserSnapshot.data();

            setCurrentUserData(currentUserProfile);

            const currentRole = currentUserProfile.role;

            // Sponsor → show NGOs
            // NGO → show Sponsors
            const targetRole =
                currentRole === "sponsor"
                    ? "ngo"
                    : "sponsor";

            const usersQuery = query(
                collection(db, "users"),
                where("role", "==", targetRole)
            );

            const snapshot = await getDocs(usersQuery);

            const userList = snapshot.docs
                .map((document) => ({
                    id: document.id,
                    ...document.data(),
                }))
                .filter(
                    (user) => user.id !== currentUser.uid
                );

            setUsers(userList);
        } catch (error) {
            console.log("Error loading users:", error);
        } finally {
            setLoading(false);
        }
    };

    const getUserName = (user) => {
        if (user.role === "ngo") {
            return (
                user.organisationName ||
                user.full_name ||
                user.name ||
                "Organisation"
            );
        }

        return (
            user.organisationName ||
            user.full_name ||
            user.fullName ||
            user.name ||
            "Sponsor"
        );
    };

    const startConversation = async (otherUser) => {
        try {
            const currentUser = auth.currentUser;

            if (!currentUser || !currentUserData) {
                return;
            }

            const currentUserId = currentUser.uid;
            const otherUserId = otherUser.id;

            /*
             * The same two users will always get
             * the same conversation ID.
             */
            const conversationId = [
                currentUserId,
                otherUserId,
            ]
                .sort()
                .join("_");

            const conversationRef = doc(
                db,
                "conversations",
                conversationId
            );

            const currentUserName = getUserName({
                ...currentUserData,
                role: currentUserData.role,
            });

            const otherUserName = getUserName(otherUser);

            await setDoc(
                conversationRef,
                {
                    participants: [
                        currentUserId,
                        otherUserId,
                    ],

                    participantDetails: {
                        [currentUserId]: {
                            name: currentUserName,
                            role: currentUserData.role,
                        },

                        [otherUserId]: {
                            name: otherUserName,
                            role: otherUser.role,
                        },
                    },

                    lastMessage: "",
                    lastMessageAt: null,

                    unreadCount: {
                        [currentUserId]: 0,
                        [otherUserId]: 0,
                    },

                    createdAt: serverTimestamp(),
                },
                {
                    merge: true,
                }
            );

            navigation.navigate("Chat", {
                conversationId,
                otherUserName,
            });
        } catch (error) {
            console.log(
                "Error starting conversation:",
                error
            );
        }
    };

    const renderUser = ({ item }) => {
        const name = getUserName(item);

        return (
            <TouchableOpacity
                style={styles.userRow}
                activeOpacity={0.7}
                onPress={() => startConversation(item)}
            >
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {name.charAt(0).toUpperCase()}
                    </Text>
                </View>

                <View style={styles.userInfo}>
                    <Text style={styles.name}>
                        {name}
                    </Text>

                    <Text style={styles.role}>
                        {item.role === "ngo"
                            ? "NGO / NPO"
                            : "Sponsor"}
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
                        Loading...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const isSponsor =
        currentUserData?.role === "sponsor";

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

            <View style={styles.intro}>
                <Text style={styles.introTitle}>
                    {isSponsor
                        ? "Choose an organisation"
                        : "Choose a sponsor"}
                </Text>

                <Text style={styles.introText}>
                    {isSponsor
                        ? "Select an organisation to start a conversation."
                        : "Select a sponsor to start a conversation."}
                </Text>
            </View>

            {users.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>
                        No users found
                    </Text>

                    <Text style={styles.emptyText}>
                        There are currently no{" "}
                        {isSponsor
                            ? "organisations"
                            : "sponsors"}{" "}
                        available to contact.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.id}
                    renderItem={renderUser}
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

    intro: {
        paddingHorizontal: 20,
        paddingVertical: 18,
    },

    introTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },

    introText: {
        marginTop: 5,
        fontSize: 14,
        color: COLORS.textSecondary,
    },

    userRow: {
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

    userInfo: {
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