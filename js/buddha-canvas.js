/**
 * ANIRJAN SACRED COSMIC BUDDHA & CELESTIAL ORBITS ENGINE
 * 
 * An imaginative, transcendent 60FPS particle cosmos featuring:
 * 1. High-Definition Meditating Buddha in Sacred Padmasana Posture
 * 2. Radiant Aureole Rays & Golden Prabhavali Halo
 * 3. Crown Ushnisha Wisdom Flame & Radiant Third Eye (Ajna)
 * 4. Pulsating Heart Chakra Resonance Node (Anahata)
 * 5. Intricate Dhyana Mudra (Meditative Folded Hands in Lap)
 * 6. Blooming Multi-Petaled Lotus Throne Base
 * 7. Sacred Geometric Constellation Light Web
 * 8. 6 Multi-Tier 3D Orbiting Planets with Glowing Stardust Tails & Moons
 * 9. Fluid Touch/Mouse Wave Ripples with Restorative Spring Relaxation
 */

class BuddhaCosmicCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.contourParticles = [];
    this.auraRays = [];
    this.planets = [];
    this.stars = [];
    this.mouse = { x: null, y: null, radius: 150, active: false };
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = 0;
    this.height = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.buddhaScale = 1;
    this.animationFrameId = null;
    this.time = 0;
    this.isPaused = false;
    this.showConstellations = true;
    this.showAuraRays = true;
    this.tiltAngle = 0.30; // 3D Perspective Tilt

    this.init();
  }

  init() {
    this.resize();
    this.createStarfield(150);
    this.initAuraRays(36);
    this.generateSacredBuddha();
    this.initPlanetarySystem();
    this.attachEventListeners();
    this.animate();
  }

  resize() {
    const parent = this.canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);

    this.centerX = this.width / 2;
    this.centerY = this.height * 0.50; // Centered in the top celestial stage
    this.buddhaScale = Math.min(this.width, this.height) * 0.52;

    if (this.particles.length > 0) {
      this.generateSacredBuddha();
      this.initPlanetarySystem();
    }
  }

  attachEventListeners() {
    window.addEventListener('resize', () => this.resize());
    
    if (window.ResizeObserver && this.canvas.parentElement) {
      const ro = new ResizeObserver(() => this.resize());
      ro.observe(this.canvas.parentElement);
    }

    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.active = true;
    });

    window.addEventListener('mouseleave', () => {
      this.mouse.active = false;
      this.mouse.x = null;
      this.mouse.y = null;
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.touches[0].clientX - rect.left;
        this.mouse.y = e.touches[0].clientY - rect.top;
        this.mouse.active = true;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.mouse.active = false;
    });
  }

  createStarfield(count) {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 1.6 + 0.4,
        alpha: Math.random() * 0.7 + 0.2,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        color: Math.random() > 0.35 ? '#f3c276' : '#4deeea'
      });
    }
  }

  initAuraRays(count) {
    this.auraRays = [];
    for (let i = 0; i < count; i++) {
      this.auraRays.push({
        angle: (i / count) * Math.PI * 2,
        length: Math.random() * 0.35 + 0.65,
        speed: Math.random() * 0.005 + 0.002,
        alpha: Math.random() * 0.4 + 0.2
      });
    }
  }

  /**
   * Generates high-definition, transcendent sacred Buddha point-cloud
   */
  generateSacredBuddha() {
    this.particles = [];
    this.contourParticles = [];
    const scale = this.buddhaScale;
    const isMobile = this.width < 768;
    const totalPoints = isMobile ? 2600 : 4800;

    for (let i = 0; i < totalPoints; i++) {
      const pt = this.sampleSacredGeometry(scale);
      if (pt) {
        const particle = {
          homeX: this.centerX + pt.x,
          homeY: this.centerY + pt.y,
          x: this.centerX + pt.x + (Math.random() - 0.5) * 12,
          y: this.centerY + pt.y + (Math.random() - 0.5) * 12,
          vx: 0,
          vy: 0,
          size: pt.size || (Math.random() * 1.5 + 0.8),
          baseAlpha: pt.alpha || (Math.random() * 0.6 + 0.4),
          alpha: pt.alpha || 0.6,
          color: pt.color || this.getPointColor(pt.region),
          harmonicOffset: Math.random() * Math.PI * 2,
          region: pt.region,
          isContour: pt.isContour || false
        };

        this.particles.push(particle);
        if (particle.isContour) {
          this.contourParticles.push(particle);
        }
      }
    }
  }

  getPointColor(region) {
    switch(region) {
      case 'haloRing': return '#ffea79'; // Luminous golden halo
      case 'haloRays': return '#fef08a';
      case 'thirdEye': return '#67e8f9'; // Ethereal Third Eye Cyan
      case 'ushnisha': return '#fde047'; // Crown of wisdom
      case 'head': return '#fbe6c2';
      case 'heart': return '#4deeea'; // Heart Chakra Emerald/Cyan
      case 'dhyanaHands': return '#fed7aa'; // Meditative hands in lap
      case 'lotusPetals': return '#f472b6'; // Lotus pink stardust
      case 'base': return '#f3c276';
      default: return '#f3c276';
    }
  }

  /**
   * Mathematical and artistic sampling of Meditating Buddha in Padmasana
   */
  sampleSacredGeometry(scale) {
    const r = Math.random();
    const s = scale * 0.58;

    // 1. Radiant Prabhavali Aureole (Golden Outer Halo Ring & Starlight Beams) (18%)
    if (r < 0.18) {
      const angle = Math.random() * Math.PI * 2;
      const isBeam = Math.random() > 0.7;
      const ringRadius = isBeam ? (s * 0.42 + Math.random() * s * 0.22) : (s * 0.40 + Math.random() * s * 0.08);
      return {
        x: Math.cos(angle) * ringRadius,
        y: Math.sin(angle) * ringRadius - s * 0.40,
        region: isBeam ? 'haloRays' : 'haloRing',
        size: isBeam ? 1.8 : (Math.random() * 1.5 + 0.8),
        alpha: Math.random() * 0.6 + 0.4,
        isContour: true
      };
    }

    // 2. Ushnisha Wisdom Flame & Crown Stardust (7%)
    if (r < 0.25) {
      const uAngle = Math.random() * Math.PI * 2;
      const uRad = Math.random() * (s * 0.08);
      const flameRise = Math.pow(Math.random(), 2) * (s * 0.14);
      return {
        x: Math.cos(uAngle) * uRad * (1 - flameRise / (s * 0.16)),
        y: -s * 0.82 - flameRise,
        region: 'ushnisha',
        size: Math.random() * 1.9 + 0.9,
        alpha: 0.92,
        isContour: true
      };
    }

    // 3. Head & Third Eye (Ajna Bindu) (14%)
    if (r < 0.39) {
      const theta = Math.random() * Math.PI * 2;
      const hRadX = s * 0.18 * Math.sqrt(Math.random());
      const hRadY = s * 0.22 * Math.sqrt(Math.random());
      const yP = -s * 0.54 + Math.sin(theta) * hRadY;
      const xP = Math.cos(theta) * hRadX;

      const isThirdEye = Math.abs(xP) < s * 0.025 && Math.abs(yP - (-s * 0.58)) < s * 0.03;

      return {
        x: xP,
        y: yP,
        region: isThirdEye ? 'thirdEye' : 'head',
        size: isThirdEye ? 2.6 : (Math.random() * 1.4 + 0.8),
        alpha: isThirdEye ? 1.0 : (Math.random() * 0.7 + 0.35),
        isContour: Math.abs(xP) > s * 0.14
      };
    }

    // 4. Meditative Torso, Shoulders & Robe Drapes (25%)
    if (r < 0.64) {
      const tY = Math.random();
      const shoulderSpread = (0.20 + Math.sin(tY * Math.PI) * 0.38) * s;
      const xP = (Math.random() - 0.5) * 2 * shoulderSpread;
      const yP = -s * 0.32 + tY * (s * 0.54);

      const isHeart = Math.abs(xP) < s * 0.07 && Math.abs(yP + s * 0.05) < s * 0.07;

      return {
        x: xP,
        y: yP,
        region: isHeart ? 'heart' : 'torso',
        size: isHeart ? 2.2 : (Math.random() * 1.3 + 0.7),
        alpha: isHeart ? 1.0 : (Math.random() * 0.65 + 0.35),
        isContour: Math.abs(xP) > shoulderSpread * 0.85
      };
    }

    // 5. Folded Meditative Hands (Dhyana Mudra in Lap) (8%)
    if (r < 0.72) {
      const hX = (Math.random() - 0.5) * s * 0.30;
      const hY = s * 0.20 + Math.random() * (s * 0.08);
      return {
        x: hX,
        y: hY,
        region: 'dhyanaHands',
        size: Math.random() * 1.6 + 0.8,
        alpha: 0.88,
        isContour: true
      };
    }

    // 6. Seated Folded Legs (Padmasana Lotus Base) (18%)
    if (r < 0.90) {
      const legAngle = (Math.random() - 0.5) * Math.PI * 0.95;
      const legSpread = s * (0.64 + Math.random() * 0.42);
      const legHeight = s * 0.25 * Math.random();
      const bX = Math.cos(legAngle) * legSpread * (Math.random() > 0.5 ? 1 : -1);
      const bY = s * 0.28 + legHeight + Math.sin(legAngle) * (s * 0.09);

      return {
        x: bX,
        y: bY,
        region: 'base',
        size: Math.random() * 1.5 + 0.7,
        alpha: Math.random() * 0.6 + 0.35,
        isContour: Math.abs(bX) > s * 0.7
      };
    }

    // 7. Blooming Lotus Petal Throne Base (10%)
    const petalIdx = Math.floor(Math.random() * 10);
    const pAngle = (petalIdx / 10) * Math.PI * 2;
    const pRad = s * (0.78 + Math.random() * 0.28);
    return {
      x: Math.cos(pAngle) * pRad,
      y: s * 0.46 + Math.sin(pAngle) * (s * 0.14) + Math.random() * (s * 0.06),
      region: 'lotusPetals',
      size: Math.random() * 1.6 + 0.7,
      alpha: Math.random() * 0.7 + 0.3,
      isContour: true
    };
  }

  /**
   * Initializes Celestial Orbiting Planetary System
   */
  initPlanetarySystem() {
    const baseRadius = this.buddhaScale * 0.88;

    this.planets = [
      {
        name: 'Mercury',
        radiusX: baseRadius * 0.72,
        radiusY: baseRadius * 0.72 * this.tiltAngle,
        size: 4.2,
        color: '#e2e8f0',
        glowColor: 'rgba(226, 232, 240, 0.75)',
        speed: 0.016,
        angle: 0.8,
        trail: [],
        maxTrail: 25
      },
      {
        name: 'Venus',
        radiusX: baseRadius * 1.05,
        radiusY: baseRadius * 1.05 * this.tiltAngle,
        size: 5.4,
        color: '#f3c276',
        glowColor: 'rgba(243, 194, 118, 0.88)',
        speed: 0.012,
        angle: 2.3,
        trail: [],
        maxTrail: 32
      },
      {
        name: 'Earth & Moon',
        radiusX: baseRadius * 1.45,
        radiusY: baseRadius * 1.45 * this.tiltAngle,
        size: 6.8,
        color: '#4deeea',
        glowColor: 'rgba(77, 238, 234, 0.95)',
        speed: 0.009,
        angle: 4.5,
        hasMoon: true,
        moonAngle: 0,
        trail: [],
        maxTrail: 40
      },
      {
        name: 'Mars',
        radiusX: baseRadius * 1.85,
        radiusY: baseRadius * 1.85 * this.tiltAngle,
        size: 5.0,
        color: '#f87171',
        glowColor: 'rgba(248, 113, 113, 0.85)',
        speed: 0.007,
        angle: 1.4,
        trail: [],
        maxTrail: 35
      },
      {
        name: 'Jupiter (The King)',
        radiusX: baseRadius * 2.28,
        radiusY: baseRadius * 2.28 * this.tiltAngle,
        size: 9.2,
        color: '#fed7aa',
        glowColor: 'rgba(254, 215, 170, 0.92)',
        speed: 0.0045,
        angle: 3.7,
        trail: [],
        maxTrail: 50
      },
      {
        name: 'Saturn (Ringed Wonder)',
        radiusX: baseRadius * 2.70,
        radiusY: baseRadius * 2.70 * this.tiltAngle,
        size: 8.0,
        color: '#fde047',
        glowColor: 'rgba(253, 224, 71, 0.85)',
        speed: 0.003,
        angle: 5.8,
        hasWideRings: true,
        trail: [],
        maxTrail: 60
      }
    ];
  }

  animate() {
    if (!this.isPaused) {
      this.time += 0.02;
      this.ctx.clearRect(0, 0, this.width, this.height);

      this.renderStarfield();
      if (this.showAuraRays) {
        this.renderAuraBeams();
      }
      this.renderOrbitRings();
      if (this.showConstellations) {
        this.renderConstellationWebs();
      }
      this.updateAndRenderParticles();
      this.updateAndRenderPlanets();
    }

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  renderStarfield() {
    for (let star of this.stars) {
      star.alpha += Math.sin(this.time * 5 + star.x) * (star.twinkleSpeed * 0.5);
      const currentAlpha = Math.max(0.1, Math.min(0.9, star.alpha));
      this.ctx.fillStyle = star.color;
      this.ctx.globalAlpha = currentAlpha;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }

  renderAuraBeams() {
    const s = this.buddhaScale * 0.58;
    const headY = this.centerY - s * 0.40;
    this.ctx.save();

    for (let ray of this.auraRays) {
      ray.angle += ray.speed;
      const len = s * (0.55 + Math.sin(this.time * 2 + ray.angle * 4) * 0.1) * ray.length;
      const x2 = this.centerX + Math.cos(ray.angle) * len;
      const y2 = headY + Math.sin(ray.angle) * len;

      const grad = this.ctx.createLinearGradient(this.centerX, headY, x2, y2);
      grad.addColorStop(0, 'rgba(243, 194, 118, 0.25)');
      grad.addColorStop(1, 'transparent');

      this.ctx.beginPath();
      this.ctx.moveTo(this.centerX, headY);
      this.ctx.lineTo(x2, y2);
      this.ctx.strokeStyle = grad;
      this.ctx.lineWidth = 1.2;
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  renderOrbitRings() {
    this.ctx.save();
    for (let planet of this.planets) {
      this.ctx.beginPath();
      this.ctx.ellipse(
        this.centerX,
        this.centerY,
        planet.radiusX,
        planet.radiusY,
        0,
        0,
        Math.PI * 2
      );
      this.ctx.strokeStyle = 'rgba(243, 194, 118, 0.08)';
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([4, 8]);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  renderConstellationWebs() {
    const count = this.contourParticles.length;
    const maxDist = 30;
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(243, 194, 118, 0.09)';
    this.ctx.lineWidth = 0.7;

    for (let i = 0; i < count; i += 2) {
      const p1 = this.contourParticles[i];
      for (let j = i + 1; j < Math.min(i + 8, count); j++) {
        const p2 = this.contourParticles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }
    this.ctx.restore();
  }

  updateAndRenderParticles() {
    const mouse = this.mouse;
    const isAudioActive = window.anirjanAudio && window.anirjanAudio.isPlaying;
    const audioPulse = isAudioActive ? Math.sin(this.time * 3) * 2.2 : 0;

    for (let p of this.particles) {
      const driftX = Math.cos(this.time + p.harmonicOffset) * 1.8;
      const driftY = Math.sin(this.time + p.harmonicOffset) * 2.4;

      const targetX = p.homeX + driftX;
      const targetY = p.homeY + driftY + (p.region === 'haloRing' || p.region === 'heart' ? audioPulse : 0);

      // Mouse interactive wave ripple repulsion
      if (mouse.active && mouse.x !== null && mouse.y !== null) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius && dist > 0) {
          const force = (1 - dist / mouse.radius) * 7.5;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }

      // Restorative spring damping physics
      p.vx += (targetX - p.x) * 0.045;
      p.vy += (targetY - p.y) * 0.045;

      p.vx *= 0.85;
      p.vy *= 0.85;

      p.x += p.vx;
      p.y += p.vy;

      // Glow flicker
      const flicker = Math.sin(this.time * 2.5 + p.harmonicOffset) * 0.18;
      const alpha = Math.max(0.2, Math.min(1, p.baseAlpha + flicker));

      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;
  }

  updateAndRenderPlanets() {
    for (let planet of this.planets) {
      planet.angle += planet.speed;

      const px = this.centerX + Math.cos(planet.angle) * planet.radiusX;
      const py = this.centerY + Math.sin(planet.angle) * planet.radiusY;

      planet.trail.push({ x: px, y: py, alpha: 0.7 });
      if (planet.trail.length > planet.maxTrail) {
        planet.trail.shift();
      }

      // Stardust trail
      for (let i = 0; i < planet.trail.length; i++) {
        const pt = planet.trail[i];
        const progress = i / planet.trail.length;
        this.ctx.beginPath();
        this.ctx.arc(pt.x, pt.y, planet.size * 0.45 * progress, 0, Math.PI * 2);
        this.ctx.fillStyle = planet.color;
        this.ctx.globalAlpha = progress * 0.4;
        this.ctx.fill();
      }

      // Planet Body
      this.ctx.save();
      this.ctx.shadowColor = planet.glowColor;
      this.ctx.shadowBlur = planet.size * 3.5;
      this.ctx.fillStyle = planet.color;
      this.ctx.globalAlpha = 1;
      this.ctx.beginPath();
      this.ctx.arc(px, py, planet.size, 0, Math.PI * 2);
      this.ctx.fill();

      // Saturn Rings
      if (planet.hasWideRings) {
        this.ctx.beginPath();
        this.ctx.ellipse(px, py, planet.size * 2.6, planet.size * 0.85, 0.4, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(253, 224, 71, 0.75)';
        this.ctx.lineWidth = 2.0;
        this.ctx.stroke();
      }

      // Moon
      if (planet.hasMoon) {
        planet.moonAngle = (planet.moonAngle || 0) + 0.06;
        const mx = px + Math.cos(planet.moonAngle) * 18;
        const my = py + Math.sin(planet.moonAngle) * 10;
        this.ctx.beginPath();
        this.ctx.arc(mx, my, 2.0, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = '#ffffff';
        this.ctx.fill();
      }

      this.ctx.restore();
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  toggleConstellations() {
    this.showConstellations = !this.showConstellations;
    return this.showConstellations;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.anirjanCanvas = new BuddhaCosmicCanvas('buddha-canvas');
});
