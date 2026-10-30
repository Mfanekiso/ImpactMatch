import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const col = () => collection(db, "sponsors");

export async function listSponsors() {
    const snap = await getDocs(query(col(), orderBy("name")));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getSponsor(id) {
    const snap = await getDoc(doc(db, "sponsors", id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createSponsor(data) {
    const ref = await addDoc(col(), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

export async function updateSponsor(id, data) {
    await updateDoc(doc(db, "sponsors", id), { ...data, updatedAt: serverTimestamp() });
}

export async function setSponsorStatus(id, status) {
    await updateSponsor(id, { status });
}

export async function deleteSponsor(id) {
    await deleteDoc(doc(db, "sponsors", id));
}
