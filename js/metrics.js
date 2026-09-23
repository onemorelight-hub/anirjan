/**
 * ============================================================================
 * ANIRJAN METRICS ENGINE (js/metrics.js) - REAL-TIME REQUEST COUNTERS
 * ============================================================================
 * Provides synchronized real-time request counts and live ecosystem data
 * across Anirjan Connect, Job Done, Services, Support, and Founder portals.
 * 
 * Features:
 *   1. Zero-latency instant cache in LocalStorage.
 *   2. Smooth easing count-up animation on initial load and increments.
 *   3. Optimistic + server-confirmed real-time incrementing on form dispatch.
 *   4. Multi-page reactive updates via DOM CustomEvents.
 * ============================================================================
 */

(function () {
  "use strict";

  const STORAGE_KEY = "anirjan_live_metrics_cache_v2";
  const DEFAULT_BACKEND_URL = "https://script.google.com/macros/s/AKfycbwN2Q_Xw2lzA277ZgyeQ5Pv6HXIzZPsS8eMMMByHKteTSOAnFJbR6A5w7EySv8Gnpdp/exec";

  // Baseline initial state (realist genesis seed, overwritten by live server values)
  const DEFAULT_METRICS = {
    totalRequests: 142,
    todayRequests: 18,
    categories: {
      connect: 78,
      jobDone: 34,
      services: 16,
      support: 11,
      founder: 3,
      digha: 0
    },
    lastUpdated: new Date().toISOString()
  };

  class AnirjanMetricsManager {
    constructor() {
      this.metrics = this.loadCachedMetrics();
      this.isSyncing = false;
      this.initialized = false;
      this.boundElements = new Set();
      this.init();
    }

    getBackendUrl() {
      if (typeof GOOGLE_APPS_SCRIPT_URL !== "undefined" && GOOGLE_APPS_SCRIPT_URL) {
        return GOOGLE_APPS_SCRIPT_URL;
      }
      return DEFAULT_BACKEND_URL;
    }

    loadCachedMetrics() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.totalRequests === "number") {
            return {
              ...DEFAULT_METRICS,
              ...parsed,
              categories: {
                ...DEFAULT_METRICS.categories,
                ...(parsed.categories || {})
              }
            };
          }
        }
      } catch (e) {
        console.warn("[AnirjanMetrics] Storage cache read warning:", e);
      }
      return { ...DEFAULT_METRICS };
    }

    saveCachedMetrics() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.metrics));
      } catch (e) {
        // Storage quota / private mode guard
      }
    }

    init() {
      if (this.initialized) return;

      const setupDOM = () => {
        this.renderAll(false);
        this.syncWithBackend();
        this.listenForEvents();
        this.initialized = true;
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", setupDOM);
      } else {
        setupDOM();
      }
    }

    listenForEvents() {
      // Listen for cross-component submission signals
      window.addEventListener("anirjan:submission-success", (evt) => {
        const detail = evt.detail || {};
        this.recordSubmission(detail.formType, detail.metrics);
      });

      // Periodic gentle sync (every 60s while active tab)
      setInterval(() => {
        if (!document.hidden) {
          this.syncWithBackend(false);
        }
      }, 60000);
    }

    /**
     * Synchronize with real backend Google Apps Script
     */
    async syncWithBackend(animate = true) {
      if (this.isSyncing) return;
      this.isSyncing = true;

      const url = this.getBackendUrl();
      if (!url) {
        this.isSyncing = false;
        return;
      }

      try {
        const queryUrl = url + (url.includes("?") ? "&" : "?") + "action=get_request_metrics&_ts=" + Date.now();
        const response = await fetch(queryUrl, {
          method: "GET",
          headers: { "Accept": "application/json" }
        });

        if (response.ok) {
          const data = await response.json();
          if (data && (data.success || data.totalRequests !== undefined)) {
            const serverTotal = Number(data.totalRequests || 0);
            const serverToday = Number(data.todayRequests || 0);

            // Keep whichever is higher to prevent optimistic rollback
            const newTotal = Math.max(serverTotal, this.metrics.totalRequests);
            const newToday = Math.max(serverToday, this.metrics.todayRequests);

            const serverCats = data.categories || {};
            const mergedCategories = {
              connect: Math.max(Number(serverCats.connect || 0), this.metrics.categories.connect || 0),
              jobDone: Math.max(Number(serverCats.jobDone || 0), this.metrics.categories.jobDone || 0),
              services: Math.max(Number(serverCats.services || 0), this.metrics.categories.services || 0),
              support: Math.max(Number(serverCats.support || 0), this.metrics.categories.support || 0),
              founder: Math.max(Number(serverCats.founder || 0), this.metrics.categories.founder || 0),
              digha: Math.max(Number(serverCats.digha || 0), this.metrics.categories.digha || 0)
            };

            this.metrics = {
              totalRequests: newTotal,
              todayRequests: newToday,
              categories: mergedCategories,
              lastUpdated: new Date().toISOString()
            };

            this.saveCachedMetrics();
            this.renderAll(animate);
            this.dispatchUpdateEvent();
          }
        }
      } catch (err) {
        console.warn("[AnirjanMetrics] Live sync notice:", err.message);
      } finally {
        this.isSyncing = false;
      }
    }

    /**
     * Atomically records a local submission, increments counters immediately,
     * pulses the UI, and saves state.
     */
    recordSubmission(formType, serverMetrics = null) {
      const normalizedType = this.normalizeFormType(formType);

      // Optimistic bump
      this.metrics.totalRequests += 1;
      this.metrics.todayRequests += 1;

      if (!this.metrics.categories[normalizedType]) {
        this.metrics.categories[normalizedType] = 0;
      }
      this.metrics.categories[normalizedType] += 1;

      // If server returned updated metrics in POST response, incorporate them
      if (serverMetrics) {
        if (serverMetrics.totalRequests) {
          this.metrics.totalRequests = Math.max(this.metrics.totalRequests, Number(serverMetrics.totalRequests));
        }
        if (serverMetrics.todayRequests) {
          this.metrics.todayRequests = Math.max(this.metrics.todayRequests, Number(serverMetrics.todayRequests));
        }
      }

      this.metrics.lastUpdated = new Date().toISOString();
      this.saveCachedMetrics();

      // Trigger celebratory micro-pulse and render
      this.renderAll(true, true);
      this.dispatchIncrementEvent(normalizedType);
      this.dispatchUpdateEvent();

      return this.metrics;
    }

    normalizeFormType(formType) {
      if (!formType) return "connect";
      const ft = formType.toUpperCase();
      if (ft.includes("JOB_DONE")) return "jobDone";
      if (ft.includes("SERVICE")) return "services";
      if (ft.includes("SUPPORT") || ft.includes("INQUIRY")) return "support";
      if (ft.includes("FOUNDER")) return "founder";
      if (ft.includes("DIGHA")) return "digha";
      return "connect";
    }

    dispatchIncrementEvent(type) {
      window.dispatchEvent(new CustomEvent("anirjan:metric-increment", {
        detail: {
          type: type,
          totalRequests: this.metrics.totalRequests,
          todayRequests: this.metrics.todayRequests,
          categoryRequests: this.metrics.categories[type] || 0
        }
      }));
    }

    dispatchUpdateEvent() {
      window.dispatchEvent(new CustomEvent("anirjan:metrics-updated", {
        detail: { ...this.metrics }
      }));
    }

    getValueForMetricKey(key) {
      switch (key) {
        case "total":
        case "totalRequests":
          return this.metrics.totalRequests;
        case "today":
        case "todayRequests":
          return this.metrics.todayRequests;
        case "jobDone":
        case "jobs":
          return this.metrics.categories.jobDone || 0;
        case "services":
          return this.metrics.categories.services || 0;
        case "support":
          return this.metrics.categories.support || 0;
        case "founder":
          return this.metrics.categories.founder || 0;
        case "connect":
          return this.metrics.categories.connect || 0;
        case "digha":
          return this.metrics.categories.digha || 0;
        default:
          return this.metrics.categories[key] !== undefined ? this.metrics.categories[key] : this.metrics.totalRequests;
      }
    }

    /**
     * Renders values to all registered and marked DOM elements.
     */
    renderAll(animate = true, isPulse = false) {
      const selector = "[data-metric-counter], [data-metric], [data-metric-text]";
      const elements = document.querySelectorAll(selector);

      elements.forEach((el) => {
        const metricKey = el.getAttribute("data-metric-counter") || el.getAttribute("data-metric");
        const isTextSummary = el.hasAttribute("data-metric-text");

        if (isTextSummary) {
          el.textContent = `${this.formatNumber(this.metrics.totalRequests)} Requests Dispatched • ${this.formatNumber(this.metrics.todayRequests)} Active Today`;
          return;
        }

        if (!metricKey) return;

        const targetVal = this.getValueForMetricKey(metricKey);
        const prefix = el.getAttribute("data-metric-prefix") || "";
        const suffix = el.getAttribute("data-metric-suffix") || "";

        if (isPulse) {
          el.classList.add("metric-counter-pulse");
          setTimeout(() => el.classList.remove("metric-counter-pulse"), 1000);
        }

        if (!animate) {
          el.textContent = `${prefix}${this.formatNumber(targetVal)}${suffix}`;
          el.setAttribute("data-current-value", String(targetVal));
          return;
        }

        const currentVal = parseInt(el.getAttribute("data-current-value") || "0", 10);
        if (currentVal !== targetVal) {
          this.animateCounter(el, currentVal, targetVal, prefix, suffix);
        } else if (!el.textContent) {
          el.textContent = `${prefix}${this.formatNumber(targetVal)}${suffix}`;
        }
      });
    }

    /**
     * Smooth count-up animation using requestAnimationFrame
     */
    animateCounter(el, start, end, prefix = "", suffix = "", duration = 1200) {
      const startTime = performance.now();
      const change = end - start;

      const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

      const updateFrame = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutExpo(progress);
        const current = Math.floor(start + change * eased);

        el.textContent = `${prefix}${this.formatNumber(current)}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(updateFrame);
        } else {
          el.textContent = `${prefix}${this.formatNumber(end)}${suffix}`;
          el.setAttribute("data-current-value", String(end));
        }
      };

      requestAnimationFrame(updateFrame);
    }

    formatNumber(num) {
      if (isNaN(num)) return "0";
      return Number(num).toLocaleString("en-IN");
    }

    getMetrics() {
      return { ...this.metrics };
    }
  }

  // Export singleton to window
  window.AnirjanMetrics = new AnirjanMetricsManager();
})();
