// Daily Canvas Effect - Premium Algorithmic Background
const CANVAS_CONFIG = {
  colors: {
    0: { bg: '#040810', accent: '#f59e0b' }, // Sunday - Gold
    1: { bg: '#0f172a', accent: '#38bdf8' }, // Monday - Slate Blue
    2: { bg: '#1e1b4b', accent: '#818cf8' }, // Tuesday - Indigo
    3: { bg: '#064e3b', accent: '#10b981' }, // Wednesday - Emerald
    4: { bg: '#2e1065', accent: '#d946ef' }, // Thursday - Deep Purple
    5: { bg: '#020617', accent: '#e11d48' }, // Friday - Midnight Rose
    6: { bg: '#171717', accent: '#a3e635' }  // Saturday - Neon Green
  }
};

class DailyCanvas {
  constructor() {
    this.canvas = document.getElementById('daily-canvas');
    if (!this.canvas) return;
    
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.isActive = true;
    this.customColors = null;
    
    this.init();
    this.animate();
    
    window.addEventListener('resize', () => this.resize());
    
    // Listen for custom settings
    window.addEventListener('canvas-settings-changed', (e) => {
      if (e.detail.active !== undefined) {
        this.isActive = e.detail.active;
        this.canvas.style.display = this.isActive ? 'block' : 'none';
      }
      if (e.detail.colors) {
        this.customColors = e.detail.colors;
        this.createParticles(); // Recreate with new colors
      }
    });
  }

  init() {
    this.resize();
    this.createParticles();
    
    // Check local storage for settings
    try {
      const settings = JSON.parse(localStorage.getItem('daily_canvas_settings'));
      if (settings) {
        if (settings.active === false) {
          this.isActive = false;
          this.canvas.style.display = 'none';
        }
        if (settings.colors) {
          this.customColors = settings.colors;
        }
      }
    } catch(e) {}
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.createParticles();
  }

  getColors() {
    if (this.customColors) return this.customColors;
    const day = new Date().getDay();
    return CANVAS_CONFIG.colors[day];
  }

  createParticles() {
    this.particles = [];
    const count = window.innerWidth < 768 ? 40 : 80;
    const colors = this.getColors();
    
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        color: colors.accent,
        alpha: Math.random() * 0.5 + 0.1
      });
    }
  }

  animate() {
    if (!this.isActive) {
      requestAnimationFrame(() => this.animate());
      return;
    }
    
    const colors = this.getColors();
    
    // Slight fade effect for trails
    this.ctx.fillStyle = `${colors.bg}10`; // Very transparent background for trails
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw connections
    this.ctx.beginPath();
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 150) {
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
        }
      }
    }
    this.ctx.strokeStyle = `${colors.accent}15`;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Update and draw particles
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      
      if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
      
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `${p.color}${Math.floor(p.alpha * 255).toString(16).padStart(2, '0')}`;
      this.ctx.fill();
    });
    
    requestAnimationFrame(() => this.animate());
  }
}

function initDailyCanvas() {
    if (!document.getElementById('daily-canvas')) {
      const canvas = document.createElement('canvas');
      canvas.id = 'daily-canvas';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '-1';
      canvas.style.opacity = '0.5';
      canvas.style.mixBlendMode = 'screen';
      document.body.insertBefore(canvas, document.body.firstChild);
    }
    if (!window.dailyCanvasInstance) {
        window.dailyCanvasInstance = new DailyCanvas();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDailyCanvas);
} else {
    initDailyCanvas();
}
