# Anirjan Enterprise-Protected Multi-Channel Lead Backend

This backend runs on **Google Apps Script** (100% free forever on Google's cloud infrastructure). It enables you to securely receive alerts on:
- 📱 **Telegram** (instant mobile push alert via your Telegram Bot)
- 💬 **WhatsApp** (free alert via CallMeBot)
- ✉️ **Email** (formatted HTML alert to your Gmail)
- 📊 **Google Sheet** (automatic persistent database logging)

---

## 🛡️ Built-In Security & Anti-Bot Protection Matrix

| Protection Layer | Description | How It Protects You |
| :--- | :--- | :--- |
| **Cloudflare Turnstile** | Cryptographic domain-locking | Guarantees requests come from a real browser on your registered domain. Blocks Python/curl scripts completely. |
| **Domain Whitelist** | Server-side origin filter | Rejects any request attempting to send from an unauthorized domain. |
| **Invisible Honeypot** | Hidden trap inputs | Web-crawling bots and automated scrapers fill out every input. The backend silently drops their notifications without alerting you. |
| **Timing Defense** | Real human elapsed-time check | Bots submit in milliseconds. Requests completing in under 2.5 seconds are automatically filtered out. |
| **Single-User Deduplication** | `CacheService` content hash | Prevents the same user from spamming identical messages (cached for 12 hours). |
| **User Cooldown** | 60-second rate limiter | Stops rapid consecutive clicks or accidental double submissions. |
| **Global Flood Shield** | 10 requests / min ceiling | Protects your email and phone from high-frequency distributed bot attacks. |

---

## Step-by-Step Configuration Guide

### Step 1: Get Cloudflare Turnstile Keys (100% Free, takes 1 minute)
1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com) (or create a free account).
2. On the left navigation bar, click **Turnstile** → **Add Site**.
3. Fill in:
   - **Site name**: `Anirjan Website`
   - **Domain**: Add your domains:
     - `anirjan.onrender.com`
     - `localhost` (for local testing)
     - *(and your custom domain if you have one)*
   - **Widget Mode**: Select **Managed** or **Non-interactive** (runs invisibly).
4. Click **Create**.
5. Cloudflare will give you:
   - **Site Key** (Public)
   - **Secret Key** (Private)

---

### Step 2: Configure Keys in Website Code

#### 1. Paste your Site Key into `js/notifier.js`:
```javascript
const TURNSTILE_SITE_KEY = "0x4AAAAAAAx..."; // Your Cloudflare Site Key
```

#### 2. Replace `YOUR_TURNSTILE_SITE_KEY_HERE` in HTML forms:
In `anirjan-connect.html`, `support.html`, `founder.html`, and `services.html`, search for:
```html
<div class="cf-turnstile" data-sitekey="YOUR_TURNSTILE_SITE_KEY_HERE" ...></div>
```
and replace with your actual Cloudflare Site Key.

*(Note: If left as is, the form still works safely with Honeypot, Timing, Cooldown, and Deduplication protections!)*

---

### Step 3: Configure Google Apps Script Backend
1. Open [Google Sheets](https://sheets.google.com) and open your `Anirjan Submissions` sheet.
2. In the top menu, click **Extensions** -> **Apps Script**.
3. Replace all code in the editor with the code from [`backend/google-apps-script.js`](./google-apps-script.js).
4. In the `CONFIG` section at the top of the script:
   - Paste your **Cloudflare Turnstile Secret Key**:
     ```javascript
     TURNSTILE_SECRET_KEY: "0x4AAAAAAAx...",
     ```
   - Update your **Telegram Bot Token** & **Chat ID** (if using Telegram).
   - Update your **Notification Email** (where alerts should be delivered).

---

### Step 4: Re-Deploy the Google Apps Script
1. In the top right corner of Google Apps Script, click **Deploy** -> **Manage deployments**.
2. Click the **Edit** (pencil) icon next to the active deployment.
3. Under **Version**, select **New version**.
4. Click **Deploy**.
5. Copy the **Web App URL** and verify it is pasted in `js/notifier.js`.

---

### Step 5: Test Your Protection!
- Open your site (`http://localhost:8000` or `https://anirjan.onrender.com`).
- Submit a normal test inquiry -> You will receive the alert!
- Try submitting the exact same message again immediately -> The system prevents the duplicate and warns you gently without spamming your inbox.
- Try submitting multiple times quickly -> The 60-second cooldown activates.
