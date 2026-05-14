/* =============================================================
   IROfit — base.js
   Lazy reveal · Hero meta rotator · Mobile menu · Mega menu hover ·
   Sticky product CTA · Hero scroll header · Email popup
   ============================================================= */
(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------- IntersectionObserver reveal -------- */
  function initReveals() {
    const items = document.querySelectorAll('[data-animate]');
    if (!items.length || reducedMotion) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
    items.forEach((el) => io.observe(el));
  }

  /* -------- Hero meta rotator -------- */
  function initHeroRotator() {
    const rotators = document.querySelectorAll('[data-hero-rotator]');
    rotators.forEach((rotator) => {
      const items = rotator.querySelectorAll('.hero__meta-item');
      if (items.length < 2) return;
      let idx = 0;
      items[0].classList.add('is-active');
      if (reducedMotion) return;
      setInterval(() => {
        items[idx].classList.remove('is-active');
        idx = (idx + 1) % items.length;
        items[idx].classList.add('is-active');
      }, 3400);
    });
  }

  /* -------- Mobile menu drawer -------- */
  function initMobileMenu() {
    const trigger = document.querySelector('[data-mobile-menu-trigger]');
    const menu = document.querySelector('[data-mobile-menu]');
    const close = document.querySelector('[data-mobile-menu-close]');
    if (!trigger || !menu) return;

    const open = () => {
      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    const shut = () => {
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };
    trigger.addEventListener('click', open);
    if (close) close.addEventListener('click', shut);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) shut();
    });
  }

  /* -------- Mega menu hover -------- */
  function initMegaMenu() {
    const items = document.querySelectorAll('[data-megamenu]');
    items.forEach((item) => {
      const panel = item.querySelector('.megamenu');
      if (!panel) return;
      let timer;
      const open = () => {
        clearTimeout(timer);
        panel.classList.add('is-open');
        item.setAttribute('aria-expanded', 'true');
      };
      const shut = () => {
        timer = setTimeout(() => {
          panel.classList.remove('is-open');
          item.setAttribute('aria-expanded', 'false');
        }, 120);
      };
      item.addEventListener('mouseenter', open);
      item.addEventListener('mouseleave', shut);
      item.addEventListener('focusin', open);
      item.addEventListener('focusout', shut);
    });
  }

  /* -------- Sticky product CTA -------- */
  function initStickyAtc() {
    const sticky = document.querySelector('[data-sticky-atc]');
    const target = document.querySelector('[data-sticky-atc-trigger]');
    if (!sticky || !target) return;
    const io = new IntersectionObserver(([entry]) => {
      sticky.classList.toggle('is-visible', !entry.isIntersecting);
    }, { threshold: 0 });
    io.observe(target);
  }

  /* -------- Header scroll behavior -------- */
  function initHeaderScroll() {
    const header = document.querySelector('[data-site-header]');
    if (!header || !header.classList.contains('site-header--transparent')) return;
    const onScroll = () => {
      const scrolled = window.scrollY > 40;
      header.classList.toggle('is-scrolled', scrolled);
      if (scrolled) {
        header.style.background = 'var(--bg)';
        header.style.borderBottom = 'var(--hairline)';
      } else {
        header.style.background = '';
        header.style.borderBottom = '';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* -------- Email popup (delay + sessionStorage) -------- */
  function initEmailPopup() {
    const popup = document.querySelector('[data-email-popup]');
    if (!popup) return;
    const dismissed = sessionStorage.getItem('irofit:email-popup');
    if (dismissed) return;
    const delay = parseInt(popup.dataset.delay || '12', 10) * 1000;
    setTimeout(() => popup.classList.add('is-open'), delay);
    const close = popup.querySelector('[data-email-popup-close]');
    if (close) {
      close.addEventListener('click', () => {
        popup.classList.remove('is-open');
        sessionStorage.setItem('irofit:email-popup', '1');
      });
    }
  }

  /* -------- Variant picker (radio swatches/size) -------- */
  function initVariantPicker() {
    document.querySelectorAll('[data-variant-picker]').forEach((picker) => {
      const form = picker.closest('form');
      const idInput = form ? form.querySelector('input[name="id"]') : null;
      const priceEl = picker.parentElement.querySelector('[data-variant-price]');
      const productData = JSON.parse(picker.dataset.product || '{}');
      const variants = productData.variants || [];

      const optionsCount = (productData.options || []).length;

      function selected() {
        const groups = picker.querySelectorAll('[data-option-group]');
        const values = [];
        groups.forEach((g) => {
          const active = g.querySelector('[aria-checked="true"]');
          values.push(active ? active.dataset.value : null);
        });
        return values;
      }

      function update() {
        const values = selected();
        if (values.some((v) => v == null)) return;
        const match = variants.find((v) => {
          for (let i = 0; i < optionsCount; i++) {
            if (v.options[i] !== values[i]) return false;
          }
          return true;
        });
        if (match) {
          if (idInput) idInput.value = match.id;
          if (priceEl) priceEl.textContent = match.price_formatted || '';
          picker.dispatchEvent(new CustomEvent('variant:change', { detail: match, bubbles: true }));
          const atc = form && form.querySelector('[data-atc-btn]');
          if (atc) {
            if (match.available) {
              atc.removeAttribute('disabled');
              atc.dataset.unavailable = '';
              const label = atc.querySelector('[data-atc-label]');
              if (label) label.textContent = window.theme.strings.addToCart;
            } else {
              atc.setAttribute('disabled', 'disabled');
              atc.dataset.unavailable = 'true';
              const label = atc.querySelector('[data-atc-label]');
              if (label) label.textContent = window.theme.strings.soldOut;
            }
          }
        }
      }

      picker.querySelectorAll('[data-option-value]').forEach((opt) => {
        opt.addEventListener('click', () => {
          const group = opt.closest('[data-option-group]');
          group.querySelectorAll('[data-option-value]').forEach((sib) => sib.setAttribute('aria-checked', 'false'));
          opt.setAttribute('aria-checked', 'true');
          update();
        });
      });
    });
  }

  /* -------- Media gallery thumbs -------- */
  function initMediaGallery() {
    document.querySelectorAll('[data-media-gallery]').forEach((gallery) => {
      const main = gallery.querySelector('.media-gallery__main img');
      const thumbs = gallery.querySelectorAll('.media-gallery__thumbs button');
      thumbs.forEach((thumb) => {
        thumb.addEventListener('click', () => {
          const src = thumb.dataset.src;
          const srcset = thumb.dataset.srcset;
          if (main && src) {
            main.src = src;
            if (srcset) main.srcset = srcset;
          }
          thumbs.forEach((t) => t.setAttribute('aria-current', 'false'));
          thumb.setAttribute('aria-current', 'true');
        });
      });
    });
  }

  /* -------- Lookbook hotspots -------- */
  function initLookbook() {
    document.querySelectorAll('[data-hotspot]').forEach((hot) => {
      hot.addEventListener('click', (e) => {
        e.preventDefault();
        const open = hot.getAttribute('aria-expanded') === 'true';
        document.querySelectorAll('[data-hotspot]').forEach((h) => h.setAttribute('aria-expanded', 'false'));
        hot.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    });
  }

  /* -------- Collection filter & sort (Shopify Section Rendering API) -------- */
  function initCollectionFilters() {
    const form = document.querySelector('[data-collection-filters]');
    if (!form) return;
    const container = document.querySelector('[data-collection-results]');
    if (!container) return;

    let debounce;
    function refresh() {
      const params = new URLSearchParams(new FormData(form));
      const url = `${window.location.pathname}?${params.toString()}&section_id=${container.dataset.sectionId}`;
      fetch(url)
        .then((r) => r.text())
        .then((html) => {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const next = doc.querySelector('[data-collection-results]');
          if (next) container.innerHTML = next.innerHTML;
          const cleanParams = new URLSearchParams(new FormData(form));
          history.replaceState({}, '', `${window.location.pathname}?${cleanParams.toString()}`);
        });
    }
    form.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(refresh, 250);
    });
  }

  /* -------- Init on DOM ready -------- */
  function init() {
    initReveals();
    initHeroRotator();
    initMobileMenu();
    initMegaMenu();
    initStickyAtc();
    initHeaderScroll();
    initEmailPopup();
    initVariantPicker();
    initMediaGallery();
    initLookbook();
    initCollectionFilters();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
