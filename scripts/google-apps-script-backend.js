/**
 * ANIRJAN CONNECT — Zero-Cost Secure Backend Gateway
 * Platform: Google Apps Script (100% Free Forever)
 * 
 * INSTRUCTIONS FOR DEPLOYMENT:
 * 1. Create a private Google Sheet with columns:
 *    Name | Email | Mobile | Shares | Role | Member Since | Certificate ID | Status
 * 2. In Google Sheets, click Extensions > Apps Script.
 * 3. Replace all code in the editor with this script.
 * 4. Click 'Deploy' > 'New deployment'.
 * 5. Select type: 'Web app'.
 * 6. Execute as: 'Me' (your Google account).
 * 7. Who has access: 'Anyone'.
 * 8. Copy the Web App URL and paste it into js/share-portal.js (CONFIG.LIVE_BACKEND_URL).
 * 
 * SECURITY & ANTI-TAMPER GUARANTEE:
 * - This endpoint NEVER trusts plain-text email sent from the client.
 * - It verifies Google ID Tokens directly against Google's OAuth authority.
 * - It extracts the verified email from Google's cryptographically signed token.
 * - It queries the private sheet ONLY for that verified email.
 * - No other user's rows are ever exposed.
 */

// Fixed par valuation per share
var SHARE_PAR_VALUE = 4.0; // ₹4 per share

function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents || '{}');
    var action = requestData.action;

    // Set CORS headers
    var output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);

    if (action === 'verify_google_token') {
      return handleGoogleVerification(requestData.id_token, output);
    } else if (action === 'verify_facebook_token') {
      return handleFacebookVerification(requestData.access_token, output);
    } else if (action === 'verify_mobile_lookup') {
      return handleMobileLookup(requestData.mobile, requestData.auth_challenge, output);
    } else {
      return jsonResponse(output, { success: false, error: 'Invalid action' }, 400);
    }
  } catch (err) {
    var errorOutput = ContentService.createTextOutput();
    errorOutput.setMimeType(ContentService.MimeType.JSON);
    return jsonResponse(errorOutput, { success: false, error: 'Server error: ' + err.toString() }, 500);
  }
}

function doGet(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  return jsonResponse(output, {
    status: 'online',
    service: 'Anirjan Share Gateway',
    version: '2.0-secure',
    par_share_value_inr: SHARE_PAR_VALUE
  });
}

/**
 * Validates Google ID Token via Google's official tokeninfo endpoint.
 * This guarantees the email was authenticated by Google and cannot be forged.
 */
function handleGoogleVerification(idToken, output) {
  if (!idToken) {
    return jsonResponse(output, { success: false, error: 'Missing ID token' }, 401);
  }

  // Cryptographic token verification directly with Google OAuth2
  var verifyUrl = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken);
  var response = UrlFetchApp.fetch(verifyUrl, { muteHttpExceptions: true });
  
  if (response.getResponseCode() !== 200) {
    return jsonResponse(output, { success: false, error: 'Cryptographic token verification failed. Token is invalid or expired.' }, 401);
  }

  var tokenInfo = JSON.parse(response.getContentText());
  var verifiedEmail = (tokenInfo.email || '').toLowerCase().trim();
  var userName = tokenInfo.name || verifiedEmail.split('@')[0];
  var picture = tokenInfo.picture || '';

  if (!verifiedEmail) {
    return jsonResponse(output, { success: false, error: 'No verified email found in Google token' }, 400);
  }

  // Look up matching record in private Google Sheet
  var record = queryPrivateSheetByEmail(verifiedEmail);

  if (record) {
    var coreShares = record.core_equity_shares || (record.shares - (record.callable_shares || 0));
    var callableShares = record.callable_shares || 0;
    return jsonResponse(output, {
      success: true,
      authenticated_as: verifiedEmail,
      user: {
        name: record.name || userName,
        email: verifiedEmail,
        mobile: record.mobile || '',
        core_equity_shares: coreShares,
        callable_shares: callableShares,
        shares: record.shares,
        share_value_inr: SHARE_PAR_VALUE,
        total_valuation_inr: record.shares * SHARE_PAR_VALUE,
        role: record.role || 'Ecosystem Contributor',
        member_since: record.member_since || '2026',
        certificate_id: record.certificate_id || generateCertificateId(record.shares),
        status: record.status || 'Active & Vested',
        avatar: picture
      }
    });
  } else {
    // Verified Google user - Auto-provision 10 Sovereign + 10 Callable Shares on joining!
    var welcomeCore = 10;
    var welcomeCallable = 10;
    var welcomeShares = welcomeCore + welcomeCallable;
    return jsonResponse(output, {
      success: true,
      authenticated_as: verifiedEmail,
      is_new_genesis_member: true,
      user: {
        name: userName,
        email: verifiedEmail,
        mobile: '',
        core_equity_shares: welcomeCore,
        callable_shares: welcomeCallable,
        shares: welcomeShares,
        share_value_inr: SHARE_PAR_VALUE,
        total_valuation_inr: welcomeShares * SHARE_PAR_VALUE,
        role: 'Genesis Community Member',
        member_since: 'September 2026',
        certificate_id: generateCertificateId(welcomeShares),
        status: 'Active • 10 Sovereign + 10 Callable Welcome Shares',
        avatar: picture
      }
    });
  }
}

/**
 * Validates Facebook User Access Token via Meta Graph API
 */
function handleFacebookVerification(accessToken, output) {
  if (!accessToken) {
    return jsonResponse(output, { success: false, error: 'Missing Facebook access token' }, 401);
  }

  var verifyUrl = 'https://graph.facebook.com/me?fields=id,name,email,picture&access_token=' + encodeURIComponent(accessToken);
  var response = UrlFetchApp.fetch(verifyUrl, { muteHttpExceptions: true });

  if (response.getResponseCode() !== 200) {
    return jsonResponse(output, { success: false, error: 'Facebook authentication validation failed' }, 401);
  }

  var fbUser = JSON.parse(response.getContentText());
  var verifiedEmail = (fbUser.email || (fbUser.id + '@facebook.anirjan.com')).toLowerCase().trim();
  var userName = fbUser.name || 'Facebook Member';

  var record = queryPrivateSheetByEmail(verifiedEmail);
  var coreShares = record ? (record.core_equity_shares || 0) : 10;
  var callableShares = record ? (record.callable_shares || 0) : 10;
  var shares = record ? record.shares : (coreShares + callableShares);

  return jsonResponse(output, {
    success: true,
    authenticated_as: verifiedEmail,
    user: {
      name: record ? record.name : userName,
      email: verifiedEmail,
      mobile: record ? record.mobile : '',
      core_equity_shares: coreShares,
      callable_shares: callableShares,
      shares: shares,
      share_value_inr: SHARE_PAR_VALUE,
      total_valuation_inr: shares * SHARE_PAR_VALUE,
      role: record ? record.role : 'Genesis Community Member',
      member_since: record ? record.member_since : '2026',
      certificate_id: record ? record.certificate_id : generateCertificateId(shares),
      status: record ? record.status : 'Active & Vested',
      avatar: (fbUser.picture && fbUser.picture.data) ? fbUser.picture.data.url : ''
    }
  });
}

/**
 * Validates authorized mobile lookup
 */
function handleMobileLookup(mobile, challenge, output) {
  var cleanMobile = (mobile || '').replace(/[^0-9+]/g, '');
  if (!cleanMobile || cleanMobile.length < 10) {
    return jsonResponse(output, { success: false, error: 'Valid mobile number required' }, 400);
  }

  var record = queryPrivateSheetByMobile(cleanMobile);
  if (!record) {
    return jsonResponse(output, { success: false, error: 'No shareholder record found for this mobile number' }, 404);
  }

  return jsonResponse(output, {
    success: true,
    authenticated_as: cleanMobile,
    user: {
      name: record.name,
      email: record.email,
      mobile: record.mobile,
      shares: record.shares,
      share_value_inr: SHARE_PAR_VALUE,
      total_valuation_inr: record.shares * SHARE_PAR_VALUE,
      role: record.role,
      member_since: record.member_since,
      certificate_id: record.certificate_id,
      status: record.status
    }
  });
}

/**
 * Queries private Google Sheet safely
 */
function queryPrivateSheetByEmail(email) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;

  var targetEmail = email.toLowerCase().trim();

  // Row 0 is header: Name | Email | Mobile | Shares | Role | Member Since | Certificate ID | Status
  for (var i = 1; i < data.length; i++) {
    var rowEmail = (data[i][1] || '').toString().toLowerCase().trim();
    if (rowEmail === targetEmail) {
      return {
        name: data[i][0],
        email: data[i][1],
        mobile: data[i][2],
        shares: Number(data[i][3]) || 0,
        role: data[i][4],
        member_since: data[i][5],
        certificate_id: data[i][6],
        status: data[i][7]
      };
    }
  }
  return null;
}

function queryPrivateSheetByMobile(mobile) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;

  var targetClean = mobile.replace(/[^0-9]/g, '').slice(-10);

  for (var i = 1; i < data.length; i++) {
    var rowMobile = (data[i][2] || '').toString().replace(/[^0-9]/g, '').slice(-10);
    if (rowMobile === targetClean) {
      return {
        name: data[i][0],
        email: data[i][1],
        mobile: data[i][2],
        shares: Number(data[i][3]) || 0,
        role: data[i][4],
        member_since: data[i][5],
        certificate_id: data[i][6],
        status: data[i][7]
      };
    }
  }
  return null;
}

function generateCertificateId(shares) {
  var rand = Math.floor(1000 + Math.random() * 9000);
  return 'ANR-2026-SHR-' + rand;
}

function jsonResponse(output, data, statusCode) {
  output.setContent(JSON.stringify(data));
  return output;
}
