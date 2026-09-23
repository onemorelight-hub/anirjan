/**
 * ============================================================================
 * ANIRJAN METRICS ENGINE (js/metrics.js) - 100% REAL BACKEND DATA
 * ============================================================================
 * Connects directly to your live Google Apps Script & Google Sheet backend.
 * Displays real-time request counts and live ecosystem data across all pages.
 * 
 * Behavior:
 *   1. Displays "--" while awaiting initial backend synchronization.
 *   2. Smoothly animates into exact real count fetched from Google Sheets.
 *   3. Instant optimistic +1 increment with glowing pulse upon any form submission.
 *   4. Broadcasts DOM CustomEvents for reactive UI components.
 * ============================================================================
 */

(function () {
  "use strict";

  const STORAGE_KEY = "anirjan_live_metrics_cache_v3";
  const DEFAULT_BACKEND_URL = "https://script.google.com/macros/s/AKfycbwN2Q_Xw2lzA277ZgyeQ5Pv6HXIzZPsS8eMMMByHKteTSOAnFJbR6A5w7EySv8Gnpdp/exec";

  // Clean initial state: null values render as "--" until real data arrives
  const INITIAL_METRICS = {
    totalRequests: null,
    todayRequests: null,
    categories: {
      connect: null,
      jobDone: null,
      services: null,
      support: null,
      founder: null,
      digha: null
    },
    lastUpdated: null
  };

  class AnirjanMetricsManager {
    constructor() {
      this.metrics = this.loadCachedMetrics();
      this.isSyncing = false;
      this.initialized = false;
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
              ...INITIAL_METRICS,
              ...parsed,
              categories: {
                ...INITIAL_METRICS.categories,
                ...(parsed.categories || {})
              }
            };
          }
        }
      } catch (e) {
        console.warn("[AnirjanMetrics] Storage cache read notice:", e);
      }
      return { ...INITIAL_METRICS };
    }

    saveCachedMetrics() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.metrics));
      } catch (e) {
        // Safe private mode fallback
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
      window.addEventListener("anirjan:submission-success", (evt) => {
        const detail = evt.detail || {};
        this.recordSubmission(detail.formType, detail.metrics);
      });

      // Periodic gentle sync (every 45s while tab is active)
      setInterval(() => {
        if (!document.hidden) {
          this.syncWithBackend(false);
        }
      }, 45000);
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

            const serverCats = data.categories || {};
            const mergedCategories = {
              connect: Number(serverCats.connect || 0),
              jobDone: Number(serverCats.jobDone || 0),
              services: Number(serverCats.services || 0),
              support: Number(serverCats.support || 0),
              founder: Number(serverCats.founder || 0),
              digha: Number(serverCats.digha || 0)
            };

            this.metrics = {
              totalRequests: serverTotal,
              todayRequests: serverToday,
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

      // Initialize if null
      if (this.metrics.totalRequests === null) this.metrics.totalRequests = 0;
      if (this.metrics.todayRequests === null) this.metrics.todayRequests = 0;
      if (!this.metrics.categories[normalizedType]) this.metrics.categories[normalizedType] = 0;

      // Optimistic bump
      this.metrics.totalRequests += 1;
      this.metrics.todayRequests += 1;
      this.metrics.categories[normalizedType] += 1;

      // Incorporate server payload if present
      if (serverMetrics) {
        if (serverMetrics.totalRequests !== undefined) {
          this.metrics.totalRequests = Math.max(this.metrics.totalRequests, Number(serverMetrics.totalRequests));
        }
        if (serverMetrics.todayRequests !== undefined) {
          this.metrics.todayRequests = Math.max(this.metrics.todayRequests, Number(serverMetrics.todayRequests));
        }
      }

      this.metrics.lastUpdated = new Date().toISOString();
      this.saveCachedMetrics();

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
          return this.metrics.categories.jobDone;
        case "services":
          return this.metrics.categories.services;
        case "support":
          return this.metrics.categories.support;
        case "founder":
          return this.metrics.categories.founder;
        case "connect":
          return this.metrics.categories.connect;
        case "digha":
          return this.metrics.categories.digha;
        default:
          return this.metrics.categories[key] !== undefined ? this.metrics.categories[key] : this.metrics.totalRequests;
      }
    }

    renderAll(animate = true, isPulse = false) {
      const selector = "[data-metric-counter], [data-metric], [data-metric-text]";
      const elements = document.querySelectorAll(selector);

      elements.forEach((el) => {
        const metricKey = el.getAttribute("data-metric-counter") || el.getAttribute("data-metric");
        const isTextSummary = el.hasAttribute("data-metric-text");

        if (isTextSummary) {
          const totStr = this.formatNumber(this.metrics.totalRequests);
          const todStr = this.formatNumber(this.metrics.todayRequests);
          el.textContent = `${totStr} Requests Dispatched • ${todStr} Active Today`;
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

        // If data is still null, render --
        if (targetVal === null || targetVal === undefined) {
          el.textContent = `${prefix}--${suffix}`;
          el.setAttribute("data-current-value", "--");
          return;
        }

        const currentAttr = el.getAttribute("data-current-value");
        const currentVal = (currentAttr === "--" || currentAttr === null) ? null : parseInt(currentAttr, 10);

        if (!animate || currentVal === null) {
          el.textContent = `${prefix}${this.formatNumber(targetVal)}${suffix}`;
          el.setAttribute("data-current-value", String(targetVal));
          return;
        }

        if (currentVal !== targetVal) {
          this.animateCounter(el, currentVal, targetVal, prefix, suffix);
        } else if (!el.textContent || el.textContent.includes("--")) {
          el.textContent = `${prefix}${this.formatNumber(targetVal)}${suffix}`;
        }
      });
    }

    animateCounter(el, start, end, prefix = "", suffix = "", duration = 1000) {
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
      if (num === null || num === undefined || num === "" || isNaN(num)) {
        return "--";
      }
      return Number(num).toLocaleString("en-IN");
    }

    getMetrics() {
      return { ...this.metrics };
    }
  }

  window.AnirjanMetrics = new AnirjanMetricsManager();
})();
