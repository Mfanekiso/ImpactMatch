import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../../Backend/firebaseConfig";

/**
 * Loads the signed-in user's PAID transactions in real time.
 *   role "sponsor" -> payments the user made
 *   role "ngo"     -> payments the user's organisation received
 *
 * It reads two places and joins them into one clean list:
 *   1. the "payments" collection
 *   2. the "sponsorships" collection (only the ones that are already paid)
 *
 * It also counts how many transactions the user has not seen yet.
 * Every screen that calls this hook (the tab badge and the Impact screen)
 * shares the same "seen" memory, so the badge clears everywhere at once.
 */

// ─── helpers ─────────────────────────────────────────────────────────────
const SEEN_KEY = (uid) => `impact-match:transactions:seen:v2:${uid}`;

const num = (value) => Number(value) || 0;
const round2 = (value) => Math.round(value * 100) / 100;
const toMillis = (timestamp) => timestamp?.toMillis?.() ?? 0;

const PAID_WORDS = ["paid", "complete", "completed"];
const isPaidWord = (value) => PAID_WORDS.includes(String(value || "").toLowerCase());

// One row from the "payments" collection -> one clean transaction
function fromPayment(id, p) {
  if (!isPaidWord(p.paymentStatus ?? p.status)) return null;

  const amount = num(p.sponsorshipAmount ?? p.amount ?? p.amountPaid);
  const total = num(p.totalAmount ?? p.amountPaid) || amount + num(p.platformFeeAmount);
  const fee = p.platformFeeAmount != null ? num(p.platformFeeAmount) : round2(Math.max(total - amount, 0));

  return {
    key: p.sponsorshipId || id,
    id,
    reference: p.transactionReference || id,
    sponsorshipId: p.sponsorshipId || id,
    projectId: p.projectId || "",
    projectTitle: p.projectTitle || "",
    sponsorId: p.sponsorId || "",
    ngoId: p.ngoId || "",
    sponsorName: p.sponsorName || "",
    ngoName: p.ngoName || "",
    amount,
    fee,
    total,
    feeRate: num(p.platformFeeRate) || (amount > 0 ? round2(fee / amount) : 0),
    method: p.paymentMethod || "",
    fundingType: p.fundingType || "",
    paidAt: p.paidAt || p.createdAt || p.updatedAt || null,
  };
}

// One row from the "sponsorships" collection -> one clean transaction (only if paid)
function fromSponsorship(id, s) {
  const paid =
    isPaidWord(s.paymentStatus) ||
    ["active", "complete", "completed", "paid"].includes(String(s.status || "").toLowerCase()) ||
    !!s.paidAt ||
    !!s.transactionReference ||
    !!s.paymentId;
  if (!paid) return null;

  const amount = num(s.amount);
  const fee = num(s.platformFeeAmount);
  const total = num(s.totalAmount) || amount + fee;

  return {
    key: id,
    id,
    reference: s.transactionReference || id,
    sponsorshipId: id,
    projectId: s.projectId || "",
    projectTitle: s.projectTitle || "",
    sponsorId: s.sponsorId || "",
    ngoId: s.ngoId || "",
    sponsorName: s.sponsorName || "",
    ngoName: s.ngoName || "",
    amount,
    fee,
    total,
    feeRate: num(s.platformFeeRate) || (amount > 0 ? round2(fee / amount) : 0),
    method: s.paymentMethod || "",
    fundingType: s.fundingType || "",
    paidAt: s.paidAt || s.updatedAt || s.createdAt || null,
  };
}

// Join two versions of the same transaction. Real values win over empty ones.
function mergeRows(base, extra) {
  const merged = { ...base };
  Object.keys(extra).forEach((field) => {
    const value = extra[field];
    if (value !== "" && value != null && value !== 0) merged[field] = value;
  });
  return merged;
}

// ─── names of the other person (sponsor or organisation) ───────────────────
const nameCache = new Map(); // userId -> Promise<string>

function loadName(userId) {
  if (!nameCache.has(userId)) {
    nameCache.set(
      userId,
      (async () => {
        try {
          const snap = await getDoc(doc(db, "users", userId));
          const d = snap.exists() ? snap.data() : {};
          return (
            d.organisationName || d.organizationName || d.orgName || d.companyName ||
            d.name || d.full_name || d.displayName || ""
          );
        } catch (error) {
          return "";
        }
      })()
    );
  }
  return nameCache.get(userId);
}

// ─── shared "seen" memory ────────────────────────────────────────────────
const seenListeners = new Set();

async function saveSeen(uid, ids) {
  seenListeners.forEach((listener) => listener(uid, ids)); // tell every screen first
  try {
    await AsyncStorage.setItem(SEEN_KEY(uid), JSON.stringify(ids));
  } catch (error) {
    console.warn("Could not save seen transactions:", error?.message);
  }
}

// ─── the hook ────────────────────────────────────────────────────────────
export default function useTransactions(role = "sponsor") {
  const [uid, setUid] = useState(auth.currentUser?.uid || null);
  const [paymentRows, setPaymentRows] = useState([]);
  const [sponsorshipRows, setSponsorshipRows] = useState([]);
  const [ready, setReady] = useState({ payments: false, sponsorships: false });
  const [failed, setFailed] = useState({ payments: false, sponsorships: false });
  const [seenIds, setSeenIds] = useState(null); // null = nothing saved yet
  const [seenLoaded, setSeenLoaded] = useState(false);
  const [names, setNames] = useState({});

  // 1. Who is signed in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUid(user?.uid || null));
    return unsubscribe;
  }, []);

  // 2. Listen to the money records
  useEffect(() => {
    setPaymentRows([]);
    setSponsorshipRows([]);
    if (!uid) {
      setReady({ payments: true, sponsorships: true });
      setFailed({ payments: false, sponsorships: false });
      return undefined;
    }
    setReady({ payments: false, sponsorships: false });
    setFailed({ payments: false, sponsorships: false });

    const field = role === "ngo" ? "ngoId" : "sponsorId";
    const finish = (name, didFail) => {
      setReady((prev) => ({ ...prev, [name]: true }));
      setFailed((prev) => ({ ...prev, [name]: didFail }));
    };

    const unsubscribePayments = onSnapshot(
      query(collection(db, "payments"), where(field, "==", uid)),
      (snapshot) => {
        setPaymentRows(snapshot.docs.map((d) => fromPayment(d.id, d.data())).filter(Boolean));
        finish("payments", false);
      },
      (error) => {
        console.warn("Could not load payments:", error?.message);
        finish("payments", true);
      }
    );

    const unsubscribeSponsorships = onSnapshot(
      query(collection(db, "sponsorships"), where(field, "==", uid)),
      (snapshot) => {
        setSponsorshipRows(snapshot.docs.map((d) => fromSponsorship(d.id, d.data())).filter(Boolean));
        finish("sponsorships", false);
      },
      (error) => {
        console.warn("Could not load sponsorships:", error?.message);
        finish("sponsorships", true);
      }
    );

    return () => {
      unsubscribePayments();
      unsubscribeSponsorships();
    };
  }, [uid, role]);

  // 3. Load what the user has already seen, and listen for changes from other screens
  useEffect(() => {
    setSeenIds(null);
    setSeenLoaded(false);
    if (!uid) return undefined;

    let active = true;
    AsyncStorage.getItem(SEEN_KEY(uid))
      .then((raw) => {
        if (!active) return;
        try {
          setSeenIds(raw ? new Set(JSON.parse(raw)) : null);
        } catch (error) {
          setSeenIds(null);
        }
        setSeenLoaded(true);
      })
      .catch(() => active && setSeenLoaded(true));

    const listener = (changedUid, ids) => {
      if (changedUid === uid) setSeenIds(new Set(ids));
    };
    seenListeners.add(listener);

    return () => {
      active = false;
      seenListeners.delete(listener);
    };
  }, [uid]);

  // 4. Join the two lists into one, newest first
  const joined = useMemo(() => {
    const byKey = new Map();
    sponsorshipRows.forEach((row) => byKey.set(row.key, row));
    paymentRows.forEach((row) => byKey.set(row.key, byKey.has(row.key) ? mergeRows(byKey.get(row.key), row) : row));
    return [...byKey.values()].sort(
      (a, b) => (toMillis(b.paidAt) || Date.now()) - (toMillis(a.paidAt) || Date.now())
    );
  }, [paymentRows, sponsorshipRows]);

  // 5. Find the name of the other side when the record does not have it
  const otherId = (row) => (role === "ngo" ? row.sponsorId : row.ngoId);
  const otherName = (row) => (role === "ngo" ? row.sponsorName : row.ngoName);

  useEffect(() => {
    let active = true;
    const missing = new Set();
    joined.forEach((row) => {
      const id = otherId(row);
      if (id && !otherName(row) && names[id] === undefined) missing.add(id);
    });
    missing.forEach((id) => {
      loadName(id).then((name) => {
        if (active) setNames((prev) => ({ ...prev, [id]: name }));
      });
    });
    return () => {
      active = false;
    };
  }, [joined, role, names]);

  const transactions = useMemo(
    () => joined.map((row) => ({ ...row, counterpartName: otherName(row) || names[otherId(row)] || "" })),
    [joined, names, role]
  );

  const loading = !(ready.payments && ready.sponsorships);
  const error = failed.payments && failed.sponsorships;

  // 6. First time ever: treat what already exists as seen, so only NEW ones get a badge
  useEffect(() => {
    if (!uid || loading || error || !seenLoaded || seenIds !== null) return;
    saveSeen(uid, transactions.map((t) => t.key));
  }, [uid, loading, error, seenLoaded, seenIds, transactions]);

  const unseenKeys = useMemo(() => {
    if (!seenLoaded || !seenIds) return [];
    return transactions.filter((t) => !seenIds.has(t.key)).map((t) => t.key);
  }, [transactions, seenIds, seenLoaded]);

  // 7. Call this when the user is looking at their transactions
  const latest = useRef({});
  latest.current = { uid, transactions, seenIds };

  const markAllSeen = useCallback(async () => {
    const { uid: currentUid, transactions: rows, seenIds: seen } = latest.current;
    if (!currentUid) return;
    const all = new Set([...(seen || []), ...rows.map((t) => t.key)]);
    await saveSeen(currentUid, [...all]);
  }, []);

  return { transactions, loading, error, unseenCount: unseenKeys.length, unseenKeys, markAllSeen };
}