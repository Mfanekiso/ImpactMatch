const { HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

function requireAuth(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Please sign in first.");
  }
  return request.auth.uid;
}

// Cap how many times one user can call a feature per day (cost protection).
async function checkQuota(uid, feature, limit) {
  const db = getFirestore();
  const day = new Date().toISOString().slice(0, 10);
  const ref = db.doc(`aiUsage/${uid}_${feature}_${day}`);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const used = snap.exists ? snap.data().count || 0 : 0;
    if (used >= limit) {
      throw new HttpsError(
        "resource-exhausted",
        "You've reached today's limit for this feature. Please try again tomorrow."
      );
    }
    tx.set(ref, { uid, feature, day, count: used + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
}

// Trim and limit user text before it goes into a prompt.
function clean(value, max = 1500) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

module.exports = { requireAuth, checkQuota, clean };