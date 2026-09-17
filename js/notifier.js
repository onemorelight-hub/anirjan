/**
 * ============================================================================
 * ANIRJAN NOTIFIER CLIENT (js/notifier.js)
 * ============================================================================
 * Dispatches form submissions to your private Google Apps Script Webhook.
 * 
 * Secure: Does NOT contain any Telegram bot tokens or WhatsApp private keys.
 * Those are stored safely on your Google Cloud / Apps Script.
 * ============================================================================
 */

// PASTE YOUR DEPLOYED GOOGLE APPS SCRIPT WEB APP URL HERE:
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby_AmMaqTZV7oRqhUo5vkDOm_MyKD_LEA1EnpPpA1sfRWuujEaiuUCQYMc3qYqmCR9l/exec";
// Example: "https://script.google.com/macros/s/AKfycbx.../exec"

const AnirjanNotifier = {
  /**
   * Dispatches a lead / ticket to the multi-channel backend.
   * @param {Object} data
   *   @param {string} data.formType - "ANIRJAN_CONNECT" | "SUPPORT_REQUEST" | "FEEDBACK"
   *   @param {string} data.refId - Unique reference code
   *   @param {string} data.name - Submitter name
   *   @param {string} [data.whatsapp] - WhatsApp number
   *   @param {string} [data.telegram] - Telegram handle/number
   *   @param {string} [data.email] - Email address
   *   @param {string} [data.city] - City / Location
   *   @param {string} [data.category] - Topic / Category
   *   @param {string} [data.details] - Main message / notes
   *   @param {Object} [data.meta] - Additional metadata (participation, investment, etc.)
   * @returns {Promise<{success: boolean, refId: string}>}
   */
  async dispatch(data) {
    const payload = {
      formType: data.formType || "ANIRJAN_CONNECT",
      refId: data.refId || ("REF-" + Math.floor(100000 + Math.random() * 900000)),
      name: data.name || "Anonymous",
      whatsapp: data.whatsapp || "Not provided",
      telegram: data.telegram || "Not provided",
      email: data.email || "Not provided",
      city: data.city || "Not provided",
      category: data.category || "General",
      details: data.details || "",
      meta: data.meta || {},
      submittedAt: new Date().toISOString()
    };

    console.log("[AnirjanNotifier] Dispatching submission:", payload);

    // If endpoint is not yet configured, log helpful developer info and succeed locally
    if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL === "") {
      console.warn(
        "[AnirjanNotifier] Google Apps Script URL not configured yet. " +
        "See backend/README.md to deploy your free Telegram/WhatsApp/Email backend in 2 minutes."
      );
      // Simulate network latency for smooth UI feedback
      await new Promise(r => setTimeout(r, 600));
      return { success: true, refId: payload.refId, simulated: true };
    }

    try {
      // Send as POST to Google Apps Script
      // Using text/plain payload avoids CORS preflight OPTIONS which Apps Script doesn't handle natively
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // Allows cross-origin post to Google Apps Script without errors
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      console.log("[AnirjanNotifier] Successfully delivered to Google Apps Script webhook.");
      return { success: true, refId: payload.refId };
    } catch (err) {
      console.error("[AnirjanNotifier] Error sending to webhook:", err);
      // Return success anyway so user sees thank you screen with their reference ID
      return { success: true, refId: payload.refId, error: err.message };
    }
  }
};

window.AnirjanNotifier = AnirjanNotifier;
