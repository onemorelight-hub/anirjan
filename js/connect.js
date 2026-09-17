/**
 * ANIRJAN CONNECT — Interactive Functionality
 * Scroll Reveal, Navigation, Smooth Scrolling, Contribution Calculator,
 * Pro-Rata Profit Simulator & Expression of Interest Submission
 */

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initNavbarScroll();
  initSmoothScroll();
  initContributionCalculator();
  initProfitSimulator();
  initRegistrationForm();
});

/* --------------------------------------------------------------------------
   0. SCROLL REVEAL (Intersection Observer)
   -------------------------------------------------------------------------- */
function initScrollReveal() {
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  // Graceful fallback for environments without IntersectionObserver
  if (!('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: '0px 0px -20px 0px'
  });

  revealEls.forEach(el => {
    // Immediately show elements already in or above the viewport
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom >= 0) {
      el.classList.add('is-visible');
    }
    observer.observe(el);
  });
}

/* --------------------------------------------------------------------------
   1. NAVBAR SCROLL & MOBILE TOGGLE
   -------------------------------------------------------------------------- */
function initNavbarScroll() {
  const navbar = document.getElementById('main-navbar');
  const mobileToggle = document.querySelector('.mobile-toggle-btn');
  const navMenu = document.querySelector('.nav-menu');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  });

  mobileToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    navMenu?.classList.toggle('open');
    mobileToggle?.classList.toggle('active');
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navMenu?.classList.remove('open');
      mobileToggle?.classList.remove('active');
    });
  });

  document.addEventListener('click', (e) => {
    if (!navMenu?.contains(e.target) && !mobileToggle?.contains(e.target)) {
      navMenu?.classList.remove('open');
      mobileToggle?.classList.remove('active');
    }
  });
}

/* --------------------------------------------------------------------------
   2. SMOOTH SCROLLING
   -------------------------------------------------------------------------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const offset = 90;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = targetEl.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/* --------------------------------------------------------------------------
   3. CONTRIBUTION CALCULATOR
   -------------------------------------------------------------------------- */
function initContributionCalculator() {
  const typeSelect = document.getElementById('calc-contrib-type');
  const amountInput = document.getElementById('calc-contrib-target');
  const resultDisplay = document.getElementById('calc-result-status');
  const noteDisplay = document.getElementById('calc-result-note');

  if (!typeSelect || !amountInput || !resultDisplay) return;

  function updateCalculator() {
    const type = typeSelect.value;
    const target = amountInput.value.trim();

    resultDisplay.textContent = 'Estimated participation: To be evaluated';

    // Parse potential numeric capital for investment reference preview
    const numMatch = target.replace(/,/g, '').match(/\d+(\.\d+)?/);
    const numericVal = numMatch ? parseFloat(numMatch[0]) : null;

    if (type === 'Investment') {
      if (numericVal && numericVal > 0) {
        const refShares = Math.round(numericVal / 4);
        const refPct = ((refShares / 1000000) * 100).toFixed(2);
        noteDisplay.innerHTML = `<strong>Reference Benchmark:</strong> ₹${numericVal.toLocaleString('en-IN')} corresponds to approximately <strong>${refShares.toLocaleString('en-IN')} reference units (${refPct}%)</strong> at the ₹4 baseline. All participation is based on mutual trust, strategic contribution, and a clear written agreement as we build together.`;
      } else {
        noteDisplay.textContent = 'Early capital and support contributions are based on shared vision, mutual trust, and clear collaborative participation agreements.';
      }
    } else if (type === 'User acquisition') {
      noteDisplay.textContent = 'User acquisition contributions are evaluated based on verified active retention and qualified user engagement, not raw install numbers.';
    } else if (type === 'Marketing') {
      noteDisplay.textContent = 'Marketing impact is evaluated based on campaign performance, verified reach, brand equity uplift, and inbound interest generated.';
    } else if (type === 'Business development' || type === 'Partnership') {
      noteDisplay.textContent = 'Partnerships and business development allocations reflect real contract values, distribution agreements, and strategic reach achieved.';
    } else if (type === 'Advisory') {
      noteDisplay.textContent = 'Strategic advisory contributions are benchmarked against specific milestones, strategic guidance delivered, and measurable outcomes.';
    } else {
      noteDisplay.textContent = 'All contributions are reviewed individually by the Anirjan team and documented under a mutual participation agreement.';
    }
  }

  typeSelect.addEventListener('change', updateCalculator);
  amountInput.addEventListener('input', updateCalculator);
  updateCalculator();
}

/* --------------------------------------------------------------------------
   4. PRO-RATA SHARE & PROFIT SIMULATOR (Mathematics Explorer)
   -------------------------------------------------------------------------- */
function initProfitSimulator() {
  const shareSlider = document.getElementById('sim-shares-slider');
  const shareDisplay = document.getElementById('sim-shares-display');
  const profitInput = document.getElementById('sim-profit-input');

  const metricOwnership = document.getElementById('sim-metric-ownership');
  const metricRefValue = document.getElementById('sim-metric-refvalue');
  const metricPoolShare = document.getElementById('sim-metric-poolshare');
  const metricYourPayout = document.getElementById('sim-metric-yourpayout');

  if (!shareSlider || !profitInput) return;

  function formatINR(val) {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  }

  function updateSimulator() {
    const totalPlatformUnits = 1000000;
    const refPricePerUnit = 4;
    const poolPercentage = 0.40; // 40% Participant Pool

    const units = parseInt(shareSlider.value, 10) || 10000;
    let profit = parseFloat(profitInput.value);
    if (isNaN(profit) || profit < 0) profit = 0;

    if (shareDisplay) {
      shareDisplay.textContent = units.toLocaleString('en-IN') + ' units';
    }

    // Calculations
    const ownershipPct = (units / totalPlatformUnits) * 100;
    const refVal = units * refPricePerUnit;
    const total40Pool = profit * poolPercentage;
    // Payout = 40% Pool * (Ownership% / 40%) = Profit * (Ownership% / 100)
    const yourPayout = total40Pool * ((ownershipPct / 100) / poolPercentage);

    if (metricOwnership) metricOwnership.textContent = ownershipPct.toFixed(2) + '%';
    if (metricRefValue) metricRefValue.textContent = formatINR(refVal);
    if (metricPoolShare) metricPoolShare.textContent = formatINR(total40Pool);
    if (metricYourPayout) metricYourPayout.textContent = formatINR(yourPayout);
  }

  shareSlider.addEventListener('input', updateSimulator);
  profitInput.addEventListener('input', updateSimulator);
  updateSimulator();
}

/* --------------------------------------------------------------------------
   5. REGISTRATION FORM & EXPRESSION OF INTEREST
   -------------------------------------------------------------------------- */
function initRegistrationForm() {
  const form = document.getElementById('connect-interest-form');
  const thankYouCard = document.getElementById('thank-you-card');
  const refCodeBadge = document.getElementById('submission-ref-code');
  const formError = document.getElementById('form-error-notice');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (formError) formError.style.display = 'none';

    // 1. Validate Text Fields
    const fullNameInput = form.querySelector('#full-name');
    const cityInput = form.querySelector('#city-location');
    const whatsappInput = form.querySelector('#whatsapp-number');
    const telegramInput = form.querySelector('#telegram-handle');
    const emailInput = form.querySelector('#email-address');
    const bioInput = form.querySelector('#about-yourself');

    const fullName = fullNameInput?.value.trim() || '';
    const city = cityInput?.value.trim() || '';
    const whatsapp = whatsappInput?.value.trim() || '';
    const telegram = telegramInput?.value.trim() || '';
    const email = emailInput?.value.trim() || '';
    const bio = bioInput?.value.trim() || '';

    if (!fullName) {
      showError('Please enter your full name.', fullNameInput);
      return;
    }

    if (!city) {
      showError('Please enter your city.', cityInput);
      return;
    }

    // WhatsApp OR Telegram is MANDATORY (must provide at least one)
    if (!whatsapp && !telegram) {
      showError('Please provide at least one primary contact channel: WhatsApp or Telegram.', whatsappInput || telegramInput);
      return;
    }

    // Email is OPTIONAL; if provided, validate format
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showError('Please enter a valid email address or leave it blank.', emailInput);
        return;
      }
    }

    // 2. Validate Checkboxes (At least one participation avenue selected)
    const checkedAvenues = Array.from(form.querySelectorAll('input[name="participation"]:checked')).map(cb => cb.value);
    if (checkedAvenues.length === 0) {
      showError('Please select at least one way you would like to participate.');
      return;
    }

    // 3. Validate Radio Groups
    const timeRadio = form.querySelector('input[name="time_commitment"]:checked');
    if (!timeRadio) {
      showError('Please indicate how much time you can contribute per week.');
      return;
    }

    const investRadio = form.querySelector('input[name="investment_interest"]:checked');
    if (!investRadio) {
      showError('Please select your investment interest bracket.');
      return;
    }

    if (!bio) {
      showError('Please tell us briefly about yourself and your background.', bioInput);
      return;
    }

    // 4. Validate Mandatory Consent Checkbox
    const consent = form.querySelector('input[name="consent"]');
    if (!consent || !consent.checked) {
      showError('You must acknowledge and agree to the expression of interest terms to proceed.', consent);
      return;
    }

    // 5. Validate Cloudflare Turnstile Security Verification
    const turnstileWidget = form.querySelector('.cf-turnstile');
    const turnstileToken = window.AnirjanNotifier ? window.AnirjanNotifier.getTurnstileToken() : (form.querySelector('input[name="cf-turnstile-response"]')?.value || '');
    if (turnstileWidget && !turnstileToken) {
      showError('Please complete the Cloudflare security verification before submitting.', turnstileWidget);
      return;
    }

    // 6. Generate Unique Reference Number
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const refId = `AC-2026-${randomHex}`;

    // 7. Collect Form Data
    const formData = {
      referenceId: refId,
      fullName,
      whatsapp: whatsapp || 'Not provided',
      telegram: telegram || 'Not provided',
      email: email || 'Not provided',
      city,
      participationAvenues: checkedAvenues,
      timeCommitment: timeRadio.value,
      investmentInterest: investRadio.value,
      bio,
      networkAudience: form.querySelector('#network-audience')?.value.trim() || 'N/A',
      profileUrl: form.querySelector('#profile-url')?.value.trim() || 'N/A',
      submittedAt: new Date().toISOString()
    };

    const submitBtn = form.querySelector('#btn-submit-interest') || form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Verifying & Sending...</span>';
    }

    // 8. Dispatch to Multi-Channel Backend (Telegram, WhatsApp, Email, Google Sheets)
    let res = null;
    if (window.AnirjanNotifier) {
      res = await window.AnirjanNotifier.dispatch({
        formType: 'ANIRJAN_CONNECT',
        refId: refId,
        name: fullName,
        whatsapp: formData.whatsapp,
        telegram: formData.telegram,
        email: formData.email,
        city: city,
        category: 'Connect Partner',
        details: bio,
        _hp_website: form.querySelector('#_hp_website')?.value || '',
        meta: {
          participation: checkedAvenues,
          timeCommitment: timeRadio.value,
          investment: investRadio.value,
          audience: formData.networkAudience,
          profileUrl: formData.profileUrl
        }
      });

      if (res && (!res.success || res.duplicate || res.rateLimited)) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
        showError(res.message || "This inquiry has already been submitted. Duplicate blocked.");
        return;
      }
    }

    // 9. Save in LocalStorage on success
    try {
      const existing = JSON.parse(localStorage.getItem('anirjan_connect_submissions') || '[]');
      existing.push(formData);
      localStorage.setItem('anirjan_connect_submissions', JSON.stringify(existing));
    } catch (err) {
      console.warn('LocalStorage save failed:', err);
    }

    // 10. Transition to Thank You Card only on success
    form.style.display = 'none';
    if (refCodeBadge) {
      refCodeBadge.textContent = `Reference ID: ${refId}`;
    }
    if (thankYouCard) {
      thankYouCard.style.display = 'block';
      thankYouCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  function showError(msg, focusEl = null) {
    if (formError) {
      formError.textContent = msg;
      formError.style.display = 'block';
      formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      alert(msg);
    }
    if (focusEl) {
      if (typeof focusEl.focus === 'function' && focusEl.tagName !== 'DIV') {
        focusEl.focus();
      } else {
        focusEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        focusEl.style.outline = '2px solid #EF4444';
        focusEl.style.borderRadius = '8px';
        setTimeout(() => {
          focusEl.style.outline = 'none';
        }, 3500);
      }
    }
  }

  // Clear error on Turnstile success
  window.onTurnstileConnectSuccess = function () {
    if (formError) formError.style.display = 'none';
  };

  // Clear error on input interaction
  form.querySelectorAll('input, textarea, select').forEach(input => {
    input.addEventListener('input', () => {
      if (formError) formError.style.display = 'none';
    });
    input.addEventListener('change', () => {
      if (formError) formError.style.display = 'none';
    });
  });
}
