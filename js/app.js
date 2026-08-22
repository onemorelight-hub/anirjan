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
  renderJournal('all');
  renderCareers('all');
  setupNavScroll();
  setupMobileNav();
  setupFilterTabs();
  setupModals();
  setupAudioControls();
  setupNewsletter();
  setupSmoothScroll();
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
   RENDER PRODUCTS
   -------------------------------------------------------------------------- */
function renderProducts(category = 'all') {
  const container = document.getElementById('products-grid-container');
  if (!container) return;

  const products = window.anirjanStore.getProducts(category);
  container.innerHTML = products.map(prod => `
    <div class="product-card">
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
        <button class="btn btn-secondary btn-sm w-full" onclick="openProductModal('${prod.id}')" style="width: 100%;">
          <span>View Details & Specifications</span>
          ${ICONS.arrowRight}
        </button>
      </div>
    </div>
  `).join('');
}

/* --------------------------------------------------------------------------
   RENDER JOURNAL / WEEKLY ESSAYS
   -------------------------------------------------------------------------- */
function renderJournal(category = 'all') {
  const container = document.getElementById('journal-grid-container');
  if (!container) return;

  const articles = window.anirjanStore.getJournal(category);
  container.innerHTML = articles.map(art => `
    <div class="journal-card" onclick="openArticleModal('${art.id}')">
      <div>
        <div class="journal-meta">
          <span class="badge badge-gold">${art.weekNumber}</span>
          <span>${art.readTime}</span>
        </div>
        <h3>${art.title}</h3>
        <p class="journal-snippet">${art.summary}</p>
      </div>
      <div class="journal-footer">
        <div class="author-info">
          <div class="author-avatar">${art.author.name.charAt(0)}</div>
          <div>
            <div class="author-name">${art.author.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${art.date}</div>
          </div>
        </div>
        <span class="read-more-link">
          <span>Read</span>
          ${ICONS.arrowRight}
        </span>
      </div>
    </div>
  `).join('');
}

/* --------------------------------------------------------------------------
   RENDER CAREERS / JOBS
   -------------------------------------------------------------------------- */
function renderCareers(dept = 'all') {
  const container = document.getElementById('careers-grid-container');
  if (!container) return;

  const jobs = window.anirjanStore.getCareers(dept);
  container.innerHTML = jobs.map(job => `
    <div class="career-card">
      <div>
        <div class="career-header">
          <span class="badge badge-cyan">${job.department}</span>
          <span style="font-size: 0.8rem; color: var(--gold-primary); font-weight: 600;">${job.salary}</span>
        </div>
        <h3>${job.title}</h3>
        <div class="career-meta">
          <span style="display: flex; align-items: center; gap: 4px;">${ICONS.mapPin} ${job.location}</span>
          <span style="display: flex; align-items: center; gap: 4px;">${ICONS.briefcase} ${job.type}</span>
        </div>
        <p class="career-desc">${job.description}</p>
        <ul class="requirements-mini">
          ${job.requirements.map(req => `<li>${req}</li>`).join('')}
        </ul>
      </div>
      <div>
        <button class="btn btn-primary btn-sm" onclick="openJobApplyModal('${job.id}')" style="width: 100%;">
          <span>Apply for this Role</span>
          ${ICONS.arrowRight}
        </button>
      </div>
    </div>
  `).join('');
}

/* --------------------------------------------------------------------------
   RENDER GENESIS ROADMAP & COMMITMENTS
   -------------------------------------------------------------------------- */
function renderGenesisRoadmap() {
  const container = document.getElementById('genesis-roadmap-container');
  if (!container) return;

  const goals = window.anirjanStore.getGenesisGoals();
  container.innerHTML = goals.map(goal => `
    <div class="roadmap-card">
      <div>
        <div class="roadmap-card-head">
          <span class="badge ${goal.status.includes('Development') ? 'badge-cyan' : 'badge-gold'}">${goal.status}</span>
          <span style="font-size: 0.78rem; color: var(--gold-light); font-weight: 700;">${goal.quarter}</span>
        </div>
        <h3>${goal.target}</h3>
        <p class="roadmap-desc">${goal.description}</p>
      </div>
      <div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width: ${goal.progress}%;"></div>
        </div>
        <div class="progress-meta">
          <span>Target Progress</span>
          <span>${goal.progress}%</span>
        </div>
      </div>
    </div>
  `).join('');
}

/* --------------------------------------------------------------------------
   FILTER TABS HANDLERS
   -------------------------------------------------------------------------- */
function setupFilterTabs() {
  // Journal Tabs
  const journalTabs = document.querySelectorAll('.journal-tab');
  journalTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      journalTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderJournal(tab.dataset.category);
    });
  });

  // Career Tabs
  const careerTabs = document.querySelectorAll('.career-tab');
  careerTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      careerTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderCareers(tab.dataset.dept);
    });
  });
}

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

// Global window exposure for inline onclick handlers
window.openArticleModal = function(id) {
  const art = window.anirjanStore.getArticle(id);
  if (!art) return;

  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');
  const modalBackdrop = document.getElementById('global-modal-backdrop');

  titleEl.innerText = art.title;
  bodyEl.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px; font-size: 0.85rem; color: var(--text-muted);">
      <span class="badge badge-gold">${art.weekNumber}</span>
      <span>${art.category}</span>
      <span>•</span>
      <span>${art.date}</span>
      <span>•</span>
      <span>${art.readTime}</span>
    </div>
    <div style="font-size: 1.15rem; color: var(--gold-light); font-style: italic; margin-bottom: 24px; line-height: 1.6; border-left: 3px solid var(--gold-primary); padding-left: 16px;">
      "${art.summary}"
    </div>
    <div style="color: var(--text-secondary); line-height: 1.8; font-size: 1.05rem; white-space: pre-line; margin-bottom: 32px;">
      ${art.content}
    </div>
    <div style="border-top: 1px solid var(--border-subtle); padding-top: 20px; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <div style="font-weight: 700; color: var(--text-primary);">${art.author.name}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">${art.author.role}</div>
      </div>
      <button class="btn btn-outline-gold btn-sm" onclick="showToast('Article link copied to clipboard!'); closeModal();">
        Share Thought
      </button>
    </div>
  `;

  modalBackdrop.classList.add('open');
};

window.openProductModal = function(id) {
  const prod = window.anirjanStore.products.find(p => p.id === id);
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
      <button class="btn btn-primary" style="flex: 1;" onclick="showToast('Thank you! Notification registered for ${prod.name}'); closeModal();">
        Get Early Access / Order
      </button>
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
   NEWSLETTER FORM
   -------------------------------------------------------------------------- */
function setupNewsletter() {
  const form = document.getElementById('newsletter-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (input && input.value) {
        showToast(`Subscribed! You will receive the weekly Sunday thought piece.`);
        input.value = '';
        if (window.anirjanAudio) window.anirjanAudio.playChime();
      }
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
   INTERACTIVE SIMULATORS (FinDiary Demo & Plastic Calculator)
   -------------------------------------------------------------------------- */
window.handleDemoExpense = function(e) {
  e.preventDefault();
  const input = document.getElementById('demo-expense-text');
  const result = document.getElementById('demo-expense-result');
  if (!input || !result) return;

  const val = input.value;
  result.style.display = 'block';
  result.innerHTML = `✓ Encrypted & Stored Locally on device: <strong>"${val}"</strong>. Zero Ads • Zero Cloud Snooping.`;
  showToast('FinDiary local entry simulation recorded!');
  if (window.anirjanAudio) window.anirjanAudio.playChime();
};

window.updatePlasticCalculator = function(val) {
  const countLabel = document.getElementById('calc-bottle-count');
  const savedLabel = document.getElementById('calc-bottles-saved');
  const nanoLabel = document.getElementById('calc-nanoplastics-saved');

  if (countLabel) countLabel.innerText = `${val} Bottle${val > 1 ? 's' : ''}`;
  const annualSaved = val * 365;
  if (savedLabel) savedLabel.innerText = annualSaved.toLocaleString();
  const nanoSaved = (val * 365 * 2400).toLocaleString();
  if (nanoLabel) nanoLabel.innerText = `${(val * 0.9).toFixed(1)}M`;
};
