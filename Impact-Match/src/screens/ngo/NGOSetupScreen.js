import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
} from "react-native";

export default function NGOSetupScreen({ navigation }) {
    const [organisationName, setOrganisationName] = useState("");
    const [mission, setMission] = useState("");
    const [location, setLocation] = useState("");
    const [fundingRequired, setFundingRequired] = useState("");
    const [targetCommunity, setTargetCommunity] = useState("");

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

        navigation.navigate("NGOHome", {
            organisationName,
            mission,
            location,
            fundingRequired,
            targetCommunity,
        });
    };

    return (
        <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.container}>
                <Text style={styles.title}>
                    Tell us about your organisation
                </Text>

                <Text style={styles.subtitle}>
                    Complete your profile to help us find suitable sponsors.
                </Text>

                <Text style={styles.label}>Organisation Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter organisation name"
                    value={organisationName}
                    onChangeText={setOrganisationName}
                />

                <Text style={styles.label}>Mission</Text>
                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    placeholder="What is your organisation's mission?"
                    value={mission}
                    onChangeText={setMission}
                    multiline
                />

                <Text style={styles.label}>Location</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Johannesburg, Gauteng"
                    value={location}
                    onChangeText={setLocation}
                />

                <Text style={styles.label}>Funding Required</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. R100 000"
                    value={fundingRequired}
                    onChangeText={setFundingRequired}
                    keyboardType="numeric"
                />

                <Text style={styles.label}>Target Community</Text>
                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    placeholder="Who does your organisation support?"
                    value={targetCommunity}
                    onChangeText={setTargetCommunity}
                    multiline
                />

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleContinue}
                >
                    <Text style={styles.buttonText}>
                        Create Profile
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
    },

    container: {
        flex: 1,
        padding: 25,
        paddingTop: 60,
        backgroundColor: "#FFFFFF",
    },

    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 10,
    },

    subtitle: {
        fontSize: 16,
        color: "#666",
        lineHeight: 23,
        marginBottom: 30,
    },

    label: {
        fontSize: 15,
        fontWeight: "600",
        marginBottom: 8,
    },

    input: {
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        marginBottom: 20,
    },

    multilineInput: {
        minHeight: 90,
        textAlignVertical: "top",
    },

    button: {
        backgroundColor: "#2563EB",
        padding: 16,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
        marginBottom: 30,
    },

    buttonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold",
    },
});