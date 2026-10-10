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
};

export default function SponsorMessagesScreen({ navigation }) {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const unreadTotal = conversations.reduce((total, item) => total + item.unreadCount, 0);

    useEffect(() => {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            setLoading(false);
            return;
        }

        const conversationsQuery = query(
            collection(db, "conversations"),
            where("participants", "array-contains", currentUser.uid)
        );

        const unsubscribe = onSnapshot(
            conversationsQuery,
            (snapshot) => {
                const conversationList = snapshot.docs.map((doc) => {
                    const data = doc.data();

                    const otherUserId = data.participants?.find(
                        (id) => id !== currentUser.uid
                    );

                    const otherUser =
                        data.participantDetails?.[otherUserId] || {};

                    return {
                        id: doc.id,
                        name: otherUser.name || "Organisation",
                        role: otherUser.role || "NGO",
                        lastMessage: data.lastMessage || "No messages yet",
                        lastMessageAt: data.lastMessageAt || null,
                        unreadCount:
                            data.unreadCount?.[currentUser.uid] || 0,
                    };
                });

                conversationList.sort((a, b) => {
                    const timeA = a.lastMessageAt?.toMillis
                        ? a.lastMessageAt.toMillis()
                        : 0;

                    const timeB = b.lastMessageAt?.toMillis
                        ? b.lastMessageAt.toMillis()
                        : 0;

                    return timeB - timeA;
                });

                setConversations(conversationList);
                setLoading(false);
            },
            (error) => {
                console.log("Messages error:", error);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, []);

    const formatTime = (timestamp) => {
        if (!timestamp) return "";

        const date = timestamp.toDate
            ? timestamp.toDate()
            : new Date(timestamp);

        const now = new Date();

        const sameDay =
            date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        if (sameDay) {
            return date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
        }

        return date.toLocaleDateString([], {
            day: "2-digit",
            month: "short",
        });
    };

    const renderConversation = ({ item }) => {
        return (
            <TouchableOpacity
                style={[styles.conversationRow, item.unreadCount > 0 && styles.conversationRowUnread]}
                activeOpacity={0.7}
                onPress={() =>
                    navigation.navigate("Chat", {
                        conversationId: item.id,
                        otherUserName: item.name,
                    })
                }
            >
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {item.name.charAt(0).toUpperCase()}
                    </Text>
                </View>

                <View style={styles.conversationContent}>
                    <View style={styles.topRow}>
                        <Text
                            style={[styles.name, item.unreadCount > 0 && styles.unreadTextStrong]}
                            numberOfLines={1}
                        >
                            {item.name}
                        </Text>

                        <Text style={[styles.time, item.unreadCount > 0 && styles.unreadTime]}>
                            {formatTime(item.lastMessageAt)}
                        </Text>
                    </View>

                    <View style={styles.bottomRow}>
                        <Text
                            style={[styles.lastMessage, item.unreadCount > 0 && styles.lastMessageUnread]}
                            numberOfLines={1}
                        >
                            {item.lastMessage}
                        </Text>

                        {item.unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>
                                    {item.unreadCount > 99 ? "99+" : item.unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />

                <View style={styles.loadingContainer}>
                    <ActivityIndicator
                        size="large"
                        color={COLORS.primary}
                    />

                    <Text style={styles.loadingText}>
                        Loading messages...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Messages</Text>
                    <View style={styles.headerMeta}>
                        <Text style={styles.subtitle}>Connect with organisations</Text>
                        {unreadTotal > 0 && (
                            <View style={styles.unreadSummary}>
                                <View style={styles.unreadSummaryDot} />
                                <Text style={styles.unreadSummaryText}>{unreadTotal} unread</Text>
                            </View>
                        )}
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.newChatButton}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate("NewChat")}
                >
                    <Ionicons
                        name="create-outline"
                        size={22}
                        color={COLORS.white}
                    />
                </TouchableOpacity>
            </View>

            {conversations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIcon}>
                        <Ionicons
                            name="chatbubbles-outline"
                            size={42}
                            color={COLORS.primary}
                        />
                    </View>

                    <Text style={styles.emptyTitle}>
                        No messages yet
                    </Text>

                    <Text style={styles.emptyText}>
                        Start a conversation with an organisation to
                        discuss potential sponsorship opportunities.
                    </Text>

                    <TouchableOpacity
                        style={styles.startButton}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate("NewChat")}
                    >
                        <Ionicons
                            name="chatbubble-outline"
                            size={20}
                            color={COLORS.white}
                        />

                        <Text style={styles.startButtonText}>
                            Start a Conversation
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item.id}
                    renderItem={renderConversation}
                    contentContainerStyle={styles.listContent}
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
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 18,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: "#FFFFFF",
    },

    title: {
        fontSize: 28,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },

    subtitle: {
        marginTop: 4,
        fontSize: 14,
        color: COLORS.textSecondary,
    },

    headerMeta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", columnGap: 10, rowGap: 5 },
    unreadSummary: { flexDirection: "row", alignItems: "center", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "#C7F0DF" },
    unreadSummaryDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginRight: 5 },
    unreadSummaryText: { fontSize: 11, fontWeight: "700", color: "#047857" },

    newChatButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },

    listContent: {
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 24,
    },

    conversationRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 9,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
    },

    conversationRowUnread: {
        borderColor: "#B7E8D3",
        backgroundColor: "#FBFFFD",
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

    conversationContent: {
        flex: 1,
    },

    topRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 6,
    },

    name: {
        flex: 1,
        marginRight: 10,
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textPrimary,
    },

    time: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },

    bottomRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    lastMessage: {
        flex: 1,
        marginRight: 10,
        fontSize: 14,
        color: COLORS.textSecondary,
    },

    unreadBadge: {
        minWidth: 23,
        height: 23,
        borderRadius: 12,
        paddingHorizontal: 6,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        borderWidth: 2,
        borderColor: "#EAF8F2",
    },

    unreadText: {
        fontSize: 12,
        fontWeight: "700",
        color: COLORS.white,
    },
    unreadTextStrong: { fontWeight: "700" },
    unreadTime: { color: "#047857", fontWeight: "600" },
    lastMessageUnread: { color: "#334155", fontWeight: "600" },

    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
    },

    emptyIcon: {
        width: 86,
        height: 86,
        borderRadius: 43,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },

    emptyTitle: {
        fontSize: 21,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 8,
    },

    emptyText: {
        fontSize: 14,
        lineHeight: 21,
        textAlign: "center",
        color: COLORS.textSecondary,
        marginBottom: 24,
    },

    startButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
        height: 48,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
    },

    startButtonText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.white,
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
});
