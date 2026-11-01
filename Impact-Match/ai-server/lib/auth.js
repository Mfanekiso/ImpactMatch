// Checks that a request comes from someone signed in to YOUR Firebase project.
// The app sends its Firebase "ID token" in the Authorization header. We verify its
// signature against Google's public keys, so no private key or paid plan is needed.
const { createRemoteJWKSet, jwtVerify } = require("jose");
const { PROJECT_ID } = require("./config");
const { HttpError } = require("./http");

const GOOGLE_KEYS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

async function verifyToken(headers, { keys = GOOGLE_KEYS, projectId = PROJECT_ID } = {}) {
  const header = headers.authorization || headers.Authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new HttpError(401, "Please sign in first.");

  try {
    const { payload } = await jwtVerify(token, keys, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ["RS256"],
    });
    if (!payload.sub) throw new Error("Token has no user id.");
    return { uid: payload.sub, token };
  } catch {
    throw new HttpError(401, "Your sign-in has expired. Please sign in again.");
  }
}

// Reads the caller's OWN profile through Firestore's REST API, using the caller's own
// token, so your normal Firestore security rules decide what is allowed.
async function getOwnRole(uid, token, { projectId = PROJECT_ID, fetchImpl = fetch } = {}) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;
  const res = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const doc = await res.json();
  return doc?.fields?.role?.stringValue || null;
}

async function requireAdmin(headers) {
  const user = await module.exports.verifyToken(headers);
  const role = await module.exports.getOwnRole(user.uid, user.token);
  if (role !== "admin") throw new HttpError(403, "Only admins can do this.");
  return user;
}

module.exports = { verifyToken, getOwnRole, requireAdmin };