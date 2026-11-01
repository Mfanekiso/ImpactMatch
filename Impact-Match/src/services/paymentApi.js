import md5 from "md5";

// PayFast SANDBOX details (public test details, safe to keep in the app).
// This is PayFast's official sandbox account WITH a passphrase.
// Never put live keys or a live passphrase in the app.
//
// If you want to try the other default test account instead, use:
//   merchantId "10000100", merchantKey "46f0cd694581a", passphrase ""
export const PAYFAST_CONFIG = {
  merchantId: "10004002",
  merchantKey: "q1cd2rdny4a53",
  passphrase: "payfast",
  processUrl: "https://sandbox.payfast.co.za/eng/process",
  // The app watches for these addresses inside the WebView.
  returnUrl: "http://localhost:8081/payment-verify?payment=complete",
  cancelUrl: "http://localhost:8081/payment-verify?payment=cancelled",
  
  notifyUrl: "https://us-central1-semester-2-project-c6235.cloudfunctions.net/payfastNotify",
  platformFeeRate: 0.03, // 3%

};

/**
 * One place to work out the money, so every screen and the server agree.
 * Uses cents to avoid decimal mistakes.
 */
export function calculateAmounts(amount) {
  const principalCents = Math.round((Number(amount) || 0) * 100);
  const feeCents = Math.round(principalCents * PAYFAST_CONFIG.platformFeeRate);
  const totalCents = principalCents + feeCents;
  return {
    principal: principalCents / 100,
    fee: feeCents / 100,
    total: totalCents / 100,
  };
}

// PayFast needs the same format as PHP's urlencode()
const phpUrlEncode = (str) =>
  encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A")
    .replace(/~/g, "%7E")
    .replace(/%20/g, "+");

// NEW: PayFast rejects fields with odd characters (accents, emojis, curly quotes).
// This keeps only normal keyboard characters, removes extra spaces and cuts the length.
const cleanText = (value, maxLength, fallback) => {
  const cleaned = String(value || "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, maxLength);
  return cleaned || fallback;
};

/**
 * Builds the PayFast sandbox checkout link with a signature.
 */
export function buildPayFastCheckoutUrl({ sponsorshipId, amount, projectTitle, sponsorEmail, sponsorName }) {
  const { total } = calculateAmounts(amount);

  // The order of these fields matters for the signature. Do not reorder them.
  const paymentData = {
    merchant_id: PAYFAST_CONFIG.merchantId,
    merchant_key: PAYFAST_CONFIG.merchantKey,
    return_url: `${PAYFAST_CONFIG.returnUrl}&id=${sponsorshipId}`,
    cancel_url: `${PAYFAST_CONFIG.cancelUrl}&id=${sponsorshipId}`,
    notify_url: PAYFAST_CONFIG.notifyUrl,
    name_first: cleanText(sponsorName, 100, "Sponsor"),
    email_address: String(sponsorEmail || "sponsor@impactmatch.org").trim(),
    m_payment_id: String(sponsorshipId).trim(),
    amount: total.toFixed(2),
    item_name: cleanText(projectTitle, 100, "Project sponsorship"),
  };

  // 1. Build the parameter string once (empty values are left out)
  const pairs = [];
  for (const key in paymentData) {
    if (paymentData[key] !== "") {
      pairs.push(`${key}=${phpUrlEncode(paymentData[key])}`);
    }
  }
  const pfParamString = pairs.join("&");

  // 2. Sign it. The passphrase is added ONLY to the string we sign, never sent in the link.
  const passphrase = PAYFAST_CONFIG.passphrase.trim();
  const stringToSign = passphrase
    ? `${pfParamString}&passphrase=${phpUrlEncode(passphrase)}`
    : pfParamString;
  const signature = md5(stringToSign);

  // 3. While testing, show what was signed so it can be checked
  if (__DEV__) {
    console.log("PayFast string signed:", stringToSign);
    console.log("PayFast signature:", signature);
  }

  // 4. Return the link with the signature added
  return `${PAYFAST_CONFIG.processUrl}?${pfParamString}&signature=${signature}`;
}

/**
 * Use inside the WebView's onNavigationStateChange / onShouldStartLoadWithRequest.
 * Returns "complete", "cancelled", or null (keep the WebView open).
 * "complete" only means the user came back. Wait for the server to set the sponsorship to "active".
 */

export function getPaymentResultFromUrl(url) {
  
  if (!url || !url.startsWith("http://localhost:8081/payment-verify")) {
    return null;
  }
  if (url.includes("payment=complete")) return "complete";
  if (url.includes("payment=cancelled")) return "cancelled";
  return null;
}