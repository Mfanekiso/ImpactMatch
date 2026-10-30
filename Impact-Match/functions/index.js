const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

exports.payfastNotify = functions.https.onRequest(async (req, res) => {
  // PayFast sends data as a POST application/x-www-form-urlencoded
  const payload = req.body;
  
  // 1. Verify the ITN is genuinely from PayFast
  try {
    const pfParamString = new URLSearchParams(payload).toString();
    const response = await axios.post(
      "https://sandbox.payfast.co.za/eng/query/validate", 
      pfParamString, 
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    
    if (response.data !== "VALID") {
      console.error("PayFast ITN Validation failed");
      return res.status(400).send("Invalid Request");
    }
  } catch (error) {
    console.error("Error validating PayFast ITN", error);
    return res.status(500).send("Server Error");
  }

  // 2. Only process the data if the payment actually cleared
  if (payload.payment_status !== "COMPLETE") {
    console.log(`Payment status is ${payload.payment_status}, ignoring.`);
    return res.status(200).send("OK");
  }

  const sponsorshipId = payload.m_payment_id;
  const payfastRef = payload.pf_payment_id; // PayFast's unique transaction ID
  const amountPaid = Number(payload.amount_gross);

  // 3. Firestore Transaction: Lock records so they succeed or fail together
  try {
    await db.runTransaction(async (transaction) => {
      const sponsorshipRef = db.collection("sponsorships").doc(sponsorshipId);
      const sponsorshipSnap = await transaction.get(sponsorshipRef);

      if (!sponsorshipSnap.exists) throw new Error("Sponsorship not found");
      const sponsorship = sponsorshipSnap.data();

      // Idempotency check: Ensure we don't double-process the same payment
      if (sponsorship.paymentStatus === "complete") return; 

      const projectId = sponsorship.projectId;
      const projectRef = db.collection("projects").doc(projectId);
      const projectSnap = await transaction.get(projectRef);

      if (!projectSnap.exists) throw new Error("Project not found");
      const project = projectSnap.data();
      const currentRaised = Number(project.raisedAmount) || 0;

      // Create a unique Payment doc using PayFast's Ref (Prevents overwriting previous failed attempts)
      const paymentRef = db.collection("payments").doc(payfastRef); 
      
      const paymentData = {
        paymentId: payfastRef,
        sponsorshipId: sponsorshipId,
        projectId: projectId,
        sponsorId: sponsorship.sponsorId || "", 
        amountPaid: amountPaid,
        provider: "payfast",
        status: "complete",
        payfastRef: payfastRef,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Commit all writes at once
      transaction.set(paymentRef, paymentData);
      transaction.update(sponsorshipRef, {
        status: "active",
        paymentStatus: "complete",
        transactionReference: payfastRef,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      transaction.update(projectRef, {
        raisedAmount: currentRaised + amountPaid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    // You MUST return 200 OK to PayFast, otherwise they will relentlessly retry the ping
    return res.status(200).send("OK");
  } catch (error) {
    console.error("Firestore Transaction failed: ", error);
    return res.status(500).send("Transaction Error");
  }
});