import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../Backend/firebaseConfig";

const COLORS = {
    background: "#F8F6EE",
    surface: "#FFFFFF",
    primary: "#013e37",
    text: "#433327",
    muted: "#8C7A6B",
    border: "#E8DFD5",
    error: "#B42318",
};

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        Keyboard.dismiss();
        const normalizedEmail = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            Alert.alert("Enter a valid email", "Use the email address linked to your account.");
            return;
        }

        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, normalizedEmail);
            Alert.alert(
                "Check your email",
                "If an account uses this address, Firebase has sent a password reset link.",
                [{ text: "Back to login", onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            const message = error?.code === "auth/network-request-failed"
                ? "Check your internet connection and try again."
                : "We could not send a reset email. Please check the address and try again.";
            Alert.alert("Password reset failed", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={styles.content}>
                    <Text style={styles.title}>Reset your password</Text>
                    <Text style={styles.subtitle}>
                        Enter the email address for your account and we’ll send you a reset link.
                    </Text>
                    <Text style={styles.label}>Email address</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@example.com"
                        placeholderTextColor={COLORS.muted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        textContentType="emailAddress"
                        editable={!loading}
                        returnKeyType="send"
                        onSubmitEditing={handleReset}
                    />
                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleReset}
                        disabled={loading}
                        accessibilityRole="button"
                    >
                        {loading ? <ActivityIndicator color={COLORS.surface} /> : (
                            <Text style={styles.buttonText}>Send reset link</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.backText}>Back to login</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    flex: { flex: 1 },
    content: { flex: 1, justifyContent: "center", padding: 24 },
    title: { color: COLORS.text, fontSize: 28, fontWeight: "800" },
    subtitle: { color: COLORS.muted, fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 28 },
    label: { color: COLORS.text, fontSize: 13, fontWeight: "700", marginBottom: 8 },
    input: { height: 54, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, backgroundColor: COLORS.surface, paddingHorizontal: 16, color: COLORS.text, fontSize: 16 },
    button: { height: 54, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginTop: 18 },
    buttonDisabled: { opacity: 0.65 },
    buttonText: { color: COLORS.surface, fontWeight: "700", fontSize: 16 },
    backButton: { alignSelf: "center", padding: 14, marginTop: 8 },
    backText: { color: COLORS.primary, fontWeight: "700" },
});
