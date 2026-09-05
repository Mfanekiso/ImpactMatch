import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";

export default function UserTypeScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                How will you use ImpactMatch?
            </Text>

            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate("NGOSetup")}
            >
                <Text style={styles.cardTitle}>NGO / NPO</Text>

                <Text style={styles.cardText}>
                    Find sponsors and funding opportunities for your organisation.
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card}>
                <Text style={styles.cardTitle}>Sponsor</Text>

                <Text style={styles.cardText}>
                    Discover organisations and projects that align with your goals.
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

    title: {
        fontSize: 28,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 35,
    },

    card: {
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 15,
        padding: 25,
        marginBottom: 20,
    },

    cardTitle: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 10,
    },

    cardText: {
        fontSize: 15,
        lineHeight: 22,
        color: "#666",
    },
});