// Permanently deletes the signed-in sponsor's account.
// Steps: re-check password -> remove interests + photo (best effort) -> delete profile doc -> delete login.

import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    deleteUser,
} from "firebase/auth";
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    deleteDoc,
} from "firebase/firestore";
import { getStorage, ref, deleteObject } from "firebase/storage";

import { auth, db } from "../../Backend/firebaseConfig";

export async function deleteSponsorAccount(password) {
    const user = auth.currentUser;
    if (!user || !user.email) {
        throw new Error("Please log in again before deleting your account.");
    }

    // Firebase only allows deleting an account right after a fresh login
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);

    const uid = user.uid;

    // Best effort: remove this sponsor's saved / interested records
    try {
        const snapshot = await getDocs(
            query(collection(db, "interests"), where("sponsorId", "==", uid))
        );
        await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
    } catch (error) {
        console.log("Could not delete interests:", error?.message);
    }

    // Best effort: remove profile photo
    try {
        await deleteObject(ref(getStorage(), `profileImages/${uid}`));
    } catch (error) {
        console.log("Could not delete profile image:", error?.message);
    }

    // Must succeed, otherwise we would leave a profile with no login behind
    try {
        await deleteDoc(doc(db, "users", uid));
    } catch (error) {
        throw new Error(
            "Could not delete your profile data (" +
                (error?.message || "unknown error") +
                "). Your Firestore rules may need to allow users to delete their own document."
        );
    }

    await deleteUser(user);
}