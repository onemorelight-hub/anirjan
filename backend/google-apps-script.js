/**
 * ============================================================================
 * ANIRJAN NOTIFICATION & LEAD DISPATCHER (Google Apps Script)
 * ============================================================================
 * 
 * This free serverless backend runs on Google Cloud / Google Sheets.
 * It securely holds your private credentials (never exposed in the browser) and:
 *   1. Records every submission into a Google Sheet automatically.
 *   2. Sends an instant Telegram push notification to your phone.
 *   3. Sends a WhatsApp alert to your phone via CallMeBot.
 *   4. Sends an instant formatted email notification via Google Mail.
 * 
 * ----------------------------------------------------------------------------
 * SETUP INSTRUCTIONS (Takes ~2 minutes):
 * ----------------------------------------------------------------------------
 * 1. Open Google Sheets (https://sheets.google.com) and create a new sheet:
 *    Name it "Anirjan Submissions".
 * 2. In the top menu, click: Extensions -> Apps Script.
 * 3. Delete any code in the editor, paste this entire file, and fill in your
 *    credentials in the CONFIGURATION section below.
 * 4. Click "Deploy" (top right) -> "New deployment".
 * 5. Select type: "Web app" (click gear icon next to Select type).
 * 6. Set:
 *      - Description: "Anirjan Notifier v1"
 *      - Execute as: "Me" (your Google account)
 *      - Who has access: "Anyone" (CRITICAL: must be "Anyone" so the website can post to it)
 * 7. Click "Deploy", authorize permissions when prompted, and copy the Web App URL:
 *    (It looks like: https://script.google.com/macros/s/AKfycbx.../exec)
 * 8. Paste that Web App URL into `js/notifier.js` on your website. Done!
 * ============================================================================
 */

// ============================================================================
// 1. CONFIGURATION (Your Private Credentials - Kept 100% Safe)
// ============================================================================
const CONFIG = {
  // Telegram Bot Settings (Get from @BotFather and @userinfobot on Telegram)
  TELEGRAM_ENABLED: true,
  TELEGRAM_BOT_TOKEN: "YOUR_TELEGRAM_BOT_TOKEN_HERE", // e.g. "7123456789:AAH..."
  TELEGRAM_CHAT_ID: "YOUR_TELEGRAM_CHAT_ID_HERE",     // e.g. "123456789"

  // WhatsApp Settings (Free via CallMeBot: https://www.callmebot.com/blog/free-api-whatsapp-messages/)
  WHATSAPP_ENABLED: false, // Set to true once you have CallMeBot API key
  WHATSAPP_PHONE: "+91XXXXXXXXXX", // Your mobile number with international code
  WHATSAPP_API_KEY: "YOUR_CALLMEBOT_API_KEY_HERE",

  // Email Notification Settings
  EMAIL_ENABLED: true,
  NOTIFICATION_EMAIL: "your_email@gmail.com", // Where alerts should be sent
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
    const name = data.name || "Anonymous";
    const email = data.email || "Not provided";
    const whatsapp = data.whatsapp || "Not provided";
    const telegram = data.telegram || "Not provided";
    const city = data.city || "Not provided";
    const category = data.category || "General";
    const details = data.details || "";
    const meta = data.meta || {};
    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

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
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Support GET for connection health check
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "online", service: "Anirjan Multi-Channel Dispatcher" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// 3. GOOGLE SHEET LOGGING
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
// 4. TELEGRAM DISPATCHER
// ============================================================================
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
    }

    let msg = `${icon} *${title}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `• *Ref ID:* \`${refId}\`\n`;
    msg += `• *Name:* ${name}\n`;
    msg += `• *WhatsApp:* ${whatsapp}\n`;
    msg += `• *Telegram:* ${telegram}\n`;
    msg += `• *Email:* ${email}\n`;
    if (city && city !== "Not provided") msg += `• *City:* ${city}\n`;
    if (category && category !== "General") msg += `• *Topic:* ${category}\n`;
    
    if (meta.participation && meta.participation.length) {
      msg += `• *Participation Areas:* ${meta.participation.join(", ")}\n`;
    }
    if (meta.investment) {
      msg += `• *Capital Interest:* ${meta.investment}\n`;
    }
    if (meta.profileUrl) {
      msg += `• *Profile:* ${meta.profileUrl}\n`;
    }

    if (details) {
      msg += `\n📝 *Message/Notes:*\n${details}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🕒 _${timestamp}_`;

    const url = "https://api.telegram.org/bot" + CONFIG.TELEGRAM_BOT_TOKEN + "/sendMessage";
    const payload = {
      chat_id: CONFIG.TELEGRAM_CHAT_ID,
      text: msg,
      parse_mode: "Markdown"
    };

    UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (e) {
    Logger.log("Telegram dispatch error: " + e.toString());
  }
}

// ============================================================================
// 5. WHATSAPP DISPATCHER (Via CallMeBot)
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
// 6. EMAIL DISPATCHER (Via Native Google MailApp)
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
