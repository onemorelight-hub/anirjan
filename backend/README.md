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

---

## 📈 View My Share: Free End-to-End Ledger & Buyback Engine

The backend includes a **100% free-forever equity ledger and buyback processing engine** running entirely on your Google Apps Script and Google Sheets.

### 🌟 Features & Free Architecture
1. **Google Sheets as Master Ledger**:
   - `ShareLedger`: Automatically created on first run. Stores Shareholder ID, Name, Email, Class A Sovereign Shares, Class B Callable Shares, Cumulative Dividends, Certificates, and Lockup Expiries. Founding shares (Aparna Dey: 60,000, Subhadeep Dey: 10,000, Anjan Jana: 15,000) are seeded automatically.
   - `BuybackRequests`: Automatically records all cashout/redemption requests, UPI ID/account details, shares liquidated, payout amount (INR), transaction references, and approval statuses.
   - `AuditLog`: Immutable append-only log of every OTP sent, authentication success, share reallocation, and buyback execution.
2. **Zero-Cost Authentication**:
   - **Apps Script `MailApp`**: Sends secure 6-digit verification codes directly to shareholder emails at ₹0 cost (using your standard Google account quota: 100/day for free Gmail, 1,500/day for Workspace).
   - **`CacheService` OTP Store**: 6-digit OTPs are stored with a 10-minute TTL, 45-second resend cooldown, and maximum 3 attempts before code invalidation.
   - **Google One-Tap / OAuth Support**: Token verification endpoint (`verify_google_token`) validates Google OAuth JWTs via `https://oauth2.googleapis.com/tokeninfo`.
   - **Auto-Onboarding**: New verified users instantly receive 20 welcome shares (10 Class A + 10 Class B = ₹80.00 value) added directly to `ShareLedger`.
3. **Double-Spend & Concurrency Protection**:
   - Apps Script `LockService.getScriptLock()` prevents race conditions during share buybacks.
   - Deductions from `ShareLedger` happen synchronously inside a critical section before a signed digital redemption receipt is returned.
   - Automated instant Telegram notification is dispatched to the founder whenever a buyback is submitted.

### Backend Endpoints (`doPost` / `doGet`)
All endpoints respond to `POST` with `Content-Type: text/plain` (CORS-friendly):
- `action: "request_otp"`: Sends 6-digit OTP to the provided email.
- `action: "verify_otp"`: Validates the 6-digit OTP, creates an onboarding grant if new user, and returns portfolio data + signed session token.
- `action: "verify_google_token"`: Authenticates via Google Sign-In credential token.
- `action: "get_portfolio"`: Fetches current share balances, NAV value (₹4.00), dividends, and lockup dates.
- `action: "submit_buyback"`: Concurrency-locked redemption of Class B shares; updates sheet, creates payout request, and notifies founder via Telegram.
- `action: "get_all_shareholders"`: Public anonymized ledger of all shareholders for the transparency board.
- `action: "admin_save_allocation"`: Founder/Admin endpoint to update shareholder equity allocations.

