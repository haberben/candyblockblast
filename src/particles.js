
export class ParticleEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.texts = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  addExplosion(x, y, color) {
    const count = 18;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        radius: 3 + Math.random() * 5,
        color: color || '#ff6b6b',
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.03,
        gravity: 0.12,
        type: 'sparkle',
        spin: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 0.1
      });
    }
  }

  addScoreFly(startX, startY, endX, endY, color) {
    const count = 3;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: startX + (Math.random() - 0.5) * 15,
        y: startY + (Math.random() - 0.5) * 15,
        targetX: endX,
        targetY: endY,
        vx: (Math.random() - 0.5) * 3,
        vy: -2 - Math.random() * 4,
        radius: 4 + Math.random() * 3,
        color: color || '#ffa64d',
        alpha: 1.0,
        type: 'fly',
        progress: 0,
        speed: 0.03 + Math.random() * 0.02
      });
    }
  }

  addText(text, x, y, scale = 1.0, subText = '') {
    this.texts.push({
      text: text,
      subText: subText,
      x: x,
      y: y,
      alpha: 1.0,
      scale: scale * 0.5,
      targetScale: scale,
      vy: -0.8,
      life: 70
    });
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (p.type === 'sparkle') {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.alpha -= p.decay;
        p.spin += p.spinSpeed;

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
        }
      } else if (p.type === 'fly') {
        p.progress += p.speed;
        if (p.progress >= 1.0) {
          this.particles.splice(i, 1);
        } else {
          const t = p.progress;
          const cpX = p.x + p.vx * 15;
          const cpY = p.y - 120;
          const u = 1 - t;
          p.currentX = u * u * p.x + 2 * u * t * cpX + t * t * p.targetX;
          p.currentY = u * u * p.y + 2 * u * t * cpY + t * t * p.targetY;
        }
      }
    }

    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.y += t.vy;
      t.life--;
      if (t.scale < t.targetScale) {
        t.scale += 0.08;
      }
      if (t.life < 20) {
        t.alpha = t.life / 20;
      }
      if (t.life <= 0) {
        this.texts.splice(i, 1);
      }
    }
  }

  draw() {
    this.clear();

    for (let p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;

      if (p.type === 'sparkle') {
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.spin);
        this.ctx.fillStyle = p.color;

        this.ctx.beginPath();
        const r = p.radius;
        this.ctx.moveTo(0, -r);
        this.ctx.lineTo(r * 0.4, -r * 0.4);
        this.ctx.lineTo(r, 0);
        this.ctx.lineTo(r * 0.4, r * 0.4);
        this.ctx.lineTo(0, r);
        this.ctx.lineTo(-r * 0.4, r * 0.4);
        this.ctx.lineTo(-r, 0);
        this.ctx.lineTo(-r * 0.4, -r * 0.4);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.type === 'fly') {
        const x = p.currentX || p.x;
        const y = p.currentY || p.y;
        this.ctx.fillStyle = p.color;
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.arc(x, y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }

    for (let t of this.texts) {
      this.ctx.save();
      this.ctx.globalAlpha = t.alpha;
      this.ctx.translate(t.x, t.y);
      this.ctx.scale(t.scale, t.scale);

      this.ctx.font = 'bold 34px "Outfit", Arial, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      this.ctx.strokeStyle = '#600650';
      this.ctx.lineWidth = 8;
      this.ctx.strokeText(t.text, 0, 0);

      const grad = this.ctx.createLinearGradient(0, -15, 0, 15);
      grad.addColorStop(0, '#ffff4d');
      grad.addColorStop(1, '#ff33aa');
      this.ctx.fillStyle = grad;
      this.ctx.fillText(t.text, 0, 0);

      this.ctx.font = 'bold 34px "Outfit", Arial, sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.globalAlpha = t.alpha * 0.4;
      this.ctx.fillText(t.text, 0, -2);

      if (t.subText) {
        this.ctx.globalAlpha = t.alpha;
        this.ctx.font = 'bold 20px "Outfit", Arial, sans-serif';
        this.ctx.strokeStyle = '#220022';
        this.ctx.lineWidth = 5;
        this.ctx.strokeText(t.subText, 0, 30);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(t.subText, 0, 30);
      }

      this.ctx.restore();
    }
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}
