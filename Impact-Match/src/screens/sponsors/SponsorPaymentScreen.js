import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../../Backend/firebaseConfig";
import { COLORS, NEUTRAL } from "../../components/PayUI";
import { buildPayFastCheckoutUrl, PAYFAST_CONFIG } from "../../services/paymentApi";

const PLATFORM_FEE_RATE = 0.03;
const formatRand = (cents) => {
  const value = Number(cents) || 0;
  const fractionDigits = value % 100 === 0 ? 0 : 2;
  return `R ${((value / 100)).toLocaleString("en-ZA", { minimumFractionDigits: fractionDigits, maximumFractionDigits: 2 })}`;
};

export default function SponsorPaymentScreen({ route, navigation }) {
  const sponsorshipId = route.params?.sponsorshipId;
  const principalCents = Math.round((Number(route.params?.amount) || 0) * 100);
  const feeCents = Math.round(principalCents * PLATFORM_FEE_RATE);
  const totalCents = principalCents + feeCents;
  const title = route.params?.title || "Project sponsorship";

  const [processingPayment, setProcessingPayment] = useState(false);
  const [payment, setPayment] = useState(null);
  const [checkoutError, setCheckoutError] = useState("");

  const releaseSchedule = useMemo(() => {
    const acceptance = Math.round(principalCents / 4);
    const milestone = Math.floor((principalCents - acceptance) / 3);
    const remainder = principalCents - acceptance - milestone * 2;
    return [acceptance, milestone, milestone, remainder];
  }, [principalCents]);

  // Listen in real-time to payment doc and sponsorship doc
  useEffect(() => {
    if (!sponsorshipId || !auth.currentUser) return undefined;
    const unsubPayment = onSnapshot(doc(db, "payments", sponsorshipId), (snapshot) => {
      if (snapshot.exists()) {
        setPayment(snapshot.data());
      }
    }, (error) => {
      console.warn("Could not listen for payment status:", error?.message);
    });

    const unsubSponsorship = onSnapshot(doc(db, "sponsorships", sponsorshipId), (snapshot) => {
      if (snapshot.exists() && snapshot.data().status === "active") {
        setPayment((prev) => prev ? { ...prev, status: "complete" } : { status: "complete" });
      }
    });

    return () => {
      unsubPayment();
      unsubSponsorship();
    };
  }, [sponsorshipId]);

const handlePayFastApiCheckout = async () => {
    if (!auth.currentUser) {
      Alert.alert("Sign in required", "Please sign in again before paying.");
      return;
    }
    if (!sponsorshipId || principalCents < 500) {
      Alert.alert("Payment unavailable", "A proposal of at least R5.00 is required to process payment.");
      return;
    }
    if (payment?.status === "complete") {
      Alert.alert("Already Paid", "This sponsorship payment has already been completed.");
      return;
    }

    setProcessingPayment(true);
    setCheckoutError("");

    try {
      const payfastUrl = buildPayFastCheckoutUrl({
        sponsorshipId,
        amount: principalCents / 100,
        projectTitle: title,
        sponsorEmail: auth.currentUser.email,
        sponsorName: auth.currentUser.displayName || "Sponsor",
      });

      const canOpen = await Linking.canOpenURL(payfastUrl);
      if (canOpen) {
        await Linking.openURL(payfastUrl);
        // Do NOT set processingPayment to false here. 
        // Leave it spinning while they are on the PayFast webpage!
      } else {
        setProcessingPayment(false);
        throw new Error("Could not open the PayFast checkout page.");
      }
    } catch (error) {
      setProcessingPayment(false);
      console.error("Payment Link Error:", error);
      const message = error?.message || "Failed to initiate payment. Please check your connection.";
      setCheckoutError(message);
      Alert.alert("Payment Error", message);
    }
  };

  const paid = payment?.status === "complete";

  const statusMessage = paid
    ? "PayFast API confirmed this payment. Your sponsorship is now active and funds have been credited to the NGO project."
    : "Payment will be securely processed through the PayFast API. Both the NGO and Admin will receive real-time notification.";

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {paid ? (
          <View style={styles.successBanner}>
            <View style={styles.successBadge}>
              <Text style={styles.successBadgeText}>✓ CONFIRMED</Text>
            </View>
            <Text style={styles.successTitle}>Payment Complete</Text>
            <Text style={styles.successSubtitle}>
              Thank you! Your sponsorship has been processed via PayFast API.
            </Text>
            {payment?.transactionReference ? (
              <Text style={styles.refText}>Ref: {payment.transactionReference}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>SUMMARY</Text>
          <Text style={styles.projectName} numberOfLines={2}>{title}</Text>
          <Line label="Sponsorship" value={formatRand(principalCents)} />
          <Line label="Platform fee (3%)" value={formatRand(feeCents)} />
          <View style={styles.divider} />
          <Line label="Total to pay" value={formatRand(totalCents)} bold />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>RELEASE SCHEDULE</Text>
          <Text style={styles.bodyText}>
            The funding schedule releases 25% on acceptance and milestone portions as the NGO posts project progress.
          </Text>
          <Line label="On acceptance (25%)" value={formatRand(releaseSchedule[0])} />
          <Line label="3 milestone releases" value={formatRand(principalCents - releaseSchedule[0])} />
        </View>

        <View style={styles.methodCard}>
          <View style={styles.methodLogo}><Text style={styles.methodLogoText}>PF</Text></View>
          <View style={styles.methodCopy}>
            <Text style={styles.methodTitle}>PayFast API</Text>
            <Text style={styles.methodDescription}>Card, Instant EFT, Zapper, Capitec Pay</Text>
          </View>
          <View style={styles.selectedMark}><Text style={styles.selectedMarkText}>✓</Text></View>
        </View>

        <Text style={styles.statusText}>{statusMessage}</Text>
        {checkoutError ? <Text style={styles.errorText}>{checkoutError}</Text> : null}
      </ScrollView>

      <View style={styles.bottom}>
        {paid ? (
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => {
              if (navigation?.navigate) {
                navigation.navigate("SponsorTabs", { screen: "Impact" });
              } else {
                navigation?.goBack?.();
              }
            }}
            accessibilityRole="button"
          >
            <Text style={styles.payButtonText}>View Impact Dashboard</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.payButton, processingPayment && styles.payButtonDisabled]}
            onPress={handlePayFastApiCheckout}
            disabled={processingPayment}
            accessibilityRole="button"
          >
            {processingPayment ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.payButtonText}>Pay {formatRand(totalCents)} </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function Line({ label, value, bold = false }) {
  return (
    <View style={styles.line}>
      <Text style={bold ? styles.boldText : styles.bodyText}>{label}</Text>
      <Text style={bold ? styles.boldText : styles.bodyText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F3F6F5" },
  content: { padding: 20, paddingBottom: 28, gap: 10 },
  card: { backgroundColor: COLORS.white, borderRadius: 13, padding: 14, gap: 9, borderWidth: 1, borderColor: NEUTRAL.border },
  sectionLabel: { fontFamily: "Manrope_600SemiBold", color: "#396157", fontSize: 11, letterSpacing: 0.3 },
  projectName: { fontFamily: "Manrope_600SemiBold", color: NEUTRAL.text, fontSize: 15, marginBottom: 1 },
  line: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  bodyText: { flex: 1, fontFamily: "Manrope_400Regular", fontSize: 13, color: NEUTRAL.text },
  boldText: { flex: 1, fontFamily: "Manrope_700Bold", fontSize: 14, color: NEUTRAL.text },
  divider: { height: 1, backgroundColor: NEUTRAL.border, marginVertical: 1 },
  methodCard: { minHeight: 60, backgroundColor: COLORS.white, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 10, borderWidth: 1.5, borderColor: "#087456", flexDirection: "row", alignItems: "center", gap: 10 },
  methodLogo: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#E7F4EF", alignItems: "center", justifyContent: "center" },
  methodLogoText: { fontFamily: "Manrope_700Bold", color: "#087456", fontSize: 12 },
  methodCopy: { flex: 1 },
  methodTitle: { fontFamily: "Manrope_700Bold", color: NEUTRAL.text, fontSize: 14 },
  methodDescription: { fontFamily: "Manrope_400Regular", color: NEUTRAL.muted, fontSize: 11 },
  selectedMark: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#087456", alignItems: "center", justifyContent: "center" },
  selectedMarkText: { color: COLORS.white, fontWeight: "800", fontSize: 13 },
  statusText: { fontFamily: "Manrope_400Regular", color: NEUTRAL.muted, fontSize: 11, lineHeight: 16, paddingHorizontal: 2 },
  errorText: { fontFamily: "Manrope_500Medium", color: "#9B1C1C", fontSize: 12, lineHeight: 17 },
  bottom: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 18, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: NEUTRAL.border },
  payButton: { height: 48, borderRadius: 11, backgroundColor: "#087456", alignItems: "center", justifyContent: "center" },
  doneButton: { height: 48, borderRadius: 11, backgroundColor: "#059669", alignItems: "center", justifyContent: "center" },
  payButtonDisabled: { opacity: 0.6 },
  payButtonText: { fontFamily: "Manrope_700Bold", color: COLORS.white, fontSize: 13 },
  successBanner: { backgroundColor: "#E7F4EF", borderRadius: 13, padding: 16, borderWidth: 1, borderColor: "#A7F3D0", alignItems: "center", gap: 6, marginBottom: 4 },
  successBadge: { backgroundColor: "#059669", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  successBadgeText: { color: COLORS.white, fontFamily: "Manrope_700Bold", fontSize: 10, letterSpacing: 0.5 },
  successTitle: { fontFamily: "Manrope_700Bold", fontSize: 16, color: "#065F46" },
  successSubtitle: { fontFamily: "Manrope_500Medium", fontSize: 12, color: "#047857", textAlign: "center" },
  refText: { fontFamily: "Manrope_600SemiBold", fontSize: 11, color: "#065F46", opacity: 0.8 },
});
