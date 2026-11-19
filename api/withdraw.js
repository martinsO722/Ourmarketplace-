// File path in GitHub: /api/withdraw.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { amount, accountNumber, bankCode, accountName } = req.body;
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY; // Set inside Vercel Environment Variables

  try {
    // Step 1: Create a Transfer Recipient on Paystack for the Nigerian Bank Account
    const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: "nuban",
        name: accountName || "OurMarketplace User",
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN"
      })
    });
    const recipientData = await recipientRes.json();

    if (!recipientData.status) {
      return res.status(400).json({ success: false, message: recipientData.message });
    }

    // Step 2: Initiate the Naira Transfer to their Local Bank
    const transferRes = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        source: "balance",
        amount: amount * 100, // Convert Naira to Kobo
        recipient: recipientData.data.recipient_code,
        reason: "OurMarketplace Commission/Sales Payout"
      })
    });
    const transferData = await transferRes.json();

    return res.status(200).json({
      success: transferData.status,
      message: transferData.message,
      reference: transferData.data?.reference
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error processing payout." });
  }
}
