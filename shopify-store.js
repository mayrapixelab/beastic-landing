// BEASTIC — Shopify Storefront API integration v2
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
     PRODUCT ENRICHMENT DATA
  ══════════════════════════════════════ */
  var ENRICH = {
    'beast pro': {
      tagline: 'Proteína hidrolizada de absorción ultra rápida',
      servingSize: '1 scoop · 26 g',
      servings: 30,
      benefits: [
        { icon: 'ri-fire-line',        text: '26 g de proteína por porción' },
        { icon: 'ri-time-line',        text: 'Absorción ultra rápida (hidrolizada)' },
        { icon: 'ri-seedling-line',    text: 'Solo 2 g de carbohidratos' },
        { icon: 'ri-capsule-line',     text: 'Perfil completo de BCAAs' },
        { icon: 'ri-award-line',       text: 'Sin azúcares añadidas' },
      ],
      nutrition: [
        { label: 'Calorías',           value: '130 kcal' },
        { label: 'Proteína',           value: '26 g',    highlight: true },
        { label: 'Carbohidratos',      value: '2 g' },
        { label: 'Grasas totales',     value: '1.5 g' },
        { label: 'Sodio',              value: '110 mg' },
        { label: 'Leucina (BCAA)',     value: '2.7 g' },
        { label: 'Isoleucina (BCAA)',  value: '1.5 g' },
        { label: 'Valina (BCAA)',      value: '1.4 g' },
      ],
      howToUse: [
        'Mezcla 1 scoop (26 g) en 200–250 ml de agua fría o leche.',
        'Toma dentro de los 30 minutos post-entrenamiento para maximizar la síntesis proteica.',
        'Puedes añadir una segunda porción en el desayuno o entre comidas según tus requerimientos.',
        'Agita bien en coctelera durante 20–30 segundos para obtener una textura suave.',
      ],
      ingredients: 'Hidrolizado de proteína de suero de leche, cacao en polvo (en sabores chocolate), sucralosa, lecitina de soya.',
    },
    'beast mode': {
      tagline: 'Pre-entrenamiento con 175 mg de cafeína pura',
      servingSize: '1 scoop · 10 g',
      servings: 30,
      benefits: [
        { icon: 'ri-flashlight-line',  text: '175 mg de cafeína anhidra' },
        { icon: 'ri-heart-pulse-line', text: '8 g de aminoácidos por dosis' },
        { icon: 'ri-focus-3-line',     text: 'Foco y concentración elevados' },
        { icon: 'ri-run-line',         text: 'Resistencia muscular mejorada' },
        { icon: 'ri-drop-line',        text: 'Óxido nítrico para mejor pump' },
      ],
      nutrition: [
        { label: 'Calorías',           value: '32.5 kcal' },
        { label: 'Cafeína anhidra',    value: '175 mg',  highlight: true },
        { label: 'Aminoácidos totales',value: '8 g' },
        { label: 'Beta-Alanina',       value: '3.2 g' },
        { label: 'Citrulina Malato',   value: '3 g' },
        { label: 'Arginina',           value: '1.5 g' },
        { label: 'Carbohidratos',      value: '2 g' },
        { label: 'Sodio',              value: '75 mg' },
      ],
      howToUse: [
        'Mezcla 1 scoop (10 g) en 200 ml de agua fría.',
        'Toma 20–30 minutos antes de tu entrenamiento.',
        'No consumir más de 1 porción en 24 horas.',
        'No recomendado para menores de 18 años, mujeres embarazadas o personas sensibles a la cafeína.',
      ],
      ingredients: 'Citrulina malato, beta-alanina, cafeína anhidra, arginina, L-tirosina, vitamina B6, vitamina B12.',
    },
    'óxido': {
      tagline: 'Pre-entrenamiento con 175 mg de cafeína pura',
      servingSize: '1 scoop · 10 g',
      servings: 30,
      benefits: [
        { icon: 'ri-flashlight-line',  text: '175 mg de cafeína anhidra' },
        { icon: 'ri-heart-pulse-line', text: '8 g de aminoácidos por dosis' },
        { icon: 'ri-focus-3-line',     text: 'Foco y concentración elevados' },
        { icon: 'ri-run-line',         text: 'Resistencia muscular mejorada' },
        { icon: 'ri-drop-line',        text: 'Óxido nítrico para mejor pump' },
      ],
      nutrition: [
        { label: 'Calorías',           value: '32.5 kcal' },
        { label: 'Cafeína anhidra',    value: '175 mg',  highlight: true },
        { label: 'Aminoácidos totales',value: '8 g' },
        { label: 'Beta-Alanina',       value: '3.2 g' },
        { label: 'Citrulina Malato',   value: '3 g' },
        { label: 'Arginina',           value: '1.5 g' },
        { label: 'Carbohidratos',      value: '2 g' },
        { label: 'Sodio',              value: '75 mg' },
      ],
      howToUse: [
        'Mezcla 1 scoop (10 g) en 200 ml de agua fría.',
        'Toma 20–30 minutos antes de tu entrenamiento.',
        'No consumir más de 1 porción en 24 horas.',
        'No recomendado para menores de 18 años, mujeres embarazadas o personas sensibles a la cafeína.',
      ],
      ingredients: 'Citrulina malato, beta-alanina, cafeína anhidra, arginina, L-tirosina, vitamina B6, vitamina B12.',
    },
    'creatina': {
      tagline: 'Creatina monohidratada 100% pura, sin rellenos',
      servingSize: '1 scoop · 5 g',
      servings: 50,
      benefits: [
        { icon: 'ri-stack-line',       text: '5 g de creatina pura por porción' },
        { icon: 'ri-bar-chart-2-line', text: 'Aumenta fuerza y potencia muscular' },
        { icon: 'ri-seedling-line',    text: 'Sin saborizantes ni rellenos' },
        { icon: 'ri-test-tube-line',   text: 'Respaldada por más de 500 estudios' },
        { icon: 'ri-recycle-line',     text: 'Mejora recuperación muscular' },
      ],
      nutrition: [
        { label: 'Calorías',              value: '0 kcal' },
        { label: 'Creatina monohidratada',value: '5 g',   highlight: true },
        { label: 'Proteína',              value: '0 g' },
        { label: 'Carbohidratos',         value: '0 g' },
        { label: 'Grasas',                value: '0 g' },
      ],
      howToUse: [
        'Mezcla 1 scoop (5 g) en 250–300 ml de agua, jugo o tu batido de proteína.',
        'Toma diariamente, preferentemente post-entrenamiento.',
        'Fase de carga opcional: 20 g/día (4 dosis de 5 g) durante 5–7 días para saturar músculos rápidamente.',
        'Mantén una hidratación adecuada durante la suplementación.',
      ],
      ingredients: 'Creatina monohidratada al 100%.',
    },
    'colágeno': {
      tagline: 'Colágeno hidrolizado premium con Vitamina C y Resveratrol',
      servingSize: '2 scoops · 10 g',
      servings: 30,
      benefits: [
        { icon: 'ri-heart-2-line',     text: '9 g de colágeno hidrolizado' },
        { icon: 'ri-sun-line',         text: 'Vitamina C 75 mg para síntesis óptima' },
        { icon: 'ri-shield-check-line',text: 'Resveratrol 30 mg antioxidante' },
        { icon: 'ri-body-scan-line',   text: 'Mejora piel, huesos y articulaciones' },
        { icon: 'ri-sparkling-line',   text: 'Vitaminas A y E incluidas' },
      ],
      nutrition: [
        { label: 'Calorías',           value: '15 kcal' },
        { label: 'Colágeno hidrolizado',value: '9 g',   highlight: true },
        { label: 'Vitamina C',         value: '75 mg' },
        { label: 'Vitamina A',         value: '2000 IU' },
        { label: 'Vitamina E',         value: '10 IU' },
        { label: 'Resveratrol',        value: '30 mg' },
        { label: 'Carbohidratos',      value: '1 g' },
        { label: 'Sodio',              value: '20 mg' },
      ],
      howToUse: [
        'Disuelve 2 scoops (10 g) en 200 ml de agua tibia o fría.',
        'Toma preferentemente en ayunas o antes de dormir para mejor absorción.',
        'Puedes mezclarlo con jugos, café o infusiones sin afectar su efectividad.',
        'Uso continuo mínimo 8–12 semanas para resultados visibles en piel y articulaciones.',
      ],
      ingredients: 'Colágeno hidrolizado bovino, ácido ascórbico (vitamina C), acetato de retinol (vitamina A), succinato de tocoferol (vitamina E), trans-resveratrol.',
    },
    'isolate': {
      tagline: 'Proteína aislada de suero de alta pureza',
      servingSize: '1 scoop · 30–35 g',
      servings: 25,
      benefits: [
        { icon: 'ri-fire-line',        text: '~30 g de proteína aislada pura' },
        { icon: 'ri-drop-line',        text: 'Mínima lactosa, ideal para intolerantes' },
        { icon: 'ri-seedling-line',    text: 'Bajo en grasas y carbohidratos' },
        { icon: 'ri-time-line',        text: 'Absorción rápida y eficiente' },
        { icon: 'ri-award-line',       text: 'Pureza de proteína superior al 90%' },
      ],
      nutrition: [
        { label: 'Calorías',           value: '~120 kcal' },
        { label: 'Proteína aislada',   value: '~30 g',  highlight: true },
        { label: 'Carbohidratos',      value: '<1 g' },
        { label: 'Grasas totales',     value: '<1 g' },
        { label: 'Lactosa',            value: '<0.5 g' },
        { label: 'Sodio',              value: '80 mg' },
      ],
      howToUse: [
        'Mezcla 1 scoop en 200–250 ml de agua fría o leche.',
        'Ideal como primera toma del día o dentro de los 30 minutos post-entrenamiento.',
        'Por su alta pureza, es la opción preferida durante corte o definición muscular.',
        'Agita bien en coctelera para una textura completamente suave.',
      ],
      ingredients: 'Aislado de proteína de suero de leche (WPI), saborizante natural, sucralosa, lecitina de girasol.',
    },
  };

  function getEnrich(title) {
    var t = (title || '').toLowerCase();
    var keys = Object.keys(ENRICH);
    for (var i = 0; i < keys.length; i++) {
      if (t.indexOf(keys[i]) !== -1) return ENRICH[keys[i]];
    }
    return null;
  }

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
     PRODUCT DETAIL
  ══════════════════════════════════════ */
  var _pdp = {
    product: null,
    images: [],
    imgIdx: 0,
    variants: [],
    selectedVariant: null,
    selectedOptions: {},
    qty: 1,
  };

  async function openProductDetail(productId) {
    var modal = document.getElementById('bstPdpModal');
    if (!modal) return;

    // Close any open drawers / modals first
    document.querySelectorAll('.bst-drawer, .bst-modal').forEach(function (el) { el.classList.remove('is-open'); });
    var ov = document.getElementById('bstOverlay');
    if (ov) ov.classList.remove('is-visible');

    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    // Reset to loading skeleton
    var nameEl = document.getElementById('bstPdpName');
    var tagEl  = document.getElementById('bstPdpTagline');
    var mainImg = document.getElementById('bstPdpMainImg');
    if (nameEl) nameEl.textContent = '';
    if (tagEl)  tagEl.textContent = 'Cargando…';
    if (mainImg) { mainImg.src = ''; mainImg.classList.add('is-loading'); }
    var el;
    el = document.getElementById('bstPdpThumbs');   if (el) el.innerHTML = '';
    el = document.getElementById('bstPdpOptions');  if (el) el.innerHTML = '';
    el = document.getElementById('bstPdpBenefits'); if (el) el.innerHTML = '';
    el = document.getElementById('bstTabDesc');     if (el) el.innerHTML = '<div class="bst-pdp-skel-block"></div><div class="bst-pdp-skel-block bst-pdp-skel-block--sm"></div>';
    el = document.getElementById('bstTabNutri');    if (el) el.innerHTML = '';
    el = document.getElementById('bstTabUso');      if (el) el.innerHTML = '';
    // Reset active tab
    document.querySelectorAll('.bst-pdp-tab').forEach(function(t, i){ t.classList.toggle('is-active', i === 0); });
    document.querySelectorAll('.bst-pdp-tab-panel').forEach(function(p, i){ p.classList.toggle('is-active', i === 0); });

    try {
      var d = await gql([
        'query($id:ID!){product(id:$id){',
        '  id title handle descriptionHtml',
        '  images(first:8){edges{node{url altText}}}',
        '  priceRange{minVariantPrice{amount currencyCode}maxVariantPrice{amount currencyCode}}',
        '  options{name values}',
        '  variants(first:30){edges{node{',
        '    id title availableForSale',
        '    price{amount currencyCode}',
        '    compareAtPrice{amount currencyCode}',
        '    selectedOptions{name value}',
        '  }}}',
        '}}',
      ].join(''), { id: productId });

      var product = d.product;
      if (!product) { closePdp(); showToast('Producto no encontrado', 'error'); return; }
      renderProductDetail(product, getEnrich(product.title));
    } catch (e) {
      console.error('[BST pdp]', e);
      closePdp();
      showToast('Error al cargar el producto', 'error');
    }
  }

  function closePdp() {
    var modal = document.getElementById('bstPdpModal');
    if (modal) modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function renderProductDetail(product, enrich) {
    _pdp.product = product;
    _pdp.images   = product.images.edges.map(function (e) { return e.node; });
    _pdp.imgIdx   = 0;
    _pdp.variants = product.variants.edges.map(function (e) { return e.node; });
    _pdp.qty      = 1;

    // Pick first available variant
    _pdp.selectedVariant = null;
    for (var i = 0; i < _pdp.variants.length; i++) {
      if (_pdp.variants[i].availableForSale) { _pdp.selectedVariant = _pdp.variants[i]; break; }
    }
    if (!_pdp.selectedVariant) _pdp.selectedVariant = _pdp.variants[0];

    // Build selected options map from variant
    _pdp.selectedOptions = {};
    if (_pdp.selectedVariant) {
      _pdp.selectedVariant.selectedOptions.forEach(function (o) {
        _pdp.selectedOptions[o.name] = o.value;
      });
    }

    // Title + tagline
    var nameEl = document.getElementById('bstPdpName');
    var tagEl  = document.getElementById('bstPdpTagline');
    var srvEl  = document.getElementById('bstPdpServing');
    if (nameEl) nameEl.textContent = product.title;
    if (tagEl)  tagEl.textContent  = enrich ? enrich.tagline : '';
    if (srvEl) {
      if (enrich) {
        srvEl.textContent = 'Porción: ' + enrich.servingSize + ' · ' + enrich.servings + ' porciones';
        srvEl.style.display = '';
      } else {
        srvEl.style.display = 'none';
      }
    }

    // Gallery
    updatePdpGallery();
    renderPdpThumbs();

    // Price
    updatePdpPrice();

    // Options
    renderPdpOptions(product.options);

    // Qty
    _pdp.qty = 1;
    var qtyEl = document.getElementById('bstPdpQtyVal');
    if (qtyEl) qtyEl.textContent = '1';

    // Buttons
    updatePdpAtcState();
    updatePdpWlState();

    // Content tabs
    renderPdpTabContent(product, enrich);

    // Benefits sidebar
    renderPdpBenefits(enrich);

    // Scroll panel to top
    var panel = document.querySelector('.bst-pdp-panel');
    if (panel) panel.scrollTop = 0;
  }

  /* ── Gallery ── */
  function updatePdpGallery() {
    var mainImg = document.getElementById('bstPdpMainImg');
    if (!mainImg) return;
    var imgs = _pdp.images;
    if (!imgs.length) { mainImg.src = ''; return; }
    var node = imgs[_pdp.imgIdx];
    mainImg.src = node.url;
    mainImg.alt = node.altText || (_pdp.product ? _pdp.product.title : '');
    mainImg.classList.remove('is-loading');

    document.querySelectorAll('.bst-pdp-thumb').forEach(function (th, idx) {
      th.classList.toggle('is-active', idx === _pdp.imgIdx);
    });

    var prev = document.getElementById('bstPdpPrev');
    var next = document.getElementById('bstPdpNext');
    var show = imgs.length > 1;
    if (prev) prev.style.display = show ? '' : 'none';
    if (next) next.style.display = show ? '' : 'none';
  }

  function renderPdpThumbs() {
    var thumbsEl = document.getElementById('bstPdpThumbs');
    if (!thumbsEl) return;
    var imgs = _pdp.images;
    if (imgs.length <= 1) { thumbsEl.innerHTML = ''; return; }
    thumbsEl.innerHTML = imgs.map(function (node, idx) {
      return '<button class="bst-pdp-thumb' + (idx === 0 ? ' is-active' : '') +
        '" data-thumb-idx="' + idx + '"><img src="' + node.url + '" alt=""></button>';
    }).join('');
  }

  /* ── Price ── */
  function updatePdpPrice() {
    var priceEl   = document.getElementById('bstPdpPrice');
    var compareEl = document.getElementById('bstPdpCompare');
    var v = _pdp.selectedVariant;
    if (!v || !priceEl) return;
    priceEl.textContent = fmt(v.price.amount, v.price.currencyCode);
    if (compareEl) {
      if (v.compareAtPrice && parseFloat(v.compareAtPrice.amount) > parseFloat(v.price.amount)) {
        compareEl.textContent = fmt(v.compareAtPrice.amount, v.compareAtPrice.currencyCode);
        compareEl.style.display = '';
      } else {
        compareEl.textContent = '';
        compareEl.style.display = 'none';
      }
    }
  }

  /* ── Options ── */
  function renderPdpOptions(options) {
    var el = document.getElementById('bstPdpOptions');
    if (!el) return;
    var realOpts = options.filter(function (o) {
      return !(o.values.length === 1 && (o.values[0] === 'Default Title' || o.values[0] === 'Default'));
    });
    if (!realOpts.length) { el.innerHTML = ''; return; }

    el.innerHTML = realOpts.map(function (opt) {
      var current = _pdp.selectedOptions[opt.name] || opt.values[0];
      return [
        '<div class="bst-pdp-opt-group">',
        '<p class="bst-pdp-opt-label">' + opt.name + ': <strong>' + current + '</strong></p>',
        '<div class="bst-pdp-opt-btns">',
        opt.values.map(function (val) {
          var isActive = current === val;
          var available = _pdp.variants.some(function (v) {
            return v.availableForSale && v.selectedOptions.some(function (o) {
              return o.name === opt.name && o.value === val;
            });
          });
          return '<button class="bst-pdp-opt-btn' + (isActive ? ' is-active' : '') + (available ? '' : ' is-oos') + '"' +
            ' data-opt-name="' + opt.name + '" data-opt-val="' + val + '">' + val + '</button>';
        }).join(''),
        '</div></div>',
      ].join('');
    }).join('');
  }

  function findVariantByOptions() {
    return _pdp.variants.find(function (v) {
      return v.selectedOptions.every(function (o) {
        return _pdp.selectedOptions[o.name] === o.value;
      });
    }) || _pdp.variants[0];
  }

  /* ── ATC state ── */
  function updatePdpAtcState() {
    var btn = document.getElementById('bstPdpAtc');
    if (!btn) return;
    var avail = _pdp.selectedVariant && _pdp.selectedVariant.availableForSale;
    btn.disabled = !avail;
    btn.classList.toggle('is-oos', !avail);
    var span = btn.querySelector('span');
    if (span) span.textContent = avail ? 'Agregar al carrito' : 'Agotado';
  }

  /* ── Wishlist state ── */
  function updatePdpWlState() {
    var btn = document.getElementById('bstPdpWl');
    if (!btn || !_pdp.selectedVariant) return;
    var inWl = window.bstIsInWishlist(_pdp.selectedVariant.id);
    btn.classList.toggle('is-active', inWl);
    var icon = btn.querySelector('i');
    if (icon) icon.className = inWl ? 'ri-heart-fill' : 'ri-heart-line';
  }

  /* ── Tab content ── */
  function renderPdpTabContent(product, enrich) {
    // Descripción
    var descEl = document.getElementById('bstTabDesc');
    if (descEl) {
      var descHtml = product.descriptionHtml || '';
      if (!descHtml.trim() && enrich && enrich.ingredients) {
        descHtml = '<p><strong>Ingredientes:</strong> ' + enrich.ingredients + '</p>';
      }
      descEl.innerHTML = '<div class="bst-pdp-desc">' + (descHtml || '<p>Consulta más detalles en tienda.</p>') + '</div>';
    }

    // Nutrición
    var nutriEl = document.getElementById('bstTabNutri');
    if (nutriEl) {
      if (enrich && enrich.nutrition) {
        var rows = enrich.nutrition.map(function (row) {
          return '<tr' + (row.highlight ? ' class="is-highlight"' : '') + '>' +
            '<td>' + row.label + '</td><td>' + row.value + '</td></tr>';
        }).join('');
        nutriEl.innerHTML = [
          '<div class="bst-nutri-wrap">',
          '<div class="bst-nutri-head">',
          '<p class="bst-nutri-title">Información Nutrimental</p>',
          enrich.servingSize
            ? '<p class="bst-nutri-serving">Tamaño de porción: ' + enrich.servingSize + ' · ' + enrich.servings + ' porciones por envase</p>'
            : '',
          '</div>',
          '<table class="bst-nutri-table"><tbody>' + rows + '</tbody></table>',
          '<p class="bst-nutri-note">Los valores diarios se basan en una dieta de 2,000 kcal.</p>',
          '</div>',
        ].join('');
      } else {
        nutriEl.innerHTML = '<p class="bst-pdp-no-data">Información nutrimental próximamente.</p>';
      }
    }

    // Cómo usar
    var usoEl = document.getElementById('bstTabUso');
    if (usoEl) {
      if (enrich && enrich.howToUse) {
        var steps = enrich.howToUse.map(function (step, i) {
          return '<li><span class="bst-uso-num">' + (i + 1) + '</span><p>' + step + '</p></li>';
        }).join('');
        usoEl.innerHTML = '<ol class="bst-uso-list">' + steps + '</ol>';
      } else {
        usoEl.innerHTML = '<p class="bst-pdp-no-data">Instrucciones de uso próximamente.</p>';
      }
    }
  }

  /* ── Benefits ── */
  function renderPdpBenefits(enrich) {
    var el = document.getElementById('bstPdpBenefits');
    if (!el) return;
    if (!enrich || !enrich.benefits || !enrich.benefits.length) { el.innerHTML = ''; return; }
    el.innerHTML = enrich.benefits.map(function (b) {
      return '<div class="bst-benefit-row"><i class="' + b.icon + '"></i><span>' + b.text + '</span></div>';
    }).join('');
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
    closePdp();
  }

  /* ── Cart render ── */
  function renderCartLines() {
    var list        = document.getElementById('bstCartLines');
    var footer      = document.getElementById('bstCartFooter');
    var total       = document.getElementById('bstCartTotal');
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
  function injectRemixicon() {
    if (document.querySelector('link[href*="remixicon"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css';
    document.head.appendChild(link);
  }

  function injectHTML() {
    injectRemixicon();

    var el = document.createElement('div');
    el.innerHTML = [
      /* Overlay */
      '<div id="bstOverlay" class="bst-overlay"></div>',
      /* Toast */
      '<div id="bstToast" class="bst-toast"></div>',

      /* Cart drawer */
      '<div id="bstCartDrawer" class="bst-drawer bst-drawer--right" role="dialog" aria-label="Carrito">',
        '<div class="bst-drawer-head"><h3>Carrito</h3><button class="bst-close" data-close="all"><i class="ri-close-line"></i></button></div>',
        '<div class="bst-drawer-body"><div id="bstCartLines"></div></div>',
        '<div class="bst-drawer-footer" id="bstCartFooter" style="display:none">',
          '<div class="bst-cart-total-row"><span>Total</span><span id="bstCartTotal"></span></div>',
          '<a id="bstCheckoutBtn" class="bst-btn-primary" href="#" target="_blank" rel="noopener">Ir al checkout →</a>',
        '</div>',
      '</div>',

      /* Wishlist drawer */
      '<div id="bstWlDrawer" class="bst-drawer bst-drawer--right" role="dialog" aria-label="Lista de deseos">',
        '<div class="bst-drawer-head"><h3>Lista de deseos</h3><button class="bst-close" data-close="all"><i class="ri-close-line"></i></button></div>',
        '<div class="bst-drawer-body"><div id="bstWlItems"></div></div>',
      '</div>',

      /* Account drawer */
      '<div id="bstAccountDrawer" class="bst-drawer bst-drawer--right" role="dialog" aria-label="Mi cuenta">',
        '<div class="bst-drawer-head"><h3>Mi cuenta</h3><button class="bst-close" data-close="all"><i class="ri-close-line"></i></button></div>',
        '<div class="bst-drawer-body"><div id="bstAccountContent"></div></div>',
      '</div>',

      /* Auth modal */
      '<div id="bstAuthModal" class="bst-modal" role="dialog" aria-label="Iniciar sesión">',
        '<div class="bst-modal-box">',
          '<button class="bst-close" data-close="all"><i class="ri-close-line"></i></button>',
          '<form id="bstLoginForm">',
            '<h3 class="bst-modal-title">Iniciar sesión</h3>',
            '<div id="bstLoginErr" class="bst-form-err"></div>',
            '<label>Email<input type="email" name="email" autocomplete="email" required></label>',
            '<label>Contraseña<input type="password" name="password" autocomplete="current-password" required></label>',
            '<button type="submit" class="bst-btn-primary">Entrar</button>',
            '<p class="bst-form-link">¿No tienes cuenta? <a id="bstToReg" href="#">Regístrate</a></p>',
          '</form>',
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

      /* Product detail modal */
      '<div id="bstPdpModal" class="bst-pdp" role="dialog" aria-modal="true" aria-label="Detalle de producto">',
        '<div class="bst-pdp-backdrop" data-close="all"></div>',
        '<div class="bst-pdp-panel">',
          '<button class="bst-pdp-close-btn" data-close="all" aria-label="Cerrar"><i class="ri-close-line"></i></button>',
          '<div class="bst-pdp-grid">',

            /* Gallery */
            '<div class="bst-pdp-gallery">',
              '<div class="bst-pdp-main-wrap">',
                '<img id="bstPdpMainImg" src="" alt="" class="bst-pdp-main-img">',
                '<button class="bst-pdp-arr bst-pdp-arr--prev" id="bstPdpPrev"><i class="ri-arrow-left-s-line"></i></button>',
                '<button class="bst-pdp-arr bst-pdp-arr--next" id="bstPdpNext"><i class="ri-arrow-right-s-line"></i></button>',
              '</div>',
              '<div class="bst-pdp-thumbs" id="bstPdpThumbs"></div>',
            '</div>',

            /* Info */
            '<div class="bst-pdp-info">',
              '<p class="bst-pdp-tagline" id="bstPdpTagline"></p>',
              '<h2 class="bst-pdp-name" id="bstPdpName"></h2>',
              '<p class="bst-pdp-serving" id="bstPdpServing"></p>',
              '<div class="bst-pdp-price-row">',
                '<span class="bst-pdp-price" id="bstPdpPrice"></span>',
                '<span class="bst-pdp-compare" id="bstPdpCompare"></span>',
              '</div>',
              '<div id="bstPdpOptions" class="bst-pdp-options-wrap"></div>',
              '<div class="bst-pdp-actions">',
                '<div class="bst-pdp-qty-wrap">',
                  '<button class="bst-pdp-qty-btn" id="bstPdpQtyDec"><i class="ri-subtract-line"></i></button>',
                  '<span class="bst-pdp-qty-val" id="bstPdpQtyVal">1</span>',
                  '<button class="bst-pdp-qty-btn" id="bstPdpQtyInc"><i class="ri-add-line"></i></button>',
                '</div>',
                '<button class="bst-pdp-atc" id="bstPdpAtc">',
                  '<i class="ri-shopping-cart-2-line"></i><span>Agregar al carrito</span>',
                '</button>',
                '<button class="bst-pdp-wl" id="bstPdpWl" aria-label="Lista de deseos"><i class="ri-heart-line"></i></button>',
              '</div>',
              '<div class="bst-pdp-trust">',
                '<div class="bst-trust-item"><i class="ri-truck-line"></i><span>Envío a todo México</span></div>',
                '<div class="bst-trust-item"><i class="ri-shield-check-line"></i><span>Garantía de calidad</span></div>',
                '<div class="bst-trust-item"><i class="ri-secure-payment-line"></i><span>Pago 100% seguro</span></div>',
              '</div>',
              '<div id="bstPdpBenefits" class="bst-pdp-benefits-list"></div>',
              '<div class="bst-pdp-tabs-wrap">',
                '<div class="bst-pdp-tab-nav">',
                  '<button class="bst-pdp-tab is-active" data-pdp-tab="desc">Descripción</button>',
                  '<button class="bst-pdp-tab" data-pdp-tab="nutri">Nutrición</button>',
                  '<button class="bst-pdp-tab" data-pdp-tab="uso">Cómo usar</button>',
                '</div>',
                '<div class="bst-pdp-tab-panels">',
                  '<div id="bstTabDesc" class="bst-pdp-tab-panel is-active"></div>',
                  '<div id="bstTabNutri" class="bst-pdp-tab-panel"></div>',
                  '<div id="bstTabUso" class="bst-pdp-tab-panel"></div>',
                '</div>',
              '</div>',
            '</div>',

          '</div>',
        '</div>',
      '</div>',
    ].join('');

    while (el.firstChild) document.body.appendChild(el.firstChild);
  }

  /* ── Inject nav icons (Remixicon) ── */
  function injectNavIcons() {
    var nav = document.getElementById('siteNav');
    if (!nav || nav.querySelector('.bst-nav-icons')) return;
    var iconsEl = document.createElement('div');
    iconsEl.className = 'bst-nav-icons';
    iconsEl.innerHTML = [
      '<button class="bst-nav-icon-btn" id="bstNavWl" aria-label="Lista de deseos">',
        '<i class="ri-heart-line"></i>',
        '<span class="bst-wl-badge hidden">0</span>',
      '</button>',
      '<button class="bst-nav-icon-btn" id="bstNavCart" aria-label="Carrito">',
        '<i class="ri-shopping-cart-2-line"></i>',
        '<span class="bst-cart-badge hidden">0</span>',
      '</button>',
      '<button class="bst-nav-icon-btn bst-user-icon" id="bstNavUser" aria-label="Mi cuenta">',
        '<i class="ri-user-line"></i>',
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

      /* Product card → open detail */
      var card = t.closest('.prod-card[data-product-id]');
      if (card && !t.closest('.prod-card-atc') && !t.closest('.prod-var-select') && !t.closest('.prod-wl-btn')) {
        openProductDetail(card.dataset.productId);
        return;
      }

      /* PDP gallery prev/next */
      if (t.closest('#bstPdpPrev')) {
        _pdp.imgIdx = (_pdp.imgIdx - 1 + _pdp.images.length) % _pdp.images.length;
        updatePdpGallery(); return;
      }
      if (t.closest('#bstPdpNext')) {
        _pdp.imgIdx = (_pdp.imgIdx + 1) % _pdp.images.length;
        updatePdpGallery(); return;
      }

      /* PDP thumbnail */
      var thumb = t.closest('[data-thumb-idx]');
      if (thumb) {
        _pdp.imgIdx = parseInt(thumb.dataset.thumbIdx, 10);
        updatePdpGallery(); return;
      }

      /* PDP option button */
      var optBtn = t.closest('[data-opt-name]');
      if (optBtn) {
        _pdp.selectedOptions[optBtn.dataset.optName] = optBtn.dataset.optVal;
        _pdp.selectedVariant = findVariantByOptions();
        renderPdpOptions(_pdp.product.options);
        updatePdpPrice();
        updatePdpAtcState();
        updatePdpWlState(); return;
      }

      /* PDP qty */
      if (t.closest('#bstPdpQtyDec')) {
        _pdp.qty = Math.max(1, _pdp.qty - 1);
        var qtyEl = document.getElementById('bstPdpQtyVal');
        if (qtyEl) qtyEl.textContent = _pdp.qty; return;
      }
      if (t.closest('#bstPdpQtyInc')) {
        _pdp.qty = Math.min(10, _pdp.qty + 1);
        var qtyEl2 = document.getElementById('bstPdpQtyVal');
        if (qtyEl2) qtyEl2.textContent = _pdp.qty; return;
      }

      /* PDP add to cart */
      if (t.closest('#bstPdpAtc')) {
        if (_pdp.selectedVariant && _pdp.selectedVariant.availableForSale) {
          await window.bstAddToCart(_pdp.selectedVariant.id, _pdp.qty);
        }
        return;
      }

      /* PDP wishlist */
      if (t.closest('#bstPdpWl')) {
        if (_pdp.selectedVariant && _pdp.product) {
          var v = _pdp.selectedVariant;
          var img = _pdp.images.length ? _pdp.images[0].url : '';
          window.bstToggleWishlist(v.id, _pdp.product.title + (v.title !== 'Default Title' ? ' — ' + v.title : ''), img, fmt(v.price.amount, v.price.currencyCode));
          updatePdpWlState();
        }
        return;
      }

      /* PDP tab switch */
      var tabBtn = t.closest('[data-pdp-tab]');
      if (tabBtn) {
        var tabKey = tabBtn.dataset.pdpTab;
        var panelMap = { desc: 'bstTabDesc', nutri: 'bstTabNutri', uso: 'bstTabUso' };
        document.querySelectorAll('.bst-pdp-tab').forEach(function (b) { b.classList.toggle('is-active', b.dataset.pdpTab === tabKey); });
        document.querySelectorAll('.bst-pdp-tab-panel').forEach(function (p) { p.classList.toggle('is-active', p.id === panelMap[tabKey]); });
        return;
      }

      /* Cart qty */
      var qtyBtn = t.closest('.bst-qty-btn');
      if (qtyBtn && _cart) {
        var lineId = qtyBtn.dataset.line;
        var qty    = parseInt(qtyBtn.dataset.qty, 10);
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
      if (t.id === 'bstToReg')   { switchAuth('reg');   return; }
      if (t.id === 'bstToLogin') { switchAuth('login'); return; }
    });

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
        var img  = p.featuredImage ? p.featuredImage.url : '';
        var alt  = p.featuredImage ? (p.featuredImage.altText || p.title) : p.title;
        var vid  = firstAvail ? firstAvail.id : (firstVar ? firstVar.id : '');
        var priceFmt = 'Desde ' + fmt(price.amount, price.currencyCode);
        var hasMultiple = variants.length > 1;

        var variantSelect = hasMultiple ? [
          '<select class="prod-var-select" data-product="' + p.id + '">',
          variants.map(function (v) {
            return '<option value="' + v.id + '"' + (!v.availableForSale ? ' disabled' : '') + '>'
              + v.title + (v.availableForSale ? '' : ' (agotado)') + '</option>';
          }).join(''),
          '</select>',
        ].join('') : '';

        return [
          '<div class="prod-card reveal" data-product-id="' + p.id + '">',
            '<div class="prod-card-img-wrap">',
              img ? '<img src="' + img + '" alt="' + alt + '" loading="lazy">' : '',
              '<div class="prod-card-overlay">',
                '<span class="prod-card-view"><i class="ri-eye-line"></i> Ver detalles</span>',
              '</div>',
              vid ? [
                '<button class="prod-wl-btn" data-wl-id="' + vid + '"',
                ' onclick="bstToggleWishlist(\'' + vid + '\',\'' + p.title.replace(/'/g, "\\'") + '\',\'' + img + '\',\'' + priceFmt + '\')"',
                ' aria-label="Lista de deseos">',
                '<i class="ri-heart-line"></i>',
                '</button>',
              ].join('') : '',
            '</div>',
            '<p class="prod-card-name">' + p.title + '</p>',
            '<p class="prod-card-price">' + priceFmt + '</p>',
            variantSelect,
            firstAvail
              ? '<button class="prod-card-atc" data-vid="' + firstAvail.id + '" onclick="bstAddToCart(this.dataset.vid,1)"><i class="ri-shopping-cart-line"></i> Agregar</button>'
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
        var c = sel.closest('.prod-card');
        var atcBtn = c && c.querySelector('.prod-card-atc');
        var wlBtn  = c && c.querySelector('.prod-wl-btn');
        if (atcBtn) atcBtn.dataset.vid = sel.value;
        if (wlBtn)  wlBtn.dataset.wlId = sel.value;
      });

    } catch (e) {
      console.warn('[BST] Products load error:', e);
      grid.innerHTML = '';
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

    try {
      await getCart();
      updateCartBadge();
    } catch (e) {
      console.warn('[BST] Cart init:', e);
    }

    if (document.querySelector('.products-grid')) {
      loadTiendaProducts();
    }
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
