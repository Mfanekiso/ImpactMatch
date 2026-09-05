import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from "react-native";

export default function WelcomeScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <Text style={styles.logo}>ImpactMatch</Text>

            <Text style={styles.title}>
                Connect funding with meaningful impact.
            </Text>

            <Text style={styles.description}>
                Find the right organisations, discover sponsorship
                opportunities and create meaningful partnerships.
            </Text>

            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate("SignUp")}
            >
                <Text style={styles.buttonText}>
                    Get Started
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
            >
                <Text style={styles.loginText}>
                    Already have an account? Log In
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 25,
        backgroundColor: "#FFFFFF",
    },

    logo: {
        fontSize: 32,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 30,
    },

    title: {
        fontSize: 28,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 15,
    },

    description: {
        fontSize: 16,
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 40,
    },

    button: {
        backgroundColor: "#2563EB",
        padding: 16,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 20,
    },

    buttonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold",
    },

    loginText: {
        textAlign: "center",
        fontSize: 15,
        color: "#2563EB",
    },
});