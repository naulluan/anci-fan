(() => {
  'use strict';

  /* ============ STATE ============ */
  const STORAGE_KEY = 'anci_cart_v1';
  const FREE_SHIP = 500_000;
  const fmt = n => new Intl.NumberFormat('vi-VN').format(n) + '₫';

  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { cart = []; }

  const PRODUCT = {
    id: 'anci-pro',
    title: 'ANCI Pro — Quạt Áo Điều Hòa',
    image: 'products/fan/703536670_2260372014793402_1824922452162330043_n.jpg',
    bundles: {
      standard: { name: 'Gói Rẻ',         price:   650_000, oldPrice:   870_000 },
      pro:      { name: 'Gói Phổ Thông',  price:   850_000, oldPrice: 1_130_000 },
      max:      { name: 'Gói Đầy Đủ',     price: 1_250_000, oldPrice: 1_670_000 },
    }
  };

  /* ============ DOM ============ */
  const $ = id => document.getElementById(id);
  const mainImg     = $('mainImg');
  const cartBadge   = $('cartBadge');
  const cartDrawer  = $('cartDrawer');
  const cartBackdrop= $('cartBackdrop');
  const cartItems   = $('cartItems');
  const cartEmpty   = $('cartEmpty');
  const cartFoot    = $('cartFoot');
  const cartTotal   = $('cartTotal');
  const cartCount   = $('cartCount');
  const shipText    = $('shipText');
  const shipBar     = $('shipBar');
  const toast       = $('toast');
  const toastText   = $('toastText');
  const qtyInput    = $('qty');
  const colorName   = $('colorName');

  /* ============ GALLERY ============ */
  document.querySelectorAll('.thumb[data-src]').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.thumb').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      mainImg.style.opacity = '0';
      setTimeout(() => {
        mainImg.src = t.dataset.src;
        mainImg.style.opacity = '1';
      }, 150);
    });
  });
  mainImg.style.transition = 'opacity .2s';

  /* ============ COLOR ============ */
  document.querySelectorAll('.color-opt').forEach(c => {
    c.addEventListener('click', () => {
      document.querySelectorAll('.color-opt').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      colorName.textContent = c.dataset.name;
    });
  });

  /* ============ QTY ============ */
  const getQty = () => Math.max(1, parseInt(qtyInput.value, 10) || 1);
  $('qtyMinus').addEventListener('click', () => { qtyInput.value = Math.max(1, getQty() - 1); });
  $('qtyPlus').addEventListener('click',  () => { qtyInput.value = Math.min(99, getQty() + 1); });

  /* ============ ADD MAIN PRODUCT ============ */
  const getSelectedBundle = () => {
    const r = document.querySelector('input[name="bundle"]:checked');
    return r ? r.value : 'pro';
  };

  $('addToCart').addEventListener('click', () => {
    const bundleKey = getSelectedBundle();
    const bundle = PRODUCT.bundles[bundleKey];
    const variantId = `${PRODUCT.id}-${bundleKey}-${colorName.textContent}`;
    addItem({
      id: variantId,
      title: PRODUCT.title,
      variant: `${bundle.name} • ${colorName.textContent}`,
      price: bundle.price,
      oldPrice: bundle.oldPrice,
      image: PRODUCT.image,
      qty: getQty(),
    });
    showToast(`Đã thêm ${getQty()} × ${PRODUCT.title}`);
    openCart();
  });

  $('buyNow').addEventListener('click', () => {
    $('addToCart').click();
    setTimeout(() => $('checkoutBtn').click(), 500);
  });

  /* ============ ADD RELATED ============ */
  document.querySelectorAll('[data-mock-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const title = btn.dataset.mockAdd;
      const price = parseInt(btn.dataset.price, 10);
      addItem({
        id: `mock-${title}`,
        title,
        variant: 'Mặc định',
        price,
        image: null,
        qty: 1,
      });
      showToast(`Đã thêm: ${title}`);
      openCart();
    });
  });

  /* ============ CART OPS ============ */
  function addItem(item) {
    const found = cart.find(x => x.id === item.id);
    if (found) found.qty += item.qty;
    else cart.push(item);
    persist(); render();
  }
  function removeItem(id) {
    cart = cart.filter(x => x.id !== id);
    persist(); render();
  }
  function updateQty(id, delta) {
    const it = cart.find(x => x.id === id);
    if (!it) return;
    it.qty = Math.max(1, it.qty + delta);
    persist(); render();
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch {}
  }

  /* ============ RENDER ============ */
  function render() {
    const count = cart.reduce((s, x) => s + x.qty, 0);
    const total = cart.reduce((s, x) => s + x.price * x.qty, 0);

    cartBadge.textContent = count;
    cartBadge.style.display = count ? 'grid' : 'none';
    cartCount.textContent = `(${count})`;

    if (!cart.length) {
      cartEmpty.classList.remove('hidden');
      cartItems.innerHTML = '';
      cartFoot.hidden = true;
      return;
    }
    cartEmpty.classList.add('hidden');
    cartFoot.hidden = false;

    cartItems.innerHTML = cart.map(it => `
      <div class="cart-item">
        <div class="ci-img">
          ${it.image ? `<img src="${it.image}" alt="">` : `<span>${escapeHtml(it.title.slice(0,2).toUpperCase())}</span>`}
        </div>
        <div class="ci-info">
          <div class="ci-title">${escapeHtml(it.title)}</div>
          <div class="ci-variant">${escapeHtml(it.variant || '')}</div>
          <div class="ci-controls">
            <div class="ci-qty">
              <button data-act="dec" data-id="${it.id}">−</button>
              <span>${it.qty}</span>
              <button data-act="inc" data-id="${it.id}">+</button>
            </div>
            <button class="ci-remove" data-act="rm" data-id="${it.id}">Xóa</button>
          </div>
        </div>
        <div class="ci-price">
          <strong>${fmt(it.price * it.qty)}</strong>
          ${it.oldPrice ? `<small>${fmt(it.oldPrice * it.qty)}</small>` : ''}
        </div>
      </div>
    `).join('');

    cartTotal.textContent = fmt(total);

    const pct = Math.min(100, (total / FREE_SHIP) * 100);
    shipBar.style.width = pct + '%';
    if (total >= FREE_SHIP) {
      shipText.innerHTML = '🎉 Bạn đã được <strong>FREESHIP</strong> toàn quốc!';
    } else {
      shipText.innerHTML = `Mua thêm <strong>${fmt(FREE_SHIP - total)}</strong> để được freeship 🚚`;
    }
  }

  cartItems.addEventListener('click', e => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    const { act, id } = b.dataset;
    if (act === 'inc') updateQty(id, +1);
    else if (act === 'dec') updateQty(id, -1);
    else if (act === 'rm') removeItem(id);
  });

  /* ============ DRAWER ============ */
  function openCart() {
    cartDrawer.classList.add('open');
    cartBackdrop.classList.add('open');
    cartDrawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    cartDrawer.classList.remove('open');
    cartBackdrop.classList.remove('open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  $('openCart').addEventListener('click', openCart);
  $('closeCart').addEventListener('click', closeCart);
  cartBackdrop.addEventListener('click', closeCart);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });

  $('checkoutBtn').addEventListener('click', () => {
    showToast('🚧 Mockup — Thanh toán/COD sẽ tích hợp sau');
  });

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href === '#' || href.length < 2) return;
      const target = document.querySelector(href);
      if (target) { e.preventDefault(); target.scrollIntoView({behavior:'smooth',block:'start'}); }
    });
  });

  /* ============ TOAST ============ */
  let toastTimer;
  function showToast(msg) {
    toastText.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  /* ============ UTIL ============ */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  /* ============ COUNTDOWN ============ */
  const saleEl = $('saleCountdown');
  if (saleEl) {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const tick = () => {
      const diff = end - new Date();
      if (diff <= 0) { saleEl.textContent = '00:00:00'; return; }
      const h = String(Math.floor(diff / 3.6e6)).padStart(2, '0');
      const m = String(Math.floor(diff % 3.6e6 / 6e4)).padStart(2, '0');
      const s = String(Math.floor(diff % 6e4 / 1e3)).padStart(2, '0');
      saleEl.textContent = `${h}:${m}:${s}`;
    };
    tick(); setInterval(tick, 1000);
  }

  /* ============ INIT ============ */
  render();
})();
