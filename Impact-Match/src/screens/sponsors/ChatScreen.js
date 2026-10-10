import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from "react-native";

import Ionicons from "@react-native-vector-icons/ionicons";

import {
    collection,
    query,
    orderBy,
    onSnapshot,
    arrayUnion,
    increment,
    serverTimestamp,
    doc,
    getDoc,
    updateDoc,
    writeBatch,
    deleteDoc,
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

export default function ChatScreen({ navigation, route }) {
    const { conversationId, otherUserName } = route.params;

    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState("");

    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editingText, setEditingText] = useState("");
    const [otherUserId, setOtherUserId] = useState(null);
    const markingRead = useRef(false);

    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!conversationId) {
            return;
        }

        const conversationRef = doc(db, "conversations", conversationId);
        const unsubscribeConversation = onSnapshot(conversationRef, (snapshot) => {
            if (!snapshot.exists() || !currentUser) return;
            const data = snapshot.data();
            const otherId = data.participants?.find((id) => id !== currentUser.uid) || null;
            setOtherUserId(otherId);
            if ((Number(data.unreadCount?.[currentUser.uid]) || 0) > 0) {
                updateDoc(conversationRef, { [`unreadCount.${currentUser.uid}`]: 0 }).catch((error) => {
                    console.log("Could not clear unread count:", error?.message);
                });
            }
        });

        const messagesRef = collection(
            db,
            "conversations",
            conversationId,
            "messages"
        );

        const messagesQuery = query(
            messagesRef,
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(
            messagesQuery,
            (snapshot) => {
                const messageList = snapshot.docs.map((document) => ({
                    id: document.id,
                    ...document.data(),
                }));

                setMessages(messageList);
                const unread = snapshot.docs.filter((document) => {
                    const message = document.data();
                    return message.senderId !== currentUser?.uid && !message.readBy?.includes(currentUser?.uid);
                });
                if (unread.length && !markingRead.current && currentUser) {
                    markingRead.current = true;
                    const batch = writeBatch(db);
                    unread.forEach((messageDoc) => batch.update(messageDoc.ref, { readBy: arrayUnion(currentUser.uid) }));
                    batch.commit().catch((error) => console.log("Could not mark messages read:", error?.message)).finally(() => {
                        markingRead.current = false;
                    });
                }
            },
            (error) => {
                console.log("Messages error:", error);
            }
        );

        return () => {
            unsubscribe();
            unsubscribeConversation();
        };
    }, [conversationId]);

    const sendMessage = async () => {
        const text = messageText.trim();

        if (!text || !currentUser) {
            return;
        }

        try {
            const conversationRef = doc(db, "conversations", conversationId);
            const conversationSnapshot = await getDoc(conversationRef);
            const participants = conversationSnapshot.data()?.participants || [];
            const recipientId = otherUserId || participants.find((id) => id !== currentUser.uid);
            const messageRef = doc(collection(db, "conversations", conversationId, "messages"));
            const batch = writeBatch(db);
            batch.set(messageRef, {
                senderId: currentUser.uid,
                text: text,
                createdAt: serverTimestamp(),
                readBy: [currentUser.uid],
            });
            const conversationUpdate = {
                lastMessage: text,
                lastMessageAt: serverTimestamp(),
            };
            if (recipientId) conversationUpdate[`unreadCount.${recipientId}`] = increment(1);
            batch.update(conversationRef, conversationUpdate);
            await batch.commit();

            setMessageText("");
        } catch (error) {
            console.log("Send message error:", error);
        }
    };

    const formatMessageTime = (timestamp) => {
        if (!timestamp) {
            return "";
        }

        const date = timestamp.toDate
            ? timestamp.toDate()
            : new Date(timestamp);

        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const startEditing = (message) => {
        setEditingMessageId(message.id);
        setEditingText(message.text);
    };

    const cancelEditing = () => {
        setEditingMessageId(null);
        setEditingText("");
    };

    const saveEditedMessage = async () => {
        const text = editingText.trim();

        if (!text || !editingMessageId) {
            return;
        }

        try {
            const messageRef = doc(
                db,
                "conversations",
                conversationId,
                "messages",
                editingMessageId
            );

            await updateDoc(messageRef, {
                text: text,
            });

            const conversationRef = doc(
                db,
                "conversations",
                conversationId
            );

            await updateDoc(conversationRef, {
                lastMessage: text,
                lastMessageAt: serverTimestamp(),
            });

            cancelEditing();
        } catch (error) {
            console.log("Edit message error:", error);
        }
    };

    const deleteMessage = (messageId) => {
        Alert.alert(
            "Delete message",
            "Are you sure you want to delete this message?",
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
                            const messageRef = doc(
                                db,
                                "conversations",
                                conversationId,
                                "messages",
                                messageId
                            );

                            await deleteDoc(messageRef);
                        } catch (error) {
                            console.log(
                                "Delete message error:",
                                error
                            );
                        }
                    },
                },
            ]
        );
    };

    const handleMessageLongPress = (message) => {
        // Only allow the sender to edit/delete their own message.
        if (message.senderId !== currentUser?.uid) {
            return;
        }

        Alert.alert(
            "Message",
            "What would you like to do?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Edit",
                    onPress: () => startEditing(message),
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteMessage(message.id),
                },
            ]
        );
    };

    const renderMessage = ({ item }) => {
        const isMine =
            item.senderId === currentUser?.uid;

        const isEditing =
            editingMessageId === item.id;

        return (
            <View
                style={[
                    styles.messageRow,
                    isMine && styles.myMessageRow,
                ]}
            >
                <TouchableOpacity
                    activeOpacity={0.8}
                    onLongPress={() =>
                        handleMessageLongPress(item)
                    }
                    delayLongPress={500}
                    style={[
                        styles.messageBubble,
                        isMine
                            ? styles.myMessageBubble
                            : styles.theirMessageBubble,
                    ]}
                >
                    {isEditing ? (
                        <View>
                            <TextInput
                                style={styles.editInput}
                                value={editingText}
                                onChangeText={setEditingText}
                                multiline
                                autoFocus
                            />

                            <View style={styles.editActions}>
                                <TouchableOpacity
                                    onPress={cancelEditing}
                                    style={styles.cancelButton}
                                >
                                    <Text
                                        style={
                                            styles.cancelButtonText
                                        }
                                    >
                                        Cancel
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={saveEditedMessage}
                                    style={styles.saveButton}
                                >
                                    <Text
                                        style={
                                            styles.saveButtonText
                                        }
                                    >
                                        Save
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <>
                            <Text
                                style={[
                                    styles.messageText,
                                    isMine
                                        ? styles.myMessageText
                                        : styles.theirMessageText,
                                ]}
                            >
                                {item.text}
                            </Text>

                            <View style={styles.timeRow}>
                                <Text
                                    style={[
                                        styles.messageTime,
                                        isMine
                                            ? styles.myMessageTime
                                            : styles.theirMessageTime,
                                    ]}
                                >
                                    {formatMessageTime(
                                        item.createdAt
                                    )}
                                </Text>
                                {isMine && <Text style={[styles.readStatus, item.readBy?.includes(otherUserId) && styles.readStatusRead]}>{item.readBy?.includes(otherUserId) ? "Read" : "Sent"}</Text>}
                            </View>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={
                    Platform.OS === "ios"
                        ? "padding"
                        : undefined
                }
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color={COLORS.textPrimary}
                        />
                    </TouchableOpacity>

                    <View style={styles.headerInfo}>
                        <Text
                            style={styles.headerName}
                            numberOfLines={1}
                        >
                            {otherUserName || "Conversation"}
                        </Text>

                        <Text style={styles.headerStatus}>
                            Conversation
                        </Text>
                    </View>
                </View>

                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                />

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor="#94A3B8"
                        value={messageText}
                        onChangeText={setMessageText}
                        multiline
                    />

                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            !messageText.trim() &&
                                styles.sendButtonDisabled,
                        ]}
                        onPress={sendMessage}
                        disabled={!messageText.trim()}
                    >
                        <Ionicons
                            name="send"
                            size={20}
                            color={COLORS.white}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    keyboardContainer: {
        flex: 1,
    },

    header: {
        height: 64,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },

    backButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
    },

    headerInfo: {
        flex: 1,
    },

    headerName: {
        fontSize: 17,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },

    headerStatus: {
        marginTop: 2,
        fontSize: 12,
        color: COLORS.textSecondary,
    },

    messagesList: {
        paddingHorizontal: 16,
        paddingVertical: 20,
        flexGrow: 1,
    },

    messageRow: {
        width: "100%",
        alignItems: "flex-start",
        marginBottom: 10,
    },

    myMessageRow: {
        alignItems: "flex-end",
    },

    messageBubble: {
        maxWidth: "78%",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
    },

    myMessageBubble: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
    },

    theirMessageBubble: {
        backgroundColor: COLORS.surface,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    messageText: {
        fontSize: 15,
        lineHeight: 21,
    },

    myMessageText: {
        color: COLORS.white,
    },

    theirMessageText: {
        color: COLORS.textPrimary,
    },

    timeRow: {
        marginTop: 4,
        alignItems: "flex-end",
    },

    messageTime: {
        fontSize: 10,
    },
    readStatus: { fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.75)", marginTop: 2 },
    readStatusRead: { color: "#D8F7E8" },

    myMessageTime: {
        color: "rgba(255, 255, 255, 0.75)",
    },

    theirMessageTime: {
        color: COLORS.textSecondary,
    },

    inputContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.white,
    },

    input: {
        flex: 1,
        maxHeight: 100,
        minHeight: 44,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 22,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        fontSize: 15,
        color: COLORS.textPrimary,
    },

    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 8,
    },

    sendButtonDisabled: {
        opacity: 0.45,
    },

    editInput: {
        minWidth: 180,
        maxWidth: 260,
        padding: 8,
        borderRadius: 8,
        backgroundColor: COLORS.white,
        color: COLORS.textPrimary,
        fontSize: 15,
    },

    editActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 8,
        gap: 8,
    },

    cancelButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
    },

    cancelButtonText: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontWeight: "600",
    },

    saveButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
    },

    saveButtonText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: "600",
    },
});
