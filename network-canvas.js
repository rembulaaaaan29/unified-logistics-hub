// Unified Logistics Hub - Background Network Canvas & Node Visualizer

class LogisticsNetworkCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.nodes = [];
    this.particles = [];
    this.animId = null;
    
    this.init();
    window.addEventListener('resize', () => this.resize());
  }

  init() {
    this.resize();
    this.createNodes();
    this.createParticles(35);
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.updateNodePositions();
  }

  createNodes() {
    // 5 primary system nodes positioned proportionally
    const systemConfig = [
      { id: 'incustoms', label: 'InCustoms (AI)', px: 0.18, py: 0.35, color: '#3B82F6' },
      { id: 'homerpa', label: 'Home RPA (Orchestrator)', px: 0.50, py: 0.45, color: '#2563EB' },
      { id: 'vplus', label: 'VPLUS', px: 0.82, py: 0.30, color: '#06B6D4' },
      { id: 'uno', label: 'UNO Portal', px: 0.35, py: 0.78, color: '#6366F1' },
      { id: 'tms', label: 'TMS Logistics', px: 0.75, py: 0.75, color: '#10B981' }
    ];

    this.nodes = systemConfig.map(cfg => ({
      ...cfg,
      x: cfg.px * this.canvas.width,
      y: cfg.py * this.canvas.height,
      radius: 12,
      pulseRadius: 12,
      pulseDir: 1
    }));
  }

  updateNodePositions() {
    this.nodes.forEach(node => {
      node.x = node.px * this.canvas.width;
      node.y = node.py * this.canvas.height;
    });
  }

  createParticles(count) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.3 + 0.1
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background subtle grid mesh
    this.drawGridMesh();

    // Draw background floating particles
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(37, 99, 235, ${p.alpha})`;
      this.ctx.fill();
    });

    // Draw connecting lines between nodes
    const connections = [
      ['incustoms', 'homerpa'],
      ['homerpa', 'vplus'],
      ['homerpa', 'uno'],
      ['homerpa', 'tms'],
      ['vplus', 'tms'],
      ['incustoms', 'uno']
    ];

    connections.forEach(([id1, id2]) => {
      const n1 = this.nodes.find(n => n.id === id1);
      const n2 = this.nodes.find(n => n.id === id2);
      if (!n1 || !n2) return;

      // Draw faint geometric line
      this.ctx.beginPath();
      this.ctx.moveTo(n1.x, n1.y);
      this.ctx.lineTo(n2.x, n2.y);
      this.ctx.strokeStyle = 'rgba(37, 99, 235, 0.12)';
      this.ctx.lineWidth = 1.5;
      this.ctx.setLineDash([6, 4]);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Draw active data pulse traveling down line
      const time = Date.now() * 0.001;
      const speed = 0.3;
      const progress = (time * speed + (n1.x + n2.y) * 0.001) % 1;

      const px = n1.x + (n2.x - n1.x) * progress;
      const py = n1.y + (n2.y - n1.y) * progress;

      this.ctx.beginPath();
      this.ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      this.ctx.fillStyle = '#3B82F6';
      this.ctx.shadowColor = '#60A5FA';
      this.ctx.shadowBlur = 8;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });

    // Draw system nodes
    this.nodes.forEach(node => {
      // Pulse animation
      node.pulseRadius += 0.08 * node.pulseDir;
      if (node.pulseRadius > 22 || node.pulseRadius < 12) {
        node.pulseDir *= -1;
      }

      // Outer pulse ring
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.pulseRadius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `${node.color}33`;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      // Outer solid glow
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = node.color;
      this.ctx.shadowColor = node.color;
      this.ctx.shadowBlur = 12;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // Inner core
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fill();

      // Node label watermark text
      this.ctx.font = '11px Inter, sans-serif';
      this.ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(node.label, node.x, node.y + 26);
    });

    this.animId = requestAnimationFrame(() => this.animate());
  }

  drawGridMesh() {
    const spacing = 80;
    this.ctx.strokeStyle = 'rgba(226, 232, 240, 0.3)';
    this.ctx.lineWidth = 0.5;

    for (let x = 0; x < this.canvas.width; x += spacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }

    for (let y = 0; y < this.canvas.height; y += spacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }
}

window.LogisticsNetworkCanvas = LogisticsNetworkCanvas;
