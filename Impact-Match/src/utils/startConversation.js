// Shared helper: start (or re-open) a chat between the signed-in sponsor and an NGO.
// Used by NewChat, SponsorOpportunityDetailsScreen and SponsorMatchDetailsScreen.
//
// Usage:
//   import { startConversationWithNgo } from "../../utils/startConversation";
//   await startConversationWithNgo(navigation, ngo);
// where `ngo` has at least `id` (the NGO's Firebase uid) and `organisationName` (or `name`).

import { Alert } from "react-native";
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../../Backend/firebaseConfig";

export async function startConversationWithNgo(navigation, ngo) {
    try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            Alert.alert("Not signed in", "Please log in again to send a message.");
            return false;
        }

        if (!ngo || !ngo.id) {
            Alert.alert("Unavailable", "This organisation can't be messaged yet.");
            return false;
        }

        const sponsorId = currentUser.uid;
        const ngoId = ngo.id;

        // Same sponsor + NGO always gives the same conversation id.
        const conversationId = [sponsorId, ngoId].sort().join("_");

        const ngoName = ngo.organisationName || ngo.name || "Organisation";

        // Use the sponsor's real organisation name (displayName is never set in this app).
        let sponsorName = currentUser.displayName || "Sponsor";
        try {
            const sponsorSnap = await getDoc(doc(db, "users", sponsorId));
            if (sponsorSnap.exists()) {
                const data = sponsorSnap.data();
                sponsorName = data.organisationName || data.full_name || sponsorName;
            }
        } catch (error) {
            console.log("Could not load sponsor profile for chat:", error?.message);
        }

        const conversationRef = doc(db, "conversations", conversationId);

        // Check whether the conversation already exists so we never wipe
        // lastMessage / unreadCount of an existing chat.
        let exists = false;
        let checkFailed = false;
        try {
            const existing = await getDoc(conversationRef);
            exists = existing.exists();
        } catch (error) {
            checkFailed = true;
            console.log("Could not check existing conversation:", error?.message);
        }

        if (exists) {
            // Best effort: refresh the sponsor name shown to the NGO.
            try {
                await updateDoc(conversationRef, {
                    [`participantDetails.${sponsorId}.name`]: sponsorName,
                });
            } catch (error) {
                console.log("Could not refresh sponsor name:", error?.message);
            }
        } else if (checkFailed) {
            // Fallback: only write identity fields (no resets).
            await setDoc(
                conversationRef,
                {
                    participants: [sponsorId, ngoId],
                    participantDetails: {
                        [sponsorId]: { name: sponsorName, role: "sponsor" },
                        [ngoId]: { name: ngoName, role: "ngo" },
                    },
                },
                { merge: true }
            );
        } else {
            await setDoc(conversationRef, {
                participants: [sponsorId, ngoId],
                participantDetails: {
                    [sponsorId]: { name: sponsorName, role: "sponsor" },
                    [ngoId]: { name: ngoName, role: "ngo" },
                },
                lastMessage: "",
                lastMessageAt: null,
                unreadCount: {
                    [sponsorId]: 0,
                    [ngoId]: 0,
                },
                createdAt: serverTimestamp(),
            });
        }

        navigation.navigate("Chat", {
            conversationId,
            otherUserName: ngoName,
        });
        return true;
    } catch (error) {
        console.log("Error starting conversation:", error);
        Alert.alert("Could not start conversation", error?.message || "Please try again.");
        return false;
    }
}