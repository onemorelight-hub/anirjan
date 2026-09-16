# Anirjan Free Multi-Channel Notification Backend

This backend runs on **Google Apps Script** (100% free forever on Google's cloud infrastructure). It enables you to securely receive alerts on:
- 📱 **Telegram** (instant mobile push alert via your Telegram Bot)
- 💬 **WhatsApp** (free alert via CallMeBot)
- ✉️ **Email** (formatted HTML alert to your Gmail)
- 📊 **Google Sheet** (automatic persistent database logging)

---

## 2-Minute Quick Setup

### Step 1: Create the Google Sheet & Script
1. Go to [Google Sheets](https://sheets.google.com) and click **Blank spreadsheet**.
2. Name it: `Anirjan Submissions`.
3. In the top menu, click **Extensions** -> **Apps Script**.

### Step 2: Paste the Backend Code
1. Erase any placeholder code in the script editor.
2. Open [`backend/google-apps-script.js`](./google-apps-script.js) and copy the entire file contents.
3. Paste into the Apps Script editor.

### Step 3: Enter Your Credentials in `CONFIG`
At the top of the script, update:
```javascript
const CONFIG = {
  // 1. Telegram (Free)
  TELEGRAM_ENABLED: true,
  TELEGRAM_BOT_TOKEN: "YOUR_BOT_TOKEN_FROM_BOTFATHER", // e.g. 7123456789:AAH...
  TELEGRAM_CHAT_ID: "YOUR_CHAT_ID_FROM_USERINFOBOT",   // e.g. 123456789

  // 2. WhatsApp (Free via CallMeBot)
  WHATSAPP_ENABLED: false, // Set to true once you activate CallMeBot
  WHATSAPP_PHONE: "+91XXXXXXXXXX",
  WHATSAPP_API_KEY: "YOUR_CALLMEBOT_API_KEY",

  // 3. Email (Your Gmail)
  EMAIL_ENABLED: true,
  NOTIFICATION_EMAIL: "your_email@gmail.com",
};
```

#### How to get Telegram Bot Token & Chat ID in 60 seconds:
- **Bot Token**: Open Telegram -> Search `@BotFather` -> Send `/newbot` -> Follow prompt -> Copy the token.
- **Chat ID**: Start your bot (press `/start`), then search for `@userinfobot` on Telegram -> Click `/start` -> Copy the numeric `Id`.

#### How to get free CallMeBot WhatsApp Key (Optional):
- Add `+34 941 87 23 20` to WhatsApp contacts.
- Send the text: `I allow callmebot to send me messages`.
- It replies in 2 seconds with your free API key!

### Step 4: Deploy as Web App
1. In the top right corner of Google Apps Script, click **Deploy** -> **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Configure:
   - **Description**: `Anirjan Notifier`
   - **Execute as**: `Me` (your Google account)
   - **Who has access**: `Anyone` *(Crucial: must be "Anyone" so visitors can send submissions)*
4. Click **Deploy**, click **Authorize access**, choose your Google account (click "Advanced" -> "Go to Anirjan (unsafe)" if Google shows an unverified warning, it's your own script).
5. Copy the generated **Web app URL** (e.g. `https://script.google.com/macros/s/AKfycb.../exec`).

### Step 5: Save URL to Website
Open `js/notifier.js` on your website and paste your URL into:
```javascript
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycb.../exec";
```

That's it! Your private keys are 100% hidden and secure on Google Cloud.
