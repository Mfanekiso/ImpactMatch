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
import Ionicons from '@react-native-vector-icons/ionicons'

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

export default function NGOSetupScreen({ navigation }) {
    const [organisationName, setOrganisationName] = useState("");
    const [mission, setMission] = useState("");
    const [location, setLocation] = useState("");
    const [fundingRequired, setFundingRequired] = useState("");
    const [targetCommunity, setTargetCommunity] = useState("");
    const [focusedField, setFocusedField] = useState(null);

    const handleContinue = () => {
        if (
            !organisationName.trim() ||
            !mission.trim() ||
            !location.trim() ||
            !fundingRequired.trim() ||
            !targetCommunity.trim()
        ) {
            Alert.alert(
                "Missing Information",
                "Please complete all fields before continuing."
            );
            return;
        }

        navigation.navigate('MainTabs', {
            screen: 'Home',
            params: {
                organisationName,
                mission,
                location,
                fundingRequired,
                targetCommunity,
            },
        });
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
                        {/* Step Indicator — Step 3 active */}
                        <View style={styles.stepperContainer}>
                            {/* Step 1 */}
                            <View style={[styles.stepCircle, styles.stepActive]}>
                                <Text style={styles.stepTextActive}>1</Text>
                            </View>
                            <View style={styles.stepLine} />

                            {/* Step 2 */}
                            <View style={[styles.stepCircle, styles.stepActive]}>
                                <Text style={styles.stepTextActive}>2</Text>
                            </View>
                            <View style={styles.stepLine} />

                            {/* Step 3 (Active) */}
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
                                Complete your profile to help us find suitable sponsors.
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

                            {/* Mission */}
                            <View style={styles.fieldWrapper}>
                                <Text style={styles.fieldLabel}>MISSION</Text>
                                <View
                                    style={[
                                        styles.inputContainer,
                                        styles.multilineContainer,
                                        focusedField === "mission" &&
                                            styles.inputContainerFocused,
                                    ]}
                                >
                                    <Ionicons
                                        name="flag-outline"
                                        size={19}
                                        color={
                                            focusedField === "mission"
                                                ? COLORS.primary
                                                : COLORS.textSecondary
                                        }
                                        style={styles.multilineIcon}
                                    />
                                    <TextInput
                                        style={[styles.input, styles.multilineInput]}
                                        placeholder="What is your organisation's mission?"
                                        placeholderTextColor={COLORS.placeholder}
                                        value={mission}
                                        onChangeText={setMission}
                                        multiline
                                        numberOfLines={3}
                                        onFocus={() => setFocusedField("mission")}
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
                                        placeholder="e.g. Johannesburg, Gauteng"
                                        placeholderTextColor={COLORS.placeholder}
                                        value={location}
                                        onChangeText={setLocation}
                                        onFocus={() => setFocusedField("location")}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                </View>
                            </View>

                            {/* Funding Required */}
                            <View style={styles.fieldWrapper}>
                                <Text style={styles.fieldLabel}>FUNDING REQUIRED</Text>
                                <View
                                    style={[
                                        styles.inputContainer,
                                        focusedField === "fundingRequired" &&
                                            styles.inputContainerFocused,
                                    ]}
                                >
                                    <Ionicons
                                        name="cash-outline"
                                        size={19}
                                        color={
                                            focusedField === "fundingRequired"
                                                ? COLORS.primary
                                                : COLORS.textSecondary
                                        }
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. R100 000"
                                        placeholderTextColor={COLORS.placeholder}
                                        value={fundingRequired}
                                        onChangeText={setFundingRequired}
                                        keyboardType="numeric"
                                        onFocus={() => setFocusedField("fundingRequired")}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                </View>
                            </View>

                            {/* Target Community */}
                            <View style={styles.fieldWrapper}>
                                <Text style={styles.fieldLabel}>TARGET COMMUNITY</Text>
                                <View
                                    style={[
                                        styles.inputContainer,
                                        styles.multilineContainer,
                                        focusedField === "targetCommunity" &&
                                            styles.inputContainerFocused,
                                    ]}
                                >
                                    <Ionicons
                                        name="people-outline"
                                        size={19}
                                        color={
                                            focusedField === "targetCommunity"
                                                ? COLORS.primary
                                                : COLORS.textSecondary
                                        }
                                        style={styles.multilineIcon}
                                    />
                                    <TextInput
                                        style={[styles.input, styles.multilineInput]}
                                        placeholder="Who does your organisation support?"
                                        placeholderTextColor={COLORS.placeholder}
                                        value={targetCommunity}
                                        onChangeText={setTargetCommunity}
                                        multiline
                                        numberOfLines={3}
                                        onFocus={() => setFocusedField("targetCommunity")}
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