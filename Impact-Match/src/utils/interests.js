// Sponsor <-> NGO "interests" (saved / interested / mutual), stored in Firestore.
//
// Collection: interests
// Doc id:     `${sponsorId}_${ngoId}`   (one doc per sponsor + NGO pair)
// Fields:
//   sponsorId      string   uid of the sponsor
//   ngoId          string   uid of the NGO
//   saved          boolean  sponsor tapped the heart
//   interested     boolean  sponsor pressed "Express Interest"
//   ngoInterested  boolean  (written by the NGO side, optional) NGO is interested in the sponsor
//   updatedAt      ISO timestamp string
//
// "Mutual" = interested && ngoInterested.
// The NGO side can switch Mutual on by setting `ngoInterested: true` on the SAME doc
// (the shared write helper merges sponsorId + ngoId into the document).

import {
    collection,
    query,
    where,
    getDocs,
} from "firebase/firestore";

import { auth, db } from "../../Backend/firebaseConfig";
import { writeFirestoreOrQueue } from "./offlineWrites";

export const interestDocId = (sponsorId, ngoId) => `${sponsorId}_${ngoId}`;

// Returns { [ngoId]: { saved, interested, ngoInterested } } for the signed-in sponsor.
export async function loadSponsorInterests(sponsorId = auth.currentUser?.uid) {
    if (!sponsorId) return {};

    const snapshot = await getDocs(
        query(collection(db, "interests"), where("sponsorId", "==", sponsorId))
    );

    const map = {};
    snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data.ngoId) return;
        const entry = {
            saved: !!data.saved,
            interested: !!data.interested,
            ngoInterested: !!data.ngoInterested,
        };
        // Skip docs where nothing is switched on
        if (entry.saved || entry.interested || entry.ngoInterested) {
            map[data.ngoId] = entry;
        }
    });
    return map;
}

// Write one or more flags, e.g. updateInterest(ngoId, { saved: true })
export async function updateInterest(ngoId, changes) {
    const sponsorId = auth.currentUser?.uid;
    if (!sponsorId) throw new Error("Please log in again.");
    if (!ngoId) throw new Error("Missing organisation id.");

    await writeFirestoreOrQueue("interests", interestDocId(sponsorId, ngoId), {
            sponsorId,
            ngoId,
            ...changes,
            updatedAt: new Date().toISOString(),
        });
}

export const setSaved = (ngoId, saved) => updateInterest(ngoId, { saved: !!saved });
export const setInterested = (ngoId, interested) =>
    updateInterest(ngoId, { interested: !!interested });

// "recommended" | "interested" | "mutual"  (used by the Matches tab)
export function getMatchStatus(entry) {
    if (entry?.interested && entry?.ngoInterested) return "mutual";
    if (entry?.interested) return "interested";
    return "recommended";
}
