/* =============================================================
   IROfit — cart-drawer.js
   Open/close, fetch state, add/update/remove, free-shipping bar
   ============================================================= */
(function () {
  'use strict';

  const drawer = document.querySelector('[data-cart-drawer]');
  if (!drawer) return;
  const overlay = document.querySelector('[data-cart-overlay]');
  const threshold = parseInt(drawer.dataset.freeShippingThreshold || '0', 10) * 100;

  function open() {
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    if (overlay) overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (overlay) overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }
  drawer.addEventListener('click', (e) => {
    if (e.target.matches('[data-cart-close]')) close();
  });
  if (overlay) overlay.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
  });
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-cart-open]');
    if (t) {
      e.preventDefault();
      open();
    }
  });

  function formatMoney(cents) {
    const fmt = window.theme.moneyFormat || '€{{amount}}';
    return fmt.replace(/\{\{\s*amount\s*\}\}/, (cents / 100).toFixed(2).replace('.', ','));
  }

  function render(state) {
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = state.item_count;
      el.classList.toggle('is-empty', state.item_count === 0);
    });
    const list = drawer.querySelector('[data-cart-items]');
    const empty = drawer.querySelector('[data-cart-empty]');
    const foot = drawer.querySelector('[data-cart-foot]');
    if (!list) return;

    if (state.item_count === 0) {
      list.innerHTML = '';
      if (empty) empty.style.display = 'block';
      if (foot) foot.style.display = 'none';
      return;
    }

    if (empty) empty.style.display = 'none';
    if (foot) foot.style.display = '';

    list.innerHTML = state.items.map((item) => {
      const img = item.image
        ? `<img src="${item.image.replace(/\.(jpe?g|png|webp|gif)/, '_120x.$1')}" alt="${item.product_title}" loading="lazy" width="80" height="100">`
        : '';
      return `
        <article class="cart-item" data-key="${item.key}">
          <div class="cart-item__media">${img}</div>
          <div class="cart-item__body">
            <h3 class="cart-item__title">${item.product_title}</h3>
            <p class="cart-item__meta">${item.variant_options ? item.variant_options.join(' · ') : ''}</p>
            <div class="cart-item__qty">
              <button type="button" data-cart-qty="-1" aria-label="Decrease">−</button>
              <input type="text" value="${item.quantity}" readonly aria-label="Quantity">
              <button type="button" data-cart-qty="1" aria-label="Increase">+</button>
            </div>
            <button type="button" class="cart-item__remove" data-cart-remove>Retirer</button>
          </div>
          <div class="cart-item__price">${formatMoney(item.final_line_price)}</div>
        </article>
      `;
    }).join('');

    const total = drawer.querySelector('[data-cart-total]');
    if (total) total.textContent = formatMoney(state.total_price);

    const shipBar = drawer.querySelector('[data-cart-shipping-bar]');
    const shipMsg = drawer.querySelector('[data-cart-shipping-msg]');
    if (shipBar && threshold > 0) {
      const pct = Math.min(100, Math.round((state.total_price / threshold) * 100));
      shipBar.style.width = pct + '%';
      if (shipMsg) {
        const remaining = threshold - state.total_price;
        shipMsg.textContent = remaining > 0
          ? `Plus que ${formatMoney(remaining)} pour la livraison offerte.`
          : 'Livraison offerte appliquée.';
      }
    }
  }

  function fetchCart() {
    return fetch('/cart.js').then((r) => r.json()).then(render);
  }

  async function changeLine(key, qty) {
    const r = await fetch(window.theme.routes.cart_change_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity: qty })
    });
    const data = await r.json();
    render(data);
  }

  drawer.addEventListener('click', (e) => {
    const item = e.target.closest('.cart-item');
    if (!item) return;
    const key = item.dataset.key;
    if (e.target.matches('[data-cart-remove]')) {
      changeLine(key, 0);
    } else if (e.target.matches('[data-cart-qty]')) {
      const delta = parseInt(e.target.dataset.cartQty, 10);
      const input = item.querySelector('input');
      const next = Math.max(0, parseInt(input.value, 10) + delta);
      changeLine(key, next);
    }
  });

  /* -------- Add-to-cart interception (forms with action /cart/add) -------- */
  document.addEventListener('submit', async (e) => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.getAttribute('action') !== window.theme.routes.cart_add_url) return;
    e.preventDefault();
    const btn = form.querySelector('[data-atc-btn]');
    if (btn) btn.setAttribute('disabled', 'disabled');
    const fd = new FormData(form);
    fd.append('sections', '');
    try {
      const r = await fetch(window.theme.routes.cart_add_url, {
        method: 'POST',
        headers: { Accept: 'application/javascript', 'X-Requested-With': 'XMLHttpRequest' },
        body: fd
      });
      if (!r.ok) throw new Error('add failed');
      await fetchCart();
      open();
    } catch (err) {
      console.error(err);
      form.submit();
    } finally {
      if (btn) btn.removeAttribute('disabled');
    }
  });

  /* Initial */
  fetchCart();
})();
