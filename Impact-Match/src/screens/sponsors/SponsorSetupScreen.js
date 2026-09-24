import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    SafeAreaView,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
} from "react-native";
import Ionicons from '@react-native-vector-icons/ionicons';

// Firebase imports
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../Backend/firebaseConfig"; // Adjust path if needed

const COLORS = {
    background: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceFocused: "#F9FAFB",
    border: "#E5E7EB",
    primary: "#10B981", // emerald green
    primaryLight: "rgba(16, 185, 129, 0.10)",
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    placeholder: "#94A3B8",
    white: "#FFFFFF",
};

export default function SponsorSetupScreen({ route, navigation }) {
    // 1. Extract the uid and role passed from the previous screen
    const { uid, role } = route.params || {};

    const [organisationName, setOrganisationName] = useState("");
    const [industry, setIndustry] = useState("");
    const [location, setLocation] = useState("");
    const [fundingBudget, setFundingBudget] = useState("");
    const [preferredCauses, setPreferredCauses] = useState("");
    const [focusedField, setFocusedField] = useState(null);

    // 2. Make this function async to connect to Firestore
    const handleContinue = async () => {
        if (
            !organisationName.trim() ||
            !industry.trim() ||
            !location.trim() ||
            !fundingBudget.trim() ||
            !preferredCauses.trim()
        ) {
            Alert.alert(
                "Missing Information",
                "Please complete all fields before continuing."
            );
            return;
        }

        try {
            // 3. Update the existing document in the "users" collection
            const userRef = doc(db, "users", uid);
            await updateDoc(userRef, {
                role: role,
                organisationName: organisationName,
                industry: industry,
                location: location,
                fundingBudget: fundingBudget,
                preferredCauses: preferredCauses,
                profileCompleted: true // Flag to indicate profile setup is done
            });

            // 4. Navigate to the Sponsor home screen
            navigation.navigate('SponsorTabs', {
                screen: 'Home'
            });

        } catch (error) {
            Alert.alert("Error Saving Profile", error.message);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

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
                        <View style={styles.stepperContainer}>
                            <View style={[styles.stepCircle, styles.stepActive]}>
                                <Text style={styles.stepTextActive}>1</Text>
                            </View>
                            <View style={styles.stepLine} />

                            <View style={[styles.stepCircle, styles.stepActive]}>
                                <Text style={styles.stepTextActive}>2</Text>
                            </View>
                            <View style={styles.stepLine} />

                            <View style={[styles.stepCircle, styles.stepActive]}>
                                <Text style={styles.stepTextActive}>3</Text>
                            </View>
                        </View>

                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>
                                Tell us about your organisation
                            </Text>
                            <Text style={styles.subtitle}>
                                Complete your profile to help us find suitable NGOs to partner with.
                            </Text>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            {/* Organisation Name */}
                            <View style={styles.fieldWrapper}>
                                <Text style={styles.fieldLabel}>ORGANISATION NAME</Text>
                                <View
                                    style={[
                                        styles.inputContainer,
                                        focusedField === "organisationName" &&
                                            styles.inputContainerFocused,
                                    ]}
                                >
                                    <Ionicons
                                        name="business-outline"
                                        size={19}
                                        color={
                                            focusedField === "organisationName"
                                                ? COLORS.primary
                                                : COLORS.textSecondary
                                        }
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter organisation name"
                                        placeholderTextColor={COLORS.placeholder}
                                        value={organisationName}
                                        onChangeText={setOrganisationName}
                                        onFocus={() => setFocusedField("organisationName")}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                </View>
                            </View>

                            {/* Industry */}
                            <View style={styles.fieldWrapper}>
                                <Text style={styles.fieldLabel}>INDUSTRY</Text>
                                <View
                                    style={[
                                        styles.inputContainer,
                                        focusedField === "industry" &&
                                            styles.inputContainerFocused,
                                    ]}
                                >
                                    <Ionicons
                                        name="briefcase-outline"
                                        size={19}
                                        color={
                                            focusedField === "industry"
                                                ? COLORS.primary
                                                : COLORS.textSecondary
                                        }
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Technology, Finance, Retail"
                                        placeholderTextColor={COLORS.placeholder}
                                        value={industry}
                                        onChangeText={setIndustry}
                                        onFocus={() => setFocusedField("industry")}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                </View>
                            </View>

                            {/* Location */}
                            <View style={styles.fieldWrapper}>
                                <Text style={styles.fieldLabel}>LOCATION</Text>
                                <View
                                    style={[
                                        styles.inputContainer,
                                        focusedField === "location" &&
                                            styles.inputContainerFocused,
                                    ]}
                                >
                                    <Ionicons
                                        name="location-outline"
                                        size={19}
                                        color={
                                            focusedField === "location"
                                                ? COLORS.primary
                                                : COLORS.textSecondary
                                        }
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Cape Town, Western Cape"
                                        placeholderTextColor={COLORS.placeholder}
                                        value={location}
                                        onChangeText={setLocation}
                                        onFocus={() => setFocusedField("location")}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                </View>
                            </View>

                            {/* Funding Budget */}
                            <View style={styles.fieldWrapper}>
                                <Text style={styles.fieldLabel}>ANNUAL FUNDING BUDGET</Text>
                                <View
                                    style={[
                                        styles.inputContainer,
                                        focusedField === "fundingBudget" &&
                                            styles.inputContainerFocused,
                                    ]}
                                >
                                    <Ionicons
                                        name="cash-outline"
                                        size={19}
                                        color={
                                            focusedField === "fundingBudget"
                                                ? COLORS.primary
                                                : COLORS.textSecondary
                                        }
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. R500 000"
                                        placeholderTextColor={COLORS.placeholder}
                                        value={fundingBudget}
                                        onChangeText={setFundingBudget}
                                        keyboardType="numeric"
                                        onFocus={() => setFocusedField("fundingBudget")}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                </View>
                            </View>

                            {/* Preferred Causes */}
                            <View style={styles.fieldWrapper}>
                                <Text style={styles.fieldLabel}>PREFERRED CAUSES</Text>
                                <View
                                    style={[
                                        styles.inputContainer,
                                        styles.multilineContainer,
                                        focusedField === "preferredCauses" &&
                                            styles.inputContainerFocused,
                                    ]}
                                >
                                    <Ionicons
                                        name="heart-outline"
                                        size={19}
                                        color={
                                            focusedField === "preferredCauses"
                                                ? COLORS.primary
                                                : COLORS.textSecondary
                                        }
                                        style={styles.multilineIcon}
                                    />
                                    <TextInput
                                        style={[styles.input, styles.multilineInput]}
                                        placeholder="Which causes would you like to support? e.g. Education, Healthcare"
                                        placeholderTextColor={COLORS.placeholder}
                                        value={preferredCauses}
                                        onChangeText={setPreferredCauses}
                                        multiline
                                        numberOfLines={3}
                                        onFocus={() => setFocusedField("preferredCauses")}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                </View>
                            </View>

                            {/* Create Profile Button */}
                            <TouchableOpacity
                                style={styles.createButton}
                                activeOpacity={0.85}
                                onPress={handleContinue}
                            >
                                <Text style={styles.createButtonText}>Create Profile</Text>
                                <Ionicons
                                    name="arrow-forward"
                                    size={18}
                                    color="#FFFFFF"
                                    style={styles.createButtonIcon}
                                />
                            </TouchableOpacity>
                        </View>
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

    /* Stepper */
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

    /* Header */
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: COLORS.textPrimary,
        lineHeight: 36,
        marginBottom: 8,
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

    /* Multiline specific styles */
    multilineContainer: {
        alignItems: "flex-start",
        height: "auto",
        minHeight: 100,
        paddingVertical: 16,
    },
    multilineIcon: {
        marginTop: 2,
    },
    multilineInput: {
        textAlignVertical: "top",
        paddingVertical: 0,
    },

    /* Primary CTA */
    createButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: 56,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
        marginTop: 10,
    },
    createButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    createButtonIcon: {
        marginLeft: 8,
    },
});