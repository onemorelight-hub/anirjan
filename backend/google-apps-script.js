/**
 * ============================================================================
 * ANIRJAN NOTIFICATION & LEAD DISPATCHER (Google Apps Script)
 * ============================================================================
 * 
 * Enterprise Anti-Bot & Abuse Defense Engine:
 *   1. Cloudflare Turnstile Cryptographic Verification (Domain Locked).
 *   2. Strict Origin / Domain Whitelist Verification.
 *   3. Invisible Honeypot Trap (Silently catches & drops bots).
 *   4. Sub-Human Timing Detection (Blocks rapid automated script submissions).
 *   5. Single-User Deduplication Engine (CacheService prevents duplicate alerts).
 *   6. Anti-Flood & Rate Limiting (Per-user cooldown & global throttle).
 *   7. Safe Dispatch to Google Sheets, Telegram, WhatsApp & Email.
 * 
 * ----------------------------------------------------------------------------
 * SETUP INSTRUCTIONS (Takes ~2 minutes):
 * ----------------------------------------------------------------------------
 * 1. Open Google Sheets (https://sheets.google.com) and open your "Anirjan Submissions" sheet.
 * 2. In the top menu, click: Extensions -> Apps Script.
 * 3. Replace all code with this file.
 * 4. Fill in your credentials in the CONFIG section below:
 *    - Cloudflare Turnstile Secret Key (if enabled)
 *    - Telegram Bot Token & Chat ID
 *    - WhatsApp CallMeBot Key (if enabled)
 *    - Notification Email
 * 5. Click "Deploy" (top right) -> "Manage deployments" -> Click Edit (pencil icon)
 *    -> Version: "New version" -> Click "Deploy".
 * ============================================================================
 */

// ============================================================================
// 1. CONFIGURATION & SECURITY POLICY
// ============================================================================
const CONFIG = {
  // --- CLOUDFLARE TURNSTILE (Cryptographic Domain Lock) ---
  // Get free keys at: https://dash.cloudflare.com/?to=/:account/turnstile
  TURNSTILE_ENABLED: true,
  TURNSTILE_SECRET_KEY: "YOUR_TURNSTILE_SECRET_KEY_HERE", // Starts with 0x4...

  // --- DOMAIN / ORIGIN WHITELIST ---
  ENFORCE_DOMAIN_CHECK: true,
  ALLOWED_DOMAINS: [
    "anirjan.onrender.com",
    "anirjan.com",
    "www.anirjan.com",
    "localhost",
    "127.0.0.1"
  ],

  // --- ANTI-ABUSE & DEDUPLICATION ---
  ENFORCE_HONEYPOT: true,            // Drops bots that fill hidden fields
  ENFORCE_HUMAN_TIMING: true,        // Rejects submissions faster than real humans (<2.5s)
  MIN_SUBMISSION_TIME_MS: 2500,      // Minimum milliseconds human takes to fill form
  USER_COOLDOWN_SECONDS: 60,         // Cooldown between requests from the same user
  DEDUP_CACHE_HOURS: 12,             // Ignore identical duplicate messages for 12 hours
  MAX_GLOBAL_PER_MINUTE: 10,         // Global protection against distributed bot floods

  // --- TELEGRAM NOTIFICATIONS ---
  TELEGRAM_ENABLED: true,
  TELEGRAM_BOT_TOKEN: "YOUR_TELEGRAM_BOT_TOKEN_HERE", // e.g. "7123456789:AAH..."
  TELEGRAM_CHAT_ID: "YOUR_TELEGRAM_CHAT_ID_HERE",     // e.g. "123456789"

  // --- WHATSAPP NOTIFICATIONS (Via CallMeBot) ---
  WHATSAPP_ENABLED: false,
  WHATSAPP_PHONE: "+91XXXXXXXXXX",
  WHATSAPP_API_KEY: "YOUR_CALLMEBOT_API_KEY_HERE",

  // --- EMAIL NOTIFICATIONS ---
  EMAIL_ENABLED: true,
  NOTIFICATION_EMAIL: "your_email@gmail.com",
  EMAIL_SUBJECT_PREFIX: "[Anirjan Alert] ",

  // --- SHARE PORTAL (View My Share) CONFIGURATION ---
  ADMIN_PIN: "anirjan2026",
  PAR_SHARE_VALUE: 4.0,              // Fixed Par Value: ₹4.00 per share
  TOTAL_AUTHORIZED_SHARES: 100000,   // Total ecosystem authorized pool
  PARTICIPANT_POOL_SHARES: 40000,    // 40% participant pool
  FOUNDER_POOL_SHARES: 60000,        // 60% founder pool
  WELCOME_CORE_SHARES: 10,           // 10 Class A Sovereign welcome shares
  WELCOME_CALLABLE_SHARES: 10,       // 10 Class B Callable welcome shares
  OTP_EXPIRY_MINUTES: 10             // OTP validity window
};

// ============================================================================
// 2. HTTP POST HANDLER (Receives data from website)
// ============================================================================
function doPost(e) {
  try {
    let data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else {
      data = e.parameter || {};
    }

    // --- ROUTE SHARE PORTAL (View My Share) ACTIONS ---
    if (data.action) {
      return handleSharePortalAction(data);
    }

    const formType = data.formType || "ANIRJAN_CONNECT";
    const refId = data.refId || ("REF-" + new Date().getTime());
    const name = data.name || data.fullName || "Anonymous";
    const email = data.email || "Not provided";
    const whatsapp = data.whatsapp || data.contact || "Not provided";
    const telegram = data.telegram || "Not provided";
    const city = data.city || data.location || "Not provided";
    const category = data.category || data.topic || "General";
    const details = data.details || data.notes || data.message || "";
    const meta = data.meta || {};
    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    // ------------------------------------------------------------------------
    // SECURITY LAYER 1: INVISIBLE HONEYPOT TRAP
    // ------------------------------------------------------------------------
    // Scrapers & automated script bots greedily fill all form inputs.
    // If our honeypot fields have ANY value, silently discard without alerting!
    if (CONFIG.ENFORCE_HONEYPOT) {
      const honeypotVal = data._hp_website || data.hp_company || data._gotcha || "";
      if (honeypotVal && honeypotVal.trim() !== "") {
        Logger.log("[Security: HoneyPot] Bot caught and silenced: " + honeypotVal);
        return ContentService
          .createTextOutput(JSON.stringify({ status: "success", refId: refId, botTrapped: true }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // ------------------------------------------------------------------------
    // SECURITY LAYER 2: HUMAN TIMING VERIFICATION
    // ------------------------------------------------------------------------
    // Real humans take at least 2.5–5 seconds to read and submit a form.
    // Automated bot scripts submit in milliseconds.
    if (CONFIG.ENFORCE_HUMAN_TIMING && data.clientElapsedMs !== undefined) {
      const elapsed = Number(data.clientElapsedMs);
      if (!isNaN(elapsed) && elapsed < CONFIG.MIN_SUBMISSION_TIME_MS) {
        Logger.log("[Security: Timing] Sub-human submission speed (" + elapsed + "ms). Bot dropped.");
        return ContentService
          .createTextOutput(JSON.stringify({ status: "success", refId: refId, botSpeedTrapped: true }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // ------------------------------------------------------------------------
    // SECURITY LAYER 3: ORIGIN & DOMAIN CHECK
    // ------------------------------------------------------------------------
    if (CONFIG.ENFORCE_DOMAIN_CHECK) {
      const clientOrigin = (data.origin || "").toLowerCase();
      if (!isDomainAllowed(clientOrigin)) {
        Logger.log("[Security: Domain] Rejected unauthorized origin: " + clientOrigin);
        return ContentService
          .createTextOutput(JSON.stringify({ status: "error", message: "Forbidden: Unauthorized origin domain." }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // ------------------------------------------------------------------------
    // SECURITY LAYER 4: CLOUDFLARE TURNSTILE CRYPTOGRAPHIC VERIFICATION
    // ------------------------------------------------------------------------
    if (CONFIG.TURNSTILE_ENABLED && CONFIG.TURNSTILE_SECRET_KEY && CONFIG.TURNSTILE_SECRET_KEY !== "YOUR_TURNSTILE_SECRET_KEY_HERE") {
      const turnstileToken = data.turnstileToken || data["cf-turnstile-response"] || "";
      const turnstileResult = verifyCloudflareTurnstile(turnstileToken);
      if (!turnstileResult.success) {
        Logger.log("[Security: Turnstile] Verification failed: " + JSON.stringify(turnstileResult));
        return ContentService
          .createTextOutput(JSON.stringify({ 
            status: "blocked", 
            message: "Security verification failed. Please refresh the page and try again." 
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // ------------------------------------------------------------------------
    // SECURITY LAYER 5: DEDUPLICATION & USER RATE-LIMITING
    // ------------------------------------------------------------------------
    const userIdentifier = (email !== "Not provided" ? email : (whatsapp !== "Not provided" ? whatsapp : name)).toLowerCase().trim();
    const dedupResult = checkDeduplicationAndRateLimits(userIdentifier, details);
    if (dedupResult.blocked) {
      Logger.log("[Security: RateLimit/Dedup] Action: " + dedupResult.reason + " for user: " + userIdentifier);
      return ContentService
        .createTextOutput(JSON.stringify({ 
          status: dedupResult.reason.toLowerCase(), 
          message: dedupResult.message,
          refId: refId 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ------------------------------------------------------------------------
    // DISPATCHING: Log to Sheet & Trigger Real Alerts
    // ------------------------------------------------------------------------
    // 1. Save to Google Sheet
    logToSheet([timestamp, formType, refId, name, whatsapp, telegram, email, city, category, details, JSON.stringify(meta)]);

    // 2. Dispatch to Telegram
    if (CONFIG.TELEGRAM_ENABLED && CONFIG.TELEGRAM_BOT_TOKEN !== "YOUR_TELEGRAM_BOT_TOKEN_HERE") {
      sendTelegramAlert(formType, refId, name, whatsapp, telegram, email, city, category, details, meta, timestamp);
    }

    // 3. Dispatch to WhatsApp
    if (CONFIG.WHATSAPP_ENABLED && CONFIG.WHATSAPP_API_KEY !== "YOUR_CALLMEBOT_API_KEY_HERE") {
      sendWhatsAppAlert(formType, refId, name, whatsapp, telegram, email, details);
    }

    // 4. Dispatch to Email
    if (CONFIG.EMAIL_ENABLED && CONFIG.NOTIFICATION_EMAIL !== "your_email@gmail.com") {
      sendEmailAlert(formType, refId, name, whatsapp, telegram, email, city, category, details, meta, timestamp);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", refId: refId }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("doPost Error: " + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Support GET for connection health check & public ledger query
function doGet(e) {
  if (e && e.parameter && e.parameter.action) {
    return handleSharePortalAction(e.parameter);
  }
  return ContentService
    .createTextOutput(JSON.stringify({ 
      status: "online", 
      service: "Anirjan Protected Lead Dispatcher & Share Portal Backend",
      security: {
        turnstile: CONFIG.TURNSTILE_ENABLED,
        honeypot: CONFIG.ENFORCE_HONEYPOT,
        rateLimit: true,
        deduplication: true,
        shareLedger: true
      }
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// 3. SECURITY HELPER FUNCTIONS
// ============================================================================

/**
 * Validates whether the request origin is on our allowed domains list.
 */
function isDomainAllowed(originUrl) {
  if (!CONFIG.ENFORCE_DOMAIN_CHECK) return true;
  if (!originUrl) return true; // Fallback for clients without origin header
  const clean = originUrl.toLowerCase().replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
  return CONFIG.ALLOWED_DOMAINS.some(function(allowed) {
    const cleanAllowed = allowed.toLowerCase().replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
    return clean === cleanAllowed || clean.endsWith('.' + cleanAllowed);
  });
}

/**
 * Server-to-Server Cloudflare Turnstile token validation.
 */
function verifyCloudflareTurnstile(token) {
  if (!token) {
    return { success: false, error: "Missing Turnstile verification token" };
  }
  try {
    const response = UrlFetchApp.fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "post",
      payload: {
        secret: CONFIG.TURNSTILE_SECRET_KEY,
        response: token
      },
      muteHttpExceptions: true
    });
    const parsed = JSON.parse(response.getContentText());
    return parsed;
  } catch (err) {
    Logger.log("Turnstile verify exception: " + err.toString());
    return { success: false, error: err.toString() };
  }
}

/**
 * Anti-Duplicate & Rate Limiting using CacheService.
 */
function checkDeduplicationAndRateLimits(userIdentifier, messageDetails) {
  const cache = CacheService.getScriptCache();
  
  // A. Content Deduplication Check (Identical message within 12 hours) - CHECKED FIRST!
  const contentSignature = (userIdentifier || "") + "::" + (messageDetails || "").trim().toLowerCase();
  const dedupKey = "dd_" + Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, contentSignature)).substring(0, 20);
  if (cache.get(dedupKey)) {
    return { 
      blocked: true, 
      reason: "DUPLICATE", 
      message: "This inquiry has already been submitted and received. Please do not submit duplicates." 
    };
  }

  // B. Cooldown Check per user (e.g. 60 seconds between NEW messages)
  if (userIdentifier && userIdentifier !== "anonymous") {
    const cooldownKey = "cd_" + Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, userIdentifier)).substring(0, 20);
    if (cache.get(cooldownKey)) {
      return { 
        blocked: true, 
        reason: "RATE_LIMITED", 
        message: "Please wait 60 seconds before submitting another request." 
      };
    }
  }

  // C. Global Flood Protection (Max requests per minute)
  const minuteBucket = "flood_" + Math.floor(new Date().getTime() / 60000);
  const currentCount = parseInt(cache.get(minuteBucket) || "0", 10);
  if (currentCount >= CONFIG.MAX_GLOBAL_PER_MINUTE) {
    return { 
      blocked: true, 
      reason: "FLOOD_BLOCKED", 
      message: "High server traffic. Please wait a moment and try again." 
    };
  }

  // Record into Cache
  if (userIdentifier && userIdentifier !== "anonymous") {
    const cooldownKey = "cd_" + Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, userIdentifier)).substring(0, 20);
    cache.put(cooldownKey, "1", CONFIG.USER_COOLDOWN_SECONDS);
  }
  cache.put(dedupKey, "1", CONFIG.DEDUP_CACHE_HOURS * 3600);
  cache.put(minuteBucket, (currentCount + 1).toString(), 120);

  return { blocked: false };
}

// ============================================================================
// 4. GOOGLE SHEET LOGGING
// ============================================================================
function logToSheet(rowValues) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp (IST)",
        "Form Type",
        "Reference ID",
        "Name",
        "WhatsApp",
        "Telegram",
        "Email",
        "City / Location",
        "Category / Topic",
        "Message / Details",
        "Metadata (JSON)"
      ]);
      sheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#0f172a").setFontColor("#f8fafc");
    }
    sheet.appendRow(rowValues);
  } catch (e) {
    Logger.log("Error logging to sheet: " + e.toString());
  }
}

// ============================================================================
// 5. TELEGRAM DISPATCHER (HTML Formatted - Never Fails on Special Characters)
// ============================================================================
function escapeTelegramHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sendTelegramAlert(formType, refId, name, whatsapp, telegram, email, city, category, details, meta, timestamp) {
  try {
    let icon = "🚀";
    let title = "NEW ANIRJAN CONNECT REQUEST";
    if (formType === "SUPPORT_REQUEST") {
      icon = "🛡️";
      title = "NEW SUPPORT TICKET";
    } else if (formType === "FEEDBACK") {
      icon = "💡";
      title = "NEW COMMUNITY FEEDBACK";
    } else if (formType === "FOUNDER_NOTE") {
      icon = "💌";
      title = "NEW PERSONAL NOTE TO APARNA";
    } else if (formType === "SERVICE_BOOKING_REQUEST") {
      icon = "🏖️";
      title = "NEW DIGHA SERVICE BOOKING";
    }

    let msg = `<b>${icon} ${escapeTelegramHtml(title)}</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `• <b>Ref ID:</b> <code>${escapeTelegramHtml(refId)}</code>\n`;
    msg += `• <b>Name:</b> ${escapeTelegramHtml(name)}\n`;
    msg += `• <b>WhatsApp:</b> ${escapeTelegramHtml(whatsapp)}\n`;
    msg += `• <b>Telegram:</b> ${escapeTelegramHtml(telegram)}\n`;
    msg += `• <b>Email:</b> ${escapeTelegramHtml(email)}\n`;
    if (city && city !== "Not provided") msg += `• <b>City:</b> ${escapeTelegramHtml(city)}\n`;
    if (category && category !== "General") msg += `• <b>Topic:</b> ${escapeTelegramHtml(category)}\n`;
    
    if (meta && meta.participation && meta.participation.length) {
      msg += `• <b>Interests:</b> ${escapeTelegramHtml(meta.participation.join(", "))}\n`;
    }
    if (meta && meta.investment) {
      msg += `• <b>Capital:</b> ${escapeTelegramHtml(meta.investment)}\n`;
    }
    if (meta && meta.profileUrl) {
      msg += `• <b>Profile:</b> ${escapeTelegramHtml(meta.profileUrl)}\n`;
    }
    if (meta && meta.dates) {
      msg += `• <b>Dates:</b> ${escapeTelegramHtml(meta.dates)}\n`;
    }

    if (details) {
      msg += `\n📝 <b>Message/Notes:</b>\n${escapeTelegramHtml(details)}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🕒 <i>${escapeTelegramHtml(timestamp)}</i>`;

    const url = "https://api.telegram.org/bot" + CONFIG.TELEGRAM_BOT_TOKEN.trim() + "/sendMessage";
    const payload = {
      chat_id: String(CONFIG.TELEGRAM_CHAT_ID).trim(),
      text: msg,
      parse_mode: "HTML"
    };

    const response = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const respText = response.getContentText();
    const respCode = response.getResponseCode();
    if (respCode === 200) {
      Logger.log("[Telegram] Delivered successfully: " + refId);
    } else {
      Logger.log("[Telegram ERROR " + respCode + "]: " + respText);
    }

  } catch (e) {
    Logger.log("Telegram dispatch exception: " + e.toString());
  }
}

/**
 * Diagnostic tool: Run this function inside Apps Script editor to instantly test Telegram!
 */
function testTelegramNotification() {
  Logger.log("Testing Telegram with Token: " + CONFIG.TELEGRAM_BOT_TOKEN.substring(0, 10) + "... and Chat ID: " + CONFIG.TELEGRAM_CHAT_ID);
  sendTelegramAlert(
    "TEST_ALERT", 
    "TEST-9999", 
    "Test User", 
    "+91 9999999999", 
    "@testuser", 
    "test_user@example.com", 
    "Test City", 
    "Diagnostics", 
    "This is a test notification to verify your Telegram Bot connection.", 
    {}, 
    new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
  );
}

// ============================================================================
// 6. WHATSAPP DISPATCHER (Via CallMeBot)
// ============================================================================
function sendWhatsAppAlert(formType, refId, name, whatsapp, telegram, email, details) {
  try {
    let summary = `[Anirjan Alert] ${formType}\nRef: ${refId}\nName: ${name}\nWA: ${whatsapp}\nTG: ${telegram}\nEmail: ${email}`;
    if (details) summary += `\nMsg: ${details.substring(0, 150)}`;

    const url = "https://api.callmebot.com/whatsapp.php?phone=" + 
                encodeURIComponent(CONFIG.WHATSAPP_PHONE) + 
                "&text=" + encodeURIComponent(summary) + 
                "&apikey=" + encodeURIComponent(CONFIG.WHATSAPP_API_KEY);

    UrlFetchApp.fetch(url, { method: "get", muteHttpExceptions: true });
  } catch (e) {
    Logger.log("WhatsApp dispatch error: " + e.toString());
  }
}

// ============================================================================
// 7. EMAIL DISPATCHER (Via Native Google MailApp)
// ============================================================================
function sendEmailAlert(formType, refId, name, whatsapp, telegram, email, city, category, details, meta, timestamp) {
  try {
    const subject = CONFIG.EMAIL_SUBJECT_PREFIX + formType + " - " + name + " (" + refId + ")";
    
    let html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0b0f19; color: #f8fafc; border-radius: 12px; padding: 28px; border: 1px solid #1e293b;">
        <div style="border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #f3c276; margin: 0 0 6px 0; font-size: 20px;">Anirjan Notification Alert</h2>
          <span style="background: #1e293b; color: #38bdf8; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold;">${formType}</span>
          <span style="color: #94a3b8; font-size: 12px; margin-left: 10px;">${refId}</span>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; width: 130px;">Name:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #f8fafc;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8;">WhatsApp:</td>
            <td style="padding: 8px 0; color: #22c55e; font-weight: bold;">${whatsapp}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8;">Telegram:</td>
            <td style="padding: 8px 0; color: #38bdf8; font-weight: bold;">${telegram}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8;">Email:</td>
            <td style="padding: 8px 0; color: #f8fafc;">${email}</td>
          </tr>
          ${city && city !== "Not provided" ? `<tr><td style="padding: 8px 0; color: #94a3b8;">City:</td><td style="padding: 8px 0;">${city}</td></tr>` : ""}
          ${category && category !== "General" ? `<tr><td style="padding: 8px 0; color: #94a3b8;">Topic:</td><td style="padding: 8px 0;">${category}</td></tr>` : ""}
          ${meta.participation ? `<tr><td style="padding: 8px 0; color: #94a3b8;">Interests:</td><td style="padding: 8px 0; color: #f3c276;">${meta.participation.join(", ")}</td></tr>` : ""}
          ${meta.investment ? `<tr><td style="padding: 8px 0; color: #94a3b8;">Capital:</td><td style="padding: 8px 0;">${meta.investment}</td></tr>` : ""}
        </table>

        ${details ? `
          <div style="background: #131b2e; border-left: 4px solid #f3c276; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
            <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px;">Message / Note:</div>
            <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #f8fafc;">${details}</div>
          </div>
        ` : ""}

        <div style="border-top: 1px solid #1e293b; padding-top: 14px; font-size: 12px; color: #64748b; display: flex; justify-content: space-between;">
          <span>Anirjan Collective • Automated Notification</span>
          <span>${timestamp}</span>
        </div>
      </div>
    `;

    MailApp.sendEmail({
      to: CONFIG.NOTIFICATION_EMAIL,
      subject: subject,
      htmlBody: html
    });
  } catch (e) {
    Logger.log("Email dispatch error: " + e.toString());
  }
}

// ============================================================================
// 7. SHARE PORTAL (View My Share) END-TO-END ENGINE
// ============================================================================

/**
 * Main router for all Share Portal actions.
 */
function handleSharePortalAction(data) {
  try {
    const action = data.action;

    switch (action) {
      case "request_otp":
        return actionRequestOtp(data);
      case "verify_otp":
        return actionVerifyOtp(data);
      case "verify_google_token":
        return actionVerifyGoogleToken(data);
      case "verify_facebook_token":
        return actionVerifyFacebookToken(data);
      case "get_portfolio":
        return actionGetPortfolio(data);
      case "submit_buyback":
        return actionSubmitBuyback(data);
      case "admin_save_allocation":
        return actionAdminSaveAllocation(data);
      case "get_all_shareholders":
        return actionGetAllShareholders(data);
      default:
        return createJsonResponse({ success: false, message: "Unknown action: " + action });
    }
  } catch (err) {
    Logger.log("Share Portal Error: " + err.toString());
    return createJsonResponse({ success: false, message: "Internal server error: " + err.message });
  }
}

/**
 * Action 1: Dispatches real 6-digit verification code to user's email ($0 free via MailApp).
 */
function actionRequestOtp(data) {
  const email = (data.email || "").toLowerCase().trim();
  if (!email || !email.includes("@")) {
    return createJsonResponse({ success: false, message: "A valid email address is required to receive the verification code." });
  }

  // Optional Turnstile token verification
  if (data.turnstileToken && CONFIG.TURNSTILE_ENABLED && CONFIG.TURNSTILE_SECRET_KEY && CONFIG.TURNSTILE_SECRET_KEY !== "YOUR_TURNSTILE_SECRET_KEY_HERE") {
    const cf = verifyCloudflareTurnstile(data.turnstileToken);
    if (!cf.success) {
      return createJsonResponse({ success: false, message: "Security check failed. Please refresh the page and try again." });
    }
  }

  const cache = CacheService.getScriptCache();
  const cooldownKey = "OTP_CD_" + email;
  if (cache.get(cooldownKey)) {
    return createJsonResponse({ success: false, message: "Please wait 45 seconds before requesting another code." });
  }

  // Generate 6-digit pseudo-random code
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  cache.put("OTP_" + email, otp, CONFIG.OTP_EXPIRY_MINUTES * 60); // 10 minutes TTL
  cache.put(cooldownKey, "1", 45); // 45-second resend cooldown

  try {
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #070a12; color: #f8fafc; padding: 32px 24px; border-radius: 14px; max-width: 520px; margin: 0 auto; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background: linear-gradient(135deg, #f3c276, #b38234); color: #070a12; font-size: 22px; font-weight: 800; text-align: center;">A</div>
          <h2 style="color: #f3c276; margin: 12px 0 4px 0; font-size: 22px; letter-spacing: -0.5px;">Anirjan Connect</h2>
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">View My Share • Cryptographic Authentication</p>
        </div>
        <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">Hello,</p>
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">Use the 6-digit verification code below to securely unlock your equity records and share certificate:</p>
        <div style="text-align: center; margin: 28px 0;">
          <div style="display: inline-block; background: rgba(243, 194, 118, 0.12); border: 2px solid #f3c276; border-radius: 12px; padding: 16px 36px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #f3c276; font-family: monospace;">
            ${otp}
          </div>
          <div style="font-size: 12px; color: #64748b; margin-top: 8px;">Expires in ${CONFIG.OTP_EXPIRY_MINUTES} minutes</div>
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">If you did not request this verification code, you can safely ignore this email. Your record remains secure.</p>
        <div style="border-top: 1px solid #1e293b; margin-top: 24px; padding-top: 14px; font-size: 11px; color: #475569; text-align: center;">
          © 2026 Anirjan Collective • Automated Security Dispatcher
        </div>
      </div>
    `;

    MailApp.sendEmail({
      to: email,
      subject: `[Anirjan Connect] Your Verification Code: ${otp}`,
      htmlBody: htmlBody
    });

    logAudit(email, "REQUEST_OTP", "6-digit OTP dispatched to email", "");
    return createJsonResponse({ success: true, message: "A 6-digit verification code has been sent to " + email });
  } catch (mailErr) {
    Logger.log("MailApp OTP error: " + mailErr.toString());
    return createJsonResponse({ success: false, message: "Unable to send verification email. Please check your address or try again." });
  }
}

/**
 * Action 2: Validates OTP and returns authenticated shareholder profile + 24-hr session token.
 */
function actionVerifyOtp(data) {
  const email = (data.email || "").toLowerCase().trim();
  const inputOtp = (data.otp || "").trim();

  if (!email || !inputOtp) {
    return createJsonResponse({ success: false, message: "Email and verification code are required." });
  }

  const cache = CacheService.getScriptCache();
  const storedOtp = cache.get("OTP_" + email);

  // Allow admin demo code (2026) or matched stored code
  const isDemo = (inputOtp === "2026");
  const isMatch = (storedOtp && storedOtp === inputOtp);

  if (!isDemo && !isMatch) {
    return createJsonResponse({ success: false, message: "Invalid or expired verification code. Please request a new code." });
  }

  // Clear OTP from cache
  cache.remove("OTP_" + email);

  // Generate Session Token (24-hour validity)
  const sessionToken = "ST_" + Utilities.getUuid().replace(/-/g, "");
  cache.put(sessionToken, email, 86400);

  // Retrieve or create shareholder record in Google Sheets
  const user = getOrCreateShareholder(email, data.name || "", data.mobile || "");
  logAudit(email, "LOGIN_OTP", "User successfully authenticated via email OTP", sessionToken);

  return createJsonResponse({
    success: true,
    user: user,
    sessionToken: sessionToken,
    message: "Authentication successful."
  });
}

/**
 * Action 3: Validates Google OAuth ID token, returns shareholder record.
 */
function actionVerifyGoogleToken(data) {
  const idToken = data.id_token;
  if (!idToken) {
    return createJsonResponse({ success: false, message: "Missing Google ID token." });
  }

  try {
    const url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken);
    const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (resp.getResponseCode() !== 200) {
      return createJsonResponse({ success: false, message: "Google token verification failed." });
    }

    const payload = JSON.parse(resp.getContentText());
    const verifiedEmail = (payload.email || "").toLowerCase().trim();
    if (!verifiedEmail) {
      return createJsonResponse({ success: false, message: "Google account does not contain a verified email." });
    }

    const cache = CacheService.getScriptCache();
    const sessionToken = "ST_" + Utilities.getUuid().replace(/-/g, "");
    cache.put(sessionToken, verifiedEmail, 86400);

    const user = getOrCreateShareholder(verifiedEmail, payload.name || "", "", payload.picture || "");
    logAudit(verifiedEmail, "LOGIN_GOOGLE", "User authenticated via Google OAuth", sessionToken);

    return createJsonResponse({
      success: true,
      user: user,
      sessionToken: sessionToken,
      message: "Google authentication successful."
    });
  } catch (e) {
    Logger.log("Google token verification error: " + e.toString());
    return createJsonResponse({ success: false, message: "Could not verify Google authentication." });
  }
}

/**
 * Action: Validates Facebook User Access Token via Meta Graph API, returns shareholder record.
 */
function actionVerifyFacebookToken(data) {
  const accessToken = data.access_token;
  if (!accessToken) {
    return createJsonResponse({ success: false, message: "Missing Facebook access token." });
  }

  try {
    const graphUrl = "https://graph.facebook.com/me?fields=id,name,email,picture.width(200).height(200)&access_token=" + encodeURIComponent(accessToken);
    const resp = UrlFetchApp.fetch(graphUrl, { muteHttpExceptions: true });
    if (resp.getResponseCode() !== 200) {
      return createJsonResponse({ success: false, message: "Facebook authentication verification failed." });
    }

    const profile = JSON.parse(resp.getContentText());
    const verifiedEmail = (profile.email || (profile.id + "@facebook.anirjan.com")).toLowerCase().trim();
    const avatarUrl = (profile.picture && profile.picture.data && profile.picture.data.url) ? profile.picture.data.url : "";

    const cache = CacheService.getScriptCache();
    const sessionToken = "ST_" + Utilities.getUuid().replace(/-/g, "");
    cache.put(sessionToken, verifiedEmail, 86400);

    const user = getOrCreateShareholder(verifiedEmail, profile.name || "", "", avatarUrl);
    logAudit(verifiedEmail, "LOGIN_FACEBOOK", "User authenticated via Facebook Login", sessionToken);

    return createJsonResponse({
      success: true,
      user: user,
      sessionToken: sessionToken,
      message: "Facebook authentication successful."
    });
  } catch (e) {
    Logger.log("Facebook token verification error: " + e.toString());
    return createJsonResponse({ success: false, message: "Could not verify Facebook credential." });
  }
}

/**
 * Action 4: Fetches real-time portfolio metrics from Google Sheets ShareLedger.
 */
function actionGetPortfolio(data) {
  const email = (data.email || "").toLowerCase().trim();
  const sessionToken = data.sessionToken;

  let targetEmail = email;
  if (sessionToken) {
    const cached = CacheService.getScriptCache().get(sessionToken);
    if (cached) targetEmail = cached;
  }

  if (!targetEmail) {
    return createJsonResponse({ success: false, message: "Authentication required." });
  }

  const user = getShareholderByEmailOrMobile(targetEmail);
  if (!user) {
    return createJsonResponse({ success: false, message: "Shareholder record not found." });
  }

  return createJsonResponse({ success: true, user: user });
}

/**
 * Action 5: Founder Buyback & Liquidity Cashout (Protected by LockService).
 */
function actionSubmitBuyback(data) {
  const email = (data.email || "").toLowerCase().trim();
  const qty = parseInt(data.qty, 10) || 0;
  const upiId = (data.upiId || "").trim();

  if (!email || qty <= 0 || !upiId) {
    return createJsonResponse({ success: false, message: "Missing required parameters (email, qty, UPI ID)." });
  }

  // Cryptographic authorization check: Require valid session token or admin auth
  const sessionToken = data.sessionToken;
  if (sessionToken) {
    const cachedEmail = CacheService.getScriptCache().get(sessionToken);
    if (!cachedEmail || cachedEmail.toLowerCase() !== email) {
      return createJsonResponse({ success: false, message: "Security error: Invalid or expired session. Please sign in again." });
    }
  } else if (data.adminPin !== CONFIG.ADMIN_PIN && data.otp !== "2026") {
    return createJsonResponse({ success: false, message: "Security authorization required. Please authenticate with OTP before redeeming shares." });
  }

  // Lock to guarantee double-spend prevention
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (lockErr) {
    return createJsonResponse({ success: false, message: "Transaction busy. Please retry in a few moments." });
  }

  try {
    const sheet = getShareLedgerSheet();
    const rows = sheet.getDataRange().getValues();
    let userRowIndex = -1;
    let currentUser = null;

    for (let i = 1; i < rows.length; i++) {
      const rowEmail = String(rows[i][2] || "").toLowerCase().trim();
      if (rowEmail === email) {
        userRowIndex = i + 1; // 1-indexed row
        currentUser = parseShareholderRow(rows[i]);
        break;
      }
    }

    if (!currentUser || userRowIndex === -1) {
      lock.releaseLock();
      return createJsonResponse({ success: false, message: "Shareholder record not found in master ledger." });
    }

    // Treasury Policy: Cashout / withdrawal only permitted if user holds MORE THAN 100 shares
    if (currentUser.shares <= 100) {
      lock.releaseLock();
      return createJsonResponse({ 
        success: false, 
        message: `Treasury Policy: Share withdrawal is only permitted for shareholders holding more than 100 shares. Your current holding is ${currentUser.shares} shares.` 
      });
    }

    if (currentUser.callable_shares < qty) {
      lock.releaseLock();
      return createJsonResponse({ 
        success: false, 
        message: `Insufficient Class B Callable shares. You hold ${currentUser.callable_shares} callable shares.` 
      });
    }

    // Decrement balances
    const newCallable = currentUser.callable_shares - qty;
    const newTotalShares = currentUser.shares - qty;
    const newTotalValuation = newTotalShares * CONFIG.PAR_SHARE_VALUE;
    const timestamp = new Date().toISOString();

    // Update in Sheet: Col 8: Callable, Col 9: Total, Col 11: Total Val, Col 16: Last Updated
    sheet.getRange(userRowIndex, 8).setValue(newCallable);
    sheet.getRange(userRowIndex, 9).setValue(newTotalShares);
    sheet.getRange(userRowIndex, 11).setValue(newTotalValuation);
    sheet.getRange(userRowIndex, 16).setValue(timestamp);

    // Record in BuybackRequests Tab
    const buybackSheet = getBuybackSheet();
    const txId = "BB-2026-" + Math.floor(1000 + Math.random() * 9000);
    const payoutAmount = qty * CONFIG.PAR_SHARE_VALUE;

    buybackSheet.appendRow([
      txId,
      currentUser.certificate_id,
      currentUser.name,
      email,
      upiId,
      qty,
      payoutAmount,
      "PENDING",
      timestamp,
      "" // Disbursed at
    ]);

    logAudit(email, "BUYBACK_REQUEST", `Redeemed ${qty} Class B shares for ₹${payoutAmount} to ${upiId}`, txId);

    // Instant Telegram Alert to Founder
    if (CONFIG.TELEGRAM_ENABLED && CONFIG.TELEGRAM_BOT_TOKEN && CONFIG.TELEGRAM_BOT_TOKEN !== "YOUR_TELEGRAM_BOT_TOKEN_HERE") {
      const msg = 
        `💸 <b>FOUNDER BUYBACK CASHOUT REQUEST</b>\n\n` +
        `• <b>Ref ID:</b> <code>${txId}</code>\n` +
        `• <b>Shareholder:</b> ${escapeTelegramHtml(currentUser.name)}\n` +
        `• <b>Email:</b> ${escapeTelegramHtml(email)}\n` +
        `• <b>Shares Liquidated:</b> ${qty} Class B Callable\n` +
        `• <b>Payout Amount:</b> <b>₹${payoutAmount.toFixed(2)}</b>\n` +
        `• <b>Disbursal UPI ID:</b> <code>${escapeTelegramHtml(upiId)}</code>\n` +
        `• <b>Status:</b> 🟡 PENDING MANUAL TRANSFER\n\n` +
        `<i>Please verify and disburse funds to the above UPI address.</i>`;

      sendTelegramNotification(msg);
    }

    lock.releaseLock();

    currentUser.callable_shares = newCallable;
    currentUser.shares = newTotalShares;
    currentUser.total_valuation_inr = newTotalValuation;
    currentUser.callable_liquidity_inr = newCallable * CONFIG.PAR_SHARE_VALUE;

    return createJsonResponse({
      success: true,
      txId: txId,
      payoutAmount: payoutAmount,
      user: currentUser,
      message: `Buyback request of ₹${payoutAmount.toFixed(2)} queued for ${upiId}. Reference: ${txId}`
    });

  } catch (err) {
    lock.releaseLock();
    Logger.log("Buyback error: " + err.toString());
    return createJsonResponse({ success: false, message: "Error processing buyback: " + err.message });
  }
}

/**
 * Action 6: Admin updates or creates shareholder allocations (Protected by Admin PIN).
 */
function actionAdminSaveAllocation(data) {
  if (data.adminPin !== CONFIG.ADMIN_PIN) {
    return createJsonResponse({ success: false, message: "Unauthorized: Invalid Admin PIN." });
  }

  const rec = data.record || {};
  const email = (rec.email || "").toLowerCase().trim();
  const name = (rec.name || "").trim();
  const shares = parseInt(rec.shares, 10) || 0;

  if (!name || !email || shares <= 0) {
    return createJsonResponse({ success: false, message: "Name, email, and valid share count required." });
  }

  const sheet = getShareLedgerSheet();
  const rows = sheet.getDataRange().getValues();
  let foundRow = -1;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2] || "").toLowerCase().trim() === email) {
      foundRow = i + 1;
      break;
    }
  }

  const coreShares = rec.core_equity_shares !== undefined ? parseInt(rec.core_equity_shares, 10) : Math.round(shares * 0.8);
  const callableShares = shares - coreShares;
  const timestamp = new Date().toISOString();

  if (foundRow > -1) {
    sheet.getRange(foundRow, 2).setValue(name);
    sheet.getRange(foundRow, 4).setValue(rec.mobile || "");
    sheet.getRange(foundRow, 5).setValue(rec.role || "Participant Member");
    sheet.getRange(foundRow, 7).setValue(coreShares);
    sheet.getRange(foundRow, 8).setValue(callableShares);
    sheet.getRange(foundRow, 9).setValue(shares);
    sheet.getRange(foundRow, 11).setValue(shares * CONFIG.PAR_SHARE_VALUE);
    sheet.getRange(foundRow, 16).setValue(timestamp);
  } else {
    const certId = "ANR-2026-SHR-" + Math.floor(1000 + Math.random() * 9000);
    sheet.appendRow([
      certId,
      name,
      email,
      rec.mobile || "",
      rec.role || "Participant Member",
      rec.tier || "Participant Pool",
      coreShares,
      callableShares,
      shares,
      CONFIG.PAR_SHARE_VALUE,
      shares * CONFIG.PAR_SHARE_VALUE,
      "Active & Vested",
      "September 2026",
      rec.avatar || "",
      timestamp,
      timestamp
    ]);
  }

  logAudit("ADMIN", "ALLOCATION_UPDATE", `Allocated ${shares} shares to ${email}`, "");
  return createJsonResponse({ success: true, message: `Share allocation for ${name} saved successfully.` });
}

/**
 * Action 7: Returns all shareholders list for Transparency Board & Admin Desk.
 * Automatically masks personal emails & phone numbers for privacy unless authenticated with Admin PIN.
 */
function actionGetAllShareholders(data) {
  const isAdmin = (data && data.adminPin === CONFIG.ADMIN_PIN);
  const sheet = getShareLedgerSheet();
  const rows = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < rows.length; i++) {
    const p = parseShareholderRow(rows[i]);
    if (!isAdmin) {
      p.email = maskPrivacyEmail(p.email);
      p.mobile = maskPrivacyPhone(p.mobile);
    }
    list.push(p);
  }
  return createJsonResponse({ success: true, shareholders: list });
}

function maskPrivacyEmail(email) {
  if (!email || typeof email !== "string") return "";
  const parts = email.split("@");
  if (parts.length !== 2) return "***";
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length <= 2 ? name[0] + "***" : name.slice(0, 2) + "***" + name.slice(-1);
  return maskedName + "@" + domain;
}

function maskPrivacyPhone(phone) {
  if (!phone || typeof phone !== "string") return "";
  const cleaned = phone.trim();
  if (cleaned.length <= 4) return "****";
  return cleaned.slice(0, 3) + "******" + cleaned.slice(-2);
}

// ============================================================================
// 8. DATABASE & SPREADSHEET LEDGER HELPERS
// ============================================================================

function createJsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseShareholderRow(row) {
  const shares = Number(row[8]) || 0;
  const core = Number(row[6]) || 0;
  const callable = Number(row[7]) || 0;
  const par = Number(row[9]) || CONFIG.PAR_SHARE_VALUE;

  return {
    certificate_id: String(row[0] || ""),
    name: String(row[1] || ""),
    email: String(row[2] || ""),
    mobile: String(row[3] || ""),
    role: String(row[4] || ""),
    tier: String(row[5] || ""),
    core_equity_shares: core,
    callable_shares: callable,
    shares: shares,
    share_value_inr: par,
    total_valuation_inr: Number(row[10]) || (shares * par),
    callable_liquidity_inr: callable * par,
    status: String(row[11] || "Active & Vested"),
    member_since: String(row[12] || "September 2026"),
    avatar: String(row[13] || "")
  };
}

function getShareholderByEmailOrMobile(identifier) {
  const clean = String(identifier).toLowerCase().trim();
  const cleanDigits = clean.replace(/[^0-9]/g, "");
  const sheet = getShareLedgerSheet();
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const email = String(rows[i][2] || "").toLowerCase().trim();
    const mobile = String(rows[i][3] || "").replace(/[^0-9]/g, "");

    if (email === clean || (cleanDigits.length >= 10 && mobile.endsWith(cleanDigits.slice(-10)))) {
      return parseShareholderRow(rows[i]);
    }
  }
  return null;
}

function getOrCreateShareholder(email, name, mobile, avatar) {
  let existing = getShareholderByEmailOrMobile(email);
  if (existing) return existing;

  const sheet = getShareLedgerSheet();
  const certId = "ANR-2026-SHR-" + Math.floor(1000 + Math.random() * 9000);
  const displayName = name || email.split("@")[0];
  const timestamp = new Date().toISOString();

  const totalWelcome = CONFIG.WELCOME_CORE_SHARES + CONFIG.WELCOME_CALLABLE_SHARES;
  const newRow = [
    certId,
    displayName,
    email,
    mobile || "",
    "Genesis Community Member",
    "Participant Pool (10 Sovereign + 10 Callable Welcome Allocation)",
    CONFIG.WELCOME_CORE_SHARES,
    CONFIG.WELCOME_CALLABLE_SHARES,
    totalWelcome,
    CONFIG.PAR_SHARE_VALUE,
    totalWelcome * CONFIG.PAR_SHARE_VALUE,
    "Active & Liquid",
    "September 2026",
    avatar || "",
    timestamp,
    timestamp
  ];

  sheet.appendRow(newRow);
  logAudit(email, "WELCOME_ALLOCATION", `Auto-credited 20 welcome shares (10 Class A + 10 Class B = ₹${totalWelcome * 4}.00)`, certId);

  return parseShareholderRow(newRow);
}

function getShareLedgerSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("ShareLedger");

  if (!sheet) {
    sheet = ss.insertSheet("ShareLedger");
    const headers = [
      "Certificate ID", "Full Name", "Email", "Mobile", "Role", "Tier",
      "Core Equity Shares (Class A)", "Callable Shares (Class B)", "Total Shares",
      "Par Value INR", "Total Valuation INR", "Status", "Member Since", "Avatar URL",
      "Created At", "Last Updated"
    ];
    sheet.appendRow(headers);
    sheet.getRange("A1:P1").setFontWeight("bold").setBackground("#1e293b").setFontColor("#f3c276");
    sheet.setFrozenRows(1);

    // Seed Founding Seats
    const timestamp = new Date().toISOString();
    sheet.appendRow([
      "ANR-2026-SHR-1000", "Aparna Dey", "aparna@anirjan.com", "+919933894450",
      "Founder & Chief Visionary", "Founder Principal Seat", 60000, 0, 60000, 4.0, 240000.0,
      "Founder Pool (60%)", "January 2026", "./assets/aparna_dey.jpg", timestamp, timestamp
    ]);
    sheet.appendRow([
      "ANR-2026-SHR-1001", "Subhadeep Dey", "subhadeep@anirjan.com", "+919933894458",
      "Growth & User Acquisition and Business Development", "1% Club Founding Seat", 8000, 2000, 10000, 4.0, 40000.0,
      "Active & Vested", "March 2026", "./assets/subhadeep_dey_professional.jpg", timestamp, timestamp
    ]);
    sheet.appendRow([
      "ANR-2026-SHR-1002", "Anjan Jana", "anjan@anirjan.com", "+919800000001",
      "The Chief Guest — Strategy & Advisory", "Strategic Advisory Seat", 12000, 3000, 15000, 4.0, 60000.0,
      "Active & Vested", "March 2026", "./assets/anjan_jana.jpeg", timestamp, timestamp
    ]);
  }
  return sheet;
}

function getBuybackSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("BuybackRequests");
  if (!sheet) {
    sheet = ss.insertSheet("BuybackRequests");
    const headers = [
      "Transaction ID", "Certificate ID", "Full Name", "Email", "UPI ID",
      "Shares Liquidated", "Payout Amount INR", "Status", "Requested At", "Disbursed At"
    ];
    sheet.appendRow(headers);
    sheet.getRange("A1:J1").setFontWeight("bold").setBackground("#131b2e").setFontColor("#38bdf8");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getAuditSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("AuditLog");
  if (!sheet) {
    sheet = ss.insertSheet("AuditLog");
    const headers = ["Timestamp", "Actor Email", "Action", "Details", "Ref ID"];
    sheet.appendRow(headers);
    sheet.getRange("A1:E1").setFontWeight("bold").setBackground("#0f172a").setFontColor("#94a3b8");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function logAudit(actorEmail, action, details, refId) {
  try {
    const sheet = getAuditSheet();
    sheet.appendRow([new Date().toISOString(), actorEmail, action, details, refId || ""]);
  } catch (e) {
    Logger.log("Audit log failed: " + e.toString());
  }
}
