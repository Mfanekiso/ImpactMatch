const crypto = require("node:crypto");
const querystring = require("node:querystring");
const { initializeApp } = require("firebase-admin/app");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");
const { defineSecret, defineString } = require("firebase-functions/params");
const { HttpsError, onCall, onRequest } = require("firebase-functions/v2/https");

initializeApp();
const db = getFirestore();
const REGION = "us-central1";
const PLATFORM_FEE_PERCENT = 3;

const payfastMerchantId = defineSecret("PAYFAST_MERCHANT_ID");
const payfastMerchantKey = defineSecret("PAYFAST_MERCHANT_KEY");
const payfastPassphrase = defineSecret("PAYFAST_PASSPHRASE");
const payfastMode = defineString("PAYFAST_MODE", { default: "sandbox" });

const roundToCents = (amount) => Math.round((Number(amount) + Number.EPSILON) * 100);
const amountFromCents = (cents) => Number((cents / 100).toFixed(2));
const payfastHost = () => payfastMode.value() === "live" ? "www.payfast.co.za" : "sandbox.payfast.co.za";

function functionsBaseUrl() {
  const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) throw new Error("Firebase project ID is unavailable in this function runtime.");
  return `https://${REGION}-${projectId}.cloudfunctions.net`;
}

function urlEncodePayFast(value) {
  return encodeURIComponent(String(value).trim())
    .replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, "+");
}

function createSignature(fields, passphrase = "") {
  const parts = Object.entries(fields)
    .filter(([key, value]) => key !== "signature" && value !== "" && value != null)
    .map(([key, value]) => `${key}=${urlEncodePayFast(value)}`);
  if (passphrase) parts.push(`passphrase=${urlEncodePayFast(passphrase)}`);
  return crypto.createHash("md5").update(parts.join("&")).digest("hex");
}

function timingSafeEqualHex(left, right) {
  if (!/^[a-f0-9]{32}$/i.test(String(left || "")) || !/^[a-f0-9]{32}$/i.test(String(right || ""))) return false;
  return crypto.timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function toPaymentPage(title, message, paymentId) {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const safePaymentId = escapeHtml(paymentId);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle}</title><style>body{font-family:system-ui,sans-serif;background:#f3f6f5;color:#433327;margin:0;padding:32px 20px}.card{max-width:440px;margin:8vh auto;background:#fff;border:1px solid #e8dfd5;border-radius:18px;padding:24px;box-sizing:border-box}h1{font-size:20px;margin:0 0 12px}p{font-size:15px;line-height:1.5;color:#6f5f52}.ref{font-size:12px;color:#8c7a6b;word-break:break-all}</style></head><body><main class="card"><h1>${safeTitle}</h1><p>${safeMessage}</p><p class="ref">Payment reference: ${safePaymentId}</p><p>You can close this page and return to Impact Match. The app will show the server-confirmed status.</p></main></body></html>`;
}

exports.createPayFastCheckout = onCall(async (request) => {
  const sponsorId = request.auth?.uid;
  const sponsorshipId = String(request.data?.sponsorshipId || "");
  if (!sponsorId) throw new HttpsError("unauthenticated", "Sign in to continue.");
  if (!/^[A-Za-z0-9_-]{10,80}$/.test(sponsorshipId)) {
    throw new HttpsError("invalid-argument", "The sponsorship reference is invalid.");
  }

  const sponsorshipRef = db.collection("sponsorships").doc(sponsorshipId);
  const paymentRef = db.collection("payments").doc(sponsorshipId);
  const result = await db.runTransaction(async (transaction) => {
    const sponsorshipSnapshot = await transaction.get(sponsorshipRef);
    if (!sponsorshipSnapshot.exists) throw new HttpsError("not-found", "The sponsorship proposal could not be found.");
    const sponsorship = sponsorshipSnapshot.data();
    if (sponsorship.sponsorId !== sponsorId) throw new HttpsError("permission-denied", "This proposal belongs to another sponsor.");

    const projectRef = db.collection("projects").doc(String(sponsorship.projectId || ""));
    const projectSnapshot = await transaction.get(projectRef);
    if (!projectSnapshot.exists) throw new HttpsError("not-found", "The project could not be found.");
    const project = projectSnapshot.data();
    const ngoId = project.ngoOwnerId || project.ownerId;
    if (!ngoId || ngoId !== sponsorship.ngoId) throw new HttpsError("failed-precondition", "The project owner could not be verified.");
    if (ngoId === sponsorId) throw new HttpsError("failed-precondition", "You cannot fund your own project.");
    if (!["open", "active", "Active"].includes(String(project.status || ""))) {
      throw new HttpsError("failed-precondition", "This project is not accepting sponsorships.");
    }

    const principalCents = roundToCents(sponsorship.amount);
    if (!Number.isSafeInteger(principalCents) || principalCents < 500) {
      throw new HttpsError("invalid-argument", "The minimum sponsorship amount is R5.00.");
    }
    const feeCents = Math.round(principalCents * PLATFORM_FEE_PERCENT / 100);
    const totalCents = principalCents + feeCents;
    const paymentSnapshot = await transaction.get(paymentRef);

    if (paymentSnapshot.exists) {
      const prior = paymentSnapshot.data();
      if (prior.sponsorId !== sponsorId || prior.projectId !== sponsorship.projectId) {
        throw new HttpsError("permission-denied", "This payment reference is already in use.");
      }
      if (prior.status === "complete") return { status: "complete", paymentId: paymentRef.id };
      if (prior.status === "pending") return { status: "pending", paymentId: paymentRef.id };
      if (prior.status !== "failed" && prior.status !== "cancelled") {
        throw new HttpsError("failed-precondition", "This payment cannot be started again.");
      }
      transaction.update(paymentRef, {
        status: "pending",
        attemptCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(sponsorshipRef, { status: "payment_pending", updatedAt: FieldValue.serverTimestamp() });
      return { status: "pending", paymentId: paymentRef.id };
    }

    const releaseCents = [
      Math.round(principalCents / 4),
      Math.floor(principalCents / 4),
      Math.floor(principalCents / 4),
      principalCents - Math.round(principalCents / 4) - Math.floor(principalCents / 4) * 2,
    ];
    transaction.create(paymentRef, {
      paymentId: paymentRef.id,
      sponsorshipId,
      projectId: sponsorship.projectId,
      projectTitle: project.title || sponsorship.projectTitle || "Project sponsorship",
      sponsorId,
      ngoId,
      currency: "ZAR",
      sponsorshipAmount: amountFromCents(principalCents),
      platformFeeAmount: amountFromCents(feeCents),
      totalAmount: amountFromCents(totalCents),
      sponsorshipAmountCents: principalCents,
      platformFeeCents: feeCents,
      totalAmountCents: totalCents,
      releasePlan: releaseCents.map((amountCents, index) => ({
        stage: index === 0 ? "acceptance" : `milestone_${index}`,
        amount: amountFromCents(amountCents),
        status: "planned",
      })),
      provider: "payfast",
      providerMode: payfastMode.value(),
      status: "pending",
      attemptCount: 1,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(sponsorshipRef, { status: "payment_pending", updatedAt: FieldValue.serverTimestamp() });
    return { status: "pending", paymentId: paymentRef.id };
  });

  if (result.status === "complete") return { paymentId: result.paymentId, status: "complete" };
  const checkoutUrl = `${functionsBaseUrl()}/payFastCheckout?paymentId=${encodeURIComponent(result.paymentId)}`;
  return { paymentId: result.paymentId, status: result.status, checkoutUrl };
});

exports.payFastCheckout = onRequest({
  region: REGION,
  secrets: [payfastMerchantId, payfastMerchantKey, payfastPassphrase],
}, async (request, response) => {
  response.set("Cache-Control", "no-store");
  const paymentId = String(request.query.paymentId || "");
  if (request.method !== "GET" || !/^[A-Za-z0-9_-]{10,80}$/.test(paymentId)) {
    response.status(400).send("Invalid payment reference.");
    return;
  }

  try {
    const paymentSnapshot = await db.collection("payments").doc(paymentId).get();
    if (!paymentSnapshot.exists) { response.status(404).send("Payment not found."); return; }
    const payment = paymentSnapshot.data();
    if (payment.status === "complete") {
      response.status(200).type("html").send(toPaymentPage("Payment already confirmed", "This sponsorship payment has already been confirmed.", paymentId));
      return;
    }
    if (payment.status !== "pending") { response.status(409).send("This payment is not ready for checkout."); return; }

    const userSnapshot = await db.collection("users").doc(payment.sponsorId).get();
    const user = userSnapshot.exists ? userSnapshot.data() : {};
    const displayName = String(user.full_name || user.name || "").trim().split(/\s+/).filter(Boolean);
    const firstName = displayName[0] || "Sponsor";
    const lastName = displayName.slice(1).join(" ") || "";
    const email = String(user.email || "").trim();
    const baseUrl = functionsBaseUrl();
    const fields = {
      merchant_id: payfastMerchantId.value().trim(),
      merchant_key: payfastMerchantKey.value().trim(),
      return_url: `${baseUrl}/payFastReturn?paymentId=${encodeURIComponent(paymentId)}&result=return`,
      cancel_url: `${baseUrl}/payFastReturn?paymentId=${encodeURIComponent(paymentId)}&result=cancel`,
      notify_url: `${baseUrl}/payFastItn`,
      name_first: firstName.slice(0, 100),
      name_last: lastName.slice(0, 100),
      email_address: email.slice(0, 100),
      m_payment_id: paymentId,
      amount: Number(payment.totalAmount).toFixed(2),
      item_name: String(payment.projectTitle || "Project sponsorship").slice(0, 100),
      item_description: `Impact Match project sponsorship ${paymentId}`.slice(0, 255),
      custom_str1: payment.projectId,
      custom_str2: payment.sponsorshipId,
    };
    fields.signature = createSignature(fields, payfastPassphrase.value());
    const action = `https://${payfastHost()}/eng/process`;
    const inputs = Object.entries(fields).map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`).join("");
    response.status(200).set("Content-Type", "text/html; charset=utf-8").send(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; form-action https://${payfastHost()}; script-src 'unsafe-inline'; style-src 'unsafe-inline'"><title>Opening PayFast</title><style>body{font-family:system-ui,sans-serif;background:#f3f6f5;color:#433327;padding:32px 20px;text-align:center}.card{max-width:420px;margin:10vh auto;background:white;border:1px solid #e8dfd5;border-radius:18px;padding:24px}p{color:#6f5f52;line-height:1.5}</style></head><body><main class="card"><h1>Opening PayFast</h1><p>We are sending you to PayFast’s secure checkout. Do not close this page while checkout is opening.</p><form id="payfast" action="${action}" method="post">${inputs}<button type="submit">Continue to PayFast</button></form></main><script>document.getElementById('payfast').submit()</script></body></html>`
    );
  } catch (error) {
    console.error("Could not prepare PayFast checkout", error?.message);
    response.status(500).send("Could not start checkout. Return to Impact Match and try again.");
  }
});

exports.payFastReturn = onRequest({ region: REGION }, (request, response) => {
  const paymentId = String(request.query.paymentId || "");
  const cancelled = request.query.result === "cancel";
  response.status(200).set("Content-Type", "text/html; charset=utf-8").send(
    toPaymentPage(
      cancelled ? "Checkout cancelled" : "Payment submitted",
      cancelled ? "You cancelled the PayFast checkout. No payment is recorded as complete." : "PayFast has returned you to Impact Match. The app is waiting for the secure payment notification.",
      paymentId
    )
  );
});

const PAYFAST_CIDRS = [
  ["197.97.145.144", 28],
  ["41.74.179.192", 27],
  ["102.216.36.0", 28],
  ["102.216.36.128", 28],
  ["144.126.193.139", 32],
];

function ipv4Number(address) {
  const normalized = String(address || "").replace(/^::ffff:/i, "");
  const octets = normalized.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null;
  return (((octets[0] << 24) >>> 0) + (octets[1] << 16) + (octets[2] << 8) + octets[3]) >>> 0;
}

function isPayFastIp(address) {
  if (process.env.FUNCTIONS_EMULATOR === "true") return true;
  const remote = ipv4Number(address);
  if (remote == null) return false;
  return PAYFAST_CIDRS.some(([networkAddress, prefix]) => {
    const network = ipv4Number(networkAddress);
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    return (remote & mask) === (network & mask);
  });
}

function parseItnPayload(rawBody) {
  const params = new URLSearchParams(rawBody);
  const entries = [...params.entries()];
  return {
    entries,
    data: Object.fromEntries(entries),
    signatureInput: entries.filter(([key, value]) => key !== "signature" && value !== "")
      .map(([key, value]) => `${key}=${urlEncodePayFast(value)}`).join("&"),
  };
}

async function verifyPayFastServer(rawBody, host) {
  const response = await fetch(`https://${host}/eng/query/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: rawBody,
    signal: AbortSignal.timeout(10000),
  });
  return response.ok && (await response.text()).trim() === "VALID";
}

async function applyVerifiedItn(data) {
  const paymentId = String(data.m_payment_id || "");
  const paymentRef = db.collection("payments").doc(paymentId);
  await db.runTransaction(async (transaction) => {
    const paymentSnapshot = await transaction.get(paymentRef);
    if (!paymentSnapshot.exists) throw new Error("Payment reference does not exist.");
    const payment = paymentSnapshot.data();
    if (payment.status === "complete") return;
    if (payment.status !== "pending") throw new Error("Payment is not awaiting confirmation.");

    const projectRef = db.collection("projects").doc(payment.projectId);
    const sponsorshipRef = db.collection("sponsorships").doc(payment.sponsorshipId);
    const [projectSnapshot, sponsorshipSnapshot] = await Promise.all([
      transaction.get(projectRef),
      transaction.get(sponsorshipRef),
    ]);
    if (!projectSnapshot.exists || !sponsorshipSnapshot.exists) throw new Error("Linked project or sponsorship is missing.");

    const project = projectSnapshot.data();
    const raised = Number(project.raisedAmount) || 0;
    const sponsorshipAmount = Number(payment.sponsorshipAmount);
    transaction.update(paymentRef, {
      status: "complete",
      payfastPaymentId: String(data.pf_payment_id || ""),
      paymentMethod: String(data.payment_method || ""),
      amountGross: Number(data.amount_gross),
      paidAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(sponsorshipRef, {
      status: "active",
      paymentId,
      paidAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(projectRef, {
      raisedAmount: Number((raised + sponsorshipAmount).toFixed(2)),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

async function applyUnsuccessfulItn(paymentId, status, sponsorshipId) {
  const paymentRef = db.collection("payments").doc(paymentId);
  const sponsorshipRef = db.collection("sponsorships").doc(sponsorshipId);
  await db.runTransaction(async (transaction) => {
    const paymentSnapshot = await transaction.get(paymentRef);
    if (!paymentSnapshot.exists) throw new Error("Payment reference does not exist.");
    const payment = paymentSnapshot.data();
    if (payment.status !== "pending") return;
    if (payment.sponsorshipId !== sponsorshipId) throw new Error("Sponsorship reference does not match.");
    const sponsorshipSnapshot = await transaction.get(sponsorshipRef);
    if (!sponsorshipSnapshot.exists) throw new Error("Linked sponsorship is missing.");

    transaction.update(paymentRef, {
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(sponsorshipRef, {
      status: "proposed",
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

exports.payFastItn = onRequest({
  region: REGION,
  secrets: [payfastMerchantId, payfastPassphrase],
}, async (request, response) => {
  if (request.method !== "POST") { response.status(405).send("POST required."); return; }
  const remoteAddress = request.ip || request.socket?.remoteAddress;
  if (!isPayFastIp(remoteAddress)) { response.status(403).send("Invalid payment notification source."); return; }

  const rawBody = Buffer.isBuffer(request.rawBody)
    ? request.rawBody.toString("utf8")
    : typeof request.body === "string"
      ? request.body
      : querystring.stringify(request.body || {});
  const { data, signatureInput } = parseItnPayload(rawBody);
  if (!data.signature || !data.m_payment_id) { response.status(400).send("Missing payment notification fields."); return; }

  const expectedSignature = crypto.createHash("md5")
    .update(payfastPassphrase.value() ? `${signatureInput}&passphrase=${urlEncodePayFast(payfastPassphrase.value())}` : signatureInput)
    .digest("hex");
  if (!timingSafeEqualHex(data.signature, expectedSignature)) { response.status(400).send("Invalid payment notification signature."); return; }
  if (data.merchant_id !== payfastMerchantId.value().trim()) { response.status(400).send("Merchant ID mismatch."); return; }

  try {
    const host = payfastHost();
    if (!await verifyPayFastServer(rawBody, host)) { response.status(400).send("PayFast server validation failed."); return; }

    const paymentSnapshot = await db.collection("payments").doc(String(data.m_payment_id)).get();
    if (!paymentSnapshot.exists) { response.status(404).send("Payment reference not found."); return; }
    const payment = paymentSnapshot.data();
    if (data.custom_str1 !== payment.projectId || data.custom_str2 !== payment.sponsorshipId) {
      response.status(400).send("Payment reference details do not match.");
      return;
    }
    if (Math.abs(roundToCents(data.amount_gross) - Number(payment.totalAmountCents)) > 0) {
      response.status(400).send("Payment amount mismatch.");
      return;
    }
    if (data.payment_status === "COMPLETE") {
      await applyVerifiedItn(data);
    } else if (["FAILED", "CANCELLED"].includes(data.payment_status) && payment.status === "pending") {
      await applyUnsuccessfulItn(String(data.m_payment_id), data.payment_status.toLowerCase(), payment.sponsorshipId);
    }
    response.status(200).send("OK");
  } catch (error) {
    console.error("PayFast ITN processing failed", error?.message);
    response.status(500).send("Payment notification could not be processed.");
  }
});

// Export the pure signature helper for local integration checks.
exports._createSignature = createSignature;
