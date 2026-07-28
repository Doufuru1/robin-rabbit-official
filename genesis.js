(function () {
  'use strict';

  // Particle background
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let width, height;
  const maxParticles = Math.min(80, window.innerWidth < 768 ? 40 : 80);

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.size = Math.random() * 2 + 1;
      this.alpha = Math.random() * 0.5 + 0.2;
      this.color = Math.random() > 0.6 ? '#00F0D1' : '#1CF2A4';
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha;
      ctx.fill();
    }
  }

  for (let i = 0; i < maxParticles; i++) particles.push(new Particle());

  let mouse = { x: null, y: null };
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });

  function animate() {
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = 1;
    for (const p of particles) { p.update(); p.draw(); }
    ctx.lineWidth = 0.6;
    for (let i = 0; i < particles.length; i++) {
      let a = particles[i];
      let dx = mouse.x - a.x;
      let dy = mouse.y - a.y;
      let d = Math.hypot(dx, dy);
      if (mouse.x && d < 140) {
        ctx.beginPath();
        ctx.strokeStyle = '#00F0D1';
        ctx.globalAlpha = 0.15 * (1 - d / 140);
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
      for (let j = i + 1; j < particles.length; j++) {
        let b = particles[j];
        let dx2 = a.x - b.x;
        let dy2 = a.y - b.y;
        let d2 = Math.hypot(dx2, dy2);
        if (d2 < 90) {
          ctx.beginPath();
          ctx.strokeStyle = a.color;
          ctx.globalAlpha = 0.1 * (1 - d2 / 90);
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }
  animate();

  // Navbar scroll effect
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // Mobile nav toggle
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  navLinks.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Reveal on scroll
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('active');
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach((el) => observer.observe(el));

  // Animated stat counters
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const duration = 1800;
      const start = performance.now();
      function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = target * ease;
        el.textContent = (Number.isInteger(target) ? Math.round(current) : current.toFixed(1)) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      statObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat-value').forEach((el) => statObserver.observe(el));

  // Mint progress (demo values)
  const TOTAL = 200;
  let minted = 0; // In production, fetch from contract
  const fill = document.getElementById('mint-progress-fill');
  const mintedLabel = document.getElementById('minted-label');
  const percentLabel = document.getElementById('percent-label');

  function updateProgress() {
    const percent = Math.round((minted / TOTAL) * 100);
    if (fill) fill.style.width = percent + '%';
    if (mintedLabel) mintedLabel.textContent = `已认购 ${minted} / ${TOTAL}`;
    if (percentLabel) percentLabel.textContent = percent + '%';
  }

  const progressObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        updateProgress();
        progressObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  if (fill) progressObserver.observe(fill.closest('.mint-progress') || fill);

  // Quantity control
  const qtyMinus = document.getElementById('qty-minus');
  const qtyPlus = document.getElementById('qty-plus');
  const qtyValue = document.getElementById('qty-value');
  const totalPrice = document.getElementById('total-price');
  const mintBtn = document.getElementById('mint-btn');
  const modal = document.getElementById('mint-modal');
  const modalClose = document.getElementById('modal-close');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');

  let quantity = 1;
  const PRICE = 1;
  const MAX_PER_WALLET = 1;
  const REMAINING = TOTAL - minted;

  function updateQuantity() {
    if (!qtyValue || !totalPrice || !qtyMinus || !qtyPlus) return;
    quantity = Math.max(1, Math.min(MAX_PER_WALLET, Math.min(quantity, REMAINING)));
    qtyValue.textContent = quantity;
    totalPrice.textContent = (quantity * PRICE) + ' BNB';
    qtyMinus.disabled = quantity <= 1;
    qtyPlus.disabled = quantity >= MAX_PER_WALLET || quantity >= REMAINING;
  }
  updateQuantity();

  if (qtyMinus) {
    qtyMinus.addEventListener('click', () => { quantity--; updateQuantity(); });
  }
  if (qtyPlus) {
    qtyPlus.addEventListener('click', () => { quantity++; updateQuantity(); });
  }

  if (mintBtn) {
    mintBtn.addEventListener('click', () => {
      if (!modal) return;
      modalTitle.textContent = '连接钱包';
      modalMessage.textContent = `你选择了 ${quantity} 张 Genesis NFT，需支付 ${quantity * PRICE} BNB。当前为演示界面，请使用 BNB Chain 钱包连接并完成认购。`;
      modal.classList.add('active');
    });
  }

  if (modalClose) {
    modalClose.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  // Smooth anchor offset
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });
})();
