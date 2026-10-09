import React, { useEffect, useState } from "react";
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
} from "react-native";

import Ionicons from "@react-native-vector-icons/ionicons";

import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc,
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

    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!conversationId) {
            return;
        }

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
            },
            (error) => {
                console.log("Messages error:", error);
            }
        );

        return unsubscribe;
    }, [conversationId]);

    const sendMessage = async () => {
        const text = messageText.trim();

        if (!text || !currentUser) {
            return;
        }

        try {
            const messagesRef = collection(
                db,
                "conversations",
                conversationId,
                "messages"
            );

            await addDoc(messagesRef, {
                senderId: currentUser.uid,
                text: text,
                createdAt: serverTimestamp(),
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

            setMessageText("");
        } catch (error) {
            console.log("Send message error:", error);
        }
    };

    const renderMessage = ({ item }) => {
        const isMine =
            item.senderId === currentUser?.uid;

        return (
            <View
                style={[
                    styles.messageRow,
                    isMine && styles.myMessageRow,
                ]}
            >
                <View
                    style={[
                        styles.messageBubble,
                        isMine
                            ? styles.myMessageBubble
                            : styles.theirMessageBubble,
                    ]}
                >
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
                </View>
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
                            Organisation
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
});