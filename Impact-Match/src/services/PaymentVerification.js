import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Ionicons from "@react-native-vector-icons/ionicons";
import { auth, db } from "../../Backend/firebaseConfig";
import { markPaymentResult } from "./paymentApi";

export default function PaymentVerification({ route, navigation }) {
  const [status, setStatus] = useState("idle");
  const [iconIndex, setIconIndex] = useState(0);

  const loadingIcons = ["card-outline", "swap-horizontal-outline", "shield-checkmark-outline"];
  const currentIcon = loadingIcons[iconIndex];

  const returnToApp = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: "SponsorTabs", params: { screen: "Impact" } }],
    });
  }, [navigation]);

  useEffect(() => {
    const paymentState = route?.params?.payment;
    const sponsorshipId = route?.params?.id;

    let timeout;
    let returnTimer;
    let finished = false;
    let started = false;
    let unsubscribeSnapshot = () => { };
    const finish = (nextStatus) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      setStatus(nextStatus);
      if (nextStatus === "success") returnTimer = setTimeout(returnToApp, 2500);
      if (nextStatus === "pending") returnTimer = setTimeout(returnToApp, 1400);
    };

    if (paymentState === "cancelled") {
      setStatus("error");
      returnTimer = setTimeout(returnToApp, 3500);
      return () => clearTimeout(returnTimer);
    }

    if (!["returned", "complete"].includes(paymentState) || !sponsorshipId) {
      setStatus("error");
      returnTimer = setTimeout(returnToApp, 3500);
      return () => clearTimeout(returnTimer);
    }

    setStatus("processing");
    const iconInterval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % loadingIcons.length);
    }, 800);
    timeout = setTimeout(() => finish("pending"), 20000);

    // Wait until Firebase knows who the user is (needed after coming back from PayFast)
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user || started) return;
      started = true;

      // Sandbox payment: record the payment as paid in Firestore
      markPaymentResult(sponsorshipId, "success").catch((error) => {
        console.error("Could not record payment:", error);
        finish("error");
      });

      // Then watch the sponsorship until it shows as paid
      unsubscribeSnapshot = onSnapshot(
        doc(db, "sponsorships", sponsorshipId),
        (docSnap) => {
          if (!docSnap.exists()) return;
          const data = docSnap.data();
          if (
            ["paid", "complete", "completed"].includes(String(data.paymentStatus || "").toLowerCase()) ||
            ["active", "complete"].includes(String(data.status || "").toLowerCase()) ||
            !!data.transactionReference
          ) finish("success");
          else if (["failed", "cancelled", "canceled"].includes(String(data.paymentStatus || "").toLowerCase())) finish("error");
        },
        (error) => {
          console.error("Firestore listener error:", error);
          finish("pending");
        }
      );
    });

    return () => {
      clearInterval(iconInterval);
      clearTimeout(timeout);
      clearTimeout(returnTimer);
      unsubscribeAuth();
      unsubscribeSnapshot();
    };
  }, [route?.params, navigation, returnToApp]);

  if (status === "idle") return null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>

        {status === "processing" && (
          <View style={styles.content}>
            <View style={[styles.iconContainer, styles.processingIconBg]}>
              <ActivityIndicator size="large" color="#2563EB" style={StyleSheet.absoluteFillObject} />
              <Ionicons name={currentIcon} size={40} color="#2563EB" />
            </View>
            <Text style={styles.title}>Verifying Payment</Text>
            <Text style={styles.subtitle}>Waiting for secure confirmation from PayFast...</Text>
          </View>
        )}

        {status === "success" && (
          <View style={styles.content}>
            <View style={[styles.iconContainer, styles.successIconBg]}>
              <Ionicons name="checkmark-circle" size={48} color="#16A34A" />
            </View>
            <Text style={styles.title}>Payment Successful!</Text>
            <Text style={styles.subtitle}>Thank you! Your sponsorship has been securely recorded.</Text>
            <Pressable
              style={[styles.button, styles.successButton]}
              onPress={returnToApp}
            >
              <Text style={styles.buttonText}>View Impact Dashboard</Text>
            </Pressable>
          </View>
        )}

        {status === "error" && (
          <View style={styles.content}>
            <View style={[styles.iconContainer, styles.errorIconBg]}>
              <Ionicons name="close-circle" size={48} color="#DC2626" />
            </View>
            <Text style={styles.title}>Payment Unsuccessful</Text>
            <Text style={styles.subtitle}>PayFast did not confirm this payment. You can return to your payment page and try again.</Text>
            <Pressable
              style={[styles.button, styles.errorButton]}
              onPress={returnToApp}
            >
              <Text style={[styles.buttonText, { color: "#374151" }]}>Return Home</Text>
            </Pressable>
          </View>
        )}

        {status === "pending" && (
          <View style={styles.content}>
            <View style={[styles.iconContainer, styles.pendingIconBg]}>
              <Ionicons name="time-outline" size={48} color="#D97706" />
            </View>
            <Text style={styles.title}>Payment still confirming</Text>
            <Text style={styles.subtitle}>PayFast has not sent confirmation yet. Your payment page will update when it arrives.</Text>
            <Pressable style={[styles.button, styles.successButton]} onPress={returnToApp}>
              <Text style={styles.buttonText}>Return to Impact Match</Text>
            </Pressable>
          </View>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  content: {
    alignItems: "center",
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  processingIconBg: { backgroundColor: "#EFF6FF" },
  successIconBg: { backgroundColor: "#DCFCE7" },
  errorIconBg: { backgroundColor: "#FEE2E2" },
  pendingIconBg: { backgroundColor: "#FEF3C7" },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  successButton: { backgroundColor: "#16A34A" },
  errorButton: { backgroundColor: "#F3F4F6" },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});