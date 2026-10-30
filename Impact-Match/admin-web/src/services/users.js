import { collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function listUsers() {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function setUserRole(uid, role) {
    await updateDoc(doc(db, "users", uid), { role });
}

export async function setUserStatus(uid, accountStatus) {
    await updateDoc(doc(db, "users", uid), {
        accountStatus,
        statusUpdatedAt: serverTimestamp(),
    });
}

export async function deleteUserProfile(uid) {
    await deleteDoc(doc(db, "users", uid));
}
