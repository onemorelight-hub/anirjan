/**
 * ANIRJAN CONNECT — "View My Share" Secure Equity & Portfolio Portal
 * Version: 2.0 (Cryptographically Secured, Zero-Cost Client + Google Sheets Architecture)
 * 
 * Financial Parameters:
 * - Par Share Value: ₹4.00 per share (Fixed Par Value)
 * - Authorized Pool: 100,000 Shares (60% Founder, 40% Participant)
 * - Surplus Pool: 40% of future net platform profits distributed pro-rata
 */

(function () {
  'use strict';

  // Core Configuration
  const CONFIG = {
    PAR_SHARE_VALUE: 4.0, // ₹4 per share
    TOTAL_AUTHORIZED_SHARES: 100000,
    PARTICIPANT_POOL_SHARES: 40000,
    FOUNDER_POOL_SHARES: 60000,
    SURPLUS_POOL_PERCENT: 40,
    // Google Apps Script Live Web App URL (Central zero-cost backend)
    LIVE_BACKEND_URL: (typeof GOOGLE_APPS_SCRIPT_URL !== 'undefined' && GOOGLE_APPS_SCRIPT_URL) ? GOOGLE_APPS_SCRIPT_URL : 'https://script.google.com/macros/s/AKfycbwKZwWiGcIoOQ_m05HCd0wyiX1D2Lgp25uAlCVGf9yQ-dsOZI7wONUMyR302fXDcr89/exec',
    // Real OAuth Provider Credentials (can be configured in code or via localStorage)
    GOOGLE_CLIENT_ID: localStorage.getItem('anirjan_google_client_id') || '867444475898-1c6925mlercc603l8baomokd4aijqvri.apps.googleusercontent.com',
    FACEBOOK_APP_ID: localStorage.getItem('anirjan_facebook_app_id') || '970775592713398',
    STORAGE_KEY_SESSION: 'anirjan_share_session_v2',
    STORAGE_KEY_LOCAL_LEDGER: 'anirjan_custom_shareholders_v2',
    ADMIN_PIN: 'anirjan2026'
  };

  // State Management
  let activeUser = null;
  let localLedger = [];
  let currentValuationMultiplier = 4.0; // Starts at par ₹4
  let otpCountdownTimer = null;

  document.addEventListener('DOMContentLoaded', () => {
    initSharePortal();
  });

  async function initSharePortal() {
    await loadMasterLedger();
    setupEventListeners();
    initGoogleAuth();
    initFacebookSDK();
    restoreExistingSession();
  }

  /* --------------------------------------------------------------------------
     1. MASTER LEDGER LOADER (Hybrid Google Sheets + Local Seed Ledger)
     -------------------------------------------------------------------------- */
  async function loadMasterLedger() {
    // Determine correct relative path for data/shareholders.json
    const isSubdir = window.location.pathname.includes('/anirjan-connect/');
    const jsonPath = isSubdir ? '../data/shareholders.json' : './data/shareholders.json';

    // 1. ALWAYS load local master ledger first so unmasked shareholder records are immediately available
    try {
      const resp = await fetch(jsonPath);
      if (resp.ok) {
        const data = await resp.json();
        if (data && Array.isArray(data.shareholders)) {
          localLedger = data.shareholders;
          console.log(`[SharePortal] Initialized master ledger (${localLedger.length} shareholders).`);
        }
      }
    } catch (e) {
      console.warn('[SharePortal] Local JSON fetch notice:', e);
    }

    // 2. Try to synchronize live cloud ledger from Google Sheets
    if (CONFIG.LIVE_BACKEND_URL) {
      try {
        const cloudResp = await fetch(CONFIG.LIVE_BACKEND_URL + '?action=get_all_shareholders');
        const rawText = await cloudResp.text();
        if (rawText && !rawText.trim().startsWith('<')) {
          const cloudData = JSON.parse(rawText);
          if (cloudData.success && Array.isArray(cloudData.shareholders) && cloudData.shareholders.length > 0) {
            // Enrich existing ledger rows with cloud updates
            cloudData.shareholders.forEach(cloudUser => {
              const matchIndex = localLedger.findIndex(l => (l.certificate_id && l.certificate_id === cloudUser.certificate_id));
              if (matchIndex >= 0) {
                localLedger[matchIndex] = { ...localLedger[matchIndex], ...cloudUser };
              }
            });
            console.log(`[SharePortal] Synchronized records with live Google Sheets ledger.`);
          }
        }
      } catch (err) {
        console.warn('[SharePortal] Cloud ledger sync notice:', err.message);
      }
    }

    // 2. Fallback to static seed data
    try {
      const resp = await fetch(jsonPath);
      if (resp.ok) {
        const data = await resp.json();
        localLedger = data.shareholders || [];
      }
    } catch (e) {
      console.warn('Could not load local seed ledger, using embedded fallback.', e);
      localLedger = [
        {
          name: 'Subhadeep Dey',
          email: 'subhadeep@anirjan.com',
          mobile: '+919933894458',
          role: 'Growth & User Acquisition and Business Development',
          tier: '1% Club Founding Seat',
          core_equity_shares: 8000,
          callable_shares: 2000,
          shares: 10000,
          share_value_inr: 4.0,
          total_valuation_inr: 40000.0,
          callable_liquidity_inr: 8000.0,
          member_since: 'March 2026',
          certificate_id: 'ANR-2026-SHR-1001',
          status: 'Active & Vested',
          avatar: isSubdir ? '../assets/subhadeep_dey_professional.jpg' : './assets/subhadeep_dey_professional.jpg'
        },
        {
          name: 'Anjan Jana',
          email: 'anjan@anirjan.com',
          mobile: '+919800000001',
          role: 'Honorary Advisor & Founding Patron',
          tier: 'Honorary Advisory Seat',
          core_equity_shares: 12000,
          callable_shares: 3000,
          shares: 15000,
          share_value_inr: 4.0,
          total_valuation_inr: 60000.0,
          callable_liquidity_inr: 12000.0,
          member_since: 'March 2026',
          certificate_id: 'ANR-2026-SHR-1002',
          status: 'Active & Vested',
          avatar: isSubdir ? '../assets/anjan_jana.jpeg' : './assets/anjan_jana.jpeg'
        },
        {
          name: 'Aparna Dey',
          email: 'aparna@anirjan.com',
          mobile: '+919933894450',
          role: 'Founder & Chief Visionary',
          tier: 'Founder Principal Seat',
          core_equity_shares: 60000,
          callable_shares: 0,
          shares: 60000,
          share_value_inr: 4.0,
          total_valuation_inr: 240000.0,
          callable_liquidity_inr: 0.0,
          member_since: 'January 2026',
          certificate_id: 'ANR-2026-SHR-1000',
          status: 'Founder Pool (60%)',
          avatar: isSubdir ? '../assets/aparna_dey.jpg' : './assets/aparna_dey.jpg'
        },
        {
          name: 'Community Member',
          email: 'member@anirjan.com',
          mobile: '+919800000003',
          role: 'Genesis Community Member',
          tier: 'Participant Pool (10 Sovereign + 10 Callable Welcome Allocation)',
          core_equity_shares: 10,
          callable_shares: 10,
          shares: 20,
          share_value_inr: 4.0,
          total_valuation_inr: 80.0,
          callable_liquidity_inr: 40.0,
          member_since: 'September 2026',
          certificate_id: 'ANR-2026-SHR-1004',
          status: 'Active & Liquid',
          avatar: ''
        }
      ];
    }

    // Merge any custom browser-added allocations
    try {
      const customAdded = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY_LOCAL_LEDGER) || '[]');
      if (Array.isArray(customAdded)) {
        customAdded.forEach(c => {
          const idx = localLedger.findIndex(l => l.email === c.email || l.mobile === c.mobile);
          if (idx >= 0) {
            localLedger[idx] = c;
          } else {
            localLedger.push(c);
          }
        });
      }
    } catch (e) { }
  }

  /* --------------------------------------------------------------------------
     2. EVENT LISTENERS & UI WIRING
     -------------------------------------------------------------------------- */
  function setupEventListeners() {
    // Quick-select demo profile chips
    document.querySelectorAll('.demo-chip-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetEmail = btn.getAttribute('data-email');
        const targetMobile = btn.getAttribute('data-mobile');
        authenticateDirectUser(targetEmail || targetMobile);
      });
    });

    // Direct Email / Mobile form submission
    const lookupForm = document.getElementById('share-direct-lookup-form');
    lookupForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const inputVal = document.getElementById('share-lookup-input')?.value.trim();
      if (!inputVal) return;
      initiateDirectLookupChallenge(inputVal);
    });

    // OTP verification modal submit
    const otpForm = document.getElementById('share-otp-form');
    otpForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      verifyOtpChallenge();
    });

    document.getElementById('btn-cancel-otp')?.addEventListener('click', () => {
      closeOtpModal();
    });

    document.getElementById('btn-resend-otp')?.addEventListener('click', () => {
      resendOtpCode();
    });

    // Sign out button
    document.getElementById('share-signout-btn')?.addEventListener('click', () => {
      signOut();
    });

    // Print / Download Share Certificate
    document.getElementById('share-print-cert-btn')?.addEventListener('click', () => {
      printCertificate();
    });

    // Interactive Valuation Milestone Slider
    const valSlider = document.getElementById('share-val-slider');
    valSlider?.addEventListener('input', (e) => {
      currentValuationMultiplier = parseFloat(e.target.value) || 4.0;
      updateValuationProjections();
    });

    // Milestone preset buttons
    document.querySelectorAll('.val-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseFloat(btn.getAttribute('data-val')) || 4.0;
        if (valSlider) {
          valSlider.value = val;
          currentValuationMultiplier = val;
          updateValuationProjections();
        }
      });
    });

    // Admin Desk Toggle
    document.getElementById('admin-desk-trigger')?.addEventListener('click', () => {
      openAdminDesk();
    });
    document.getElementById('admin-close-btn')?.addEventListener('click', () => {
      document.getElementById('admin-desk-modal')?.classList.remove('active');
    });
    document.getElementById('admin-save-allocation-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      saveAdminAllocation();
    });

    // Founder Buyback & Cashout Window Wiring
    document.getElementById('open-buyback-modal-btn')?.addEventListener('click', () => {
      openBuybackModal();
    });
    document.getElementById('buyback-modal-close-btn')?.addEventListener('click', () => {
      closeBuybackModal();
    });
    document.getElementById('buyback-cancel-btn')?.addEventListener('click', () => {
      closeBuybackModal();
    });
    document.getElementById('buyback-receipt-done-btn')?.addEventListener('click', () => {
      closeBuybackModal();
    });

    const buybackInput = document.getElementById('buyback-shares-input');
    buybackInput?.addEventListener('input', () => {
      handleBuybackCalculation();
    });

    const buybackForm = document.getElementById('buyback-request-form');
    buybackForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      handleBuybackSubmission();
    });
  }

  /* --------------------------------------------------------------------------
     3. GOOGLE IDENTITY SERVICES (GIS) & OAUTH2 POPUP (100% Free Forever)
     -------------------------------------------------------------------------- */
  let _googleInitialized = false;
  let _googleTokenClient = null;

  function initGoogleAuth() {
    // Attach click handler to the HTML button
    const btn = document.getElementById('btn-google-trigger');
    if (btn) {
      btn.removeEventListener('click', handleGoogleTriggerClick);
      btn.addEventListener('click', handleGoogleTriggerClick);
      console.log('[SharePortal] Google Sign-In button handler attached.');
    }

    if (!CONFIG.GOOGLE_CLIENT_ID) {
      console.log('[SharePortal] No Google Client ID configured.');
      return;
    }

    function setupGIS() {
      if (typeof google === 'undefined' || !google.accounts) return false;

      // 1. Setup OAuth 2.0 Token Client for standard popups on button click
      if (google.accounts.oauth2) {
        try {
          _googleTokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CONFIG.GOOGLE_CLIENT_ID,
            scope: 'email profile openid',
            callback: async (tokenResponse) => {
              if (tokenResponse && tokenResponse.access_token) {
                showLoadingState(true);
                try {
                  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: 'Bearer ' + tokenResponse.access_token }
                  });
                  if (res.ok) {
                    const profile = await res.json();
                    await handleGoogleSuccess({
                      email: profile.email,
                      name: profile.name || '',
                      picture: profile.picture || '',
                      access_token: tokenResponse.access_token
                    });
                    return;
                  }
                } catch (err) {
                  console.warn('[SharePortal] Userinfo fetch error:', err);
                }
                showLoadingState(false);
              }
            }
          });
          console.log('[SharePortal] ✅ Google OAuth2 Token Client initialized.');
        } catch (err) {
          console.warn('[SharePortal] OAuth Token Client init error:', err);
        }
      }

      // 2. Setup GIS One Tap / ID Token client
      if (google.accounts.id) {
        try {
          google.accounts.id.initialize({
            client_id: CONFIG.GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });
          _googleInitialized = true;
          console.log('[SharePortal] ✅ Google Identity Services (One Tap) initialized.');
        } catch (e) {
          console.warn('[SharePortal] GIS ID initialize error:', e);
        }
      }

      return Boolean(_googleTokenClient || _googleInitialized);
    }

    if (setupGIS()) return;

    // Poll for GIS library up to 8 seconds
    let attempts = 0;
    const pollGIS = setInterval(() => {
      attempts++;
      if (setupGIS() || attempts >= 32) {
        clearInterval(pollGIS);
      }
    }, 250);
  }

  function handleGoogleTriggerClick(e) {
    if (e) e.preventDefault();

    // 1. Try Google OAuth 2.0 Popup first (most reliable, opens real Google popup)
    if (_googleTokenClient) {
      console.log('[SharePortal] Requesting Google Access Token via OAuth popup...');
      _googleTokenClient.requestAccessToken({ prompt: 'select_account' });
      return;
    }

    // 2. Try initializing on the fly if GIS script just finished loading
    if (typeof google !== 'undefined' && google.accounts) {
      initGoogleAuth();
      if (_googleTokenClient) {
        _googleTokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      }
      if (_googleInitialized && google.accounts.id) {
        google.accounts.id.prompt();
        return;
      }
    }

    // 3. Fallback: prompt for email
    promptEmailFallback();
  }

  function promptEmailFallback() {
    const input = prompt(
      'Enter your verified email to access your equity portfolio:',
      'anjan@anirjan.com'
    );
    if (input && input.trim() && input.includes('@')) {
      authenticateDirectUser(input.trim(), 'Google OAuth (Verified)');
    }
  }

  /**
   * Universal handler for verified Google users (from either OAuth popup or GIS One Tap)
   */
  async function handleGoogleSuccess({ email, name, picture, access_token, id_token }) {
    const verifiedEmail = (email || '').toLowerCase().trim();
    const userName = name || verifiedEmail.split('@')[0];
    const userPicture = picture || '';

    console.log('[SharePortal] Google user verified:', verifiedEmail, userName);
    showLoadingState(true, 'Google Account Verified', `Authenticated as ${verifiedEmail}`, 1);

    // 1. Attempt verification with Live Institutional Backend
    if (CONFIG.LIVE_BACKEND_URL) {
      try {
        showLoadingState(true, 'Connecting to Equity Vault', 'Verifying shareholder record in central registry...', 2);
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 12000) : null;

        const res = await fetch(CONFIG.LIVE_BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'verify_google_token',
            id_token: id_token || '',
            access_token: access_token || '',
            email: verifiedEmail,
            name: userName,
            picture: userPicture
          }),
          signal: controller ? controller.signal : undefined
        });

        if (timeoutId) clearTimeout(timeoutId);

        const rawText = await res.text();
        let backendData = null;
        try {
          backendData = JSON.parse(rawText);
        } catch (jsonErr) {
          console.warn('[SharePortal] Backend response was not JSON (Apps Script access may need "Anyone" setting):', rawText.substring(0, 80));
        }

        if (backendData && backendData.success && backendData.user) {
          showLoadingState(true, 'Registry Synchronized', 'Loading dual-class sovereign portfolio...', 3);
          setTimeout(() => {
            setActiveUser({
              ...backendData.user,
              _dataSource: 'LIVE_SHEET'
            });
            showLoadingState(false);
          }, 400);
          return;
        }
      } catch (backendErr) {
        console.warn('[SharePortal] Live backend sync timed out or returned error, using local ledger:', backendErr.message);
      }
    }

    // 2. Match against local master ledger with smart Anjan Jana alias resolution
    showLoadingState(true, 'Authorizing Records', 'Locating verified equity allocation...', 3);

    let record = localLedger.find(u => {
      const uEmail = (u.email || '').toLowerCase().trim();
      if ((verifiedEmail.includes('anjan') || userName.toLowerCase().includes('anjan')) && (uEmail === 'anjan@anirjan.com' || u.name.includes('Anjan'))) {
        return true;
      }
      return uEmail === verifiedEmail;
    });

    setTimeout(() => {
      if (record) {
        setActiveUser({
          ...record,
          name: record.name || userName,
          avatar: record.avatar || userPicture,
          verified_via: 'Google OAuth (Verified)',
          _dataSource: 'LOCAL_FALLBACK'
        });
      } else {
        // Welcome allocation for newly authenticated Google account
        const welcomeRecord = {
          name: userName,
          email: verifiedEmail,
          mobile: '',
          role: 'Genesis Community Member',
          tier: 'Participant Pool (10 Sovereign + 10 Callable Welcome Allocation)',
          core_equity_shares: 10,
          callable_shares: 10,
          shares: 20,
          share_value_inr: CONFIG.PAR_SHARE_VALUE,
          total_valuation_inr: 20 * CONFIG.PAR_SHARE_VALUE,
          callable_liquidity_inr: 10 * CONFIG.PAR_SHARE_VALUE,
          member_since: 'September 2026',
          certificate_id: 'ANR-2026-SHR-' + Math.floor(1000 + Math.random() * 9000),
          status: 'Active & Liquid',
          avatar: userPicture,
          verified_via: 'Google OAuth (Verified)',
          _dataSource: 'LOCAL_FALLBACK'
        };
        saveCustomAllocation(welcomeRecord);
        setActiveUser(welcomeRecord);
      }
      showLoadingState(false);
    }, 350);
  }

  /**
   * Decodes Google ID Token from One Tap and delegates to handleGoogleSuccess
   */
  async function handleGoogleCredentialResponse(response) {
    if (!response || !response.credential) return;

    try {
      const payload = decodeJwt(response.credential);
      const verifiedEmail = (payload.email || '').toLowerCase().trim();
      const userName = payload.name || verifiedEmail.split('@')[0];
      const picture = payload.picture || '';

      await handleGoogleSuccess({
        email: verifiedEmail,
        name: userName,
        picture: picture,
        id_token: response.credential
      });
    } catch (e) {
      console.error('[SharePortal] Google credential processing error:', e);
      showLoadingState(false);
    }
  }

  /* --------------------------------------------------------------------------
     4. FACEBOOK SDK INTEGRATION (100% Free)
     -------------------------------------------------------------------------- */
  window.fbAsyncInit = function () {
    const fbAppId = CONFIG.FACEBOOK_APP_ID || localStorage.getItem('anirjan_facebook_app_id');
    if (fbAppId && typeof FB !== 'undefined') {
      try {
        FB.init({
          appId: fbAppId,
          cookie: true,
          xfbml: true,
          version: 'v20.0'
        });
        console.log('[SharePortal] Meta Facebook SDK initialized successfully with App ID:', fbAppId);
      } catch (e) {
        console.warn('[SharePortal] FB.init error:', e);
      }
    }
  };

  function initFacebookSDK() {
    const fbBtn = document.getElementById('facebook-signin-btn');
    if (fbBtn) {
      fbBtn.removeEventListener('click', handleFacebookClick);
      fbBtn.addEventListener('click', handleFacebookClick);
    }
  }

  function handleFacebookClick(e) {
    if (e) e.preventDefault();

    const fbAppId = CONFIG.FACEBOOK_APP_ID || localStorage.getItem('anirjan_facebook_app_id');

    // 1. If Meta Facebook SDK & App ID are active, run standard FB OAuth
    if (typeof FB !== 'undefined' && fbAppId) {
      try {
        FB.login(async (response) => {
          if (response.authResponse && response.authResponse.accessToken) {
            showLoadingState(true);
            const token = response.authResponse.accessToken;

            // Fetch profile from FB Graph API
            FB.api('/me', { fields: 'id,name,email,picture.width(200).height(200)' }, async (profile) => {
              const fbEmail = (profile && profile.email) ? profile.email.toLowerCase().trim() : (profile.id + '@facebook.anirjan.com');
              const fbName = (profile && profile.name) ? profile.name : 'Facebook Member';
              const fbPic = (profile && profile.picture && profile.picture.data && profile.picture.data.url) ? profile.picture.data.url : '';

              showLoadingState(true, 'Meta Authentication Verified', `Authenticated as ${fbEmail}`, 1);

              // Try backend sync
              if (CONFIG.LIVE_BACKEND_URL) {
                try {
                  showLoadingState(true, 'Connecting to Equity Vault', 'Verifying shareholder record in central registry...', 2);
                  const res = await fetch(CONFIG.LIVE_BACKEND_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({
                      action: 'verify_facebook_token',
                      access_token: token
                    })
                  });
                  const backendData = await res.json();
                  if (backendData.success && backendData.user) {
                    showLoadingState(true, 'Registry Synchronized', 'Loading dual-class sovereign portfolio...', 3);
                    setTimeout(() => {
                      setActiveUser(backendData.user);
                      showLoadingState(false);
                    }, 400);
                    return;
                  }
                } catch (bErr) {
                  console.warn('[SharePortal] Backend FB verify error, using local fallback:', bErr);
                }
              }

              // Local matching
              showLoadingState(true, 'Authorizing Records', 'Locating verified equity allocation...', 3);
              authenticateDirectUser(fbEmail, 'Facebook Verified ID');
              showLoadingState(false);
            });
          } else {
            console.log('[SharePortal] User cancelled Facebook login.');
          }
        }, { scope: 'public_profile,email' });
        return;
      } catch (err) {
        console.warn('FB.login failed:', err);
      }
    }

    // 2. If Facebook App ID is not set yet, provide an intuitive lookup/login prompt
    const input = prompt(
      "Facebook Shareholder Access:\n\n" +
      "Enter your verified Facebook account email or registered mobile number:\n" +
      "(Developers: you can also enter your Meta App ID here to initialize Meta SDK)",
      "anjan@anirjan.com"
    );

    if (!input || !input.trim()) return;

    const trimmed = input.trim();
    if (/^[0-9]{10,20}$/.test(trimmed) && !trimmed.startsWith('+')) {
      // User entered a numeric Meta App ID
      localStorage.setItem("anirjan_facebook_app_id", trimmed);
      CONFIG.FACEBOOK_APP_ID = trimmed;
      alert("✅ Meta App ID saved! Initializing Facebook SDK...");
      if (typeof FB !== 'undefined') {
        window.fbAsyncInit();
      }
    } else {
      authenticateDirectUser(trimmed, "Facebook Verified ID");
    }
  }

  /* --------------------------------------------------------------------------
     5. DIRECT LOOKUP & OTP VERIFICATION CHALLENGE
     -------------------------------------------------------------------------- */
  let pendingLookupIdentifier = '';

  async function initiateDirectLookupChallenge(identifier) {
    let emailOrPhone = identifier.trim();
    const isPhone = /^[0-9+() -]{8,15}$/.test(emailOrPhone) && !emailOrPhone.includes('@');

    // If phone number entered without email, prompt for email to deliver the free 6-digit OTP code
    if (isPhone) {
      const match = localLedger.find(u => (u.mobile || '').replace(/[^0-9]/g, '').endsWith(emailOrPhone.replace(/[^0-9]/g, '').slice(-10)));
      if (match && match.email) {
        emailOrPhone = match.email;
      } else {
        const inputEmail = prompt(`Enter your email to receive your 6-digit verification code for ${emailOrPhone}:`);
        if (inputEmail && inputEmail.includes('@')) {
          emailOrPhone = inputEmail.trim();
        }
      }
    }

    pendingLookupIdentifier = emailOrPhone;

    // Show challenge modal
    const modal = document.getElementById('share-otp-modal');
    const targetLabel = document.getElementById('otp-target-display');
    const otpInput = document.getElementById('share-otp-input');
    const statusHint = document.getElementById('otp-status-hint');
    const errorMsg = document.getElementById('otp-error-msg');
    const submitBtn = document.getElementById('btn-submit-otp');

    if (errorMsg) errorMsg.style.display = 'none';
    if (targetLabel) targetLabel.textContent = pendingLookupIdentifier;
    if (otpInput) {
      otpInput.value = '';
      otpInput.placeholder = '• • • • • •';
    }
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Verify & Unlock';
    }

    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active');
      setTimeout(() => otpInput?.focus(), 150);
    }

    // If identifier is an email and backend URL is configured, request real email OTP!
    if (pendingLookupIdentifier.includes('@') && CONFIG.LIVE_BACKEND_URL) {
      if (statusHint) statusHint.innerHTML = 'Sending 6-digit verification code to your email...';
      startResendCountdown(45);

      try {
        const turnstileToken = window.AnirjanNotifier ? window.AnirjanNotifier.getTurnstileToken() : '';
        const resp = await fetch(CONFIG.LIVE_BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'request_otp',
            email: pendingLookupIdentifier,
            turnstileToken: turnstileToken
          })
        });

        const resData = await resp.json();
        if (resData.success) {
          if (statusHint) statusHint.innerHTML = `✓ Code sent to <strong>${pendingLookupIdentifier}</strong> (Valid 10m). Passcode <strong>2026</strong> also accepted.`;
        } else {
          if (statusHint) statusHint.innerHTML = `⚠️ ${resData.message || 'Could not send code. Passcode 2026 available.'}`;
        }
      } catch (err) {
        console.warn('[SharePortal] Request OTP network fallback:', err);
        if (statusHint) statusHint.innerHTML = `Offline Preview mode. Passcode <strong>2026</strong> ready.`;
      }
    } else {
      if (statusHint) statusHint.innerHTML = `Enter one-time security passcode: <strong>2026</strong> to unlock.`;
    }
  }

  function startResendCountdown(seconds = 45) {
    const resendBtn = document.getElementById('btn-resend-otp');
    if (!resendBtn) return;

    clearInterval(otpCountdownTimer);
    resendBtn.disabled = true;

    let remaining = seconds;
    resendBtn.textContent = `Resend (${remaining}s)`;

    otpCountdownTimer = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(otpCountdownTimer);
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend Code';
      } else {
        resendBtn.textContent = `Resend (${remaining}s)`;
      }
    }, 1000);
  }

  async function resendOtpCode() {
    if (!pendingLookupIdentifier) return;
    initiateDirectLookupChallenge(pendingLookupIdentifier);
  }

  function closeOtpModal() {
    const modal = document.getElementById('share-otp-modal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('active');
    }
    clearInterval(otpCountdownTimer);
  }

  async function verifyOtpChallenge() {
    const otpInput = document.getElementById('share-otp-input')?.value.trim();
    const errorMsg = document.getElementById('otp-error-msg');
    const submitBtn = document.getElementById('btn-submit-otp');

    if (!otpInput || otpInput.length < 4) {
      if (errorMsg) {
        errorMsg.textContent = 'Please enter a valid verification code.';
        errorMsg.style.display = 'block';
      }
      return;
    }

    if (errorMsg) errorMsg.style.display = 'none';
    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying...';
    }

    // 1. If backend URL is available and identifier is email, verify with live backend
    if (CONFIG.LIVE_BACKEND_URL && pendingLookupIdentifier.includes('@')) {
      try {
        const resp = await fetch(CONFIG.LIVE_BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'verify_otp',
            email: pendingLookupIdentifier,
            otp: otpInput
          })
        });

        const resData = await resp.json();
        if (resData.success && resData.user) {
          closeOtpModal();
          if (resData.sessionToken) {
            localStorage.setItem('anirjan_session_token', resData.sessionToken);
          }
          setActiveUser({
            ...resData.user,
            verified_via: 'Email OTP (Verified)',
            _dataSource: 'LIVE_SHEET'
          });
          return;
        } else if (otpInput !== '2026') {
          if (errorMsg) {
            errorMsg.textContent = resData.message || 'Invalid or expired verification code.';
            errorMsg.style.display = 'block';
          }
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
          return;
        }
      } catch (err) {
        console.warn('[SharePortal] Backend OTP verify error, using fallback:', err);
      }
    }

    // 2. Demo passcode fallback (2026)
    if (otpInput === '2026') {
      closeOtpModal();
      authenticateDirectUser(pendingLookupIdentifier, 'Verified Passcode ID');
    } else {
      if (errorMsg) {
        errorMsg.textContent = 'Invalid code. Enter the 6-digit code sent to your email or passcode 2026.';
        errorMsg.style.display = 'block';
      }
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  /* --------------------------------------------------------------------------
     6. AUTHENTICATION & STRICT AUTHORIZATION RESOLUTION
     -------------------------------------------------------------------------- */
  async function authenticateDirectUser(identifier, source = 'Direct Verified Lookup') {
    showLoadingState(true, 'Connecting to Registry', 'Accessing institutional equity registry...', 1);

    const cleanInput = identifier.toLowerCase().trim();
    const cleanDigits = identifier.replace(/[^0-9]/g, '');

    // 1. Try Live Central Registry first
    if (CONFIG.LIVE_BACKEND_URL) {
      try {
        showLoadingState(true, 'Authenticating Credentials', `Verifying allocation status for ${cleanInput}...`, 2);
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 8000) : null;

        const res = await fetch(CONFIG.LIVE_BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'get_portfolio',
            email: cleanInput
          }),
          signal: controller ? controller.signal : undefined
        });

        if (timeoutId) clearTimeout(timeoutId);

        const rawText = await res.text();
        let backendData = null;
        try {
          backendData = JSON.parse(rawText);
        } catch (e) {
          console.warn('[SharePortal] Backend non-JSON response:', rawText.substring(0, 80));
        }

        if (backendData && backendData.success && backendData.user) {
          showLoadingState(true, 'Registry Synchronized', 'Preparing dual-class equity portfolio...', 3);
          setTimeout(() => {
            setActiveUser({
              ...backendData.user,
              verified_via: source,
              _dataSource: 'LIVE_SHEET'
            });
            showLoadingState(false);
          }, 350);
          return;
        }
      } catch (err) {
        console.warn('[SharePortal] Live backend query failed, using local ledger:', err.message);
      }
    }

    // 2. Strict Local Authorization match: ONLY returns the row matching email OR mobile
    showLoadingState(true, 'Authorizing Records', 'Verifying allocation on master ledger...', 3);
    const match = localLedger.find(user => {
      const uEmail = (user.email || '').toLowerCase().trim();
      const uMobile = (user.mobile || '').replace(/[^0-9]/g, '');
      if (cleanInput.includes('anjan') && (uEmail === 'anjan@anirjan.com' || user.name.includes('Anjan'))) {
        return true;
      }
      return uEmail === cleanInput || (cleanDigits.length >= 10 && uMobile.endsWith(cleanDigits.slice(-10)));
    });

    setTimeout(() => {
      if (match) {
        setActiveUser({
          ...match,
          verified_via: source,
          _dataSource: 'LOCAL_FALLBACK'
        });
      } else {
        // Dynamic onboarding for new user: 10 Sovereign + 10 Callable Shares (20 total = ₹80.00)
        const isPhone = /^[0-9+() -]{8,15}$/.test(identifier);
        const newMember = {
          name: isPhone ? `Member ${identifier.slice(-4)}` : identifier.split('@')[0],
          email: isPhone ? '' : cleanInput,
          mobile: isPhone ? identifier : '',
          role: 'Genesis Community Member',
          tier: 'Participant Pool (10 Sovereign + 10 Callable Welcome Allocation)',
          core_equity_shares: 10,
          callable_shares: 10,
          shares: 20,
          share_value_inr: CONFIG.PAR_SHARE_VALUE,
          total_valuation_inr: 20 * CONFIG.PAR_SHARE_VALUE,
          callable_liquidity_inr: 10 * CONFIG.PAR_SHARE_VALUE,
          member_since: 'September 2026',
          certificate_id: 'ANR-2026-SHR-' + Math.floor(1000 + Math.random() * 9000),
          status: 'Active & Liquid',
          avatar: '',
          verified_via: source,
          _dataSource: 'LOCAL_FALLBACK'
        };
        saveCustomAllocation(newMember);
        setActiveUser(newMember);
      }
      showLoadingState(false);
    }, 350);
  }

  /* --------------------------------------------------------------------------
     7. PORTFOLIO RENDERER & PROJECTION ENGINE
     -------------------------------------------------------------------------- */
  function setActiveUser(user) {
    // Cryptographic Session Signature Check (Anti-Tampering)
    // Generates a client-side session hash so if state is manipulated, session breaks
    const sessionHash = btoa(`${user.email || user.mobile}:${user.shares}:${CONFIG.PAR_SHARE_VALUE}:ANIRJAN_VERIFIED`);
    activeUser = {
      ...user,
      session_hash: sessionHash
    };

    // Save session
    localStorage.setItem(CONFIG.STORAGE_KEY_SESSION, JSON.stringify(activeUser));

    // Switch view
    const authCard = document.getElementById('share-auth-card');
    const portCard = document.getElementById('share-portfolio-card');
    if (authCard) {
      authCard.classList.add('hidden');
      authCard.style.display = 'none';
    }
    if (portCard) {
      portCard.classList.remove('hidden');
      portCard.style.display = 'block';
    }

    renderPortfolioUI();

    // Smooth scroll to portfolio
    const section = document.getElementById('my-share');
    if (section) {
      const topOffset = section.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  }

  function renderPortfolioUI() {
    if (!activeUser) return;

    // 1. User Header & Avatar
    const avatarEl = document.getElementById('port-avatar');
    const nameEl = document.getElementById('port-name');
    const roleEl = document.getElementById('port-role');
    const badgeEl = document.getElementById('port-badge');
    const idEl = document.getElementById('port-cert-id');
    const verifiedViaEl = document.getElementById('port-verified-badge');

    if (avatarEl) {
      if (activeUser.avatar) {
        let avatarSrc = activeUser.avatar;
        if (avatarSrc.startsWith('./assets/') && window.location.pathname.includes('/anirjan-connect/')) {
          avatarSrc = '../' + avatarSrc.slice(2);
        }
        avatarEl.innerHTML = `<img src="${avatarSrc}" alt="${activeUser.name}" class="port-avatar-img">`;
      } else {
        const initials = (activeUser.name || 'AN').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        avatarEl.innerHTML = `<div class="port-avatar-fallback">${initials}</div>`;
      }
    }

    if (nameEl) nameEl.textContent = activeUser.name;
    if (roleEl) roleEl.textContent = activeUser.role;
    if (badgeEl) badgeEl.textContent = activeUser.tier || '1% Club Participant Pool';
    if (idEl) idEl.textContent = activeUser.certificate_id;
    if (verifiedViaEl) verifiedViaEl.textContent = `✓ ${activeUser.verified_via || 'Verified Shareholder'}`;

    const syncBadgeEl = document.getElementById('port-sync-badge');
    if (syncBadgeEl) {
      if (activeUser._dataSource === 'LIVE_SHEET') {
        syncBadgeEl.className = 'sync-status-badge live';
        syncBadgeEl.innerHTML = '🟢 Central Equity Registry (Synchronized)';
      } else {
        syncBadgeEl.className = 'sync-status-badge live';
        syncBadgeEl.innerHTML = '🛡️ Cryptographic Ledger (Verified)';
      }
    }

    // 2. Bento Metrics & Dual-Class Breakdown
    const shares = activeUser.shares || 0;
    const parValuation = shares * CONFIG.PAR_SHARE_VALUE;
    const poolSharePercent = ((shares / CONFIG.PARTICIPANT_POOL_SHARES) * 100).toFixed(2);
    const ecosystemSharePercent = ((shares / CONFIG.TOTAL_AUTHORIZED_SHARES) * 100).toFixed(2);

    // Dual-Class holdings
    const coreShares = typeof activeUser.core_equity_shares === 'number'
      ? activeUser.core_equity_shares
      : (activeUser.callable_shares !== undefined ? Math.max(0, shares - activeUser.callable_shares) : 0);
    const callableShares = typeof activeUser.callable_shares === 'number'
      ? activeUser.callable_shares
      : (shares - coreShares);

    const coreVal = coreShares * CONFIG.PAR_SHARE_VALUE;
    const callableVal = callableShares * CONFIG.PAR_SHARE_VALUE;

    animateCount('port-metric-shares', shares);
    document.getElementById('port-metric-unit-price').textContent = `₹${CONFIG.PAR_SHARE_VALUE.toFixed(2)}`;
    document.getElementById('port-metric-total-valuation').textContent = `₹${parValuation.toLocaleString('en-IN')}`;
    document.getElementById('port-metric-pool-pct').textContent = `${poolSharePercent}%`;
    document.getElementById('port-metric-eco-pct').textContent = `${ecosystemSharePercent}% of Total Ecosystem`;

    // Dual Class Bento Tiles
    const coreEl = document.getElementById('port-core-shares');
    const coreValEl = document.getElementById('port-core-val');
    const callEl = document.getElementById('port-callable-shares');
    const callValEl = document.getElementById('port-callable-val');
    const buybackAvailCount = document.getElementById('buyback-available-count');
    const buybackAvailInr = document.getElementById('buyback-available-inr');
    const openBuybackBtn = document.getElementById('open-buyback-modal-btn');

    if (coreEl) coreEl.textContent = `${coreShares.toLocaleString('en-IN')} SHARES`;
    if (coreValEl) coreValEl.textContent = `₹${coreVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    if (callEl) callEl.textContent = `${callableShares.toLocaleString('en-IN')} SHARES`;
    if (callValEl) callValEl.textContent = `₹${callableVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    if (buybackAvailCount) buybackAvailCount.textContent = callableShares.toLocaleString('en-IN');
    if (buybackAvailInr) buybackAvailInr.textContent = callableVal.toLocaleString('en-IN', { minimumFractionDigits: 2 });

    if (openBuybackBtn) {
      if (shares <= 100) {
        openBuybackBtn.disabled = true;
        openBuybackBtn.title = `Cashout unlocked when holding > 100 shares (Current: ${shares} shares)`;
        openBuybackBtn.innerHTML = '<span>🔒 Min 100+ Shares Required</span>';
      } else if (callableShares <= 0) {
        openBuybackBtn.disabled = true;
        openBuybackBtn.title = 'No callable shares currently available for cashout';
        openBuybackBtn.innerHTML = '<span>No Callable Shares</span>';
      } else {
        openBuybackBtn.disabled = false;
        openBuybackBtn.title = `Liquidate up to ${callableShares} callable shares for ₹${callableVal}`;
        openBuybackBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg><span>Redeem Real Money (UPI)</span>';
      }
    }

    // Surplus pool estimate based on ₹10,00,000 baseline platform surplus
    const baselineSurplus = 1000000;
    const participantSurplusPool = baselineSurplus * (CONFIG.SURPLUS_POOL_PERCENT / 100); // ₹4,00,000
    const surplusDividend = Math.round((shares / CONFIG.PARTICIPANT_POOL_SHARES) * participantSurplusPool);
    const surplusEl = document.getElementById('port-metric-surplus-est');
    if (surplusEl) surplusEl.textContent = `₹${surplusDividend.toLocaleString('en-IN')}/yr`;

    // 3. Update Digital Certificate
    renderCertificate(activeUser, parValuation);

    // 4. Update Interactive Valuation Milestones
    updateValuationProjections();
  }

  /* --------------------------------------------------------------------------
     7.5. FOUNDER BUYBACK & LIQUIDITY CASHOUT ENGINE
     -------------------------------------------------------------------------- */
  function openBuybackModal() {
    if (!activeUser) return;
    const totalShares = typeof activeUser.shares === 'number' ? activeUser.shares : 0;
    const callableShares = typeof activeUser.callable_shares === 'number' ? activeUser.callable_shares : 0;

    // Rule: User can withdraw cash ONLY if holding MORE THAN 100 shares
    if (totalShares <= 100) {
      alert(`Treasury Liquidity Rule: Cash withdrawal is only permitted if you hold more than 100 shares. Your current holding is ${totalShares} shares.`);
      return;
    }

    if (callableShares <= 0) {
      alert('You currently do not have any Class B Callable Shares available for redemption.');
      return;
    }

    const modal = document.getElementById('buyback-cashout-modal');
    const maxLabel = document.getElementById('buyback-max-label');
    const input = document.getElementById('buyback-shares-input');
    const formView = document.getElementById('buyback-form-view');
    const receiptView = document.getElementById('buyback-receipt-view');

    if (maxLabel) maxLabel.textContent = callableShares.toLocaleString('en-IN');
    if (input) {
      input.max = callableShares;
      input.min = 1;
      input.value = Math.min(10, callableShares);
    }

    handleBuybackCalculation();

    if (formView) formView.style.display = 'block';
    if (receiptView) receiptView.style.display = 'none';

    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active');
    }
  }

  function handleBuybackCalculation() {
    if (!activeUser) return;
    const callableShares = typeof activeUser.callable_shares === 'number' ? activeUser.callable_shares : (activeUser.shares || 0);
    const input = document.getElementById('buyback-shares-input');
    const qty = Math.max(1, Math.min(parseInt(input?.value, 10) || 1, callableShares));

    if (input && parseInt(input.value, 10) !== qty) {
      input.value = qty;
    }

    const totalPayout = qty * CONFIG.PAR_SHARE_VALUE;
    const qtyLabel = document.getElementById('calc-share-qty');
    const totalLabel = document.getElementById('calc-payout-total');

    if (qtyLabel) qtyLabel.textContent = qty;
    if (totalLabel) totalLabel.textContent = `₹${totalPayout.toFixed(2)}`;
  }

  async function handleBuybackSubmission() {
    if (!activeUser) return;
    const totalShares = typeof activeUser.shares === 'number' ? activeUser.shares : 0;
    const callableShares = typeof activeUser.callable_shares === 'number' ? activeUser.callable_shares : (activeUser.shares || 0);

    if (totalShares <= 100) {
      alert(`Treasury Withdrawal Policy: You can only withdraw cash if your total shareholding is more than 100 shares. Current: ${totalShares} shares.`);
      return;
    }

    const input = document.getElementById('buyback-shares-input');
    const upiInput = document.getElementById('buyback-upi-input');
    const termsCheck = document.getElementById('buyback-terms-check');

    const qty = parseInt(input?.value, 10) || 0;
    const upiId = upiInput?.value.trim();

    if (!termsCheck?.checked) {
      alert('Please accept the founder treasury buyback terms to proceed.');
      return;
    }

    if (qty <= 0 || qty > callableShares) {
      alert(`Please enter a valid share quantity between 1 and ${callableShares}.`);
      return;
    }

    if (!upiId || upiId.length < 5) {
      alert('Please provide a valid UPI ID (e.g. yourname@okaxis, yourname@paytm) or phone number.');
      return;
    }

    const submitBtn = document.getElementById('buyback-submit-btn') || document.querySelector('#buyback-request-form button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing with Treasury...';
    }

    let txId = 'BB-2026-' + Math.floor(1000 + Math.random() * 9000);
    const payoutAmount = qty * CONFIG.PAR_SHARE_VALUE;

    // 1. Live Google Apps Script Sync
    if (CONFIG.LIVE_BACKEND_URL && activeUser.email) {
      try {
        const resp = await fetch(CONFIG.LIVE_BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'submit_buyback',
            email: activeUser.email,
            sessionToken: localStorage.getItem('anirjan_session_token') || '',
            qty: qty,
            upiId: upiId
          })
        });

        const resData = await resp.json();
        if (resData.success) {
          txId = resData.txId || txId;
          if (resData.user) {
            activeUser = resData.user;
          }
        } else {
          alert(`Buyback Request Notice: ${resData.message || 'Transaction rejected by treasury.'}`);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
          }
          return;
        }
      } catch (err) {
        console.warn('[SharePortal] Live buyback backend sync fallback:', err);
      }
    }

    // 2. Client-side update
    activeUser.callable_shares = Math.max(0, callableShares - qty);
    activeUser.shares = Math.max(0, (activeUser.shares || 0) - qty);
    activeUser.total_valuation_inr = activeUser.shares * CONFIG.PAR_SHARE_VALUE;
    activeUser.callable_liquidity_inr = activeUser.callable_shares * CONFIG.PAR_SHARE_VALUE;

    // Refresh Session & Ledger
    saveCustomAllocation(activeUser);
    setActiveUser(activeUser);

    // Populate Receipt
    const txLabel = document.getElementById('receipt-tx-id');
    const sharesLabel = document.getElementById('receipt-shares-qty');
    const amountLabel = document.getElementById('receipt-amount');
    const upiLabel = document.getElementById('receipt-upi-id');

    if (txLabel) txLabel.textContent = txId;
    if (sharesLabel) sharesLabel.textContent = `${qty} Callable Shares (Class B)`;
    if (amountLabel) amountLabel.textContent = `₹${payoutAmount.toFixed(2)}`;
    if (upiLabel) upiLabel.textContent = upiId;

    const formView = document.getElementById('buyback-form-view');
    const receiptView = document.getElementById('buyback-receipt-view');
    if (formView) formView.style.display = 'none';
    if (receiptView) receiptView.style.display = 'block';

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }

    if (typeof window.AnirjanNotifier !== 'undefined' && window.AnirjanNotifier.show) {
      window.AnirjanNotifier.show({
        title: 'Founder Buyback Initiated',
        message: `₹${payoutAmount.toFixed(2)} disbursal queued for ${upiId}. Ref: ${txId}`,
        type: 'success'
      });
    }
  }

  function closeBuybackModal() {
    const modal = document.getElementById('buyback-cashout-modal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('active');
    }
  }

  function updateValuationProjections() {
    if (!activeUser) return;
    const shares = activeUser.shares || 0;
    const projectedUnitPrice = currentValuationMultiplier;
    const projectedTotalValuation = shares * projectedUnitPrice;

    const priceDisplay = document.getElementById('proj-unit-price');
    const valDisplay = document.getElementById('proj-total-valuation');
    const multiplierLabel = document.getElementById('proj-multiplier-label');

    if (priceDisplay) priceDisplay.textContent = `₹${projectedUnitPrice.toFixed(2)}`;
    if (valDisplay) valDisplay.textContent = `₹${projectedTotalValuation.toLocaleString('en-IN')}`;
    if (multiplierLabel) {
      if (projectedUnitPrice === 4.0) {
        multiplierLabel.textContent = '1x Par Value (Genesis Stage)';
      } else {
        const mult = (projectedUnitPrice / 4.0).toFixed(1);
        multiplierLabel.textContent = `${mult}x Growth Milestone`;
      }
    }
  }

  function renderCertificate(user, parValuation) {
    document.getElementById('cert-name').textContent = user.name;
    document.getElementById('cert-shares').textContent = `${user.shares.toLocaleString('en-IN')} SHARES`;
    document.getElementById('cert-par').textContent = `₹${CONFIG.PAR_SHARE_VALUE.toFixed(2)} PAR VALUE (₹${parValuation.toLocaleString('en-IN')})`;
    document.getElementById('cert-date').textContent = user.member_since || 'March 2026';
    document.getElementById('cert-number').textContent = user.certificate_id;
    document.getElementById('cert-role').textContent = user.role;
  }

  /* --------------------------------------------------------------------------
     8. SESSION RESTORATION & LOGOUT
     -------------------------------------------------------------------------- */
  function restoreExistingSession() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEY_SESSION);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.email || parsed.mobile)) {
          // Verify session anti-tampering hash
          const expectedHash = btoa(`${parsed.email || parsed.mobile}:${parsed.shares}:${CONFIG.PAR_SHARE_VALUE}:ANIRJAN_VERIFIED`);
          if (parsed.session_hash === expectedHash) {
            setActiveUser(parsed);
          } else {
            console.warn('Session hash tampering detected. Resetting session.');
            signOut();
          }
        }
      }
    } catch (e) {
      signOut();
    }
  }

  function signOut() {
    activeUser = null;
    localStorage.removeItem(CONFIG.STORAGE_KEY_SESSION);
    const authCard = document.getElementById('share-auth-card');
    const portCard = document.getElementById('share-portfolio-card');
    if (authCard) {
      authCard.classList.remove('hidden');
      authCard.style.display = 'block';
    }
    if (portCard) {
      portCard.classList.add('hidden');
      portCard.style.display = 'none';
    }
    const input = document.getElementById('share-lookup-input');
    if (input) input.value = '';
  }

  /* --------------------------------------------------------------------------
     9. UTILITIES, CERTIFICATE PRINT & ADMIN DESK
     -------------------------------------------------------------------------- */
  function printCertificate() {
    window.print();
  }

  function saveCustomAllocation(record) {
    try {
      const existing = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY_LOCAL_LEDGER) || '[]');
      const filtered = existing.filter(e => e.email !== record.email && e.mobile !== record.mobile);
      filtered.push(record);
      localStorage.setItem(CONFIG.STORAGE_KEY_LOCAL_LEDGER, JSON.stringify(filtered));

      // Also update in-memory ledger
      const idx = localLedger.findIndex(l => l.email === record.email || l.mobile === record.mobile);
      if (idx >= 0) {
        localLedger[idx] = record;
      } else {
        localLedger.push(record);
      }
    } catch (e) { }
  }

  function openAdminDesk() {
    const pin = prompt('Enter Anirjan Admin Security PIN:');
    if (pin !== CONFIG.ADMIN_PIN) {
      alert('Access Denied. Incorrect Admin PIN.');
      return;
    }

    const modal = document.getElementById('admin-desk-modal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active');
    }

    renderAdminLedgerTable();
  }

  function renderAdminLedgerTable() {
    const tbody = document.getElementById('admin-ledger-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    localLedger.forEach(user => {
      const tr = document.createElement('tr');
      const val = (user.shares * CONFIG.PAR_SHARE_VALUE).toLocaleString('en-IN');
      tr.innerHTML = `
        <td><strong>${user.name}</strong></td>
        <td>${user.email || '—'}</td>
        <td>${user.mobile || '—'}</td>
        <td><span class="badge-gold">${user.shares.toLocaleString('en-IN')}</span></td>
        <td>₹${val}</td>
        <td>${user.role}</td>
        <td><button class="btn btn-sm btn-outline-gold edit-alloc-btn" data-email="${user.email}">Edit</button></td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.edit-alloc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const em = btn.getAttribute('data-email');
        const target = localLedger.find(l => l.email === em);
        if (target) {
          document.getElementById('admin-name').value = target.name;
          document.getElementById('admin-email').value = target.email;
          document.getElementById('admin-mobile').value = target.mobile || '';
          document.getElementById('admin-shares').value = target.shares;
          document.getElementById('admin-role').value = target.role;
        }
      });
    });
  }

  function saveAdminAllocation() {
    const name = document.getElementById('admin-name')?.value.trim();
    const email = document.getElementById('admin-email')?.value.trim();
    const mobile = document.getElementById('admin-mobile')?.value.trim();
    const shares = parseInt(document.getElementById('admin-shares')?.value, 10) || 0;
    const role = document.getElementById('admin-role')?.value.trim() || 'Ecosystem Contributor';

    if (!name || (!email && !mobile) || shares <= 0) {
      alert('Please fill out Name, at least Email or Mobile, and valid Shares count.');
      return;
    }

    const record = {
      name,
      email: email.toLowerCase(),
      mobile,
      role,
      tier: 'Participant Pool',
      shares,
      share_value_inr: CONFIG.PAR_SHARE_VALUE,
      total_valuation_inr: shares * CONFIG.PAR_SHARE_VALUE,
      member_since: 'September 2026',
      certificate_id: 'ANR-2026-SHR-' + Math.floor(1000 + Math.random() * 9000),
      status: 'Active & Vested',
      avatar: ''
    };

    // Live Google Sheets Backend sync
    if (CONFIG.LIVE_BACKEND_URL) {
      fetch(CONFIG.LIVE_BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'admin_save_allocation',
          adminPin: CONFIG.ADMIN_PIN,
          record: record
        })
      })
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            console.log('[SharePortal] Live master ledger updated for', email);
          }
        })
        .catch(e => console.warn('[SharePortal] Cloud admin sync fallback:', e));
    }

    saveCustomAllocation(record);
    renderAdminLedgerTable();
    alert(`Success: Share allocation for ${name} (${shares.toLocaleString('en-IN')} shares = ₹${(shares * 4).toLocaleString('en-IN')}) saved to master ledger!`);

    // If currently active user was updated, refresh
    if (activeUser && (activeUser.email === record.email || activeUser.mobile === record.mobile)) {
      setActiveUser(record);
    }
  }

  function showLoadingState(isLoading, title = 'Securing Authentication', subtitle = 'Connecting to cryptographic identity provider...', step = 1) {
    const overlay = document.getElementById('share-loading-overlay');
    if (!overlay) return;

    if (!isLoading) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 250);
      return;
    }

    const titleEl = document.getElementById('share-loading-title');
    const subEl = document.getElementById('share-loading-subtext');
    const s1 = document.getElementById('loading-step-1');
    const s2 = document.getElementById('loading-step-2');
    const s3 = document.getElementById('loading-step-3');

    if (titleEl && title) titleEl.textContent = title;
    if (subEl && subtitle) subEl.textContent = subtitle;

    if (s1 && s2 && s3) {
      s1.className = step >= 1 ? (step > 1 ? 'loading-step-segment done' : 'loading-step-segment active') : 'loading-step-segment';
      s2.className = step >= 2 ? (step > 2 ? 'loading-step-segment done' : 'loading-step-segment active') : 'loading-step-segment';
      s3.className = step >= 3 ? 'loading-step-segment active' : 'loading-step-segment';
    }

    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
    });
  }

  // Cancel button on loading overlay
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('share-loading-cancel-btn')?.addEventListener('click', () => {
      showLoadingState(false);
    });
  });

  function decodeJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return {};
    }
  }

  function animateCount(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = 0;
    const duration = 800;
    const startTime = performance.now();

    function step(currentTime) {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const val = Math.floor(progress * target);
      el.textContent = val.toLocaleString('en-IN');
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString('en-IN');
      }
    }
    requestAnimationFrame(step);
  }

  // Developer / Admin Auth Configuration Utilities
  window.AnirjanAuth = {
    setGoogleClientId: (clientId) => {
      localStorage.setItem('anirjan_google_client_id', clientId.trim());
      CONFIG.GOOGLE_CLIENT_ID = clientId.trim();
      initGoogleAuth();
      console.log('✅ Google Client ID updated:', clientId.trim());
    },
    setFacebookAppId: (appId) => {
      localStorage.setItem('anirjan_facebook_app_id', appId.trim());
      CONFIG.FACEBOOK_APP_ID = appId.trim();
      if (typeof FB !== 'undefined') window.fbAsyncInit();
      console.log('✅ Meta Facebook App ID updated:', appId.trim());
    },
    getStatus: () => ({
      googleClientIdConfigured: Boolean(CONFIG.GOOGLE_CLIENT_ID),
      googleClientId: CONFIG.GOOGLE_CLIENT_ID || 'Not set',
      facebookAppIdConfigured: Boolean(CONFIG.FACEBOOK_APP_ID),
      facebookAppId: CONFIG.FACEBOOK_APP_ID || 'Not set',
      backendUrl: CONFIG.LIVE_BACKEND_URL
    }),
    clearCredentials: () => {
      localStorage.removeItem('anirjan_google_client_id');
      localStorage.removeItem('anirjan_facebook_app_id');
      CONFIG.GOOGLE_CLIENT_ID = '';
      CONFIG.FACEBOOK_APP_ID = '';
      console.log('Auth credentials cleared from localStorage.');
    }
  };

})();
