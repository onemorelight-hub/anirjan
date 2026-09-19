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
  initJobDoneForm();
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
    try {
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

        if (res && (!res.success || res.duplicate || res.rateLimited || res.turnstileRequired)) {
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
    } catch (err) {
      console.error("[Connect] Unexpected error during submit:", err);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
      showError("A temporary connection error occurred. Please try submitting again.");
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

/* --------------------------------------------------------------------------
   5. GET YOUR JOB DONE — SIMPLE, FRICTIONLESS TASK SUBMISSION
   -------------------------------------------------------------------------- */
function initJobDoneForm() {
  const form = document.getElementById('job-done-form');
  if (!form) return;

  const formWrapper = document.getElementById('job-done-form-wrapper');
  const thankYouCard = document.getElementById('job-done-thankyou');
  const refCodeBadge = document.getElementById('job-ref-code-badge');
  const waBtn = document.getElementById('job-whatsapp-direct-link');
  const tgBtn = document.getElementById('job-telegram-direct-link');
  const formError = document.getElementById('job-form-error');
  const satisfactionBar = document.getElementById('job-satisfaction-bar');
  const satisfactionBadge = document.getElementById('job-satisfaction-badge');
  const satisfactionHint = document.getElementById('job-satisfaction-hint-text');
  const titleInput = document.getElementById('job-title');
  const descInput = document.getElementById('job-description');
  const clientNameInput = document.getElementById('job-client-name');
  const whatsappInput = document.getElementById('job-client-whatsapp');
  const telegramInput = document.getElementById('job-client-telegram');
  const emailInput = document.getElementById('job-client-email');
  const assetLinksInput = document.getElementById('job-asset-links');

  // Cloudflare Turnstile Verification Callback for Job Done Form
  window.onTurnstileJobSuccess = function(token) {
    if (formError) formError.style.display = 'none';
    updateSatisfactionMeter();
  };

  // Ensure Turnstile widget is rendered if API already available
  try {
    const jobTurnstile = form.querySelector('.cf-turnstile');
    if (jobTurnstile && window.turnstile && typeof window.turnstile.render === 'function') {
      if (!jobTurnstile.querySelector('iframe')) {
        window.turnstile.render(jobTurnstile);
      }
    }
  } catch (e) {
    // Graceful fallback
  }

  // Dynamic Satisfaction & Task Clarity Meter
  function updateSatisfactionMeter() {
    if (!satisfactionBar || !satisfactionBadge) return;

    let score = 25; // Base score
    const titleVal = titleInput?.value.trim() || '';
    const descVal = descInput?.value.trim() || '';
    const nameVal = clientNameInput?.value.trim() || '';
    const waVal = whatsappInput?.value.trim() || '';

    if (titleVal.length > 5) score += 25;
    if (descVal.length > 20) score += 25;
    if (nameVal.length > 2 && waVal.length >= 8) score += 25;

    score = Math.min(score, 100);
    satisfactionBar.style.width = `${score}%`;

    if (score <= 25) {
      satisfactionBadge.textContent = `${score}% • Enter Task Title`;
      satisfactionBadge.style.color = '#94a3b8';
      satisfactionBadge.style.borderColor = 'rgba(148, 163, 184, 0.3)';
      if (satisfactionHint) satisfactionHint.textContent = 'Give your task a clear headline or summary.';
    } else if (score <= 50) {
      satisfactionBadge.textContent = `${score}% • Add Details`;
      satisfactionBadge.style.color = '#f3c276';
      satisfactionBadge.style.borderColor = 'rgba(243, 194, 118, 0.4)';
      if (satisfactionHint) satisfactionHint.textContent = 'Briefly describe your requirements, key goals, or references.';
    } else if (score <= 75) {
      satisfactionBadge.textContent = `${score}% • Almost Ready`;
      satisfactionBadge.style.color = '#38bdf8';
      satisfactionBadge.style.borderColor = 'rgba(56, 189, 248, 0.4)';
      if (satisfactionHint) satisfactionHint.textContent = 'Add your name and WhatsApp/Telegram so our team can reach out.';
    } else {
      satisfactionBadge.textContent = `${score}% • Ready to Dispatch ⚡`;
      satisfactionBadge.style.color = '#6ee7b7';
      satisfactionBadge.style.borderColor = '#6ee7b7';
      if (satisfactionHint) satisfactionHint.textContent = 'Perfect! Our team will triage this and coordinate via WhatsApp, Telegram & Email.';
    }
  }

  // Clear errors and update meter on input
  form.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('input', () => {
      if (formError) formError.style.display = 'none';
      updateSatisfactionMeter();
    });
  });

  // Initial meter calculation
  updateSatisfactionMeter();

  // Synthesize Harmonic Celebration Chime (Web Audio API)
  function playSuccessChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.15); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440.00, now); // A4
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.22); // D6

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.7);
      osc2.stop(now + 0.7);
    } catch (e) {
      // Audio autoplay policy notice - safe to ignore
    }
  }

  // Lightweight Cosmic Canvas Confetti
  function triggerCosmicConfetti() {
    let canvas = document.getElementById('job-confetti-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'job-confetti-canvas';
      (thankYouCard || formWrapper || document.body).appendChild(canvas);
    }
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth);
    const height = (canvas.height = canvas.parentElement?.offsetHeight || 400);

    const particles = [];
    const colors = ['#10b981', '#6ee7b7', '#f3c276', '#38bdf8', '#fbbf24', '#ffffff'];

    for (let i = 0; i < 70; i++) {
      particles.push({
        x: width / 2,
        y: height / 3,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.7) * 12,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        spin: (Math.random() - 0.5) * 10,
        alpha: 1,
        decay: Math.random() * 0.015 + 0.012
      });
    }

    let animId;
    function render() {
      ctx.clearRect(0, 0, width, height);
      let alive = false;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22; // gravity
        p.rotation += p.spin;
        p.alpha -= p.decay;

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });

      if (alive) {
        animId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    }
    render();
  }

  // Submission handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (formError) formError.style.display = 'none';

    // Bot trap check
    const hp = form.querySelector('#job_hp_website')?.value;
    if (hp) {
      console.warn('[JobDone] Bot submission blocked.');
      return;
    }

    const title = titleInput?.value.trim();
    const description = descInput?.value.trim();
    const category = 'General (Team Triaged)';
    const urgency = 'Standard';
    const budget = 'Flexible / Open to Quote';
    const clientName = clientNameInput?.value.trim();
    const whatsapp = whatsappInput?.value.trim();
    const telegram = telegramInput?.value.trim() || 'Not provided';
    const email = emailInput?.value.trim() || 'Not provided';
    const city = 'Not provided';
    const assetLinks = assetLinksInput?.value.trim() || '';

    if (!title || !description || !clientName || !whatsapp) {
      showJobError('Please complete the required fields: Task Title, Details, Name, and Contact Number.');
      return;
    }

    if (whatsapp.length < 8) {
      showJobError('Please enter a valid WhatsApp or contact phone number.');
      return;
    }

    // ------------------------------------------------------------------------
    // CLOUDFLARE TURNSTILE CRYPTOGRAPHIC VERIFICATION
    // ------------------------------------------------------------------------
    const turnstileWidget = form.querySelector('.cf-turnstile');
    const turnstileToken = window.AnirjanNotifier
      ? window.AnirjanNotifier.getTurnstileToken(form)
      : (form.querySelector('input[name="cf-turnstile-response"]')?.value || '');

    if (turnstileWidget && !turnstileToken) {
      showJobError('Security check required: Please complete the Cloudflare Turnstile verification before submitting.');
      turnstileWidget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Generate unique Job Tracking Reference
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const refId = `JD-2026-${randomHex}`;

    const submitBtn = form.querySelector('#btn-submit-job');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>⚡ Submitting & Alerting Team...</span>';
    }

    // Prepare full specification summary
    let fullDetails = `[TASK: ${title}]\n\nDetails / Scope:\n${description}`;
    if (assetLinks) {
      fullDetails += `\n\nReference / Asset Links:\n${assetLinks}`;
    }

    // Dispatch via AnirjanNotifier (scoped to formElement so turnstile does not falsely block)
    try {
      if (window.AnirjanNotifier) {
        const res = await window.AnirjanNotifier.dispatch({
          formElement: form,
          turnstileToken: turnstileToken,
          formType: 'JOB_DONE_REQUEST',
          refId: refId,
          name: clientName,
          whatsapp: whatsapp,
          telegram: telegram,
          email: email,
          city: city,
          category: category,
          details: fullDetails,
          meta: {
            taskTitle: title,
            category: category,
            urgency: urgency,
            budget: budget,
            assetLinks: assetLinks,
            clientName: clientName,
            whatsapp: whatsapp,
            telegram: telegram,
            email: email
          }
        });

        if (res && (!res.success || res.duplicate || res.rateLimited)) {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
          }
          try {
            if (window.turnstile && typeof window.turnstile.reset === 'function' && turnstileWidget) {
              window.turnstile.reset(turnstileWidget);
            }
          } catch (e) {}
          showJobError(res.message || 'This task request has already been submitted. Duplicate blocked.');
          return;
        }
      }

      // Reset Turnstile on success for subsequent submissions
      try {
        if (window.turnstile && typeof window.turnstile.reset === 'function' && turnstileWidget) {
          window.turnstile.reset(turnstileWidget);
        }
      } catch (e) {}

      // Save locally in browser storage for user history
      try {
        const existing = JSON.parse(localStorage.getItem('anirjan_job_done_requests') || '[]');
        existing.unshift({
          refId,
          title,
          category,
          description,
          budget,
          clientName,
          whatsapp,
          telegram,
          email,
          submittedAt: new Date().toISOString()
        });
        localStorage.setItem('anirjan_job_done_requests', JSON.stringify(existing.slice(0, 20)));
      } catch (e) {
        console.warn('LocalStorage save notice:', e);
      }

      // Trigger Celebration Chime & Confetti
      playSuccessChime();
      triggerCosmicConfetti();

      // Transition to Success Card
      form.style.display = 'none';
      if (refCodeBadge) {
        refCodeBadge.textContent = refId;
      }

      // Configure direct WhatsApp & Telegram chat triggers
      const summaryMsg = `Hello Anirjan Team, I just submitted a Task on Anirjan Connect (Ref ID: ${refId}).\n\nTask: "${title}"`;
      if (waBtn) {
        waBtn.href = `https://wa.me/anirjan_collective?text=${encodeURIComponent(summaryMsg)}`;
      }
      if (tgBtn) {
        tgBtn.href = `https://t.me/anirjan_collective?text=${encodeURIComponent(summaryMsg)}`;
      }

      if (thankYouCard) {
        thankYouCard.style.display = 'block';
        thankYouCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (err) {
      console.error('[JobDone] Submit error:', err);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
      showJobError('A temporary connection error occurred. Please try submitting again.');
    }
  });

  function showJobError(msg) {
    if (formError) {
      formError.textContent = msg;
      formError.style.display = 'block';
      formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      alert(msg);
    }
  }

  // 1-Click Clipboard Copy for Reference Code
  window.copyJobRefCode = function () {
    const code = refCodeBadge?.textContent?.trim() || '';
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      const copyBtn = document.getElementById('job-copy-btn');
      if (copyBtn) {
        const orig = copyBtn.textContent;
        copyBtn.textContent = 'Copied! ✓';
        copyBtn.style.background = '#10b981';
        copyBtn.style.color = '#05070c';
        setTimeout(() => {
          copyBtn.textContent = orig;
          copyBtn.style.background = '';
          copyBtn.style.color = '';
        }, 2000);
      }
    }).catch(() => {
      alert(`Job Reference ID: ${code}`);
    });
  };

  // Reset Form
  window.resetJobDoneForm = function () {
    form.reset();
    updateSatisfactionMeter();
    form.style.display = 'block';
    if (thankYouCard) thankYouCard.style.display = 'none';
    const submitBtn = form.querySelector('#btn-submit-job');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>⚡ Submit Task • Let Team Coordinate</span>';
    }
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Past Tasks History Drawer / Modal
  window.openMyJobTasksModal = function () {
    let modal = document.getElementById('job-tasks-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'job-tasks-modal';
      modal.className = 'job-tasks-modal';
      modal.innerHTML = `
        <div class="job-tasks-modal-card">
          <div class="job-tasks-modal-header">
            <h3 style="font-family: 'Syne', sans-serif; font-size: 1.15rem; color: #ffffff; margin: 0;">📋 My Submitted Tasks</h3>
            <button type="button" onclick="window.closeMyJobTasksModal()" style="background: none; border: none; color: #94a3b8; font-size: 1.4rem; cursor: pointer;">&times;</button>
          </div>
          <div class="job-tasks-modal-body" id="job-tasks-modal-list"></div>
        </div>
      `;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) window.closeMyJobTasksModal();
      });
      document.body.appendChild(modal);
    }

    const list = modal.querySelector('#job-tasks-modal-list');
    const tasks = JSON.parse(localStorage.getItem('anirjan_job_done_requests') || '[]');

    if (tasks.length === 0) {
      list.innerHTML = `
        <div style="text-align: center; padding: 30px 10px; color: #94a3b8;">
          <p style="font-size: 1.8rem; margin-bottom: 8px;">📭</p>
          <p style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 4px;">No tasks submitted yet from this browser.</p>
          <p style="font-size: 0.78rem;">Submit your first task using the form to track it here anytime.</p>
        </div>
      `;
    } else {
      list.innerHTML = tasks.map(t => `
        <div class="job-past-task-item">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px;">
            <strong style="color: #6ee7b7; font-family: monospace; font-size: 0.85rem;">${t.refId}</strong>
            <span style="font-size: 0.7rem; color: #94a3b8;">${new Date(t.submittedAt).toLocaleDateString()}</span>
          </div>
          <div style="font-size: 0.92rem; font-weight: 700; color: #ffffff; margin-bottom: 4px;">${t.title}</div>
          <div style="font-size: 0.75rem; color: #cbd5e1; margin-bottom: 8px; line-height: 1.4;">${t.description.substring(0, 110)}...</div>
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; font-size: 0.72rem;">
            <span style="background: rgba(243, 194, 118, 0.15); color: #f3c276; padding: 2px 8px; border-radius: 6px;">${t.budget}</span>
            <a href="https://t.me/anirjan_collective" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; text-decoration: none; font-weight: 600;">Chat on Telegram &rarr;</a>
          </div>
        </div>
      `).join('');
    }

    modal.style.display = 'flex';
  };

  window.closeMyJobTasksModal = function () {
    const modal = document.getElementById('job-tasks-modal');
    if (modal) modal.style.display = 'none';
  };
}


