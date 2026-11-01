import { doc, getDoc, updateDoc, serverTimestamp, increment } from "firebase/firestore";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { db } from "../../Backend/firebaseConfig";

// PayFast's public SANDBOX test account (fake money, safe to keep in the app)
const SANDBOX_URL = "https://sandbox.payfast.co.za/eng/process";
const SANDBOX_MERCHANT_ID = "10000100";
const SANDBOX_MERCHANT_KEY = "46f0cd694581a";

// Where PayFast sends the user back to after paying or cancelling
function getReturnBase() {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.location.origin;
  }
  return Linking.createURL("");
}

// Builds the link that opens the PayFast sandbox payment page
export function buildPayFastUrl({ sponsorshipId, totalCents, title }) {
  const base = getReturnBase();
  const params = {
    merchant_id: SANDBOX_MERCHANT_ID,
    merchant_key: SANDBOX_MERCHANT_KEY,
    return_url: `${base}/payment-verify?payment=complete&id=${sponsorshipId}`,
    cancel_url: `${base}/payment-verify?payment=cancelled&id=${sponsorshipId}`,
    m_payment_id: sponsorshipId,
    amount: (totalCents / 100).toFixed(2),
    item_name: title || "Project sponsorship",
  };

  const query = Object.keys(params)
    .map((key) => `${key}=${encodeURIComponent(params[key])}`)
    .join("&");

  return `${SANDBOX_URL}?${query}`;
}

// Called when the user comes back from PayFast.
// result is "success" or "cancelled". Returns "paid" or "cancelled".
export async function markPaymentResult(sponsorshipId, result) {
  const sponsorshipRef = doc(db, "sponsorships", sponsorshipId);
  const snapshot = await getDoc(sponsorshipRef);
  if (!snapshot.exists()) {
    throw new Error("Sponsorship not found.");
  }

  const sponsorship = snapshot.data();

  // Already paid, so do nothing (stops double counting if the page reloads)
  if (sponsorship.paymentStatus === "paid") {
    return "paid";
  }

  if (result !== "success") {
    await updateDoc(sponsorshipRef, { paymentStatus: "cancelled" });
    return "cancelled";
  }

  await updateDoc(sponsorshipRef, {
    paymentStatus: "paid",
    status: "active",
    paidAt: serverTimestamp(),
    transactionReference: `SANDBOX-${Date.now()}`,
  });

  // Money goes straight to the NGO project (amount is stored in cents)
  if (sponsorship.projectId) {
    try {
      await updateDoc(doc(db, "projects", sponsorship.projectId), {
        raisedAmount: increment((Number(sponsorship.amount) || 0) / 100),
      });
    } catch (error) {
      console.warn("Could not update project total:", error?.message);
    }
  }

  return "paid";
}

// A return URL only reports that the buyer came back; Firestore remains the source of truth.
export function getPaymentResultFromUrl(url) {
  if (!url || !url.startsWith("impactmatch://payment-verify")) {
    return null;
  }
  if (url.includes("payment=returned") || url.includes("payment=complete")) return "complete";
  if (url.includes("payment=cancelled")) return "cancelled";
  return null;
}