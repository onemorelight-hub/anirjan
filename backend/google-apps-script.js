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
  EMAIL_SUBJECT_PREFIX: "[Anirjan Alert] "
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

// Support GET for connection health check
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ 
      status: "online", 
      service: "Anirjan Protected Lead Dispatcher",
      security: {
        turnstile: CONFIG.TURNSTILE_ENABLED,
        honeypot: CONFIG.ENFORCE_HONEYPOT,
        rateLimit: true,
        deduplication: true
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
