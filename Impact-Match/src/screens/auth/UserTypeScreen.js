import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ScrollView,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

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

export default function UserTypeScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                {/* Step Indicator — Step 2 active */}
                <View style={styles.stepperContainer}>
                    {/* Step 1 */}
                    <View style={[styles.stepCircle, styles.stepActive]}>
                        <Text style={styles.stepTextActive}>1</Text>
                    </View>
                    <View style={styles.stepLine} />

                    {/* Step 2 (Active) */}
                    <View style={[styles.stepCircle, styles.stepActive]}>
                        <Text style={styles.stepTextActive}>2</Text>
                    </View>
                    <View style={styles.stepLine} />

                    {/* Step 3 */}
                    <View style={[styles.stepCircle, styles.stepInactive]}>
                        <Text style={styles.stepTextInactive}>3</Text>
                    </View>
                    <View style={styles.stepLine} />

                    {/* Step 4 */}
                    <View style={[styles.stepCircle, styles.stepInactive]}>
                        <Text style={styles.stepTextInactive}>4</Text>
                    </View>
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>How will you use ImpactMatch?</Text>
                    <Text style={styles.subtitle}>
                        Choose the option that best describes you to personalise your experience.
                    </Text>
                </View>

                {/* Cards */}
                <View style={styles.cardsContainer}>
                    {/* NGO / NPO Card */}
                    <TouchableOpacity
                        style={styles.card}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate("NGOSetup")}
                    >
                        <View style={styles.iconWrapper}>
                            <Ionicons name="people-outline" size={24} color={COLORS.primary} />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>NGO / NPO</Text>
                            <Text style={styles.cardText}>
                                Find sponsors and funding opportunities for your organisation.
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.placeholder} />
                    </TouchableOpacity>

                    {/* Sponsor Card */}
                    <TouchableOpacity
                        style={styles.card}
                        activeOpacity={0.8}
                        onPress={() => Alert.alert("Sponsor", "Sponsor setup coming soon.")}
                    >
                        <View style={styles.iconWrapper}>
                            <Ionicons name="briefcase-outline" size={24} color={COLORS.primary} />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>Sponsor</Text>
                            <Text style={styles.cardText}>
                                Discover organisations and projects that align with your goals.
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.placeholder} />
                    </TouchableOpacity>
                </View>

                {/* Footer (Optional Back Button) */}
                <TouchableOpacity
                    style={styles.footer}
                    activeOpacity={0.7}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.footerPrompt}>
                        Changed your mind?{" "}
                        <Text style={styles.footerLink}>Go Back</Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
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
        marginBottom: 36,
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
        marginBottom: 28,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: COLORS.textPrimary,
        lineHeight: 36,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },

    /* Cards */
    cardsContainer: {
        flex: 1,
        gap: 16,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    iconWrapper: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 6,
    },
    cardText: {
        fontSize: 14,
        lineHeight: 20,
        color: COLORS.textSecondary,
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
        color: COLORS.primary,
        fontWeight: "600",
    },
});