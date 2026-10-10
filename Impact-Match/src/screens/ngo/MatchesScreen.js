import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, FlatList } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../../../Backend/firebaseConfig";
import { computeMatch } from "../../utils/matchScore";
import { readLocalCache, writeLocalCache } from "../../utils/profileCache";

const COLORS = { background: "#F8F6EE", surface: "#FFFFFF", primary: "#059669", text: "#433327", muted: "#8C7A6B", border: "#E8DFD5" };

export default function MatchesScreen({ navigation }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const loadMatches = useCallback(async () => {
        setLoading(true);
        setError(false);
        const uid = auth.currentUser?.uid;
        try {
            if (!uid) { setMatches([]); return; }
            const [ngoSnap, sponsorsSnap, interestsSnap] = await Promise.all([
                getDoc(doc(db, "users", uid)),
                getDocs(query(collection(db, "users"), where("role", "==", "sponsor"))),
                getDocs(query(collection(db, "interests"), where("ngoId", "==", uid))),
            ]);
            const ngo = ngoSnap.exists() ? ngoSnap.data() : {};
            const interestBySponsor = {};
            interestsSnap.docs.forEach((entry) => { interestBySponsor[entry.data().sponsorId] = entry.data(); });
            const rows = sponsorsSnap.docs
                .filter((entry) => entry.id !== uid && entry.data().profileCompleted)
                .map((entry) => {
                    const sponsor = entry.data();
                    const { matchScore } = computeMatch(sponsor, ngo);
                    const interest = interestBySponsor[entry.id] || {};
                    return {
                        id: entry.id,
                        name: sponsor.organisationName || "Sponsor",
                        industry: sponsor.industry || "Sponsor",
                        location: sponsor.location || "Location not provided",
                        causes: Array.isArray(sponsor.preferredCauses) ? sponsor.preferredCauses : [],
                        budget: sponsor.fundingBudget,
                        matchScore,
                        interested: !!interest.interested,
                        mutual: !!interest.interested && !!interest.ngoInterested,
                    };
                })
                .sort((a, b) => b.matchScore - a.matchScore);
            setMatches(rows);
            await writeLocalCache(`ngo-matches:${uid}`, rows);
        } catch (loadError) {
            console.warn("Could not load live sponsor matches:", loadError?.message);
            const cached = uid ? await readLocalCache(`ngo-matches:${uid}`) : null;
            setError(!cached);
            setMatches(cached || []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMatches();
        const unsubscribe = navigation.addListener("focus", loadMatches);
        return unsubscribe;
    }, [loadMatches, navigation]);

    const filtered = useMemo(() => matches.filter((match) =>
        `${match.name} ${match.industry} ${match.location} ${match.causes.join(" ")}`.toLowerCase().includes(searchQuery.toLowerCase())
    ), [matches, searchQuery]);

    const renderMatch = ({ item }) => (
        <TouchableOpacity style={styles.card} activeOpacity={0.82} onPress={() => navigation.navigate("SponsorDetails", { sponsor: { ...item, type: item.industry, matchPercentage: item.matchScore, tags: item.causes, description: "", budget: item.budget ? `R${Number(item.budget).toLocaleString("en-ZA")}` : "Not disclosed" }, ngoId: auth.currentUser?.uid })}>
            <View style={styles.score}><Text style={styles.scoreText}>{item.matchScore}%</Text></View>
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.meta} numberOfLines={1}>{item.industry} · {item.location}</Text>
                <Text style={styles.tags} numberOfLines={1}>{item.causes.join(" · ") || "No causes listed"}</Text>
                {item.mutual && <Text style={styles.mutual}>Mutual interest</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            <View style={styles.header}><Text style={styles.title}>Sponsor matches</Text><Text style={styles.subtitle}>Real sponsors ranked by fit with your organisation.</Text></View>
            <View style={styles.search}>
                <Ionicons name="search-outline" size={20} color={COLORS.muted} />
                <TextInput style={styles.input} placeholder="Search sponsors or causes" placeholderTextColor={COLORS.muted} value={searchQuery} onChangeText={setSearchQuery} autoCapitalize="none" />
            </View>
            {loading ? <ActivityIndicator style={styles.center} size="large" color={COLORS.primary} /> : error ? (
                <View style={styles.center}><Text style={styles.emptyTitle}>Couldn’t load matches</Text><Text style={styles.emptyText}>Check your connection and try again.</Text><TouchableOpacity style={styles.button} onPress={loadMatches}><Text style={styles.buttonText}>Try again</Text></TouchableOpacity></View>
            ) : filtered.length ? <FlatList data={filtered} renderItem={renderMatch} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} /> : (
                <View style={styles.center}><View style={styles.emptyIcon}><Ionicons name="people-outline" size={36} color={COLORS.primary} /></View><Text style={styles.emptyTitle}>{matches.length ? "No results" : "No sponsor profiles yet"}</Text><Text style={styles.emptyText}>{matches.length ? "Try a different search." : "Complete your organisation profile and check back as sponsors join."}</Text><TouchableOpacity style={styles.button} onPress={loadMatches}><Text style={styles.buttonText}>Refresh matches</Text></TouchableOpacity></View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    header: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 18 },
    title: { color: COLORS.text, fontSize: 29, fontWeight: "800", letterSpacing: -0.5 },
    subtitle: { color: COLORS.muted, fontSize: 14, marginTop: 6 },
    search: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginBottom: 12, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, paddingHorizontal: 15, height: 52 },
    input: { flex: 1, marginLeft: 10, color: COLORS.text, fontSize: 15 },
    list: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 130 },
    card: { flexDirection: "row", alignItems: "center", padding: 15, backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
    score: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#E8F5EE", justifyContent: "center", alignItems: "center", marginRight: 13 },
    scoreText: { color: COLORS.primary, fontWeight: "800", fontSize: 14 },
    info: { flex: 1, marginRight: 8 }, name: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
    meta: { color: COLORS.muted, fontSize: 12, marginTop: 4 }, tags: { color: COLORS.muted, fontSize: 11, marginTop: 5 },
    mutual: { color: COLORS.primary, fontSize: 11, fontWeight: "700", marginTop: 5 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 36, paddingBottom: 60 },
    emptyIcon: { width: 78, height: 78, borderRadius: 39, backgroundColor: "#E8F5EE", justifyContent: "center", alignItems: "center", marginBottom: 18 },
    emptyTitle: { color: COLORS.text, fontSize: 19, fontWeight: "700", textAlign: "center" },
    emptyText: { color: COLORS.muted, fontSize: 14, textAlign: "center", lineHeight: 21, marginTop: 8 },
    button: { backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 13, marginTop: 20 }, buttonText: { color: "#FFFFFF", fontWeight: "700" },
});
