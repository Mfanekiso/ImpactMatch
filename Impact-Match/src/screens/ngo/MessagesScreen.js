import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
} from "react-native";

import Ionicons from "@react-native-vector-icons/ionicons";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../../Backend/firebaseConfig";

// ─── LUXURY COLOR PALETTE ───────────────────────────────────────────────
const COLORS = {
    background: "#F8F6EE",       // Cream base
    surface: "#FFFFFF",          // Clean white
    primary: "#D9C982",          // Soft Luxury Gold
    primarySoft: "rgba(217, 201, 130, 0.2)",
    emerald: "#059669",          // Vibrant Emerald for roles/badges
    textPrimary: "#433327",      // Warm Bronze instead of harsh black
    textSecondary: "#8C7A6B",    // Muted taupe for secondary text
    placeholder: "#B8A99A",
    border: "#E8DFD5",
    white: "#FFFFFF",
};

export default function MessagesScreen({ navigation }) {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    // =====================================================
    // LOAD REAL-TIME CONVERSATIONS
    // =====================================================
    useEffect(() => {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            setLoading(false);
            return;
        }

        const conversationsRef = collection(db, "conversations");
        const conversationsQuery = query(
            conversationsRef,
            where("participants", "array-contains", currentUser.uid)
        );

        const unsubscribe = onSnapshot(
            conversationsQuery,
            (snapshot) => {
                const conversationList = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    const otherUserId = data.participants?.find((id) => id !== currentUser.uid);
                    const otherUser = data.participantDetails?.[otherUserId];

                    return {
                        id: doc.id,
                        name: otherUser?.name || "Unknown User",
                        role: otherUser?.role || "",
                        lastMessage: data.lastMessage || "No messages yet",
                        lastMessageAt: data.lastMessageAt || null,
                        time: data.lastMessageAt ? formatTime(data.lastMessageAt) : "",
                        unreadCount: data.unreadCount?.[currentUser.uid] || 0,
                    };
                });

                // Newest conversation first
                conversationList.sort((a, b) => {
                    const timeA = a.lastMessageAt?.toMillis ? a.lastMessageAt.toMillis() : 0;
                    const timeB = b.lastMessageAt?.toMillis ? b.lastMessageAt.toMillis() : 0;
                    return timeB - timeA;
                });
                setConversations(conversationList);
                setLoading(false);
            },
            (error) => {
                console.log("Error loading conversations:", error);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, []);

    // =====================================================
    // NAVIGATION HANDLERS
    // =====================================================
    const handleStartChat = () => {
        navigation.navigate("NewChat");
    };

    const openConversation = (conversationId) => {
        navigation.navigate("Chat", { conversationId });
    };

    // =====================================================
    // CONVERSATION ITEM RENDERER
    // =====================================================
    const renderConversation = ({ item }) => (
        <TouchableOpacity
            style={styles.conversationRow}
            activeOpacity={0.7}
            onPress={() => openConversation(item.id)}
        >
            <View style={styles.avatar}>
                <Ionicons name="person" size={22} color={COLORS.primary} />
            </View>

            <View style={styles.conversationContent}>
                <View style={styles.conversationTopRow}>
                    <View style={styles.nameContainer}>
                        <Text style={styles.conversationName} numberOfLines={1}>
                            {item.name}
                        </Text>
                        {item.role ? (
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleText}>
                                    {item.role === "ngo" ? "NGO" : "Sponsor"}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                    <Text style={styles.conversationTime}>{item.time}</Text>
                </View>

                <View style={styles.conversationBottomRow}>
                    <Text 
                        style={[
                            styles.conversationMessage, 
                            item.unreadCount > 0 && styles.conversationMessageUnread
                        ]} 
                        numberOfLines={1}
                    >
                        {item.lastMessage}
                    </Text>

                    {item.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    // =====================================================
    // SCREEN RENDER
    // =====================================================
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
                <TouchableOpacity
                    style={styles.headerActionPill}
                    activeOpacity={0.8}
                    onPress={handleStartChat}
                >
                    <Ionicons name="add" size={18} color={COLORS.textPrimary} style={styles.pillIcon} />
                    <Text style={styles.headerActionText}>New Message</Text>
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color={COLORS.placeholder} />
                <Text style={styles.searchPlaceholder}>Search conversations...</Text>
            </View>

            {/* Content State */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : conversations.length > 0 ? (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item.id}
                    renderItem={renderConversation}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconWrapper}>
                        <Ionicons name="chatbubbles-outline" size={42} color={COLORS.primary} />
                    </View>
                    <Text style={styles.emptyTitle}>No messages yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Start a conversation with an NGO or sponsor to begin building partnerships.
                    </Text>
                    <TouchableOpacity
                        style={styles.startChatButton}
                        activeOpacity={0.85}
                        onPress={handleStartChat}
                    >
                        <Ionicons name="chatbubble-ellipses" size={18} color={COLORS.white} style={styles.startChatIcon} />
                        <Text style={styles.startChatText}>Start a Chat</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

// =========================================================
// TIME FORMATTER
// =========================================================
function formatTime(timestamp) {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const sameDay = date.toDateString() === now.toDateString();

    if (sameDay) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { day: "2-digit", month: "short" });
}

// =========================================================
// STYLES
// =========================================================
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: "700",
        color: COLORS.textPrimary,
        letterSpacing: -0.5,
    },
    headerActionPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    pillIcon: {
        marginRight: 4,
    },
    headerActionText: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.textPrimary,
        letterSpacing: 0.3,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        height: 52,
        marginHorizontal: 24,
        marginBottom: 16,
        paddingHorizontal: 18,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 26, // fully rounded for a softer look
        shadowColor: COLORS.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    searchPlaceholder: {
        marginLeft: 12,
        fontSize: 15,
        color: COLORS.placeholder,
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    listContent: {
        paddingHorizontal: 24,
        paddingBottom: 100, // accommodate bottom tab bar
    },
    conversationRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primarySoft,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    conversationContent: {
        flex: 1,
    },
    conversationTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    nameContainer: {
        flex: 1,
        marginRight: 12,
        flexDirection: "row",
        alignItems: "center",
    },
    conversationName: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginRight: 8,
        flexShrink: 1, // allows it to truncate before squishing the badge
    },
    roleBadge: {
        backgroundColor: "rgba(5, 150, 105, 0.1)",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    roleText: {
        fontSize: 10,
        color: COLORS.emerald,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    conversationTime: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: "500",
    },
    conversationBottomRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    conversationMessage: {
        flex: 1,
        fontSize: 14,
        color: COLORS.textSecondary,
        marginRight: 16,
        lineHeight: 20,
    },
    conversationMessageUnread: {
        color: COLORS.textPrimary,
        fontWeight: "600",
    },
    unreadBadge: {
        minWidth: 22,
        height: 22,
        paddingHorizontal: 7,
        borderRadius: 11,
        backgroundColor: COLORS.emerald,
        alignItems: "center",
        justifyContent: "center",
    },
    unreadBadgeText: {
        color: COLORS.white,
        fontSize: 11,
        fontWeight: "800",
    },
    separator: {
        height: 1,
        backgroundColor: COLORS.border,
        marginLeft: 72, // aligned with text, past avatar
    },
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
        paddingBottom: 80,
    },
    emptyIconWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primarySoft,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 10,
    },
    emptySubtitle: {
        fontSize: 15,
        lineHeight: 24,
        color: COLORS.textSecondary,
        textAlign: "center",
        marginBottom: 32,
    },
    startChatButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: 56,
        paddingHorizontal: 32,
        borderRadius: 28,
        backgroundColor: COLORS.emerald,
        shadowColor: COLORS.emerald,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    startChatIcon: {
        marginRight: 10,
    },
    startChatText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
});
