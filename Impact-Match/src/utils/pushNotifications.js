// Push notifications with Expo Push Notifications (expo-notifications).
//
// How it works:
//   1. After login, registerAndSavePushToken(uid) asks permission, gets this
//      device's Expo push token and stores it on users/{uid}.expoPushTokens.
//   2. When something happens (new message, new interest), sendPushToUser()
//      reads the recipient's tokens and sends the notification through
//      Expo's push service (https://exp.host/--/api/v2/push/send).
//   3. Tapping a message notification opens that chat.
//
// Note: for a production app, step 2 should run on a server (e.g. a Firebase
// Cloud Function) so users cannot read each other's tokens.

import { Platform } from "react-native";
import Constants from "expo-constants";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

import { db } from "../../Backend/firebaseConfig";
import { navigationRef } from "../navigation/navigationRef";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
let currentDeviceToken = null;

// Expo Go on Android does not include push notifications (SDK 53+), and
// importing expo-notifications there crashes the app. So the module is loaded
// only when it is supported. Sending still works from anywhere.
const IS_EXPO_GO = Constants.executionEnvironment === "storeClient";
const PUSH_SUPPORTED = Platform.OS !== "web" && !(Platform.OS === "android" && IS_EXPO_GO);
let Notifications = null;

function getNotifications() {
    if (!PUSH_SUPPORTED) return null;
    if (!Notifications) {
        try {
            Notifications = require("expo-notifications");
            // Show notifications as banners even while the app is open.
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowBanner: true,
                    shouldShowList: true,
                    shouldPlaySound: true,
                    shouldSetBadge: false,
                }),
            });
        } catch (error) {
            console.log("Push: notifications not available in this build:", error?.message);
            Notifications = null;
        }
    }
    return Notifications;
}

// Ask permission and return this device's Expo push token (or null).
export async function registerForPushNotificationsAsync() {
    const Notifications = getNotifications();
    if (!Notifications) return null; // web, or Expo Go on Android

    if (Platform.OS === "android") {
        // A channel must exist before the Android 13+ permission prompt appears
        await Notifications.setNotificationChannelAsync("default", {
            name: "Default",
            importance: Notifications.AndroidImportance.MAX,
            lightColor: "#10B981",
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
        finalStatus = (await Notifications.requestPermissionsAsync()).status;
    }
    if (finalStatus !== "granted") return null;

    const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
        console.log("Push: no EAS projectId found. Run `eas init` once to add it to app.json.");
        return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return token;
}

// Get the token and save it on the user's profile (one user can have several devices).
export async function registerAndSavePushToken(uid) {
    if (!uid) return;
    try {
        const token = await registerForPushNotificationsAsync();
        if (!token) return;
        currentDeviceToken = token;
        await setDoc(doc(db, "users", uid), { expoPushTokens: arrayUnion(token) }, { merge: true });
    } catch (error) {
        console.log("Push: could not register:", error?.message);
    }
}

// Call before signing out, so this device stops getting the old user's notifications.
export async function removePushTokenForUser(uid) {
    if (!uid || !currentDeviceToken) return;
    try {
        await updateDoc(doc(db, "users", uid), { expoPushTokens: arrayRemove(currentDeviceToken) });
    } catch (error) {
        console.log("Push: could not remove token:", error?.message);
    }
}

// Organisation name (or person's name) for a notification title.
export async function getDisplayName(uid, fallback = "Someone") {
    try {
        const snap = await getDoc(doc(db, "users", uid));
        const data = snap.exists() ? snap.data() : {};
        return data.organisationName || data.full_name || fallback;
    } catch {
        return fallback;
    }
}

// Send a push notification to every device of a user. Never throws:
// a failed notification must not break sending a message.
export async function sendPushToUser(uid, { title, body, data = {} }) {
    if (!uid) return;
    try {
        const snap = await getDoc(doc(db, "users", uid));
        const tokens = snap.exists() ? snap.data().expoPushTokens || [] : [];
        if (tokens.length === 0) return;

        const messages = tokens.map((to) => ({
            to,
            title,
            body,
            data,
            sound: "default",
            channelId: "default",
        }));

        await fetch(EXPO_PUSH_URL, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Accept-Encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(messages),
        });
    } catch (error) {
        console.log("Push: could not send:", error?.message);
    }
}

// Open the right screen when a notification is tapped.
function openFromNotification(data, attempt = 0) {
    if (!data) return;
    if (!navigationRef.isReady()) {
        // App is still starting (cold start from a notification): try again shortly
        if (attempt < 20) setTimeout(() => openFromNotification(data, attempt + 1), 250);
        return;
    }
    if (data.type === "message" && data.conversationId) {
        navigationRef.navigate("Chat", {
            conversationId: data.conversationId,
            otherUserName: data.senderName || "Chat",
        });
    }
}

// Listen for taps. Returns a clean-up function for useEffect.
export function listenForNotificationTaps() {
    const Notifications = getNotifications();
    if (!Notifications) return () => {};

    // The app was opened by tapping a notification
    const last = Notifications.getLastNotificationResponse?.();
    if (last?.notification) openFromNotification(last.notification.request.content.data);

    // A notification was tapped while the app was running
    const subscription = Notifications.addNotificationResponseReceivedListener((response) =>
        openFromNotification(response.notification.request.content.data)
    );
    return () => subscription.remove();
}
