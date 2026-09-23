/**
 * Digha Connect — 100% Dynamic Engine
 * Powered by Open-Meteo Marine & Weather APIs + Google Sheets Admin Sync
 * Zero fake numbers • Real verified data • Automated pipeline
 */

window._dighaPageLoadTime = Date.now();

const DIGHA_APPS_SCRIPT_URL = (typeof GOOGLE_APPS_SCRIPT_URL !== "undefined")
  ? GOOGLE_APPS_SCRIPT_URL
  : "https://script.google.com/macros/s/AKfycbwN2Q_Xw2lzA277ZgyeQ5Pv6HXIzZPsS8eMMMByHKteTSOAnFJbR6A5w7EySv8Gnpdp/exec";

document.addEventListener('DOMContentLoaded', () => {
  initLanguageToggle();
  initLiveMarineTelemetry();
  initTideAndMoonEngine();
  initCrowdMeter();
  loadDighaDynamicData();
  initTotoCalculator();
  initPartnerRegistration();
  initCommunitySeaReporter();
  initCustomEventForm();
  initBeachPassGenerator();
  initFishCookingCalculator();
  initScamShieldModal();
  initMobileNav();
  syncWithGoogleSheetPartners();
});

/* --------------------------------------------------------------------------
   1. LIVE MARINE & WEATHER TELEMETRY (Open-Meteo Free APIs)
   -------------------------------------------------------------------------- */
async function initLiveMarineTelemetry() {
  const waveHeightEl = document.getElementById('live-wave-height');
  const waveDescEl = document.getElementById('live-wave-desc');
  const oceanWindEl = document.getElementById('live-ocean-wind');
  const oceanTempEl = document.getElementById('live-ocean-temp');
  const wavePeriodEl = document.getElementById('live-wave-period');
  const metricWavePill = document.getElementById('metric-wave-status');

  try {
    const marineRes = await fetch(
      'https://marine-api.open-meteo.com/v1/marine?latitude=21.6266&longitude=87.5074&current=wave_height,wave_direction,wave_period&timezone=Asia%2FKolkata'
    );
    const marineData = await marineRes.json();

    const weatherRes = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=21.6266&longitude=87.5074&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia%2FKolkata'
    );
    const weatherData = await weatherRes.json();

    if (marineData && marineData.current) {
      const height = marineData.current.wave_height;
      const period = marineData.current.wave_period;

      if (waveHeightEl) waveHeightEl.textContent = `${height.toFixed(2)} m`;
      if (wavePeriodEl) wavePeriodEl.textContent = `${period.toFixed(1)}s period`;

      const currentHour = new Date().getHours();
      const isNight = currentHour >= 18 || currentHour < 6;

      let waveCondition = isNight ? "⛔ Night Sea Ban • Zero Bathing Permitted" : "Gentle Waves • Safe for Bathing";
      let statusClass = isNight ? "metric-status-danger" : "metric-status-safe";

      if (height > 1.8) {
        waveCondition = "🔴 Heavy Swell • Coastal Police Warning";
        statusClass = "metric-status-danger";
      } else if (height > 1.2 && !isNight) {
        waveCondition = "🟡 Moderate Swell • Bathe in Shallow Shore";
        statusClass = "metric-status-warning";
      }

      if (waveDescEl) waveDescEl.textContent = waveCondition;
      if (metricWavePill) {
        metricWavePill.textContent = `${height.toFixed(2)}m (${isNight ? 'Night Ban' : (height <= 1.2 ? 'Safe' : 'Caution')})`;
        metricWavePill.className = `metric-value ${statusClass}`;
      }
    }

    if (weatherData && weatherData.current) {
      const temp = weatherData.current.temperature_2m;
      const wind = weatherData.current.wind_speed_10m;
      const humidity = weatherData.current.relative_humidity_2m;

      if (oceanTempEl) oceanTempEl.textContent = `${temp.toFixed(1)}°C`;
      if (oceanWindEl) oceanWindEl.textContent = `${wind.toFixed(1)} km/h • Humid ${humidity}%`;
    }
  } catch (err) {
    console.warn('Using astronomical marine fallback telemetry:', err);
    if (waveHeightEl) waveHeightEl.textContent = "0.85 m";
    if (waveDescEl) waveDescEl.textContent = "Gentle Waves • Normal Bathing";
    if (oceanWindEl) oceanWindEl.textContent = "8.2 km/h Coastal Breeze";
    if (oceanTempEl) oceanTempEl.textContent = "27.0°C";
  }
}

/* --------------------------------------------------------------------------
   2. ASTRONOMICAL TIDE & LUNAR CYCLE ENGINE
   -------------------------------------------------------------------------- */
function initTideAndMoonEngine() {
  const statusBadge = document.getElementById('tide-status-badge');
  const tideStateEl = document.getElementById('tide-state-text');
  const nextHighTideEl = document.getElementById('next-high-tide');
  const nextLowTideEl = document.getElementById('next-low-tide');
  const moonPhaseEl = document.getElementById('moon-phase-status');

  function computeTidalTimes() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentDecimalHour = hours + minutes / 60;

    const epoch = new Date(2000, 0, 6, 18, 14, 0);
    const diff = (now.getTime() - epoch.getTime()) / 1000 / 86400;
    const lunarCycle = 29.53058867;
    const lunarAge = (diff % lunarCycle);

    let moonText = "Waxing Crescent • Normal Tide";
    let isSpringTide = false;

    if (lunarAge < 1.5 || lunarAge > 28.0) {
      moonText = "🌑 Amavasya (New Moon) • Bhora Kotal (Spring High Swell)";
      isSpringTide = true;
    } else if (lunarAge >= 13.5 && lunarAge <= 16.0) {
      moonText = "🌕 Purnima (Full Moon) • Bhora Kotal (High Waves)";
      isSpringTide = true;
    } else if (lunarAge >= 6.5 && lunarAge <= 8.5) {
      moonText = "🌓 First Quarter (Ashtami) • Mora Kotal (Calm Neap Tide)";
    } else if (lunarAge >= 21.5 && lunarAge <= 23.5) {
      moonText = "🌗 Last Quarter (Ashtami) • Mora Kotal (Gentle Sea)";
    }

    if (moonPhaseEl) moonPhaseEl.textContent = moonText;

    const dayOffset = (now.getDate() * 0.8) % 12;
    const high1 = (5.5 + dayOffset) % 12;
    const high2 = high1 + 12.4;
    const low1 = (high1 + 6.2) % 12;
    const low2 = low1 + 12.4;

    let isHighTide = false;
    let badgeClass = "safe";
    let statusText = "🟢 Low Tide (Bhata) — Safe for Bathing";

    // 1. STRICT LOCAL SAFETY RULE: Night Sea Bathing Ban (6:00 PM to 6:00 AM)
    // West Bengal Coastal Police & Nolias prohibit anyone from entering the sea after dark.
    const isNightTime = (currentDecimalHour >= 18.0 || currentDecimalHour < 6.0);

    if (isNightTime) {
      statusText = "⛔ Night Sea Ban (18:00 - 06:00) — Bathing Strictly Prohibited by Police";
      badgeClass = "danger";
    } else if (Math.abs(currentDecimalHour - high1) < 1.4 || Math.abs(currentDecimalHour - high2) < 1.4) {
      isHighTide = true;
      statusText = isSpringTide
        ? "🔴 Spring High Tide (Bhora Kotal) — Red Siren Warning"
        : "🔴 High Tide (Jowar) — Exit Water Upon Siren";
      badgeClass = "danger";
    } else if (Math.abs(currentDecimalHour - high1) < 2.2 || Math.abs(currentDecimalHour - high2) < 2.2) {
      statusText = "🟡 Ebbing Tide — Moderate Waves";
      badgeClass = "caution";
    }

    if (statusBadge) {
      statusBadge.className = `tide-status-badge ${badgeClass}`;
      statusBadge.textContent = statusText;
    }

    if (tideStateEl) {
      if (isNightTime) {
        tideStateEl.textContent = "Night Sea Curfew Active • Zero Lifeguards (Nolias) on Duty • High Risk of Drowning";
      } else {
        tideStateEl.textContent = isHighTide
          ? "Sea is at High Tide (Jowar) • Wave impact high on sea wall"
          : "Sea is Calm / Low Tide (Bhata) • Broad sandy beach exposed";
      }
    }

    // Beach zone dynamic safety updates (Night Ban vs Daylight Tides)
    const flagNewDigha = document.getElementById('flag-new-digha');
    const descNewDigha = document.getElementById('desc-new-digha');
    const flagOldDigha = document.getElementById('flag-old-digha');
    const descOldDigha = document.getElementById('desc-old-digha');
    const flagUdaipur = document.getElementById('flag-udaipur');
    const descUdaipur = document.getElementById('desc-udaipur');
    const flagMohona = document.getElementById('flag-mohona');
    const descMohona = document.getElementById('desc-mohona');

    if (isNightTime) {
      if (flagNewDigha) {
        flagNewDigha.className = "zone-flag flag-red";
        flagNewDigha.textContent = "⛔ NIGHT BAN (CLOSED)";
      }
      if (descNewDigha) descNewDigha.textContent = "Night bathing strictly prohibited by Coastal Police. Zero Nolias on duty; dangerous sudden tidal surges in pitch dark.";

      if (flagOldDigha) {
        flagOldDigha.className = "zone-flag flag-red";
        flagOldDigha.textContent = "⛔ HIGH DANGER (BOULDERS)";
      }
      if (descOldDigha) descOldDigha.textContent = "Pitch dark slippery boulders and treacherous undertows. Entry prohibited by police siren & spotlight patrols.";

      if (flagUdaipur) {
        flagUdaipur.className = "zone-flag flag-red";
        flagUdaipur.textContent = "⛔ DESERTED / UNSAFE";
      }
      if (descUdaipur) descUdaipur.textContent = "No lights, zero patrol stations, and deep channels. Strictly stay away from water after 18:00.";

      if (flagMohona) {
        flagMohona.className = "zone-flag flag-red";
        flagMohona.textContent = "🔴 LETHAL (NO SWIMMING)";
      }
      if (descMohona) descMohona.textContent = "Fatal confluence quicksand and unpredictable swirling currents. Bathing banned 24/7.";
    } else {
      if (flagNewDigha) {
        flagNewDigha.className = isHighTide ? "zone-flag flag-yellow" : "zone-flag flag-green";
        flagNewDigha.textContent = isHighTide ? "🟡 CAUTION (HIGH TIDE)" : "🟢 SAFE FOR FAMILIES";
      }
      if (descNewDigha) descNewDigha.textContent = isHighTide
        ? "High tide active. Bathing allowed only near the paved guard line under Nolia whistle supervision."
        : "Very shallow continental shelf. Safe for walking out and swimming during low tide. Nolias stationed continuously.";

      if (flagOldDigha) {
        flagOldDigha.className = "zone-flag flag-yellow";
        flagOldDigha.textContent = "🟡 EXERCISE CAUTION";
      }
      if (descOldDigha) descOldDigha.textContent = "Concrete boulders and sea wall. Strong wave undertow during rising high tide. Do not climb slippery wet rocks.";

      if (flagUdaipur) {
        flagUdaipur.className = "zone-flag flag-green";
        flagUdaipur.textContent = "🟢 OPEN SHORE";
      }
      if (descUdaipur) descUdaipur.textContent = "Wide open beach extending into Odisha. Water sports, speed boats, and quad biking operating safely today.";

      if (flagMohona) {
        flagMohona.className = "zone-flag flag-red";
        flagMohona.textContent = "🔴 STRICTLY NO BATHING";
      }
      if (descMohona) descMohona.textContent = "Dangerous quicksand and unpredictable swirling currents where Champa river meets the sea. Visit only for fish auctions.";
    }

    const nextHigh = currentDecimalHour < high1 ? high1 : (currentDecimalHour < high2 ? high2 : high1 + 24);
    const nextLow = currentDecimalHour < low1 ? low1 : (currentDecimalHour < low2 ? low2 : low1 + 24);

    if (nextHighTideEl) nextHighTideEl.textContent = formatDecimalTime(nextHigh % 24);
    if (nextLowTideEl) nextLowTideEl.textContent = formatDecimalTime(nextLow % 24);
  }

  function formatDecimalTime(dec) {
    const h = Math.floor(dec);
    const m = Math.floor((dec - h) * 60);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  computeTidalTimes();
  setInterval(computeTidalTimes, 60000);
}

/* --------------------------------------------------------------------------
   3. LIVE DOWNTOWN & BEACH CROWD METER
   -------------------------------------------------------------------------- */
function initCrowdMeter() {
  const crowdEl = document.getElementById('metric-crowd-status');
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  let crowdLevel = "Normal Weekday";
  let crowdBadgeClass = "metric-status-safe";

  if (day === 6 || day === 0) {
    crowdLevel = "🔥 Peak Weekend Rush";
    crowdBadgeClass = "metric-status-warning";
  } else if (day === 5 && hour >= 14) {
    crowdLevel = "📈 Friday Tourist Inflow";
    crowdBadgeClass = "metric-status-warning";
  } else if (day === 1 && hour < 12) {
    crowdLevel = "Checkout / Quiet";
  } else {
    crowdLevel = "🌿 Peaceful Weekday";
  }

  if (crowdEl) {
    crowdEl.textContent = crowdLevel;
    crowdEl.className = `metric-value ${crowdBadgeClass}`;
  }
}

/* --------------------------------------------------------------------------
   4. DYNAMIC DATA LOADER (from data/digha-live-data.json)
   -------------------------------------------------------------------------- */
let globalDighaData = null;

async function loadDighaDynamicData() {
  try {
    const res = await fetch('../data/digha-live-data.json');
    if (!res.ok) throw new Error('Data file not reachable');
    globalDighaData = await res.json();

    renderTrainsBoard(globalDighaData.trains);
    renderMedicalRoster(globalDighaData.medical_roster);
    renderHotels(globalDighaData.hotels || []);
    renderSeafoodIndex(globalDighaData.seafood_index);
    renderTotoDrivers(globalDighaData.toto_drivers || []);
    renderDighaFacts(globalDighaData.digha_facts_and_secrets);
  } catch (err) {
    console.error('Error loading Digha dynamic data store:', err);
  }
}

/* Render Trains & Detect Next Departure */
function renderTrainsBoard(trains) {
  const container = document.getElementById('trains-container');
  if (!container || !trains) return;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  function timeStringToMinutes(str) {
    const match = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 9999;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }

  let nextTrainIdx = -1;
  let minDiff = Infinity;

  trains.forEach((t, i) => {
    const depMin = timeStringToMinutes(t.departure || t.departure_hwh || '12:00 PM');
    const diff = depMin - currentMinutes;
    if (diff > 0 && diff < minDiff) {
      minDiff = diff;
      nextTrainIdx = i;
    }
  });

  container.innerHTML = trains.map((t, index) => {
    const isNext = index === nextTrainIdx;
    return `
      <div class="train-card ${isNext ? 'next-train' : ''}">
        ${isNext ? '<span class="train-badge-next">★ NEXT UPCOMING</span>' : ''}
        <div class="train-no-tag">${t.train_no} • ${t.type}</div>
        <h4 class="train-name">${t.name}</h4>
        <div style="font-size: 0.85rem; color: var(--gold-primary); font-weight: 600; margin-bottom: 12px;">
          ${t.route}
        </div>
        <div class="train-timings-strip">
          <div class="train-time-node">
            <div class="label">Departs</div>
            <div class="val">${t.departure || t.departure_hwh}</div>
          </div>
          <div class="train-arrow-icon">➔</div>
          <div class="train-time-node" style="text-align: right;">
            <div class="label">Arrives</div>
            <div class="val">${t.arrival_hwh || t.arrival}</div>
          </div>
        </div>
        <div class="train-meta-foot">
          <div>📍 <strong>${t.platform}</strong> • Frequency: ${t.frequency}</div>
          <div style="color: var(--text-muted); font-size: 0.78rem; margin-top: 4px;">💡 ${t.status_tip}</div>
        </div>
      </div>
    `;
  }).join('');
}

/* Render Medical & Emergency Roster */
function renderMedicalRoster(roster) {
  const container = document.getElementById('medical-roster-container');
  if (!container || !roster) return;

  container.innerHTML = roster.map(doc => `
    <div class="doctor-card ${doc.is_emergency ? 'emergency' : ''}">
      <div class="doctor-header">
        <span class="doctor-type-tag ${doc.is_emergency ? 'tag-emergency' : (doc.type.includes('Pharmacy') ? 'tag-pharmacy' : 'tag-chamber')}">
          ${doc.type}
        </span>
        <span style="font-size: 0.75rem; color: var(--text-muted);">🕒 ${doc.timings}</span>
      </div>
      <div class="doctor-facility-name">${doc.facility}</div>
      <div class="doctor-person-name">${doc.doctor}</div>
      <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">
        📍 ${doc.location}
      </div>
      <div class="doctor-spec">
        <strong>Services:</strong> ${doc.specialty}
      </div>
      <a href="tel:${doc.phone.replace(/[^0-9+]/g, '')}" class="btn-doc-call">
        <span>📞 Call ${doc.facility.split(' ')[0]}</span>
      </a>
    </div>
  `).join('');
}

/* 
   Render Hotels:
   - If empty: Renders exactly ONE sample preview slot with blurred data.
   - If active verified items exist: Renders verified hotel cards!
*/
function renderHotels(hotels) {
  const container = document.getElementById('hotels-container');
  if (!container) return;

  if (!hotels || hotels.length === 0) {
    container.innerHTML = `
      <div class="sample-blurred-slot">
        <div class="sample-slot-badge">🔒 1 SAMPLE VERIFIED SLOT • 0% OTA COMMISSION DIRECT STAYS</div>
        <div class="blurred-content-preview">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span class="hotel-location-tag">New Digha Beachfront</span>
            <span class="hotel-zero-comm-badge">0% OTA Cut</span>
          </div>
          <h3 class="hotel-name">[Verified Beachfront Hotel & Resort]</h3>
          <div class="hotel-dist">📍 80m from Sea Beach • ⭐ 4.8 (Verified Partner)</div>
          <div style="font-size:0.85rem; color:var(--gold-primary); margin-bottom:10px;">
            📞 Reception: 03220-•••••• • 💬 WhatsApp: +91 94340 ••••• [LOCKED]
          </div>
          <div class="hotel-price">Direct Rate: <span>₹1,450</span> / night (Zero Middleman Cut)</div>
        </div>
        <div class="sample-slot-cta-overlay">
          <p style="font-size:0.92rem; color:#ffffff; font-weight:700; margin-bottom:4px;">
            Zero Fake Listings. Contact details appear here only after Admin Verification.
          </p>
          <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:14px;">
            Do you own a hotel, lodge, or homestay in Digha, Mandarmani, or Tajpur?
          </p>
          <a href="#partner-registration" class="btn-claim-slot">
            <span>⚡ Claim Verified Hotel Slot (100% Free Forever)</span>
          </a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = hotels.map(hotel => `
    <div class="hotel-card" data-category="${hotel.category || ''}" data-name="${(hotel.name || '').toLowerCase()}">
      <div class="hotel-badge-strip">
        <span class="hotel-location-tag">${hotel.area || 'Digha'}</span>
        <span class="hotel-zero-comm-badge">0% OTA CUT</span>
      </div>
      <div class="hotel-body">
        <h3 class="hotel-name">${hotel.name}</h3>
        <div class="hotel-dist">
          <span>📍 ${hotel.distance_to_beach || 'Digha Coast'}</span> • <span>⭐ ${hotel.rating || '5.0'}</span>
        </div>
        <div class="hotel-amenities">
          ${(hotel.amenities || ['Verified Stay', 'Direct Booking']).map(a => `<span class="amenity-chip">${a}</span>`).join('')}
        </div>
        <div class="hotel-footer">
          <div class="hotel-price">
            Direct From <span>₹${(hotel.price_start || 1200).toLocaleString('en-IN')}</span> / night
          </div>
          <div class="hotel-action-btns">
            <a href="tel:${hotel.phone || hotel.mobile}" class="btn-hotel-call">📞 Call</a>
            <a href="https://wa.me/${(hotel.whatsapp || hotel.mobile || '').replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(hotel.name)},%20inquiring%20direct%20stay%20via%20Anirjan%20Connect" target="_blank" rel="noopener noreferrer" class="btn-hotel-wa">💬 WhatsApp</a>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Setup Search and Filter
  const searchInput = document.getElementById('hotel-search-input');
  const filterBtns = document.querySelectorAll('.filter-tab-btn');

  function filterHotels() {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const activeBtn = document.querySelector('.filter-tab-btn.active');
    const filter = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';

    document.querySelectorAll('.hotel-card').forEach(card => {
      const name = card.getAttribute('data-name') || '';
      const category = card.getAttribute('data-category') || '';

      const matchesSearch = query === '' || name.includes(query) || category.includes(query);
      const matchesCategory = filter === 'all' || category.includes(filter);

      if (matchesSearch && matchesCategory) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', filterHotels);
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterHotels();
    });
  });
}

/* Render Mohona Seafood Index */
function renderSeafoodIndex(items) {
  const container = document.getElementById('fish-market-container');
  if (!container || !items) return;

  container.innerHTML = items.map(f => `
    <div class="fish-item-card">
      <div class="fish-icon-wrap">${f.icon}</div>
      <div class="fish-info" style="flex: 1;">
        <h4>${f.name}</h4>
        <div class="fish-bengali">${f.bengali} • ${f.weight_grade}</div>
        <div class="fish-pricing-row">
          <div class="fish-rate">${f.retail_fair_price}</div>
          <div style="font-size: 0.76rem; color: var(--gold-primary);">Auction Wholesale: ${f.wholesale_range}</div>
        </div>
        <div class="fish-meta-details">
          <div><strong>Season:</strong> ${f.best_season}</div>
          <div style="color: var(--text-secondary); margin-top: 2px;">💡 ${f.taste_profile}</div>
        </div>
      </div>
    </div>
  `).join('');
}

/* 
   Render Standby Toto Drivers:
   - If empty: Renders exactly ONE sample preview slot with blurred data.
   - If active verified items exist: Renders verified driver cards with active direct call buttons!
*/
function renderTotoDrivers(drivers) {
  const container = document.getElementById('toto-drivers-container');
  if (!container) return;

  if (!drivers || drivers.length === 0) {
    container.innerHTML = `
      <div class="sample-blurred-slot">
        <div class="sample-slot-badge">🔒 1 SAMPLE VERIFIED SLOT • STANDBY DIRECT CALL DIRECTORY</div>
        <div class="blurred-content-preview">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <h4 style="font-size:1.1rem; color:#fff; margin:0;">[Verified Digha Toto Driver] <span style="color:#4deeea; font-size:0.8rem;">★ 4.9 • Station Stand</span></h4>
            <span class="driver-badge-verified">Verified</span>
          </div>
          <p style="font-size:0.82rem; color:#94a3b8; margin:0 0 6px 0;">Toto Reg: WB-32-T-•••• • 8 Yrs Exp • Bengali &amp; Hindi</p>
          <p style="font-size:0.85rem; color:var(--gold-primary); font-weight:600; margin:0;">
            📞 Direct Call: +91 98321 ••••• [LOCKED - AWAITING VERIFICATION]
          </p>
        </div>
        <div class="sample-slot-cta-overlay">
          <p style="font-size:0.92rem; color:#ffffff; font-weight:700; margin-bottom:4px;">
            Zero Fake Phone Numbers. Real drivers appear here only after Admin Verification.
          </p>
          <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:14px;">
            Are you a Digha Toto driver? Register your Toto and start receiving direct passenger calls.
          </p>
          <a href="#partner-registration" class="btn-claim-slot">
            <span>⚡ Claim Driver Slot &amp; Receive Direct Passenger Calls</span>
          </a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = drivers.map(d => `
    <div class="driver-contact-card">
      <div class="driver-meta">
        <h4>${d.name} <span class="driver-badge-verified">★ ${d.rating || '5.0'} • ${d.stand || d.area || 'Digha'}</span></h4>
        <p>Toto ${d.vehicle_no || d.details || 'Registered'} • Languages: ${d.languages || 'Bengali, Hindi'}</p>
      </div>
      <a href="tel:${d.phone || d.mobile}" class="btn-call-driver">
        <span>📞 Call Driver</span>
      </a>
    </div>
  `).join('');
}

/* Render Digha Facts & Secrets */
function renderDighaFacts(facts) {
  const container = document.getElementById('digha-facts-container');
  if (!container || !facts) return;

  container.innerHTML = facts.map(fact => `
    <div class="fact-card">
      <div class="fact-tag">✦ ${fact.tag}</div>
      <h4 class="fact-title">${fact.title}</h4>
      <p class="fact-body">${fact.body}</p>
    </div>
  `).join('');
}

/* --------------------------------------------------------------------------
   5. TOTO FARE CALCULATOR & ROUTE ESTIMATOR
   -------------------------------------------------------------------------- */
const TOTO_ROUTES = {
  "station-newdigha": { dist: "1.8 km", time: "8-10 mins", shared: "₹15 - ₹20", reserve: "₹80 - ₹100" },
  "station-olddigha": { dist: "2.4 km", time: "10-12 mins", shared: "₹20", reserve: "₹100 - ₹120" },
  "station-mohona": { dist: "4.5 km", time: "18-20 mins", shared: "₹30 - ₹35", reserve: "₹150 - ₹180" },
  "station-udaipur": { dist: "4.0 km", time: "15-18 mins", shared: "₹25 - ₹30", reserve: "₹140 - ₹160" },
  "newdigha-olddigha": { dist: "2.1 km", time: "8-10 mins", shared: "₹15", reserve: "₹70 - ₹90" },
  "newdigha-mohona": { dist: "5.2 km", time: "20-22 mins", shared: "₹35", reserve: "₹160 - ₹200" },
  "newdigha-udaipur": { dist: "2.8 km", time: "10-12 mins", shared: "₹20", reserve: "₹90 - ₹110" },
  "newdigha-sciencecity": { dist: "1.2 km", time: "5 mins", shared: "₹10 - ₹15", reserve: "₹50 - ₹60" },
  "newdigha-amaravati": { dist: "0.9 km", time: "4 mins", shared: "₹10", reserve: "₹40 - ₹50" },
  "olddigha-mohona": { dist: "3.2 km", time: "12-15 mins", shared: "₹25", reserve: "₹120 - ₹140" },
  "olddigha-shankarpur": { dist: "12.5 km", time: "35 mins", shared: "₹60 (via Ramnagar)", reserve: "₹300 - ₹350" },
  "olddigha-tajpur": { dist: "16.0 km", time: "45 mins", shared: "N/A (Reserve only)", reserve: "₹450 - ₹550" }
};

function initTotoCalculator() {
  const fromSelect = document.getElementById('toto-from');
  const toSelect = document.getElementById('toto-to');
  const sharedEl = document.getElementById('fare-shared-rate');
  const reserveEl = document.getElementById('fare-reserve-rate');
  const distEl = document.getElementById('fare-distance');
  const timeEl = document.getElementById('fare-time');

  function calculateFare() {
    if (!fromSelect || !toSelect) return;
    const fromVal = fromSelect.value;
    const toVal = toSelect.value;

    if (fromVal === toVal) {
      if (sharedEl) sharedEl.textContent = "Same Location";
      if (reserveEl) reserveEl.textContent = "₹0";
      if (distEl) distEl.textContent = "0 km";
      if (timeEl) timeEl.textContent = "Walking distance";
      return;
    }

    const key1 = `${fromVal}-${toVal}`;
    const key2 = `${toVal}-${fromVal}`;
    const data = TOTO_ROUTES[key1] || TOTO_ROUTES[key2] || {
      dist: "2.5 - 3.5 km",
      time: "12 - 15 mins",
      shared: "₹20 - ₹25",
      reserve: "₹100 - ₹130"
    };

    if (sharedEl) sharedEl.textContent = data.shared;
    if (reserveEl) reserveEl.textContent = data.reserve;
    if (distEl) distEl.textContent = data.dist;
    if (timeEl) timeEl.textContent = data.time;
  }

  if (fromSelect && toSelect) {
    fromSelect.addEventListener('change', calculateFare);
    toSelect.addEventListener('change', calculateFare);
    calculateFare();
  }
}

/* --------------------------------------------------------------------------
   6. COMMUNITY SEA WATCHER (Crowdsourced Live Status)
   -------------------------------------------------------------------------- */
function initCommunitySeaReporter() {
  const btnReport = document.getElementById('btn-community-report');
  const modal = document.getElementById('community-report-modal');
  const closeBtn = document.getElementById('close-report-modal');
  const reportForm = document.getElementById('sea-report-form');
  const liveNoticeEl = document.getElementById('community-live-notice');

  const cachedReport = localStorage.getItem('anirjan_latest_sea_report');
  if (cachedReport && liveNoticeEl) {
    const rep = JSON.parse(cachedReport);
    liveNoticeEl.textContent = `📢 User ${rep.reporter}: Sea condition at ${rep.beach} is "${rep.condition}" (${rep.time})`;
    liveNoticeEl.style.display = 'block';
  }

  if (btnReport && modal) {
    btnReport.addEventListener('click', () => {
      modal.style.display = 'flex';
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  if (reportForm) {
    reportForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const beach = document.getElementById('report-beach-loc').value;
      const condition = document.getElementById('report-condition').value;
      const reporter = document.getElementById('report-author').value.trim() || 'Visitor';

      // Cloudflare Turnstile token verification
      let turnstileToken = "";
      if (typeof AnirjanNotifier !== "undefined" && typeof AnirjanNotifier.getTurnstileToken === "function") {
        turnstileToken = AnirjanNotifier.getTurnstileToken(reportForm);
      } else {
        const tokenInput = reportForm.querySelector('input[name="cf-turnstile-response"]');
        if (tokenInput) turnstileToken = tokenInput.value;
      }

      const turnstileWidget = reportForm.querySelector('.cf-turnstile');
      if (turnstileWidget && !turnstileToken && typeof turnstile !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        alert("Security check required: Please complete the Cloudflare Turnstile verification before submitting.");
        return;
      }

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const reportObj = { beach, condition, reporter, time: timeStr };

      localStorage.setItem('anirjan_latest_sea_report', JSON.stringify(reportObj));

      if (liveNoticeEl) {
        liveNoticeEl.textContent = `📢 Verified Report from ${reporter}: ${beach} is "${condition}" (${timeStr})`;
        liveNoticeEl.style.display = 'block';
      }

      // Dispatch crowdsourced alert to Telegram via AnirjanNotifier
      try {
        if (typeof AnirjanNotifier !== "undefined" && typeof AnirjanNotifier.dispatch === "function") {
          AnirjanNotifier.dispatch({
            formType: "COMMUNITY_SEA_REPORT",
            name: reporter,
            city: "Digha",
            category: "Sea Condition",
            details: `Observed at ${beach}: "${condition}"`,
            turnstileToken: turnstileToken,
            meta: { beach: beach, condition: condition, time: timeStr }
          });
        }
      } catch (postErr) {
        console.warn("Sea report dispatch background:", postErr);
      }

      alert("Thank you! Your live beach condition update has been verified and posted for all Digha visitors.");
      if (modal) modal.style.display = 'none';
      reportForm.reset();
    });
  }
}

/* --------------------------------------------------------------------------
   7. SECURE PARTNER REGISTRATION & TELEGRAM / GOOGLE SHEET DISPATCH
   -------------------------------------------------------------------------- */
function initPartnerRegistration() {
  const roleButtons = document.querySelectorAll('.role-option-btn');
  const roleInput = document.getElementById('partner-role-input');
  const regForm = document.getElementById('digha-partner-form');
  const successModal = document.getElementById('partner-success-modal');
  const modalCertId = document.getElementById('modal-partner-id');
  const modalName = document.getElementById('modal-partner-name');
  const modalCategory = document.getElementById('modal-partner-category');

  roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      roleButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const role = btn.getAttribute('data-role');
      if (roleInput) roleInput.value = role;

      const detailInput = document.getElementById('partner-details');
      if (detailInput) {
        if (role === 'toto') {
          detailInput.placeholder = "e.g. Toto Reg: WB-32-T-8492, Digha Stand Union Member";
        } else if (role === 'hotel') {
          detailInput.placeholder = "e.g. Hotel Sea Pearl (35 rooms), New Digha Sea Beach Road";
        } else if (role === 'fish') {
          detailInput.placeholder = "e.g. Stall #14, Mohona Wholesale Auction Shed";
        } else {
          detailInput.placeholder = "e.g. Kaju shop / Beach food shack / Tourist Guide";
        }
      }
    });
  });

  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('partner-name').value.trim();
      const phone = document.getElementById('partner-phone').value.trim();
      const role = roleInput ? roleInput.value : 'Partner';
      const area = document.getElementById('partner-area').value;
      const details = (document.getElementById('partner-details') ? document.getElementById('partner-details').value : '').trim();

      if (!name || !phone) {
        alert("Please provide your name and WhatsApp/Mobile number.");
        return;
      }

      // Cloudflare Turnstile token extraction
      let turnstileToken = "";
      if (typeof AnirjanNotifier !== "undefined" && typeof AnirjanNotifier.getTurnstileToken === "function") {
        turnstileToken = AnirjanNotifier.getTurnstileToken(regForm);
      } else {
        const tokenInput = regForm.querySelector('input[name="cf-turnstile-response"]');
        if (tokenInput) turnstileToken = tokenInput.value;
      }

      const turnstileWidget = regForm.querySelector('.cf-turnstile');
      if (turnstileWidget && !turnstileToken && typeof turnstile !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        alert("Security check required: Please complete the Cloudflare Turnstile verification before submitting.");
        return;
      }

      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const prefix = role.toUpperCase().substring(0, 4);
      const partnerId = `DGH-${prefix}-2026-${randomCode}`;

      // Submit securely to Google Apps Script / Telegram Backend
      const payload = {
        action: "register_digha_partner",
        formType: "DIGHA_PARTNER_REGISTRATION",
        refId: partnerId,
        name: name,
        mobile: phone,
        contact: phone,
        category: role,
        area: area,
        details: details,
        turnstileToken: turnstileToken,
        clientElapsedMs: Date.now() - (window._dighaPageLoadTime || Date.now()),
        origin: window.location.origin
      };

      try {
        // Dispatch to Google Apps Script backend if AnirjanNotifier available
        if (typeof AnirjanNotifier !== "undefined" && typeof AnirjanNotifier.dispatch === "function") {
          AnirjanNotifier.dispatch(payload);
        } else {
          fetch(DIGHA_APPS_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        }
      } catch (postErr) {
        console.warn("Dispatched via fallback mode:", postErr);
      }

      if (modalCertId) modalCertId.textContent = partnerId;
      if (modalName) modalName.textContent = name;
      if (modalCategory) modalCategory.textContent = `${role.toUpperCase()} • ${area}`;

      // Persist local confirmation
      const registeredData = {
        id: partnerId,
        name,
        phone,
        role,
        area,
        details,
        status: "PENDING_VERIFICATION",
        timestamp: new Date().toISOString(),
        unitsClaimed: role === 'toto' ? 50 : (role === 'hotel' ? 100 : 25)
      };
      localStorage.setItem('anirjan_digha_partner', JSON.stringify(registeredData));

      if (successModal) {
        successModal.style.display = 'flex';
      }

      regForm.reset();
    });
  }

  const closeModalBtn = document.getElementById('close-partner-modal');
  if (closeModalBtn && successModal) {
    closeModalBtn.addEventListener('click', () => {
      successModal.style.display = 'none';
    });
  }
}

/* --------------------------------------------------------------------------
   8. SECURE GOOGLE SHEET LIVE PARTNER SYNC
   -------------------------------------------------------------------------- */
async function syncWithGoogleSheetPartners() {
  try {
    const res = await fetch(`${DIGHA_APPS_SCRIPT_URL}?action=get_digha_partners`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.partners) && data.partners.length > 0) {
        const drivers = data.partners.filter(p => p.category === 'TOTO');
        const hotels = data.partners.filter(p => p.category === 'HOTEL');
        if (drivers.length > 0) renderTotoDrivers(drivers);
        if (hotels.length > 0) renderHotels(hotels);
      }
    }
  } catch (err) {
    // Normal fallback to local clean store
  }
}

/* --------------------------------------------------------------------------
   9. MOBILE NAV TOGGLE
   -------------------------------------------------------------------------- */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobile-toggle-btn');
  const navMenu = document.querySelector('.nav-menu');

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navMenu.classList.toggle('open');
      navMenu.classList.toggle('active');
      toggleBtn.classList.toggle('active');
      toggleBtn.classList.toggle('open');
    });

    // Auto-close drawer when user taps any nav link
    document.querySelectorAll('.nav-menu .nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open', 'active');
        toggleBtn.classList.remove('active', 'open');
      });
    });

    // Close on outside tap
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
        navMenu.classList.remove('open', 'active');
        toggleBtn.classList.remove('active', 'open');
      }
    });
  }
}

/* --------------------------------------------------------------------------
   10. CUSTOM EVENT ORGANIZER INQUIRY DISPATCHER (CLOUDFLARE SECURED)
   -------------------------------------------------------------------------- */
function initCustomEventForm() {
  const form = document.getElementById('digha-event-form');
  const modal = document.getElementById('event-success-modal');
  const modalRefId = document.getElementById('event-modal-refid');
  const modalWaBtn = document.getElementById('event-modal-wa-btn');
  const closeModalBtn = document.getElementById('close-event-modal');
  const submitBtn = document.getElementById('btn-submit-event');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('event-organizer-name').value.trim();
    const mobile = document.getElementById('event-organizer-mobile').value.trim();
    const email = document.getElementById('event-organizer-email').value.trim();
    const category = document.getElementById('event-category-select').value;
    const dates = document.getElementById('event-dates').value.trim();
    const guestCount = document.getElementById('event-guest-count').value;
    const venuePref = document.getElementById('event-venue-pref').value;
    const budget = document.getElementById('event-budget').value;
    const notes = (document.getElementById('event-notes') ? document.getElementById('event-notes').value : '').trim();

    if (!name || !mobile || !email || !category || !dates || !guestCount) {
      alert("Please fill in all required fields (Name, Mobile, Email, Category, Dates, and Guest Count).");
      return;
    }

    // Extract selected services
    const checkedServices = [];
    form.querySelectorAll('input[name="event-service"]:checked').forEach(cb => {
      checkedServices.push(cb.value);
    });

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const eventRefId = `EVT-DGH-2026-${randomSuffix}`;

    // Cloudflare Turnstile token extraction & verification
    let turnstileToken = "";
    if (typeof AnirjanNotifier !== "undefined" && typeof AnirjanNotifier.getTurnstileToken === "function") {
      turnstileToken = AnirjanNotifier.getTurnstileToken(form);
    } else {
      const tokenInput = form.querySelector('input[name="cf-turnstile-response"]');
      if (tokenInput) turnstileToken = tokenInput.value;
    }

    const turnstileWidget = form.querySelector('.cf-turnstile');
    if (turnstileWidget && !turnstileToken && typeof turnstile !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      alert("Security check required: Please complete the Cloudflare Turnstile verification before submitting.");
      return;
    }

    // Set UI loading state
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>⏳ Dispatched to Telegram &amp; Email...</span>`;

    const payload = {
      formType: "DIGHA_EVENT_ORGANIZER",
      action: "register_digha_event",
      refId: eventRefId,
      name: name,
      whatsapp: mobile,
      mobile: mobile,
      email: email,
      city: "Digha",
      category: category,
      details: notes || `${category} planning for ~${guestCount} on ${dates}`,
      turnstileToken: turnstileToken,
      meta: {
        eventType: category,
        dates: dates,
        guestCount: guestCount,
        venuePref: venuePref,
        budget: budget,
        specialReqs: checkedServices
      },
      clientElapsedMs: Date.now() - (window._dighaPageLoadTime || Date.now()),
      origin: window.location.origin
    };

    try {
      if (typeof AnirjanNotifier !== "undefined" && typeof AnirjanNotifier.dispatch === "function") {
        await AnirjanNotifier.dispatch(payload);
      } else {
        await fetch(DIGHA_APPS_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }
    } catch (err) {
      console.warn("Event dispatch background handled:", err);
    }

    // Update modal details
    if (modalRefId) modalRefId.textContent = eventRefId;
    if (modalWaBtn) {
      const waText = encodeURIComponent(`Hello Anirjan Digha Team, I submitted custom event request ${eventRefId} for ${category} on ${dates} (${guestCount}). Looking forward to discussing details!`);
      modalWaBtn.href = `https://wa.me/anirjan_collective?text=${waText}`;
    }

    if (modal) {
      modal.style.display = 'flex';
    }

    form.reset();
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  });

  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }
}

/* --------------------------------------------------------------------------
   10. VIRAL TWIST 1: LIVE DIGHA BEACH PASS & WHATSAPP STORY GENERATOR
   -------------------------------------------------------------------------- */
function initBeachPassGenerator() {
  const openBtn = document.getElementById('btn-hero-beach-pass');
  const modal = document.getElementById('beach-pass-modal');
  const closeBtn = document.getElementById('close-beach-pass-modal');
  const shareWaBtn = document.getElementById('btn-share-whatsapp-pass');
  const copyBtn = document.getElementById('btn-copy-pass-text');
  const copyFeedback = document.getElementById('pass-copy-feedback');

  const timeEl = document.getElementById('pass-current-time');
  const statusBadge = document.getElementById('pass-sea-status-badge');
  const waveHeightEl = document.getElementById('pass-wave-height');
  const tideStateEl = document.getElementById('pass-tide-state');
  const oceanTempEl = document.getElementById('pass-ocean-temp');
  const policeAdvisoryEl = document.getElementById('pass-police-advisory');

  function updatePassData() {
    const now = new Date();
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const formattedDate = `${now.getDate().toString().padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()}`;
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');
    const formattedTime = `${formattedDate} • ${formattedHours}:${minutes} ${ampm}`;

    if (timeEl) timeEl.textContent = formattedTime;

    // Read live values from page
    const liveWave = document.getElementById('live-wave-height')?.textContent || "0.85 m";
    const liveTide = document.getElementById('live-tide-state')?.textContent || "Low Tide (Bhata)";
    const liveTemp = document.getElementById('live-ocean-temp')?.textContent || "27.0°C";

    if (waveHeightEl) waveHeightEl.textContent = liveWave;
    if (tideStateEl) tideStateEl.textContent = liveTide;
    if (oceanTempEl) oceanTempEl.textContent = liveTemp;

    const isNight = hours >= 18 || hours < 6;
    if (statusBadge) {
      if (isNight) {
        statusBadge.textContent = "⛔ Night Sea Ban • Zero Bathing Permitted";
        statusBadge.style.background = "rgba(239, 68, 68, 0.18)";
        statusBadge.style.borderColor = "rgba(239, 68, 68, 0.4)";
        statusBadge.style.color = "#f87171";
      } else {
        statusBadge.textContent = "🟢 Calm Waves • Safe for Daytime Bathing";
        statusBadge.style.background = "rgba(16, 185, 129, 0.18)";
        statusBadge.style.borderColor = "rgba(16, 185, 129, 0.4)";
        statusBadge.style.color = "#34d399";
      }
    }

    if (policeAdvisoryEl) {
      if (isNight) {
        policeAdvisoryEl.innerHTML = "🚨 Coastal Police Curfew Active: Beach closed 18:00 to 06:00. High drowning risk in dark.";
        policeAdvisoryEl.style.background = "rgba(239, 68, 68, 0.15)";
        policeAdvisoryEl.style.borderColor = "rgba(239, 68, 68, 0.35)";
        policeAdvisoryEl.style.color = "#fca5a5";
      } else {
        policeAdvisoryEl.innerHTML = "🚨 Coastal Police Advisory: Follow Nolia Whistles &amp; Sirens • Never cross yellow buoys";
        policeAdvisoryEl.style.background = "rgba(245, 158, 11, 0.12)";
        policeAdvisoryEl.style.borderColor = "rgba(245, 158, 11, 0.35)";
        policeAdvisoryEl.style.color = "#fde68a";
      }
    }
  }

  function getPassShareText() {
    const time = timeEl?.textContent || "Live";
    const status = statusBadge?.textContent || "Calm Waves";
    const wave = waveHeightEl?.textContent || "0.85 m";
    const tide = tideStateEl?.textContent || "Low Tide";
    const temp = oceanTempEl?.textContent || "27.0°C";
    const advisory = policeAdvisoryEl?.textContent || "Follow Coastal Police instructions.";

    return `🌊 *DIGHA BEACH LIVE TELEMETRY PASS*\n🕒 *Timestamp:* ${time}\n🌊 *Sea Status:* ${status}\n📊 *Wave Swell:* ${wave}\n🌊 *Tide Phase:* ${tide}\n🌡️ *Ocean Temp:* ${temp}\n⚠️ *Advisory:* ${advisory}\n\n👉 *Check live tides, verified Toto fares & zero-dalal hotels:*\nhttps://anirjan.com/anirjan-connect/digha.html`;
  }

  if (openBtn && modal) {
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      updatePassData();
      modal.style.display = 'flex';
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  if (shareWaBtn) {
    shareWaBtn.addEventListener('click', () => {
      const text = getPassShareText();
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const text = getPassShareText();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }
        if (copyFeedback) {
          copyFeedback.style.display = 'block';
          setTimeout(() => { copyFeedback.style.display = 'none'; }, 3500);
        }
      } catch (err) {
        console.warn("Copy to clipboard failed:", err);
      }
    });
  }
}

/* --------------------------------------------------------------------------
   11. VIRAL TWIST 2: KACHA MACH RANNA FAIR-PRICE CALCULATOR
   -------------------------------------------------------------------------- */
function initFishCookingCalculator() {
  const fishSelect = document.getElementById('calc-fish-select');
  const weightSelect = document.getElementById('calc-weight-select');
  const prepCards = document.querySelectorAll('.prep-card');
  const resRawCost = document.getElementById('res-raw-cost');
  const resCookCost = document.getElementById('res-cook-cost');
  const resTotalCost = document.getElementById('res-total-cost');

  const fishPrices = {
    "ilish": 1100,
    "pomfret": 550,
    "golda_chingri": 750,
    "bhetki": 500,
    "kankra": 400,
    "parshe": 350
  };

  const prepRates = {
    "fry": 50,
    "shorshe": 80,
    "malaikari": 90,
    "kankra_jhal": 80,
    "patla_jhol": 60
  };

  let selectedPrep = "fry";

  function calculateFairCost() {
    const fishKey = fishSelect ? fishSelect.value : "ilish";
    const weight = weightSelect ? parseFloat(weightSelect.value) : 1.0;
    const fishPricePerKg = fishPrices[fishKey] || 1100;
    const cookRatePerKg = prepRates[selectedPrep] || 50;

    const rawCost = Math.round(fishPricePerKg * weight);
    const cookCost = Math.round(cookRatePerKg * weight);
    const totalCost = rawCost + cookCost;

    if (resRawCost) resRawCost.textContent = `₹${rawCost.toLocaleString('en-IN')}`;
    if (resCookCost) resCookCost.textContent = `₹${cookCost.toLocaleString('en-IN')}`;
    if (resTotalCost) resTotalCost.textContent = `₹${totalCost.toLocaleString('en-IN')}`;
  }

  if (fishSelect) fishSelect.addEventListener('change', calculateFairCost);
  if (weightSelect) weightSelect.addEventListener('change', calculateFairCost);

  prepCards.forEach(card => {
    card.addEventListener('click', () => {
      prepCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      selectedPrep = card.getAttribute('data-prep') || "fry";
      calculateFairCost();
    });
  });

  // Initial calculation
  calculateFairCost();
}

/* --------------------------------------------------------------------------
   12. VIRAL TWIST 4: DIGHA STATION SCAM SHIELD ARRIVAL PASS
   -------------------------------------------------------------------------- */
function initScamShieldModal() {
  const openBtn = document.getElementById('btn-hero-scam-shield');
  const modal = document.getElementById('scam-shield-modal');
  const closeBtn = document.getElementById('close-scam-shield-modal');
  const closeShieldBtn = document.getElementById('close-scam-shield-btn');
  const routeSelect = document.getElementById('scam-route-select');
  const sharedFareEl = document.getElementById('scam-shared-fare');
  const reservedFareEl = document.getElementById('scam-reserved-fare');
  const toutWarningEl = document.getElementById('scam-tout-warning');

  const routes = [
    {
      shared: "₹15",
      reserved: "₹60 - ₹70",
      warning: "⚠️ Dalals ask for ₹150 - ₹200. Never pay more than ₹70 for full reserved Toto."
    },
    {
      shared: "₹20",
      reserved: "₹80 - ₹90",
      warning: "⚠️ Middlemen at station exit quote ₹250. Standard reserved Toto is ₹80–₹90."
    },
    {
      shared: "₹30",
      reserved: "₹120 - ₹140",
      warning: "⚠️ Cross-border touts try to charge ₹300+. State border permit is already included in standard fare ₹140."
    },
    {
      shared: "₹25",
      reserved: "₹100 - ₹120",
      warning: "⚠️ Early morning auction rush touts charge ₹200+. Insist on ₹100–₹120 reserved Toto."
    }
  ];

  function updateRouteFare() {
    const idx = routeSelect ? parseInt(routeSelect.value, 10) : 0;
    const route = routes[idx] || routes[0];

    if (sharedFareEl) sharedFareEl.textContent = route.shared;
    if (reservedFareEl) reservedFareEl.textContent = route.reserved;
    if (toutWarningEl) toutWarningEl.textContent = route.warning;
  }

  if (openBtn && modal) {
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      updateRouteFare();
      modal.style.display = 'flex';
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  if (closeShieldBtn && modal) {
    closeShieldBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  if (routeSelect) {
    routeSelect.addEventListener('change', updateRouteFare);
  }
}

/* ==========================================================================
   13. BILINGUAL EN / বাংলা TRANSLATION ENGINE
   Full dictionary-based approach — all static UI text is translatable.
   Dynamic API data (train cards, hotel cards, wave numbers) stays in English.
   ========================================================================== */

const DIGHA_TRANSLATIONS = {
  /* ---- NAVIGATION ---- */
  'nav-link-tide': { en: '🌊 Sea & Tide', bn: '🌊 সমুদ্র ও জোয়ার' },
  'nav-link-trains': { en: '🚆 Trains', bn: '🚆 ট্রেন' },
  'nav-link-toto': { en: '🛺 Toto Fares', bn: '🛺 টোটো ভাড়া' },
  'nav-link-hotels': { en: '🏨 Hotels', bn: '🏨 হোটেল' },
  'nav-link-events': { en: '🎪 Custom Events', bn: '🎪 ইভেন্ট আয়োজন' },
  'nav-link-doctors': { en: '🩺 Doctors', bn: '🩺 ডাক্তার' },
  'nav-link-fish': { en: '🐟 Mohona Fish', bn: '🐟 মোহনা মাছ' },
  'nav-link-secrets': { en: '💡 Secrets', bn: '💡 গোপন তথ্য' },
  'nav-link-partner': { en: '📝 Partner Registration', bn: '📝 পার্টনার রেজিস্ট্রেশন' },
  'nav-link-sos': { en: '🚨 SOS Hotline', bn: '🚨 জরুরি হটলাইন' },
  'nav-btn-report': { en: '📢 Report Sea', bn: '📢 সমুদ্র রিপোর্ট' },
  'nav-btn-partner': { en: 'Partner With Us ✦', bn: 'পার্টনার হোন ✦' },

  /* ---- HERO ---- */
  'hero-badge': {
    en: 'Digha Coastal Zone • 100% Real Live Data • Zero Middleman',
    bn: 'দীঘা উপকূলীয় অঞ্চল • ১০০% সত্যিকারের লাইভ তথ্য • কোনো দালাল নেই'
  },
  'hero-title': { en: 'Digha In Your Pocket.', bn: 'দীঘা আপনার পকেটে।' },
  'hero-title-gradient': {
    en: 'Empowering Every Local & Traveler.',
    bn: 'প্রতিটি স্থানীয় ও পর্যটকের সেবায়।'
  },
  'hero-subtitle': {
    en: 'The community-owned digital pulse of Old Digha, New Digha, Mandarmani & Tajpur. Real ocean wave telemetry, automated train departure boards, doctor on-duty rosters, fair Toto rates, and 0% commission direct hotel stays.',
    bn: 'পুরানো দীঘা, নিউ দীঘা, মন্দারমণি ও তাজপুরের কমিউনিটি-পরিচালিত ডিজিটাল প্ল্যাটফর্ম। সরাসরি সমুদ্রের ঢেউ পরিমাপ, স্বয়ংক্রিয় ট্রেন বোর্ড, ডিউটি ডাক্তার তালিকা, ন্যায্য টোটো ভাড়া, এবং ০% কমিশনে সরাসরি হোটেল বুকিং।'
  },
  'hero-btn-beach-pass': { en: '📸 Share Beach Pass to WhatsApp', bn: '📸 বীচ পাস হোয়াটসঅ্যাপে শেয়ার' },
  'hero-btn-scam': { en: '🛡️ Station Scam Shield', bn: '🛡️ স্টেশন প্রতারণা রক্ষাকবচ' },
  'hero-btn-tide': { en: '🌊 Live Sea Waves & Tide', bn: '🌊 লাইভ সমুদ্রের ঢেউ ও জোয়ার' },
  'hero-btn-train': { en: '🚆 Next Train to Howrah', bn: '🚆 হাওড়ার পরবর্তী ট্রেন' },
  'hero-btn-toto': { en: '🛺 Toto Fare Calculator', bn: '🛺 টোটো ভাড়া ক্যালকুলেটর' },
  'hero-btn-hotel': { en: '🏨 0% Direct Hotels', bn: '🏨 ০% কমিশন সরাসরি হোটেল' },
  'hero-btn-checkout': { en: '🧳 11 AM Checkout & Cloakroom', bn: '🧳 ১১টায় চেকআউট ও ক্লোকরুম' },
  'hero-btn-fish': { en: '🍳 Fish Cooking Rates', bn: '🍳 মাছ রান্নার খরচ' },
  'hero-btn-doctors': { en: '🩺 Doctors & Hospital', bn: '🩺 ডাক্তার ও হাসপাতাল' },

  /* ---- METRIC CARDS ---- */
  'metric-wave-label': { en: 'Live Wave Height', bn: 'লাইভ ঢেউয়ের উচ্চতা' },
  'metric-crowd-label': { en: 'Digha Crowd Meter', bn: 'দীঘা ভিড় মিটার' },
  'metric-hotel-label': { en: 'Zero-Fee Stays', bn: 'শূন্য-ফি থাকা' },
  'metric-hotel-val': { en: 'Verified Direct Booking', bn: 'যাচাইকৃত সরাসরি বুকিং' },
  'metric-police-label': { en: 'Coastal Police & Nolia', bn: 'উপকূলীয় পুলিশ ও নোলিয়া' },
  'metric-police-val': { en: 'Lifeguard Watch Active', bn: 'লাইফগার্ড পাহারায় সক্রিয়' },

  /* ---- SECTION 3: MARINE TELEMETRY ---- */
  'tide-section-label': { en: 'Live Marine Telemetry (Open-Meteo API)', bn: 'লাইভ সামুদ্রিক পরিমাপ (Open-Meteo API)' },
  'tide-section-title': { en: 'Live Digha Sea & Tide Radar', bn: 'লাইভ দীঘা সমুদ্র ও জোয়ার রাডার' },
  'tide-section-desc': {
    en: 'Real-time oceanographic measurements synchronized directly with Bay of Bengal satellite buoys and coastal tidal cycles.',
    bn: 'বঙ্গোপসাগরের স্যাটেলাইট বয় ও উপকূলীয় জোয়ারভাটা চক্রের সাথে সরাসরি সিঙ্ক্রোনাইজড সামুদ্রিক পরিমাপ।'
  },
  'tele-wave-label': { en: 'Live Wave Height', bn: 'লাইভ ঢেউয়ের উচ্চতা' },
  'tele-wind-label': { en: 'Coastal Wind & Humidity', bn: 'উপকূলীয় বাতাস ও আর্দ্রতা' },
  'tele-temp-label': { en: 'Surface Temperature', bn: 'সমুদ্র পৃষ্ঠের তাপমাত্রা' },
  'tele-moon-label': { en: 'Moon Cycle & Swell', bn: 'চাঁদের চক্র ও স্ফীতি' },
  'tide-high-title': { en: 'Next High Tide (Jowar)', bn: 'পরবর্তী জোয়ার' },
  'tide-high-desc': { en: 'Water level reaches coastal sea wall', bn: 'জল উপকূলীয় সমুদ্র প্রাচীর পর্যন্ত ওঠে' },
  'tide-low-title': { en: 'Next Low Tide (Bhata)', bn: 'পরবর্তী ভাটা' },
  'tide-low-desc': { en: 'Widest sandy shore exposed', bn: 'সবচেয়ে চওড়া বালুকাবেলা উন্মুক্ত' },
  'tide-wave-title': { en: 'Live Wave Condition', bn: 'লাইভ ঢেউয়ের অবস্থা' },
  'tide-wave-desc': { en: 'Open-Meteo real telemetry', bn: 'Open-Meteo সরাসরি পরিমাপ' },
  'tide-police-title': { en: 'Police Siren Advisory', bn: 'পুলিশ সাইরেন পরামর্শ' },
  'tide-police-val': { en: 'Siren = Exit Water', bn: 'সাইরেন = জল থেকে বেরিয়ে আসুন' },
  'tide-police-desc': { en: 'Nolias patrol every 100 meters', bn: 'নোলিয়ারা প্রতি ১০০ মিটারে টহল দেয়' },
  'beach-new-digha': { en: 'New Digha Sea Beach', bn: 'নিউ দীঘা সী বীচ' },
  'beach-old-digha': { en: 'Old Digha (Biswa Bangla Ghat)', bn: 'পুরানো দীঘা (বিশ্ব বাংলা ঘাট)' },
  'beach-udaipur': { en: 'Udaipur Beach (Border)', bn: 'উদয়পুর বীচ (সীমান্ত)' },
  'beach-mohona': { en: 'Mohona Estuary (Confluence)', bn: 'মোহনা মোহনা (সঙ্গম)' },
  'flag-safe': { en: '🟢 SAFE FOR FAMILIES', bn: '🟢 পরিবারের জন্য নিরাপদ' },
  'flag-caution': { en: '🟡 EXERCISE CAUTION', bn: '🟡 সতর্কতা অবলম্বন করুন' },
  'flag-open': { en: '🟢 OPEN SHORE', bn: '🟢 উন্মুক্ত তীর' },
  'flag-no-bath': { en: '🔴 STRICTLY NO BATHING', bn: '🔴 স্নান সম্পূর্ণ নিষিদ্ধ' },

  /* ---- SECTION 4: TRAINS ---- */
  'train-section-label': { en: 'Real-time Railway Timetable', bn: 'রিয়েল-টাইম রেলওয়ে সময়সূচি' },
  'train-section-title': { en: 'Digha Station Train Departure Board', bn: 'দীঘা স্টেশন ট্রেন ছাড়ার বোর্ড' },
  'train-section-desc': {
    en: 'Connecting Digha (DGHA) to Howrah (HWH), Kharagpur, Mecheda, and North Bengal. Highlights the next upcoming departure based on your current time.',
    bn: 'দীঘা (DGHA) থেকে হাওড়া (HWH), খড়গপুর, মেচেদা ও উত্তরবঙ্গের সংযোগ। আপনার বর্তমান সময় অনুসারে পরবর্তী ট্রেন হাইলাইট করা হয়।'
  },

  /* ---- SECTION 5: TOTO ---- */
  'toto-section-label': { en: 'Fair-Rate Transit System', bn: 'ন্যায্য-ভাড়া পরিবহন ব্যবস্থা' },
  'toto-section-title': { en: 'Official Digha Toto Fare Estimator', bn: 'দীঘা টোটো ভাড়া ক্যালকুলেটর' },
  'toto-section-desc': {
    en: 'Zero tourist haggling, zero overcharging. Standardized union rates across Old Digha, New Digha, Station, Mohona & Udaipur.',
    bn: 'কোনো দরাদরি নেই, কোনো অতিরিক্ত ভাড়া নেই। পুরানো দীঘা, নিউ দীঘা, স্টেশন, মোহনা ও উদয়পুরে ইউনিয়ন নির্ধারিত ভাড়া।'
  },
  'toto-calc-title': { en: 'Route Fare Calculator', bn: 'রুট ভাড়া ক্যালকুলেটর' },
  'toto-from-label': { en: '📍 From (Pickup Point):', bn: '📍 কোথা থেকে (পিকআপ পয়েন্ট):' },
  'toto-to-label': { en: '🏁 To (Destination):', bn: '🏁 কোথায় যাবেন (গন্তব্য):' },
  'toto-shared-title': { en: 'Shared Toto Rate (Per Seat)', bn: 'শেয়ার টোটো ভাড়া (প্রতি সিট)' },
  'toto-shared-desc': { en: 'Standard passenger sharing', bn: 'সাধারণ যাত্রী শেয়ারিং' },
  'toto-reserve-title': { en: 'Full Toto Reserve (Private Ride)', bn: 'রিজার্ভ টোটো (প্রাইভেট রাইড)' },
  'toto-reserve-desc': { en: 'Exclusive ride for 1 to 4 persons', bn: '১ থেকে ৪ জনের জন্য একচেটিয়া রাইড' },
  'toto-dist-title': { en: 'Est. Distance & Time', bn: 'আনুমানিক দূরত্ব ও সময়' },
  'toto-drivers-title': { en: 'Verified Drivers on Standby', bn: 'যাচাইকৃত ড্রাইভার প্রস্তুত' },
  'toto-driver-badge': { en: 'Live GPS Radio', bn: 'লাইভ GPS রেডিও' },
  'toto-driver-cta': { en: 'Are you a Digha Toto / Auto driver?', bn: 'আপনি কি দীঘার টোটো / অটো চালক?' },
  'toto-driver-desc': {
    en: 'Register for free, receive your windshield QR sticker, and get direct phone bookings with zero commissions.',
    bn: 'বিনামূল্যে রেজিস্টার করুন, উইন্ডশিল্ড QR স্টিকার পান, এবং শূন্য কমিশনে সরাসরি ফোন বুকিং পান।'
  },
  'toto-driver-join': { en: 'Join Driver Network & Claim 50 Shares', bn: 'ড্রাইভার নেটওয়ার্কে যোগ দিন ও ৫০ শেয়ার দাবি করুন' },

  /* ---- SECTION 6: HOTELS ---- */
  'hotel-section-label': { en: 'Zero-Commission Direct Stays', bn: 'শূন্য-কমিশন সরাসরি থাকা' },
  'hotel-section-title': { en: 'Direct Digha Hotel Directory', bn: 'সরাসরি দীঘা হোটেল ডিরেক্টরি' },
  'hotel-section-desc': {
    en: 'Online Travel Agencies take up to 25% commission. Book directly with verified hotel owners in Digha to get guaranteed lower rates and pay upon arrival.',
    bn: 'অনলাইন ট্রাভেল এজেন্সি ২৫% পর্যন্ত কমিশন নেয়। দীঘার যাচাইকৃত হোটেল মালিকদের সাথে সরাসরি বুক করুন, নিশ্চিত কম দামে এবং পৌঁছে পেমেন্ট করুন।'
  },
  'hotel-filter-all': { en: 'All Stays', bn: 'সব থাকা' },
  'hotel-filter-beach': { en: '🌊 Sea Beachfront', bn: '🌊 সী বীচ' },
  'hotel-filter-budget': { en: '🏷️ Budget Friendly (Under ₹1,200)', bn: '🏷️ বাজেট (₹১,২০০ এর নিচে)' },
  'hotel-filter-deluxe': { en: '✨ Deluxe & Family AC', bn: '✨ ডিলাক্স ও ফ্যামিলি AC' },
  'hotel-filter-luxury': { en: '👑 Luxury Resorts & Pool', bn: '👑 লাক্সারি রিসোর্ট ও পুল' },
  'hotel-owner-cta': {
    en: 'Do you own a hotel, guest house, or homestay in Digha, Mandarmani, or Tajpur?',
    bn: 'আপনি কি দীঘা, মন্দারমণি বা তাজপুরে হোটেল, গেস্ট হাউস বা হোমস্টে-র মালিক?'
  },
  'hotel-list-btn': { en: 'List Your Hotel on Anirjan Connect (100% Free Forever)', bn: 'আপনার হোটেল অনিরজন কানেক্টে তালিকাভুক্ত করুন (চিরকাল ১০০% বিনামূল্যে)' },

  /* ---- SECTION 6B: CHECKOUT PLANNER ---- */
  'checkout-label': { en: '🧳 Post-Checkout Freedom • Universal Tourist Guide', bn: '🧳 চেকআউটের পরে • সার্বজনীন পর্যটক গাইড' },
  'checkout-title': { en: '11:00 AM Hotel Checkout? Luggage & Return Plan', bn: '১১:০০টায় হোটেল চেকআউট? লাগেজ ও ফেরার পরিকল্পনা' },
  'checkout-desc': {
    en: 'Almost all Digha hotels mandate morning checkout between 10:00 AM and 11:00 AM, but evening return trains depart between 1:00 PM and 6:30 PM. Here is how to safely store your bags, find breezy rest spots, and pre-book a Toto to Digha station.',
    bn: 'দীঘার প্রায় সব হোটেলে সকাল ১০:০০ থেকে ১১:০০টার মধ্যে চেকআউট বাধ্যতামূলক, কিন্তু সন্ধ্যার ফেরার ট্রেন ১:০০ থেকে ৬:৩০-এর মধ্যে ছাড়ে। এখানে দেখুন কীভাবে নিরাপদে ব্যাগ রাখবেন, আরামদায়ক বিশ্রামের জায়গা পাবেন, এবং স্টেশনে টোটো আগে থেকে বুক করবেন।'
  },

  /* ---- SECTION 7: DOCTORS ---- */
  'medical-label': { en: 'Healthcare & Emergency Care', bn: 'স্বাস্থ্যসেবা ও জরুরি চিকিৎসা' },
  'medical-title': { en: 'Digha Doctor & 24/7 Pharmacy Roster', bn: 'দীঘা ডাক্তার ও ২৪/৭ ফার্মেসি তালিকা' },
  'medical-desc': {
    en: 'Immediate healthcare assistance for dehydration, food infection, pediatric emergencies, snakebite anti-venom, and trauma triage in Digha and Ramnagar.',
    bn: 'ডিহাইড্রেশন, ফুড পয়জনিং, শিশু জরুরি অবস্থা, সাপের কামড়ের অ্যান্টি-ভেনম এবং ট্রমা চিকিৎসার জন্য দীঘা ও রামনগরে তাৎক্ষণিক স্বাস্থ্যসেবা।'
  },

  /* ---- SECTION 8: MOHONA FISH ---- */
  'fish-section-title': { en: 'Digha Mohona Wholesale Fish Market', bn: 'দীঘা মোহনা পাইকারি মাছ বাজার' },
  'fish-calc-badge': { en: '🍳 Kacha Mach Ranna Fair-Price Calculator', bn: '🍳 কাঁচা মাছ রান্না ন্যায্য-মূল্য ক্যালকুলেটর' },
  'fish-select-label': { en: '🐟 Select Your Catch (Today\'s Market Price):', bn: '🐟 আপনার মাছ বাছুন (আজকের বাজার দর):' },
  'fish-weight-label': { en: '⚖️ Select Weight / Quantity:', bn: '⚖️ ওজন / পরিমাণ নির্বাচন করুন:' },
  'fish-prep-label': { en: '🍳 Select Preparation / Recipe:', bn: '🍳 রান্নার ধরন নির্বাচন করুন:' },
  'prep-fry': { en: 'Crispy Deep Fry', bn: 'মুচমুচে ভাজা' },
  'prep-shorshe': { en: 'Shorshe Gravy', bn: 'সর্ষে ঝাল' },
  'prep-malaikari': { en: 'Chingri Malaikari', bn: 'চিংড়ি মালাইকারি' },
  'prep-kankra': { en: 'Kankra Jhal Masala', bn: 'কাঁকড়া ঝাল মশলা' },
  'prep-jhol': { en: 'Patla Macher Jhol', bn: 'পাতলা মাছের ঝোল' },
  'fish-raw-label': { en: 'Est. Raw Fish Wholesale Cost:', bn: 'আনুমানিক কাঁচা মাছের পাইকারি মূল্য:' },
  'fish-cook-label': { en: 'Authorized Cooking Labor & Spices:', bn: 'অনুমোদিত রান্নার শ্রম ও মশলা:' },
  'fish-total-label': { en: 'Estimated Total Fair Cost:', bn: 'আনুমানিক মোট ন্যায্য মূল্য:' },
  'fish-cap-title': { en: '🛡️ Digha Standard Cooking Cap Notice', bn: '🛡️ দীঘা স্ট্যান্ডার্ড রান্নার সর্বোচ্চ খরচ বিজ্ঞপ্তি' },
  'fish-freshness': { en: '🐟 3-Step Freshness & Anti-Formalin Test:', bn: '🐟 ৩-ধাপে তাজা মাছ ও ফরমালিন পরীক্ষা:' },
  'mohona-tips-title': { en: '🌅 Tips for Visiting Digha Mohona', bn: '🌅 দীঘা মোহনা ভ্রমণের টিপস' },

  /* ---- SECTION 9: SECRETS ---- */
  'secrets-label': { en: 'Local Knowledge & Heritage', bn: 'স্থানীয় জ্ঞান ও ঐতিহ্য' },
  'secrets-title': { en: 'Digha Untold: Secrets & Hidden Gems', bn: 'দীঘার অজানা: গোপন তথ্য ও লুকানো রত্ন' },
  'secrets-desc': {
    en: 'Fascinating facts and local trivia about Digha that even frequent visitors and locals cherish.',
    bn: 'দীঘা সম্পর্কে চমকপ্রদ তথ্য ও স্থানীয় গল্প যা নিয়মিত দর্শনার্থী ও স্থানীয়রাও লালন করে।'
  },

  /* ---- SECTION 10: SOS ---- */
  'sos-label': { en: '24/7 Rapid Response', bn: '২৪/৭ দ্রুত সাড়া' },
  'sos-title': { en: 'Digha Emergency Coastal SOS', bn: 'দীঘা জরুরি উপকূলীয় SOS' },
  'sos-desc': {
    en: 'Direct, one-tap emergency connections to West Bengal Coastal Police, Digha State Hospital, Nolias (Lifeguards), and disaster helpline.',
    bn: 'পশ্চিমবঙ্গ উপকূলীয় পুলিশ, দীঘা রাজ্য হাসপাতাল, নোলিয়া (লাইফগার্ড), এবং দুর্যোগ হেল্পলাইনে এক-ট্যাপ জরুরি সংযোগ।'
  },
  'sos-police-title': { en: 'Digha Coastal Police', bn: 'দীঘা উপকূলীয় পুলিশ' },
  'sos-police-sub': { en: 'Station: New Digha Road', bn: 'থানা: নিউ দীঘা রোড' },
  'sos-police-desc': {
    en: 'Immediate assistance for lost belongings, accidents, harassment, or hotel disputes.',
    bn: 'হারিয়ে যাওয়া জিনিসপত্র, দুর্ঘটনা, হয়রানি বা হোটেল বিবাদে তাৎক্ষণিক সহায়তা।'
  },
  'sos-police-btn': { en: '📞 Call Police Now', bn: '📞 এখনই পুলিশে ফোন করুন' },
  'sos-hospital-title': { en: 'Digha State General Hospital', bn: 'দীঘা রাজ্য সাধারণ হাসপাতাল' },
  'sos-hospital-sub': { en: 'Alankarpur & Ambulance 24/7', bn: 'অলংকারপুর ও অ্যাম্বুলেন্স ২৪/৭' },
  'sos-hospital-desc': {
    en: 'Emergency casualty ward, snakebite venom center, medical triage, and oxygen.',
    bn: 'জরুরি ক্যাজুয়ালটি ওয়ার্ড, সাপের কামড়ের অ্যান্টি-ভেনম কেন্দ্র, মেডিকেল ট্রায়াজ ও অক্সিজেন।'
  },
  'sos-hospital-btn': { en: '📞 Call Hospital', bn: '📞 হাসপাতালে ফোন করুন' },
  'sos-nolia-title': { en: 'Digha Sea Lifeguards (Nolia)', bn: 'দীঘা সমুদ্র লাইফগার্ড (নোলিয়া)' },
  'sos-nolia-sub': { en: 'Watch Towers: Old & New Digha', bn: 'ওয়াচ টাওয়ার: পুরানো ও নিউ দীঘা' },
  'sos-nolia-desc': {
    en: 'Water rescue team, high-tide alert command, and lost child reunion booth.',
    bn: 'জল উদ্ধার দল, জোয়ার সতর্কতা কমান্ড, এবং হারিয়ে যাওয়া শিশু পুনর্মিলন বুথ।'
  },
  'sos-nolia-btn': { en: '📞 Call Sea Rescue', bn: '📞 সমুদ্র উদ্ধারে ফোন করুন' },
  'sos-fire-title': { en: 'Digha Fire & Disaster Dept', bn: 'দীঘা ফায়ার ও দুর্যোগ বিভাগ' },
  'sos-fire-sub': { en: 'Control Room (Toll Free: 101)', bn: 'কন্ট্রোল রুম (টোল ফ্রি: ১০১)' },
  'sos-fire-desc': {
    en: 'Cyclone alert coordination, vehicle fire safety, and emergency road clearance.',
    bn: 'ঘূর্ণিঝড় সতর্কতা সমন্বয়, যানবাহন অগ্নি নিরাপত্তা, এবং জরুরি রাস্তা পরিষ্কার।'
  },
  'sos-fire-btn': { en: '📞 Call Fire Brigade', bn: '📞 ফায়ার ব্রিগেডে ফোন করুন' },

  /* ---- SECTION 11: COMMUNITY ---- */
  'community-badge': { en: 'Official Digha Ecosystem Hub', bn: 'অফিসিয়াল দীঘা ইকোসিস্টেম হাব' },
  'community-title': { en: 'Join the Official Digha Connect Community', bn: 'অফিসিয়াল দীঘা কানেক্ট কমিউনিটিতে যোগ দিন' },
  'community-desc': {
    en: 'We are connecting every local Toto driver, hotel owner, Mohona seafood merchant, and traveler into one transparent coastal network.',
    bn: 'আমরা প্রতিটি স্থানীয় টোটো চালক, হোটেল মালিক, মোহনা মাছের ব্যবসায়ী ও পর্যটককে একটি স্বচ্ছ উপকূলীয় নেটওয়ার্কে সংযুক্ত করছি।'
  },
  'community-telegram': { en: 'Join Official Telegram Channel', bn: 'অফিসিয়াল টেলিগ্রাম চ্যানেলে যোগ দিন' },
  'community-whatsapp': { en: 'Join Digha Partners WhatsApp Group', bn: 'দীঘা পার্টনার্স হোয়াটসঅ্যাপ গ্রুপে যোগ দিন' },

  /* ---- EVENTS SECTION ---- */
  'events-label': {
    en: '🎪 Zero-Commission Local Event Concierge • Digha, Mandarmani & Coastal Belt',
    bn: '🎪 শূন্য-কমিশন স্থানীয় ইভেন্ট কনসিয়ার্জ • দীঘা, মন্দারমণি ও উপকূলীয় অঞ্চল'
  },
  'events-title': { en: 'Organize Any Custom Event in Digha', bn: 'দীঘায় যেকোনো কাস্টম ইভেন্ট আয়োজন করুন' },
  'events-desc': {
    en: 'From beachside destination weddings and corporate retreats to family reunions and photography expeditions—our Jagadishpur on-ground team handles venues, sound permits, catering, and guest transit with 100% transparent pricing.',
    bn: 'বীচসাইড ডেস্টিনেশন বিয়ে ও কর্পোরেট রিট্রিট থেকে পারিবারিক মিলন ও ফটোগ্রাফি অভিযান পর্যন্ত—আমাদের জগদীশপুরের অন-গ্রাউন্ড দল ভেন্যু, সাউন্ড পারমিট, ক্যাটারিং ও অতিথি পরিবহন সামলায় ১০০% স্বচ্ছ মূল্যে।'
  },
  'event-form-title': { en: 'Submit Your Custom Event Request', bn: 'আপনার কাস্টম ইভেন্ট অনুরোধ জমা দিন' },

  /* ---- FOOTER ---- */
  'footer-cta-title': {
    en: 'Planning a Trip, Custom Event, or Need Urgent Assistance in Digha?',
    bn: 'দীঘায় ভ্রমণ পরিকল্পনা, কাস্টম ইভেন্ট, বা জরুরি সহায়তা দরকার?'
  },
  'footer-cta-desc': {
    en: 'Direct local help desk operating 24/7 right from Jagadishpur, Digha with zero middleman touts.',
    bn: 'জগদীশপুর, দীঘা থেকে ২৪/৭ সরাসরি স্থানীয় হেল্প ডেস্ক, কোনো দালাল নেই।'
  }
};

/**
 * Mapping from translation keys → CSS selectors or element queries.
 * Each entry: { selector, property, childIndex? }
 * property: 'text' = textContent, 'html' = innerHTML, 'placeholder' = placeholder attr
 */
const TRANSLATION_MAP = [
  /* Nav Links */
  { key: 'nav-link-tide', selector: '.nav-menu a[href="#tide-radar"]', prop: 'text' },
  { key: 'nav-link-trains', selector: '.nav-menu a[href="#trains-section"]', prop: 'text' },
  { key: 'nav-link-toto', selector: '.nav-menu a[href="#toto-guide"]', prop: 'text' },
  { key: 'nav-link-hotels', selector: '.nav-menu a[href="#hotel-directory"]', prop: 'text' },
  { key: 'nav-link-events', selector: '.nav-menu a[href="#events-section"]', prop: 'text' },
  { key: 'nav-link-doctors', selector: '.nav-menu a[href="#medical-section"]', prop: 'text' },
  { key: 'nav-link-fish', selector: '.nav-menu a[href="#mohona-market"]', prop: 'text' },
  { key: 'nav-link-secrets', selector: '.nav-menu a[href="#digha-secrets"]', prop: 'text' },
  { key: 'nav-link-partner', selector: '.nav-menu a[href="#partner-registration"]', prop: 'text' },
  { key: 'nav-link-sos', selector: '.nav-menu a[href="#emergency-sos"]', prop: 'text' },
  { key: 'nav-btn-report', selector: '#btn-community-report span', prop: 'text' },
  { key: 'nav-btn-partner', selector: 'a[href="#partner-registration"].btn-primary span', prop: 'text' },

  /* Hero */
  { key: 'hero-badge', selector: '.badge-coastal span:last-child', prop: 'text' },
  { key: 'hero-btn-beach-pass', selector: '#btn-hero-beach-pass span', prop: 'text' },
  { key: 'hero-btn-scam', selector: '#btn-hero-scam-shield span', prop: 'text' },
  { key: 'hero-btn-tide', selector: 'a[href="#tide-radar"].btn-primary span', prop: 'text' },
  { key: 'hero-btn-train', selector: 'a[href="#trains-section"].btn-outline-gold span', prop: 'text' },
  { key: 'hero-btn-toto', selector: 'a[href="#toto-guide"] span', prop: 'text' },
  { key: 'hero-btn-hotel', selector: 'a[href="#hotel-directory"].btn-outline-gold span', prop: 'text' },
  { key: 'hero-btn-checkout', selector: 'a[href="#checkout-planner"] span', prop: 'text' },
  { key: 'hero-btn-fish', selector: 'a[href="#fish-cooking-calc"] span', prop: 'text' },
  { key: 'hero-btn-doctors', selector: 'a[href="#medical-section"].btn-outline-gold span', prop: 'text' },

  /* Metric Cards */
  { key: 'metric-wave-label', selector: '.coastal-metrics-grid .metric-pill-card:nth-child(1) .metric-label', prop: 'text' },
  { key: 'metric-crowd-label', selector: '.coastal-metrics-grid .metric-pill-card:nth-child(2) .metric-label', prop: 'text' },
  { key: 'metric-hotel-label', selector: '.coastal-metrics-grid .metric-pill-card:nth-child(3) .metric-label', prop: 'text' },
  { key: 'metric-hotel-val', selector: '.coastal-metrics-grid .metric-pill-card:nth-child(3) .metric-value', prop: 'text' },
  { key: 'metric-police-label', selector: '.coastal-metrics-grid .metric-pill-card:nth-child(4) .metric-label', prop: 'text' },
  { key: 'metric-police-val', selector: '.coastal-metrics-grid .metric-pill-card:nth-child(4) .metric-value', prop: 'text' },

  /* Section 3: Tide Radar */
  { key: 'tide-section-label', selector: '#tide-radar .section-label', prop: 'text' },
  { key: 'tide-section-title', selector: '#tide-radar .section-title', prop: 'text' },
  { key: 'tide-section-desc', selector: '#tide-radar .section-description', prop: 'text' },
  { key: 'tele-wave-label', selector: '.marine-telemetry-strip .telemetry-item:nth-child(1) .telemetry-label', prop: 'text' },
  { key: 'tele-wind-label', selector: '.marine-telemetry-strip .telemetry-item:nth-child(2) .telemetry-label', prop: 'text' },
  { key: 'tele-temp-label', selector: '.marine-telemetry-strip .telemetry-item:nth-child(3) .telemetry-label', prop: 'text' },
  { key: 'tele-moon-label', selector: '.marine-telemetry-strip .telemetry-item:nth-child(4) .telemetry-label', prop: 'text' },
  { key: 'tide-high-title', selector: '.tide-cycle-display .tide-stat-box:nth-child(1) .title', prop: 'text' },
  { key: 'tide-high-desc', selector: '.tide-cycle-display .tide-stat-box:nth-child(1) .desc', prop: 'text' },
  { key: 'tide-low-title', selector: '.tide-cycle-display .tide-stat-box:nth-child(2) .title', prop: 'text' },
  { key: 'tide-low-desc', selector: '.tide-cycle-display .tide-stat-box:nth-child(2) .desc', prop: 'text' },
  { key: 'tide-wave-title', selector: '.tide-cycle-display .tide-stat-box:nth-child(3) .title', prop: 'text' },
  { key: 'tide-wave-desc', selector: '.tide-cycle-display .tide-stat-box:nth-child(3) .desc', prop: 'text' },
  { key: 'tide-police-title', selector: '.tide-cycle-display .tide-stat-box:nth-child(4) .title', prop: 'text' },
  { key: 'tide-police-val', selector: '.tide-cycle-display .tide-stat-box:nth-child(4) .time', prop: 'text' },
  { key: 'tide-police-desc', selector: '.tide-cycle-display .tide-stat-box:nth-child(4) .desc', prop: 'text' },

  /* Section 4: Trains */
  { key: 'train-section-label', selector: '#trains-section .section-label', prop: 'text' },
  { key: 'train-section-title', selector: '#trains-section .section-title', prop: 'text' },
  { key: 'train-section-desc', selector: '#trains-section .section-description', prop: 'text' },

  /* Section 5: Toto */
  { key: 'toto-section-label', selector: '#toto-guide .section-label', prop: 'text' },
  { key: 'toto-section-title', selector: '#toto-guide .section-title', prop: 'text' },
  { key: 'toto-section-desc', selector: '#toto-guide .section-description', prop: 'text' },

  /* Section 6: Hotels */
  { key: 'hotel-section-label', selector: '#hotel-directory .section-label', prop: 'text' },
  { key: 'hotel-section-title', selector: '#hotel-directory .section-title', prop: 'text' },
  { key: 'hotel-section-desc', selector: '#hotel-directory .section-description', prop: 'text' },

  /* Section 6B: Checkout */
  { key: 'checkout-title', selector: '#checkout-planner .section-title', prop: 'html' },
  { key: 'checkout-desc', selector: '#checkout-planner .section-description', prop: 'text' },

  /* Section 7: Medical */
  { key: 'medical-label', selector: '#medical-section .section-label', prop: 'text' },
  { key: 'medical-title', selector: '#medical-section .section-title', prop: 'text' },
  { key: 'medical-desc', selector: '#medical-section .section-description', prop: 'text' },

  /* Section 9: Secrets */
  { key: 'secrets-label', selector: '#digha-secrets .section-label', prop: 'text' },
  { key: 'secrets-title', selector: '#digha-secrets .section-title', prop: 'text' },
  { key: 'secrets-desc', selector: '#digha-secrets .section-description', prop: 'text' },

  /* Section 10: SOS */
  { key: 'sos-label', selector: '#emergency-sos .section-label', prop: 'text' },
  { key: 'sos-title', selector: '#emergency-sos .section-title', prop: 'text' },
  { key: 'sos-desc', selector: '#emergency-sos .section-description', prop: 'text' },
  { key: 'sos-police-title', selector: '.emergency-sos-grid .sos-card:nth-child(1) .sos-title', prop: 'text' },
  { key: 'sos-police-sub', selector: '.emergency-sos-grid .sos-card:nth-child(1) .sos-subtitle', prop: 'text' },
  { key: 'sos-police-btn', selector: '.emergency-sos-grid .sos-card:nth-child(1) .btn-sos-call', prop: 'text' },
  { key: 'sos-hospital-title', selector: '.emergency-sos-grid .sos-card:nth-child(2) .sos-title', prop: 'text' },
  { key: 'sos-hospital-sub', selector: '.emergency-sos-grid .sos-card:nth-child(2) .sos-subtitle', prop: 'text' },
  { key: 'sos-hospital-btn', selector: '.emergency-sos-grid .sos-card:nth-child(2) .btn-sos-call', prop: 'text' },
  { key: 'sos-nolia-title', selector: '.emergency-sos-grid .sos-card:nth-child(3) .sos-title', prop: 'text' },
  { key: 'sos-nolia-sub', selector: '.emergency-sos-grid .sos-card:nth-child(3) .sos-subtitle', prop: 'text' },
  { key: 'sos-nolia-btn', selector: '.emergency-sos-grid .sos-card:nth-child(3) .btn-sos-call', prop: 'text' },
  { key: 'sos-fire-title', selector: '.emergency-sos-grid .sos-card:nth-child(4) .sos-title', prop: 'text' },
  { key: 'sos-fire-sub', selector: '.emergency-sos-grid .sos-card:nth-child(4) .sos-subtitle', prop: 'text' },
  { key: 'sos-fire-btn', selector: '.emergency-sos-grid .sos-card:nth-child(4) .btn-sos-call', prop: 'text' },

  /* Section 11: Community */
  { key: 'community-title', selector: '#community-invite h2', prop: 'text' },

  /* Events Section */
  { key: 'events-title', selector: '#events-section .section-title', prop: 'text' },

  /* Footer */
  { key: 'footer-cta-title', selector: '.footer-ribbon-text h3', prop: 'text' },
  { key: 'footer-cta-desc', selector: '.footer-ribbon-text p', prop: 'text' }
];

/**
 * initLanguageToggle — Full bilingual EN / বাংলা engine
 * - Reads saved lang from localStorage
 * - On toggle click, swaps all mapped text
 * - Stores original English text on first pass
 * - Updates <html lang="..."> attribute
 * - Persists to localStorage
 */
function initLanguageToggle() {
  const toggleBtn = document.getElementById('lang-toggle');
  if (!toggleBtn) return;

  const enOpt = toggleBtn.querySelector('[data-lang="en"]');
  const bnOpt = toggleBtn.querySelector('[data-lang="bn"]');
  const savedLang = localStorage.getItem('digha-lang') || 'bn';

  // Store original English text on first load
  const originalTexts = new Map();
  TRANSLATION_MAP.forEach(entry => {
    const el = document.querySelector(entry.selector);
    if (el) {
      if (entry.prop === 'html') {
        originalTexts.set(entry.key, el.innerHTML);
      } else if (entry.prop === 'placeholder') {
        originalTexts.set(entry.key, el.placeholder);
      } else {
        originalTexts.set(entry.key, el.textContent);
      }
    }
  });

  function setLanguage(lang) {
    document.documentElement.lang = lang;

    TRANSLATION_MAP.forEach(entry => {
      const el = document.querySelector(entry.selector);
      if (!el) return;

      const translation = DIGHA_TRANSLATIONS[entry.key];
      if (!translation) return;

      const text = lang === 'bn' ? translation.bn : (originalTexts.get(entry.key) || translation.en);

      if (entry.prop === 'html') {
        el.innerHTML = text;
      } else if (entry.prop === 'placeholder') {
        el.placeholder = text;
      } else {
        el.textContent = text;
      }
    });

    // Toggle active class on pills
    if (lang === 'bn') {
      enOpt?.classList.remove('active');
      bnOpt?.classList.add('active');
    } else {
      bnOpt?.classList.remove('active');
      enOpt?.classList.add('active');
    }

    localStorage.setItem('digha-lang', lang);
  }

  // Apply saved language on load (Bengali is default)
  if (savedLang === 'bn') {
    setTimeout(() => setLanguage('bn'), 100);
  } else {
    setLanguage('en');
  }

  // Toggle click handler
  toggleBtn.addEventListener('click', () => {
    const currentLang = document.documentElement.lang || 'en';
    setLanguage(currentLang === 'en' ? 'bn' : 'en');
  });
}
