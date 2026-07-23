// BEASTIC — Shopify Storefront API integration
(function () {
  'use strict';

  /* ══════════════════════════════════════
     CONFIG
  ══════════════════════════════════════ */
  var SHOP = 'beastic-2.myshopify.com';
  var SFAT = '1f063c10c024cec9339954943d9af1d1';
  var GQL  = 'https://' + SHOP + '/api/2024-01/graphql.json';
  var K = { CART: 'bst_cart', TOK: 'bst_tok', EXP: 'bst_exp', WL: 'bst_wl' };

  /* ══════════════════════════════════════
     GQL CLIENT
  ══════════════════════════════════════ */
  async function gql(query, vars) {
    var res = await fetch(GQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SFAT,
      },
      body: JSON.stringify({ query: query, variables: vars || {} }),
    });
    var json = await res.json();
    if (json.errors && json.errors.length) throw new Error(json.errors[0].message);
    return json.data;
  }

  /* ══════════════════════════════════════
     CART
  ══════════════════════════════════════ */
  var CART_FRAG = [
    'fragment C on Cart {',
    '  id checkoutUrl totalQuantity',
    '  cost { totalAmount { amount currencyCode } }',
    '  lines(first:50) { edges { node {',
    '    id quantity',
    '    merchandise { ... on ProductVariant {',
    '      id title',
    '      product { title featuredImage { url } }',
    '      image { url altText }',
    '      price { amount currencyCode }',
    '    }}',
    '  }}}',
    '}',
  ].join('\n');

  async function cartCreate() {
    var d = await gql('mutation { cartCreate { cart { ...C } } }\n' + CART_FRAG);
    return d.cartCreate.cart;
  }

  async function cartFetch(id) {
    var d = await gql('query($id:ID!){cart(id:$id){...C}}\n' + CART_FRAG, { id: id });
    return d.cart;
  }

  async function cartAdd(cartId, variantId, qty) {
    var d = await gql(
      'mutation($id:ID!,$l:[CartLineInput!]!){cartLinesAdd(cartId:$id,lines:$l){cart{...C}}}\n' + CART_FRAG,
      { id: cartId, l: [{ merchandiseId: variantId, quantity: qty || 1 }] }
    );
    return d.cartLinesAdd.cart;
  }

  async function cartRemoveLine(cartId, lineId) {
    var d = await gql(
      'mutation($id:ID!,$l:[ID!]!){cartLinesRemove(cartId:$id,lineIds:$l){cart{...C}}}\n' + CART_FRAG,
      { id: cartId, l: [lineId] }
    );
    return d.cartLinesRemove.cart;
  }

  async function cartUpdateLine(cartId, lineId, qty) {
    var d = await gql(
      'mutation($id:ID!,$l:[CartLineUpdateInput!]!){cartLinesUpdate(cartId:$id,lines:$l){cart{...C}}}\n' + CART_FRAG,
      { id: cartId, l: [{ id: lineId, quantity: qty }] }
    );
    return d.cartLinesUpdate.cart;
  }

  var _cart = null;

  async function getCart() {
    var savedId = localStorage.getItem(K.CART);
    if (savedId) {
      try { _cart = await cartFetch(savedId); }
      catch (e) { _cart = null; localStorage.removeItem(K.CART); }
    }
    if (!_cart) {
      _cart = await cartCreate();
      localStorage.setItem(K.CART, _cart.id);
    }
    return _cart;
  }

  /* Public: called by product buttons */
  window.bstAddToCart = async function (variantId, qty) {
    showToast('Agregando al carrito…');
    try {
      var cart = await getCart();
      _cart = await cartAdd(cart.id, variantId, qty || 1);
      updateCartBadge();
      renderCartLines();
      showToast('¡Producto agregado!', 'success');
    } catch (e) {
      console.error('[BST cart]', e);
      showToast('Error al agregar. Intenta de nuevo.', 'error');
    }
  };

  /* ══════════════════════════════════════
     CUSTOMER AUTH
  ══════════════════════════════════════ */
  function getSavedToken() {
    var exp = localStorage.getItem(K.EXP);
    if (exp && Date.now() > new Date(exp).getTime()) {
      localStorage.removeItem(K.TOK);
      localStorage.removeItem(K.EXP);
      return null;
    }
    return localStorage.getItem(K.TOK);
  }

  async function customerLogin(email, password) {
    var d = await gql(
      'mutation($i:CustomerAccessTokenCreateInput!){customerAccessTokenCreate(input:$i){customerAccessToken{accessToken expiresAt}customerUserErrors{message}}}',
      { i: { email: email, password: password } }
    );
    var r = d.customerAccessTokenCreate;
    if (r.customerUserErrors.length) throw new Error(r.customerUserErrors[0].message);
    var tok = r.customerAccessToken;
    localStorage.setItem(K.TOK, tok.accessToken);
    localStorage.setItem(K.EXP, tok.expiresAt);
    return tok;
  }

  async function customerRegister(firstName, lastName, email, password) {
    var d = await gql(
      'mutation($i:CustomerCreateInput!){customerCreate(input:$i){customer{id}customerUserErrors{message}}}',
      { i: { firstName: firstName, lastName: lastName, email: email, password: password, acceptsMarketing: false } }
    );
    var r = d.customerCreate;
    if (r.customerUserErrors.length) throw new Error(r.customerUserErrors[0].message);
    return customerLogin(email, password);
  }

  async function customerGet(token) {
    var d = await gql(
      'query($t:String!){customer(customerAccessToken:$t){firstName lastName email orders(first:5,sortKey:PROCESSED_AT,reverse:true){edges{node{orderNumber processedAt currentTotalPrice{amount currencyCode}fulfillmentStatus}}}}}',
      { t: token }
    );
    return d.customer;
  }

  function customerLogout() {
    localStorage.removeItem(K.TOK);
    localStorage.removeItem(K.EXP);
    updateUserIcon();
    showToast('Sesión cerrada');
  }

  /* ══════════════════════════════════════
     WISHLIST (localStorage)
  ══════════════════════════════════════ */
  function getWishlist() {
    try { return JSON.parse(localStorage.getItem(K.WL) || '[]'); } catch (e) { return []; }
  }

  function saveWishlist(wl) {
    localStorage.setItem(K.WL, JSON.stringify(wl));
    updateWishlistBadge();
  }

  window.bstIsInWishlist = function (variantId) {
    return getWishlist().some(function (i) { return i.id === variantId; });
  };

  window.bstToggleWishlist = function (variantId, title, image, price) {
    var wl = getWishlist();
    var idx = -1;
    for (var i = 0; i < wl.length; i++) { if (wl[i].id === variantId) { idx = i; break; } }
    if (idx >= 0) {
      wl.splice(idx, 1);
      showToast('Quitado de lista de deseos');
    } else {
      wl.push({ id: variantId, title: title, image: image, price: price, added: Date.now() });
      showToast('Agregado a lista de deseos ♥', 'success');
    }
    saveWishlist(wl);
    renderWishlistItems();
    document.querySelectorAll('[data-wl-id="' + variantId + '"]').forEach(function (btn) {
      btn.classList.toggle('active', idx < 0);
    });
    return idx < 0;
  };

  /* ══════════════════════════════════════
     HELPERS
  ══════════════════════════════════════ */
  function fmt(amount, currency) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: currency || 'MXN' }).format(parseFloat(amount));
  }

  function showToast(msg, type) {
    var t = document.getElementById('bstToast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'bst-toast' + (type ? ' bst-toast--' + type : '');
    t.classList.add('is-visible');
    clearTimeout(t._tid);
    t._tid = setTimeout(function () { t.classList.remove('is-visible'); }, 2800);
  }

  function updateCartBadge() {
    var qty = _cart ? _cart.totalQuantity : 0;
    document.querySelectorAll('.bst-cart-badge').forEach(function (el) {
      el.textContent = qty;
      el.classList.toggle('hidden', !qty);
    });
  }

  function updateWishlistBadge() {
    var cnt = getWishlist().length;
    document.querySelectorAll('.bst-wl-badge').forEach(function (el) {
      el.textContent = cnt;
      el.classList.toggle('hidden', !cnt);
    });
  }

  function updateUserIcon() {
    var tok = getSavedToken();
    document.querySelectorAll('.bst-user-icon').forEach(function (el) {
      el.classList.toggle('is-logged', !!tok);
    });
  }

  /* ══════════════════════════════════════
     DRAWER / MODAL
  ══════════════════════════════════════ */
  function openDrawer(id) {
    document.querySelectorAll('.bst-drawer, .bst-modal').forEach(function (el) {
      el.classList.remove('is-open');
    });
    var el = document.getElementById(id);
    if (el) el.classList.add('is-open');
    var ov = document.getElementById('bstOverlay');
    if (ov) ov.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
  }

  function closeAll() {
    document.querySelectorAll('.bst-drawer, .bst-modal').forEach(function (el) { el.classList.remove('is-open'); });
    var ov = document.getElementById('bstOverlay');
    if (ov) ov.classList.remove('is-visible');
    document.body.style.overflow = '';
  }

  /* ── Cart render ── */
  function renderCartLines() {
    var list = document.getElementById('bstCartLines');
    var footer = document.getElementById('bstCartFooter');
    var total = document.getElementById('bstCartTotal');
    var checkoutBtn = document.getElementById('bstCheckoutBtn');
    if (!list) return;

    if (!_cart || !_cart.totalQuantity) {
      list.innerHTML = '<p class="bst-empty">Tu carrito está vacío.</p>';
      if (footer) footer.style.display = 'none';
      return;
    }
    if (footer) footer.style.display = '';
    if (total) total.textContent = fmt(_cart.cost.totalAmount.amount, _cart.cost.totalAmount.currencyCode);
    if (checkoutBtn) checkoutBtn.href = _cart.checkoutUrl;

    var lines = _cart.lines.edges.map(function (e) { return e.node; });
    list.innerHTML = lines.map(function (line) {
      var m = line.merchandise;
      var img = (m.image && m.image.url) || (m.product && m.product.featuredImage && m.product.featuredImage.url) || '';
      var varTitle = m.title !== 'Default Title' ? ' — ' + m.title : '';
      return [
        '<div class="bst-cart-item">',
        img ? '<img src="' + img + '" class="bst-cart-img" alt="">' : '<div class="bst-cart-img-ph"></div>',
        '<div class="bst-cart-info">',
        '<p class="bst-cart-name">' + m.product.title + varTitle + '</p>',
        '<p class="bst-cart-price">' + fmt(m.price.amount, m.price.currencyCode) + '</p>',
        '<div class="bst-cart-qty">',
        '<button class="bst-qty-btn" data-action="dec" data-line="' + line.id + '" data-qty="' + line.quantity + '">−</button>',
        '<span>' + line.quantity + '</span>',
        '<button class="bst-qty-btn" data-action="inc" data-line="' + line.id + '" data-qty="' + line.quantity + '">+</button>',
        '</div></div>',
        '<button class="bst-cart-remove" data-line="' + line.id + '" aria-label="Quitar">×</button>',
        '</div>',
      ].join('');
    }).join('');
  }

  /* ── Wishlist render ── */
  function renderWishlistItems() {
    var list = document.getElementById('bstWlItems');
    if (!list) return;
    var wl = getWishlist();
    if (!wl.length) {
      list.innerHTML = '<p class="bst-empty">Tu lista de deseos está vacía.</p>';
      return;
    }
    list.innerHTML = wl.map(function (item) {
      return [
        '<div class="bst-wl-item">',
        item.image ? '<img src="' + item.image + '" class="bst-cart-img" alt="">' : '<div class="bst-cart-img-ph"></div>',
        '<div class="bst-cart-info">',
        '<p class="bst-cart-name">' + item.title + '</p>',
        item.price ? '<p class="bst-cart-price">' + item.price + '</p>' : '',
        '</div>',
        '<div class="bst-wl-actions">',
        '<button class="bst-wl-add" data-wl-add="' + item.id + '">+ Carrito</button>',
        '<button class="bst-wl-rm" data-wl-rm="' + item.id + '" aria-label="Quitar">×</button>',
        '</div></div>',
      ].join('');
    }).join('');
  }

  /* ── Account render ── */
  async function openAccount() {
    var tok = getSavedToken();
    if (!tok) { openDrawer('bstAuthModal'); return; }
    openDrawer('bstAccountDrawer');
    var content = document.getElementById('bstAccountContent');
    if (content) content.innerHTML = '<p class="bst-empty">Cargando…</p>';
    try {
      var cust = await customerGet(tok);
      if (!cust) { customerLogout(); closeAll(); openDrawer('bstAuthModal'); return; }
      renderAccount(cust);
    } catch (e) {
      customerLogout(); closeAll(); openDrawer('bstAuthModal');
    }
  }

  function renderAccount(cust) {
    var el = document.getElementById('bstAccountContent');
    if (!el) return;
    var orders = cust.orders.edges;
    el.innerHTML = [
      '<div class="bst-acct-header">',
      '<p class="bst-acct-name">Hola, ' + (cust.firstName || cust.email) + ' 👋</p>',
      '<p class="bst-acct-email">' + cust.email + '</p>',
      '</div>',
      orders.length ? [
        '<p class="bst-section-label">Últimos pedidos</p>',
        '<div class="bst-orders">',
        orders.map(function (e) {
          var o = e.node;
          return [
            '<div class="bst-order">',
            '<span class="bst-order-num">#' + o.orderNumber + '</span>',
            '<span class="bst-order-date">' + new Date(o.processedAt).toLocaleDateString('es-MX') + '</span>',
            '<span class="bst-order-status">' + o.fulfillmentStatus + '</span>',
            '<span class="bst-order-total">' + fmt(o.currentTotalPrice.amount, o.currentTotalPrice.currencyCode) + '</span>',
            '</div>',
          ].join('');
        }).join(''),
        '</div>',
      ].join('') : '<p class="bst-empty">Aún no tienes pedidos.</p>',
      '<button class="bst-logout-btn" id="bstLogoutBtn">Cerrar sesión</button>',
    ].join('');

    document.getElementById('bstLogoutBtn').addEventListener('click', function () {
      customerLogout();
      closeAll();
    });
  }

  /* ══════════════════════════════════════
     INJECT HTML
  ══════════════════════════════════════ */
  function injectHTML() {
    var el = document.createElement('div');
    el.innerHTML = [
      /* Overlay */
      '<div id="bstOverlay" class="bst-overlay"></div>',
      /* Toast */
      '<div id="bstToast" class="bst-toast"></div>',

      /* Cart drawer */
      '<div id="bstCartDrawer" class="bst-drawer bst-drawer--right" role="dialog" aria-label="Carrito">',
        '<div class="bst-drawer-head"><h3>Carrito</h3><button class="bst-close" data-close="all">×</button></div>',
        '<div class="bst-drawer-body"><div id="bstCartLines"></div></div>',
        '<div class="bst-drawer-footer" id="bstCartFooter" style="display:none">',
          '<div class="bst-cart-total-row"><span>Total</span><span id="bstCartTotal"></span></div>',
          '<a id="bstCheckoutBtn" class="bst-btn-primary" href="#" target="_blank" rel="noopener">Ir al checkout →</a>',
        '</div>',
      '</div>',

      /* Wishlist drawer */
      '<div id="bstWlDrawer" class="bst-drawer bst-drawer--right" role="dialog" aria-label="Lista de deseos">',
        '<div class="bst-drawer-head"><h3>Lista de deseos</h3><button class="bst-close" data-close="all">×</button></div>',
        '<div class="bst-drawer-body"><div id="bstWlItems"></div></div>',
      '</div>',

      /* Account drawer */
      '<div id="bstAccountDrawer" class="bst-drawer bst-drawer--right" role="dialog" aria-label="Mi cuenta">',
        '<div class="bst-drawer-head"><h3>Mi cuenta</h3><button class="bst-close" data-close="all">×</button></div>',
        '<div class="bst-drawer-body"><div id="bstAccountContent"></div></div>',
      '</div>',

      /* Auth modal */
      '<div id="bstAuthModal" class="bst-modal" role="dialog" aria-label="Iniciar sesión">',
        '<div class="bst-modal-box">',
          '<button class="bst-close" data-close="all">×</button>',
          /* Login */
          '<form id="bstLoginForm">',
            '<h3 class="bst-modal-title">Iniciar sesión</h3>',
            '<div id="bstLoginErr" class="bst-form-err"></div>',
            '<label>Email<input type="email" name="email" autocomplete="email" required></label>',
            '<label>Contraseña<input type="password" name="password" autocomplete="current-password" required></label>',
            '<button type="submit" class="bst-btn-primary">Entrar</button>',
            '<p class="bst-form-link">¿No tienes cuenta? <a id="bstToReg" href="#">Regístrate</a></p>',
          '</form>',
          /* Register */
          '<form id="bstRegForm" style="display:none">',
            '<h3 class="bst-modal-title">Crear cuenta</h3>',
            '<div id="bstRegErr" class="bst-form-err"></div>',
            '<div class="bst-form-row">',
              '<label>Nombre<input type="text" name="firstName" autocomplete="given-name" required></label>',
              '<label>Apellido<input type="text" name="lastName" autocomplete="family-name" required></label>',
            '</div>',
            '<label>Email<input type="email" name="email" autocomplete="email" required></label>',
            '<label>Contraseña<input type="password" name="password" autocomplete="new-password" minlength="5" required></label>',
            '<button type="submit" class="bst-btn-primary">Crear cuenta</button>',
            '<p class="bst-form-link">¿Ya tienes cuenta? <a id="bstToLogin" href="#">Inicia sesión</a></p>',
          '</form>',
        '</div>',
      '</div>',
    ].join('');

    while (el.firstChild) document.body.appendChild(el.firstChild);
  }

  /* ── Inject nav icons ── */
  function injectNavIcons() {
    var nav = document.getElementById('siteNav');
    if (!nav) return;
    var iconsEl = document.createElement('div');
    iconsEl.className = 'bst-nav-icons';
    iconsEl.innerHTML = [
      '<button class="bst-nav-icon-btn" id="bstNavWl" aria-label="Lista de deseos">',
        '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">',
          '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
        '</svg>',
        '<span class="bst-wl-badge hidden">0</span>',
      '</button>',
      '<button class="bst-nav-icon-btn" id="bstNavCart" aria-label="Carrito">',
        '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">',
          '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>',
          '<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
        '</svg>',
        '<span class="bst-cart-badge hidden">0</span>',
      '</button>',
      '<button class="bst-nav-icon-btn bst-user-icon" id="bstNavUser" aria-label="Mi cuenta">',
        '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">',
          '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>',
          '<circle cx="12" cy="7" r="4"/>',
        '</svg>',
      '</button>',
    ].join('');

    var hamburger = nav.querySelector('.nav-hamburger');
    if (hamburger) nav.insertBefore(iconsEl, hamburger);
    else nav.appendChild(iconsEl);
  }

  /* ══════════════════════════════════════
     EVENTS
  ══════════════════════════════════════ */
  function bindEvents() {
    document.addEventListener('click', async function (e) {
      var t = e.target;

      /* Close triggers */
      if (t.id === 'bstOverlay' || t.dataset.close === 'all' || t.closest('[data-close="all"]')) {
        closeAll(); return;
      }

      /* Nav icons */
      if (t.closest('#bstNavCart')) { renderCartLines(); openDrawer('bstCartDrawer'); return; }
      if (t.closest('#bstNavWl'))   { renderWishlistItems(); openDrawer('bstWlDrawer'); return; }
      if (t.closest('#bstNavUser')) { openAccount(); return; }

      /* Cart qty */
      var qtyBtn = t.closest('.bst-qty-btn');
      if (qtyBtn && _cart) {
        var lineId = qtyBtn.dataset.line;
        var qty    = parseInt(qtyBtn.dataset.qty);
        var newQty = qtyBtn.dataset.action === 'inc' ? qty + 1 : Math.max(0, qty - 1);
        try {
          _cart = newQty === 0
            ? await cartRemoveLine(_cart.id, lineId)
            : await cartUpdateLine(_cart.id, lineId, newQty);
          updateCartBadge();
          renderCartLines();
        } catch (err) { showToast('Error', 'error'); }
        return;
      }

      /* Cart remove */
      var rmBtn = t.closest('.bst-cart-remove');
      if (rmBtn && _cart) {
        try {
          _cart = await cartRemoveLine(_cart.id, rmBtn.dataset.line);
          updateCartBadge();
          renderCartLines();
        } catch (err) { showToast('Error', 'error'); }
        return;
      }

      /* Wishlist remove */
      var wlRm = t.closest('[data-wl-rm]');
      if (wlRm) {
        var rmId = wlRm.dataset.wlRm;
        saveWishlist(getWishlist().filter(function (i) { return i.id !== rmId; }));
        renderWishlistItems();
        document.querySelectorAll('[data-wl-id="' + rmId + '"]').forEach(function (b) { b.classList.remove('active'); });
        return;
      }

      /* Wishlist add to cart */
      var wlAdd = t.closest('[data-wl-add]');
      if (wlAdd) { await window.bstAddToCart(wlAdd.dataset.wlAdd, 1); return; }

      /* Auth tab switch */
      if (t.id === 'bstToReg')   { switchAuth('reg'); return; }
      if (t.id === 'bstToLogin') { switchAuth('login'); return; }
    });

    /* Keyboard */
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
  }

  function switchAuth(tab) {
    var loginForm = document.getElementById('bstLoginForm');
    var regForm   = document.getElementById('bstRegForm');
    if (!loginForm || !regForm) return;
    loginForm.style.display = tab === 'login' ? '' : 'none';
    regForm.style.display   = tab === 'reg'   ? '' : 'none';
  }

  /* ── Auth forms ── */
  function bindAuthForms() {
    var loginForm = document.getElementById('bstLoginForm');
    var regForm   = document.getElementById('bstRegForm');

    if (loginForm) {
      loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var err = document.getElementById('bstLoginErr');
        var btn = loginForm.querySelector('button[type=submit]');
        err.textContent = ''; btn.disabled = true;
        try {
          await customerLogin(loginForm.email.value, loginForm.password.value);
          updateUserIcon();
          showToast('¡Bienvenido de nuevo!', 'success');
          closeAll();
          openAccount();
        } catch (ex) {
          err.textContent = ex.message;
        } finally { btn.disabled = false; }
      });
    }

    if (regForm) {
      regForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var err = document.getElementById('bstRegErr');
        var btn = regForm.querySelector('button[type=submit]');
        err.textContent = ''; btn.disabled = true;
        try {
          await customerRegister(regForm.firstName.value, regForm.lastName.value, regForm.email.value, regForm.password.value);
          updateUserIcon();
          showToast('¡Cuenta creada! Bienvenido.', 'success');
          closeAll();
          openAccount();
        } catch (ex) {
          err.textContent = ex.message;
        } finally { btn.disabled = false; }
      });
    }
  }

  /* ══════════════════════════════════════
     TIENDA PAGE — dynamic products
  ══════════════════════════════════════ */
  async function loadTiendaProducts() {
    var grid = document.querySelector('.products-grid');
    if (!grid) return;

    /* Skeleton loader */
    grid.innerHTML = [
      '<div class="bst-loading">',
      '<div class="bst-skel"></div><div class="bst-skel"></div>',
      '<div class="bst-skel"></div><div class="bst-skel"></div>',
      '</div>',
    ].join('');

    try {
      var d = await gql([
        '{products(first:20,sortKey:TITLE){edges{node{',
        '  id title handle',
        '  featuredImage{url altText}',
        '  priceRange{minVariantPrice{amount currencyCode}}',
        '  variants(first:10){edges{node{id title availableForSale price{amount currencyCode}}}}',
        '}}}}',
      ].join(''));

      var products = d.products.edges.map(function (e) { return e.node; });
      if (!products.length) { grid.innerHTML = ''; return; }

      grid.innerHTML = products.map(function (p) {
        var variants = p.variants.edges.map(function (e) { return e.node; });
        var firstAvail = null;
        for (var i = 0; i < variants.length; i++) {
          if (variants[i].availableForSale) { firstAvail = variants[i]; break; }
        }
        var firstVar = variants[0];
        var price = p.priceRange.minVariantPrice;
        var img = p.featuredImage ? p.featuredImage.url : '';
        var alt = p.featuredImage ? (p.featuredImage.altText || p.title) : p.title;
        var vid = firstAvail ? firstAvail.id : (firstVar ? firstVar.id : '');
        var priceFmt = 'Desde ' + fmt(price.amount, price.currencyCode);

        var hasMultiple = variants.length > 1;
        var variantSelect = hasMultiple ? [
          '<select class="prod-var-select" data-product="' + p.id + '">',
          variants.map(function (v) {
            return '<option value="' + v.id + '" ' + (!v.availableForSale ? 'disabled' : '') + '>'
              + v.title + (v.availableForSale ? '' : ' (agotado)') + '</option>';
          }).join(''),
          '</select>',
        ].join('') : '';

        return [
          '<div class="prod-card reveal">',
            '<div class="prod-card-img-wrap">',
              img ? '<img src="' + img + '" alt="' + alt + '" loading="lazy">' : '',
              vid ? [
                '<button class="prod-wl-btn" data-wl-id="' + vid + '"',
                ' onclick="bstToggleWishlist(\'' + vid + '\',\'' + p.title.replace(/'/g, "\\'") + '\',\'' + img + '\',\'' + priceFmt + '\')"',
                ' aria-label="Lista de deseos">',
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">',
                '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
                '</svg>',
                '</button>',
              ].join('') : '',
            '</div>',
            '<p class="prod-card-name">' + p.title + '</p>',
            '<p class="prod-card-price">' + priceFmt + '</p>',
            variantSelect,
            firstAvail
              ? '<button class="prod-card-atc" data-vid="' + firstAvail.id + '" onclick="bstAddToCart(this.dataset.vid,1)">Agregar al carrito</button>'
              : '<button class="prod-card-atc disabled" disabled>Agotado</button>',
          '</div>',
        ].join('');
      }).join('');

      /* Remove the "próximamente" note */
      var note = document.querySelector('.tienda-note');
      if (note) note.style.display = 'none';

      /* Handle variant selects */
      grid.addEventListener('change', function (e) {
        var sel = e.target.closest('.prod-var-select');
        if (!sel) return;
        var card = sel.closest('.prod-card');
        var atcBtn = card && card.querySelector('.prod-card-atc');
        var wlBtn  = card && card.querySelector('.prod-wl-btn');
        if (atcBtn) atcBtn.dataset.vid = sel.value;
        if (wlBtn)  wlBtn.dataset.wlId = sel.value;
      });

    } catch (e) {
      console.warn('[BST] Products load error:', e);
      grid.innerHTML = ''; /* fall back to static HTML if JS was injected there */
    }
  }

  /* ══════════════════════════════════════
     INIT
  ══════════════════════════════════════ */
  async function init() {
    injectHTML();
    injectNavIcons();
    bindEvents();
    bindAuthForms();
    updateWishlistBadge();
    updateUserIcon();

    /* Load cart silently */
    try {
      await getCart();
      updateCartBadge();
    } catch (e) {
      console.warn('[BST] Cart init:', e);
    }

    /* Tienda page: load products from Shopify */
    if (document.querySelector('.products-grid')) {
      loadTiendaProducts();
    }
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
