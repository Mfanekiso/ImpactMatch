import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    SafeAreaStorage, // or use SafeAreaView from 'react-native-safe-area-context'
    Dimensions
} from "react-native";

const { width } = Dimensions.get("window");

export default function WelcomeScreen({ navigation }) {
    return (
        <View style={styles.container}>
            {/* Top Illustration / Image Container */}
            <View style={styles.imageContainer}>
                <Image
                    source={{
                        uri: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&q=80&w=1000",
                    }}
                    style={styles.heroImage}
                    resizeMode="cover"
                />
                {/* Subtle gradient overlay effect */}
                <View style={styles.imageOverlay} />
            </View>

            {/* Content Section */}
            <View style={styles.contentContainer}>
                <View>
                    <Text style={styles.logo}>Impact<Text style={styles.logoHighlight}>Match</Text></Text>

                    <Text style={styles.title}>
                        Connect funding with meaningful impact.
                    </Text>

                    <Text style={styles.description}>
                        Find the right organisations, discover sponsorship opportunities and create powerful, lasting partnerships.
                    </Text>
                </View>

                {/* Actions Section */}
                <View style={styles.actionContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate("SignUp")}
                    >
                        <Text style={styles.primaryButtonText}>
                            Get Started
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate("Login")}
                    >
                        <Text style={styles.loginText}>
                            Already have an account? <Text style={styles.loginTextBold}>Log In</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0F172A", // Deep modern slate dark theme
    },
    imageContainer: {
        width: width,
        height: width * 0.9, // Proportionate banner height
        position: "relative",
    },
    heroImage: {
        width: "100%",
        height: "100%",
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(15, 23, 42, 0.2)", // Slight dark tint over image
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: 30,
        paddingBottom: 40,
        justifyContent: "space-between",
    },
    logo: {
        fontSize: 24,
        fontWeight: "800",
        color: "#F8FAFC",
        letterSpacing: 0.5,
        marginBottom: 16,
        textTransform: "uppercase",
    },
    logoHighlight: {
        color: "#10B981", // Vibrant emerald green accent for "impact" feel
    },
    title: {
        fontSize: 30,
        fontWeight: "700",
        color: "#F1F5F9",
        lineHeight: 38,
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        color: "#94A3B8", // Muted light slate
        lineHeight: 22,
    },
    actionContainer: {
        width: "100%",
    },
    primaryButton: {
        backgroundColor: "#10B981", // Emerald Green primary CTA
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: "center",
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
        marginBottom: 16,
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    secondaryButton: {
        paddingVertical: 12,
        alignItems: "center",
    },
    loginText: {
        textAlign: "center",
        fontSize: 15,
        color: "#94A3B8",
    },
    loginTextBold: {
        color: "#38BDF8", // Soft bright blue for the action link text
        fontWeight: "600",
    },
});