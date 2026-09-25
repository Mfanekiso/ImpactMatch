
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

const COLORS = {
    background: "#0F172A",
    surface: "#1E293B",
    surfaceFocused: "#1B2637",
    border: "#334155",
    primary: "#10B981",
    accent: "#38BDF8",
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    error: "#EF4444",
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
        console.log("Firebase login error code:", error?.code);
        console.log("Firebase login error message:", error?.message);

        switch (error?.code) {
            case "auth/invalid-email":
                return "Please enter a valid email address.";

            case "auth/user-not-found":
                return "No account was found with this email address.";

            case "auth/wrong-password":
                return "The password you entered is incorrect.";

            case "auth/invalid-credential":
                return "The email or password is incorrect.";

            case "auth/user-disabled":
                return "This account has been disabled.";

            case "auth/too-many-requests":
                return "Too many login attempts. Please wait a moment and try again.";

            case "auth/network-request-failed":
                return "Network error. Please check your internet connection.";

            case "auth/invalid-api-key":
                return "There is a problem with the Firebase configuration.";

            default:
                return "Something went wrong while logging in. Please try again.";
        }
    };

    const handleLogin = async () => {
        Keyboard.dismiss();

        setLoginError("");

        if (!validateForm()) {
            console.log("Login validation failed:", {
                email: email.trim(),
                hasPassword: password.length > 0,
            });
            return;
        }

        setLoading(true);

        console.log("Login attempt started");
        console.log("Email:", email.trim());

        try {
            const userCredentials = await signInWithEmailAndPassword(
                auth,
                email.trim(),
                password
            );

            const user = userCredentials.user;

            console.log("Login successful");
            console.log("Firebase UID:", user.uid);
            console.log("Email:", user.email);

            const userSnap = await getDoc(doc(db, "users", user.uid));

            const userData = userSnap.exists()
                ? userSnap.data()
                : null;

            console.log("User Firestore data:", userData);

            if (!userData || !userData.role) {
                console.log("User setup incomplete: no role found");

                navigation.replace("UserType", {
                    uid: user.uid,
                });
            } else if (!userData.profileCompleted) {
                console.log("User setup incomplete: profile not completed");
                console.log("Role:", userData.role);

                navigation.replace(
                    userData.role === "ngo"
                        ? "NGOSetup"
                        : "SponsorSetup",
                    {
                        uid: user.uid,
                        role: userData.role,
                    }
                );
            } else {
                console.log("User profile complete");
                console.log("Navigating to main application");

                navigation.replace(
                    userData.role === "ngo"
                        ? "MainTabs"
                        : "SponsorTabs"
                );
            }
        } catch (error) {
            console.log("=================================");
            console.log("LOGIN FAILED");
            console.log("Error code:", error?.code);
            console.log("Error message:", error?.message);
            console.log("Full Firebase error:", error);
            console.log("=================================");

            const friendlyMessage = getFriendlyError(error);

            setLoginError(friendlyMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar
                barStyle="light-content"
                backgroundColor={COLORS.background}
            />

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
                                <View style={styles.brandBadge}>
                                    <Ionicons
                                        name="leaf"
                                        size={18}
                                        color={COLORS.primary}
                                    />
                                </View>

                                <Text style={styles.brandText}>
                                    Impact
                                    <Text style={styles.brandHighlight}>
                                        Match
                                    </Text>
                                </Text>
                            </View>

                            <Text style={styles.title}>
                                Welcome back
                            </Text>

                            <Text style={styles.subtitle}>
                                Log in to continue your impact journey.
                            </Text>
                        </View>

                        <View style={styles.form}>

                            {/* EMAIL */}
                            <View style={styles.fieldWrapper}>
                                <Text style={styles.fieldLabel}>
                                    EMAIL ADDRESS
                                </Text>

                                <View
                                    style={[
                                        styles.inputContainer,
                                        focusedField === "email" &&
                                            styles.inputContainerFocused,
                                        errors.email &&
                                            styles.inputContainerError,
                                    ]}
                                >
                                    <Ionicons
                                        name="mail-outline"
                                        size={19}
                                        color={
                                            errors.email
                                                ? COLORS.error
                                                : focusedField === "email"
                                                ? COLORS.primary
                                                : COLORS.textSecondary
                                        }
                                    />

                                    <TextInput
                                        style={styles.input}
                                        placeholder="you@example.com"
                                        placeholderTextColor={
                                            COLORS.textSecondary
                                        }
                                        value={email}
                                        onChangeText={(text) => {
                                            setEmail(text);

                                            if (errors.email) {
                                                setErrors((prev) => ({
                                                    ...prev,
                                                    email: "",
                                                }));
                                            }

                                            setLoginError("");
                                        }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!loading}
                                        onFocus={() =>
                                            setFocusedField("email")
                                        }
                                        onBlur={() =>
                                            setFocusedField(null)
                                        }
                                    />
                                </View>

                                {errors.email ? (
                                    <Text style={styles.errorText}>
                                        {errors.email}
                                    </Text>
                                ) : null}
                            </View>

                            {/* PASSWORD */}
                            <View style={styles.fieldWrapper}>
                                <Text style={styles.fieldLabel}>
                                    PASSWORD
                                </Text>

                                <View
                                    style={[
                                        styles.inputContainer,
                                        focusedField === "password" &&
                                            styles.inputContainerFocused,
                                        errors.password &&
                                            styles.inputContainerError,
                                    ]}
                                >
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={19}
                                        color={
                                            errors.password
                                                ? COLORS.error
                                                : focusedField === "password"
                                                ? COLORS.primary
                                                : COLORS.textSecondary
                                        }
                                    />

                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your password"
                                        placeholderTextColor={
                                            COLORS.textSecondary
                                        }
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text);

                                            if (errors.password) {
                                                setErrors((prev) => ({
                                                    ...prev,
                                                    password: "",
                                                }));
                                            }

                                            setLoginError("");
                                        }}
                                        secureTextEntry={!showPassword}
                                        editable={!loading}
                                        onFocus={() =>
                                            setFocusedField("password")
                                        }
                                        onBlur={() =>
                                            setFocusedField(null)
                                        }
                                    />

                                    <TouchableOpacity
                                        style={styles.eyeButton}
                                        onPress={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        disabled={loading}
                                    >
                                        <Ionicons
                                            name={
                                                showPassword
                                                    ? "eye-off-outline"
                                                    : "eye-outline"
                                            }
                                            size={19}
                                            color={COLORS.textSecondary}
                                        />
                                    </TouchableOpacity>
                                </View>

                                {errors.password ? (
                                    <Text style={styles.errorText}>
                                        {errors.password}
                                    </Text>
                                ) : null}
                            </View>

                            {/* FIREBASE ERROR */}
                            {loginError ? (
                                <View style={styles.loginErrorBox}>
                                    <Ionicons
                                        name="alert-circle-outline"
                                        size={20}
                                        color={COLORS.error}
                                    />

                                    <Text style={styles.loginErrorText}>
                                        {loginError}
                                    </Text>
                                </View>
                            ) : null}

                            {/* FORGOT PASSWORD */}
                            <TouchableOpacity
                                style={styles.forgotBtn}
                                activeOpacity={0.7}
                                onPress={() =>
                                    navigation.navigate("ForgotPassword")
                                }
                            >
                                <Text style={styles.forgotText}>
                                    Forgot password?
                                </Text>
                            </TouchableOpacity>

                            {/* LOGIN BUTTON */}
                            <TouchableOpacity
                                style={[
                                    styles.loginButton,
                                    loading &&
                                        styles.loginButtonDisabled,
                                ]}
                                activeOpacity={0.85}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Text
                                            style={
                                                styles.loginButtonText
                                            }
                                        >
                                            Log In
                                        </Text>

                                        <Ionicons
                                            name="arrow-forward"
                                            size={18}
                                            color="#FFFFFF"
                                            style={styles.loginButtonIcon}
                                        />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* FOOTER */}
                        <TouchableOpacity
                            style={styles.footer}
                            activeOpacity={0.7}
                            onPress={() =>
                                navigation.navigate("SignUp")
                            }
                        >
                            <Text style={styles.footerPrompt}>
                                Don't have an account?{" "}
                                <Text style={styles.footerLink}>
                                    Sign Up
                                </Text>
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
        marginLeft: 8,
        padding: 2,
    },

    errorText: {
        color: COLORS.error,
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
    },

    loginErrorBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(239, 68, 68, 0.10)",
        borderWidth: 1,
        borderColor: "rgba(239, 68, 68, 0.30)",
        borderRadius: 12,
        padding: 12,
        marginBottom: 18,
    },

    loginErrorText: {
        flex: 1,
        color: "#FCA5A5",
        fontSize: 13,
        lineHeight: 19,
        marginLeft: 9,
    },

    forgotBtn: {
        alignSelf: "flex-end",
        marginBottom: 28,
    },

    forgotText: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.primary,
    },

    loginButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: 56,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        boxShadow: "0px 8px 12px rgba(16, 185, 129, 0.35)",
        elevation: 6,
    },

    loginButtonDisabled: {
        opacity: 0.7,
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