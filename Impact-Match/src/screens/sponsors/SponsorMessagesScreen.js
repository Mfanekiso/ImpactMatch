import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    StatusBar,
    ActivityIndicator,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../../Backend/firebaseConfig";
import {
    useFonts,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
} from "@expo-google-fonts/manrope";

// ─── LUXURY COLOR PALETTE (Sponsor Twist) ──────────────────────────────
const COLORS = {
    background: "#F8F6EE",       // Cream base
    surface: "#FFFFFF",          // Clean white
    primary: "#D9C982",          // Soft Luxury Gold
    primarySoft: "rgba(217, 201, 130, 0.2)",
    emerald: "#059669",          // Vibrant Emerald for badges/unread
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

export default function SponsorMessagesScreen({ navigation }) {
    const [fontsLoaded] = useFonts({
        Manrope_400Regular,
        Manrope_500Medium,
        Manrope_600SemiBold,
        Manrope_700Bold,
    });

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
        const isUnread = item.unreadCount > 0;

        return (
            <TouchableOpacity
                style={[styles.conversationRow, isUnread && styles.conversationRowUnread]}
                activeOpacity={0.7}
                onPress={() =>
                    navigation.navigate("Chat", {
                        conversationId: item.id,
                        otherUserName: item.name,
                    })
                }
            >
                <View style={[styles.avatar, isUnread && styles.avatarUnread]}>
                    <Text style={[styles.avatarText, isUnread && styles.avatarTextUnread]}>
                        {item.name.charAt(0).toUpperCase()}
                    </Text>
                </View>

                <View style={styles.conversationContent}>
                    <View style={styles.topRow}>
                        <Text
                            style={[styles.name, isUnread && styles.unreadTextStrong]}
                            numberOfLines={1}
                        >
                            {item.name}
                        </Text>

                        <Text style={[styles.time, isUnread && styles.unreadTime]}>
                            {formatTime(item.lastMessageAt)}
                        </Text>
                    </View>

                    <View style={styles.bottomRow}>
                        <Text
                            style={[styles.lastMessage, isUnread && styles.lastMessageUnread]}
                            numberOfLines={1}
                        >
                            {item.lastMessage}
                        </Text>

                        {isUnread && (
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

    if (!fontsLoaded) return null;

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

                <View style={styles.loadingContainer}>
                    <ActivityIndicator
                        size="large"
                        color={COLORS.buttonDark}
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
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

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
                            color={COLORS.buttonDark}
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
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: COLORS.background,
    },

    title: {
        fontFamily: "Manrope_700Bold",
        fontSize: 28,
        color: COLORS.textPrimary,
        letterSpacing: -0.5,
    },

    subtitle: {
        marginTop: 4,
        fontFamily: "Manrope_500Medium",
        fontSize: 14,
        color: COLORS.textSecondary,
    },

    headerMeta: { 
        flexDirection: "row", 
        alignItems: "center", 
        flexWrap: "wrap", 
        columnGap: 10, 
        rowGap: 5 
    },
    unreadSummary: { 
        flexDirection: "row", 
        alignItems: "center", 
        paddingHorizontal: 10, 
        paddingVertical: 4, 
        borderRadius: 12, 
        backgroundColor: COLORS.emeraldSoft, 
    },
    unreadSummaryDot: { 
        width: 6, 
        height: 6, 
        borderRadius: 3, 
        backgroundColor: COLORS.emerald, 
        marginRight: 6 
    },
    unreadSummaryText: { 
        fontFamily: "Manrope_700Bold",
        fontSize: 11, 
        color: COLORS.emerald,
        textTransform: "uppercase"
    },

    newChatButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.buttonDark,
        alignItems: "center",
        justifyContent: "center",
        ...softShadow,
    },

    listContent: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 112,
    },

    conversationRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginBottom: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        ...softShadow,
    },

    conversationRowUnread: {
        borderColor: COLORS.primary,
        backgroundColor: "#FFFCF5", // Very subtle warm tint
    },

    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: COLORS.primarySoft,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    avatarUnread: {
        backgroundColor: COLORS.buttonDarkSoft,
    },

    avatarText: {
        fontFamily: "Manrope_700Bold",
        fontSize: 20,
        color: COLORS.textPrimary,
    },
    avatarTextUnread: {
        color: COLORS.buttonDark,
    },

    conversationContent: {
        flex: 1,
    },

    topRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
    },

    name: {
        flex: 1,
        marginRight: 10,
        fontFamily: "Manrope_600SemiBold",
        fontSize: 16,
        color: COLORS.textPrimary,
    },

    time: {
        fontFamily: "Manrope_500Medium",
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
        fontFamily: "Manrope_400Regular",
        fontSize: 14,
        color: COLORS.textSecondary,
    },

    unreadBadge: {
        minWidth: 24,
        height: 24,
        borderRadius: 12,
        paddingHorizontal: 6,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.emerald,
    },

    unreadText: {
        fontFamily: "Manrope_700Bold",
        fontSize: 12,
        color: COLORS.white,
    },
    unreadTextStrong: { 
        fontFamily: "Manrope_700Bold",
    },
    unreadTime: { 
        color: COLORS.emerald, 
        fontFamily: "Manrope_700Bold",
    },
    lastMessageUnread: { 
        color: COLORS.textPrimary, 
        fontFamily: "Manrope_600SemiBold",
    },

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
        backgroundColor: COLORS.buttonDarkSoft,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
    },

    emptyTitle: {
        fontFamily: "Manrope_700Bold",
        fontSize: 22,
        color: COLORS.textPrimary,
        marginBottom: 8,
    },

    emptyText: {
        fontFamily: "Manrope_500Medium",
        fontSize: 15,
        lineHeight: 24,
        textAlign: "center",
        color: COLORS.textSecondary,
        marginBottom: 32,
    },

    startButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        height: 56,
        borderRadius: 30, // Luxury pill shape
        backgroundColor: COLORS.buttonDark,
        ...softShadow,
    },

    startButtonText: {
        marginLeft: 8,
        fontFamily: "Manrope_700Bold",
        fontSize: 15,
        color: COLORS.white,
        letterSpacing: 0.3,
    },

    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    loadingText: {
        marginTop: 16,
        fontFamily: "Manrope_500Medium",
        fontSize: 14,
        color: COLORS.textSecondary,
    },
});