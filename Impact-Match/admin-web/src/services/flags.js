import { collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase";

// Profiles the AI reviewer queued. status: "pending" | "dismissed" | "confirmed" ("clear" = nothing found).
export async function listFlags(status) {
    const snap = await getDocs(query(collection(db, "profileFlags"), where("status", "==", status)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// A human decision. The AI only suggests; this is where the admin decides.
export async function resolveFlag(uid, status, adminUid) {
    await updateDoc(doc(db, "profileFlags", uid), {
        status,
        resolvedBy: adminUid,
        resolvedAt: serverTimestamp(),
    });
}