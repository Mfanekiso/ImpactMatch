import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../Backend/firebaseConfig";

// ─── LUXURY COLOR PALETTE ───────────────────────────────────────────────
const COLORS = {
    background: "#F8F6EE",       // Cream base
    surface: "#FFFFFF",          // Clean white
    border: "#E8DFD5",
    primary: "#D9C982",          // Soft Luxury Gold
    primarySoft: "rgba(217, 201, 130, 0.15)",
    primaryGlow: "rgba(217, 201, 130, 0.25)",
    emerald: "#059669",          // Vibrant Emerald for the primary action
    textPrimary: "#433327",      // Warm Bronze
    textSecondary: "#8C7A6B",    // Muted taupe
    placeholder: "#B8A99A",
    error: "#DC2626",            // Elegant red
    errorSoft: "rgba(220, 38, 38, 0.1)",
    white: "#FFFFFF",
};

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [loginError, setLoginError] = useState("");

    const validateEmail = (value) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!email.trim()) {
            newErrors.email = "Email address is required.";
        } else if (!validateEmail(email.trim())) {
            newErrors.email = "Please enter a valid email address.";
        }

        if (!password) {
            newErrors.password = "Password is required.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const getFriendlyError = (error) => {
        switch (error?.code) {
            case "auth/invalid-email": return "Please enter a valid email address.";
            case "auth/user-not-found": return "No account was found with this email address.";
            case "auth/wrong-password": return "The password you entered is incorrect.";
            case "auth/invalid-credential": return "The email or password is incorrect.";
            case "auth/user-disabled": return "This account has been disabled.";
            case "auth/too-many-requests": return "Too many login attempts. Please wait a moment.";
            case "auth/network-request-failed": return "Network error. Please check your internet connection.";
            default: return "Something went wrong while logging in. Please try again.";
        }
    };

    const handleLogin = async () => {
        Keyboard.dismiss();
        setLoginError("");

        if (!validateForm()) return;

        setLoading(true);

        try {
            const userCredentials = await signInWithEmailAndPassword(
                auth,
                email.trim(),
                password
            );

            const user = userCredentials.user;
            const userSnap = await getDoc(doc(db, "users", user.uid));
            const userData = userSnap.exists() ? userSnap.data() : null;

            if (!userData || !userData.role) {
                navigation.replace("UserType", { uid: user.uid });
            } else if (!userData.profileCompleted) {
                navigation.replace(
                    userData.role === "ngo" ? "NGOSetup" : "SponsorSetup",
                    { uid: user.uid, role: userData.role }
                );
            } else {
                navigation.replace(userData.role === "ngo" ? "MainTabs" : "SponsorTabs");
            }
        } catch (error) {
            setLoginError(getFriendlyError(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* ─── Decorative Background Elements ─── */}
            <View style={styles.topRightGlow} />
            <View style={styles.bottomLeftGlow} />

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
                    >
                        <View style={styles.header}>
                            <View style={styles.brandRow}>
                                <Text style={styles.brandText}>
                                    IMPACT<Text style={styles.brandHighlight}>MATCH</Text>
                                </Text>
                            </View>

                            <Text style={styles.title}>Welcome back</Text>
                            <Text style={styles.subtitle}>Log in to continue your impact journey.</Text>
                        </View>

                        <View style={styles.form}>
                            {/* EMAIL */}
                            <View style={styles.fieldWrapper}>
                                <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                                <View
                                    style={[
                                        styles.inputContainer,
                                        focusedField === "email" && styles.inputContainerFocused,
                                        errors.email && styles.inputContainerError,
                                    ]}
                                >
                                    <Ionicons
                                        name="mail-outline"
                                        size={20}
                                        color={
                                            errors.email
                                                ? COLORS.error
                                                : focusedField === "email"
                                                ? COLORS.primary
                                                : COLORS.placeholder
                                        }
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="you@example.com"
                                        placeholderTextColor={COLORS.placeholder}
                                        value={email}
                                        onChangeText={(text) => {
                                            setEmail(text);
                                            if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                                            setLoginError("");
                                        }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!loading}
                                        onFocus={() => setFocusedField("email")}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                </View>
                                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                            </View>

                            {/* PASSWORD */}
                            <View style={styles.fieldWrapper}>
                                <Text style={styles.fieldLabel}>PASSWORD</Text>
                                <View
                                    style={[
                                        styles.inputContainer,
                                        focusedField === "password" && styles.inputContainerFocused,
                                        errors.password && styles.inputContainerError,
                                    ]}
                                >
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={20}
                                        color={
                                            errors.password
                                                ? COLORS.error
                                                : focusedField === "password"
                                                ? COLORS.primary
                                                : COLORS.placeholder
                                        }
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your password"
                                        placeholderTextColor={COLORS.placeholder}
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                                            setLoginError("");
                                        }}
                                        secureTextEntry={!showPassword}
                                        editable={!loading}
                                        onFocus={() => setFocusedField("password")}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeButton}
                                        onPress={() => setShowPassword(!showPassword)}
                                        disabled={loading}
                                    >
                                        <Ionicons
                                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                                            size={20}
                                            color={COLORS.textSecondary}
                                        />
                                    </TouchableOpacity>
                                </View>
                                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                            </View>

                            {/* FIREBASE ERROR */}
                            {loginError ? (
                                <View style={styles.loginErrorBox}>
                                    <Ionicons name="alert-circle" size={20} color={COLORS.error} />
                                    <Text style={styles.loginErrorText}>{loginError}</Text>
                                </View>
                            ) : null}

                            {/* FORGOT PASSWORD */}
                            <TouchableOpacity
                                style={styles.forgotBtn}
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate("ForgotPassword")}
                            >
                                <Text style={styles.forgotText}>Forgot password?</Text>
                            </TouchableOpacity>

                            {/* LOGIN BUTTON */}
                            <TouchableOpacity
                                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                                activeOpacity={0.85}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={COLORS.white} />
                                ) : (
                                    <>
                                        <Text style={styles.loginButtonText}>Log In</Text>
                                        <Ionicons name="arrow-forward" size={18} color={COLORS.white} style={styles.loginButtonIcon} />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* FOOTER */}
                        <TouchableOpacity
                            style={styles.footer}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate("SignUp")}
                        >
                            <Text style={styles.footerPrompt}>
                                Don't have an account? <Text style={styles.footerLink}>Sign Up</Text>
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
    },
    /* Decorative Abstract Glows */
    topRightGlow: {
        position: 'absolute',
        top: -100,
        right: -80,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: COLORS.primaryGlow,
        opacity: 0.6,
    },
    bottomLeftGlow: {
        position: 'absolute',
        bottom: -50,
        left: -100,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(5, 150, 105, 0.05)', // extremely soft emerald glow
    },

    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 32,
        paddingTop: 40,
        paddingBottom: 40,
    },

    header: {
        marginBottom: 48,
    },
    brandRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 48,
    },
    brandBadge: {
        width: 44,
        height: 44,
        borderRadius: 16,
        backgroundColor: "rgba(5, 150, 105, 0.1)", // emerald tint
        borderWidth: 1,
        borderColor: "rgba(5, 150, 105, 0.2)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    brandText: {
        fontSize: 18,
        fontWeight: "800",
        color: COLORS.textPrimary,
        letterSpacing: 2,
    },
    brandHighlight: {
        color: COLORS.primary, // Gold highlight for the MATCH text
    },
    title: {
        fontSize: 34,
        fontWeight: "700",
        color: COLORS.textPrimary,
        lineHeight: 42,
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.textSecondary,
        lineHeight: 24,
    },

    form: {
        flex: 1,
    },
    fieldWrapper: {
        marginBottom: 24,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1.5,
        color: COLORS.textSecondary,
        marginBottom: 10,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        height: 60,
        paddingHorizontal: 18,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 20,
        shadowColor: COLORS.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 1,
    },
    inputContainerFocused: {
        borderColor: COLORS.primary,
        shadowOpacity: 0.08,
        shadowColor: COLORS.primary,
        elevation: 4,
    },
    inputContainerError: {
        borderColor: COLORS.error,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        paddingVertical: 0,
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    eyeButton: {
        padding: 4,
    },
    errorText: {
        color: COLORS.error,
        fontSize: 12,
        marginTop: 8,
        marginLeft: 4,
        fontWeight: "500",
    },

    loginErrorBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.errorSoft,
        borderWidth: 1,
        borderColor: "rgba(220, 38, 38, 0.2)",
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    loginErrorText: {
        flex: 1,
        color: COLORS.error,
        fontSize: 13,
        lineHeight: 19,
        marginLeft: 12,
        fontWeight: "500",
    },

    forgotBtn: {
        alignSelf: "flex-end",
        marginBottom: 32,
    },
    forgotText: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.emerald, // Emerald pops nicely here
    },

    loginButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: 60,
        borderRadius: 30, // Luxury pill shape
        backgroundColor: COLORS.emerald,
        shadowColor: COLORS.emerald,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    loginButtonDisabled: {
        opacity: 0.6,
        shadowOpacity: 0,
    },
    loginButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    loginButtonIcon: {
        marginLeft: 8,
    },

    footer: {
        marginTop: 40,
        alignItems: "center",
    },
    footerPrompt: {
        fontSize: 15,
        color: COLORS.textSecondary,
    },
    footerLink: {
        color: COLORS.emerald,
        fontWeight: "700",
    },
});