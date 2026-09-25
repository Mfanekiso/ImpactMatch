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

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../../Backend/firebaseConfig";

const COLORS = {
    background: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceFocused: "#F9FAFB",
    border: "#E5E7EB",
    primary: "#10B981",
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    placeholder: "#94A3B8",
    white: "#FFFFFF",
};

export default function SignUpScreen({ navigation }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    const handleSignUp = async () => {
        console.log("Create Account button pressed");

        if (
            !name.trim() ||
            !email.trim() ||
            !password.trim() ||
            !confirmPassword.trim()
        ) {
            console.log("Validation failed: empty field");

            Alert.alert(
                "Missing Information",
                "Please complete all fields."
            );

            return;
        }

        if (password !== confirmPassword) {
            console.log("Validation failed: passwords do not match");

            Alert.alert(
                "Password Error",
                "Passwords do not match."
            );

            return;
        }

        console.log("Validation passed");
        console.log("Creating Firebase account...");
        
        
        try {
            const userCredentials =
            await createUserWithEmailAndPassword(
                auth,
                email.trim(),
                password
            );
            
            const user = userCredentials.user;
            const uid = user.uid;
            
                        navigation.navigate("UserType", {
                            uid: uid,
                        });

            console.log("Firebase account created");
            console.log("User UID:", uid);

            await setDoc(doc(db, "users", uid), {
                full_name: name.trim(),
                email: email.trim(),
            });

            console.log("User saved to Firestore");

            console.log("Navigating to UserType");
        } catch (error) {
            console.log("SIGN UP ERROR:", error);

            Alert.alert(
                "Registration Error",
                error.message
            );
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor={COLORS.background}
            />

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >

                        <View style={styles.stepperContainer}>
                            <View style={[styles.stepCircle, styles.stepActive]}>
                                <Text style={styles.stepTextActive}>1</Text>
                            </View>

                            <View style={styles.stepLine} />

                            <View style={[styles.stepCircle, styles.stepInactive]}>
                                <Text style={styles.stepTextInactive}>2</Text>
                            </View>

                            <View style={styles.stepLine} />

                            <View style={[styles.stepCircle, styles.stepInactive]}>
                                <Text style={styles.stepTextInactive}>3</Text>
                            </View>
                        </View>

                        <View style={styles.header}>
                            <Text style={styles.title}>Create Account</Text>

                            <Text style={styles.subtitle}>
                                Join EcoImpact and start making a difference.
                            </Text>
                        </View>

                        <View style={styles.form}>

                            <View style={styles.fieldWrapper}>
                                <Text style={styles.fieldLabel}>
                                    FULL NAME
                                </Text>

                                <View
                                    style={[
                                        styles.inputContainer,
                                        focusedField === "name" &&
                                            styles.inputContainerFocused,
                                    ]}
                                >
                                    <Ionicons
                                        name="person-outline"
                                        size={19}
                                        color={
                                            focusedField === "name"
                                                ? COLORS.primary
                                                : COLORS.textSecondary
                                        }
                                    />

                                    <TextInput
                                        style={styles.input}
                                        placeholder="John Doe"
                                        placeholderTextColor={
                                            COLORS.placeholder
                                        }
                                        value={name}
                                        onChangeText={setName}
                                        onFocus={() =>
                                            setFocusedField("name")
                                        }
                                        onBlur={() =>
                                            setFocusedField(null)
                                        }
                                    />
                                </View>
                            </View>

                            <View style={styles.fieldWrapper}>
                                <Text style={styles.fieldLabel}>
                                    EMAIL ADDRESS
                                </Text>

                                <View
                                    style={[
                                        styles.inputContainer,
                                        focusedField === "email" &&
                                            styles.inputContainerFocused,
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
                                        placeholderTextColor={
                                            COLORS.placeholder
                                        }
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        onFocus={() =>
                                            setFocusedField("email")
                                        }
                                        onBlur={() =>
                                            setFocusedField(null)
                                        }
                                    />
                                </View>
                            </View>

                            <View style={styles.fieldWrapper}>
                                <Text style={styles.fieldLabel}>
                                    PASSWORD
                                </Text>

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
                                        placeholder="Create a password"
                                        placeholderTextColor={
                                            COLORS.placeholder
                                        }
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
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
                            </View>

                            <View style={styles.fieldWrapper}>
                                <Text style={styles.fieldLabel}>
                                    CONFIRM PASSWORD
                                </Text>

                                <View
                                    style={[
                                        styles.inputContainer,
                                        focusedField === "confirmPassword" &&
                                            styles.inputContainerFocused,
                                    ]}
                                >
                                    <Ionicons
                                        name="shield-checkmark-outline"
                                        size={19}
                                        color={
                                            focusedField === "confirmPassword"
                                                ? COLORS.primary
                                                : COLORS.textSecondary
                                        }
                                    />

                                    <TextInput
                                        style={styles.input}
                                        placeholder="Repeat your password"
                                        placeholderTextColor={
                                            COLORS.placeholder
                                        }
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={
                                            !showConfirmPassword
                                        }
                                        onFocus={() =>
                                            setFocusedField("confirmPassword")
                                        }
                                        onBlur={() =>
                                            setFocusedField(null)
                                        }
                                    />

                                    <TouchableOpacity
                                        style={styles.eyeButton}
                                        onPress={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword
                                            )
                                        }
                                    >
                                        <Ionicons
                                            name={
                                                showConfirmPassword
                                                    ? "eye-off-outline"
                                                    : "eye-outline"
                                            }
                                            size={19}
                                            color={COLORS.textSecondary}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.signUpButton}
                                activeOpacity={0.85}
                                onPress={handleSignUp}
                            >
                                <Text style={styles.signUpButtonText}>
                                    Create Account
                                </Text>

                                <Ionicons
                                    name="arrow-forward"
                                    size={18}
                                    color="#FFFFFF"
                                    style={styles.signUpButtonIcon}
                                />
                            </TouchableOpacity>

                        </View>

                        <TouchableOpacity
                            style={styles.footer}
                            onPress={() =>
                                navigation.navigate("Login")
                            }
                        >
                            <Text style={styles.footerPrompt}>
                                Already have an account?{" "}
                                <Text style={styles.footerLink}>
                                    Log In
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
    },

    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 28,
        paddingTop: 24,
        paddingBottom: 32,
    },

    stepperContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 32,
    },

    stepCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
    },

    stepActive: {
        backgroundColor: COLORS.primary,
    },

    stepInactive: {
        backgroundColor: COLORS.white,
        borderWidth: 1.5,
        borderColor: COLORS.border,
    },

    stepTextActive: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: "700",
    },

    stepTextInactive: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: "600",
    },

    stepLine: {
        flex: 1,
        height: 1.5,
        backgroundColor: COLORS.border,
        marginHorizontal: 6,
    },

    header: {
        marginBottom: 32,
    },

    title: {
        fontSize: 30,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 8,
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

    signUpButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: 56,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        marginTop: 10,
        elevation: 4,
    },

    signUpButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "700",
    },

    signUpButtonIcon: {
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
        color: COLORS.primary,
        fontWeight: "600",
    },
});
