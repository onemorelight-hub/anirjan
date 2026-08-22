/**
 * ANIRJAN DATA STORE
 * Unified store for Weekly Journal, Products Ecosystem, Genesis Roadmap, and Careers
 * Includes embedded initial state for instant offline/static load + dynamic JSON fetch
 */

const ANIRJAN_DEFAULT_DATA = {
  brand: {
    name: "Anirjan",
    meaning: "Not Without People",
    motto: "The world is filled with complete mess. Let's clean the mess — and build a better, safer world.",
    pillars: [
      "Live Better Life",
      "Solve Social Friction",
      "Make People Safer",
      "Create A Better World"
    ],
    stage: "Genesis Phase • Day 1",
    mission: "Anirjan is built on the belief that human progress cannot happen in isolation. We engineer mindful software, sustainable physical products, and community-driven NGO initiatives to bring clarity, peace, and tangible solutions to real-world chaos.",
    genesisLetter: {
      title: "A Note from Day 1: Why We Are Building in Public",
      quote: "We are just getting started. No inflated corporate vanity, no fake metrics—just honest craftsmanship, radical simplicity, and deep commitment to people.",
      body: "The world around us feels increasingly cluttered: predatory algorithms stealing human attention, toxic plastics polluting our bodies and waterways, and economic systems that treat individuals as transaction data. Anirjan—meaning 'Not Without People'—is our response. We are a small, focused collective building everyday digital tools, sustainable physical essentials, and grassroots environmental actions from the ground up. Every week, we will document our progress, our challenges, and our blueprints right here in the open."
    }
  },
  genesisGoals: [
    {
      id: "goal-1",
      target: "FinDiary v1.0 Launch",
      category: "Software",
      status: "In Active Development",
      progress: 65,
      description: "Release our Flutter-based daily financial diary with 100% offline encryption, zero loan spam, and zero ads.",
      quarter: "Q4 2026"
    },
    {
      id: "goal-2",
      target: "Anirjan Pure First 500 Flasks",
      category: "Physical Products",
      status: "R&D & Material Testing",
      progress: 35,
      description: "Finalize titanium-316 vacuum tooling and cork-ceramic stoppers for our pilot zero-microplastic hydration batch.",
      quarter: "Q1 2027"
    },
    {
      id: "goal-3",
      target: "Project Nirmal Pilot Cleanup",
      category: "NGO & Environment",
      status: "Volunteer Drive Open",
      progress: 40,
      description: "Mobilize 100+ local volunteers to divert our first 5 tons of non-biodegradable waste from canal waterways.",
      quarter: "Q4 2026"
    },
    {
      id: "goal-4",
      target: "Create First 10 Ethical Jobs",
      category: "Careers & Livelihood",
      status: "Hiring Now",
      progress: 20,
      description: "Bring on founding engineers, industrial designers, and NGO coordinators with fair compensation and purpose.",
      quarter: "2026 - 2027"
    }
  ],
  journal: [
    {
      id: "wk-01-genesis-manifesto",
      weekNumber: "Week 01, Genesis",
      title: "Day 1 at Anirjan: Untangling the Modern Chaos Through Honest Action",
      category: "Philosophy",
      readTime: "4 min read",
      date: "Aug 22, 2026",
      author: {
        name: "Anirjan Founding Collective",
        role: "Builders & Organizers"
      },
      summary: "Why we named this brand Anirjan ('Not Without People') and why we are committing to build every app, product, and NGO initiative in complete public transparency.",
      content: "Today marks the first official step of Anirjan. We are not launching with manufactured hype or artificial claims. We are starting with an honest observation: the world has become a chaotic, noisy place.\n\nFrom software that monetizes anxiety to single-use plastics choking our rivers, human well-being is constantly compromised in the name of quick profit. Anirjan is our lifelong commitment to reverse this friction. We are building three core pillars:\n\n1. Mindful Software: Starting with FinDiary (RupeeDiary), an offline-first personal financial sanctuary that eliminates loan spam.\n2. Sustainable Hardware: Engineering our titanium-fused thermal bottle with zero microplastics.\n3. Grassroots NGO Action: Project Nirmal, tackling waterway pollution on the ground.\n\nEvery week on Sunday, we will share what we built, what broke, and what we learned. Thank you for walking this path with us from Day 1.",
      featured: true,
      tags: ["Day 1", "Manifesto", "Philosophy", "Transparency"]
    },
    {
      id: "wk-02-why-findiary-flutter",
      weekNumber: "Week 02, Design",
      title: "Why We Are Building FinDiary with Flutter & Local-First Encryption",
      category: "Software",
      readTime: "5 min read",
      date: "Aug 22, 2026",
      author: {
        name: "FinDiary Engineering Lead",
        role: "Software Architecture"
      },
      summary: "Why personal finance apps must never sell user data or push high-interest debt, and how we architected RupeeDiary with Flutter BLoC and local SQLite.",
      content: "When we looked at the existing landscape of budgeting apps, almost every single one had become a lead-generation funnel for personal loans and predatory credit cards. Your private spending data was being tracked, profiled, and monetized.\n\nWith FinDiary (RupeeDiary), our architectural principle is non-negotiable: Local-First. Your income, expenses, and recurring bills live encrypted on your own device. Zero cloud snooping, zero ads, zero synthetic friction. We are building this for people who simply want calm financial clarity.",
      featured: false,
      tags: ["FinDiary", "Flutter", "Privacy", "Ethics"]
    },
    {
      id: "wk-03-zero-microplastics-flask",
      weekNumber: "Week 03, Engineering",
      title: "The Chemistry of Clean Water: Designing the Anirjan Pure Vessel",
      category: "Physical Products",
      readTime: "6 min read",
      date: "Aug 22, 2026",
      author: {
        name: "Hardware Materials Lab",
        role: "Industrial R&D"
      },
      summary: "Recent studies show standard water bottle liners shed millions of nanoplastic particles. Here is how we are prototyping a lifetime vessel using inert titanium-steel and natural ceramic stoppers.",
      content: "Hydration should heal the human body, not contaminate it. Most commercial vacuum bottles use silicone sealants that degrade under heat or chemical epoxy internal linings. We are currently prototyping our first 500-unit pilot run using medical-grade 316 titanium stainless steel and natural cork-ceramic mechanical seals. We will share the third-party lab assay reports publicly once testing is complete.",
      featured: false,
      tags: ["Hardware", "Sustainability", "Health", "Zero-Plastic"]
    },
    {
      id: "wk-04-project-nirmal-groundwork",
      weekNumber: "Week 04, Fieldwork",
      title: "Project Nirmal: Organizing Our First 100-Volunteer Waterway Drive",
      category: "NGO & Impact",
      readTime: "5 min read",
      date: "Aug 22, 2026",
      author: {
        name: "Community Coordinator",
        role: "Project Nirmal Lead"
      },
      summary: "How we are setting up our first canal sorting hub and inviting local youth and neighborhood leaders to take ownership of local water health.",
      content: "Environmental action begins in our own neighborhoods. For Project Nirmal's pilot campaign, we have mapped a 3-kilometer canal stretch that has accumulated plastic runoff. Rather than waiting for complex bureaucratic cycles, we are pooling equipment, protective gear, and local sorting tables to divert waste into certified circular recyclers. We are inviting everyone in the area to join our founding weekend drive.",
      featured: false,
      tags: ["NGO", "Grassroots", "Environment", "Community"]
    }
  ],
  "products": [
    {
      "id": "findiary-app",
      "name": "FinDiary (RupeeDiary)",
      "category": "Mobile Application",
      "badge": "In Active Development",
      "tagline": "Calm, Private Daily Financial Journal & Smart Ledger",
      "description": "An intelligent personal finance diary and expense companion built with Flutter and offline-first encryption. Track daily spends, recurring subscriptions, and financial health with zero loan spam, zero ads, and total data sovereignty.",
      "features": [
        "Daily Rupee & Multi-Currency Diary",
        "Smart Analytics & Private Financial Assistant",
        "Recurring Bills & Subscription Sentinel",
        "100% Private, Local-First & Zero Ads"
      ],
      "status": "In Development (Flutter)",
      "icon": "finance"
    },
    {
      "id": "anirjan-pure-bottle",
      "name": "Anirjan Pure Bottle",
      "category": "Physical Product",
      "badge": "R&D & Prototyping",
      "tagline": "The Zero-Microplastic Thermal Hydration Flask",
      "description": "Currently in materials testing: engineered with medical-grade titanium-reinforced 316 stainless steel, double-wall copper vacuum insulation, and a leakproof ceramic-cork stopper. Designed to eliminate chemical leaching forever.",
      "features": [
        "Zero Chemical Leaching (Titanium 316)",
        "36h Cold / 24h Hot Thermal Vacuum",
        "Ceramic & Natural Cork Seal",
        "100% Circular Recyclable"
      ],
      "status": "Pilot Testing",
      "icon": "water"
    },
    {
      "id": "project-nirmal-ngo",
      "name": "Project Nirmal",
      "category": "NGO & Social Welfare",
      "badge": "Genesis Campaign",
      "tagline": "Restoring Waterways & Clean Living Corridors",
      "description": "Grassroots ecological action cleaning polluted urban riverbanks, deploying bio-filters, and running sustainable waste stewardship programs with local youth and community champions.",
      "features": [
        "Target: 5 Tons Diverted in Pilot Run",
        "100% Open Public Ledger",
        "Community Youth Stewardship",
        "Zero Bureaucratic Overhead"
      ],
      "status": "Volunteer Drive Open",
      "icon": "earth"
    },
    {
      "id": "anirjan-flow-app",
      "name": "Anirjan Flow",
      "category": "Mobile Application",
      "badge": "Design Concept",
      "tagline": "Calm Digital Space & Mindful Daily Task Mastery",
      "description": "A quiet task & habit orchestrator designed without notification anxiety, algorithmic urgency, or dark patterns.",
      "features": [
        "No Ads or Artificial Urgency",
        "Offline-First SQLite Sync",
        "Biometric Privacy",
        "Ambient Zen Modes"
      ],
      "status": "In Architecture",
      "icon": "smartphone"
    }
  ],
  "careers": [
    {
      "id": "flutter-fintech-engineer",
      "title": "Lead Flutter Engineer (FinDiary / RupeeDiary)",
      "department": "Software Engineering",
      "type": "Founding Role • Remote",
      "location": "Global / Remote",
      "salary": "Competitive + Founding Equity",
      "description": "Help lead development on FinDiary (RupeeDiary), crafting smooth Flutter UI, BLoC architecture, offline SQLite synchronization, and private financial intelligence.",
      "requirements": [
        "Strong experience with Flutter/Dart, Flutter BLoC, and Local Persistence (SQLite / Drift)",
        "Obsession with 60fps mobile fluidity and privacy-preserving local storage",
        "Deep alignment with Anirjan's motto: 'Not Without People'"
      ]
    },
    {
      "id": "sustainable-industrial-designer",
      "title": "Industrial Designer (Physical Products Lab)",
      "department": "Product & Engineering",
      "type": "Founding Role • Hybrid / Studio",
      "location": "Hybrid / Studio",
      "salary": "Competitive + Founding Stake",
      "description": "Help design and prototype our zero-microplastic thermal hydration line and future sustainable life essentials.",
      "requirements": [
        "Experience in CAD, DFM, and sustainable materials (inert titanium, stainless steel, ceramic, natural cork)",
        "Commitment to zero-plastic and cradle-to-cradle lifecycle design",
        "Portfolio showcasing minimalist, functional elegance"
      ]
    },
    {
      "id": "social-impact-field-director",
      "title": "Community & NGO Field Coordinator (Project Nirmal)",
      "department": "Community & NGO",
      "type": "Founding Role • Field / On-Site",
      "location": "Field Hubs",
      "salary": "Fair Mission Compensation",
      "description": "Lead and organize our pilot canal cleanups, volunteer cohorts, and local community environmental partnerships.",
      "requirements": [
        "Experience leading grassroots community, environmental, or youth outreach programs",
        "High empathy, grounded leadership, and logistical clarity",
        "Commitment to absolute transparency and public accountability"
      ]
    },
    {
      "id": "editorial-thought-fellow",
      "title": "Weekly Essayist & Philosophical Writer",
      "department": "Media & Philosophy",
      "type": "Part-Time / Contract",
      "location": "Remote",
      "salary": "Per Essay / Retainer",
      "description": "Collaborate with the collective to craft our weekly public essays on mindfulness, technology ethics, and purposeful living.",
      "requirements": [
        "Lyrical clarity of thought and honest, unpretentious writing voice",
        "Passion for distilling real-life engineering and human stories into soothing prose",
        "Commitment to building in public without corporate buzzwords"
      ]
    }
  ]
};

class AnirjanDataStore {
  constructor() {
    this.data = ANIRJAN_DEFAULT_DATA;
    this.loaded = false;
  }

  async load() {
    try {
      const response = await fetch('./data/brand-data.json');
      if (response.ok) {
        this.data = await response.json();
      }
    } catch (e) {
      console.info('Loaded Anirjan embedded data store.');
    }
    this.loaded = true;
    return this.data;
  }

  getGenesisGoals() {
    return this.data.genesisGoals || [];
  }

  getGenesisLetter() {
    return this.data.brand.genesisLetter;
  }

  getJournal(category = 'all') {
    if (category === 'all') return this.data.journal;
    return this.data.journal.filter(item => 
      item.category.toLowerCase().includes(category.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(category.toLowerCase()))
    );
  }

  getArticle(id) {
    return this.data.journal.find(item => item.id === id);
  }

  getProducts(category = 'all') {
    if (category === 'all') return this.data.products;
    return this.data.products.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
  }

  getCareers(dept = 'all') {
    if (dept === 'all') return this.data.careers;
    return this.data.careers.filter(c => c.department.toLowerCase().includes(dept.toLowerCase()));
  }

  getJob(id) {
    return this.data.careers.find(c => c.id === id);
  }
}

window.anirjanStore = new AnirjanDataStore();
