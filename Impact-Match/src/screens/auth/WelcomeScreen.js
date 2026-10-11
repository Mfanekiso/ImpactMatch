import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ImageBackground,
    SafeAreaView,
    StatusBar,
    Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
    useFonts,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import Ionicons from "@react-native-vector-icons/ionicons";

const { width, height } = Dimensions.get("window");

// ─── LUXURY COLOR PALETTE ───────────────────────────────────────────────
const COLORS = {
    background: "#F8F6EE",       
    primary: "#D9C982",          // Soft Luxury Gold
    emerald: "#059669",          
    buttonDark: "#013e37",       // Deep luxury green
    textPrimary: "#433327",      
    textSecondary: "#8C7A6B",    
    white: "#FFFFFF",
};

export default function WelcomeScreen({ navigation }) {
    const [fontsLoaded] = useFonts({
        Manrope_400Regular,
        Manrope_500Medium,
        Manrope_600SemiBold,
        Manrope_700Bold,
    });

    if (!fontsLoaded) {
        return null;
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Immersive Full-Screen Background */}
            <ImageBackground
                source={{
                    uri: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&q=80&w=1000",
                }}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                {/* Gradient Overlay for Text Readability */}
                <LinearGradient
                    colors={['rgba(1, 62, 55, 0.1)', 'rgba(1, 62, 55, 0.8)', '#013e37']}
                    locations={[0, 0.5, 1]}
                    style={styles.gradientOverlay}
                >
                    <SafeAreaView style={styles.safeArea}>
                        
                        {/* Top Logo */}
                        <View style={styles.header}>
                            <View style={styles.logoBadge}>
                                <Ionicons name="leaf" size={16} color={COLORS.primary} />
                            </View>
                            <Text style={styles.logoText}>
                                IMPACT<Text style={styles.logoHighlight}>MATCH</Text>
                            </Text>
                        </View>

                        {/* Bottom Content Area */}
                        <View style={styles.contentContainer}>
                            <View style={styles.textWrapper}>
                                <Text style={styles.title}>
                                    Connect funding with meaningful impact.
                                </Text>

                                <Text style={styles.description}>
                                    Find the right organisations, discover sponsorship opportunities, and create powerful, lasting partnerships.
                                </Text>
                            </View>

                            {/* Actions Section */}
                            <View style={styles.actionContainer}>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    activeOpacity={0.9}
                                    onPress={() => navigation.navigate("SignUp")}
                                >
                                    <Text style={styles.primaryButtonText}>
                                        Get Started
                                    </Text>
                                    <Ionicons name="arrow-forward" size={20} color={COLORS.buttonDark} />
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

                    </SafeAreaView>
                </LinearGradient>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.buttonDark,
    },
    backgroundImage: {
        width: width,
        height: height,
    },
    gradientOverlay: {
        flex: 1,
        justifyContent: 'space-between',
    },
    safeArea: {
        flex: 1,
        justifyContent: 'space-between',
    },
    
    /* Header / Logo */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: 20,
    },
    logoBadge: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(217, 201, 130, 0.3)', // Soft gold border
    },
    logoText: {
        fontFamily: "Manrope_700Bold",
        fontSize: 18,
        color: COLORS.white,
        letterSpacing: 3,
    },
    logoHighlight: {
        color: COLORS.primary,
    },

    /* Content Area */
    contentContainer: {
        paddingHorizontal: 32,
        paddingBottom: 40,
    },
    textWrapper: {
        marginBottom: 40,
    },
    title: {
        fontFamily: "Manrope_700Bold",
        fontSize: 42,
        color: COLORS.white,
        lineHeight: 48,
        marginBottom: 16,
        letterSpacing: -1,
    },
    description: {
        fontFamily: "Manrope_400Regular",
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)', // Soft white
        lineHeight: 26,
    },

    /* Buttons */
    actionContainer: {
        width: "100%",
    },
    primaryButton: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary, // Gold button for high contrast luxury
        height: 64,
        borderRadius: 32,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
        marginBottom: 20,
    },
    primaryButtonText: {
        fontFamily: "Manrope_700Bold",
        color: COLORS.buttonDark, // Dark text on gold button
        fontSize: 18,
        letterSpacing: 0.5,
        marginRight: 10,
    },
    secondaryButton: {
        paddingVertical: 12,
        alignItems: "center",
    },
    loginText: {
        fontFamily: "Manrope_500Medium",
        textAlign: "center",
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    loginTextBold: {
        fontFamily: "Manrope_700Bold",
        color: COLORS.primary, // Gold link text
    },
});