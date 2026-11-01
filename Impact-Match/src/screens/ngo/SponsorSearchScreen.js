import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    FlatList,
    StyleSheet,
} from "react-native";

import SponsorCard from "../../components/SponsorCard";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../../Backend/firebaseConfig";

export default function SponsorSearchScreen({ navigation }) {
    const [search, setSearch] = useState("");
    const [sponsors, setSponsors] = useState([]);

    useEffect(() => onSnapshot(
        query(collection(db, "users"), where("role", "==", "sponsor")),
        (snapshot) => setSponsors(snapshot.docs.map((entry) => {
            const data = entry.data();
            return {
                id: entry.id,
                ...data,
                name: data.organisationName || data.companyName || data.name || "Sponsor",
                type: data.industry || data.sponsorType || "Sponsor",
                location: data.location || "Location not provided",
                causes: Array.isArray(data.preferredCauses) ? data.preferredCauses : (Array.isArray(data.causes) ? data.causes : []),
                profileImageUrl: data.profileImageUrl || data.photoURL || data.logoUrl || null,
                description: data.mission || data.description || "",
                budget: data.fundingBudget ? `R${Number(data.fundingBudget).toLocaleString("en-ZA")}` : "Not disclosed",
            };
        }))
    ), []);

    const filteredSponsors = sponsors.filter((sponsor) => {
        const searchText = search.toLowerCase();

        return (
            sponsor.name.toLowerCase().includes(searchText) ||
            sponsor.location.toLowerCase().includes(searchText) ||
            sponsor.causes.some((cause) =>
                cause.toLowerCase().includes(searchText)
            )
        );
    });

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Find Sponsors</Text>

            <Text style={styles.subtitle}>
                Discover sponsors that may be a good match for your organisation.
            </Text>

            <TextInput
                style={styles.searchInput}
                placeholder="Search by name, location or cause"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
            />

            <Text style={styles.resultText}>
                {filteredSponsors.length} sponsor
                {filteredSponsors.length !== 1 ? "s" : ""} found
            </Text>

            <FlatList
                data={filteredSponsors}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <SponsorCard
                        sponsor={item}
                        onPress={() =>
                            navigation.navigate("SponsorDetails", {
                                sponsor: item,
                            })
                        }
                    />
                )}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>
                            No sponsors found
                        </Text>

                        <Text style={styles.emptyText}>
                            Try searching for a different name, location or cause.
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
        padding: 20,
        paddingTop: 60,
    },

    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 8,
    },

    subtitle: {
        fontSize: 15,
        color: "#6B7280",
        lineHeight: 22,
        marginBottom: 20,
    },

    searchInput: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 14,
        fontSize: 16,
        marginBottom: 15,
    },

    resultText: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 15,
    },

    list: {
        paddingBottom: 30,
    },

    emptyContainer: {
        alignItems: "center",
        marginTop: 60,
        paddingHorizontal: 30,
    },

    emptyTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
    },

    emptyText: {
        fontSize: 15,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 22,
    },
});
