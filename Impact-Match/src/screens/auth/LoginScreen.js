import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    SafeAreaView,
    StatusBar,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

const COLORS = {
    background: "#0F172A", // matches WelcomeScreen
    surface: "#1E293B",
    surfaceFocused: "#1B2637",
    border: "#334155",
    primary: "#10B981", // emerald green (kept)
    primaryGlow: "rgba(16, 185, 129, 0.35)",
    accent: "#38BDF8", // soft blue link (matches WelcomeScreen)
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
};

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    const handleLogin = () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Missing Information", "Please enter your email and password.");
            return;
        }

        navigation.navigate("UserType");
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        bounces={true}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.brandRow}>
                                <View style={styles.brandBadge}>
                                    <Ionicons name="leaf" size={18} color={COLORS.primary} />
                                </View>
                                <Text style={styles.brandText}>
                                    Impact<Text style={styles.brandHighlight}>Match</Text>
                                </Text>
                            </View>

                            <Text style={styles.title}>Welcome back</Text>
                            <Text style={styles.subtitle}>
                                Log in to continue your impact journey.
                            </Text>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            {/* Email */}
                            <View style={styles.fieldWrapper}>
                                <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                                <View
                                    style={[
                                        styles.inputContainer,
                                        focusedField === "email" && styles.inputContainerFocused,
                                    ]}
                                >
                                    <Ionicons
                                        name="mail-outline"
                                        size={19}
                                        color={
                                            focusedField === "email"
                                                ? COLORS.primary
                                                : COLORS.textSecondary
                                        }
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="you@example.com"
                                        placeholderTextColor={COLORS.textSecondary}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        onFocus={() => setFocusedField("email")}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                </View>
                            </View>

                            {/* Password */}
                            <View style={styles.fieldWrapper}>
                                <Text style={styles.fieldLabel}>PASSWORD</Text>
                                <View
                                    style={[
                                        styles.inputContainer,
                                        focusedField === "password" &&
                                            styles.inputContainerFocused,
                                    ]}
                                >
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={19}
                                        color={
                                            focusedField === "password"
                                                ? COLORS.primary
                                                : COLORS.textSecondary
                                        }
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your password"
                                        placeholderTextColor={COLORS.textSecondary}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        onFocus={() => setFocusedField("password")}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeButton}
                                        onPress={() => setShowPassword(!showPassword)}
                                        activeOpacity={0.7}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons
                                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                                            size={19}
                                            color={COLORS.textSecondary}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Forgot password */}
                            <TouchableOpacity
                                style={styles.forgotBtn}
                                activeOpacity={0.7}
                                onPress={() =>
                                    Alert.alert(
                                        "Reset Password",
                                        "Password reset instructions sent."
                                    )
                                }
                            >
                                <Text style={styles.forgotText}>Forgot password?</Text>
                            </TouchableOpacity>

                            {/* Log In */}
                            <TouchableOpacity
                                style={styles.loginButton}
                                activeOpacity={0.85}
                                onPress={handleLogin}
                            >
                                <Text style={styles.loginButtonText}>Log In</Text>
                                <Ionicons
                                    name="arrow-forward"
                                    size={18}
                                    color="#FFFFFF"
                                    style={styles.loginButtonIcon}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <TouchableOpacity
                            style={styles.footer}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate("SignUp")}
                        >
                            <Text style={styles.footerPrompt}>
                                Don't have an account?{" "}
                                <Text style={styles.footerLink}>Sign Up</Text>
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    flex: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 28,
        paddingTop: 24,
        paddingBottom: 32,
    },

    /* Header */
    header: {
        marginBottom: 40,
    },
    brandRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 40,
    },
    brandBadge: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: "rgba(16, 185, 129, 0.12)",
        borderWidth: 1,
        borderColor: "rgba(16, 185, 129, 0.30)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    brandText: {
        fontSize: 20,
        fontWeight: "800",
        color: COLORS.textPrimary,
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    brandHighlight: {
        color: COLORS.primary,
    },
    title: {
        fontSize: 30,
        fontWeight: "700",
        color: COLORS.textPrimary,
        lineHeight: 38,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },

    /* Form */
    form: {
        flex: 1,
    },
    fieldWrapper: {
        marginBottom: 18,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        height: 56,
        paddingHorizontal: 16,
        backgroundColor: COLORS.surface,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: 16,
    },
    inputContainerFocused: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.surfaceFocused,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        paddingVertical: 0,
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    eyeButton: {
        marginLeft: 8,
        padding: 2,
    },

    /* Forgot */
    forgotBtn: {
        alignSelf: "flex-end",
        marginBottom: 28,
    },
    forgotText: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.primary,
    },

    /* Primary CTA */
    loginButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: 56,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    loginButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    loginButtonIcon: {
        marginLeft: 8,
    },

    /* Footer */
    footer: {
        marginTop: 32,
        alignItems: "center",
    },
    footerPrompt: {
        fontSize: 15,
        color: COLORS.textSecondary,
    },
    footerLink: {
        color: COLORS.accent,
        fontWeight: "600",
    },
});