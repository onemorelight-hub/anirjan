/**
 * ANIRJAN SOUL COMPANION (Smart AI Guide & Brand Navigator)
 * 
 * An intelligent, serene floating guide that helps users:
 * 1. Understand the philosophy of Anirjan ("Not Without People")
 * 2. Explore FinDiary features and offline privacy architecture
 * 3. Discover Anirjan Pure bottle zero-microplastic engineering
 * 4. Get personalized Weekly Thought essay recommendations based on user's current mood
 * 5. Direct apply to Founding Career roles & volunteer for Project Nirmal
 */

class AnirjanSoulCompanion {
  constructor() {
    this.isOpen = false;
    this.knowledgeBase = {
      philosophy: {
        keywords: ['anirjan', 'meaning', 'not without people', 'why', 'motto', 'mission', 'mess', 'clean'],
        reply: "<strong>Anirjan</strong> means <em>'Not Without People'</em>. Our motto is: <blockquote>The world is filled with complete mess. Let's clean the mess — and build a better, safer world.</blockquote> We believe technology, physical tools, and community work must serve human dignity rather than consume it."
      },
      findiary: {
        keywords: ['findiary', 'rupeediary', 'finance', 'money', 'budget', 'expense', 'app', 'flutter'],
        reply: "<strong>FinDiary (RupeeDiary)</strong> is our mindful personal financial diary built with Flutter & local SQLite encryption. It gives you complete financial clarity with <strong>zero loan spam, zero ads, and zero cloud tracking</strong>. Your financial data stays 100% on your device."
      },
      bottle: {
        keywords: ['bottle', 'water', 'pure', 'microplastic', 'titanium', 'flask', 'hydration'],
        reply: "<strong>Anirjan Pure Bottle</strong> is engineered with medical-grade titanium-reinforced 316 stainless steel, double-wall copper vacuum insulation, and a natural cork-ceramic mechanical stopper. It eliminates chemical leaching and microplastics completely."
      },
      ngo: {
        keywords: ['ngo', 'nirmal', 'cleanup', 'river', 'waterway', 'volunteer', 'community', 'plastic'],
        reply: "<strong>Project Nirmal</strong> is our grassroots environmental movement cleaning neglected canal networks and riverbanks. Our pilot target is diverting 5 tons of waste into circular recycling with a 100% transparent public ledger."
      },
      careers: {
        keywords: ['job', 'career', 'hiring', 'work', 'apply', 'flutter engineer', 'designer', 'role'],
        reply: "We are currently hiring for <strong>Founding Roles</strong>: Lead Flutter Engineer for FinDiary, Industrial Product Designer for hardware, and NGO Field Coordinators. You can apply directly through our Careers portal below!"
      },
      weekly: {
        keywords: ['weekly', 'journal', 'essay', 'thought', 'sunday', 'letter', 'read'],
        reply: "We publish a new philosophical essay every Sunday documenting our progress, design ethics, and blueprints in public. Check out <em>Week 01: Day 1 at Anirjan</em> in our Weekly Journal section!"
      }
    };

    this.init();
  }

  init() {
    this.injectCompanionUI();
    this.attachEvents();
  }

  injectCompanionUI() {
    const companionHTML = `
      <div class="soul-companion-wrapper" id="soul-companion-wrap">
        <!-- Floating Trigger Button -->
        <button class="companion-trigger-btn" id="companion-trigger" aria-label="Open Anirjan Smart Guide">
          <div class="companion-orb">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"></path>
              <path d="M12 6v6l4 2"></path>
            </svg>
          </div>
          <span class="companion-btn-label">Anirjan Guide</span>
          <span class="companion-pulse-ring"></span>
        </button>

        <!-- Interactive Chat & Assistant Modal Drawer -->
        <div class="companion-drawer" id="companion-drawer">
          <div class="companion-drawer-header">
            <div class="companion-guide-avatar">
              <span>✦</span>
            </div>
            <div>
              <div class="companion-guide-name">Anirjan Soul Guide</div>
              <div class="companion-guide-status">Calm Intelligence • Day 1 Guide</div>
            </div>
            <button class="companion-close-btn" id="companion-close" aria-label="Close Guide">✕</button>
          </div>

          <div class="companion-chat-body" id="companion-chat-messages">
            <div class="companion-msg companion-msg-bot">
              <p>Welcome. I am your calm guide to the <strong>Anirjan</strong> universe. How can I assist your journey today?</p>
            </div>
            <div class="companion-chips-grid" id="companion-quick-chips">
              <button class="quick-chip" onclick="window.anirjanGuide.askQuestion('What does Anirjan mean?')">🌿 Philosophy & Motto</button>
              <button class="quick-chip" onclick="window.anirjanGuide.askQuestion('Tell me about FinDiary app')">📱 FinDiary (RupeeDiary)</button>
              <button class="quick-chip" onclick="window.anirjanGuide.askQuestion('How does the bottle stop microplastics?')">💧 Anirjan Pure Bottle</button>
              <button class="quick-chip" onclick="window.anirjanGuide.askQuestion('How can I volunteer or apply for jobs?')">🤝 Volunteer & Careers</button>
              <button class="quick-chip" onclick="window.anirjanGuide.recommendMoodEssay()">✨ Recommend a Thought</button>
            </div>
          </div>

          <form class="companion-input-form" id="companion-form" onsubmit="window.anirjanGuide.handleUserSubmit(event)">
            <input type="text" id="companion-input" placeholder="Ask anything about Anirjan, apps, or mission..." autocomplete="off">
            <button type="submit" aria-label="Send query">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </form>
        </div>
      </div>
    `;

    const el = document.createElement('div');
    el.innerHTML = companionHTML;
    document.body.appendChild(el.firstElementChild);
  }

  attachEvents() {
    const trigger = document.getElementById('companion-trigger');
    const closeBtn = document.getElementById('companion-close');

    if (trigger) {
      trigger.addEventListener('click', () => this.toggleDrawer());
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.toggleDrawer(false));
    }
  }

  toggleDrawer(forceState = null) {
    const drawer = document.getElementById('companion-drawer');
    const trigger = document.getElementById('companion-trigger');
    this.isOpen = forceState !== null ? forceState : !this.isOpen;

    if (drawer && trigger) {
      drawer.classList.toggle('open', this.isOpen);
      trigger.classList.toggle('active', this.isOpen);
      if (this.isOpen) {
        document.getElementById('companion-input')?.focus();
      }
    }
  }

  handleUserSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('companion-input');
    if (!input || !input.value.trim()) return;

    const query = input.value.trim();
    this.askQuestion(query);
    input.value = '';
  }

  askQuestion(query) {
    this.addMessage(query, 'user');
    
    // Process query through smart knowledge matching
    setTimeout(() => {
      const response = this.matchResponse(query.toLowerCase());
      this.addMessage(response, 'bot');
      if (window.anirjanAudio) window.anirjanAudio.playChime();
    }, 400);
  }

  matchResponse(q) {
    if (q.includes('mood') || q.includes('feel') || q.includes('recommend') || q.includes('peace')) {
      return "If you are feeling overwhelmed by modern noise, I recommend reading our Week 01 essay: <strong>'Day 1 at Anirjan: Untangling Modern Chaos Through Honest Action'</strong>. It explores how simplicity restores human peace.";
    }

    for (let key in this.knowledgeBase) {
      const item = this.knowledgeBase[key];
      if (item.keywords.some(k => q.includes(k))) {
        return item.reply;
      }
    }

    return "Anirjan is a brand dedicated to <em>Live Better Life</em>, <em>Solve Social Friction</em>, <em>Make People Safer</em>, and <em>Create a Better World</em>. Explore our products above, read our weekly essays, or join our founding mission!";
  }

  recommendMoodEssay() {
    this.addMessage("Recommend a weekly thought for peace of mind", 'user');
    setTimeout(() => {
      this.addMessage("For mindful clarity today, explore <strong>Week 02: Why We Are Building FinDiary with Flutter & Local-First Encryption</strong> or <strong>Week 01: The Day 1 Manifesto</strong> in our Weekly Journal section!", 'bot');
    }, 350);
  }

  addMessage(content, sender = 'bot') {
    const chatBody = document.getElementById('companion-chat-messages');
    if (!chatBody) return;

    const msgEl = document.createElement('div');
    msgEl.className = `companion-msg companion-msg-${sender}`;
    msgEl.innerHTML = `<p>${content}</p>`;
    chatBody.appendChild(msgEl);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.anirjanGuide = new AnirjanSoulCompanion();
});
