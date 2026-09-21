import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    StatusBar,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

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

// Placeholder data — swap this out with real conversations later.
const conversations = [];
// Example shape when data arrives:
// {
//   id: "1",
//   name: "Green Earth Foundation",
//   lastMessage: "Thanks for reaching out!",
//   time: "10:24",
//   unreadCount: 2,
// }

export default function MessagesScreen({ navigation }) {
    const hasConversations = conversations.length > 0;

    const handleStartChat = () => {
        // navigation.navigate("NewChat");
    };

    const renderConversation = ({ item }) => (
        <TouchableOpacity
            style={styles.conversationRow}
            activeOpacity={0.7}
            // onPress={() => navigation.navigate("Chat", { conversationId: item.id })}
        >
            <View style={styles.avatar}>
                <Ionicons name="person-outline" size={22} color={COLORS.primary} />
            </View>

            <View style={styles.conversationContent}>
                <View style={styles.conversationTopRow}>
                    <Text style={styles.conversationName} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text style={styles.conversationTime}>{item.time}</Text>
                </View>

                <View style={styles.conversationBottomRow}>
                    <Text style={styles.conversationMessage} numberOfLines={1}>
                        {item.lastMessage}
                    </Text>
                    {item.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>
                                {item.unreadCount}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
                <TouchableOpacity
                    style={styles.headerAction}
                    activeOpacity={0.7}
                    onPress={handleStartChat}
                >
                    <Ionicons name="create-outline" size={22} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={18} color={COLORS.placeholder} />
                <Text style={styles.searchPlaceholder}>Search conversations</Text>
            </View>

            {/* Body */}
            {hasConversations ? (
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
                        <Ionicons
                            name="chatbubbles-outline"
                            size={38}
                            color={COLORS.primary}
                        />
                    </View>

                    <Text style={styles.emptyTitle}>No messages yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Start a conversation with an NGO or sponsor to begin
                        building partnerships.
                    </Text>

                    <TouchableOpacity
                        style={styles.startChatButton}
                        activeOpacity={0.85}
                        onPress={handleStartChat}
                    >
                        <Ionicons
                            name="chatbubble-ellipses-outline"
                            size={18}
                            color={COLORS.white}
                            style={styles.startChatIcon}
                        />
                        <Text style={styles.startChatText}>Start a Chat</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    /* Header */
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    headerAction: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },

    /* Search */
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        height: 48,
        marginHorizontal: 24,
        marginBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: COLORS.surface,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: 14,
    },
    searchPlaceholder: {
        marginLeft: 10,
        fontSize: 14,
        color: COLORS.placeholder,
    },

    /* Conversation list */
    listContent: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    conversationRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    conversationContent: {
        flex: 1,
    },
    conversationTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    conversationName: {
        flex: 1,
        fontSize: 15,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginRight: 8,
    },
    conversationTime: {
        fontSize: 12,
        color: COLORS.textSecondary,
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
        marginRight: 8,
    },
    unreadBadge: {
        minWidth: 20,
        height: 20,
        paddingHorizontal: 6,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    unreadBadgeText: {
        color: COLORS.white,
        fontSize: 11,
        fontWeight: "700",
    },
    separator: {
        height: 1,
        backgroundColor: COLORS.border,
        marginLeft: 66,
    },

    /* Empty state */
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
        paddingBottom: 60,
    },
    emptyIconWrapper: {
        width: 88,
        height: 88,
        borderRadius: 28,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        lineHeight: 21,
        color: COLORS.textSecondary,
        textAlign: "center",
        marginBottom: 28,
    },
    startChatButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: 52,
        paddingHorizontal: 26,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
    },
    startChatIcon: {
        marginRight: 8,
    },
    startChatText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: "700",
        letterSpacing: 0.4,
    },
});