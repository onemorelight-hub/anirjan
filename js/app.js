/**
 * ANIRJAN APPLICATION CORE
 * Dynamic rendering, modals, filter interactions, toast notices, and smooth UX
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize Data Store
  await window.anirjanStore.load();

  // 2. Initialize UI Components
  renderGenesisRoadmap();
  renderProducts('all');
  setupNavScroll();
  setupMobileNav();
  setupModals();
  setupAudioControls();
  setupSmoothScroll();

  // 3. Scroll Reveal Animations (runs last so elements are in DOM)
  initScrollReveal();
});

/* --------------------------------------------------------------------------
   ICON HELPER (Clean inline SVGs for performance & beauty)
   -------------------------------------------------------------------------- */
const ICONS = {
  check: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
  water: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>`,
  smartphone: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`,
  earth: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
  lotus: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"></path><path d="M12 8c2.5-3.5 6-3.5 8 0-2 4-5 8-8 10"></path><path d="M12 8c-2.5-3.5-6-3.5-8 0 2 4 5 8 8 10"></path></svg>`,
  briefcase: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
  mapPin: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
  finance: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12M6 8h12M6 13h7M6 13a6 6 0 0 0 6 6l5 3"></path></svg>`
};

/* --------------------------------------------------------------------------
   RENDER PRODUCTS (Editorial Showcase Hierarchy)
   -------------------------------------------------------------------------- */
function renderProducts(category = 'all') {
  const container = document.getElementById('products-grid-container');
  if (!container) return;

  const products = window.anirjanStore.getProducts(category);

  if (category === 'all' && products.length >= 2) {
    const featured = products[0]; // FinDiary
    const supporting = products.slice(1);

    container.innerHTML = `
      <div class="products-editorial-layout">
        <!-- Featured Row: Hero Product (FinDiary) + Anirjan Pure -->
        <div class="product-featured-row">
          <!-- Main Hero Product Card -->
          <div class="product-card-featured reveal">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                <div class="product-icon-box" style="width: 54px; height: 54px; font-size: 1.6rem; color: var(--gold-primary); background: rgba(243,194,118,0.1); border-color: rgba(243,194,118,0.3);">
                  ${ICONS[featured.icon] || ICONS.finance}
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                  <span class="badge badge-gold">${featured.badge}</span>
                  <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Flagship Release</span>
                </div>
              </div>
              <div class="featured-label">✦ Core Ecosystem Launch</div>
              <h3 style="font-size: 1.85rem; margin-bottom: 8px;">${featured.name}</h3>
              <div class="product-tagline" style="font-size: 1.05rem; margin-bottom: 16px;">${featured.tagline}</div>
              <p class="product-desc" style="font-size: 1rem; line-height: 1.7; margin-bottom: 24px;">${featured.description}</p>
              <ul class="product-features-list" style="margin-bottom: 30px;">
                ${featured.features.map(f => `<li>${ICONS.check} <span style="font-size: 0.92rem;">${f}</span></li>`).join('')}
              </ul>
            </div>
            <div style="display: flex; gap: 14px; flex-wrap: wrap;">
              <a href="./rupeediary/" class="btn btn-primary btn-sm">
                <span>Explore RupeeDiary App</span>
                ${ICONS.arrowRight}
              </a>
              <a href="./rupeediary/privacy.html" class="btn btn-secondary btn-sm">
                <span>100% Privacy Promise</span>
              </a>
            </div>
          </div>

          <!-- Supporting First Card (Anirjan Pure) -->
          <div class="product-card reveal reveal-delay-1">
            <div>
              <div class="product-head">
                <div class="product-icon-box">
                  ${ICONS[supporting[0].icon] || ICONS.water}
                </div>
                <span class="badge ${supporting[0].category.includes('NGO') ? 'badge-emerald' : 'badge-gold'}">${supporting[0].badge}</span>
              </div>
              <h3>${supporting[0].name}</h3>
              <div class="product-tagline">${supporting[0].tagline}</div>
              <p class="product-desc">${supporting[0].description}</p>
              <ul class="product-features-list">
                ${supporting[0].features.map(f => `<li>${ICONS.check} <span>${f}</span></li>`).join('')}
              </ul>
            </div>
            <div>
              <button class="btn btn-secondary btn-sm" onclick="openProductModal('${supporting[0].id}')" style="width: 100%;">
                <span>View Flask Engineering</span>
                ${ICONS.arrowRight}
              </button>
            </div>
          </div>
        </div>

        <!-- Remaining Supporting Row -->
        <div class="product-supporting-row">
          ${supporting.slice(1).map((prod, idx) => `
            <div class="product-card reveal reveal-delay-${idx + 2}">
              <div>
                <div class="product-head">
                  <div class="product-icon-box">
                    ${ICONS[prod.icon] || ICONS.lotus}
                  </div>
                  <span class="badge ${prod.category.includes('NGO') ? 'badge-emerald' : 'badge-gold'}">${prod.badge}</span>
                </div>
                <h3>${prod.name}</h3>
                <div class="product-tagline">${prod.tagline}</div>
                <p class="product-desc">${prod.description}</p>
                <ul class="product-features-list">
                  ${prod.features.map(f => `<li>${ICONS.check} <span>${f}</span></li>`).join('')}
                </ul>
              </div>
              <div>
                <button class="btn btn-secondary btn-sm" onclick="openProductModal('${prod.id}')" style="width: 100%;">
                  <span>View Details & Objectives</span>
                  ${ICONS.arrowRight}
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else {
    // Filtered mode
    container.innerHTML = `
      <div class="product-grid">
        ${products.map(prod => `
          <div class="product-card reveal">
            <div>
              <div class="product-head">
                <div class="product-icon-box">
                  ${ICONS[prod.icon] || ICONS.lotus}
                </div>
                <span class="badge ${prod.category.includes('NGO') ? 'badge-emerald' : 'badge-gold'}">${prod.badge}</span>
              </div>
              <h3>${prod.name}</h3>
              <div class="product-tagline">${prod.tagline}</div>
              <p class="product-desc">${prod.description}</p>
              <ul class="product-features-list">
                ${prod.features.map(f => `<li>${ICONS.check} <span>${f}</span></li>`).join('')}
              </ul>
            </div>
            <div>
              <button class="btn btn-secondary btn-sm" onclick="openProductModal('${prod.id}')" style="width: 100%;">
                <span>View Details & Specifications</span>
                ${ICONS.arrowRight}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (window.initScrollReveal) initScrollReveal();
}





/* --------------------------------------------------------------------------
   RENDER GENESIS ROADMAP — Circular Ring Timeline
   -------------------------------------------------------------------------- */
function renderGenesisRoadmap() {
  const container = document.getElementById('genesis-roadmap-container');
  if (!container) return;

  // SVG ring math — circumference of circle r=44 = 2π*44 ≈ 276.46
  const R = 44;
  const CIRC = 2 * Math.PI * R;

  const goals = window.anirjanStore.getGenesisGoals();
  container.innerHTML = goals.map((goal, i) => {
    const dashOffset = CIRC - (goal.progress / 100) * CIRC;
    const badgeClass = goal.status.toLowerCase().includes('development') ? 'badge-cyan'
                     : goal.status.toLowerCase().includes('hiring')     ? 'badge-emerald'
                     : 'badge-gold';

    return `
      <div class="timeline-node reveal reveal-delay-${(i % 4) + 1}">
        <!-- Circular Progress Ring -->
        <div class="timeline-ring-wrap">
          <svg class="ring-svg" viewBox="0 0 104 104">
            <circle class="ring-track" cx="52" cy="52" r="${R}"/>
            <circle class="ring-fill"
              cx="52" cy="52" r="${R}"
              stroke-dasharray="${CIRC.toFixed(2)}"
              stroke-dashoffset="${CIRC.toFixed(2)}"
              data-target-offset="${dashOffset.toFixed(2)}"
            />
          </svg>
          <div class="ring-center">
            <div class="ring-percent">${goal.progress}%</div>
            <div class="ring-label">done</div>
          </div>
        </div>

        <!-- Timeline Card -->
        <div class="timeline-card-content">
          <div class="timeline-card-head">
            <span class="badge ${badgeClass}">${goal.status}</span>
            <span style="font-size: 0.78rem; color: var(--gold-light); font-weight: 700;">${goal.quarter}</span>
          </div>
          <h3>${goal.target}</h3>
          <p>${goal.description}</p>
        </div>
      </div>
    `;
  }).join('');

  // Animate rings when they scroll into view
  animateRingsOnReveal();
}

/* --------------------------------------------------------------------------
   CIRCULAR RING ANIMATION — triggers when element becomes visible
   -------------------------------------------------------------------------- */
function animateRingsOnReveal() {
  const rings = document.querySelectorAll('.ring-fill[data-target-offset]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.getAttribute('data-target-offset'));
        setTimeout(() => {
          el.style.strokeDashoffset = target;
          el.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)';
        }, 200);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.4 });
  rings.forEach(r => observer.observe(r));
}

/* --------------------------------------------------------------------------
   FILTER TABS HANDLERS
   -------------------------------------------------------------------------- */


/* --------------------------------------------------------------------------
   MODAL WINDOW CONTROLLERS
   -------------------------------------------------------------------------- */
function setupModals() {
  const modalBackdrop = document.getElementById('global-modal-backdrop');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  if (modalCloseBtn && modalBackdrop) {
    modalCloseBtn.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });
  }

  // Keyboard escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

function closeModal() {
  const modalBackdrop = document.getElementById('global-modal-backdrop');
  if (modalBackdrop) modalBackdrop.classList.remove('open');
}

window.openProductModal = function(id) {
  const prod = window.anirjanStore.getProducts('all').find(p => p.id === id);
  if (!prod) return;

  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');
  const modalBackdrop = document.getElementById('global-modal-backdrop');

  titleEl.innerText = prod.name;
  bodyEl.innerHTML = `
    <div style="margin-bottom: 16px;">
      <span class="badge badge-gold">${prod.badge}</span>
      <span style="margin-left: 10px; color: var(--gold-primary); font-weight: 600;">${prod.tagline}</span>
    </div>
    <p style="color: var(--text-secondary); line-height: 1.7; font-size: 1.05rem; margin-bottom: 24px;">
      ${prod.description}
    </p>
    <h4 style="margin-bottom: 14px; color: var(--text-primary);">Core Engineering & Value Pillars:</h4>
    <ul class="product-features-list" style="margin-bottom: 30px;">
      ${prod.features.map(f => `<li>${ICONS.check} <span><strong>${f}</strong></span></li>`).join('')}
    </ul>
    <div style="background: rgba(5,7,12,0.6); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 18px; margin-bottom: 24px;">
      <div style="font-size: 0.85rem; color: var(--gold-primary); font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">The Anirjan Quality Promise</div>
      <div style="font-size: 0.9rem; color: var(--text-secondary);">Every release undergoes exhaustive testing for human health, digital calmness, zero planned obsolescence, and ecological stewardship.</div>
    </div>
    <div style="display: flex; gap: 12px;">
      ${prod.id.includes('rupeediary') || prod.id.includes('findiary') ? `
        <a href="./rupeediary/" class="btn btn-primary" style="flex: 1; text-align: center; text-decoration: none;">
          Launch RupeeDiary Product Page →
        </a>
      ` : `
        <button class="btn btn-primary" style="flex: 1;" onclick="showToast('Thank you! Notification registered for ${prod.name}'); closeModal();">
          Get Early Access / Order
        </button>
      `}
    </div>
  `;

  modalBackdrop.classList.add('open');
};

window.openJobApplyModal = function(id) {
  const job = window.anirjanStore.getJob(id);
  if (!job) return;

  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');
  const modalBackdrop = document.getElementById('global-modal-backdrop');

  titleEl.innerText = `Apply: ${job.title}`;
  bodyEl.innerHTML = `
    <div style="margin-bottom: 20px; font-size: 0.9rem; color: var(--text-muted);">
      <span class="badge badge-cyan">${job.department}</span> • ${job.location} • ${job.salary}
    </div>
    <form id="job-application-form" onsubmit="handleJobSubmit(event, '${job.title}')">
      <div class="form-group">
        <label class="form-label">Your Full Name *</label>
        <input type="text" class="form-control" required placeholder="e.g. Maya Chen">
      </div>
      <div class="form-group">
        <label class="form-label">Email Address *</label>
        <input type="email" class="form-control" required placeholder="maya@domain.com">
      </div>
      <div class="form-group">
        <label class="form-label">Portfolio, GitHub or LinkedIn URL *</label>
        <input type="url" class="form-control" required placeholder="https://linkedin.com/in/...">
      </div>
      <div class="form-group">
        <label class="form-label">Why do you want to build with Anirjan? (Not Without People) *</label>
        <textarea class="form-control" required rows="3" placeholder="Tell us how you think about solving real-life mess and helping people..."></textarea>
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
        Submit Application
      </button>
    </form>
  `;

  modalBackdrop.classList.add('open');
};

window.handleJobSubmit = function(e, jobTitle) {
  e.preventDefault();
  closeModal();
  showToast(`Application submitted for "${jobTitle}". Welcome to the Anirjan collective!`);
  if (window.anirjanAudio) window.anirjanAudio.playChime();
};

/* --------------------------------------------------------------------------
   NAV & MOBILE MENU
   -------------------------------------------------------------------------- */
function setupNavScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

function setupMobileNav() {
  const toggleBtn = document.querySelector('.mobile-toggle-btn');
  const navMenu = document.querySelector('.nav-menu');

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    });
  }
}

/* --------------------------------------------------------------------------
   AMBIENT AUDIO & CANVAS HUD
   -------------------------------------------------------------------------- */
function setupAudioControls() {
  const audioBtn = document.getElementById('ambient-audio-toggle');
  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      const active = window.anirjanAudio.toggle();
      audioBtn.classList.toggle('active', active);
      const textSpan = audioBtn.querySelector('span');
      if (textSpan) {
        textSpan.innerText = active ? 'Sound: Zen 432Hz' : 'Calm Soundscape';
      }
      showToast(active ? '432Hz Harmonic Soundscape active.' : 'Soundscape muted.');
    });
  }

  const canvasPauseBtn = document.getElementById('canvas-pause-toggle');
  if (canvasPauseBtn && window.anirjanCanvas) {
    canvasPauseBtn.addEventListener('click', () => {
      const paused = window.anirjanCanvas.togglePause();
      canvasPauseBtn.classList.toggle('active', paused);
      const textSpan = canvasPauseBtn.querySelector('span');
      if (textSpan) {
        textSpan.innerText = paused ? 'Cosmos Paused' : 'Cosmos Orbiting';
      }
    });
  }

  const constellationBtn = document.getElementById('canvas-constellation-toggle');
  if (constellationBtn && window.anirjanCanvas) {
    constellationBtn.addEventListener('click', () => {
      const active = window.anirjanCanvas.toggleConstellations();
      constellationBtn.classList.toggle('active', active);
      showToast(active ? 'Sacred Constellation Aura active' : 'Constellation aura hidden');
    });
  }
}


/* --------------------------------------------------------------------------
   TOAST NOTIFICATION
   -------------------------------------------------------------------------- */
function showToast(message) {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span>✨</span> <span>${message}</span>`;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}
window.showToast = showToast;

/* --------------------------------------------------------------------------
   SMOOTH SCROLL
   -------------------------------------------------------------------------- */
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}


/* --------------------------------------------------------------------------
   SCROLL REVEAL — Intersection Observer
   Activates .reveal elements with .is-visible as they enter viewport
   -------------------------------------------------------------------------- */
let _scrollObserver = null;
function initScrollReveal() {
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  if (_scrollObserver) {
    _scrollObserver.disconnect();
  }

  _scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -20px 0px'
  });

  revealEls.forEach(el => {
    // Check if element is already in viewport
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom >= 0) {
      el.classList.add('is-visible');
    }
    _scrollObserver.observe(el);
  });
}
window.initScrollReveal = initScrollReveal;

/* --------------------------------------------------------------------------
   JOURNAL HERO CARD MODAL HANDLER
   -------------------------------------------------------------------------- */
window.openJournalModal = function(articleId) {
  // Try to find in data store, or use a default
  const articles = window.anirjanStore ? window.anirjanStore.getJournal('all') : [];
  let art = articles.find(a => a.id === articleId);

  // fallback for the week01 hardcoded featured article
  if (!art && articleId === 'journal-week01') {
    art = articles[0];
  }

  if (art) {
    openArticleModal(art.id);
  } else {
    showToast('Full essay coming soon — Day 1 of building in public!');
  }
};

