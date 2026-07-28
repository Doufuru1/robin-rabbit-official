(function () {
  'use strict';

  const TREASURY_ADDRESS = '0xcf4b9c46fda9a2a3b5a2f5264f814d83b215dd87';
  const BNB_CHAIN_ID = 56;
  const BNB_CHAIN_HEX = '0x38';
  const BNB_RPC = 'https://bsc-dataseed.binance.org/';
  const MINT_PRICE_BNB = '1.0';
  const MAX_PER_WALLET = 1;
  const NFT_IMAGE = 'assets/robin-rabbit-genesis-nft.jpg';

  let signer = null;
  let userAddress = null;
  let provider = null;

  // Utility
  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  function truncateAddress(addr) {
    return addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : '';
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  function hasWallet() {
    return typeof window !== 'undefined' && !!window.ethereum && typeof window.ethereum.request === 'function';
  }

  function getWalletProvider() {
    if (!hasWallet()) return null;
    return window.ethereum;
  }

  // Particle background
  const canvas = document.getElementById('bg-canvas');
  if (canvas) {
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
  }

  // Navbar scroll effect
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  // Mobile nav toggle
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  if (navToggle && navLinks) {
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
  }

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

  // Mint progress
  const TOTAL = 200;
  let minted = 0;
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
  const walletStatus = document.getElementById('wallet-status');
  const walletStatusText = document.getElementById('wallet-status-text');
  const modal = document.getElementById('mint-modal');
  const modalClose = document.getElementById('modal-close');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const modalIcon = document.getElementById('modal-icon');
  const modalActions = document.getElementById('modal-actions');

  let quantity = 1;
  const PRICE = 1;

  function updateQuantity() {
    if (!qtyValue || !totalPrice || !qtyMinus || !qtyPlus) return;
    qtyValue.textContent = quantity;
    totalPrice.textContent = (quantity * PRICE) + ' BNB';
    qtyMinus.disabled = quantity <= 1;
    qtyPlus.disabled = quantity >= MAX_PER_WALLET;
  }
  updateQuantity();

  if (qtyMinus) qtyMinus.addEventListener('click', () => { quantity--; updateQuantity(); });
  if (qtyPlus) qtyPlus.addEventListener('click', () => { quantity++; updateQuantity(); });

  function showModal(title, message, icon, actionsHTML) {
    if (!modal) return;
    modalTitle.textContent = title || '';
    modalMessage.innerHTML = message || '';
    if (modalIcon) modalIcon.textContent = icon || '🐰';
    if (modalActions) modalActions.innerHTML = actionsHTML || '';
    modal.classList.add('active');
  }
  if (modalClose) modalClose.addEventListener('click', () => modal.classList.remove('active'));
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

  function updateWalletStatus() {
    if (!walletStatus || !walletStatusText) return;
    if (userAddress) {
      walletStatus.classList.add('connected');
      walletStatusText.textContent = `已连接：${truncateAddress(userAddress)}`;
    } else {
      walletStatus.classList.remove('connected');
      walletStatusText.textContent = '未连接钱包';
    }
  }

  function getMintedCount(address) {
    if (!address) return 0;
    try {
      const data = JSON.parse(localStorage.getItem('robinMinted') || '{}');
      return data[address.toLowerCase()] || 0;
    } catch { return 0; }
  }
  function setMintedCount(address, count) {
    if (!address) return;
    try {
      const data = JSON.parse(localStorage.getItem('robinMinted') || '{}');
      data[address.toLowerCase()] = count;
      localStorage.setItem('robinMinted', JSON.stringify(data));
    } catch {}
  }

  function showWalletOptions() {
    const currentUrl = encodeURIComponent(window.location.href);
    const metamaskMobile = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
    const trustMobile = `https://link.trustwallet.com/open_url?coin_id=20000714&url=${encodeURIComponent(window.location.href)}`;

    const desktopActions = `
      <a class="btn btn-primary" href="https://metamask.io/download/" target="_blank">🦊 安装 MetaMask</a>
      <a class="btn btn-outline" href="https://trustwallet.com/download" target="_blank">🛡️ 安装 Trust Wallet</a>
    `;
    const mobileActions = `
      <a class="btn btn-primary" href="${metamaskMobile}" target="_blank">🦊 在 MetaMask 中打开</a>
      <a class="btn btn-outline" href="${trustMobile}" target="_blank">🛡️ 在 Trust Wallet 中打开</a>
    `;
    const actions = isMobile() ? mobileActions : desktopActions;

    const manualHtml = `
      <div class="manual-card">
        <h4>💡 手动转账方式</h4>
        <p>如果你的浏览器无法直接连接钱包，也可以手动向以下地址转账 1 BNB（BNB Chain 网络）：</p>
        <div class="copy-row">
          <span id="copy-address">${TREASURY_ADDRESS}</span>
          <button class="btn btn-outline" id="copy-btn">复制</button>
        </div>
        <p class="modal-note">转账成功后，请截图保存交易哈希（TxHash），并联系官方客服登记。</p>
      </div>
    `;

    showModal(
      '未检测到钱包',
      `<p>请使用支持 BNB Chain 的钱包连接，或在钱包内置浏览器中打开本页面。</p>${manualHtml}`,
      '⚠️',
      actions
    );

    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        copyToClipboard(TREASURY_ADDRESS).then(() => {
          copyBtn.textContent = '已复制';
          setTimeout(() => copyBtn.textContent = '复制', 2000);
        });
      });
    }
  }

  async function ensureBnbChain() {
    const eth = getWalletProvider();
    const chainId = await eth.request({ method: 'eth_chainId' });
    if (chainId === BNB_CHAIN_HEX) return true;
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BNB_CHAIN_HEX }]
      });
      return true;
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: BNB_CHAIN_HEX,
              chainName: 'BNB Chain Mainnet',
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              rpcUrls: [BNB_RPC],
              blockExplorerUrls: ['https://bscscan.com']
            }]
          });
          return true;
        } catch (addError) { return false; }
      }
      return false;
    }
  }

  async function connectWallet() {
    if (!hasWallet()) {
      showWalletOptions();
      return false;
    }
    if (typeof ethers === 'undefined') {
      showModal('加载失败', '区块链连接库加载失败，请刷新页面或检查网络。', '⚠️');
      return false;
    }
    try {
      const eth = getWalletProvider();
      provider = new ethers.BrowserProvider(eth);
      await eth.request({ method: 'eth_requestAccounts' });
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== BNB_CHAIN_ID) {
        const switched = await ensureBnbChain();
        if (!switched) {
          showModal('网络切换失败', '请手动将钱包切换至 BNB Chain Mainnet（链 ID 56）。', '⚠️');
          return false;
        }
        provider = new ethers.BrowserProvider(eth);
      }
      signer = await provider.getSigner();
      userAddress = await signer.getAddress();
      updateWalletStatus();
      updateMintButton();
      renderMyNFTs();
      showModal('连接成功', `已连接钱包：${truncateAddress(userAddress)}，网络：BNB Chain。`, '✅');
      return true;
    } catch (err) {
      const msg = err?.message || '钱包连接被拒绝，请重试。';
      showModal('连接失败', msg, '❌');
      return false;
    }
  }

  function updateMintButton() {
    if (!mintBtn) return;
    if (!userAddress) {
      mintBtn.textContent = '连接钱包铸造';
      mintBtn.disabled = false;
      return;
    }
    const count = getMintedCount(userAddress);
    if (count >= MAX_PER_WALLET) {
      mintBtn.textContent = '已完成铸造';
      mintBtn.disabled = true;
    } else {
      mintBtn.textContent = '立即铸造（1 BNB）';
      mintBtn.disabled = false;
    }
  }

  async function mint() {
    if (!userAddress) {
      const ok = await connectWallet();
      if (!ok) return;
    }
    const count = getMintedCount(userAddress);
    if (count >= MAX_PER_WALLET) {
      showModal('铸造受限', '每个钱包最多铸造 1 张 Genesis NFT。', '⚠️');
      return;
    }
    if (typeof ethers === 'undefined') {
      showModal('加载失败', '区块链连接库未加载，请刷新页面。', '⚠️');
      return;
    }
    try {
      const tx = await signer.sendTransaction({
        to: TREASURY_ADDRESS,
        value: ethers.parseEther(MINT_PRICE_BNB)
      });
      showModal('交易已提交', `交易哈希：${tx.hash}。请耐心等待链上确认...`, '⏳');
      const receipt = await tx.wait();
      if (receipt && receipt.status === 1) {
        setMintedCount(userAddress, count + 1);
        minted++;
        updateProgress();
        updateMintButton();
        renderMyNFTs();
        showModal('铸造成功 ✅', `你已成功支付 1 BNB 铸造 1 张 Genesis NFT。交易哈希：${tx.hash}`, '🎉');
      } else {
        showModal('交易失败', '链上确认失败，请检查钱包余额或 Gas 设置。', '❌');
      }
    } catch (err) {
      const msg = err?.message || '交易被拒绝或发生错误。';
      showModal('铸造失败', msg, '❌');
    }
  }

  if (mintBtn) mintBtn.addEventListener('click', mint);

  // My NFTs rendering
  function renderMyNFTs() {
    const section = document.getElementById('my-nfts');
    const grid = document.getElementById('my-nfts-grid');
    if (!section || !grid || !userAddress) return;
    const count = getMintedCount(userAddress);
    if (count <= 0) {
      section.style.display = 'none';
      return;
    }
    section.style.display = 'block';
    grid.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const card = document.createElement('div');
      card.className = 'my-nft-card';
      card.innerHTML = `
        <img src="${NFT_IMAGE}" alt="Robin Rabbit Genesis NFT #${i + 1}" />
        <div class="my-nft-info">
          <h4>Robin Rabbit Genesis</h4>
          <p>#${String(i + 1).padStart(4, '0')}</p>
          <span class="my-nft-address">${truncateAddress(userAddress)}</span>
        </div>
      `;
      grid.appendChild(card);
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('active'); });
    }, { threshold: 0.1 });
    observer.observe(section);
  }

  // Auto connect on load if already authorized
  async function autoConnect() {
    if (!hasWallet() || typeof ethers === 'undefined') return;
    try {
      provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();
        updateWalletStatus();
        updateMintButton();
        renderMyNFTs();
      }
    } catch {}
  }
  autoConnect();

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
