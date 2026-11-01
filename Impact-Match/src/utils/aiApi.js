// Client helpers for the AI server (see /ai-server, hosted on Vercel).
// The AI keys live on the server only. The app just sends the signed-in user's Firebase
// login token, and the server checks it before doing anything.

import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../Backend/firebaseConfig";

// Your deployed server. Change this only if you ever deploy to a different address.
export const AI_SERVER_URL = "https://impactmatch-ai.vercel.app";

function makeError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
}

async function call(path, data, timeoutMs) {
    const user = auth.currentUser;
    if (!user) throw makeError("unauthenticated", "Please sign in again and try once more.");

    const token = await user.getIdToken();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response;
    try {
        response = await fetch(`${AI_SERVER_URL}/api/${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(data),
            signal: controller.signal,
        });
    } catch (error) {
        throw makeError("unavailable", "We couldn't reach the AI service. Check your connection and try again.");
    } finally {
        clearTimeout(timer);
    }

    let json = null;
    try {
        json = await response.json();
    } catch (error) {
        // The server sent something that isn't JSON (for example a hosting error page).
    }

    if (!response.ok) {
        if (response.status === 401 && !json?.error) {
            throw makeError("unauthenticated", "Please sign in again and try once more.");
        }
        if (response.status === 404) {
            throw makeError("not-found", "The AI feature isn't set up yet. Please try again later.");
        }
        throw makeError(
            response.status === 401 ? "unauthenticated" : "server-error",
            json?.error || "Something went wrong. Please try again."
        );
    }
    return json;
}

// { organisationName, mission, targetCommunity } -> { causes: string[] }
export const suggestCauses = (data) => call("suggest-causes", data, 45000);

// { audioBase64, mimeType, fileName, language: "en" | "zu" | "st" } -> { transcript, english, translationFailed, fields }
export const transcribeStory = (data) => call("transcribe-story", data, 75000);

// Only the profile fields the AI needs. Emails, push tokens and so on are never sent.
function pickProfile(data = {}) {
    const keep = [
        "role", "organisationName", "full_name", "mission", "targetCommunity", "location",
        "fundingRequired", "fundingBudget", "industry", "causes", "preferredCauses",
    ];
    const out = {};
    keep.forEach((key) => {
        if (data[key] !== undefined) out[key] = data[key];
    });
    return out;
}

// { otherUserId } -> { message }
// The app reads both profiles (under your normal Firestore rules) and sends them to the server.
export async function draftOutreach({ otherUserId }) {
    const me = auth.currentUser;
    if (!me || !otherUserId) throw makeError("invalid-argument", "Missing recipient.");

    let mine;
    let theirs;
    try {
        const [mySnap, theirSnap] = await Promise.all([
            getDoc(doc(db, "users", me.uid)),
            getDoc(doc(db, "users", otherUserId)),
        ]);
        mine = mySnap.exists() ? mySnap.data() : null;
        theirs = theirSnap.exists() ? theirSnap.data() : null;
    } catch (error) {
        throw makeError("permission-denied", "We couldn't read both profiles to draft a message. You can write your own.");
    }
    if (!mine || !theirs) {
        throw makeError("not-found", "We couldn't find both profiles to draft a message. You can write your own.");
    }

    return call("draft-outreach", { me: pickProfile(mine), other: pickProfile(theirs) }, 60000);
}

// Turn an error into something a person can act on.
export function friendlyAiError(error) {
    const code = String(error?.code || "");
    if (code === "unauthenticated") return "Please sign in again and try once more.";
    if (code === "unavailable") return "We couldn't reach the AI service. Check your connection and try again.";
    if (code === "not-found") return error?.message || "The AI feature isn't set up yet. Please try again later.";
    return error?.message || "Something went wrong. Please try again.";
}