import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { doc, onSnapshot } from "firebase/firestore";
import Ionicons from "@react-native-vector-icons/ionicons";
import { db } from "../../Backend/firebaseConfig"; // Adjust path if needed

export default function PaymentVerification({ route, navigation }) {
  const [status, setStatus] = useState("idle");
  const [iconIndex, setIconIndex] = useState(0);
  
  // The sequence of Ionicons to cycle through
  const loadingIcons = ["card-outline", "swap-horizontal-outline", "shield-checkmark-outline"];
  const currentIcon = loadingIcons[iconIndex];

  useEffect(() => {
    // Grab parameters passed from deep linking / React Navigation
    const paymentState = route?.params?.payment;
    const sponsorshipId = route?.params?.id;

    let timeout;
    let returnTimer;
    let finished = false;
    const returnToApp = () => navigation.reset({
      index: 0,
      routes: [{ name: "SponsorTabs", params: { screen: "Impact" } }],
    });
    const finish = (nextStatus) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      setStatus(nextStatus);
      returnTimer = setTimeout(returnToApp, 1400);
    };

    if (paymentState === "cancelled") {
      setStatus("error");
      returnTimer = setTimeout(returnToApp, 1400);
      return () => clearTimeout(returnTimer);
    }

    if (paymentState !== "complete" || !sponsorshipId) {
      setStatus("error");
      returnTimer = setTimeout(returnToApp, 1400);
      return () => clearTimeout(returnTimer);
    }

    setStatus("processing");
    const iconInterval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % loadingIcons.length);
    }, 800);
    timeout = setTimeout(() => finish("pending"), 20000);

    const unsubscribe = onSnapshot(
      doc(db, "sponsorships", sponsorshipId),
      (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data();
        if (
          String(data.paymentStatus || "").toLowerCase() === "complete" ||
          ["active", "complete"].includes(String(data.status || "").toLowerCase())
        ) finish("success");
      },
      (error) => {
        console.error("Firestore listener error:", error);
        finish("pending");
      }
    );

    return () => {
      clearInterval(iconInterval);
      clearTimeout(timeout);
      clearTimeout(returnTimer);
      unsubscribe();
    };
  }, [route?.params, navigation]);

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
              onPress={() => navigation.navigate("SponsorTabs", { screen: "Impact" })} 
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
            <Text style={styles.title}>Payment Incomplete</Text>
            <Text style={styles.subtitle}>Your payment was cancelled or encountered an error.</Text>
            <Pressable 
              style={[styles.button, styles.errorButton]} 
              onPress={() => navigation.navigate("SponsorTabs", { screen: "Home" })} 
            >
              <Text style={[styles.buttonText, { color: "#374151" }]}>Return Home</Text>
            </Pressable>
          </View>
        )}

        {status === "pending" && (
          <View style={styles.content}>
            <View style={[styles.iconContainer, styles.errorIconBg]}>
              <Ionicons name="time-outline" size={48} color="#D97706" />
            </View>
            <Text style={styles.title}>Still confirming</Text>
            <Text style={styles.subtitle}>Returning to Impact Match. Your payment status will update when confirmation arrives.</Text>
            <Pressable style={[styles.button, styles.successButton]} onPress={() => navigation.reset({ index: 0, routes: [{ name: "SponsorTabs", params: { screen: "Impact" } }] })}>
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
