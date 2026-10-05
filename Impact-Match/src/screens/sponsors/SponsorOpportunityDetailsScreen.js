import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Image,
    ActivityIndicator,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../../../Backend/firebaseConfig";
import { computeMatch, parseAmount } from "../../utils/matchScore";
import { startConversationWithNgo } from "../../utils/startConversation";

const COLORS = {
    background: "#F9FAFB",
    surface: "#FFFFFF",
    primary: "#10B981",
    primaryLight: "rgba(16, 185, 129, 0.10)",
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    border: "#E5E7EB",
    white: "#FFFFFF",
};

const FALLBACK_COLOR = "#2563EB";

function getInitials(name) {
    if (!name) return "?";
    return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function formatAmount(value) {
    const num = parseAmount(value);
    if (num == null) return "Not specified";
    return `R${num.toLocaleString("en-ZA")}`;
}

// Accepts either:
//   navigation.navigate("SponsorOpportunityDetails", { opportunity: ngoDoc })   (Home)
//   navigation.navigate("SponsorOpportunityDetails", { ngoId: "<uid>" })        (Match details)
export default function SponsorOpportunityDetailsScreen({ navigation, route }) {
    const params = route.params || {};
    const [ngo, setNgo] = useState(params.opportunity || null);
    const [sponsor, setSponsor] = useState(null);
    const [loading, setLoading] = useState(!params.opportunity);
    const [error, setError] = useState("");
    const [starting, setStarting] = useState(false);

    // Load the NGO if we were only given an id
    useEffect(() => {
        if (params.opportunity || !params.ngoId) {
            if (!params.opportunity && !params.ngoId) {
                setLoading(false);
                setError("No organisation was provided.");
            }
            return;
        }

        const loadNgo = async () => {
            try {
                const snap = await getDoc(doc(db, "users", params.ngoId));
                if (snap.exists()) {
                    setNgo({ id: snap.id, ...snap.data() });
                } else {
                    setError("This organisation could not be found.");
                }
            } catch (err) {
                setError(err.message || "Could not load organisation.");
            } finally {
                setLoading(false);
            }
        };
        loadNgo();
    }, [params.opportunity, params.ngoId]);

    // Load the signed-in sponsor so we can show a match score
    useEffect(() => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        getDoc(doc(db, "users", uid))
            .then((snap) => snap.exists() && setSponsor(snap.data()))
            .catch((err) => console.log("Could not load sponsor profile:", err?.message));
    }, []);

    const match = useMemo(
        () => (ngo && sponsor ? computeMatch(sponsor, ngo) : null),
        [ngo, sponsor]
    );

    const handleStartConversation = async () => {
        if (starting) return;
        setStarting(true);
        await startConversationWithNgo(navigation, ngo);
        setStarting(false);
    };

    const Header = (
        <View style={styles.topBar}>
            <TouchableOpacity
                style={styles.backButton}
                activeOpacity={0.7}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Organisation</Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                {Header}
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!ngo) {
        return (
            <SafeAreaView style={styles.safeArea}>
                {Header}
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>{error || "Organisation not available."}</Text>
                </View>
            </SafeAreaView>
        );
    }

    const name = ngo.organisationName || ngo.name || "Unnamed NGO";
    const color = ngo.color || FALLBACK_COLOR;
    const verified = !!ngo.profileCompleted;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            {Header}

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.heroCard}>
                    {ngo.profileImageUrl ? (
                        <Image source={{ uri: ngo.profileImageUrl }} style={styles.logoImage} />
                    ) : (
                        <View style={[styles.logo, { backgroundColor: color }]}>
                            <Text style={styles.logoText}>{getInitials(name)}</Text>
                        </View>
                    )}

                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{name}</Text>
                        {verified && (
                            <Ionicons
                                name="checkmark-circle"
                                size={18}
                                color={COLORS.primary}
                                style={styles.verifiedIcon}
                            />
                        )}
                    </View>

                    {verified && (
                        <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedBadgeText}>Verified</Text>
                        </View>
                    )}

                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={15} color={COLORS.textSecondary} />
                        <Text style={styles.locationText}>
                            {ngo.location || "Location not provided"}
                        </Text>
                    </View>

                    {match && (
                        <View style={styles.matchPill}>
                            <View style={styles.matchDot} />
                            <Text style={styles.matchPillText}>{match.matchScore}% match with you</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.sectionTitle}>About</Text>
                <View style={styles.card}>
                    <Text style={styles.bodyText}>
                        {ngo.mission || "No mission statement provided yet."}
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>Details</Text>
                <View style={styles.card}>
                    <DetailRow icon="people-outline" label="Supports" value={ngo.targetCommunity || "Not specified"} />
                    <View style={styles.divider} />
                    <DetailRow icon="cash-outline" label="Funding need" value={formatAmount(ngo.fundingRequired)} />
                    <View style={styles.divider} />
                    <DetailRow icon="mail-outline" label="Email" value={ngo.email || "Not provided"} />
                </View>

                {match && match.whyYouMatch.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Why You Match</Text>
                        <View style={styles.card}>
                            {match.whyYouMatch.map((reason, index) => (
                                <View key={index} style={styles.whyRow}>
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={18}
                                        color={COLORS.primary}
                                        style={styles.whyIcon}
                                    />
                                    <Text style={styles.whyText}>{reason}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.primaryButton, starting && styles.primaryButtonDisabled]}
                    activeOpacity={0.85}
                    disabled={starting}
                    onPress={handleStartConversation}
                >
                    {starting ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.primaryButtonText}>Start Conversation</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

function DetailRow({ icon, label, value }) {
    return (
        <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
                <Ionicons name={icon} size={18} color={COLORS.primary} />
            </View>
            <View style={styles.detailText}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    emptyText: { textAlign: "center", color: COLORS.textSecondary },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
    },
    topBarTitle: {
        flex: 1,
        textAlign: "center",
        marginRight: 40,
        fontSize: 18,
        fontWeight: "800",
        color: COLORS.textPrimary,
    },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
    heroCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        padding: 20,
        marginBottom: 8,
    },
    logo: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    logoImage: { width: 72, height: 72, borderRadius: 36, marginBottom: 12 },
    logoText: { color: COLORS.white, fontSize: 24, fontWeight: "800" },
    nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
    name: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary, textAlign: "center" },
    verifiedIcon: { marginLeft: 6 },
    verifiedBadge: {
        marginTop: 8,
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
    },
    verifiedBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },
    locationRow: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 4 },
    locationText: { fontSize: 13, color: COLORS.textSecondary },
    matchPill: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 14,
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
    },
    matchDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        marginRight: 6,
    },
    matchPillText: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: COLORS.textPrimary,
        marginTop: 20,
        marginBottom: 10,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
    },
    bodyText: { fontSize: 14, lineHeight: 21, color: COLORS.textPrimary },
    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
    detailRow: { flexDirection: "row", alignItems: "center" },
    detailIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    detailText: { flex: 1 },
    detailLabel: { fontSize: 12, color: COLORS.textSecondary },
    detailValue: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary, marginTop: 2 },
    whyRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
    whyIcon: { marginRight: 8, marginTop: 1 },
    whyText: { flex: 1, fontSize: 14, lineHeight: 20, color: COLORS.textPrimary },
    footer: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        padding: 20,
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: "center",
    },
    primaryButtonDisabled: { opacity: 0.6 },
    primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
});